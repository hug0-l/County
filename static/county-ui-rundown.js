// county-ui-rundown.js — 排程頁 UI 模組 (delegates to global inline functions)
County.register('RundownUI', function(C) {
    var R = {};
    R.rundownSortState = { field: null, asc: true };
    R.renderGUICalendar = function() { return window.renderGUICalendar ? window.renderGUICalendar() : undefined; };
    R.moveCalendarMonth = function(d) { return window.moveCalendarMonth ? window.moveCalendarMonth(d) : undefined; };
    R.renderWeekGlance = function() { return window.renderWeekGlance ? window.renderWeekGlance() : undefined; };
    R.onPeriodicTypeChange = function() { return window.onPeriodicTypeChange ? window.onPeriodicTypeChange() : undefined; };
    R.calculateMCRTrafficSummary = function() { return window.calculateMCRTrafficSummary ? window.calculateMCRTrafficSummary() : undefined; };
    R.onGlobalDateChange = function() { return window.onGlobalDateChange ? window.onGlobalDateChange() : undefined; };
    R.renderColorPicker = function(i) { return window.renderColorPicker ? window.renderColorPicker(i) : undefined; };
    R.renderTagList = function() { return window.renderTagList ? window.renderTagList() : undefined; };
    R.addProgramTag = function() { return window.addProgramTag ? window.addProgramTag() : undefined; };
    R.removeProgramTag = function(i) { return window.removeProgramTag ? window.removeProgramTag(i) : undefined; };
    R.submitProgramForm = function() { return window.submitProgramForm ? window.submitProgramForm() : undefined; };
    R.enterEditMode = function(id) { return window.enterEditMode ? window.enterEditMode(id) : undefined; };
    R.exitEditMode = function() { return window.exitEditMode ? window.exitEditMode() : undefined; };
    R.duplicateProgram = function(id) { return window.duplicateProgram ? window.duplicateProgram(id) : undefined; };
    R.deleteProgram = function(id) { return window.deleteProgram ? window.deleteProgram(id) : undefined; };
    R.clearAllPrograms = function() { return window.clearAllPrograms ? window.clearAllPrograms() : undefined; };
    R.exportRundown = function() { return window.exportRundown ? window.exportRundown() : undefined; };
    R.importRundown = function(i) { return window.importRundown ? window.importRundown(i) : undefined; };
    R.sortRundownTable = function(f) { return window.sortRundownTable ? window.sortRundownTable(f) : undefined; };
    R.renderRundownUI = function() { return window.renderRundownUI ? window.renderRundownUI() : undefined; };
    R.filterRundown = function() { return window.filterRundown ? window.filterRundown() : undefined; };
    return R;
});
