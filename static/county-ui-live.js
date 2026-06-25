// county-ui-live.js — 首頁儀表板 UI 模組 (delegates to global inline functions)
County.register('LiveUI', function(C) {
    var L = {};
    L.calculateMCRTrafficSummary = function() { return window.calculateMCRTrafficSummary ? window.calculateMCRTrafficSummary() : undefined; };
    L.toggleQuickEdit = function() { return window.toggleQuickEdit ? window.toggleQuickEdit() : undefined; };
    L.applyQuickEdit = function() { return window.applyQuickEdit ? window.applyQuickEdit() : undefined; };
    L.cancelQuickEdit = function() { return window.cancelQuickEdit ? window.cancelQuickEdit() : undefined; };
    L.sendCueNotification = function(p, c) { return window.sendCueNotification ? window.sendCueNotification(p, c) : undefined; };
    L.generateCrashDump = function() { return window.generateCrashDump ? window.generateCrashDump() : undefined; };
    L.saveCrashDumpToFile = function() { return window.saveCrashDumpToFile ? window.saveCrashDumpToFile() : undefined; };
    L.togglePresetJsonArea = function() { return window.togglePresetJsonArea ? window.togglePresetJsonArea() : undefined; };
    L.refreshPresetJsonArea = function() { return window.refreshPresetJsonArea ? window.refreshPresetJsonArea() : undefined; };
    L.exportPresetAsJson = function() { return window.exportPresetAsJson ? window.exportPresetAsJson() : undefined; };
    L.applyPresetJson = function() { return window.applyPresetJson ? window.applyPresetJson() : undefined; };
    L.matrixEditProgram = function(id) { return window.matrixEditProgram ? window.matrixEditProgram(id) : undefined; };
    L.updateGlobalDashboard = function() { return window.updateGlobalDashboard ? window.updateGlobalDashboard() : undefined; };
    return L;
});
