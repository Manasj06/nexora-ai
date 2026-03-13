import React, { useRef, useEffect } from "react";

export default function QueryInput({
  query,
  onChange,
  onSubmit,
  onFixError,
  isLoading,
  hasClipboard,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-stone-700 bg-stone-900 bg-opacity-90 p-3">
      {/* Error Fix Button — shows if clipboard has error content */}
      {hasClipboard && (
        <button
          onClick={onFixError}
          disabled={isLoading}
          className="mb-2 w-full rounded-xl border border-red-400 border-opacity-40 bg-red-950 px-3 py-1.5 text-xs text-red-100 transition-all hover:bg-red-900 disabled:opacity-50"
        >
          ⚡ Fix error from clipboard
        </button>
      )}

      {/* Text Input */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={2}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this app... (Enter to send)"
          disabled={isLoading}
          className="flex-1 resize-none rounded-xl border border-stone-600 bg-stone-800 px-3 py-2 text-sm text-stone-50 outline-none transition-colors placeholder-stone-400 focus:border-amber-300 disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !query.trim()}
          className="rounded-xl bg-amber-500 p-2.5 text-stone-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <span className="animate-spin text-sm">⟳</span>
          ) : (
            <span className="text-sm">↑</span>
          )}
        </button>
      </div>
      <p className="mt-1 text-xs text-stone-400">Shift+Enter for new line</p>
    </div>
  );
}
