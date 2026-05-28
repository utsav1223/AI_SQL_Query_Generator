const User = require("../models/User");
const SchemaModel = require("../models/Schema");
const Query = require("../models/Query");
const AppError = require("../utils/AppError");
const { callGemini } = require("../utils/geminiClient");
const {
  assertUsageAvailable,
  incrementUsage
} = require("../utils/usageManager");
const { createSecurityEvent } = require("../utils/securityMonitor");

const GEMINI_MAX_OUTPUT_TOKENS = 1024;

const DIALECT_LABELS = {
  standard: "Standard SQL",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  sqlserver: "SQL Server",
  oracle: "Oracle"
};

let sqlFormatterLoaded = false;
let sqlFormatterFn = null;

const SYSTEM_PROMPTS = {
  generate: `
You are a principal SQL engineer focused on correctness.
Convert the user request into executable SQL using only the provided schema context.
Return strict JSON only:
{"sql":"<valid SQL query>"}
Rules:
- Treat provided schema context as authoritative.
- Use only tables/columns that exist in schema context.
- Never invent identifiers. Never guess missing tables/columns.
- Prefer explicit JOIN conditions and fully-qualified columns in multi-table queries.
- Preserve requested filters, grouping, ordering, limits, and aggregates exactly.
- Enforce all explicit request constraints exactly (for example: alias names, EXISTS/subquery requirements, unresolved conditions, date windows, and priority filters).
- Return one complete SQL statement terminated with a semicolon.
- If the request cannot be answered from schema context, return {"sql":""}.
- Do not include markdown, comments, or prose outside JSON.
`,
  optimize: `
You are a senior SQL performance specialist.
Rewrite SQL for better performance while preserving exact business semantics.
Return strict JSON only:
{"sql":"<optimized SQL>"}
Rules:
- Keep output columns, aliases, row-granularity, and business logic equivalent.
- Prefer sargable predicates and cleaner joins.
- Avoid changing meaning of NULL handling and join types.
- Do not include markdown, comments, or prose outside JSON.
`,
  validate: `
You are a strict SQL validator and fixer.
Repair syntax and obvious logical SQL issues while preserving intent.
Return strict JSON only:
{"sql":"<corrected SQL>"}
Rules:
- Keep query behavior equivalent unless a behavioral fix is required.
- If SQL is already valid, return the same logic with clean SQL structure.
- Do not include markdown, comments, or prose outside JSON.
`,
  explain: `
You are a SQL educator for developers.
Explain SQL with high technical accuracy and concise clarity.
Return strict JSON only with this shape:
{
  "summary":"...",
  "steps":["..."],
  "outputColumns":["..."],
  "performanceNotes":["..."],
  "risks":["..."]
}
Rules:
- Keep each item concise and technical.
- Do not include markdown, comments, or prose outside JSON.
`
};

const SQL_REVIEW_SYSTEM_PROMPT = `
You are a SQL correctness reviewer.
You receive schema context, user request, and candidate SQL.
Return strict JSON only:
{"sql":"<final corrected SQL>"}
Rules:
- Candidate SQL must use only identifiers from schema context.
- Keep user intent exactly.
- If candidate is partially wrong, fix it.
- If request cannot be satisfied from schema context, return {"sql":""}.
- No markdown, no prose.
`;

const SQL_COMPLETION_SYSTEM_PROMPT = `
You complete truncated SQL safely.
Given schema context, user request, and partial SQL, return one complete SQL query.
Return strict JSON only:
{"sql":"<complete SQL query>"}
Rules:
- Use only identifiers from schema context.
- Preserve user request exactly.
- Output one complete executable SQL statement.
- Do not include markdown or explanations.
`;

const REPAIR_SYSTEM_PROMPTS = {
  sql: `
You convert mixed text into strict JSON.
Return JSON only with this exact shape:
{"sql":"<SQL text>"}
If SQL is not found, return:
{"sql":""}
No markdown or extra keys.
`,
  explain: `
You convert mixed text into strict JSON.
Return JSON only with this exact shape:
{
  "summary":"...",
  "steps":["..."],
  "outputColumns":["..."],
  "performanceNotes":["..."],
  "risks":["..."]
}
No markdown or extra keys.
`
};

