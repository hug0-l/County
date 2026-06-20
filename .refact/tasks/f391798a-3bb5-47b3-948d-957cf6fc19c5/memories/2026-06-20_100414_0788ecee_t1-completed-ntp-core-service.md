---
created_at: "2026-06-20T02:04:14.054609+00:00"
task_id: f391798a-3bb5-47b3-948d-957cf6fc19c5
role: agents
agent_id: b8924e2c-049a-4edd-8866-0df2d9e2e353
card_id: T-1
title: "T-1 Completed: NTP Core Service + Config Schema"
kind: brief
namespace: card:T-1
pinned: true
---

# T-1 Completed: NTP Core Service + Config Schema

NTPManager object created with async sync() method that:
- Fetches worldtimeapi.org (or custom URL) with 5s AbortController timeout
- Parses datetime/utc_datetime/unixtime fields
- Computes offset = serverEpoch - Date.now()
- Sets timeOffset global variable to the computed offset
- On failure: preserves last known offset, sets status to 'fallback' or 'local'
- Persists offset/lastSync to localStorage and appConfig on success

Config schema extended with:
- ntpServerUrl, ntpAutoSyncInterval, ntpLastOffset, ntpLastSyncTime in defaultConfig()
- saveConfig() now persists NTP fields
- loadConfig() reads NTP fields from localStorage/appConfig

updateNtpStatusUI() renders status badge (syncing/connected/fallback/local/error states)

syncWithNetworkTime() replaced: loads stored offset, then triggers NTPManager.sync()
checkNtpStatus() simplified: just calls updateNtpStatusUI() + NTPManager.sync()