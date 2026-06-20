---
created_at: "2026-06-20T02:41:02.896293+00:00"
task_id: f391798a-3bb5-47b3-948d-957cf6fc19c5
role: agents
agent_id: bced8aaa-d5e8-4d9f-aff0-11dc11c7399c
card_id: FE-3
title: "FE-3 Docs + Polish Completed"
kind: progress
namespace: card:FE-3
---

# FE-3 Docs + Polish Completed

## FE-3: Docs + Polish — Complete

Updated all documentation to reflect v0.6 Python backend architecture:

### README.md
- Added "Quick Start" section at the very top with `pip install -r requirements.txt && python server.py`
- Updated file structure (Section 2) to include server.py, requirements.txt, templates/, backups/, vcc_pre.db
- Added SQLite storage section (9.1) with database table reference
- Updated localStorage section (9.2) as offline fallback
- Updated Section 10.3 (data security) to reflect SQLite + auto-backup
- Fully rewritten NTP section (11) to reflect Python ntplib backend (time.hko.hk via UDP 123)
- Added Section 11 to the table of contents

### AGENTS.md
- Updated project overview to "Python 後端 + 前端 SPA 混合架構"
- Updated file structure with server.py, requirements.txt, templates/, backups/
- Rewrote NTP time service section with frontend→backend→ntplib flow diagram
- Updated gotchas: backend-first, UDP port 123, SQLite database, localStorage as fallback
- Updated development tips (use python server.py for testing)
- Updated verification checklist with server tests

### CHANGELOG.md
- Replaced old v0.6 entry with new architecture-focused one covering:
  - Python backend upgrade (FastAPI + SQLite + ntplib)
  - Real NTP sync via time.hko.hk
  - Multi-user sharing, auto-backup, offline fallback

### server.py — Verified
- Auto-open browser via `threading.Timer(1.5, lambda: webbrowser.open('http://localhost:8000')).start()` at line 589

### requirements.txt — Verified
- All deps present: fastapi, uvicorn, ntplib, jinja2, python-multipart