const getSqlFormatter = () => {
  if (sqlFormatterLoaded) {
    return sqlFormatterFn;
  }

  sqlFormatterLoaded = true;

  try {
    const { format } = require("sql-formatter");
    sqlFormatterFn = format;
  } catch (_) {
    sqlFormatterFn = null;
  }

  return sqlFormatterFn;
};

const stripCodeFences = (text = "") => {
  return text
    .replace(/```json/gi, "")
    .replace(/```sql/gi, "")
    .replace(/```/g, "")
    .trim();
};

const isLikelyIncompleteSql = (sqlText = "") => {
  const text = String(sqlText || "").trim();

  if (!text || !text.endsWith(";")) {
    return true;
  }

  const incompleteEndingPattern =
    /(SELECT|FROM|JOIN|LEFT|RIGHT|INNER|OUTER|ON|WHERE|AND|OR|GROUP|ORDER|HAVING|LIMIT|OFFSET|AS|,|=|>|<|\+|-|\*|\/|_)$/i;

  if (incompleteEndingPattern.test(text.replace(/;$/, "").trim())) {
    return true;
  }

  const openParenthesesCount = (text.match(/\(/g) || []).length;
  const closeParenthesesCount = (text.match(/\)/g) || []).length;

  return openParenthesesCount !== closeParenthesesCount;
};

const safeJsonParse = (text = "") => {
  const cleaned = stripCodeFences(text);

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Ignore and try a smaller JSON block.
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (_) {
    return null;
  }
};

const formatSqlSafely = (sqlText = "") => {
  const cleaned = stripCodeFences(sqlText);
  if (!cleaned) {
    return "";
  }

  const format = getSqlFormatter();
  if (!format) {
    return cleaned;
  }

  try {
    return format(cleaned, {
      language: "sql",
      keywordCase: "upper",
      tabWidth: 2
    });
  } catch (_) {
    return cleaned;
  }
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
};

const normalizeDialect = (dialect) => {
  const normalized = String(dialect || "standard").trim().toLowerCase();
  return DIALECT_LABELS[normalized] ? normalized : "standard";
};

const normalizeExplainPayload = (parsed, fallbackText) => {
  if (!parsed || typeof parsed !== "object") {
    return {
      summary: stripCodeFences(fallbackText) || "Explanation unavailable.",
      steps: [],
      outputColumns: [],
      performanceNotes: [],
      risks: []
    };
  }

  return {
    summary:
      typeof parsed.summary === "string" && parsed.summary.trim()
        ? parsed.summary.trim()
        : "Explanation unavailable.",
    steps: toArray(parsed.steps),
    outputColumns: toArray(parsed.outputColumns),
    performanceNotes: toArray(parsed.performanceNotes),
    risks: toArray(parsed.risks)
  };
};

const buildExplainOutput = (payload) => {
  const stepText =
    payload.steps.length > 0
      ? payload.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")
      : "1. No step-by-step execution details were returned.";

  const outputColumnsText =
    payload.outputColumns.length > 0
      ? payload.outputColumns.map((item) => `- ${item}`).join("\n")
      : "- Not specified.";

  const performanceText =
    payload.performanceNotes.length > 0
      ? payload.performanceNotes.map((item) => `- ${item}`).join("\n")
      : "- No specific performance notes.";

  const risksText =
    payload.risks.length > 0
      ? payload.risks.map((item) => `- ${item}`).join("\n")
      : "- No major risks identified.";

  return [
    "SUMMARY",
    payload.summary,
    "",
    "EXECUTION STEPS",
    stepText,
    "",
    "OUTPUT COLUMNS",
    outputColumnsText,
    "",
    "PERFORMANCE NOTES",
    performanceText,
    "",
    "RISKS",
    risksText
  ].join("\n");
};

const buildUserPrompt = ({ mode, schemaText, hasSchema, prompt, sql, dialect }) => {
  const dialectLabel = DIALECT_LABELS[normalizeDialect(dialect)];
  const dialectBlock = `
Target SQL Dialect:
${dialectLabel}

Use syntax, quoting, date functions, and pagination patterns that fit this dialect.
`;
  const schemaBlock = hasSchema
    ? `
Schema Context (authoritative):
<<<SCHEMA_START>>>
${schemaText}
<<<SCHEMA_END>>>

${dialectBlock}
`
    : `
Schema Context:
No schema provided by user.

${dialectBlock}
`;

  if (mode === "generate") {
    return `
${schemaBlock}

User Request:
${prompt}

Return strict JSON only:
{"sql":"<best SQL query for this request>"}
`;
  }

  if (mode === "optimize") {
    return `
${schemaBlock}

Input SQL:
${sql}

Return strict JSON only:
{"sql":"<semantically equivalent but faster SQL>"}
`;
  }

  if (mode === "validate") {
    return `
${schemaBlock}

Input SQL:
${sql}

Return strict JSON only:
{"sql":"<corrected SQL>"}
`;
  }

  if (mode === "explain") {
    return `
${schemaBlock}

Input SQL:
${sql}

Return strict JSON only with fields:
summary, steps, outputColumns, performanceNotes, risks.
`;
  }

  return "";
};

const parseJsonWithRepair = async ({ mode, rawText }) => {
  const parsed = safeJsonParse(rawText);
  if (parsed) {
    return parsed;
  }

  const repairMode = mode === "explain" ? "explain" : "sql";
  const repairedText = await callGemini({
    systemInstruction: REPAIR_SYSTEM_PROMPTS[repairMode],
    userPrompt: `Convert this content to strict JSON only:\n\n${stripCodeFences(rawText)}`,
    temperature: 0,
    maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
    responseMimeType: "application/json"
  });

  return safeJsonParse(repairedText);
};

const reviewGeneratedSql = async ({ schemaText, prompt, candidateSql }) => {
  try {
    const reviewPrompt = `
Schema Context (authoritative):
<<<SCHEMA_START>>>
${schemaText}
<<<SCHEMA_END>>>

User Request:
${prompt}

Candidate SQL:
${candidateSql}

Return strict JSON only:
{"sql":"<final corrected SQL>"}
`;

    const reviewResult = await callGemini({
      systemInstruction: SQL_REVIEW_SYSTEM_PROMPT,
      userPrompt: reviewPrompt,
      temperature: 0,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json"
    });

    if (!reviewResult) {
      return candidateSql;
    }

    const parsed = await parseJsonWithRepair({
      mode: "generate",
      rawText: reviewResult
    });

    if (!parsed || typeof parsed.sql !== "string") {
      return candidateSql;
    }

    return stripCodeFences(parsed.sql);
  } catch (_) {
    return candidateSql;
  }
};

const completeGeneratedSqlIfNeeded = async ({
  schemaText,
  prompt,
  candidateSql
}) => {
  let currentSql = stripCodeFences(candidateSql);
  const maxAttempts = 3;

  if (!currentSql) {
    return currentSql;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (!isLikelyIncompleteSql(currentSql)) {
      return currentSql;
    }

    try {
      const completionPrompt = `
Schema Context (authoritative):
<<<SCHEMA_START>>>
${schemaText}
<<<SCHEMA_END>>>

User Request:
${prompt}

Partial SQL (possibly truncated):
${currentSql}

Return strict JSON only:
{"sql":"<complete SQL query>"}
`;

      const completionResponse = await callGemini({
        systemInstruction: SQL_COMPLETION_SYSTEM_PROMPT,
        userPrompt: completionPrompt,
        temperature: 0,
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
        responseMimeType: "application/json",
        returnMeta: true
      });

      const completionText =
        typeof completionResponse === "string"
          ? completionResponse
          : completionResponse?.text || "";

      if (!completionText) {
        return currentSql;
      }

      const parsed = await parseJsonWithRepair({
        mode: "generate",
        rawText: completionText
      });

      if (!parsed || typeof parsed.sql !== "string") {
        return currentSql;
      }

      const completedSql = stripCodeFences(parsed.sql);
      if (!completedSql) {
        return currentSql;
      }

      currentSql = completedSql;
    } catch (_) {
      return currentSql;
    }
  }

  return currentSql;
};

const validateAiRequest = ({ mode, prompt, sql, user }) => {
  if (!mode) {
    throw new AppError(400, "Mode is required");
  }

  if (!user) {
    throw new AppError(404, "User not found");
  }

  if (mode === "generate" && !prompt) {
    throw new AppError(400, "Prompt required");
  }

  if (["optimize", "validate", "explain", "format"].includes(mode) && !sql) {
    throw new AppError(400, "SQL is required");
  }
};

const runAiRequest = async ({ userId, mode, prompt, sql, dialect, requestMeta = {} }) => {
  const user = await User.findById(userId);
  validateAiRequest({ mode, prompt, sql, user });
  const normalizedDialect = normalizeDialect(dialect);

  if (mode !== "generate" && user.plan !== "pro") {
    await createSecurityEvent({
      userId: user._id,
      emailSnapshot: user.email,
      type: "pro_feature_access_denied",
      severity: "low",
      source: "ai",
      message: `Free user attempted ${mode} mode.`,
      metadata: { mode },
      ...requestMeta
    });

    throw new AppError(403, "Upgrade to Pro to use this feature.");
  }

  if (normalizedDialect !== "standard" && user.plan !== "pro") {
    throw new AppError(403, "Upgrade to Pro to choose a SQL dialect.");
  }

  let cleanResult = "";

  if (mode === "format") {
    cleanResult = formatSqlSafely(sql);
  }

  const schemaData = mode === "format" ? null : await SchemaModel.findOne({ userId });
  const schemaText = String(schemaData?.schemaText || "").trim();
  const hasSchema = schemaText.length > 0;

  if (mode === "generate" && !hasSchema) {
    throw new AppError(
      400,
      "Please save your schema in Schema Context before generating SQL."
    );
  }

  const userPrompt = mode === "format" ? "" : buildUserPrompt({
    mode,
    schemaText,
    hasSchema,
    prompt,
    sql,
    dialect: normalizedDialect
  });

  if (mode !== "format" && (!userPrompt || !SYSTEM_PROMPTS[mode])) {
    throw new AppError(400, "Invalid mode");
  }

  if (mode !== "format") {
    try {
      await assertUsageAvailable(user._id);
    } catch (error) {
      if (error.code === "LIMIT") {
        await createSecurityEvent({
          userId: user._id,
          type: "daily_free_limit_hit",
          severity: "low",
          source: "ai",
          message: "User hit daily free credit limit.",
          ...requestMeta
        });
      }

      throw error;
    }
  }

  if (mode !== "format") {
    const aiResponse = await callGemini({
      systemInstruction: SYSTEM_PROMPTS[mode],
      userPrompt,
      temperature: mode === "explain" ? 0.1 : 0,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      responseMimeType: "application/json",
      returnMeta: true
    });

    const aiResult =
      typeof aiResponse === "string" ? aiResponse : aiResponse?.text || "";
    const finishReason =
      typeof aiResponse === "string" ? null : aiResponse?.finishReason;

    if (!aiResult) {
      throw new AppError(500, "AI failed");
    }

    if (mode === "explain") {
      const parsed = await parseJsonWithRepair({
        mode,
        rawText: aiResult
      });
      const normalized = normalizeExplainPayload(parsed, aiResult);
      cleanResult = buildExplainOutput(normalized);
    } else {
      const parsed = await parseJsonWithRepair({
        mode,
        rawText: aiResult
      });

      let sqlText =
        parsed && typeof parsed.sql === "string"
          ? parsed.sql
          : stripCodeFences(aiResult);

      if (mode === "generate") {
        const initialCandidateSql = sqlText;
        sqlText = await reviewGeneratedSql({
          schemaText,
          prompt,
          candidateSql: sqlText
        });

        if (finishReason === "MAX_TOKENS" || isLikelyIncompleteSql(sqlText)) {
          const completionSeed =
            sqlText || (finishReason === "MAX_TOKENS" ? initialCandidateSql : "");

          sqlText = await completeGeneratedSqlIfNeeded({
            schemaText,
            prompt,
            candidateSql: completionSeed
          });
        }
      }

      cleanResult = formatSqlSafely(sqlText);

      if (mode === "generate" && !cleanResult.trim()) {
        throw new AppError(
          400,
          "Unable to generate SQL from saved schema context for this request."
        );
      }
    }
  }

  if (!cleanResult) {
    throw new AppError(500, "AI response was empty");
  }

  await Query.create({
    userId: user._id,
    prompt: prompt || sql,
    generatedSQL: cleanResult,
    mode,
    dialect: normalizedDialect
  });

  if (mode !== "format") {
    await incrementUsage(user._id);
  }

  return {
    result: cleanResult
  };
};

module.exports = {
  runAiRequest
};
