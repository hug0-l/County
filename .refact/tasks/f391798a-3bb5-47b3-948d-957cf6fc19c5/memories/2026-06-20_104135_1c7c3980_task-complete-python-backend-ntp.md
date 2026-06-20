---
created_at: "2026-06-20T02:41:35.980612+00:00"
task_id: f391798a-3bb5-47b3-948d-957cf6fc19c5
role: planner
title: "Task Complete — Python Backend + NTP + Clipper IM"
kind: postmortem
pinned: true
---

# Task Complete — Python Backend + NTP + Clipper IM

# Postmortem: Python Backend + NTP + Clipper IM

## Completed Cards

| Card | Title | Status |
|------|-------|:------:|
| T-1 | NTP Core SPA (NTPManager, status UI) | ✅ |
| BE-1 | FastAPI server + ntplib (time.hko.hk) | ✅ |
| BE-2 | Schedule & Preset CRUD REST API | ✅ |
| BE-3 | Config & Backup API (auto-backup) | ✅ |
| FE-1 | Frontend API Integration (localStorage→fetch) | ✅ |
| FE-2 | NTP Panel + Settings UI + Startup | ✅ |
| FE-3 | Docs (README, AGENTS, CHANGELOG) | ✅ |
| CL-1 | Clipper IM Chat Tab (WebSocket) | ✅ |

## Architecture Summary
- **server.py**: FastAPI + SQLite + ntplib NTP (time.hko.hk UDP 123)
- **templates/index.html**: SPA with API client, localStorage fallback, Clipper IM tab
- **One command**: `pip install -r requirements.txt && python server.py`

## Key Decisions
- Used FileResponse instead of Jinja2 (compatibility bug)
- API calls are all fire-and-forget (non-blocking)
- localStorage is primary, server is secondary
- Clipper tab uses WS relay mode (no WebRTC needed for text chat)
