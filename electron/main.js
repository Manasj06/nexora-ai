/**
 * Nexora AI — Electron Main Process
 * Manages the overlay window, global hotkey, and IPC bridge
 */

const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// ─── Config ──────────────────────────────────────────────────────────────────
const OVERLAY_WIDTH = parseInt(process.env.OVERLAY_WIDTH) || 420;
const OVERLAY_HEIGHT = parseInt(process.env.OVERLAY_HEIGHT) || 600;
const HOTKEY = process.env.OVERLAY_HOTKEY || "CommandOrControl+Shift+Space";
const BACKEND_URL = `http://${process.env.BACKEND_HOST || "127.0.0.1"}:${
  process.env.BACKEND_PORT || 8000
}`;

let overlayWindow = null;
let tray = null;
let backendProcess = null;

function resolvePythonBin() {
  const repoVenvPython =
    process.platform === "win32"
      ? path.join(__dirname, "../backend/venv/Scripts/python.exe")
      : path.join(__dirname, "../backend/venv/bin/python");

  if (fs.existsSync(repoVenvPython)) {
    return repoVenvPython;
  }

  return (
    process.env.NEXORA_PYTHON_BIN ||
    process.env.PYTHON_BIN ||
    (process.platform === "win32" ? "python" : "python3")
  );
}

// ─── Backend Launcher ────────────────────────────────────────────────────────
function startBackend() {
  const backendPath = path.join(__dirname, "../backend/main.py");
  const pythonBin = resolvePythonBin();
  backendProcess = spawn(pythonBin, [backendPath], {
    env: { ...process.env },
    stdio: "pipe",
  });

  backendProcess.on("error", (error) => {
    console.error(`[Backend] failed to start with '${pythonBin}':`, error);
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend Error] ${data}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`[Backend] exited with code ${code}`);
  });
}

// ─── Overlay Window ──────────────────────────────────────────────────────────
function createOverlayWindow() {
  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: screenWidth - OVERLAY_WIDTH - 20,
    y: screenHeight - OVERLAY_HEIGHT - 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  const url = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`;

  overlayWindow.loadURL(url);

  // Hide when focus is lost
  overlayWindow.on("blur", () => {
    overlayWindow.hide();
  });
}

// ─── Tray Icon ───────────────────────────────────────────────────────────────
function createTray() {
  // Use a blank icon as placeholder — replace with your icon asset
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Show Nexora AI (${HOTKEY})`,
      click: () => toggleOverlay(),
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Nexora AI Assistant");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => toggleOverlay());
}

// ─── Toggle Overlay ──────────────────────────────────────────────────────────
function toggleOverlay() {
  if (!overlayWindow) return;

  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
  } else {
    overlayWindow.show();
    overlayWindow.focus();
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.handle("get-backend-url", () => BACKEND_URL);

ipcMain.handle("hide-overlay", () => {
  overlayWindow?.hide();
});

ipcMain.handle("resize-overlay", (_, { width, height }) => {
  overlayWindow?.setSize(width, height);
});

// ─── App Lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend();
  createOverlayWindow();
  createTray();

  // Register global hotkey
  const registered = globalShortcut.register(HOTKEY, () => {
    toggleOverlay();
  });

  if (!registered) {
    console.error(`[Hotkey] Failed to register: ${HOTKEY}`);
  } else {
    console.log(`[Hotkey] Registered: ${HOTKEY}`);
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (backendProcess) backendProcess.kill();
});

// Keep app running in tray even with all windows closed
app.on("window-all-closed", (e) => e.preventDefault());
