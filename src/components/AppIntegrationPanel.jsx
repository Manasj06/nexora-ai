import React from "react";

function formatConnectedTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function AppIntegrationPanel({
  isOpen,
  onClose,
  onStartIntegration,
  onAnalyzeIntegratedApp,
  onDisconnect,
  currentContext,
  integrationTarget,
  pendingAction,
  countdown,
  isBusy,
}) {
  if (!isOpen) return null;

  const currentAppLabel = currentContext?.app_name || "No live app detected yet";
  const currentWindowLabel =
    currentContext?.window_title && currentContext.window_title !== currentContext.app_name
      ? currentContext.window_title
      : "Bring the app you want to inspect to the front during capture.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#5f4531]/24 p-4 backdrop-blur-sm md:p-6">
      <div className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/45 bg-[#f2e2cf]/95 p-5 text-[#5f4531] shadow-2xl backdrop-blur-xl md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#b78459] text-sm font-semibold text-[#fff8f1] shadow-sm">
                M
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b5b41]">
                  Live Integration
                </p>
                <h2 className="mt-1 text-xl font-semibold leading-tight text-[#3f2c1f] md:text-2xl">
                  Connect Nexora to the app you are working in
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6e5240]">
              Use this when you want Nexora to inspect a live application directly.
              Start the capture, switch to your editor, browser, terminal, or app,
              and Nexora will pin that frontmost window as your integrated workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-2xl border border-white/55 bg-white/65 px-4 py-2 text-sm font-medium text-[#5f4531] transition hover:bg-white/80"
          >
            Close
          </button>
        </div>

        {pendingAction && (
          <div className="mt-5 rounded-2xl border border-[#c49c75]/50 bg-[#f8ecd9] px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5b2f]">
              {pendingAction === "integrate" ? "Capturing app" : "Analyzing live app"}
            </p>
            <p className="mt-2 text-sm text-[#5f4531]">
              Switch to the live application you want Nexora to read. Capture starts in{" "}
              <span className="font-semibold">{countdown}</span> second
              {countdown === 1 ? "" : "s"}.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/45 bg-white/60 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b5b41]">
              Current live app
            </p>
            <p className="mt-2 text-lg font-semibold text-[#3f2c1f]">{currentAppLabel}</p>
            <p className="mt-2 text-sm leading-6 text-[#6e5240]">{currentWindowLabel}</p>
          </div>

          <div className="rounded-[24px] border border-white/45 bg-white/60 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b5b41]">
              Integrated app
            </p>
            {integrationTarget ? (
              <>
                <p className="mt-2 text-lg font-semibold text-[#3f2c1f]">
                  {integrationTarget.appName}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#6e5240]">
                  {integrationTarget.windowTitle || "Live app connection ready."}
                </p>
                <p className="mt-2 text-xs text-[#7b5b41]">
                  Connected at {formatConnectedTime(integrationTarget.connectedAt)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[#6e5240]">
                No app is connected yet. Start a capture and switch to the app you want
                Nexora to watch.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStartIntegration}
            disabled={isBusy || !!pendingAction}
            className="rounded-2xl bg-[#b78459] px-4 py-3 text-sm font-medium text-[#fff8f1] shadow-sm transition hover:bg-[#a6744c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {integrationTarget ? "Reconnect to another app" : "Integrate next active app"}
          </button>

          <button
            type="button"
            onClick={onAnalyzeIntegratedApp}
            disabled={!integrationTarget || isBusy || !!pendingAction}
            className="rounded-2xl border border-white/55 bg-white/70 px-4 py-3 text-sm font-medium text-[#5f4531] shadow-sm transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Analyze integrated app
          </button>

          {integrationTarget && (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={isBusy || !!pendingAction}
              className="rounded-2xl border border-[#c68b80]/50 bg-[#efd0ca]/75 px-4 py-3 text-sm font-medium text-[#91433a] shadow-sm transition hover:bg-[#e7c2ba] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Disconnect app
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
