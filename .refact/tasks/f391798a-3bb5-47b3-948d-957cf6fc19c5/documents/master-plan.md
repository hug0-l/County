---
name: "NTP Time Service - Master Plan"
slug: "master-plan"
kind: "plan"
created_at: "2026-06-20T01:58:19.540525000Z"
updated_at: "2026-06-20T02:36:59.029310000Z"
author_role: "planner"
pinned: true
version: 3
---

# 🐍 Python Backend + NTP Time Service — Master Plan

## Goal
Convert VPre CountdownCtrl from pure-SPA (localStorage + HTTP API) to a **Python-backed web application** with real NTP time sync, persistent SQLite database, and one-command startup (`python server.py`).

## Architecture

```
┌─────────────────────────────────────┐
│   Python FastAPI Server (server.py) │
│                                     │
│  ┌───────────┐  ┌────────────────┐  │
│  │ ntplib    │  │ SQLite         │  │
│  │ time.hko  │  │ schedules      │  │
│  │ .hk (NTP) │  │ presets        │  │
│  │           │  │ config         │  │
│  └───────────┘  └────────────────┘  │
│         │                │          │
│    /api/ntp/*     /api/schedule/*   │
│                   /api/preset/*     │
│                   /api/config       │
│                   /api/backup       │
│                                     │
│  Serves: templates/index.html       │
└──────────────┬──────────────────────┘
               │ fetch(JSON)
┌──────────────┴──────────────────────┐
│  Browser (Frontend SPA)             │
│                                     │
│  - CRUD → API calls (fallback to    │
│    localStorage if server unreach.) │
│  - NTP   → /api/ntp/sync            │
│  - Engine (CUE, matrix, timeline)   │
│    unchanged                        │
│  - Clipper IM tab → WebSocket       │
│    ws://localhost:8765               │
└─────────────────────────────────────┘
```

## Files
| File | Purpose |
|------|---------|
| `server.py` | FastAPI server (single file): routes, DB, NTP, static serving |
| `requirements.txt` | Python dependencies |
| `templates/index.html` | SPA, modified to call backend API + Clipper IM tab |
| `vcc_pre.db` | SQLite database (auto-created) |

## Cards

| Card | Title | Depends | Status |
|------|-------|---------|--------|
| T-1 | NTP Core Service + Config Schema (SPA) | — | ✅ |
| BE-1 | Backend Core + NTP Service | — | ✅ |
| BE-2 | Schedule & Preset CRUD API | BE-1 | ✅ |
| BE-3 | Config & Backup API | BE-2 | ✅ |
| FE-1 | Frontend API Integration | BE-3 | ✅ |
| FE-2 | Frontend NTP + Settings Panel + Startup | FE-1 | ✅ |
| FE-3 | Docs + Polish | FE-2 | ▶️ |
| CL-1 | Clipper IM Tab | FE-2 | ⏳ |

## Non-Goals
- User authentication/login
- Docker deployment (optional future)
- Multi-master replication
