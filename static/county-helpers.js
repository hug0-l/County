// county-helpers.js — Commons 共用工具
County.register('Helpers', function(C) {
    var H = {};

    H.escapeHtml = function(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    H.formatSize = function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1073741824).toFixed(2) + ' GB';
    };

    H.toggleSidebar = function() {
        document.getElementById('mainSidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('open');
        if (document.getElementById('mainSidebar').classList.contains('open')) {
            document.querySelectorAll('#mainSidebar .menu-item').forEach(function(el) {
                el._listener = function() { H.toggleSidebar(); };
                el.addEventListener('click', el._listener);
            });
        }
    };

    H.adjustMatrixHeight = function() {
        var wrap = document.getElementById('matrixScrollWrap');
        if (!wrap) return;
        var rect = wrap.getBoundingClientRect();
        var viewH = window.innerHeight;
        var topOffset = rect.top;
        var newH = Math.max(120, viewH - topOffset - 160);
        wrap.style.height = newH + 'px';
    };

    H.formatTimeInAppTz = function(isoStr, style) {
        if (!isoStr) return '\u2014';
        var tz = (window.appConfig && window.appConfig.timezone) ? window.appConfig.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
        try {
            var d = new Date(isoStr);
            if (style === 'time') return d.toLocaleTimeString('zh-HK', { timeZone: tz, hour12: false });
            if (style === 'datetime') return d.toLocaleString('zh-HK', { timeZone: tz, hour12: false });
            return d.toLocaleString('zh-HK', { timeZone: tz });
        } catch(e) { return isoStr; }
    };

    H.secToMmss = function(sec) {
        if (sec === 0) return '0:00';
        var m = Math.floor(Math.abs(sec) / 60);
        var s = Math.abs(sec) % 60;
        return (sec < 0 ? '-' : '') + m + ':' + String(s).padStart(2, '0');
    };

    H.mmssToSec = function(str) {
        if (!str || typeof str !== 'string') return parseInt(str, 10) || 0;
        var trimmed = str.trim();
        var negative = trimmed.startsWith('-');
        if (negative) trimmed = trimmed.substring(1);
        var parts = trimmed.split(':');
        if (parts.length === 2) {
            return (negative ? -1 : 1) * (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10));
        }
        return parseInt(trimmed, 10) || 0;
    };

    H.setupTimecodeMask = function(inputElementId) {
        var el = document.getElementById(inputElementId);
        if (!el) return;
        el.addEventListener('input', function() {
            var cursorPosition = el.selectionStart;
            var originalLength = el.value.length;
            var digits = el.value.replace(/\D/g, '').slice(0, 8);
            var formatted = '';
            for (var i = 0; i < digits.length; i++) {
                if (i === 2 || i === 4 || i === 6) formatted += ':';
                formatted += digits[i];
            }
            el.value = formatted;
            if (el.value.length > originalLength && (cursorPosition === 2 || cursorPosition === 5 || cursorPosition === 8)) {
                el.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            }
        });
        el.addEventListener('blur', function() {
            var digits = el.value.replace(/\D/g, '');
            while (digits.length < 8) digits += '0';
            var hh = digits.slice(0,2); var mm = digits.slice(2,4); var ss = digits.slice(4,6); var ff = digits.slice(6,8);
            var fr = window.frameRate || 25;
            if (parseInt(ff, 10) >= fr) ff = String(fr - 1);
            if (parseInt(mm, 10) >= 60) mm = '59';
            if (parseInt(ss, 10) >= 60) ss = '59';
            if (parseInt(hh, 10) >= 24) hh = '23';
            el.value = hh + ':' + mm + ':' + ss + ':' + ff;
        });
    };

    H.computeEndTime = function(startTC, durTC) {
        var sf = timecodeToTotalFrames(startTC);
        var df = timecodeToTotalFrames(durTC);
        return totalFramesToTimecode(sf + df);
    };

    return H;
});
