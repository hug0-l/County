---
created_at: "2026-06-20T01:58:39.557338+00:00"
task_id: f391798a-3bb5-47b3-948d-957cf6fc19c5
role: planner
title: "Design Decision: NTP via HTTP (No raw UDP)"
kind: decision
pinned: true
---

# Design Decision: NTP via HTTP (No raw UDP)

# Design Decision: HTTP-based Time Sync

Since this is a browser SPA, raw NTP (UDP port 123) is impossible. We must use HTTP APIs that return JSON with UTC time.

## Default Server
- **NTP server requested**: Hong Kong Observatory (time.hko.hk)
- **Reality**: HKO only supports NTP (UDP), no public CORS HTTP API
- **Actual default**: `https://worldtimeapi.org/api/timezone/Asia/Hong_Kong`
  - CORS-friendly, returns ISO datetime, millisecond accuracy
  - Same timezone (Asia/Hong_Kong) as the app's default
  - User can configure any HTTP time API URL in settings

## Supported Response Formats
The sync function handles:
- `"datetime"` (ISO 8601) — worldtimeapi format
- `"utc_datetime"` (ISO 8601) — fallback
- `"unixtime"` (seconds) — alternative APIs
- `"currentTimeMillis"` — some custom APIs

## Failover
- Last known offset persists in localStorage (`ntpLastOffset`)
- When offline, the stored offset is applied
- If no stored offset, local clock is used
- The status badge clearly shows which time source is active

## Edge Cases
- Loading indicator during sync
- Timeout after 5 seconds
- Invalid JSON gracefully handled
- Auto-sync interval change resets timer