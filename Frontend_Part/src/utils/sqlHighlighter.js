const SQL_KEYWORDS = new Set([
  "ADD",
  "ALL",
  "ALTER",
  "AND",
  "AS",
  "ASC",
  "BETWEEN",
  "BY",
  "CASE",
  "CHECK",
  "CREATE",
  "CROSS",
  "DATABASE",
  "DELETE",
  "DESC",
  "DISTINCT",
  "DROP",
  "ELSE",
  "END",
  "EXCEPT",
  "EXISTS",
  "FOREIGN",
  "FROM",
  "FULL",
  "GROUP",
  "HAVING",
  "IN",
  "INDEX",
  "INNER",
  "INSERT",
  "INTERSECT",
  "INTO",
  "IS",
  "JOIN",
  "KEY",
  "LEFT",
  "LIKE",
  "LIMIT",
  "NOT",
  "NULL",
  "ON",
  "OR",
  "ORDER",
  "OUTER",
  "PRIMARY",
  "RIGHT",
  "SELECT",
  "SET",
  "TABLE",
  "THEN",
  "UNION",
  "UPDATE",
  "VALUES",
  "WHEN",
  "WHERE",
  "WITH"
]);

const SQL_FUNCTIONS = new Set([
  "AVG",
  "CAST",
  "COALESCE",
  "COUNT",
  "DATE",
  "DATE_TRUNC",
  "LOWER",
  "MAX",
  "MIN",
  "NULLIF",
  "ROUND",
  "SUM",
  "TRIM",
  "UPPER"
]);

const TOKEN_PATTERN =
  /(--[^\n\r]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:\\"|[^"])*"|`(?:``|[^`])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_$]*\b|<>|!=|<=|>=|::|->>|->|\|\||[+*/%=<>-]|\s+|[(),.;]|\S)/g;

export function tokenizeSQL(sql = "") {
  return Array.from(String(sql).matchAll(TOKEN_PATTERN), ([match]) => ({
    value: match,
    type: getTokenType(match)
  }));
}

function getTokenType(token) {
  if (/^\s+$/.test(token)) return "plain";
  if (token.startsWith("--") || token.startsWith("/*")) return "comment";
  if (token.startsWith("'") || token.startsWith("\"") || token.startsWith("`")) return "string";
  if (/^\d/.test(token)) return "number";
  if (/^[(),.;]$/.test(token)) return "punctuation";
  if (/^(<>|!=|<=|>=|::|->>|->|\|\||[+*/%=<>-])$/.test(token)) return "operator";

  const upperToken = token.toUpperCase();
  if (SQL_KEYWORDS.has(upperToken)) return "keyword";
  if (SQL_FUNCTIONS.has(upperToken)) return "function";

  return "identifier";
}
