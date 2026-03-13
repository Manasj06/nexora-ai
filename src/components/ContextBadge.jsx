import React from "react";

export default function ContextBadge({ context, isCapturing, integrationTarget }) {
  if (!context) {
    return (
      <div className="mt-3 rounded-2xl border border-white border-opacity-25 bg-white bg-opacity-10 px-4 py-2 text-xs text-stone-800 backdrop-blur-sm">
        {isCapturing ? "Capturing context..." : "No context captured yet"}
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white border-opacity-25 bg-white bg-opacity-10 px-4 py-2 backdrop-blur-sm">
      <span className="text-emerald-300 text-xs">●</span>
      <span className="truncate text-xs text-stone-800">
        <span className="font-medium text-stone-900">{context.app_name}</span>
        {context.window_title && context.window_title !== context.app_name && (
          <span className="text-stone-700"> - {context.window_title.slice(0, 40)}</span>
        )}
      </span>
      {integrationTarget && (
        <span className="hidden rounded-full border border-white border-opacity-25 bg-white bg-opacity-22 px-2 py-0.5 text-[11px] text-stone-800 md:inline-flex">
          Integrated: {integrationTarget.appName}
        </span>
      )}
      <span className="ml-auto text-xs text-stone-700">{context.platform}</span>
    </div>
  );
}
