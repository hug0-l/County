# ⚡ County — 廣播排控倒數系統 v1.1 / Broadcast Scheduling & Cue Engine

![version](https://img.shields.io/badge/version-1.1-blue)
![python](https://img.shields.io/badge/python-3.10%2B-green)
![fastapi](https://img.shields.io/badge/FastAPI-%E2%9C%93-success)
![build](https://img.shields.io/github/actions/workflow/status/hug0-l/County/.github/workflows/build.yml?branch=main&label=build&logo=github)
![release](https://img.shields.io/github/v/release/hug0-l/County)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

County 是一個廣播電視台排控中心的單頁應用 (SPA)，搭配 Python FastAPI 後端與 SQLite 持久化儲存，提供節目排程管理、Cue 提示點觸發、時間軸視覺化、NTP 校時等核心功能。

County is a broadcast station scheduling SPA with a Python FastAPI backend and SQLite persistence. It provides schedule CRUD, preset cue definitions, a cue trigger engine, timeline visualization, NTP time synchronization, and optional Clipper IM integration.

---

## 🚀 Quickstart

```bash
pip install -r requirements.txt
python server.py
# Open http://localhost:8000
```

自訂埠號 / Custom port: `COUNTY_PORT=8001 python server.py`

### Windows / macOS 一鍵執行

下載 Release 中的 `County.exe` (Windows) 或 `County` (macOS)，雙擊執行。Download the Release build and double-click to run.

---

## ✨ Features

| 功能 | English |
|------|---------|
| 📅 排程管理 Schedule CRUD | 新增/編輯/刪除/複製節目，支援每日/工作日/每週/自訂週期 |
| 🎯 Cue 提示點 Preset Cue | 為每個節目設定提示點（偏移秒數/名稱/提示音） |
| 🧩 段落 Item Cue | 節目內分段 (Item) 各自獨立 Cue，Matrix 與 Timeline 子軌道顯示 |
| 🚀 即時引擎 Live Engine | 40ms 定時器監控時間軸，自動觸發 Cue 提示音 + UI 警示 |
| 📊 時間軸 Timeline | 圖形化節目色塊 + Cue 刻度，支援 Item 子軌道 |
| 🕒 NTP 校時 | 伺服器端 ntplib 連接香港天文台 `stdtime.gov.hk`，精度 ±5ms |
| 🌐 多國語言 i18n | 繁體中文 + English 即時切換 |
| 🔒 Session Lock | ENGINE LIVE 時自動鎖定刪除/全清，防止誤操作 |
| 🔔 Cue Alarm Bar | 持久性紅色橫幅提示，需操作員 ACK 確認 |
| 💬 Clipper IM | 整合即時通訊，一鍵發送節目狀態通知 |
| 🛡️ 安全 Security | CSP Header、XSS 跳脫、10MB 上傳限制、DB 寫入鎖 |

---

## 📁 Project Structure

```
county/
├── server.py              # 🚀 FastAPI + SQLite + ntplib
├── requirements.txt
├── county.spec            # PyInstaller 打包
├── templates/
│   └── index.html         # 📄 SPA (~5600 lines)
├── static/
│   ├── county.css         # 🎨 完整樣式
│   ├── county-core.js     # 模組載入器
│   ├── county-i18n.js     # i18n 引擎 (zh)
│   ├── county-i18n-en.js  # English locale
│   ├── county-*.js        # 各功能模組
│   ├── clipper-*.js       # Clipper SDK
│   └── CHANGELOG.md
├── tests/
│   └── smoke_test.py      # ✅ 整合測試
└── county.db              # SQLite
```

完整啟動方式 / Full startup: `pip install -r requirements.txt && python server.py`

---

## 📸 Page Overview

| 分頁 Page | ID | 功能 |
|-----------|-----|------|
| 📡 首頁 Live | `page-live` | MCR 儀表板：ON AIR、Cue 倒數、矩陣、時間軸 |
| 📅 排程 Schedule | `page-rundown` | 行事曆、節目 CRUD、週縱覽、匯出入 |
| 📋 Preset | `page-preset` | Cue 節點管理、Item 段落、JSON 匯出入 |
| 🛠️ 設定 Settings | `page-settings` | NTP、FPS、時區、語言、音訊、開發者選項 |
| 💬 Clipper IM | `page-clipper` | 即時通訊、檔案傳輸 |
| 📜 更新日誌 | `page-changelog` | 版本歷史 |
| 📖 說明 Help | `page-help` | 操作指南 + 快捷鍵 |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS SPA (~5600 lines inline) |
| Backend | Python FastAPI + uvicorn |
| Database | SQLite (WAL mode) |
| Time Sync | ntplib → stdtime.gov.hk (UDP 123) |
| Realtime | Clipper WebSocket SDK |
| Build | PyInstaller (Windows/macOS) |

---

## 🧪 Testing

```bash
python3 tests/smoke_test.py
# 檢查：JS 語法、Python 語法、檔案完整性、HTML 結構
```

---

## 📜 License

MIT
