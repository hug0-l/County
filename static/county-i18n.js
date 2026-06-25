// county-i18n.js — 多國語言引擎 (i18n)
// ══════════════════════════════════════════════════
// 設計給開發者輕鬆新增語言。
// 新增方式：見下方 //== 開發者文件 ==//
// ══════════════════════════════════════════════════
County.register('I18n', function(C) {

    var i18n = {};

    // ─── 內部狀態 ───
    i18n._locale = 'zh';         // 目前語系代碼
    i18n._locales = {};          // { 'zh': { key: val }, 'en': { key: val } }
    i18n._fallback = 'zh';       // 缺少翻譯時的回退語系
    i18n._dataAttrsApplied = false;

    // ══════════════════════════════════════════════════
    //  方法定義（必須在註冊語系之前）
    // ══════════════════════════════════════════════════

    // ─── 註冊語系 ───
    i18n.register = function(locale, translations) {
        if (!i18n._locales[locale]) {
            i18n._locales[locale] = {};
        }
        for (var key in translations) {
            if (translations.hasOwnProperty(key)) {
                i18n._locales[locale][key] = translations[key];
            }
        }
    };

    // ─── 取翻譯 ───
    // i18n.t('hello')             → "你好"
    // i18n.t('greet', {name:'王'}) → "你好 王"
    i18n.t = function(key, params) {
        var map = i18n._locales[i18n._locale] || i18n._locales[i18n._fallback] || {};
        var text = map[key];
        if (text === undefined) {
            // 嘗試回退語系
            var fallbackMap = i18n._locales[i18n._fallback] || {};
            text = fallbackMap[key];
        }
        if (text === undefined) {
            text = key;  // 找不到就顯示 key 本身
        }
        // 插值 {placeholder}
        if (params) {
            for (var p in params) {
                if (params.hasOwnProperty(p)) {
                    text = text.replace(new RegExp('\\{' + p + '\\}', 'g'), params[p]);
                }
            }
        }
        return text;
    };

    // ─── 全域便捷函數 ───
    window._t = function(key, params) {
        return i18n.t(key, params);
    };

    // ─── 切換語系 ───
    // i18n.setLocale('en') → 即時更新所有 data-i18n 元素
    i18n.setLocale = function(locale) {
        if (!i18n._locales[locale]) {
            console.warn('[I18n] Locale not registered:', locale);
            return;
        }
        i18n._locale = locale;
        // 持久化到 config
        var appConfig = window.appConfig || {};
        appConfig.language = locale;
        window.appConfig = appConfig;
        try {
            localStorage.setItem('county_config_v8', JSON.stringify(appConfig));
        } catch(e) {}
        if (window.API && typeof window.API.saveConfig === 'function') {
            window.API.saveConfig({ language: locale }).catch(function(){});
        }
        // 更新所有 data-i18n 元素
        i18n.applyToDOM();
        // 更新 <html lang> 屬性
        document.documentElement.setAttribute('lang', locale === 'en' ? 'en' : 'zh-Hant');
        // 觸發自訂事件，讓各模組得知語言變更
        var evt = document.createEvent('Event');
        evt.initEvent('localechange', true, true);
        evt.locale = locale;
        document.dispatchEvent(evt);
        console.log('[I18n] Locale changed to:', locale);
    };

    // ─── DOM data-i18n 屬性套用 ───
    // <span data-i18n="sidebar.home">📡 首頁</span>
    // i18n.applyToDOM() 會掃描所有 [data-i18n] 元素並更新 innerText
    i18n.applyToDOM = function() {
        var els = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            var key = el.getAttribute('data-i18n');
            if (key) {
                var translated = i18n.t(key);
                var prefix = el.getAttribute('data-i18n-prefix') || '';
                if (prefix) translated = prefix + translated;
                if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                    el.childNodes[0].textContent = translated;
                } else {
                    var targetAttr = el.getAttribute('data-i18n-target');
                    if (targetAttr === 'title') {
                        el.title = translated;
                    } else if (targetAttr === 'placeholder') {
                        el.placeholder = translated;
                    } else if (targetAttr === 'value') {
                        el.value = translated;
                    } else {
                        var textNode = null;
                        for (var ci = 0; ci < el.childNodes.length; ci++) {
                            if (el.childNodes[ci].nodeType === 3 && el.childNodes[ci].textContent.trim()) {
                                textNode = el.childNodes[ci];
                                break;
                            }
                        }
                        if (textNode) {
                            textNode.textContent = translated;
                        }
                    }
                }
            }
        }
        i18n._dataAttrsApplied = true;
    };

    // ─── 初始化：從 config 載入語系 ───
    i18n.init = function() {
        var appConfig = window.appConfig || {};
        var savedLocale = appConfig.language || 'zh';
        if (i18n._locales[savedLocale]) {
            i18n._locale = savedLocale;
        }
        // DOMContentLoaded 後執行一次 apply
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                i18n.applyToDOM();
            });
        } else {
            i18n.applyToDOM();
        }
        console.log('[I18n] Initialized, locale:', i18n._locale);
    };

    // ─── 內建繁體中文語系（預設） ───
    i18n.register('zh', {
        'sidebar.title':             'County 排控調度中心',
        'sidebar.home':              '首頁',
        'sidebar.schedule':          '排程',
        'sidebar.preset':            'Preset',
        'sidebar.settings':          '設定',
        'sidebar.clipper':           'Clipper IM',
        'sidebar.changelog':         '更新日誌',
        'sidebar.help':              '說明',
        'sidebar.engine.standby':    '⏹️ 引擎待命',
        'sidebar.engine.running':    '▶️ 引擎運轉中',
        'sidebar.fps.label':         '播出標準: ',
        'sidebar.fps.format':        '{fps} fps',

        'statusbar.ntp.connected':   '已同步',
        'statusbar.ntp.syncing':     '同步中…',
        'statusbar.ntp.fallback':    '已降級',
        'statusbar.ntp.error':       '錯誤',
        'statusbar.ntp.unsynced':    '未同步 (本地時鐘)',
        'statusbar.ntp.offset':      '偏移 {offset}ms',
        'statusbar.obs.date':        '觀測日',

        'btn.apply':                 '套用',
        'btn.save':                  '儲存',
        'btn.cancel':                '取消',
        'btn.confirm':               '確定',
        'btn.close':                 '關閉',
        'btn.reload':                '重新載入',
        'btn.reset':                 '重置儲存並載入',

        'preset.title':              '📋 Preset 管理器',
        'preset.add':                '新增 Preset',
        'preset.delete':             '刪除 Preset',
        'preset.node.name':          '節點名稱',
        'preset.node.offset':        '偏移',
        'preset.node.sound':         '提示音',
        'preset.node.freq':          '頻率',
        'preset.export':             '匯出 JSON',
        'preset.import':             '匯入',
        'preset.protect':            '保護 Preset',
        'preset.sort':               '排序',
        'preset.no.preset':          '尚無 Preset',
        'preset.save.ok':            'Preset 已儲存',
        'preset.delete.confirm':     '確定刪除此 Preset？',
        'preset.protect.on':         '保護已開啟',
        'preset.protect.off':        '保護已關閉',

        'schedule.title':            '📅 排程管理器',
        'schedule.add':              '新增節目',
        'schedule.edit':             '編輯',
        'schedule.copy':             '複製',
        'schedule.delete':           '刪除',
        'schedule.clear.all':        '全部清除',
        'schedule.export':           '匯出',
        'schedule.import':           '匯入',
        'schedule.search':           '搜尋...',
        'schedule.table.name':       '節目名稱',
        'schedule.table.date':       '日期',
        'schedule.table.start':      '開始',
        'schedule.table.end':        '結束',
        'schedule.table.duration':   '長度',
        'schedule.table.type':       '類型',
        'schedule.table.preset':     'Preset',
        'schedule.table.actions':    '操作',
        'schedule.periodic.none':    '單次',
        'schedule.periodic.daily':   '每日',
        'schedule.periodic.weekdays':'工作日',
        'schedule.periodic.weekly':  '每週',
        'schedule.periodic.custom':  '自訂',
        'schedule.skip.badge':       '⏭️跳過{n}天',
        'schedule.skip.dialog':      '本節目是週期性編排 ({type})。\n\n"確定" = 只跳過 {date} 這一天\n"取消" = 刪除所有發生',
        'schedule.skip.log':         '⏭️ 已跳過週期節目 [{name}] 的 {date}，共 {count} 天異常',
        'schedule.override.single':  '已建立單次覆蓋節目（原始週期未變更）',
        'schedule.updated':          '已更新排程資源條目',
        'schedule.added':            '新增跨期編排節目 [{name}] 成功',

        'engine.start':              '啟動引擎',
        'engine.stop':               '停止引擎',
        'engine.running':            '引擎運轉中',
        'engine.stopped':            '引擎待命',
        'engine.matrix.title':       '核心時序聚焦矩陣 ({date} 觀測版)',
        'engine.trigger.title':      'Cue 即時看板',
        'engine.current.cue':        '即將進行',
        'engine.next.cue':           '下一 Cue',
        'engine.onair':              'ON AIR',
        'engine.nextup':             '下一檔',
        'engine.cue.countdown':      'Cue 倒數',
        'engine.cue.triggered':      'Cue 已觸發',
        'engine.cue.skipped':        'Cue 已跳過',

        'settings.title':            '🛠️ 設定',
        'settings.general':          '一般設定',
        'settings.ntp':              'NTP 時間服務',
        'settings.developer':        '開發者選項',
        'settings.language':         '語言 / Language',
        'settings.language.zh':      '中文 (繁體)',
        'settings.language.en':      'English',
        'settings.fps':              'FPS',
        'settings.fps.hint':         'PAL: 25 / NTSC: 29.97 / 電影: 24',
        'settings.timezone':         '時區',
        'settings.timezone.hint':    '影響換日與 Cue 觸發時間',
        'settings.retention':        'Cue 保留秒數',
        'settings.retention.hint':   '觸發後保持高亮秒數',
        'settings.beep':             '🔊 音訊設定',
        'settings.beep.freq':        '提示音頻率',
        'settings.beep.dur':         '提示音長度',
        'settings.ntp.server':       'NTP 伺服器',
        'settings.ntp.server.hint':  '使用真實 NTP (UDP 123) 協定，由伺服器端 ntplib 處理',
        'settings.ntp.interval':     '同步間隔 (秒)',
        'settings.ntp.sync.now':     '立即同步',
        'settings.ntp.status':       '狀態',
        'settings.ntp.lastsync':     '上次同步',
        'settings.health':           '健康檢查',
        'settings.inspector':        'JSON Inspector',
        'settings.crashdump':        'Crash Dump',
        'settings.crashdump.gen':    '產生 Dump',
        'settings.crashdump.save':   '儲存為檔案',
        'settings.factory.reset':    '工廠重置',
        'settings.factory.confirm':  '確定工廠重置？',

        'clipper.title':             '💬 Clipper IM',
        'clipper.connect':           '連線',
        'clipper.disconnect':        '斷線',
        'clipper.connected':         '已連線',
        'clipper.disconnected':      '未連線',
        'clipper.send':              '傳送',
        'clipper.file.send':         '傳送檔案',
        'clipper.server.url':        '伺服器位址',
        'clipper.room.code':         '房間代碼',
        'clipper.display.name':      '顯示名稱',

        'help.title':                '📖 操作說明',
        'help.shortcuts':            '快捷鍵一覽',
        'help.guide':                '廣播操作員指南',

        'changelog.title':           '📜 更新日誌',
        'changelog.loading':         '載入中...',
        'changelog.error':           '⚠️ 無法載入更新日誌',

        'dialog.error.title':        'County 系統啟動失敗',
        'dialog.error.timeout':      'JavaScript 引擎初始化逾時',
        'dialog.error.timeout.detail':'• JavaScript 主程式載入逾時 5 秒\n• 可能原因：JS 語法錯誤、模組依賴順序錯誤\n• 請開啟開發者工具 (F12 → Console) 查看具體錯誤\n• 載入時間: {time}',
        'dialog.error.runtime':      '⚠️ {msg}',
        'dialog.confirm.delete':     '確定刪除？',
        'dialog.confirm.clear':      '確定全清 County 編排庫？所有常規設定將消失。',
        'dialog.confirm.factory':    '確定工廠重置？',
        'dialog.json.invalid':       'JSON 語法錯誤: {msg}',
        'dialog.fps.invalid':        '請輸入 1-60 之間的格數',
        'dialog.engine.interval':    '請輸入 10-1000 之間的值',
        'dialog.apply.success':      'Config 已套用: {fps} fps, beep {freq}Hz',
        'dialog.state.applied':      '交通排程 JSON 資料庫狀態變更已成功套用！',
    });

    return i18n;
});
// 雙語標準 (Bilingual Standard)：
//   從 v1.0 起，所有文件、CHANGELOG、功能說明均須中英雙語。
//   新增語言時請確保完整翻譯所有 ~140 個 key。
//
// ══════════════════════════════════════════════════
// == 開發者文件：如何新增語言 ==
// ══════════════════════════════════════════════════
//
// 1. 建立語系檔案 (如 county-i18n-fr.js)：
//    County.register('I18nFr', function(C) {
//        var I18n = C.get('I18n');
//        if (I18n) {
//            I18n.register('fr', {
//                'sidebar.home':       'Accueil',
//                'sidebar.schedule':   'Programme',
//                'sidebar.preset':     'Preset',
//                'sidebar.settings':   'Paramètres',
//                'sidebar.clipper':    'Clipper IM',
//                'sidebar.changelog':  'Journal',
//                'sidebar.help':       'Aide',
//                // ... 其他 key
//            });
//        }
//        return {};
//    });
//
// 2. 在 index.html 的 <script> 載入序列中加入該檔案
//    （放在 county-i18n.js 之後，其他 county-* 模組之前）
//
// 3. 將需要翻譯的 HTML 元素加上 data-i18n="key" 屬性。
//
// 4. 在 JS 中使用 _t('key') 或 _t('key', {name:'val'}) 取得翻譯。
//
// 5. 重啟瀏覽器並在設定頁切換語系測試。
//
// ══════════════════════════════════════════════════
