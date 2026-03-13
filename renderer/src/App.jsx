import React, { useState, useCallback } from "react";
import Header from "./components/Header";
import QueryInput from "./components/QueryInput";
import ResponsePanel from "./components/ResponsePanel";
import ContextBadge from "./components/ContextBadge";
import { useBackend } from "./hooks/useBackend";
import { useContext } from "./hooks/useContext";

export default function App() {
  const [query, setQuery] = useState("");
  const [expertiseLevel, setExpertiseLevel] = useState("intermediate");
  const { backendUrl } = useBackend();
  const { context, refreshContext, isCapturing } = useContext(backendUrl);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !backendUrl) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Refresh context right before asking
      const freshContext = await refreshContext();

      const res = await fetch(`${backendUrl}/assist/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          context: freshContext,
          expertise_level: expertiseLevel,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Request failed");
      }

      const data = await res.json();
      setResponse(data);
      setQuery("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [query, backendUrl, expertiseLevel, refreshContext]);

  const handleErrorFix = useCallback(async () => {
    if (!context?.clipboard_content || !backendUrl) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`${backendUrl}/assist/fix-error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error_text: context.clipboard_content,
          app_name: context.app_name,
          expertise_level: expertiseLevel,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [context, backendUrl, expertiseLevel]);

  return (
    <div className="min-h-screen bg-black bg-opacity-10 p-4 md:p-6">
      <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[28px] border border-stone-900 border-opacity-70 bg-stone-950 bg-opacity-82 text-white shadow-2xl md:h-[calc(100vh-3rem)]">
        {/* Header */}
        <Header
          expertiseLevel={expertiseLevel}
          onExpertiseChange={setExpertiseLevel}
        />

        {/* Context Badge */}
        <ContextBadge context={context} isCapturing={isCapturing} />

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 md:px-5 md:py-4">
          {response && <ResponsePanel response={response} />}
          {error && (
            <div className="rounded-2xl border border-red-300 border-opacity-50 bg-red-950 bg-opacity-30 p-3 text-sm text-red-100 backdrop-blur-sm">
              ⚠️ {error}
            </div>
          )}
        {!response && !error && !isLoading && (
            <div className="mt-8 text-center text-sm text-stone-100">
              <p className="mb-2 text-2xl">🤖</p>
              <p>Ask me anything about your current app.</p>
              <p className="mt-1 text-xs text-stone-300">
                I see your active context.
              </p>
            </div>
          )}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-50">
              <span className="animate-spin">⟳</span>
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <QueryInput
          query={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          onFixError={handleErrorFix}
          isLoading={isLoading}
          hasClipboard={!!context?.clipboard_content}
        />
      </div>
    </div>
  );
}
