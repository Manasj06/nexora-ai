import { useState, useEffect } from "react";

/**
 * Retrieves the backend URL from the Electron preload bridge,
 * or falls back to localhost for browser dev mode.
 */
export function useBackend() {
  const [backendUrl, setBackendUrl] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (window.nexora?.getBackendUrl) {
          const url = await window.nexora.getBackendUrl();
          setBackendUrl(url);
        } else {
          // Fallback for browser dev mode
          setBackendUrl("http://127.0.0.1:8000");
        }
      } catch {
        setBackendUrl("http://127.0.0.1:8000");
      }
    };
    load();
  }, []);

  return { backendUrl };
}
