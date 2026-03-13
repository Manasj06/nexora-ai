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
    <div className="flex flex-col h-screen bg-gray-900 bg-opacity-95 text-white rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <Header
        expertiseLevel={expertiseLevel}
        onExpertiseChange={setExpertiseLevel}
      />

      {/* Context Badge */}
      <ContextBadge context={context} isCapturing={isCapturing} />

      {/* Response Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {response && <ResponsePanel response={response} />}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}
        {!response && !error && !isLoading && (
          <div className="text-gray-500 text-sm text-center mt-8">
            <p className="text-2xl mb-2">🤖</p>
            <p>Ask me anything about your current app.</p>
            <p className="text-xs mt-1">I see your active context.</p>
          </div>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-400 text-sm mt-4">
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
  );
}
