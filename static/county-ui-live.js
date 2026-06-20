// county-ui-live.js — 首頁儀表板 UI 模組 (updateGlobalDashboard, sendCueNotification, toggleQuickEdit, etc.)
County.register('LiveUI', function(C) {
    var L = {};

    // ===== 首頁 MCR 交通摘要與時序檢查安全計算 =====
    L.calculateMCRTrafficSummary = function() {
        var targetDateStr = document.getElementById('globalTargetDate').value;
        var getExpanded = window.getExpandedRundownForDate || function() { return []; };
        if (typeof getExpanded !== 'function' && County.get('Data') && County.get('Data').getExpandedRundownForDate) {
            getExpanded = County.get('Data').getExpandedRundownForDate;
        }
        var activeList = getExpanded(targetDateStr);
        var totalCountEl = document.getElementById('homeTotalCount');
        if (totalCountEl) totalCountEl.innerText = activeList.length;

        var hasOverlapConflict = false;
        var previousEndFrames = -1;
        var tcToFrames = window.timecodeToTotalFrames || function() { return 0; };

        activeList.forEach(function(prog) {
            var startFr = tcToFrames(prog.startTime);
            var durFr = tcToFrames(prog.duration);
            var endFr = startFr + durFr;
            if (startFr < previousEndFrames) {
                hasOverlapConflict = true;
            }
            previousEndFrames = Math.max(previousEndFrames, endFr);
        });

        var conflictStatusEl = document.getElementById('homeConflictStatus');
        var conflictBlockEl = document.getElementById('homeConflictBlock');
        if (conflictBlockEl && conflictStatusEl) {
            if (hasOverlapConflict) {
                conflictBlockEl.classList.add('alert-active');
                conflictStatusEl.innerText = '\u26a0\ufe0f \u6642\u5e8f\u91cd\u758a\u885d\u7a81';
                conflictStatusEl.style.color = 'const(--danger)';
            } else {
                conflictBlockEl.classList.remove('alert-active');
                conflictStatusEl.innerText = '\u25cf \u5b89\u5168\u6b63\u5e38';
                conflictStatusEl.style.color = 'const(--success)';
            }
        }
    };

    // ===== 快速修改（首頁 MCR 快速編輯 Start Time & Duration） =====
    L.toggleQuickEdit = function() {
        var panel = document.getElementById('mcrQuickEdit');
        if (!panel) return;
        if (panel.style.display === 'none' || panel.style.display === '') {
            var targetDateStr = document.getElementById('globalTargetDate').value;
            var getExpanded = window.getExpandedRundownForDate || function() { return []; };
            if (typeof getExpanded !== 'function' && County.get('Data') && County.get('Data').getExpandedRundownForDate) {
                getExpanded = County.get('Data').getExpandedRundownForDate;
            }
            var activeList = getExpanded(targetDateStr);
            var dtc = window.dateToTimecode || function(d) { return '00:00:00:00'; };
            var gcd = window.getCalibratedDate || function() { return new Date(); };
            var tcf = window.timecodeToTotalFrames || function(s) { return 0; };
            var currentTotalFrames = tcf(dtc(gcd()));
            var target = null;
            activeList.forEach(function(p) {
                var sf = tcf(p.startTime);
                var ef = sf + tcf(p.duration);
                if (currentTotalFrames >= sf && currentTotalFrames <= ef) target = p;
            });
            if (!target) { alert('\u76ee\u524d\u7121\u64ad\u51fa\u4e2d\u7bc0\u76ee'); return; }
            window.quickEditTargetId = target.id;
            document.getElementById('quickStartTime').value = target.startTime;
            document.getElementById('quickDuration').value = target.duration;
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    };

    L.applyQuickEdit = function() {
        if (!window.quickEditTargetId) return;
        var newStart = document.getElementById('quickStartTime').value;
        var newDur = document.getElementById('quickDuration').value;
        var masterScheduleDB = window.masterScheduleDB || [];
        var target = null;
        for (var pi = 0; pi < masterScheduleDB.length; pi++) {
            if (masterScheduleDB[pi].id === window.quickEditTargetId) { target = masterScheduleDB[pi]; break; }
        }
        if (target) {
            target.startTime = newStart;
            target.duration = newDur;
            target._updatedAt = Date.now();
            if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
            if (typeof calculateMCRTrafficSummary === 'function') calculateMCRTrafficSummary();
            if (typeof renderRundownUI === 'function') renderRundownUI();
            if (window.isTrackingActive && typeof calculateGlobalTimelineMatrix === 'function') calculateGlobalTimelineMatrix(true);
            if (typeof writeLog === 'function') writeLog('\u5df2\u5feb\u901f\u4fee\u6539\u7bc0\u76ee [' + target.name + '] \u7684\u958b\u59cb\u6642\u9593\u8207\u9577\u5ea6\uff0cCUE \u5df2\u91cd\u65b0\u8a08\u7b97', 'warn');
        }
        L.cancelQuickEdit();
    };

    L.cancelQuickEdit = function() {
        window.quickEditTargetId = null;
        var panel = document.getElementById('mcrQuickEdit');
        if (panel) panel.style.display = 'none';
    };

    // ===== 頁面內 Popup 提示（CUE 觸發時顯示） =====
    L.sendCueNotification = function(progName, cueName) {
        var popup = document.getElementById('cuePopup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'cuePopup';
            popup.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:9999;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;padding:16px 28px;border-radius:10px;font-size:16px;font-weight:bold;box-shadow:0 8px 32px rgba(220,38,38,0.5);text-align:center;max-width:600px;width:90%;border:1px solid rgba(255,255,255,0.15);animation:cuePopIn 0.3s ease-out;font-family:"Microsoft JhengHei",sans-serif;';
            document.body.appendChild(popup);
        }
        popup.innerHTML = '\U0001f6a8 <span style="font-size:20px;">CUE \u89f8\u767a\uff01</span><br><span style="font-size:14px;opacity:0.9;">' + progName + ' \u2014 ' + cueName + '</span><br><span style="font-size:11px;opacity:0.6;display:block;margin-top:6px;">\u9ede\u64ca\u95dc\u9589</span>';
        popup.style.display = 'block';
        popup.onclick = function() { popup.style.display = 'none'; };

        var cuePopupTimer = window.cuePopupTimer || null;
        if (cuePopupTimer) clearTimeout(cuePopupTimer);
        cuePopupTimer = setTimeout(function() {
            if (popup) popup.style.display = 'none';
        }, 6000);
        window.cuePopupTimer = cuePopupTimer;
    };

    // ===== Crash Dump（診斷快取） =====
    L.generateCrashDump = function() {
        var area = document.getElementById('crashDumpArea');
        if (!area) return;
        var now = new Date();
        var appConfig = window.appConfig || {};
        var frameRate = window.frameRate || 25;
        var isTrackingActive = window.isTrackingActive || false;
        var masterScheduleDB = window.masterScheduleDB || [];
        var cuePresets = window.cuePresets || {};
        var dump = {
            generatedAt: now.toISOString(),
            version: '0.5',
            timezone: appConfig.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            frameRate: frameRate,
            retentionSeconds: appConfig.retentionSeconds || 5,
            isTrackingActive: isTrackingActive,
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
        if (typeof writeLog === 'function') writeLog('\U0001f691 Crash Dump \u5df2\u751f\u6210', 'info');
    };

    L.saveCrashDumpToFile = function() {
        var a = document.getElementById('crashDumpArea');
        if (!a || !a.value) return;
        var b = new Blob([a.value], {type: 'text/plain'});
        var u = URL.createObjectURL(b);
        var d = document.createElement('a');
        d.href = u; d.download = 'VCC_PRE_CrashDump_' + new Date().toISOString().split('T')[0] + '.txt';
        document.body.appendChild(d); d.click(); d.remove(); URL.revokeObjectURL(u);
    };

    // ===== Preset JSON 匯出/匯入 =====
    L.togglePresetJsonArea = function() {
        var area = document.getElementById('presetJsonArea');
        var toggle = document.getElementById('presetJsonToggle');
        if (!area || !toggle) return;
        if (area.style.display === 'none' || area.style.display === '') {
            area.style.display = 'block';
            toggle.innerText = '\u25bc JSON \u4e00\u9375\u532f\u51fa/\u532f\u5165';
            L.refreshPresetJsonArea();
        } else {
            area.style.display = 'none';
            toggle.innerText = '\u25b6 JSON \u4e00\u9375\u532f\u51fa/\u532f\u5165';
        }
    };

    L.refreshPresetJsonArea = function() {
        var area = document.getElementById('presetJsonArea');
        var id = document.getElementById('presetSelector').value;
        var cuePresets = window.cuePresets || {};
        if (!area || !id || !cuePresets[id]) return;
        area.value = JSON.stringify(cuePresets[id], null, 2);
    };

    L.exportPresetAsJson = function() {
        var id = document.getElementById('presetSelector').value;
        var cuePresets = window.cuePresets || {};
        if (!id || !cuePresets[id]) { alert('\u8acb\u5148\u9078\u64c7\u4e00\u500b\u9810\u8a2d\u96c6\uff01'); return; }
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cuePresets[id], null, 2));
        var dl = document.createElement('a'); dl.setAttribute("href", dataStr);
        dl.setAttribute("download", "VCC_PRE_Preset_" + id + ".json");
        document.body.appendChild(dl); dl.click(); dl.remove();
    };

    L.applyPresetJson = function() {
        var area = document.getElementById('presetJsonArea');
        if (!area || !area.value.trim()) { alert("JSON \u5167\u5bb9\u70ba\u7a7a\uff01"); return; }
        try {
            var data = JSON.parse(area.value.trim());
            if (!data.name || !Array.isArray(data.nodes)) { alert("JSON \u5fc5\u9808\u5305\u542b name \u8207 nodes \u9663\u5217"); return; }
            for (var ni = 0; ni < data.nodes.length; ni++) {
                var n = data.nodes[ni];
                if (n.offset === undefined || !n.name) { alert("\u7bc0\u9ede " + (ni+1) + " \u7f3a\u5c11 offset \u6216 name"); return; }
            }
            var selId = document.getElementById('presetSelector').value;
            var cuePresets = window.cuePresets || {};
            var targetId = selId && cuePresets[selId] ? selId : "preset_" + Date.now();
            var cuePresetsW = window.cuePresets || {};
            cuePresetsW[targetId] = { name: data.name, nodes: data.nodes };
            window.cuePresets = cuePresetsW;
            try { localStorage.setItem('county_presets_v8', JSON.stringify(cuePresetsW)); } catch(e) {}
            var API = window.API || {};
            if (API.savePreset) API.savePreset({ id: targetId, name: data.name, nodes: data.nodes });
            if (typeof refreshPresetDropdownUI === 'function') refreshPresetDropdownUI();
            document.getElementById('presetSelector').value = targetId;
            if (typeof onPresetSelectionChange === 'function') onPresetSelectionChange();
            if (typeof markDirty === 'function') markDirty();
            if (window.isTrackingActive && typeof calculateGlobalTimelineMatrix === 'function') calculateGlobalTimelineMatrix(true);
            if (typeof writeLog === 'function') writeLog('\u2705 Preset JSON \u5df2\u5957\u7528: ' + data.name, 'success');
        } catch(err) { alert("JSON \u8a9e\u6cd5\u932f\u8aa4: " + err.message); }
    };

    // ===== 矩陣點擊排程編輯 =====
    L.matrixEditProgram = function(progId) {
        if (typeof switchPage === 'function') switchPage('rundown');
        if (typeof enterEditMode === 'function') enterEditMode(progId);
    };

    // ===== 儀表板核心動態運算 (整合首頁 Programme 檢視器、Timeline、矩陣) =====
    L.updateGlobalDashboard = function() {
        try {
            var getCal = window.getCalibratedDate || function() { return new Date(); };
            var dtc = window.dateToTimecode || function(d) { return '00:00:00:00'; };
            var tcf = window.timecodeToTotalFrames || function(s) { return 0; };
            var ftc = window.totalFramesToTimecode || function(f) { return '00:00:00:00'; };
            var now = getCal();
            var currentTcStr = dtc(now);
            var clockEl = document.getElementById('clock');
            if (clockEl) clockEl.innerText = currentTcStr;

            var currentTotalFrames = tcf(currentTcStr);
            var targetDateStr = document.getElementById('globalTargetDate').value;
            var getExpanded = window.getExpandedRundownForDate || function() { return []; };
            if (typeof getExpanded !== 'function' && County.get('Data') && County.get('Data').getExpandedRundownForDate) {
                getExpanded = County.get('Data').getExpandedRundownForDate;
            }
            var activeList = getExpanded(targetDateStr);

            var onAirProg = null;
            var nextUpProg = null;

            activeList.forEach(function(prog) {
                var startFr = tcf(prog.startTime);
                var durFr = tcf(prog.duration);
                var endFr = startFr + durFr;
                prog.startTotalFrames = startFr;
                prog.endTotalFrames = endFr;
                if (currentTotalFrames >= startFr && currentTotalFrames <= endFr) {
                    onAirProg = prog;
                } else if (startFr > currentTotalFrames && !nextUpProg) {
                    nextUpProg = prog;
                }
            });

            var frameRate = window.frameRate || 25;

            var mcrCard = document.getElementById('mcrOnAirCard');
            var mcrLiveTag = document.getElementById('mcrLiveTag');
            if (mcrCard && mcrLiveTag) {
                if (onAirProg) {
                    mcrCard.classList.remove('no-active');
                    mcrLiveTag.style.display = 'block';
                    document.getElementById('mcrOnAirTitle').innerText = onAirProg.name;
                    var remainingFrames = onAirProg.endTotalFrames - currentTotalFrames;
                    var remainingSec = Math.ceil(remainingFrames / frameRate);
                    var rMin = Math.floor(remainingSec / 60);
                    var rSec = remainingSec % 60;
                    document.getElementById('mcrOnAirCountdown').innerText = "\u23f3 \u96e2\u7d50\u675f\u5269\u9918: " + (rMin > 0 ? rMin + "m " : "") + rSec + "s";
                } else {
                    mcrCard.classList.add('no-active');
                    mcrLiveTag.style.display = 'none';
                    document.getElementById('mcrOnAirTitle').innerText = "\u7121\u5e38\u898f\u7bc0\u76ee\u64ad\u51fa (IDLE)";
                    document.getElementById('mcrOnAirCountdown').innerText = "\u7cfb\u7d71\u975c\u614b\u5f85\u547d";
                }
            }

            var nextTitleEl = document.getElementById('mcrNextTitle');
            if (nextTitleEl) {
                if (nextUpProg) {
                    var nStartFr = tcf(nextUpProg.startTime);
                    var nDiffSec = Math.ceil((nStartFr - currentTotalFrames) / frameRate);
                    var nMin = Math.floor(nDiffSec / 60);
                    var nSec = nDiffSec % 60;
                    nextTitleEl.innerText = nextUpProg.name + " [" + nextUpProg.startTime + "] (\u5012\u6578 " + (nMin > 0 ? nMin + "m " : "") + nSec + "s \u5f8c\u64ad)";
                } else {
                    nextTitleEl.innerText = "\u7121\u5f8c\u7e8c\u6392\u7a0b\u7bc0\u76ee";
                }
            }

            var timelineRange = window.timelineRange || { minFrames: 0, maxFrames: 86400 * 25 };
            var rangeSpan = timelineRange.maxFrames - timelineRange.minFrames;
            if (rangeSpan > 0) {
                var nowPct = Math.min(100, Math.max(0, ((currentTotalFrames - timelineRange.minFrames) / rangeSpan) * 100));
                var nowMarker = document.getElementById('timelineNowMarker');
                var nowLabel = document.getElementById('timelineNowLabel');
                if (nowMarker) nowMarker.style.left = nowPct + '%';
                if (nowLabel) { nowLabel.style.left = nowPct + '%'; nowLabel.innerText = '\u25bc NOW ' + currentTcStr; }
            }

            var globalTriggers = window.globalTriggers || [];
            var getRetention = window.getRetentionFrames || function() { return 5 * frameRate; };

            var nearestIdx = -1;
            var nearestDiff = Infinity;
            for (var k = 0; k < globalTriggers.length; k++) {
                var absDiff = Math.abs(globalTriggers[k].targetFrames - currentTotalFrames);
                if (absDiff < nearestDiff) { nearestDiff = absDiff; nearestIdx = k; }
            }

            var currentCueEl = document.getElementById('currentCueDisplay');
            var nextCueEl = document.getElementById('nextCueDisplay');
            if (currentCueEl && nextCueEl) {
                var activeCueIdx = -1;
                var upcomingCueIdx = -1;
                for (var ci = 0; ci < globalTriggers.length; ci++) {
                    var cf = globalTriggers[ci].targetFrames - currentTotalFrames;
                    if (cf <= 0 && cf > -getRetention()) {
                        activeCueIdx = ci;
                    }
                    if (cf > 0 && upcomingCueIdx < 0) {
                        upcomingCueIdx = ci;
                    }
                }
                if (activeCueIdx >= 0) {
                    var ac = globalTriggers[activeCueIdx];
                    currentCueEl.innerHTML = '\U0001f6a8 ' + ac.progName + ' \u2014 <span style="color:#9ca3af;">' + ac.cueName + '</span> [' + ac.timecodeStr + ']';
                } else if (upcomingCueIdx >= 0 && nearestIdx >= 0) {
                    var nc = globalTriggers[nearestIdx];
                    var nDiff = nc.targetFrames - currentTotalFrames;
                    if (nDiff > -getRetention() && nDiff <= 0) {
                        currentCueEl.innerHTML = '\U0001f6a8 ' + nc.progName + ' \u2014 <span style="color:#9ca3af;">' + nc.cueName + '</span> [' + nc.timecodeStr + ']';
                    } else {
                        currentCueEl.innerHTML = '<span style="color:#64748b;">\u2014 \u7121\u89f8\u767a\u4e2d Cue</span>';
                    }
                } else {
                    currentCueEl.innerHTML = '<span style="color:#64748b;">\u2014 \u7121\u89f8\u767a\u4e2d Cue</span>';
                }
                if (upcomingCueIdx >= 0) {
                    var uc = globalTriggers[upcomingCueIdx];
                    var uDiffSec = Math.ceil((uc.targetFrames - currentTotalFrames) / frameRate);
                    nextCueEl.innerHTML = '\u279e ' + uc.progName + ' \u2014 <span style="color:#9ca3af;">' + uc.cueName + '</span> [' + uc.timecodeStr + '] <span style="color:#64748b; font-weight:normal;">(' + uDiffSec + 's)</span>';
                } else {
                    nextCueEl.innerHTML = '<span style="color:#64748b;">\u2014 \u7121\u5f8c\u7e8c Cue</span>';
                }

                var cueCDLabel = document.getElementById('cueCountdownLabel');
                var cueCDTimer = document.getElementById('cueCountdownTimer');
                var cueCDMeta = document.getElementById('cueCountdownMeta');
                if (cueCDLabel && cueCDTimer && cueCDMeta) {
                    if (upcomingCueIdx >= 0) {
                        var uc2 = globalTriggers[upcomingCueIdx];
                        var diffFrames = uc2.targetFrames - currentTotalFrames;
                        var diffSec = Math.max(0, Math.ceil(diffFrames / frameRate));
                        var mm = Math.floor(diffSec / 60);
                        var ss = diffSec % 60;
                        cueCDLabel.innerText = uc2.progName + ' \u2014 ' + uc2.cueName;
                        cueCDTimer.innerText = String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
                        cueCDMeta.innerText = '\u76ee\u6a19: ' + uc2.timecodeStr + ' | \u5269\u9918 ' + diffSec + ' \u79d2';
                    } else {
                        cueCDLabel.innerText = '\u2014';
                        cueCDTimer.innerText = '--:--';
                        cueCDMeta.innerText = '\u5c1a\u7121\u5f8c\u7e8c Cue';
                    }
                }
            }

            var windowStart = Math.max(0, nearestIdx - 3);
            var windowEnd = Math.min(globalTriggers.length - 1, nearestIdx + 3);
            var windowIndices = {};
            for (var w = windowStart; w <= windowEnd; w++) { windowIndices[w] = true; }

            var distList = [];
            for (var d = windowStart; d <= windowEnd; d++) {
                var ff = globalTriggers[d].targetFrames - currentTotalFrames;
                if (ff <= -getRetention()) continue;
                distList.push({ idx: d, diff: Math.abs(ff) });
            }
            distList.sort(function(a, b) { return a.diff - b.diff; });
            var top1 = distList.length > 0 ? distList[0].idx : -1;
            var top2 = distList.length > 1 ? distList[1].idx : -1;
            var top3 = distList.length > 2 ? distList[2].idx : -1;

            // Throttle DOM matrix render to 10fps
            var _lastMatrixRender = window.__liveUI_lastMatrixRender || 0;
            var _matrixRowCache = window.__liveUI_matrixRowCache || [];
            var _matrixStatusCache = window.__liveUI_matrixStatusCache || [];
            var nowMs = Date.now();
            var shouldRenderMatrix = (nowMs - _lastMatrixRender > 100);

            if (_matrixRowCache.length !== globalTriggers.length) {
                _matrixRowCache = [];
                _matrixStatusCache = [];
                for (var ri = 0; ri < globalTriggers.length; ri++) {
                    _matrixRowCache[ri] = document.getElementById("mx-row-" + ri);
                    _matrixStatusCache[ri] = document.getElementById("mx-status-" + ri);
                }
                window.__liveUI_matrixRowCache = _matrixRowCache;
                window.__liveUI_matrixStatusCache = _matrixStatusCache;
            }

            var scrollWrap = document.getElementById('matrixScrollWrap');
            var retentionFrames = getRetention();
            var progColorMap = window.progColorMap || {};

            // Always process CUE triggers, even when throttled
            for (var i = 0; i < globalTriggers.length; i++) {
                if (!windowIndices[i]) continue;
                if (globalTriggers[i].triggered) continue;
                var diffFrames = globalTriggers[i].targetFrames - currentTotalFrames;
                if (diffFrames <= 0 && diffFrames > -retentionFrames) {
                    if (typeof writeLog === 'function') writeLog("\u81ea\u52d5\u5316 CUE \u9ede\u89f8\u767a\uff1a" + globalTriggers[i].fullNodeName, 'warn');
                    if (typeof playBroadcastBeep === 'function') playBroadcastBeep(globalTriggers[i].freq, globalTriggers[i].soundPreset);
                    if (typeof sendCueNotification === 'function') sendCueNotification(globalTriggers[i].progName, globalTriggers[i].cueName);
                    if (typeof recordTrigger === 'function') recordTrigger(globalTriggers[i]);
                    globalTriggers[i].triggered = true;
                }
            }

            if (shouldRenderMatrix) {
                window.__liveUI_lastMatrixRender = nowMs;

                for (var i2 = 0; i2 < globalTriggers.length; i2++) {
                    var row = _matrixRowCache[i2];
                    var statusCell = _matrixStatusCache[i2];
                    if (!row || !statusCell) continue;

                    if (!windowIndices[i2]) { row.style.display = "none"; continue; }
                    row.style.display = "";

                    var diffFrames2 = globalTriggers[i2].targetFrames - currentTotalFrames;
                    var totalCheckSec = Math.ceil(Math.abs(diffFrames2) / frameRate);
                    var minPart = Math.floor(totalCheckSec / 60);
                    var secPart = totalCheckSec % 60;
                    var timeStr = (minPart > 0 ? minPart + "m " : "") + secPart + "s";
                    var colorIdx = (progColorMap[globalTriggers[i2].progName] !== undefined) ? progColorMap[globalTriggers[i2].progName] : 0;

                    if (diffFrames2 <= 0 && diffFrames2 > -retentionFrames) {
                        row.className = "row-trigger-active matrix-row prog-color-" + colorIdx;
                        statusCell.innerText = "\U0001f6a8 CUE \U0001f6a8";
                        continue;
                    }

                    if (i2 === top1) {
                        row.className = "row-imminent matrix-row prog-color-" + colorIdx;
                        statusCell.innerText = "\u2b24 \u5373\u5c07\u9032\u884c [-" + timeStr + "]";
                    } else if (i2 === top2 || i2 === top3) {
                        row.className = "row-future matrix-row prog-color-" + colorIdx;
                        var relSign = diffFrames2 >= 0 ? "\u5f8c" : "\u524d";
                        statusCell.innerText = "\u25cf " + relSign + timeStr;
                    } else {
                        row.className = "row-dimmed matrix-row prog-color-" + colorIdx;
                        var relSign2 = diffFrames2 >= 0 ? "+" : "-";
                        statusCell.innerText = "\u25cb " + relSign2 + timeStr;
                    }
                }

                var centerIdx = (top1 >= 0) ? top1 : nearestIdx;
                var lastNearestIdx = window.__liveUI_lastNearestIdx || -1;
                if (centerIdx >= 0 && scrollWrap && centerIdx !== lastNearestIdx) {
                    window.__liveUI_lastNearestIdx = centerIdx;
                    var targetRow = _matrixRowCache[centerIdx];
                    if (targetRow) {
                        scrollWrap.scrollTop = Math.max(0, targetRow.offsetTop - (scrollWrap.clientHeight / 2) + (targetRow.clientHeight / 2));
                    }
                }
            }
        } catch (err) {
            if (typeof writeLog === 'function') writeLog("\u6642\u5e8f\u6838\u5fc3\u932f\u8aa4: " + err.message, 'error');
        }
    };

    return L;
});
