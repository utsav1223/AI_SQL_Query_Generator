import { useMemo } from "react";
import { tokenizeSQLMemoized } from "../../dsa/sql/memoizedTokenizer";

export default function SQLSyntaxHighlighter({ sql = "", className = "" }) {
  const tokens = useMemo(() => tokenizeSQLMemoized(sql), [sql]);
  const content = tokens.length
    ? tokens.map((token, index) => (
        <span key={`${index}-${token.type}`} className={`sql-token-${token.type}`}>
          {token.value}
        </span>
      ))
    : null;

  if (className) {
    return <span className={className}>{content}</span>;
  }

  return content;
}
