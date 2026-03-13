import React, { useState, useCallback, useEffect } from "react";
import Header from "./components/Header";
import QueryInput from "./components/QueryInput";
import ResponsePanel from "./components/ResponsePanel";
import ContextBadge from "./components/ContextBadge";
import ConversationHistory from "./components/ConversationHistory";
import { useBackend } from "./hooks/useBackend";
import { useContext } from "./hooks/useContext";

const HISTORY_STORAGE_KEY = "nexora-conversation-history";
const HISTORY_LIMIT = 25;
const HISTORY_DRAWER_WIDTH = 296;
const HISTORY_CONTENT_GAP = 28;

function createHistoryEntry({
  prompt,
  response,
  error,
  expertiseLevel,
  contextLabel,
  source,
}) {
  const normalizedPrompt =
    prompt?.trim() ||
    (source === "clipboard" ? "Fix clipboard error" : "Untitled conversation");

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    prompt: normalizedPrompt,
    response: response || null,
    error: error || null,
    expertiseLevel,
    contextLabel: contextLabel || "",
    source,
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const [query, setQuery] = useState("");
  const [expertiseLevel, setExpertiseLevel] = useState("intermediate");
  const { backendUrl } = useBackend();
  const { context, refreshContext, isCapturing } = useContext(backendUrl);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      const parsedHistory = storedHistory ? JSON.parse(storedHistory) : [];

      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        setHistory(parsedHistory);
        setActiveEntryId(parsedHistory[0].id);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore local storage write errors and keep the in-memory history.
    }
  }, [history]);

  const pushHistoryEntry = useCallback((entry) => {
    setHistory((previousHistory) => [entry, ...previousHistory].slice(0, HISTORY_LIMIT));
    setActiveEntryId(entry.id);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !backendUrl) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setActiveEntryId(null);

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
      const entry = createHistoryEntry({
        prompt: query,
        response: data,
        expertiseLevel,
        contextLabel: freshContext?.app_name || context?.app_name,
        source: "ask",
      });

      pushHistoryEntry(entry);
      setResponse(data);
      setQuery("");
    } catch (err) {
      const entry = createHistoryEntry({
        prompt: query,
        error: err.message,
        expertiseLevel,
        contextLabel: context?.app_name,
        source: "ask",
      });

      pushHistoryEntry(entry);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [query, backendUrl, expertiseLevel, refreshContext, context, pushHistoryEntry]);

  const handleErrorFix = useCallback(async () => {
    if (!context?.clipboard_content || !backendUrl) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setActiveEntryId(null);

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
      const entry = createHistoryEntry({
        prompt: "Fix clipboard error",
        response: data,
        expertiseLevel,
        contextLabel: context?.app_name,
        source: "clipboard",
      });

      pushHistoryEntry(entry);
      setResponse(data);
    } catch (err) {
      const entry = createHistoryEntry({
        prompt: "Fix clipboard error",
        error: err.message,
        expertiseLevel,
        contextLabel: context?.app_name,
        source: "clipboard",
      });

      pushHistoryEntry(entry);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [context, backendUrl, expertiseLevel, pushHistoryEntry]);

  const handleSelectHistory = useCallback((entryId) => {
    setActiveEntryId(entryId);
    setResponse(null);
    setError(null);
    setIsHistoryOpen(false);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setActiveEntryId(null);
    setResponse(null);
    setError(null);
  }, []);

  const activeEntry =
    history.find((entry) => entry.id === activeEntryId) || null;
  const displayedResponse = activeEntry?.response || response;
  const displayedError = activeEntry?.error || error;
  const historyOpenOffset = isHistoryOpen
    ? HISTORY_DRAWER_WIDTH + HISTORY_CONTENT_GAP
    : 0;

  return (
    <div className="fixed inset-0 flex flex-col p-4 text-white md:p-6">
      <ConversationHistory
        history={history}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen((open) => !open)}
        onSelectEntry={handleSelectHistory}
        onClear={handleClearHistory}
        activeEntryId={activeEntryId}
        drawerWidth={HISTORY_DRAWER_WIDTH}
      />

      <div
        style={{
          marginLeft: `${historyOpenOffset}px`,
          width: `calc(100% - ${historyOpenOffset}px)`,
          transition: "margin-left 300ms ease, width 300ms ease",
        }}
        className="flex h-full flex-col"
      >
        <Header
          expertiseLevel={expertiseLevel}
          onExpertiseChange={setExpertiseLevel}
        />

        <ContextBadge context={context} isCapturing={isCapturing} />

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-56 pt-6 md:px-3 md:pb-64 md:pt-8">
          {displayedResponse && <ResponsePanel response={displayedResponse} />}
          {displayedError && (
            <div className="rounded-2xl border border-red-300 border-opacity-50 bg-red-950 bg-opacity-20 p-3 text-sm text-red-50 backdrop-blur-sm">
              ⚠️ {displayedError}
            </div>
          )}
          {!displayedResponse && !displayedError && !isLoading && (
            <div className="mt-12 text-center text-sm text-stone-900">
              <p className="mb-2 text-2xl">🤖</p>
              <p className="font-medium text-stone-900">Ask me anything about your current app.</p>
              <p className="mt-1 text-xs text-stone-700">I see your active context.</p>
            </div>
          )}
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-stone-900">
              <span className="animate-spin">⟳</span>
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </div>

      <QueryInput
        query={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        onFixError={handleErrorFix}
        isLoading={isLoading}
        hasClipboard={!!context?.clipboard_content}
        leftOffset={historyOpenOffset}
      />
    </div>
  );
}
