import React from "react";

export default function ContextBadge({ context, isCapturing }) {
  if (!context) {
    return (
      <div className="px-4 py-2 text-xs text-gray-600 border-b border-gray-800">
        {isCapturing ? "Capturing context..." : "No context captured yet"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 bg-gray-800 bg-opacity-40">
      <span className="text-green-400 text-xs">●</span>
      <span className="text-xs text-gray-400 truncate">
        <span className="text-white font-medium">{context.app_name}</span>
        {context.window_title && context.window_title !== context.app_name && (
          <span className="text-gray-500"> — {context.window_title.slice(0, 40)}</span>
        )}
      </span>
      <span className="ml-auto text-xs text-gray-600">{context.platform}</span>
    </div>
  );
}
