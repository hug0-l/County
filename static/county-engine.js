// county-engine.js — CUE 引擎模組 (initGlobalTracking, calculateGlobalTimelineMatrix, checkCueTriggersOnly, etc.)
County.register('Engine', function(C) {
    var E = {};

    // ===== Helper: retention frames from config =====
    E.getRetentionFrames = function() {
        var appConfig = window.appConfig || {};
        var frameRate = window.frameRate || 25;
        var sec = appConfig.retentionSeconds || 5;
        return sec * frameRate;
    };

    // ===== 首頁 MCR 交通摘要與時序檢查安全計算 =====
    E.calculateMCRTrafficSummary = function() {
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

    // ===== 輕量級 CUE 觸發檢查（不限頁面，不更新 DOM 矩陣） =====
    E.checkCueTriggersOnly = function() {
        try {
            if (!window.isTrackingActive || !window.globalTriggers || window.globalTriggers.length === 0) return;
            var getCal = window.getCalibratedDate || function() { return new Date(); };
            var now = getCal();
            var dtc = window.dateToTimecode || function(d) { return '00:00:00:00'; };
            var tcf = window.timecodeToTotalFrames || function(s) { return 0; };
            var currentTotalFrames = tcf(dtc(now));
            var retentionFrames = E.getRetentionFrames();
            var triggers = window.globalTriggers;
            for (var ci = 0; ci < triggers.length; ci++) {
                if (triggers[ci].triggered) continue;
                var diff = triggers[ci].targetFrames - currentTotalFrames;
                if (diff <= 0 && diff > -retentionFrames) {
                    if (typeof writeLog === 'function') writeLog('CUE \u89f8\u767a\uff1a' + triggers[ci].fullNodeName, 'warn');
                    if (typeof playBroadcastBeep === 'function') playBroadcastBeep(triggers[ci].freq, triggers[ci].soundPreset);
                    if (typeof sendCueNotification === 'function') sendCueNotification(triggers[ci].progName, triggers[ci].cueName);
                    E.recordTrigger(triggers[ci]);
                    triggers[ci].triggered = true;
                }
            }
        } catch (e) {
            if (typeof writeLog === 'function') writeLog('CUE \u6aa2\u67e5\u5668\u932f\u8aa4: ' + e.message, 'error');
        }
    };

    // ===== 引擎啟動/停止 =====
    E.initGlobalTracking = function() {
        var trackBtn = document.getElementById('btnMainTrack');
        if (window.isTrackingActive) {
            window.isTrackingActive = false;
            if (window.timerInterval) { clearInterval(window.timerInterval); window.timerInterval = null; }
            if (trackBtn) {
                trackBtn.style.backgroundColor = '';
                trackBtn.innerText = '\u25b6 \u555f\u52d5\u4e3b\u63a7\u76e3\u6e2c (RUN ENGINE)';
            }
            var engineStatusEl = document.getElementById('homeEngineStatus');
            if (engineStatusEl) {
                engineStatusEl.innerText = '\u5f15\u64ce\u5df2\u505c\u6b62';
                engineStatusEl.style.color = '#64748b';
            }
            var sideEng = document.getElementById('sidebarEngineStatus');
            if (sideEng) sideEng.innerText = '\u23f9\ufe0f \u5f15\u64ce\u5f85\u547d';
            if (typeof writeLog === 'function') writeLog('\u23f9\ufe0f \u4e3b\u63a7\u76e3\u6e2c ENGINE \u5df2\u505c\u6b62', 'warn');
            return;
        }

        var targetDateStr = document.getElementById('globalTargetDate').value;
        var getExpanded = window.getExpandedRundownForDate || function() { return []; };
        if (typeof getExpanded !== 'function' && County.get('Data') && County.get('Data').getExpandedRundownForDate) {
            getExpanded = County.get('Data').getExpandedRundownForDate;
        }
        var activeList = getExpanded(targetDateStr);
        if (activeList.length === 0) { alert('\u7576\u524d\u89c0\u6e2c\u65e5\u7121\u8cc7\u6599\u53ef\u4f9b\u6642\u5e8f\u76e3\u6e2b\u904b\u7b97'); return; }

        window.isTrackingActive = true;
        if (trackBtn) {
            trackBtn.style.backgroundColor = '#ea580c';
            trackBtn.innerText = '\U0001f6a8 ENGINE LIVE (\u9ede\u64ca\u505c\u6b62)';
        }
        var engineStatusEl = document.getElementById('homeEngineStatus');
        if (engineStatusEl) {
            engineStatusEl.innerText = '\u6838\u5fc3\u904b\u7b97\u5f15\u64ce\uff1aON-AIR RUNNING';
            engineStatusEl.style.color = 'const(--warning)';
        }
        var sideEng = document.getElementById('sidebarEngineStatus');
        if (sideEng) sideEng.innerText = '\U0001f7e2 ENGINE ON-AIR';
        if (typeof writeLog === 'function') writeLog('County \u89c0\u6e2c\u65e5 [' + targetDateStr + '] \u77e9\u9635\u5f15\u64ce\u9396\u5b9a\u4e26\u4f5c\u70ba\u4e3b\u63a7\u9996\u9801\u6838\u5fc3\u3002', 'warn');

        E.calculateGlobalTimelineMatrix(false);
    };

    // ===== 時序矩陣核心計算（含 Timeline GUI 初始化） =====
    E.calculateGlobalTimelineMatrix = function(isHotReload) {
        var targetDateStr = document.getElementById('globalTargetDate').value;
        var getExpanded = window.getExpandedRundownForDate || function() { return []; };
        if (typeof getExpanded !== 'function' && County.get('Data') && County.get('Data').getExpandedRundownForDate) {
            getExpanded = County.get('Data').getExpandedRundownForDate;
        }
        var activeList = getExpanded(targetDateStr);

        var MATRIX_COLORS = window.MATRIX_COLORS || ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#f97316'];
        var presetSoundList = window.soundPresets || [];
        var cuePresets = window.cuePresets || {};
        var timelineRange = window.timelineRange || { minFrames: 0, maxFrames: 86400*25 };
        var globalTriggers = window.globalTriggers || [];
        var frameRate = window.frameRate || 25;
        var progColorMap = window.progColorMap || {};
        var progDurations = window.progDurations || {};
        var tcf = window.timecodeToTotalFrames || function(s) { return 0; };
        var ftc = window.totalFramesToTimecode || function(f) { return '00:00:00:00'; };

        // Build progColorMap from active list
        var uniqueProgNames = [];
        var seenNames = {};
        activeList.forEach(function(p) {
            if (!seenNames[p.id]) { seenNames[p.id] = true; uniqueProgNames.push(p.name); }
        });
        uniqueProgNames.forEach(function(name, idx) {
            var clrOverride = null;
            activeList.forEach(function(p) { if (p.name === name && p.colorLabel) clrOverride = p.colorLabel; });
            if (clrOverride) {
                var bestDiff = Infinity, bestIdx = 0;
                for (var ci = 0; ci < MATRIX_COLORS.length; ci++) {
                    var diff = Math.abs(parseInt(clrOverride.slice(1), 16) - parseInt(MATRIX_COLORS[ci].slice(1), 16));
                    if (diff < bestDiff) { bestDiff = diff; bestIdx = ci; }
                }
                progColorMap[name] = bestIdx;
            } else {
                progColorMap[name] = idx % 8;
            }
        });
        window.progColorMap = progColorMap;

        // Calculate timeline range from all programs
        timelineRange.minFrames = 86400*25;
        timelineRange.maxFrames = 0;
        activeList.forEach(function(prog) {
            var sf = tcf(prog.startTime);
            var df = tcf(prog.duration);
            if (sf < timelineRange.minFrames) timelineRange.minFrames = sf;
            if (sf + df > timelineRange.maxFrames) timelineRange.maxFrames = sf + df;
        });
        if (timelineRange.maxFrames - timelineRange.minFrames < 90000) {
            var pad = 45000;
            timelineRange.minFrames = Math.max(0, timelineRange.minFrames - pad);
            timelineRange.maxFrames = timelineRange.minFrames + 90000;
        }

        var triggeredBackup = {};
        globalTriggers.forEach(function(t) { triggeredBackup[t.fullNodeName] = t.triggered; });
        globalTriggers = [];

        activeList.forEach(function(prog) {
            var startFrames = tcf(prog.startTime);
            var durFrames = tcf(prog.duration);
            var endFrames = startFrames + durFrames;

            prog.startTotalFrames = startFrames;
            prog.endTotalFrames = endFrames;
            progDurations[prog.name] = { startFrames: startFrames, endFrames: endFrames, progName: prog.name };

            var targetPreset = cuePresets[prog.presetId] ? cuePresets[prog.presetId] : cuePresets.pre_broadcast;
            if (!targetPreset) targetPreset = { nodes: [] };

            targetPreset.nodes.forEach(function(node) {
                var nodeTargetFrames = 0;
                if (typeof node.offset === 'string' && node.offset.startsWith('e')) {
                    var offSec = parseInt(node.offset.replace('e', ''), 10);
                    nodeTargetFrames = endFrames + (offSec * frameRate);
                } else {
                    nodeTargetFrames = startFrames + (node.offset * frameRate);
                }

                var fullNodeName = '\u3010' + prog.name + '\u3011' + node.name;
                var wasTriggered = triggeredBackup[fullNodeName] ? true : false;

                var spMatch = null;
                if (node.soundId) {
                    for (var si = 0; si < presetSoundList.length; si++) {
                        if (presetSoundList[si].id === node.soundId) { spMatch = presetSoundList[si]; break; }
                    }
                }
                if (!spMatch) {
                    var bestDiff = Infinity, bestIdx = 0;
                    for (var si = 0; si < presetSoundList.length; si++) {
                        var diff = Math.abs(presetSoundList[si].freq - (node.freq || 1000));
                        if (diff < bestDiff) { bestDiff = diff; bestIdx = si; }
                    }
                    spMatch = presetSoundList[bestIdx];
                }
                globalTriggers.push({
                    progId: prog.id,
                    progName: prog.name,
                    progTags: prog.tags || [],
                    cueName: node.name,
                    fullNodeName: fullNodeName,
                    targetFrames: nodeTargetFrames,
                    timecodeStr: ftc(nodeTargetFrames),
                    triggered: wasTriggered,
                    freq: node.freq,
                    soundPreset: spMatch || null
                });
            });
        });

        globalTriggers.sort(function(a, b) { return a.targetFrames - b.targetFrames; });
        window.globalTriggers = globalTriggers;

        if (isHotReload && typeof writeLog === 'function') writeLog('\u6642\u5e8f\u77e9\u9635\u9996\u9801\u8cc7\u6599\u6d41\u71b1\u63d2\u62d4\u91cd\u7b97\u5b8c\u6210\u3002');

        var matrixBody = document.getElementById('matrixTableBody');
        if (!matrixBody) return;
        matrixBody.innerHTML = '';

        var grouped = {};
        globalTriggers.forEach(function(t, i) {
            if (!grouped[t.progName]) grouped[t.progName] = { triggers: [], progIndex: i };
            grouped[t.progName].triggers.push(i);
        });
        var sortedProgNames = Object.keys(grouped).sort(function(a, b) { return grouped[a].progIndex - grouped[b].progIndex; });
        sortedProgNames.forEach(function(pn) {
            var pd = progDurations[pn];
            var progStartTC = pd ? ftc(pd.startFrames).substring(0, 8) : '--:--:--';
            var progEndTC = pd ? ftc(pd.endFrames).substring(0, 8) : '--:--:--';
            var indices = grouped[pn].triggers;
            var cIdx = (progColorMap[pn] !== undefined) ? progColorMap[pn] : 0;
            var firstT = globalTriggers[indices[0]];
            var tagsHtml = '';
            if (firstT.progTags && firstT.progTags.length > 0) {
                firstT.progTags.forEach(function(tt) {
                    tagsHtml += '<span class="tag-badge" style="background:#1f2937;color:#e2e8f0;">' + tt + '</span> ';
                });
            }
            var _progId = firstT.progId;
            matrixBody.innerHTML += '<tr class="matrix-row prog-color-' + cIdx + '" style="background:#0f172a;border-bottom:2px solid #1f2937;">' +
                '<td colspan="6" style="padding:8px 10px;">' +
                '<span class="prog-color-dot" style="background:' + MATRIX_COLORS[cIdx] + ';width:12px;height:12px;"></span> ' +
                '<b style="font-size:14px;cursor:pointer;" onclick="matrixEditProgram(\'' + _progId + '\')" title="\u9ede\u64ca\u7de8\u8f2c\u6b64\u7bc0\u76ee">' + pn + '</b>' +
                tagsHtml +
                ' <span style="color:#64748b;font-size:11px;font-family:monospace;">[' + progStartTC + ' \u2013 ' + progEndTC + ']</span>' +
                '</td></tr>';
            indices.forEach(function(ti) {
                var t = globalTriggers[ti];
                matrixBody.innerHTML += '<tr id="mx-row-' + ti + '" class="matrix-row prog-color-' + cIdx + '" style="border-top:none;">' +
                    '<td></td><td></td>' +
                    '<td style="padding-left:12px;">' + t.cueName + '</td>' +
                    '<td style="font-family:monospace;">' + t.timecodeStr + '</td>' +
                    '<td id="mx-status-' + ti + '">\u7b49\u5f85</td></tr>';
            });
        });

        // Initialize timeline labels & ruler
        var rangeStartEl = document.getElementById('timelineRangeStart');
        var rangeEndEl = document.getElementById('timelineRangeEnd');
        if (rangeStartEl) rangeStartEl.innerText = ftc(timelineRange.minFrames);
        if (rangeEndEl) rangeEndEl.innerText = ftc(timelineRange.maxFrames);
        var rangeSpan = timelineRange.maxFrames - timelineRange.minFrames;
        var trackContainer = document.getElementById('timelineTrackContainer');
        if (trackContainer && rangeSpan > 0 && globalTriggers.length > 0) {
            var progCues = {};
            globalTriggers.forEach(function(t) {
                if (!progCues[t.progName]) progCues[t.progName] = [];
                progCues[t.progName].push(t);
            });
            var progNames = Object.keys(progCues);
            var ruler = document.getElementById('timelineRuler');
            if (ruler) {
                ruler.innerHTML = '';
                var rulerSteps = Math.min(8, progNames.length + 2);
                for (var rs = 0; rs <= rulerSteps; rs++) {
                    var rl = document.createElement('div');
                    rl.className = 'timeline-ruler-label';
                    rl.style.left = (100 * rs / rulerSteps) + '%';
                    rl.innerText = ftc(Math.round(timelineRange.minFrames + rangeSpan * rs / rulerSteps)).substring(0, 8);
                    ruler.appendChild(rl);
                }
            }
            trackContainer.innerHTML = '';
            progNames.forEach(function(pn) {
                var cIdx = (progColorMap[pn] !== undefined) ? progColorMap[pn] : 0;
                var track = document.createElement('div');
                track.className = 'timeline-track';
                var label = document.createElement('div');
                label.className = 'timeline-track-label';
                label.innerHTML = '<span class="prog-color-dot" style="background:' + MATRIX_COLORS[cIdx] + ';width:6px;height:6px;"></span> ' + pn;
                track.appendChild(label);
                var bar = document.createElement('div');
                bar.className = 'timeline-track-bar';

                var pd = progDurations[pn];
                if (pd && pd.startFrames < pd.endFrames) {
                    var blockStart = Math.max(0, ((pd.startFrames - timelineRange.minFrames) / rangeSpan) * 100);
                    var blockEnd = Math.min(100, ((pd.endFrames - timelineRange.minFrames) / rangeSpan) * 100);
                    var block = document.createElement('div');
                    block.className = 'timeline-prog-block';
                    block.style.left = blockStart + '%';
                    block.style.width = Math.max(0.5, blockEnd - blockStart) + '%';
                    block.style.backgroundColor = MATRIX_COLORS[cIdx];
                    block.title = pn + ' [' + ftc(pd.startFrames).substring(0, 5) + ' \u2013 ' + ftc(pd.endFrames).substring(0, 5) + ']';
                    bar.appendChild(block);
                    block.addEventListener('mouseenter', function(e) {
                        var tt = document.getElementById('timelineTooltip');
                        if (tt) {
                            tt.innerHTML = '<b>' + pn + '</b><br>\u958b\u59cb: ' + ftc(pd.startFrames) +
                                           '<br>\u7d50\u675f: ' + ftc(pd.endFrames) +
                                           '<br>\u9577\u5ea6: ' + ftc(pd.endFrames - pd.startFrames);
                            tt.style.display = 'block';
                        }
                    });
                    block.addEventListener('mousemove', function(e) {
                        var tt = document.getElementById('timelineTooltip');
                        if (tt && tt.style.display === 'block') {
                            tt.style.left = (e.clientX + 16) + 'px';
                            tt.style.top = (e.clientY - 40) + 'px';
                        }
                    });
                    block.addEventListener('mouseleave', function() {
                        var tt = document.getElementById('timelineTooltip');
                        if (tt) tt.style.display = 'none';
                    });
                }

                progCues[pn].forEach(function(t) {
                    var pct = ((t.targetFrames - timelineRange.minFrames) / rangeSpan) * 100;
                    if (pct < 0 || pct > 100) return;
                    var tick = document.createElement('div');
                    tick.className = 'timeline-cue-tick';
                    tick.style.left = pct + '%';
                    tick.style.backgroundColor = MATRIX_COLORS[cIdx];
                    tick.title = t.cueName + ' [' + t.timecodeStr + ']';
                    bar.appendChild(tick);
                });
                track.appendChild(bar);
                trackContainer.appendChild(track);
            });
        } else {
            if (trackContainer) trackContainer.innerHTML = '';
            var ruler = document.getElementById('timelineRuler');
            if (ruler) ruler.innerHTML = '';
        }
    };

    // ===== 觸發記錄管理 =====
    E.recordTrigger = function(t) {
        var triggerHistory = window.triggerHistory || [];
        triggerHistory.unshift({
            time: new Date().toISOString(),
            cue: t.fullNodeName,
            prog: t.progName,
            timecode: t.timecodeStr
        });
        if (triggerHistory.length > 200) triggerHistory.pop();
        window.triggerHistory = triggerHistory;
        var countEl = document.getElementById('triggerHistoryCount');
        if (countEl) countEl.innerText = '(' + triggerHistory.length + ' \u7b46)';
    };

    E.showTriggerHistory = function() {
        var modal = document.getElementById('triggerHistoryModal');
        var list = document.getElementById('triggerHistoryList');
        if (!modal || !list) return;
        var triggerHistory = window.triggerHistory || [];
        if (triggerHistory.length === 0) {
            list.innerHTML = '<div style="color:#64748b; text-align:center; padding:30px 0;">\u5c1a\u7121\u89f8\u767a\u8a18\u9304</div>';
        } else {
            var html = '';
            triggerHistory.forEach(function(entry) {
                var d = new Date(entry.time);
                var timeStr = d.toLocaleString('zh-HK', { hour12: false });
                html += '<div style="padding:6px 0; border-bottom:1px solid #1f2937; display:flex; gap:12px; align-items:center;">' +
                    '<span style="color:#ef4444; font-weight:bold;">\U0001f6a8</span>' +
                    '<span style="color:#94a3b8; font-size:11px; min-width:140px;">' + timeStr + '</span>' +
                    '<span style="color:#f1f5f9; font-weight:bold;">' + entry.cue + '</span>' +
                    '<span style="color:#64748b; font-family:monospace;">[' + entry.timecode + ']</span>' +
                    '</div>';
            });
            list.innerHTML = html;
        }
        modal.style.display = 'flex';
    };

    E.closeTriggerHistory = function() {
        var modal = document.getElementById('triggerHistoryModal');
        if (modal) modal.style.display = 'none';
    };

    return E;
});
