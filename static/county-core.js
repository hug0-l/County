// county-core.js — County 模組載入器 + 初始化整合
(function() {
    window.County = window.County || {};
    var C = window.County;
    C.modules = {};
    C.register = function(name, factory) {
        try {
            C.modules[name] = factory(C);
            console.log('[County] Module loaded:', name);
        } catch(e) {
            console.error('[County] Module FAILED (' + name + '):', e.message);
        }
    };
    C.get = function(name) {
        return C.modules[name] || null;
    };
    // 延遲初始化：所有模組註冊完成後由 DOMContentLoaded 觸發
    C.init = function() {
        console.log('[County] ===== System Initialization =====');
        var names = Object.keys(C.modules);
        console.log('[County] Modules registered (' + names.length + '):', names.join(', '));
        names.forEach(function(name) {
            var mod = C.modules[name];
            if (typeof mod.init === 'function') {
                try {
                    mod.init(C);
                    console.log('[County] Module initialized:', name);
                } catch(e) {
                    console.error('[County] Module init FAILED (' + name + '):', e.message);
                }
            }
        });
        console.log('[County] System ready');
    };
    // 自動在 DOMContentLoaded 時呼叫 C.init()（在 window.onload 之前）
    document.addEventListener('DOMContentLoaded', function() {
        C.init();
    });
})();
