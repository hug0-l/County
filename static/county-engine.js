// county-engine.js — CUE 引擎模組 (delegates to global inline functions)
County.register('Engine', function(C) {
    var E = {};
    E.getRetentionFrames = function() {
        var appConfig = window.appConfig || {};
        var frameRate = window.frameRate || 25;
        var sec = appConfig.retentionSeconds || 5;
        return sec * frameRate;
    };
    E.calculateMCRTrafficSummary = function() { return window.calculateMCRTrafficSummary ? window.calculateMCRTrafficSummary() : undefined; };
    E.checkCueTriggersOnly = function() { return window.checkCueTriggersOnly ? window.checkCueTriggersOnly() : undefined; };
    E.initGlobalTracking = function() { return window.initGlobalTracking ? window.initGlobalTracking() : undefined; };
    E.calculateGlobalTimelineMatrix = function(h) { return window.calculateGlobalTimelineMatrix ? window.calculateGlobalTimelineMatrix(h) : undefined; };
    E.recordTrigger = function(t) { return window.recordTrigger ? window.recordTrigger(t) : undefined; };
    E.showTriggerHistory = function() { return window.showTriggerHistory ? window.showTriggerHistory() : undefined; };
    E.closeTriggerHistory = function() { return window.closeTriggerHistory ? window.closeTriggerHistory() : undefined; };
    return E;
});
