import React from "react";

export default function ResponsePanel({ response }) {
  if (!response) return null;

  const lines = response.answer.split("\n");

  return (
    <div className="mb-4 rounded-[28px] border border-white border-opacity-30 bg-white bg-opacity-10 p-4 text-stone-900 shadow-lg backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium tracking-[0.16em] text-amber-900">Nexora AI</span>
        <div className="flex items-center gap-2 text-xs text-stone-700">
          {response.model && <span>{response.model}</span>}
          {response.tokens_used && <span>· {response.tokens_used} tokens</span>}
        </div>
      </div>

      <div className="space-y-2 text-sm leading-relaxed text-stone-900">
        {lines.map((line, i) => {
          const isStep = /^\d+\./.test(line.trim());
          const isTip = line.trim().toLowerCase().startsWith("tip:");
          const isEmpty = line.trim() === "";

          if (isEmpty) return <div key={i} className="h-1" />;

          if (isTip) {
            return (
              <div
                key={i}
                className="mt-3 rounded-xl border border-amber-900 border-opacity-20 bg-amber-100 bg-opacity-40 px-3 py-2 text-xs text-amber-950"
              >
                💡 {line.replace(/^tip:/i, "").trim()}
              </div>
            );
          }

          if (isStep) {
            return (
              <div key={i} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-xs font-bold text-amber-900">
                  {line.match(/^\d+/)[0]}.
                </span>
                <span>{line.replace(/^\d+\./, "").trim()}</span>
              </div>
            );
          }

          if (line.trim().startsWith("```") || line.trim().startsWith("`")) {
            return (
              <code
                key={i}
                className="block rounded bg-stone-950 bg-opacity-10 px-3 py-1 font-mono text-xs text-emerald-900"
              >
                {line.replace(/`/g, "")}
              </code>
            );
          }

          return <p key={i}>{line}</p>;
        })}
      </div>

      <button
        onClick={() => navigator.clipboard.writeText(response.answer)}
        className="mt-3 text-xs text-stone-700 transition-colors hover:text-stone-950"
      >
        Copy response
      </button>
    </div>
  );
}
