import React from "react";

export default function Header({ expertiseLevel, onExpertiseChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800 bg-opacity-80">
      {/* Logo + Name */}
      <div className="flex items-center gap-2">
        <span className="text-blue-400 text-lg">⬡</span>
        <span className="font-semibold text-white text-sm tracking-wide">
          Nexora AI
        </span>
        <span className="text-xs bg-blue-600 bg-opacity-40 text-blue-300 px-2 py-0.5 rounded-full">
          LIVE
        </span>
      </div>

      {/* Expertise Selector */}
      <select
        value={expertiseLevel}
        onChange={(e) => onExpertiseChange(e.target.value)}
        className="text-xs bg-gray-700 text-gray-300 border border-gray-600 rounded px-2 py-1 outline-none focus:border-blue-500"
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>
  );
}
