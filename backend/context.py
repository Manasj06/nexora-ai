"""
Nexora AI — Context Capture Module
Detects active application, window title, clipboard, and optional screenshot
"""

import platform
import base64
import io
import psutil
import pyperclip
from PIL import ImageGrab
from typing import Optional
from schemas import AppContext

# ─── Platform Detection ───────────────────────────────────────────────────────
PLATFORM = platform.system()  # "Windows" | "Darwin" | "Linux"


def get_active_window_info() -> dict:
    """Returns active window title and application name."""
    title = "Unknown"
    app_name = "Unknown"

    try:
        if PLATFORM == "Windows":
            import pygetwindow as gw
            win = gw.getActiveWindow()
            if win:
                title = win.title
                # Extract app name from window title (heuristic)
                parts = title.split(" — ")
                app_name = parts[-1].strip() if len(parts) > 1 else title

        elif PLATFORM == "Darwin":
            # macOS: use AppKit via subprocess
            import subprocess
            script = 'tell application "System Events" to get name of first application process whose frontmost is true'
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True, text=True
            )
            app_name = result.stdout.strip() or "Unknown"

            script_title = 'tell application "System Events" to get title of front window of (first application process whose frontmost is true)'
            result_title = subprocess.run(
                ["osascript", "-e", script_title],
                capture_output=True, text=True
            )
            title = result_title.stdout.strip() or app_name

    except Exception as e:
        print(f"[Context] Window detection error: {e}")

    return {"app_name": app_name, "window_title": title}


def get_active_process_name() -> str:
    """Returns the executable name of the foreground process."""
    try:
        if PLATFORM == "Windows":
            import win32gui
            import win32process
            hwnd = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            proc = psutil.Process(pid)
            return proc.name()
    except Exception as e:
        print(f"[Context] Process detection error: {e}")
    return "unknown"


def get_clipboard_content() -> Optional[str]:
    """Returns current clipboard text content, if any."""
    try:
        content = pyperclip.paste()
        return content if content and content.strip() else None
    except Exception:
        return None


def capture_screenshot() -> Optional[str]:
    """
    Captures a screenshot of the primary display.
    Returns base64-encoded PNG string.
    """
    try:
        screenshot = ImageGrab.grab()
        # Downscale for performance
        screenshot = screenshot.resize(
            (screenshot.width // 2, screenshot.height // 2)
        )
        buffer = io.BytesIO()
        screenshot.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return encoded
    except Exception as e:
        print(f"[Context] Screenshot error: {e}")
        return None


def build_context(
    include_screenshot: bool = False,
    include_clipboard: bool = True,
) -> AppContext:
    """
    Builds a full AppContext object from the current system state.
    Called just before an AI request is made.
    """
    window_info = get_active_window_info()
    clipboard = get_clipboard_content() if include_clipboard else None
    screenshot = capture_screenshot() if include_screenshot else None

    return AppContext(
        app_name=window_info["app_name"],
        window_title=window_info["window_title"],
        platform=PLATFORM,
        clipboard_content=clipboard,
        screenshot_base64=screenshot,
    )
