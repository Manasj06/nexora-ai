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
    <div className="border-t border-primary-700 p-3 bg-primary-800 bg-opacity-60">
      {/* Error Fix Button — shows if clipboard has error content */}
      {hasClipboard && (
        <button
          onClick={onFixError}
          disabled={isLoading}
          className="w-full mb-2 text-xs bg-red-900 bg-opacity-40 hover:bg-opacity-60 border border-red-700 text-red-300 rounded-lg py-1.5 px-3 transition-all disabled:opacity-50"
        >
          ⚡ Fix error from clipboard
        </button>
      )}

      {/* Text Input */}
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          rows={2}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this app... (Enter to send)"
          disabled={isLoading}
          className="flex-1 bg-primary-700 text-white text-sm rounded-lg px-3 py-2 outline-none resize-none border border-primary-600 focus:border-primary-500 placeholder-primary-500 disabled:opacity-50 transition-colors"
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !query.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg p-2.5 transition-colors"
        >
          {isLoading ? (
            <span className="animate-spin text-sm">⟳</span>
          ) : (
            <span className="text-sm">↑</span>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-1">Shift+Enter for new line</p>
    </div>
  );
}
