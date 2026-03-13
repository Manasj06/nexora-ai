import React from "react";

function formatTimestamp(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ConversationHistory({
  history,
  isOpen,
  onToggle,
  onSelectEntry,
  onClear,
  activeEntryId,
  drawerWidth = 296,
}) {
  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Open history"
          style={{
            position: "fixed",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 40,
          }}
          className="rounded-r-2xl border border-l-0 border-white border-opacity-30 bg-white bg-opacity-20 px-3 py-4 text-stone-900 shadow-lg backdrop-blur-md transition-all hover:bg-opacity-30"
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <span className="block h-0.5 w-3 rounded bg-stone-800" />
              <span className="block h-0.5 w-4 rounded bg-stone-800" />
              <span className="block h-0.5 w-3 rounded bg-stone-800" />
            </div>
            <span className="text-sm font-semibold text-stone-800">{">"}</span>
          </div>
        </button>
      )}

      <aside
        style={{
          position: "fixed",
          left: 16,
          top: 16,
          bottom: 16,
          width: "min(18.5rem, calc(100vw - 2rem))",
          transform: isOpen
            ? "translateX(0)"
            : `translateX(-${drawerWidth + 32}px)`,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: 50,
        }}
        className="rounded-[28px] border border-white border-opacity-30 bg-white bg-opacity-16 p-4 text-stone-900 shadow-2xl backdrop-blur-xl transition-all duration-300"
      >
        <button
          onClick={onToggle}
          aria-label="Close history"
          style={{
            position: "absolute",
            right: -20,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
          }}
          className="rounded-r-2xl border border-l-0 border-white border-opacity-30 bg-white bg-opacity-20 px-3 py-4 text-stone-900 shadow-lg backdrop-blur-md transition-all hover:bg-opacity-30"
        >
          <div className="flex items-center justify-center">
            <span className="text-sm font-semibold text-stone-800">{"<"}</span>
          </div>
        </button>

        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                History
              </p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                Previous conversations
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-xs text-stone-700">
              {history.length} conversation{history.length === 1 ? "" : "s"}
            </p>
            {history.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs font-medium text-stone-700 transition-colors hover:text-stone-950"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {history.length === 0 && (
              <div className="rounded-2xl border border-white border-opacity-25 bg-white bg-opacity-20 p-4 text-sm text-stone-700">
                Your recent asks and AI replies will appear here.
              </div>
            )}

            {history.map((entry) => {
              const preview = entry.error
                ? `Error: ${entry.error}`
                : entry.response?.answer || "No response preview available.";
              const isActive = entry.id === activeEntryId;

              return (
                <button
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.id)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    isActive
                      ? "border-amber-800 border-opacity-50 bg-amber-100 bg-opacity-45 shadow-md"
                      : "border-white border-opacity-25 bg-white bg-opacity-18 hover:bg-opacity-28"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      {entry.prompt}
                    </p>
                    <span className="shrink-0 text-[11px] text-stone-600">
                      {formatTimestamp(entry.createdAt)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-stone-600">
                    <span>
                      {entry.source === "clipboard"
                        ? "Fix"
                        : entry.source === "monitor"
                          ? "Live"
                          : "Ask"}
                    </span>
                    {entry.expertiseLevel && <span>{entry.expertiseLevel}</span>}
                    {entry.contextLabel && <span className="truncate">{entry.contextLabel}</span>}
                  </div>

                  <p className="mt-2 truncate text-xs text-stone-700">
                    {preview}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
