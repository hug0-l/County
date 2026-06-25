// county-ui-preset.js — Preset 頁 UI 模組 (delegates to global inline functions)
County.register('PresetUI', function(C) {
    var P = {};
    P.addNodeRow = function(n) { return window.addNodeRow ? window.addNodeRow(n) : undefined; };
    P.removeNodeRow = function(b) { return window.removeNodeRow ? window.removeNodeRow(b) : undefined; };
    P.renderPresetNodes = function(n, i) { return window.renderPresetNodes ? window.renderPresetNodes(n, i) : undefined; };
    P.sortPresetNodes = function(f) { return window.sortPresetNodes ? window.sortPresetNodes(f) : undefined; };
    P.onPresetSelectionChange = function() { return window.onPresetSelectionChange ? window.onPresetSelectionChange() : undefined; };
    P.savePresetAction = function() { return window.savePresetAction ? window.savePresetAction() : undefined; };
    P.initNewPresetForm = function() { return window.initNewPresetForm ? window.initNewPresetForm() : undefined; };
    P.duplicatePreset = function() { return window.duplicatePreset ? window.duplicatePreset() : undefined; };
    P.deletePresetAction = function() { return window.deletePresetAction ? window.deletePresetAction() : undefined; };
    P.togglePresetJsonArea = function() { return window.togglePresetJsonArea ? window.togglePresetJsonArea() : undefined; };
    P.refreshPresetJsonArea = function() { return window.refreshPresetJsonArea ? window.refreshPresetJsonArea() : undefined; };
    P.exportPresetAsJson = function() { return window.exportPresetAsJson ? window.exportPresetAsJson() : undefined; };
    P.importPresetFromFile = function(i) { return window.importPresetFromFile ? window.importPresetFromFile(i) : undefined; };
    P.applyPresetJson = function() { return window.applyPresetJson ? window.applyPresetJson() : undefined; };
    P.refreshPresetDropdownUI = function() { return window.refreshPresetDropdownUI ? window.refreshPresetDropdownUI() : undefined; };
    return P;
});
