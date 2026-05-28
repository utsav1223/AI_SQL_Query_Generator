export function downloadSQLFile(sql, filename = "query.sql") {
  const normalizedName = filename.toLowerCase().endsWith(".sql") ? filename : `${filename}.sql`;
  const blob = new Blob([sql || ""], { type: "text/sql;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = normalizedName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildSQLFilename(prefix = "query") {
  const safePrefix = String(prefix || "query")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const dateStamp = new Date().toISOString().slice(0, 10);

  return `${safePrefix || "query"}-${dateStamp}.sql`;
}
