// county-sound.js — 音效模組
County.register('Sound', function(C) {
    var S = {};

    // 提示音 Preset 定義（含長短響、重複次數）
    // 引擎 CUE 觸發時查此表取得完整設定（波形/頻率/重複次數/間隔）
    var soundPresets = [
        { id: 'short_beep',  label: '短促 Beep',     freq: 800,  dur: 0.15, repeats: 1, gap: 0,    type: 'sine' },
        { id: 'double_beep', label: '雙短 Beep (2x)', freq: 1000, dur: 0.15, repeats: 2, gap: 0.12, type: 'sine' },
        { id: 'triple_beep', label: '三短 Beep (3x)', freq: 1200, dur: 0.12, repeats: 3, gap: 0.08, type: 'sine' },
        { id: 'long_beep',   label: '長響 Beep',      freq: 1500, dur: 0.8,  repeats: 1, gap: 0,    type: 'sine' },
        { id: 'double_long', label: '雙長響 (2x)',     freq: 1500, dur: 0.7,  repeats: 2, gap: 0.15, type: 'sine' },
        { id: 'alert',       label: '急促 Alert (3x)', freq: 2000, dur: 0.1,  repeats: 3, gap: 0.06, type: 'square' },
        { id: 'chime',       label: '柔和 Chime',      freq: 1500, dur: 0.5,  repeats: 1, gap: 0,    type: 'sine' },
        { id: 'bell',        label: '低沈 Bell',       freq: 400,  dur: 0.5,  repeats: 1, gap: 0,    type: 'sine' },
        { id: 'tone',        label: '標準 Tone',       freq: 1000, dur: 0.3,  repeats: 1, gap: 0,    type: 'sine' },
        { id: 'silent',      label: '靜音 (無提示)',    freq: 0,    dur: 0,    repeats: 0, gap: 0,    type: 'sine' }
    ];

    // AudioContext 管理
    function getAudioCtx() {
        if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume();
        }
        return window.audioCtx;
    }

    // 播放提示音
    S.playBroadcastBeep = function(customFreq, presetObj) {
        if (customFreq === 0 || (presetObj && presetObj.id === 'silent')) return;
        try {
            var actx = getAudioCtx();

            // 如果傳入 soundPreset 物件，使用完整設定（含重複次數、波形）
            if (presetObj) {
                var repeats = presetObj.repeats || 1;
                var gap = presetObj.gap || 0;
                var dur = presetObj.dur || 0.3;
                var freq = presetObj.freq || customFreq || 1000;
                var type = presetObj.type || 'sine';
                for (var r = 0; r < repeats; r++) {
                    (function(idx) {
                        var offset = (dur + gap) * idx;
                        setTimeout(function() {
                            var osc = actx.createOscillator();
                            var gain = actx.createGain();
                            osc.connect(gain);
                            gain.connect(actx.destination);
                            osc.type = type;
                            osc.frequency.value = freq;
                            gain.gain.setValueAtTime(0.3, actx.currentTime);
                            osc.start();
                            osc.stop(actx.currentTime + dur);
                        }, offset * 1000);
                    })(r);
                }
                return;
            }

            // 向後相容：只傳頻率數字
            var beepFreq = customFreq || parseFloat(document.getElementById('cfgBeepFreq').value) || 1500;
            var duration = parseFloat(document.getElementById('cfgBeepDur').value) || 0.5;
            var osc = actx.createOscillator();
            var gain = actx.createGain();
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.type = 'sine';
            osc.frequency.value = beepFreq;
            gain.gain.setValueAtTime(0.3, actx.currentTime);
            osc.start();
            osc.stop(actx.currentTime + duration);
        } catch (e) {
            // 靜默忽略音效播放錯誤
        }
    };

    // 預聽節點提示音
    S.previewSound = function(row) {
        var sel = row.querySelector('.soundSelect');
        if (!sel) return;
        var soundId = sel.value;
        if (soundId === 'silent') {
            if (typeof writeLog === 'function') writeLog('🔇 靜音模式，無提示音', 'info');
            return;
        }
        var preset = null;
        for (var i = 0; i < soundPresets.length; i++) {
            if (soundPresets[i].id === soundId) { preset = soundPresets[i]; break; }
        }
        if (!preset) return;
        try {
            var actx = getAudioCtx();
            var repeats = preset.repeats || 1;
            var gap = preset.gap || 0;
            var dur = preset.dur || 0.3;
            var freq = preset.freq || 1000;
            var type = preset.type || 'sine';
            for (var r = 0; r < repeats; r++) {
                (function(idx) {
                    var offset = (dur + gap) * idx;
                    setTimeout(function() {
                        var osc = actx.createOscillator();
                        var gain = actx.createGain();
                        osc.connect(gain);
                        gain.connect(actx.destination);
                        osc.type = type;
                        osc.frequency.value = freq;
                        gain.gain.setValueAtTime(0.25, actx.currentTime);
                        osc.start();
                        osc.stop(actx.currentTime + dur);
                    }, offset * 1000);
                })(r);
            }
            var info = preset.label + (repeats > 1 ? ' (' + repeats + '次)' : '');
            if (typeof writeLog === 'function') writeLog('🔊 Preview: ' + info);
        } catch (e) {
            if (typeof writeLog === 'function') writeLog('🔇 Preview: ' + e.message, 'error');
        }
    };

    // 測試音
    S.testOscillatorSound = function() {
        S.playBroadcastBeep();
        if (typeof writeLog === 'function') writeLog('發射手動對位測試音。');
    };

    // 取得 soundPresets 陣列（供外部使用）
    S.getSoundPresets = function() {
        return soundPresets;
    };

    // 依 soundId 查找 preset
    S.findPresetById = function(id) {
        for (var i = 0; i < soundPresets.length; i++) {
            if (soundPresets[i].id === id) return soundPresets[i];
        }
        return null;
    };

    return S;
});
