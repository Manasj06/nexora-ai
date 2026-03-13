# ⬡ Nexora AI

> A real-time, cross-platform, context-aware AI overlay assistant that integrates with any running application.

![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-blue)
![Stack](https://img.shields.io/badge/Stack-Electron%20%2B%20React%20%2B%20FastAPI-green)
![AI](https://img.shields.io/badge/AI-Claude%20%7C%20GPT--4o-purple)

---

## What It Does

Nexora AI sits as a lightweight overlay on your desktop. Press the global hotkey from **any application**, and it instantly:

- Detects your **active application and window title**
- Reads **clipboard content** (for auto error-detection)
- Sends your **query + context** to an AI model
- Returns **step-by-step, app-specific guidance**

---

## Project Structure

```
nexora-ai/
├── electron/
│   ├── main.js              # Electron entry: overlay window, hotkey, tray
│   └── preload.js           # Secure IPC bridge to renderer
│
├── renderer/
│   ├── public/index.html
│   └── src/
│       ├── App.jsx           # Root component
│       ├── index.js          # React entry
│       ├── index.css         # Tailwind + global styles
│       ├── components/
│       │   ├── Header.jsx        # Title bar + expertise selector
│       │   ├── ContextBadge.jsx  # Shows active app context
│       │   ├── QueryInput.jsx    # User input + error fix button
│       │   └── ResponsePanel.jsx # Renders AI response
│       └── hooks/
│           ├── useBackend.js     # Gets backend URL via IPC
│           └── useContext.js     # Polls active context every 5s
│
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings from .env
│   ├── context.py           # OS context capture (window, clipboard, screenshot)
│   ├── ai_engine.py         # Anthropic / OpenAI API calls
│   ├── prompt_builder.py    # Builds system + user prompts
│   ├── schemas.py           # Pydantic request/response models
│   └── routers/
│       ├── health.py        # GET /health
│       ├── context.py       # GET /context/capture
│       └── assist.py        # POST /assist/ask, /fix-error, /quick-ask
│
├── shared/                  # Shared constants (future use)
├── .env.example             # Environment variable template
├── requirements.txt         # Python dependencies
├── package.json             # Node/Electron dependencies
├── tailwind.config.js
└── README.md
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/nexora-ai.git
cd nexora-ai
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env and add your API key
```

### 3. Install Python backend dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install -r ../requirements.txt
```

### 4. Install Node/Electron dependencies

```bash
cd ..
npm install
```

### 5. Run in development mode

**Terminal 1 — Start the Python backend:**
```bash
cd backend
python main.py
```

**Terminal 2 — Start the Electron + React app:**
```bash
npm start
```

---

## Hotkey

Default: `Ctrl+Shift+Space` (Windows) / `Cmd+Shift+Space` (macOS)

Change it in `.env`:
```env
OVERLAY_HOTKEY=CommandOrControl+Shift+Space
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Backend health check |
| GET | `/context/capture` | Capture active app context |
| GET | `/context/clipboard` | Get clipboard text |
| POST | `/assist/ask` | Ask with full context object |
| POST | `/assist/ask/stream` | Streaming SSE response |
| POST | `/assist/fix-error` | Auto fix-focused from error text |
| POST | `/assist/quick-ask` | Ask with auto-captured context |

### Example Request

```json
POST /assist/ask
{
  "query": "How do I add a breakpoint?",
  "context": {
    "app_name": "VS Code",
    "window_title": "main.py — nexora-ai",
    "platform": "Windows",
    "error_message": null,
    "clipboard_content": null
  },
  "expertise_level": "intermediate"
}
```

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `anthropic` | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | — | Your Anthropic API key |
| `OPENAI_API_KEY` | — | Your OpenAI API key |
| `ANTHROPIC_MODEL` | `claude-opus-4-6` | Claude model to use |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model to use |
| `OVERLAY_HOTKEY` | `CommandOrControl+Shift+Space` | Global hotkey |
| `OVERLAY_WIDTH` | `420` | Overlay panel width |
| `OVERLAY_HEIGHT` | `600` | Overlay panel height |
| `ENABLE_CLIPBOARD_MONITOR` | `true` | Auto-read clipboard |
| `ENABLE_SCREENSHOT_CAPTURE` | `true` | Capture screen on invoke |

---

## Roadmap

- [ ] Voice invocation support
- [ ] Multi-monitor support
- [ ] App-specific prompt presets (VS Code, Figma, Excel...)
- [ ] History / session memory
- [ ] Mobile companion app (React Native)
- [ ] Plugin system for custom context providers

---

## License

MIT — feel free to build on this.
