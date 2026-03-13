import React from "react";

export default function Header({ expertiseLevel, onExpertiseChange }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-10 px-4 py-3 text-stone-900 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="text-amber-900 text-lg">⬡</span>
        <span className="font-semibold text-sm tracking-[0.18em] text-stone-900">
          Nexora AI
        </span>
        <span className="rounded-full bg-amber-900 bg-opacity-15 px-2 py-0.5 text-xs text-amber-900">
          LIVE
        </span>
      </div>

      <select
        value={expertiseLevel}
        onChange={(e) => onExpertiseChange(e.target.value)}
        className="rounded-lg border border-stone-500 border-opacity-40 bg-white bg-opacity-40 px-2 py-1 text-xs text-stone-900 outline-none focus:border-amber-700"
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  );
}
