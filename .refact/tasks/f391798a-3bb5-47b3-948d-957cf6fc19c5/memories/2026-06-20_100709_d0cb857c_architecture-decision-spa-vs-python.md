---
created_at: "2026-06-20T02:07:09.816101+00:00"
task_id: f391798a-3bb5-47b3-948d-957cf6fc19c5
role: planner
title: "Architecture Decision: SPA vs Python Backend"
kind: decision
pinned: true
---

# Architecture Decision: SPA vs Python Backend

# Architecture Decision: SPA (current) vs Python Backend

## Current Architecture
- **資料層**: 瀏覽器 localStorage（~5MB 上限，單機限定）
- **時間服務**: HTTP API (worldtimeapi.org)，第三方依賴，非真實 NTP
- **優點**: 零部署，開檔即用，適合單站操作員

## Proposed Architecture (Python Backend)
- **資料層**: Python (Flask/FastAPI) + SQLite/PostgreSQL
- **時間服務**: ntplib (UDP 123) → 真實 NTP，支援香港天文台 time.hko.hk
- **API**: REST endpoints for data CRUD + time sync + status
- **前端**: 維持現有 HTML SPA，但改為向自家 backend fetch

## 比較

| 面向 | 目前 SPA + localStorage | Python Backend |
|------|------------------------|---------------|
| **部署難度** | ⭐ 非常低（開檔即用） | ⭐⭐⭐ 需要 run server |
| **多機共享** | ❌ 不可能 | ✅ 所有操作員共用同一資料庫 |
| **NTP 精度** | ⚠️ HTTP API ±500ms | ✅ 真實 NTP ±5ms |
| **離線容錯** | ✅ 可完全離線 | ⚠️ 需要區域網路 |
| **資料可靠** | ⚠️ 單瀏覽器，易流失 | ✅ 持久化資料庫，可備份 |
| **多用戶** | ❌ 單人單機 | ✅ 多人同時操作 |
| **設置彈性** | ❌ 無法自訂 NTP port | ✅ 可自訂 NTP server、port、multiple sources |

## 建議
對於廣播環境（多個操作員 console、需要精準時間、資料不能丟），**Python backend 更為可靠**。但若只是單機操作員使用，目前的 SPA 方案已足夠。

## 實作方向（若採用）
- Python: FastAPI + SQLite（輕量）或 PostgreSQL（正式）
- NTP: ntplib 連接 time.hko.hk (UDP 123)
- DB schema: schedules, presets, config, ntp_logs
- API: RESTful JSON endpoints
- 前端: 將 fetch 從 worldtimeapi.org 改為自家 backend（minimal 改動）
