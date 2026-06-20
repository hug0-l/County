# VPre CountdownCtrl — Agent 工作指南

## 📌 專案概述
**VPre CountdownCtrl** 是一個廣播電視台排控中心的 **單頁應用 (SPA)**，所有程式碼集中於一個 HTML 檔案 (3375 行)。支援節目排程管理、Cue 提示點觸發、時間軸視覺化。

## 🏗️ 檔案結構
```
vcc-countdownctrl/
├── VPre_CountdownCtrl_PROD_v0.5.html  # 主系統 SPA（所有 JS/CSS/HTML 集中此檔）
├── README.md                          # 架構文件（開發前請先閱讀）
├── AGENTS.md                          # 本文件（Agent 工作指引）
└── CHANGELOG.md                       # 版本歷史
```

## 🧩 模組劃分（原始碼行號範圍）
| 範圍 | 模組 | 說明 |
|------|------|------|
| 1–344 | CSS | 完整 CSS 樣式表（變數、元件、響應式） |
| 345–973 | HTML | 頁面結構（Sidebar、Status Bar、6 頁分頁） |
| 976–3375 | JavaScript | 所有邏輯 |
| 976–1000 | 模組標頭與資料流說明 | 使用區塊註解 |
| 1001–1115 | 全域變數與初始化 | `appConfig`、`masterScheduleDB`、`cuePresets`、`NTPManager` |
| 1116–1275 | Config 管理 | `saveConfig()`、`loadConfig()`、JSON 匯出入 |
| 1276–1305 | Timecode 工具 | `dateToTimecode()`、`timecodeToTotalFrames()`、`totalFramesToTimecode()` |
| 1306–1330 | 時碼輸入遮罩 | `setupTimecodeMask()` |
| 1331–1460 | 行事曆 | `renderGUICalendar()`、`moveCalendarMonth()` |
| 1461–1530 | 週期展開 | `getExpandedRundownForDate()` |
| 1531–1570 | 日誌系統 | `writeLog()` |
| 1571–1620 | 週期 UI | 星期選擇、週期類型切換 |
| 1621–1760 | 行事曆渲染 + 首頁 Traffic | `renderWeekGlance()`、`calculateMCRTrafficSummary()` |
| 1761–1780 | 音效系統 | `soundPresets`（9 種音效） |
| 1781–2100 | Preset 節點管理 | `addNodeRow()`、`renderPresetNodes()`、`onPresetSelectionChange()`、`savePresetAction()` |
| 2101–2140 | 時間校正 | `getCalibratedDate()`、`getTodayStr()` |
| 2141–2480 | 排程 CRUD | `submitProgramForm()`、`enterEditMode()`、`exitEditMode()`、`deleteProgram()` |
| 2481–2650 | Rundown 排序與渲染 | `sortRundownTable()`、`renderRundownUI()` |
| 2651–2900 | 引擎系統 | `initGlobalTracking()`、`calculateGlobalTimelineMatrix()` |
| 2901–3250 | 儀表板 | `updateGlobalDashboard()`、`homeCueCountdown`、Cue 即時看板 |
| 3251–3330 | CUE Popup + 音效播放 | `sendCueNotification()`、`playBroadcastBeep()` |
| 3331–3375 | 開發者選項 + Crash Dump | `applyDevEngineInterval()`、`factoryResetStorage()` 等 |

## 🕒 NTP 時間服務架構
### NTPManager（新增於卡片 T-1, T-2, T-3）
```javascript
const NTPManager = {
    status: 'connected' | 'fallback' | 'local' | 'syncing' | 'error',
    offset: 0,              // serverTime - Date.now() (ms)
    lastSyncTime: null,     // ISO string
    errorMsg: '',
    config: {
        ntpServerUrl: 'https://worldtimeapi.org/api/timezone/Asia/Hong_Kong',
        ntpAutoSyncInterval: 0,   // seconds, 0=disabled
    },
    timerId: null,          // auto-sync setInterval ID
    async sync(url) { ... } // fetch → parse → compute offset
};
```

