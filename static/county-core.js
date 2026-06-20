// county-core.js — County 模組載入器
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
    // 延遲初始化：所有模組註冊完成後由最後一支 script 呼叫
    C.init = function() {
        console.log('[County] System ready');
        // 保留原有 window.onload 行為
        if (typeof originalOnLoad === 'function') originalOnLoad();
    };
})();
