// county-api.js — API 客戶端模組
County.register('API', function(C) {
    // AbortSignal.timeout polyfill for older runtimes
    if (!AbortSignal.timeout) {
        AbortSignal.timeout = function(ms) {
            var ctrl = new AbortController();
            setTimeout(function() { ctrl.abort(); }, ms);
            return ctrl.signal;
        };
    }

    var api = {};

    api._fetch = function(method, path, body) {
        var opts = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(3000)
        };
        if (body && method !== 'GET') opts.body = JSON.stringify(body);
        return fetch('/api' + path, opts).then(function(r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json().catch(function(){ return {}; });
        });
    };

    api.loadSchedules = function() { return api._fetch('GET', '/schedule'); };
    api.saveSchedule = function(data) { return api._fetch('POST', '/schedule', data); };
    api.updateSchedule = function(id, data) { return api._fetch('PUT', '/schedule/' + id, data); };
    api.deleteSchedule = function(id) { return api._fetch('DELETE', '/schedule/' + id); };
    api.loadPresets = function() { return api._fetch('GET', '/preset'); };
    api.savePreset = function(data) { return api._fetch('POST', '/preset', data); };
    api.updatePreset = function(id, data) { return api._fetch('PUT', '/preset/' + id, data); };
    api.deletePreset = function(id) { return api._fetch('DELETE', '/preset/' + id); };
    api.ntpSync = function() { return api._fetch('POST', '/ntp/sync'); };
    api.loadConfig = function() { return api._fetch('GET', '/config'); };
    api.saveConfig = function(data) { return api._fetch('PUT', '/config', data); };
    api.restoreBackup = function(file) {
        var formData = new FormData();
        formData.append('file', file);
        return fetch('/api/backup/restore', { method: 'POST', body: formData })
            .then(function(r) { return r.ok ? r.json() : null; })
            .catch(function() { return null; });
    };
    api.downloadBackup = function() {
        return fetch('/api/backup/download')
            .then(function(r) { return r.ok ? r.blob() : null; })
            .catch(function() { return null; });
    };

    api.normalizeScheduleFromApi = function(s) {
        return {
            id: s.id,
            name: s.name,
            broadcastDate: s.broadcast_date || s.broadcastDate,
            startTime: s.start_time || s.startTime,
            duration: s.duration,
            periodicType: s.periodic_type || s.periodicType || 'none',
            periodicEndDate: s.periodic_end_date || s.periodicEndDate || '',
            periodicDays: s.periodic_days || s.periodicDays || [],
            presetId: s.preset_id || s.presetId || 'pre_broadcast',
            tags: s.tags || [],
            colorLabel: s.color_label || s.colorLabel || '',
            exceptionDates: s.exception_dates || s.exceptionDates || [],
            _serverUpdatedAt: s.updated_at || '',
            _updatedAt: 0
        };
    };

    api.normalizePresetFromApi = function(p) {
        return {
            id: p.id,
            name: p.name,
            nodes: p.nodes || []
        };
    };

    api.syncAllToServer = function() {
        if (api._syncInProgress) return;
        api._syncInProgress = true;
        (async function() {
            try {
                var masterScheduleDB = window.masterScheduleDB || [];
                var cuePresets = window.cuePresets || {};
                var scheduleEndpointsAPI = window.API_SCHEDULE || api;
                for (var i = 0; i < masterScheduleDB.length; i++) {
                    var prog = masterScheduleDB[i];
                    var payload = {
                        id: prog.id,
                        name: prog.name,
                        broadcastDate: prog.broadcastDate,
                        startTime: prog.startTime,
                        duration: prog.duration,
                        periodicType: prog.periodicType || 'none',
                        periodicEndDate: prog.periodicEndDate || '',
                        periodicDays: prog.periodicDays || [],
                        presetId: prog.presetId || 'pre_broadcast',
                        tags: prog.tags || [],
                        colorLabel: prog.colorLabel || '',
                        exceptionDates: prog.exceptionDates || [],
                        updatedAt: prog._updatedAt ? new Date(prog._updatedAt).toISOString() : ''
                    };
                    await scheduleEndpointsAPI._fetch('PUT', '/schedule/' + payload.id, payload).catch(function(){});
                }
                for (var pid in cuePresets) {
                    await scheduleEndpointsAPI._fetch('PUT', '/preset/' + pid, {
                        id: pid,
                        name: cuePresets[pid].name,
                        nodes: cuePresets[pid].nodes
                    }).catch(function(){});
                }
            } catch(e) {
            } finally {
                api._syncInProgress = false;
            }
        })();
    };
    api._syncInProgress = false;

    api.fetchApiData = function() {
        api.loadSchedules().then(function(apiData) {
            if (apiData && apiData.length > 0) {
                var masterScheduleDB = window.masterScheduleDB || [];
                var apiMap = {};
                apiData.forEach(function(s) {
                    var normalized = api.normalizeScheduleFromApi(s);
                    apiMap[normalized.id] = normalized;
                });
                masterScheduleDB.forEach(function(local) {
                    var apiVersion = apiMap[local.id];
                    if (!apiVersion) {
                        apiMap[local.id] = local;
                    } else if (local._updatedAt && local._updatedAt > new Date(apiVersion._serverUpdatedAt || 0).getTime()) {
                        apiMap[local.id] = local;
                    }
                });
                window.masterScheduleDB = Object.values(apiMap);
                try {
                    localStorage.setItem('county_master_db_v8', JSON.stringify(window.masterScheduleDB));
                } catch(e) {}
                if (typeof onGlobalDateChange === 'function') onGlobalDateChange();
                if (typeof renderRundownUI === 'function') renderRundownUI();
                if (window.isTrackingActive && typeof calculateGlobalTimelineMatrix === 'function') calculateGlobalTimelineMatrix(true);
                if (typeof updateFileStatus === 'function') updateFileStatus('\u2601\ufe0f \u4f3a\u670d\u5668');
            }
            if (typeof flushPendingDeletes === 'function') flushPendingDeletes();
        });
        api.loadPresets().then(function(apiData) {
            if (apiData && apiData.length > 0) {
                var cuePresets = {};
                apiData.forEach(function(p) { cuePresets[p.id] = api.normalizePresetFromApi(p); });
                window.cuePresets = cuePresets;
                try {
                    localStorage.setItem('county_presets_v8', JSON.stringify(cuePresets));
                } catch(e) {}
                if (typeof refreshPresetDropdownUI === 'function') refreshPresetDropdownUI();
                if (typeof onPresetSelectionChange === 'function') onPresetSelectionChange();
            }
        });
        api.loadConfig().then(function(apiData) {
            if (apiData && apiData.frameRate) {
                var appConfig = apiData;
                appConfig.frameRate = parseInt(appConfig.frameRate) || 25;
                appConfig.beepFreq = parseFloat(appConfig.beepFreq) || 1500;
                appConfig.beepDur = parseFloat(appConfig.beepDur) || 0.5;
                appConfig.retentionSeconds = parseInt(appConfig.retentionSeconds) || 5;
                if (appConfig.presetProtection === 'true') appConfig.presetProtection = true;
                if (appConfig.presetProtection === 'false') appConfig.presetProtection = false;
                window.appConfig = appConfig;
                try {
                    localStorage.setItem('county_config_v8', JSON.stringify(appConfig));
                } catch(e) {}
                window.frameRate = appConfig.frameRate;
                var fr = window.frameRate;
                var fpsEl = document.getElementById('cfgFrameRate');
                if (fpsEl) fpsEl.value = fr;
                var bfEl = document.getElementById('cfgBeepFreq');
                if (bfEl) bfEl.value = appConfig.beepFreq;
                var bdEl = document.getElementById('cfgBeepDur');
                if (bdEl) bdEl.value = appConfig.beepDur;
                var tzEl = document.getElementById('cfgTimezone');
                if (tzEl && appConfig.timezone) tzEl.value = appConfig.timezone;
                var retEl = document.getElementById('cfgRetentionSec');
                if (retEl) retEl.value = appConfig.retentionSeconds;
                if (window.timelineRange) window.timelineRange.maxFrames = 86400 * fr;
                var fpsLabel = document.getElementById('sidebarFpsLabel');
                if (fpsLabel) fpsLabel.innerText = fr + ' fps';
            }
        });
    };

    return api;
});