### 關鍵函數
| 函數 | 位置 | 說明 |
|------|------|------|
| `NTPManager.sync(url)` | ~1005 | 非阻塞同步，5 秒 timeout |
| `updateNtpStatusUI()` | 新增 | 更新狀態列 syncBadge + ntpStatus |
| `updateSettingsNtpUI()` | 新增 | 更新設定頁 NTP 面板 |
| `restartAutoSync()` | 新增 | 重新初始化自動同步 timer |
| `handleManualNtpSync()` | 新增 | 設定頁「立即同步」按鈕處理 |

### 資料持久化
- localStorage Key: `vcc_pre_ntp_offset`（偏移量 ms）、`vcc_pre_ntp_last_sync`（ISO 時間戳）
- localStorage Key: `vcc_pre_ntp_server_url`（伺服器 URL）、`vcc_pre_ntp_interval`（自動間隔秒數）
- 所有 NTP 設定也保存在 `appConfig.ntp*` 字段中，透過 Config JSON 面板可匯出/匯入

## ⚠️ 關鍵注意事項（Gotchas）

1. **單檔架構** — 所有程式碼在同一個 .html 檔案中。修改時注意模組邊界區塊，避免破壞其他模組。
2. **NTP 僅支援 HTTP API** — 瀏覽器無法使用 UDP NTP（port 123）。必須使用支援 CORS 的 HTTP 時間 API。
3. **timeOffset 全局變數** — `let timeOffset = 0` 在 ~1115 行。`getCalibratedDate()` 使用 `Date.now() + timeOffset` 做時間校正。
4. **4 個 localStorage key 不可混淆**：
   - `vcc_pre_master_db_v8` — 排程資料庫
   - `vcc_pre_presets_v8` — Cue Preset 庫
   - `vcc_pre_config_v8` — 應用設定
   - `vcc_pre_ntp_*` (x4) — NTP 時間服務設定
5. **Always PR / code review** — 單一巨大檔案容易產生衝突。提交前一定要 diff 檢查。
6. **時碼格式** — 固定 `HH:MM:SS:FF`（Frame 為單位，預設 PAL 25fps）
7. **引擎 40ms timer** — `timerInterval = setInterval(updateGlobalDashboard, 40)`，只在首頁全量更新，其它頁面輕量 CUE 檢查。
8. **AudioContext 需要用戶手勢** — 首次播放需要用戶點擊解鎖，聲音模組已內建 `actx.resume()` 處理。

## 🔧 開發流程提示
- **修改 config 時**：記得同時更新 `saveConfig()` 和 `loadConfig()` 以及預設值 `defaultConfig()`
- **新增 UI 元素**：在 HTML 區塊 (345–973) 中依頁面 `page-*` id 添加，不要破壞現有結構
- **JS 函數添加**：依模組行號範圍放入對應區塊，頂部變數區放宣告，底部放實作
- **測試方式**：直接用瀏覽器開啟該 .html 檔案即可（純前端，無需伺服器）
- **Agent 切記**：這是一個生產級 SPA，3375 行。任何改動後都應該手動驗證所有核心功能！

## 🧪 快速驗證清單（每次修改後）
- [ ] 頁面載入無 console error
- [ ] 時鐘正常運作（每秒刷新）
- [ ] NTP 狀態正確顯示（已同步/本地時鐘）
- [ ] 設定頁 NTP 面板可操作
- [ ] 時間格式正確（HH:MM:SS:FF）
- [ ] 排程 CRUD 正常
- [ ] ENGINE 啟動/停止正常
- [ ] Cue 觸發顯示正確（矩陣高亮、Popup、音效）
- [ ] localStorage 讀寫正常
- [ ] Config JSON 匯出/匯入正常

## 📝 版本控制
- Branch: `main`（正式版）
- Branch: `test`（測試版）
- Remote: git@github.com:hug0-l/vcc-countdownctrl.git
