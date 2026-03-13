import React from "react";

export default function ResponsePanel({ response }) {
  if (!response) return null;

  const lines = response.answer.split("\n");

  return (
    <div className="bg-gray-800 bg-opacity-60 rounded-xl border border-gray-700 p-4 mb-3">
      {/* Meta */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-blue-400 font-medium">Nexora AI</span>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {response.model && <span>{response.model}</span>}
          {response.tokens_used && <span>· {response.tokens_used} tokens</span>}
        </div>
      </div>

      {/* Response Content */}
      <div className="text-sm text-gray-200 space-y-2 leading-relaxed">
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
                className="bg-blue-900 bg-opacity-30 border border-blue-700 border-opacity-50 rounded-lg px-3 py-2 text-blue-300 text-xs mt-3"
              >
                💡 {line.replace(/^tip:/i, "").trim()}
              </div>
            );
          }

          if (isStep) {
            return (
              <div key={i} className="flex gap-2">
                <span className="text-blue-400 font-bold text-xs mt-0.5 shrink-0">
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
                className="block bg-gray-900 text-green-400 text-xs px-3 py-1 rounded font-mono"
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
        className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Copy response
      </button>
    </div>
  );
}
