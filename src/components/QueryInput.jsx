import React, { useRef, useEffect } from "react";

export default function QueryInput({
  query,
  onChange,
  onSubmit,
  onFixError,
  onOpenIntegration,
  isLoading,
  hasClipboard,
  integrationTarget,
  leftOffset = 0,
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
    <div
      style={{
        position: "fixed",
        left: `${24 + leftOffset}px`,
        right: "24px",
        bottom: "24px",
        zIndex: 30,
        transition: "left 300ms ease, right 300ms ease",
      }}
      className="rounded-[28px] border border-white border-opacity-30 bg-white bg-opacity-10 p-3 backdrop-blur-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onOpenIntegration}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b78459] text-sm font-semibold text-[#fff8f1] shadow-sm transition hover:bg-[#a6744c]"
        >
          M
        </button>
        <div className="min-w-0 flex-1 rounded-2xl border border-white/40 bg-white/45 px-3 py-2 text-xs text-stone-800 shadow-sm">
          {integrationTarget ? (
            <span>
              Integrated with{" "}
              <span className="font-semibold text-stone-950">
                {integrationTarget.appName}
              </span>
              . Press <span className="font-semibold text-stone-950">M</span> to
              reconnect or analyze the live app without typing the issue.
            </span>
          ) : (
            <span>
              Press <span className="font-semibold text-stone-950">M</span> to connect
              Nexora to a live app and inspect it without pasting the issue every time.
            </span>
          )}
        </div>
      </div>

      {hasClipboard && (
        <button
          onClick={onFixError}
          disabled={isLoading}
          className="mb-2 w-full rounded-xl border border-red-300 border-opacity-40 bg-red-100 bg-opacity-30 px-3 py-1.5 text-xs text-red-900 transition-all hover:bg-opacity-40 disabled:opacity-50"
        >
          ⚡ Fix error from clipboard
        </button>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={2}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this app... (Enter to send)"
          disabled={isLoading}
          style={{ color: "#1c1917", caretColor: "#1c1917" }}
          className="flex-1 resize-none rounded-2xl border border-amber-900 border-opacity-40 bg-white bg-opacity-85 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition-colors placeholder-stone-500 focus:border-amber-800 disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !query.trim()}
          className="rounded-2xl bg-amber-700 px-4 py-3 text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <span className="animate-spin text-sm">⟳</span>
          ) : (
            <span className="text-sm">↑</span>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-stone-800">Shift+Enter for new line</p>
    </div>
  );
}
