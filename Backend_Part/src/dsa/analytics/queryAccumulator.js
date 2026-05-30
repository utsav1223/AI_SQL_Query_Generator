const { getTopK } = require("./topKHeap");

const DEFAULT_MODE_TIME_SAVED_MINUTES = {
  generate: 10,
  optimize: 5,
  validate: 5,
  explain: 5,
  format: 2,
  schema: 8
};

const extractReferencedTables = (sqlText = "") => {
  const tableMatches = [];
  const tablePattern = /\b(?:from|join|update|into)\s+([A-Za-z_][\w.]*|"[^"]+"|`[^`]+`|\[[^\]]+\])/gi;
  let match = tablePattern.exec(String(sqlText || ""));

  while (match) {
    const tableName = String(match[1] || "")
      .replace(/^[`"\[]|[`"\]]$/g, "")
      .split(".")
      .pop()
      .trim();

    if (tableName) {
      tableMatches.push(tableName);
    }

    match = tablePattern.exec(String(sqlText || ""));
  }

  return tableMatches;
};

const createSqlQualityState = () => ({
  issueCounters: {
    selectStar: 0,
    missingWhere: 0,
    joinWithoutCondition: 0,
    destructiveStatements: 0
  },
  riskDistribution: {
    low: 0,
    medium: 0,
    high: 0
  }
});

const applySqlQuality = (state, query) => {
  const sql = String(query.generatedSQL || "");
  const normalizedSql = sql.replace(/\s+/g, " ").trim();
  const hasSelect = /\bselect\b/i.test(normalizedSql);
  const hasJoin = /\bjoin\b/i.test(normalizedSql);
  const hasWhere = /\bwhere\b/i.test(normalizedSql);
  const hasJoinCondition = /\bon\b/i.test(normalizedSql) || /\busing\s*\(/i.test(normalizedSql);
  const hasSelectStar = /\bselect\s+\*/i.test(normalizedSql);
  const hasDestructiveStatement = /\b(drop|truncate|alter|delete)\b/i.test(normalizedSql);
  let risk = "low";

  if (hasSelectStar) {
    state.issueCounters.selectStar += 1;
    risk = "medium";
  }

  if (hasSelect && !hasWhere && !/\blimit\b/i.test(normalizedSql)) {
    state.issueCounters.missingWhere += 1;
    risk = "medium";
  }

  if (hasJoin && !hasJoinCondition) {
    state.issueCounters.joinWithoutCondition += 1;
    risk = "high";
  }

  if (hasDestructiveStatement) {
    state.issueCounters.destructiveStatements += 1;
    risk = "high";
  }

  state.riskDistribution[risk] += 1;
};

const finalizeSqlQuality = (state, queryCount) => {
  const totalIssues = Object.values(state.issueCounters).reduce((sum, count) => sum + count, 0);
  const qualityScore =
    queryCount > 0
      ? Math.max(35, Math.round(100 - (totalIssues / queryCount) * 12))
      : 100;

  return {
    issueCounters: state.issueCounters,
    riskDistribution: state.riskDistribution,
    qualityScore
  };
};

const accumulateQueryAnalytics = (queries = [], options = {}) => {
  const modeTimeSavedMinutes = options.modeTimeSavedMinutes || DEFAULT_MODE_TIME_SAVED_MINUTES;
  const tableCounts = new Map();
  const qualityState = createSqlQualityState();
  const result = {
    estimatedMinutesSaved: 0,
    copiedQueries: 0,
    exportedQueries: 0,
    pinnedQueries: 0,
    favoriteQueries: 0,
    taggedQueries: 0,
    validationChangedCount: 0,
    topTables: [],
    sqlQuality: null
  };

  queries.forEach((query) => {
    result.estimatedMinutesSaved += modeTimeSavedMinutes[query.mode] || 4;

    if ((query.copyCount || 0) > 0) result.copiedQueries += 1;
    if ((query.exportCount || 0) > 0) result.exportedQueries += 1;
    if (query.pinned) result.pinnedQueries += 1;
    if (query.favorite) result.favoriteQueries += 1;
    if (query.tags?.length > 0) result.taggedQueries += 1;

    if (query.mode === "validate") {
      const originalSql = String(query.prompt || "").replace(/\s+/g, " ").trim().toLowerCase();
      const finalSql = String(query.generatedSQL || "").replace(/\s+/g, " ").trim().toLowerCase();

      if (originalSql && finalSql && originalSql !== finalSql) {
        result.validationChangedCount += 1;
      }
    }

    extractReferencedTables(query.generatedSQL).forEach((tableName) => {
      tableCounts.set(tableName, (tableCounts.get(tableName) || 0) + 1);
    });

    applySqlQuality(qualityState, query);
  });

  result.topTables = getTopK(
    [...tableCounts.entries()].map(([name, count]) => ({ name, count })),
    options.topTableLimit || 6,
    (item) => item.count
  );
  result.sqlQuality = finalizeSqlQuality(qualityState, queries.length);

  return result;
};

module.exports = {
  accumulateQueryAnalytics,
  extractReferencedTables
};
