import React from "react";

export default function Header({
  expertiseLevel,
  onExpertiseChange,
  user,
  onSignOut,
}) {
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

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden items-center gap-3 rounded-xl border border-white border-opacity-35 bg-white bg-opacity-30 px-3 py-1.5 text-xs text-stone-800 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-900 bg-opacity-15 font-semibold text-amber-900">
              {user.display_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-900">{user.display_name}</p>
              <p className="truncate text-[11px] text-stone-700">{user.email}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-stone-500 border-opacity-40 bg-white bg-opacity-40 px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700">
            Version
          </span>
          <select
            value={expertiseLevel}
            onChange={(e) => onExpertiseChange(e.target.value)}
            style={{ WebkitTextFillColor: "#1c1917" }}
            className="min-w-[7.5rem] appearance-none bg-transparent pr-5 text-xs font-medium text-stone-900 outline-none"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <span className="pointer-events-none text-xs text-stone-700">▼</span>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-white border-opacity-35 bg-white bg-opacity-28 px-3 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-opacity-40"
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
