import { useRef } from "react";

import SQLSyntaxHighlighter from "./SQLSyntaxHighlighter";

export default function SQLHighlightedTextarea({
  value,
  onChange,
  loading,
  placeholder,
  minHeightClass = "min-h-[240px] sm:min-h-[300px]"
}) {
  const highlightRef = useRef(null);

  const syncScroll = (event) => {
    if (!highlightRef.current) {
      return;
    }

    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div
      className={`sql-editor-shell relative overflow-hidden rounded-b-lg border border-t-0 border-[var(--border)] bg-[var(--surface-soft)] focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)] ${
        loading ? "cursor-wait opacity-60" : ""
      }`}
    >
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className={`custom-scrollbar pointer-events-none absolute inset-0 m-0 overflow-auto px-4 py-4 ${minHeightClass} mono-font whitespace-pre-wrap break-words text-[13px] leading-7`}
      >
        <code>
          <SQLSyntaxHighlighter sql={value || " "} />
        </code>
      </pre>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className={`sql-editor-input custom-scrollbar relative z-10 w-full resize-none border-0 bg-transparent px-4 py-4 ${minHeightClass} mono-font text-[13px] leading-7 outline-none`}
      />
    </div>
  );
}
