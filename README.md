# ⚡ County — Broadcast Scheduling & Cue Engine (English)

![version](https://img.shields.io/badge/version-0.9-blue)
![python](https://img.shields.io/badge/python-3.10%2B-green)
![fastapi](https://img.shields.io/badge/FastAPI-%E2%9C%93-success)
![build](https://img.shields.io/github/actions/workflow/status/hug0-l/County/.github/workflows/build.yml?branch=main&label=build&logo=github)
![release](https://img.shields.io/github/v/release/hug0-l/County)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

County is a single-page application (SPA) with a Python FastAPI backend and SQLite persistence, designed for broadcast station scheduling and cue countdowns. It provides schedule CRUD, preset cue definitions, a cue trigger engine, timeline visualization, NTP time synchronization, and optional Clipper IM integration.

Quickstart
---------

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start server
python server.py

# Open http://localhost:8000 in your browser
```

Windows one-click: download the Release County.exe and run it (browser auto-opens).

Highlights
---------

- Backend: FastAPI + SQLite
- Frontend: single-file SPA served at / (templates/index.html) with modular static JS
- NTP-based time synchronization (server-side ntplib + browser offset)
- Cue engine using frame-based timecode (default PAL 25fps)
- Clipper IM client embedded for local P2P chat & file transfer
- PyInstaller spec included for building standalone binaries

Repository layout
-----------------

```
county/
├── server.py
├── requirements.txt
├── county.spec
├── tests/
│   └── smoke_test.py
├── templates/
│   └── index.html
├── static/
│   ├── county.css
│   ├── county-core.js
│   ├── county-helpers.js
│   ├── county-config.js
│   ├── county-api.js
│   ├── county-time.js
│   ├── county-log.js
│   ├── county-data.js
│   ├── county-sound.js
│   ├── county-engine.js
│   ├── county-ui-*.js
│   ├── clipper-sdk.js
│   └── ...
├── logs/
├── backups/
└── county.db
```

Frontend layout (ASCII diagram — preserves original layout order)
---------------------------------------------------------------

+---------------------------------------------------------+
| Sidebar (260px) |                 Main Content          |
|  ┌───────────────────────────────────────────────────┐  |
|  │ County control center menu                         │  |
|  │ [Live] [Rundown] [Preset] [Settings] [Clipper]     │  |
|  └───────────────────────────────────────────────────┘  |
|                                                         |
|  Status Bar (clock + NTP)                                |
|  -----------------------------------------------------   |
|  Page Area (dynamic):                                     |
|   - page-live: MCR dashboard, cue countdowns, timeline    |
|   - page-rundown: calendar, schedule CRUD                 |
|   - page-preset: preset editor                            |
|   - page-settings: NTP, audio, FPS, timezone              |
+---------------------------------------------------------+

Key concepts and time model
---------------------------

- Time is represented as timecode HH:MM:SS:FF and converted to total frames using the configured frameRate (default 25 fps). Functions:
  - dateToTimecode(date) -> "HH:MM:SS:FF"
  - timecodeToTotalFrames(tc) -> number
  - totalFramesToTimecode(frames) -> "HH:MM:SS:FF"

Data models (summary)
---------------------

masterScheduleDB (array of program objects):

```json
[{
  "id": "P_1746000000000",
  "name": "Evening News",
  "broadcastDate": "2026-06-19",
  "startTime": "18:30:00:00",
  "duration": "00:30:00:00",
  "periodicType": "daily|weekdays|weekly|custom|none",
  "presetId": "std_news",
  "tags": ["live","priority"],
  "colorLabel": "#ef4444"
}]
```

cuePresets (object keyed by preset id):

```json
{
  "std_news": {
    "name": "Standard News",
    "nodes": [ { "offset": -30, "name": "Pre-Air 30s", "soundId": "bell", "freq": 600 } ]
  }
}
```

Global triggers (engine-expanded):

```json
[{ "progId":"P_...","progName":"Evening News","cueName":"Pre-Air 30s","targetFrames":1665000,"timecodeStr":"18:29:30:00","triggered":false }]
```

Engine lifecycle (ASCII flow)
----------------------------

initGlobalTracking()
  -> calculateGlobalTimelineMatrix(false)
     -> getExpandedRundownForDate(targetDate)
     -> build globalTriggers (one entry per preset node)
  -> start timer (40 ms interval)
     -> on each tick: updateGlobalDashboard() or checkCueTriggersOnly()

Cue trigger logic (pseudocode):

- For each globalTrigger:
  - diff = targetFrames - currentTotalFrames
  - if diff <= 0 && diff > -retentionFrames:
      - trigger cue: play sound + show popup + mark triggered
  - else update visual highlighting (top1/top2/top3)

Event flow (sequence simplified ASCII)
-------------------------------------

User -> UI: add/edit program
UI -> Data: submitProgramForm()
Data -> localStorage: save
User -> UI: start engine
UI -> Engine: initGlobalTracking()
Engine -> Timer: every 40ms check triggers
Engine -> Audio: playBroadcastBeep() when cue fires

NTP time sync (ASCII)
---------------------

Browser (NTPManager.js) --HTTP--> FastAPI /api/ntp/sync --ntplib--> stdtime.gov.hk (UDP 123)
FastAPI returns { status, offset_ms, ntpValid } -> Browser applies offset to getCalibratedDate()

Storage and offline behavior
---------------------------

- Primary storage: county.db (SQLite). Tables: schedules, presets, config, ntp_logs.
- Frontend caches data to localStorage keys: county_master_db_v8, county_presets_v8, county_config_v8.
- When backend unavailable, frontend falls back to localStorage (read/write) to continue operation.

Files & Endpoints (examples)
----------------------------

- server.py: FastAPI server implementing REST endpoints and NTP sync
- GET /api/health
- POST /api/ntp/sync
- /api/schedule (CRUD)
- /api/preset (CRUD)

Troubleshooting notes
---------------------

- If the UI shows incorrect time: check server logs for ntplib errors, confirm UDP 123 is allowed.
- If many cues (>200) degrade performance: consider raising timer interval or splitting frontend JS modules.
- Backups are written to backups/; check logs/ for server diagnostics.

License
-------

MIT — see repository LICENSE if present.

---

*This English README was created to match the original project's structure and diagrams (ASCII/Markdown) and to be committed into the repository.*
