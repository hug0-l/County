// county-config.js — Config 管理模組
County.register('Config', function(C) {
    var cfg = {
        frameRate: 25,
        timezone: 'Asia/Hong_Kong',
        retentionSeconds: 5,
        beepFreq: 1500,
        beepDur: 0.5,
        ntpServerUrl: 'stdtime.gov.hk',
        ntpAutoSyncInterval: 600
    };

    cfg.defaultConfig = function() {
        return {
            frameRate: 25,
            beepFreq: 1500,
            beepDur: 0.5,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Hong_Kong',
            lastSelectedDate: new Date().toISOString().split('T')[0],
            retentionSeconds: 5,
            ntpServerUrl: 'stdtime.gov.hk',
            ntpAutoSyncInterval: 600,
            ntpLastOffset: 0,
            ntpLastSyncTime: '',
            version: 3
        };
    };

    cfg.saveConfig = function() {
        var appConfig = window.appConfig || {};
        var frameRate = window.frameRate || 25;
        var NTPManager = window.NTPManager;
        appConfig.frameRate = frameRate;
        appConfig.beepFreq = parseFloat(document.getElementById('cfgBeepFreq').value) || 1500;
        appConfig.beepDur = parseFloat(document.getElementById('cfgBeepDur').value) || 0.5;
        appConfig.timezone = document.getElementById('cfgTimezone').value;
        appConfig.retentionSeconds = parseInt(document.getElementById('cfgRetentionSec').value) || 5;
        appConfig.lastSelectedDate = document.getElementById('globalTargetDate').value;
        if (NTPManager) {
            var ntpUrlInput = document.getElementById('cfgNtpUrl');
            var ntpIntervalInput = document.getElementById('cfgNtpInterval');
            if (ntpUrlInput) {
                NTPManager.config.ntpServerUrl = ntpUrlInput.value;
                appConfig.ntpServerUrl = ntpUrlInput.value;
            }
            if (ntpIntervalInput) {
                NTPManager.config.ntpAutoSyncInterval = parseInt(ntpIntervalInput.value) || 0;
                appConfig.ntpAutoSyncInterval = parseInt(ntpIntervalInput.value) || 0;
            }
            appConfig.ntpAutoSyncInterval = NTPManager.config.ntpAutoSyncInterval;
            appConfig.ntpLastOffset = NTPManager.offset;
            appConfig.ntpLastSyncTime = NTPManager.lastSyncTime || '';
        }
        localStorage.setItem('county_config_v8', JSON.stringify(appConfig));
        if (window.API) window.API.saveConfig(appConfig);
    };

    cfg.loadConfig = function() {
        var appConfig = {};
        var raw = localStorage.getItem('county_config_v8');
        if (raw) {
            try { appConfig = JSON.parse(raw); } catch(e) { appConfig = cfg.defaultConfig(); }
        } else {
            appConfig = cfg.defaultConfig();
            appConfig.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Hong_Kong';
        }
        window.appConfig = appConfig;
        window.frameRate = appConfig.frameRate || 25;
        var fr = window.frameRate;
        document.getElementById('cfgFrameRate').value = fr;
        document.getElementById('cfgBeepFreq').value = appConfig.beepFreq || 1500;
        document.getElementById('cfgBeepDur').value = appConfig.beepDur || 0.5;
        var tzEl = document.getElementById('cfgTimezone');
        if (tzEl && appConfig.timezone) tzEl.value = appConfig.timezone;
        var retEl = document.getElementById('cfgRetentionSec');
        if (retEl) retEl.value = appConfig.retentionSeconds || 5;
        if (window.timelineRange) window.timelineRange.maxFrames = 86400 * fr;
        var fpsLabel = document.getElementById('sidebarFpsLabel');
        if (fpsLabel) fpsLabel.innerText = fr + ' fps';

        var NTPManager = window.NTPManager;
        if (NTPManager) {
            NTPManager.config.ntpServerUrl = appConfig.ntpServerUrl || 'stdtime.gov.hk';
            NTPManager.config.ntpAutoSyncInterval = parseInt(appConfig.ntpAutoSyncInterval) || 600;
            NTPManager.offset = parseInt(appConfig.ntpLastOffset) || 0;
            NTPManager.lastSyncTime = appConfig.ntpLastSyncTime || '';
            if (NTPManager.offset) {
                window.timeOffset = NTPManager.offset;
                NTPManager.status = 'fallback';
            }
            var ntpUrl = document.getElementById('cfgNtpUrl');
            var ntpInterval = document.getElementById('cfgNtpInterval');
            if (ntpUrl && appConfig.ntpServerUrl) ntpUrl.value = appConfig.ntpServerUrl;
            if (ntpInterval && appConfig.ntpAutoSyncInterval) ntpInterval.value = appConfig.ntpAutoSyncInterval;
        }
    };

    cfg.applyConfigJson = function() {
        var area = document.getElementById('configJsonArea');
        if (!area || !area.value.trim()) return;
        try {
            var newCfg = JSON.parse(area.value.trim());
            if (newCfg.frameRate === undefined) { alert('Config 必須包含 frameRate'); return; }
            window.appConfig = newCfg;
            localStorage.setItem('county_config_v8', JSON.stringify(newCfg));
            if (window.API) window.API.saveConfig(newCfg);
            window.frameRate = newCfg.frameRate;
            document.getElementById('cfgFrameRate').value = window.frameRate;
            document.getElementById('cfgBeepFreq').value = newCfg.beepFreq || 1500;
            document.getElementById('cfgBeepDur').value = newCfg.beepDur || 0.5;
            var retEl = document.getElementById('cfgRetentionSec');
            if (retEl) retEl.value = newCfg.retentionSeconds || 5;
            if (window.timelineRange) window.timelineRange.maxFrames = 86400 * window.frameRate;
            if (newCfg.lastSelectedDate) {
                document.getElementById('globalTargetDate').value = newCfg.lastSelectedDate;
                if (typeof onGlobalDateChange === 'function') onGlobalDateChange();
            }
            if (typeof writeLog === 'function') writeLog('\u2699\ufe0f Config \u5df2\u5957\u7528: ' + window.frameRate + ' fps, beep ' + newCfg.beepFreq + 'Hz', 'success');
        } catch(e) { alert('JSON \u8a9e\u6cd5\u932f\u8aa4: ' + e.message); }
    };

    cfg.exportConfigAsJson = function() {
        var appConfig = window.appConfig || {};
        var exportCfg = {};
        for (var k in appConfig) exportCfg[k] = appConfig[k];
        exportCfg.frameRate = window.frameRate || 25;
        exportCfg.beepFreq = parseFloat(document.getElementById('cfgBeepFreq').value) || 1500;
        exportCfg.beepDur = parseFloat(document.getElementById('cfgBeepDur').value) || 0.5;
        exportCfg.retentionSeconds = parseInt(document.getElementById('cfgRetentionSec').value) || 5;
        var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportCfg, null, 2));
        var dl = document.createElement('a');
        dl.setAttribute('href', dataStr);
        dl.setAttribute('download', 'VCC_PRE_Config.json');
        document.body.appendChild(dl);
        dl.click();
        dl.remove();
    };

    cfg.importConfigFromFile = function(input) {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            var area = document.getElementById('configJsonArea');
            if (area) area.value = e.target.result;
            cfg.applyConfigJson();
        };
        reader.readAsText(file);
        input.value = '';
    };

    cfg.applyFrameRate = function() {
        var newFr = parseInt(document.getElementById('cfgFrameRate').value, 10);
        if (!newFr || newFr < 1 || newFr > 60) { alert('\u8acb\u8f38\u5165 1-60 \u4e4b\u9593\u7684\u683c\u6578'); return; }
        window.frameRate = newFr;
        if (window.timelineRange) window.timelineRange.maxFrames = 86400 * newFr;
        cfg.saveConfig();
        if (typeof writeLog === 'function') writeLog('\u2699\ufe0f \u6642\u9418\u683c\u6578\u5df2\u8b8a\u66f4\u70ba ' + newFr + ' fps', 'warn');
        var fpsLabel = document.getElementById('sidebarFpsLabel');
        if (fpsLabel) fpsLabel.innerText = newFr + ' fps';
        if (window.isTrackingActive && typeof calculateGlobalTimelineMatrix === 'function') {
            calculateGlobalTimelineMatrix(true);
            if (typeof writeLog === 'function') writeLog('\u26a0\ufe0f ENGINE \u5df2\u4f7f\u7528\u65b0\u683c\u6578 ' + newFr + 'fps \u91cd\u65b0\u8a08\u7b97', 'info');
        }
    };

    cfg.refreshConfigJsonArea = function() {
        var area = document.getElementById('configJsonArea');
        if (area) {
            cfg.saveConfig();
            area.value = JSON.stringify(window.appConfig || {}, null, 2);
        }
    };

    cfg.getRetentionFrames = function() {
        var appConfig = window.appConfig || {};
        var sec = appConfig.retentionSeconds || 5;
        return sec * (window.frameRate || 25);
    };

    return cfg;
});
