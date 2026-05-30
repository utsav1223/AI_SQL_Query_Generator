const { tokenizeSearchText } = require("../search/querySearch");

const normalizeIdentifier = (value = "") => {
  return String(value || "")
    .replace(/^[`"\[]|[`"\]]$/g, "")
    .split(".")
    .pop()
    .trim()
    .toLowerCase();
};

const splitColumnLines = (body = "") => {
  const lines = [];
  let current = "";
  let depth = 0;

  for (const char of body) {
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(depth - 1, 0);

    if (char === "," && depth === 0) {
      lines.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    lines.push(current.trim());
  }

  return lines;
};

const parseColumns = (body = "") => {
  const skippedPrefixes = new Set([
    "constraint",
    "primary",
    "foreign",
    "unique",
    "check",
    "index",
    "key"
  ]);

  return splitColumnLines(body)
    .map((line) => {
      const match = line.match(/^\s*([`"\[]?[A-Za-z_][\w$]*[`"\]]?)/);
      if (!match) return "";

      const column = normalizeIdentifier(match[1]);
      return skippedPrefixes.has(column) ? "" : column;
    })
    .filter(Boolean);
};

const parseForeignKeys = (body = "") => {
  const edges = [];
  const fkPattern = /foreign\s+key\s*\([^)]+\)\s+references\s+([`"\[]?[\w.]+[`"\]]?)/gi;
  let match = fkPattern.exec(body);

  while (match) {
    const target = normalizeIdentifier(match[1]);
    if (target) {
      edges.push(target);
    }

    match = fkPattern.exec(body);
  }

  return edges;
};

const buildSchemaGraph = (schemaText = "") => {
  const tables = new Map();
  const adjacency = new Map();
  const createTablePattern =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?([`"\[]?[\w.]+[`"\]]?)\s*\(([\s\S]*?)\)\s*;/gi;
  let match = createTablePattern.exec(String(schemaText || ""));

  while (match) {
    const tableName = normalizeIdentifier(match[1]);
    const body = match[2] || "";

    if (tableName) {
      const columns = parseColumns(body);
      const references = parseForeignKeys(body);

      tables.set(tableName, {
        name: tableName,
        columns,
        raw: match[0]
      });
      adjacency.set(tableName, new Set(references));
    }

    match = createTablePattern.exec(String(schemaText || ""));
  }

  adjacency.forEach((targets, source) => {
    targets.forEach((target) => {
      if (!adjacency.has(target)) {
        adjacency.set(target, new Set());
      }
      adjacency.get(target).add(source);
    });
  });

  return {
    tables,
    adjacency
  };
};

const getRelatedTables = (graph, tableName, depth = 1) => {
  const start = normalizeIdentifier(tableName);
  const visited = new Set();
  const queue = [{ table: start, depth: 0 }];

  while (queue.length > 0) {
    const item = queue.shift();

    if (!item.table || visited.has(item.table) || item.depth > depth) {
      continue;
    }

    visited.add(item.table);
    const neighbors = graph.adjacency.get(item.table) || new Set();

    neighbors.forEach((neighbor) => {
      queue.push({ table: neighbor, depth: item.depth + 1 });
    });
  }

  return visited;
};

const findRelevantTables = (schemaText, queryText, options = {}) => {
  const graph = buildSchemaGraph(schemaText);
  const terms = new Set(tokenizeSearchText(queryText));
  const selected = new Set();

  graph.tables.forEach((table, tableName) => {
    const tableTokens = new Set([
      tableName,
      ...tableName.split("_"),
      ...table.columns,
      ...table.columns.flatMap((column) => column.split("_"))
    ]);

    for (const term of terms) {
      if (tableTokens.has(term)) {
        getRelatedTables(graph, tableName, options.depth ?? 1).forEach((name) => selected.add(name));
        break;
      }
    }
  });

  return {
    graph,
    selected
  };
};

const selectRelevantSchemaContext = (schemaText = "", queryText = "", options = {}) => {
  const fullSchema = String(schemaText || "").trim();
  const minLength = options.minLength || 6000;

  if (!fullSchema || fullSchema.length < minLength) {
    return fullSchema;
  }

  const { graph, selected } = findRelevantTables(fullSchema, queryText, options);

  if (selected.size === 0) {
    return fullSchema;
  }

  const maxTables = options.maxTables || 8;
  const selectedStatements = [...selected]
    .slice(0, maxTables)
    .map((tableName) => graph.tables.get(tableName)?.raw)
    .filter(Boolean);

  if (selectedStatements.length === 0) {
    return fullSchema;
  }

  const reducedSchema = selectedStatements.join("\n\n");

  return reducedSchema.length < fullSchema.length ? reducedSchema : fullSchema;
};

module.exports = {
  buildSchemaGraph,
  findRelevantTables,
  getRelatedTables,
  selectRelevantSchemaContext
};
