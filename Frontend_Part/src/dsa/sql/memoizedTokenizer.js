import { createLRUCache } from "../cache/lruCache";
import { tokenizeSQL } from "../../utils/sqlHighlighter";

const tokenCache = createLRUCache(160);

export function tokenizeSQLMemoized(sql = "") {
  const key = String(sql);
  const cachedTokens = tokenCache.get(key);

  if (cachedTokens) {
    return cachedTokens;
  }

  const tokens = tokenizeSQL(key);
  tokenCache.set(key, tokens);
  return tokens;
}

export function clearSQLTokenCache() {
  tokenCache.clear();
}
