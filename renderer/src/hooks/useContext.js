import { useState, useCallback, useEffect } from "react";

/**
 * Fetches and refreshes the active application context from the backend.
 */
export function useContext(backendUrl) {
  const [context, setContext] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const refreshContext = useCallback(async () => {
    if (!backendUrl) return null;
    setIsCapturing(true);
    try {
      const res = await fetch(`${backendUrl}/context/capture`);
      if (res.ok) {
        const data = await res.json();
        setContext(data);
        return data;
      }
    } catch (err) {
      console.error("[Context] Failed to capture:", err);
    } finally {
      setIsCapturing(false);
    }
    return null;
  }, [backendUrl]);

  // Auto-capture context on mount and every 5 seconds
  useEffect(() => {
    if (!backendUrl) return;

    refreshContext();
    const interval = setInterval(refreshContext, 5000);
    return () => clearInterval(interval);
  }, [backendUrl, refreshContext]);

  return { context, refreshContext, isCapturing };
}
