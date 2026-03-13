import React, { useState, useCallback, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import Header from "./components/Header";
import QueryInput from "./components/QueryInput";
import ResponsePanel from "./components/ResponsePanel";
import ContextBadge from "./components/ContextBadge";
import ConversationHistory from "./components/ConversationHistory";
import {
  decryptHistoryEntry,
  encryptHistoryEntry,
  importHistoryKey,
} from "./lib/secureHistory";
import { useBackend } from "./hooks/useBackend";
import { useContext } from "./hooks/useContext";

const HISTORY_LIMIT = 25;
const HISTORY_DRAWER_WIDTH = 296;
const HISTORY_CONTENT_GAP = 28;
const AUTH_SESSION_STORAGE_KEY = "nexora-auth-session";
const AUTH_HISTORY_KEY_STORAGE_KEY = "nexora-history-key";
const LAST_ACCOUNT_STORAGE_KEY = "nexora-last-account-email";

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
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [historyKey, setHistoryKey] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lastAccountEmail, setLastAccountEmail] = useState("");
  const { context, refreshContext, isCapturing } = useContext(backendUrl, authToken);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeEntryId, setActiveEntryId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    try {
      setLastAccountEmail(
        window.localStorage.getItem(LAST_ACCOUNT_STORAGE_KEY) || "",
      );
    } catch {
      setLastAccountEmail("");
    }
  }, []);

  const clearPersistedSession = useCallback(() => {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_HISTORY_KEY_STORAGE_KEY);
    setAuthUser(null);
    setAuthToken(null);
    setHistoryKey(null);
    setHistory([]);
    setActiveEntryId(null);
    setResponse(null);
    setError(null);
    setQuery("");
    setIsHistoryOpen(false);
  }, []);

  useEffect(() => {
    if (!backendUrl) return;

    let isCancelled = false;

    const restoreSession = async () => {
      const storedSession = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      const storedKey = window.sessionStorage.getItem(AUTH_HISTORY_KEY_STORAGE_KEY);

      if (!storedSession || !storedKey) {
        setIsAuthReady(true);
        return;
      }

      try {
        const session = JSON.parse(storedSession);
        const keyPayload = JSON.parse(storedKey);

        const sessionResponse = await fetch(`${backendUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
        });

        if (!sessionResponse.ok) {
          throw new Error("Session expired");
        }

        const user = await sessionResponse.json();
        const importedKey = await importHistoryKey(keyPayload);

        if (!isCancelled) {
          setAuthUser(user);
          setAuthToken(session.token);
          setHistoryKey(importedKey);
          setLastAccountEmail(user.email);
        }
      } catch {
        if (!isCancelled) {
          clearPersistedSession();
        }
      } finally {
        if (!isCancelled) {
          setIsAuthReady(true);
        }
      }
    };

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, [backendUrl, clearPersistedSession]);

  const pushHistoryEntry = useCallback((entry) => {
    setHistory((previousHistory) => [entry, ...previousHistory].slice(0, HISTORY_LIMIT));
    setActiveEntryId(entry.id);
  }, []);

  const buildAuthHeaders = useCallback(
    (includeJson = false) => {
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };

      if (includeJson) {
        headers["Content-Type"] = "application/json";
      }

      return headers;
    },
    [authToken],
  );

  const persistHistoryEntry = useCallback(
    async (entry) => {
      if (!backendUrl || !authToken || !historyKey) {
        throw new Error("Sign in again to save encrypted history.");
      }

      const encryptedEntry = await encryptHistoryEntry(historyKey, entry);
      const responseFromServer = await fetch(`${backendUrl}/history/`, {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify(encryptedEntry),
      });

      const responseBody = await responseFromServer.json();

      if (responseFromServer.status === 401) {
        clearPersistedSession();
        throw new Error("Your session expired. Please sign in again.");
      }

      if (!responseFromServer.ok) {
        throw new Error(responseBody.detail || "Failed to save encrypted history.");
      }

      return {
        ...entry,
        id: String(responseBody.id),
        createdAt: responseBody.created_at || entry.createdAt,
      };
    },
    [backendUrl, authToken, historyKey, buildAuthHeaders, clearPersistedSession],
  );

  const loadEncryptedHistory = useCallback(
    async (token, key) => {
      if (!backendUrl || !token || !key) {
        setHistory([]);
        setActiveEntryId(null);
        return;
      }

      const historyResponse = await fetch(`${backendUrl}/history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (historyResponse.status === 401) {
        clearPersistedSession();
        return;
      }

      const historyPayload = await historyResponse.json();

      if (!historyResponse.ok) {
        throw new Error(historyPayload.detail || "Failed to load encrypted history.");
      }

      const decryptedHistory = (
        await Promise.all(
          historyPayload.map(async (entry) => {
            const decryptedEntry = await decryptHistoryEntry(key, entry);

            if (!decryptedEntry) {
              return null;
            }

            return {
              ...decryptedEntry,
              id: String(entry.id),
              createdAt: decryptedEntry.createdAt || entry.created_at,
            };
          }),
        )
      ).filter(Boolean);

      setHistory(decryptedHistory);
      setActiveEntryId(decryptedHistory[0]?.id || null);
    },
    [backendUrl, clearPersistedSession],
  );

  useEffect(() => {
    if (!authToken || !historyKey || !backendUrl) {
      setHistory([]);
      setActiveEntryId(null);
      return;
    }

    loadEncryptedHistory(authToken, historyKey).catch((historyError) => {
      setError(historyError.message || "Failed to load encrypted history.");
    });
  }, [authToken, historyKey, backendUrl, loadEncryptedHistory]);

  const handleAuthenticated = useCallback(({ auth, historyKey: nextHistoryKey, exportedHistoryKey }) => {
    window.sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: auth.token,
        expires_at: auth.expires_at,
      }),
    );
    window.sessionStorage.setItem(
      AUTH_HISTORY_KEY_STORAGE_KEY,
      JSON.stringify(exportedHistoryKey),
    );
    window.localStorage.setItem(LAST_ACCOUNT_STORAGE_KEY, auth.user.email);

    setAuthUser(auth.user);
    setAuthToken(auth.token);
    setHistoryKey(nextHistoryKey);
    setLastAccountEmail(auth.user.email);
    setResponse(null);
    setError(null);
    setHistory([]);
    setActiveEntryId(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    if (backendUrl && authToken) {
      try {
        await fetch(`${backendUrl}/auth/signout`, {
          method: "POST",
          headers: buildAuthHeaders(),
        });
      } catch {
        // Ignore signout network issues and clear the local session anyway.
      }
    }

    clearPersistedSession();
  }, [backendUrl, authToken, buildAuthHeaders, clearPersistedSession]);

  const handleSubmit = useCallback(async () => {
    if (!query.trim() || !backendUrl || !authToken) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setActiveEntryId(null);

    try {
      // Refresh context right before asking
      const freshContext = await refreshContext();

      const res = await fetch(`${backendUrl}/assist/ask`, {
        method: "POST",
        headers: buildAuthHeaders(true),
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
      const draftEntry = createHistoryEntry({
        prompt: query,
        response: data,
        expertiseLevel,
        contextLabel: freshContext?.app_name || context?.app_name,
        source: "ask",
      });

      setResponse(data);
      setQuery("");

      const savedEntry = await persistHistoryEntry(draftEntry);
      pushHistoryEntry(savedEntry);
    } catch (err) {
      setError(err.message);

      try {
        const draftEntry = createHistoryEntry({
          prompt: query,
          error: err.message,
          expertiseLevel,
          contextLabel: context?.app_name,
          source: "ask",
        });
        const savedEntry = await persistHistoryEntry(draftEntry);
        pushHistoryEntry(savedEntry);
      } catch {
        // If saving the failure entry also fails, keep the current screen state.
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    query,
    backendUrl,
    authToken,
    expertiseLevel,
    refreshContext,
    context,
    buildAuthHeaders,
    persistHistoryEntry,
    pushHistoryEntry,
  ]);

  const handleErrorFix = useCallback(async () => {
    if (!context?.clipboard_content || !backendUrl || !authToken) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setActiveEntryId(null);

    try {
      const res = await fetch(`${backendUrl}/assist/fix-error`, {
        method: "POST",
        headers: buildAuthHeaders(true),
        body: JSON.stringify({
          error_text: context.clipboard_content,
          app_name: context.app_name,
          expertise_level: expertiseLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to fix clipboard error.");
      }

      const draftEntry = createHistoryEntry({
        prompt: "Fix clipboard error",
        response: data,
        expertiseLevel,
        contextLabel: context?.app_name,
        source: "clipboard",
      });

      setResponse(data);

      const savedEntry = await persistHistoryEntry(draftEntry);
      pushHistoryEntry(savedEntry);
    } catch (err) {
      setError(err.message);

      try {
        const draftEntry = createHistoryEntry({
          prompt: "Fix clipboard error",
          error: err.message,
          expertiseLevel,
          contextLabel: context?.app_name,
          source: "clipboard",
        });
        const savedEntry = await persistHistoryEntry(draftEntry);
        pushHistoryEntry(savedEntry);
      } catch {
        // Ignore secondary history-save failures here.
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    context,
    backendUrl,
    authToken,
    expertiseLevel,
    buildAuthHeaders,
    persistHistoryEntry,
    pushHistoryEntry,
  ]);

  const handleSelectHistory = useCallback((entryId) => {
    setActiveEntryId(entryId);
    setResponse(null);
    setError(null);
    setIsHistoryOpen(false);
  }, []);

  const handleClearHistory = useCallback(async () => {
    if (!backendUrl || !authToken) return;

    try {
      const historyResponse = await fetch(`${backendUrl}/history/`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      const historyPayload = await historyResponse.json();

      if (historyResponse.status === 401) {
        clearPersistedSession();
        return;
      }

      if (!historyResponse.ok) {
        throw new Error(historyPayload.detail || "Failed to clear encrypted history.");
      }

      setHistory([]);
      setActiveEntryId(null);
      setResponse(null);
      setError(null);
    } catch (historyError) {
      setError(historyError.message || "Failed to clear encrypted history.");
    }
  }, [backendUrl, authToken, buildAuthHeaders, clearPersistedSession]);

  if (!backendUrl || !isAuthReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 text-stone-900">
        <div className="rounded-[32px] border border-white border-opacity-30 bg-white bg-opacity-16 px-8 py-6 shadow-xl backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-900">
            Nexora AI
          </p>
          <p className="mt-3 text-base font-medium text-stone-950">
            Loading your secure workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!authUser || !authToken || !historyKey) {
    return (
      <AuthScreen
        backendUrl={backendUrl}
        lastAccountEmail={lastAccountEmail}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

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
          user={authUser}
          onSignOut={handleSignOut}
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
