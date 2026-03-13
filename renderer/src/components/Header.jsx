import React from "react";

export default function Header({ expertiseLevel, onExpertiseChange }) {
  return (
    <div className="flex items-center justify-between border-b border-stone-700 bg-stone-900 bg-opacity-90 px-4 py-3">
      {/* Logo + Name */}
      <div className="flex items-center gap-2">
        <span className="text-amber-100 text-lg">⬡</span>
        <span className="font-semibold text-white text-sm tracking-[0.18em]">
          Nexora AI
        </span>
        <span className="rounded-full bg-amber-500 bg-opacity-20 px-2 py-0.5 text-xs text-amber-100">
          LIVE
        </span>
      </div>

      {/* Expertise Selector */}
        <select
        value={expertiseLevel}
        onChange={(e) => onExpertiseChange(e.target.value)}
        className="rounded border border-stone-600 bg-stone-800 px-2 py-1 text-xs text-stone-100 outline-none focus:border-amber-300"
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  );
}
