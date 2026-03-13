import React from "react";

export default function ContextBadge({ context, isCapturing }) {
  if (!context) {
    return (
      <div className="border-b border-stone-700 px-4 py-2 text-xs text-stone-300">
        {isCapturing ? "Capturing context..." : "No context captured yet"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border-b border-stone-700 bg-stone-900 bg-opacity-80 px-4 py-2">
      <span className="text-emerald-300 text-xs">●</span>
      <span className="truncate text-xs text-stone-300">
        <span className="text-white font-medium">{context.app_name}</span>
        {context.window_title && context.window_title !== context.app_name && (
          <span className="text-stone-400"> - {context.window_title.slice(0, 40)}</span>
        )}
      </span>
      <span className="ml-auto text-xs text-stone-400">{context.platform}</span>
    </div>
  );
}
