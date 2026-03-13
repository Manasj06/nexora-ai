import React, { useEffect, useState } from "react";
import { deriveHistoryKey, exportHistoryKey } from "../lib/secureHistory";

export default function AuthScreen({
  backendUrl,
  lastAccountEmail,
  onAuthenticated,
}) {
  const [mode, setMode] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(lastAccountEmail || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email && lastAccountEmail) {
      setEmail(lastAccountEmail);
    }
  }, [lastAccountEmail, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!backendUrl) return;

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const endpoint = mode === "signup" ? "signup" : "signin";
      const payload =
        mode === "signup"
          ? {
              display_name: displayName.trim() || "Nexora User",
              email,
              password,
            }
          : { email, password };

      const response = await fetch(`${backendUrl}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed.");
      }

      const historyKey = await deriveHistoryKey(password, data.user.history_salt);
      const exportedHistoryKey = await exportHistoryKey(historyKey);

      onAuthenticated({
        auth: data,
        historyKey,
        exportedHistoryKey,
      });

      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError.message || "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 text-stone-900">
      <div className="w-full max-w-5xl rounded-[36px] border border-white border-opacity-30 bg-white bg-opacity-14 p-6 shadow-2xl backdrop-blur-xl md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center rounded-[30px] border border-white border-opacity-25 bg-white bg-opacity-10 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-900">
              Nexora AI
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-stone-950 md:text-4xl">
              Sign in to your private AI workspace.
            </h1>
          </div>

          <div className="rounded-[30px] border border-white border-opacity-30 bg-white bg-opacity-22 p-6 shadow-lg">
            <div className="flex rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-20 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError("");
                }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === "signin"
                    ? "bg-white bg-opacity-80 text-stone-950 shadow"
                    : "text-stone-700"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                }}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-white bg-opacity-80 text-stone-950 shadow"
                    : "text-stone-700"
                }`}
              >
                Sign up
              </button>
            </div>

            {!mode && (
              <div className="mt-6 rounded-2xl border border-white border-opacity-30 bg-white bg-opacity-20 px-4 py-5 text-center text-sm text-stone-700">
                Choose <span className="font-semibold text-stone-900">Sign in</span> or{" "}
                <span className="font-semibold text-stone-900">Sign up</span> to continue.
              </div>
            )}

            {mode && (
              <>
                {lastAccountEmail && (
                  <p className="mt-4 text-xs text-stone-700">
                    Last signed-in account: <span className="font-medium text-stone-900">{lastAccountEmail}</span>
                  </p>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  {mode === "signup" && (
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                        Display name
                      </span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="How should Nexora greet you?"
                        className="w-full rounded-2xl border border-white border-opacity-35 bg-white bg-opacity-75 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-amber-800"
                      />
                    </label>
                  )}

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-2xl border border-white border-opacity-35 bg-white bg-opacity-75 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-amber-800"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                      Password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="w-full rounded-2xl border border-white border-opacity-35 bg-white bg-opacity-75 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-amber-800"
                    />
                  </label>

                  {mode === "signup" && (
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                        Confirm password
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-white border-opacity-35 bg-white bg-opacity-75 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-amber-800"
                      />
                    </label>
                  )}

                  {error && (
                    <div className="rounded-2xl border border-red-300 border-opacity-45 bg-red-100 bg-opacity-35 px-4 py-3 text-sm text-red-900">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!backendUrl || isSubmitting}
                    className="w-full rounded-2xl bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Securing your workspace..."
                      : mode === "signup"
                        ? "Create secure account"
                        : "Unlock Nexora"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
