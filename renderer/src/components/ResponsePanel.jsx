import React from "react";

export default function ResponsePanel({ response }) {
  if (!response) return null;

  const lines = response.answer.split("\n");

  return (
    <div className="mb-3 rounded-2xl border border-stone-700 bg-stone-900 bg-opacity-85 p-4 shadow-lg">
      {/* Meta */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium tracking-[0.16em] text-amber-100">Nexora AI</span>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {response.model && <span>{response.model}</span>}
          {response.tokens_used && <span>· {response.tokens_used} tokens</span>}
        </div>
      </div>

      {/* Response Content */}
      <div className="space-y-2 text-sm leading-relaxed text-stone-50">
        {lines.map((line, i) => {
          // Numbered steps get special styling
          const isStep = /^\d+\./.test(line.trim());
          const isTip = line.trim().toLowerCase().startsWith("tip:");
          const isEmpty = line.trim() === "";

          if (isEmpty) return <div key={i} className="h-1" />;

          if (isTip) {
            return (
              <div
                key={i}
                className="mt-3 rounded-xl border border-amber-400 border-opacity-40 bg-amber-500 bg-opacity-10 px-3 py-2 text-xs text-amber-100"
              >
                💡 {line.replace(/^tip:/i, "").trim()}
              </div>
            );
          }

          if (isStep) {
            return (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-xs font-bold text-amber-100">
                  {line.match(/^\d+/)[0]}.
                </span>
                <span>{line.replace(/^\d+\./, "").trim()}</span>
              </div>
            );
          }

          // Code block detection (backtick lines)
          if (line.trim().startsWith("```") || line.trim().startsWith("`")) {
            return (
              <code
                key={i}
                className="block rounded bg-black bg-opacity-30 px-3 py-1 font-mono text-xs text-emerald-200"
              >
                {line.replace(/`/g, "")}
              </code>
            );
          }

          return <p key={i}>{line}</p>;
        })}
      </div>

      {/* Copy Button */}
      <button
        onClick={() => navigator.clipboard.writeText(response.answer)}
        className="mt-3 text-xs text-stone-400 transition-colors hover:text-stone-200"
      >
        Copy response
      </button>
    </div>
  );
}
