#!/usr/bin/env python3
"""
VCC PRE CountdownCtrl — Backend Server
FastAPI + SQLite + ntplib NTP syncing
Single-file server. python server.py to start.
"""

import os
import sys
import sqlite3
import threading
import webbrowser
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
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
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    print(f"Server running at http://localhost:8000")
    init_db()
    threading.Timer(1.5, lambda: webbrowser.open('http://localhost:8000')).start()
    uvicorn.run(app, host='0.0.0.0', port=8000)
