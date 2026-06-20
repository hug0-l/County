#!/usr/bin/env python3
"""
VCC PRE CountdownCtrl — Backend Server
FastAPI + SQLite + ntplib NTP syncing
Single-file server. python server.py to start.
"""

import json
import os
import sqlite3
import threading
import time
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

DB_PATH = Path(__file__).parent / "vcc_pre.db"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS schedules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            broadcast_date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            duration TEXT NOT NULL,
            periodic_type TEXT DEFAULT 'none',
            periodic_end_date TEXT DEFAULT '',
            periodic_days TEXT DEFAULT '[]',
            preset_id TEXT DEFAULT 'std_news',
            tags TEXT DEFAULT '[]',
            color_label TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS presets (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            nodes_json TEXT NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ntp_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            status TEXT NOT NULL,
            offset_ms REAL DEFAULT 0,
            server_url TEXT DEFAULT '',
            error_msg TEXT DEFAULT ''
        );
    """)
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Database Helpers
# ---------------------------------------------------------------------------


def generate_id(prefix='P_'):
    return f"{prefix}{int(time.time() * 1000)}"


def db_get_schedules() -> list:
    """Return all schedules as list of dicts."""
    conn = get_db()
    rows = conn.execute('SELECT * FROM schedules ORDER BY broadcast_date, start_time').fetchall()
    result = []
    for row in rows:
        d = dict(row)
        d['tags'] = json.loads(d.get('tags', '[]'))
        d['periodicDays'] = json.loads(d.get('periodic_days', '[]'))
        result.append(d)
    conn.close()
    return result


def db_get_schedule(id: str) -> dict | None:
    conn = get_db()
    row = conn.execute('SELECT * FROM schedules WHERE id=?', (id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['tags'] = json.loads(d.get('tags', '[]'))
        d['periodicDays'] = json.loads(d.get('periodic_days', '[]'))
        return d
    return None


def db_upsert_schedule(data: dict) -> dict:
    conn = get_db()
    tags_json = json.dumps(data.get('tags', []), ensure_ascii=False)
    days_json = json.dumps(data.get('periodicDays', []))
    conn.execute('''INSERT OR REPLACE INTO schedules 
        (id, name, broadcast_date, start_time, duration, periodic_type, 
         periodic_end_date, periodic_days, preset_id, tags, color_label)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)''',
        (data['id'], data['name'], data.get('broadcastDate', ''),
         data.get('startTime', ''), data.get('duration', ''),
         data.get('periodicType', 'none'), data.get('periodicEndDate', ''),
         days_json, data.get('presetId', 'std_news'),
         tags_json, data.get('colorLabel', '')))
    conn.commit()
    conn.close()
    return db_get_schedule(data['id'])


def db_delete_schedule(id: str) -> bool:
    conn = get_db()
    conn.execute('DELETE FROM schedules WHERE id=?', (id,))
    affected = conn.total_changes
    conn.commit()
    conn.close()
    return affected > 0


def db_get_presets() -> list:
    conn = get_db()
    rows = conn.execute('SELECT * FROM presets').fetchall()
    result = [dict(r) for r in rows]
    for r in result:
        r['nodes'] = json.loads(r.pop('nodes_json', '[]'))
    conn.close()
    return result


def db_get_preset(id: str) -> dict | None:
    conn = get_db()
    row = conn.execute('SELECT * FROM presets WHERE id=?', (id,)).fetchone()
    conn.close()
    if row:
        d = dict(row)
        d['nodes'] = json.loads(d.pop('nodes_json', '[]'))
        return d
    return None


def db_upsert_preset(data: dict) -> dict:
    conn = get_db()
    nodes_json = json.dumps(data.get('nodes', []), ensure_ascii=False)
    conn.execute('''INSERT OR REPLACE INTO presets (id, name, nodes_json)
        VALUES (?,?,?)''', (data['id'], data['name'], nodes_json))
    conn.commit()
    conn.close()
    return db_get_preset(data['id'])


def db_delete_preset(id: str) -> bool:
    conn = get_db()
    conn.execute('DELETE FROM presets WHERE id=?', (id,))
    affected = conn.total_changes
    conn.commit()
    conn.close()
    return affected > 0


def db_import_legacy(schedules: list, presets: dict):
    """Import from legacy localStorage dump."""
    for pid, pdata in presets.items():
        db_upsert_preset({
            'id': pid,
            'name': pdata.get('name', ''),
            'nodes': pdata.get('nodes', [])
        })
    for s in schedules:
        db_upsert_schedule(s)


# ---------------------------------------------------------------------------
# NTP Manager
# ---------------------------------------------------------------------------

class NTPManager:
    def __init__(self):
        self.status = 'local'  # 'connected' | 'fallback' | 'local' | 'syncing' | 'error'
        self.offset_ms = 0.0
        self.last_sync_time = None
        self.server_url = 'time.hko.hk'
        self.error_msg = ''

    def sync(self) -> dict:
        """Sync with NTP server using ntplib (UDP 123). Returns status dict."""
        self.status = 'syncing'
        try:
            import ntplib
            client = ntplib.NTPClient()
            response = client.request(self.server_url, version=3, timeout=5)
            self.offset_ms = response.offset * 1000  # seconds → ms
            self.last_sync_time = datetime.utcnow().isoformat()
            self.status = 'connected'
            self.error_msg = ''
            self._log_sync()
        except ImportError:
            self.error_msg = 'ntplib not installed'
            self.status = 'error' if self.offset_ms == 0 else 'fallback'
        except ntplib.NTPException as e:
            self.error_msg = str(e)
            self.status = 'fallback' if self.offset_ms != 0 else 'error'
        except Exception as e:
            self.error_msg = str(e)
            self.status = 'fallback' if self.offset_ms != 0 else 'error'
        return self.get_status()

    def get_status(self) -> dict:
        return {
            'status': self.status,
            'offset_ms': round(self.offset_ms, 2),
            'server': self.server_url,
            'last_sync': self.last_sync_time or '',
            'error_msg': self.error_msg
        }

    def _log_sync(self):
        try:
            conn = get_db()
            conn.execute(
                "INSERT INTO ntp_logs (timestamp, status, offset_ms, server_url, error_msg) "
                "VALUES (?, ?, ?, ?, ?)",
                (self.last_sync_time or datetime.utcnow().isoformat(),
                 self.status,
                 self.offset_ms,
                 self.server_url,
                 self.error_msg)
            )
            conn.commit()
            conn.close()
        except Exception:
            pass  # non-critical


# Global NTP manager instance
ntp_manager = NTPManager()

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="VCC PRE CountdownCtrl Backend", version="0.1")

# CORS — allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory
BASE_DIR = Path(__file__).parent
static_dir = BASE_DIR / "static"
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------


class ScheduleCreate(BaseModel):
    id: Optional[str] = None
    name: str
    broadcastDate: str
    startTime: str
    duration: str
    periodicType: str = 'none'
    periodicEndDate: str = ''
    periodicDays: list = []
    presetId: str = 'std_news'
    tags: list = []
    colorLabel: str = ''


class PresetCreate(BaseModel):
    id: Optional[str] = None
    name: str
    nodes: list = []


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup():
    init_db()


INDEX_HTML = BASE_DIR / "templates" / "index.html"


@app.get("/")
async def index():
    return FileResponse(str(INDEX_HTML))


@app.get("/api/ntp/status")
async def ntp_status():
    return JSONResponse(content=ntp_manager.get_status())


@app.post("/api/ntp/sync")
async def ntp_sync():
    result = ntp_manager.sync()
    return JSONResponse(content=result)


@app.get("/api/health")
async def health():
    return {"status": "ok", "db": str(DB_PATH.exists())}


# ---------------------------------------------------------------------------
# Schedule CRUD
# ---------------------------------------------------------------------------


@app.get("/api/schedule")
async def list_schedules():
    return db_get_schedules()


@app.get("/api/schedule/{schedule_id}")
async def get_schedule(schedule_id: str):
    s = db_get_schedule(schedule_id)
    if s is None:
        return JSONResponse(status_code=404, content={"error": "not found"})
    return s


@app.post("/api/schedule")
async def create_schedule(data: ScheduleCreate):
    doc = data.model_dump()
    if not doc.get('id'):
        doc['id'] = generate_id('SCH_')
    return db_upsert_schedule(doc)


@app.put("/api/schedule/{schedule_id}")
async def update_schedule(schedule_id: str, data: ScheduleCreate):
    existing = db_get_schedule(schedule_id)
    if existing is None:
        return JSONResponse(status_code=404, content={"error": "not found"})
    doc = data.model_dump()
    doc['id'] = schedule_id
    return db_upsert_schedule(doc)


@app.delete("/api/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str):
    if db_delete_schedule(schedule_id):
        return {"deleted": True}
    return JSONResponse(status_code=404, content={"error": "not found"})


# ---------------------------------------------------------------------------
# Preset CRUD
# ---------------------------------------------------------------------------


@app.get("/api/preset")
async def list_presets():
    return db_get_presets()


@app.get("/api/preset/{preset_id}")
async def get_preset(preset_id: str):
    p = db_get_preset(preset_id)
    if p is None:
        return JSONResponse(status_code=404, content={"error": "not found"})
    return p


@app.post("/api/preset")
async def create_preset(data: PresetCreate):
    doc = data.model_dump()
    if not doc.get('id'):
        doc['id'] = generate_id('PRS_')
    return db_upsert_preset(doc)


@app.put("/api/preset/{preset_id}")
async def update_preset(preset_id: str, data: PresetCreate):
    existing = db_get_preset(preset_id)
    if existing is None:
        return JSONResponse(status_code=404, content={"error": "not found"})
    doc = data.model_dump()
    doc['id'] = preset_id
    return db_upsert_preset(doc)


@app.delete("/api/preset/{preset_id}")
async def delete_preset(preset_id: str):
    if db_delete_preset(preset_id):
        return {"deleted": True}
    return JSONResponse(status_code=404, content={"error": "not found"})


# ---------------------------------------------------------------------------
# Import Legacy
# ---------------------------------------------------------------------------


class LegacyImport(BaseModel):
    schedules: list = []
    presets: dict = {}


@app.post("/api/import-legacy")
async def import_legacy(data: LegacyImport):
    db_import_legacy(data.schedules, data.presets)
    return {"imported": True, "schedules": len(data.schedules), "presets": len(data.presets)}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    print(f"Server running at http://localhost:8000")
    init_db()
    threading.Timer(1.5, lambda: webbrowser.open('http://localhost:8000')).start()
    uvicorn.run(app, host='0.0.0.0', port=8000)
