/**
 * Nexora AI — Electron Preload Script
 * Safely exposes IPC methods to the renderer process
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexora", {
  // Get backend URL from main process
  getBackendUrl: () => ipcRenderer.invoke("get-backend-url"),

  // Hide the overlay window
  hideOverlay: () => ipcRenderer.invoke("hide-overlay"),

  // Resize overlay
  resizeOverlay: (dimensions) =>
    ipcRenderer.invoke("resize-overlay", dimensions),
});
