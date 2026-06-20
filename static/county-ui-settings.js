// county-ui-settings.js — 設定頁 UI 模組 (NTP, Crash Dump, Dev Options, Inspector)
County.register('SettingsUI', function(C) {
    var S = {};

    // ===== NTP 設定 UI 更新 =====
    S.updateSettingsNtpUI = function() {
        var NTPManager = window.NTPManager;
        var statusEl = document.getElementById('settingsNtpStatus');
        var lastSyncEl = document.getElementById('settingsNtpLastSync');
        if (!statusEl || !NTPManager) return;

        var s = NTPManager.status;
        if (s === 'connected') {
            statusEl.innerHTML = '\U0001f7e2 <span style="color:#34d399;">\u5df2\u540c\u6b65 \u2014 \u4f3a\u670d\u5668\u771f\u5be6 NTP</span>';
        } else if (s === 'syncing') {
            statusEl.innerHTML = '\U0001f504 <span style="color:#60a5fa;">\u540c\u6b65\u4e2d\u2026</span>';
        } else if (s === 'fallback') {
            statusEl.innerHTML = '\U0001f7e1 <span style="color:#fbbf24;">\u5df2\u964d\u7d1a (\u4fdd\u7559\u524d\u6b21\u504f\u79fb)</span>';
        } else if (s === 'error') {
            statusEl.innerHTML = '\U0001f534 <span style="color:#f87171;">\u932f\u8aa4</span>';
        } else {
            statusEl.innerHTML = '\u26aa <span style="color:#9ca3af;">\u672a\u540c\u6b65 (\u672c\u5730\u6642\u9418)</span>';
        }
        if (NTPManager.errorMsg) {
            statusEl.innerHTML += '<br><span style="font-size:11px; color:#ef4444;">' + NTPManager.errorMsg + '</span>';
        }
        if (lastSyncEl && typeof window.formatTimeInAppTz === 'function') {
            lastSyncEl.innerText = window.formatTimeInAppTz(NTPManager.lastSyncTime, 'datetime');
        }
    };

    // ===== Rumdown JSON Inspector =====
    S.refreshJsonInspectorProbe = function() {
        var debugTextArea = document.getElementById('debugStateTextArea');
        if (debugTextArea) debugTextArea.value = JSON.stringify(window.masterScheduleDB || [], null, 2);
    };

    S.applyInjectedJsonState = function() {
        var rawJson = document.getElementById('debugStateTextArea').value;
        try {
            var parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed)) {
                window.masterScheduleDB = parsed;
                if (typeof window.saveToLocalStorage === 'function') window.saveToLocalStorage();
                if (typeof window.onGlobalDateChange === 'function') window.onGlobalDateChange();
                alert('\u4ea4\u901a\u6392\u7a0b JSON \u8cc7\u6599\u5eab\u72c0\u614b\u8b8a\u66f4\u5df2\u6210\u529f\u5957\u7528\uff01');
            }
        } catch (e) { alert('JSON \u8a9e\u6cd5\u932f\u8aa4: ' + e.message); }
    };

    // ===== Crash Dump =====
    S.generateCrashDump = function() {
        var area = document.getElementById('crashDumpArea');
        if (!area) return;
        var appConfig = window.appConfig || {};
        var masterScheduleDB = window.masterScheduleDB || [];
        var cuePresets = window.cuePresets || {};
        var now = new Date();
        var dump = {
            generatedAt: now.toISOString(),
            version: '0.5',
            timezone: appConfig.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            frameRate: window.frameRate || 25,
            retentionSeconds: appConfig.retentionSeconds || 5,
            isTrackingActive: !!window.isTrackingActive,
            scheduleCount: masterScheduleDB.length,
            presetCount: Object.keys(cuePresets).length,
            engineInterval: document.getElementById('devEngineInterval') ? document.getElementById('devEngineInterval').value : 'N/A',
            config: JSON.parse(JSON.stringify(appConfig)),
            schedule: masterScheduleDB.map(function(p) {
                return { id: p.id, name: p.name, broadcastDate: p.broadcastDate, startTime: p.startTime, periodicType: p.periodicType };
            }),
            presets: Object.keys(cuePresets).map(function(k) {
                return { id: k, name: cuePresets[k].name, nodeCount: cuePresets[k].nodes ? cuePresets[k].nodes.length : 0 };
            })
        };
        area.value = JSON.stringify(dump, null, 2);
        if (typeof window.writeLog === 'function') window.writeLog('\U0001f691 Crash Dump \u5df2\u751f\u6210', 'info');
    };

    S.saveCrashDumpToFile = function() {
        var a = document.getElementById('crashDumpArea');
        if (!a || !a.value) return;
        var b = new Blob([a.value], {type: 'text/plain'});
        var u = URL.createObjectURL(b);
        var d = document.createElement('a');
        d.href = u;
        d.download = 'VCC_PRE_CrashDump_' + new Date().toISOString().split('T')[0] + '.txt';
        document.body.appendChild(d);
        d.click();
        d.remove();
        URL.revokeObjectURL(u);
    };

    // ===== 開發者選項 =====
    S.applyDevEngineInterval = function() {
        var val = parseInt(document.getElementById('devEngineInterval').value, 10);
        if (!val || val < 10) { alert('\u8acb\u8f38\u5165 10-1000 \u4e4b\u9593\u7684\u503c'); return; }
        if (typeof window.writeLog === 'function') window.writeLog('\u2699\ufe0f \u958b\u767c\u8005\uff1aEngine \u9593\u9694\u5df2\u8a2d\u70ba ' + val + 'ms\uff08\u9700\u91cd\u555f ENGINE \u751f\u6548\uff09', 'warn');
    };

    S.applyDevLogLines = function() {
        var val = parseInt(document.getElementById('devLogLines').value, 10);
        if (!val || val < 10) return;
        if (typeof window.writeLog === 'function') window.writeLog('\u2699\ufe0f \u958b\u767c\u8005\uff1aLog \u4fdd\u7559\u884c\u6578\u5df2\u8a2d\u70ba ' + val, 'info');
    };

    S.applyDevVerboseLog = function() {
        var checked = document.getElementById('devVerboseLog').checked;
        if (typeof window.writeLog === 'function') window.writeLog('\U0001f6e0\ufe0f \u958b\u767c\u8005\uff1a\u8a73\u7d30 Log ' + (checked ? '\u958b\u555f' : '\u95dc\u9589'), 'info');
    };

    S.applyDevDebugLayout = function() {
        var checked = document.getElementById('devDebugLayout').checked;
        var all = document.querySelectorAll('.panel-box, .help-section, .help-card');
        all.forEach(function(el) {
            el.style.outline = checked ? '1px solid #ef4444' : '';
        });
        if (typeof window.writeLog === 'function') window.writeLog('\U0001f6e0\ufe0f \u958b\u767c\u8005\uff1a\u4f48\u5c40\u908a\u6846 ' + (checked ? '\u986f\u793a' : '\u96b1\u85cf'), 'info');
    };

    // ===== 工廠重置 =====
    S.factoryResetStorage = function() {
        if (confirm('\u78ba\u5b9a\u5de5\u5ee0\u91cd\u7f6e\uff1f')) { localStorage.clear(); location.reload(); }
    };

    return S;
});
