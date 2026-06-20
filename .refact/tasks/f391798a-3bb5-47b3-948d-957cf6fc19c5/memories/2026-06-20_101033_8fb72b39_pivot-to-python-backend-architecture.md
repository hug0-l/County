---
created_at: "2026-06-20T02:10:33.912966+00:00"
task_id: f391798a-3bb5-47b3-948d-957cf6fc19c5
role: planner
title: "Pivot to Python Backend Architecture"
kind: decision
pinned: true
---

# Pivot to Python Backend Architecture

# Decision: Pivot to Python Backend (FastAPI + SQLite + ntplib)

## Motivation
- Real NTP (UDP 123) needed → browser can't do it, Python ntplib can
- Persistent multi-user database needed → SQLite > localStorage
- "開罐即用" user experience → `python server.py` starts everything

## Architecture
```
Python Backend (FastAPI)
├── ntplib → time.hko.hk (UDP NTP, ±1ms precision)
├── SQLite database (schedules, presets, config)
├── REST API endpoints
└── Serves static HTML

Browser (Frontend)
├── All CRUD operations → fetch('/api/*') instead of localStorage
├── NTP sync → fetch('/api/ntp/sync') instead of worldtimeapi
├── Core engine (CUE, timeline, matrix) → unchanged
└── localStorage fallback when server unreachable
```

## File Structure
```
vcc-countdownctrl/
├── server.py              # FastAPI server (single file for simplicity)
├── requirements.txt       # fastapi, uvicorn[standard], ntplib
├── templates/
│   └── index.html         # Modified SPA (fetch API instead of localStorage)
└── vcc_pre.db             # SQLite database (auto-created)
```

## Key Changes from SPA Plan
- T-1 NTPManager.sync() → now calls `/api/ntp/sync` (server does real NTP)
- T-2 Settings UI → settings stored in SQLite via `/api/config`
- T-3 Startup → `python server.py` auto-opens browser
- localStorage → API calls with localStorage fallback
