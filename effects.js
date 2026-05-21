/**
 * ====================================================
 * 🎒 道具使用效果引擎 (Item Effects Engine)
 * ====================================================
 */

const itemEffects = {
    // 🌟 专属机制道具
    "【专属】纯金校徽 (加速发育)": { desc: "连续 3 次完美结算任务，强制空投 1 个【N 级普通碎片】。不可主动消耗。", action: function(app) { alert("💡 被动道具无需点击！"); return false; } },
    "【专属】学科荣誉殿堂勋章 (额外+1)": { desc: "结算时在下拉框中选择额外基础值追加。不可主动消耗。", action: function(app) { alert("💡 被动勋章无需点击！"); return false; } },
    "【专属】教研组押题密卷 (必定R级以上)": { desc: "立刻额外获得 1 次抽取机会，锁定为【R级 或 以上】！", action: function(app) { return app.triggerExtraDraw('guess_paper'); } },

    // 🌟 独立抽卡类
    "空白答题卡 (机会+1)": {
        desc: "使用后，下一次执行【今日抽取】时，主线抉择的选项数量将直接 +1（例如从 2选1 变 3选1，4选1 变 5选1）。",
        action: function(app) { 
            app.playerData.extraChoiceActive = true; 
            app.saveData(); 
            app.addLog("[道具] 使用了空白答题卡，下次抽卡选项 +1。");
            app.updateDashboard(); // 立刻刷新左侧提示文本
            alert("✅ 答题卡已铺好！下一次主线抽取选项将 +1。"); 
            return true; 
        }
    },
    
    "加急准考证 (固定出R)": { desc: "额外抽取。抽到N级强制升为R级；若抽到声望，则位置作废。", action: function(app) { return app.triggerExtraDraw('urgent_ticket'); } },
    "课后补充包 (锁定N级)": { desc: "额外抽取，选项必定锁定为 N 级词条。", action: function(app) { return app.triggerExtraDraw('fixed_n'); } },
    "竞赛特批通行证 (双持+N升R)": { desc: "触发额外抽取，直接将2个词条全部接下！若抽中N级可免费升级为R级。", action: function(app) { return app.triggerExtraDraw('double_take'); } },
    "深红过载引擎": { desc: "开启专属神话界面，进行一次疯狂的【4 选 1】抽取，保底 R 级以上！", action: function(app) { return app.triggerExtraDraw('overload'); } },

    // 🌟 特殊弹窗类
    "状元的复写纸 (收益翻倍)": {
        desc: "使用后选择一个【待挑战】的词条将其克隆。",
        action: function(app) {
            const pending = app.playerData.entries.map((e, idx) => ({...e, originalIndex: idx})).filter(e => e.status === 'pending');
            if(pending.length === 0) { alert("⚠️ 没有【待挑战的词条】可以翻倍。"); return false; }
            app.openSpecialActionModal({ type: 'copy_paper', title: '📝 收益翻倍', desc: '选择 1 个待挑战词条克隆！', items: pending, reqCount: 1, renderItem: (item) => `[${item.level}] ${item.title || item.name}` }); return false;
        }
    },
    "阿卡夏时空回溯仪": {
        desc: "从你已生效的词条中选择一项，直接克隆其全额增益！",
        action: function(app) {
            const active = app.playerData.entries.map((e, idx) => ({...e, originalIndex: idx})).filter(e => e.status === 'active');
            if(active.length === 0) { alert("⚠️ 当前没有任何【已生效】的词条。"); return false; }
            app.openSpecialActionModal({ type: 'akasha', title: '⏳ 历史重现', desc: '选择 1 个已生效词条克隆！', items: active, reqCount: 1, renderItem: (item) => `[${item.level}] ${item.title || item.name}` }); return false;
        }
    },

    // 🌟 升级与融合类
    "红色批改笔 (N升R)": { desc: "消耗 2 支红笔，将 1 个待挑战的 N 级强制升级为 R 级。", action: function(app) { return app.triggerUpgrade('N', 'R', '红色批改笔 (N升R)', 2, 'red_pen', '🖍️ 进阶点化'); } },
    "金丝红笔 (R升SR)": { desc: "消耗 2 支金丝红笔，将 1 个待挑战的 R 级强制升级为 SR 级。", action: function(app) { return app.triggerUpgrade('R', 'SR', '金丝红笔 (R升SR)', 2, 'gold_pen', '🖌️ 史诗突破'); } },
    "黑金签字笔 (SR升SSR)": { desc: "消耗 1 支黑金笔，将 1 个待挑战的 SR 级强行拔高为 SSR 级。", action: function(app) { return app.triggerUpgrade('SR', 'SSR', '黑金签字笔 (SR升SSR)', 1, 'black_gold_pen', '🖋️ 神话降临'); } },
    "万能长尾夹 (道具升级)": {
        desc: "在背包中消耗 3 个 N 级垃圾道具，融合成 1 个随机 R 级道具。",
        action: function(app) { 
            const currentClipIdx = app.usingItemIndex;
            const nLevelItems = app.playerData.inventory.map((item, idx) => ({...item, originalIndex: idx})).filter(item => item.level === 'N' && item.originalIndex !== currentClipIdx);
            if(nLevelItems.length < 3) { alert("⚠️ 需要长尾夹及额外 3 个 N 级道具。"); return false; }
            app.openSpecialActionModal({ type: 'binder_clip', title: '📎 废品融合', desc: '选择背包里的 3 个 N 级道具融合。', items: nLevelItems, reqCount: 3, renderItem: (item) => `[${item.level}] ${item.name}` }); return false;
        }
    },

    // 🌟 临时增幅与碎片拦截
    "特浓黑咖啡 (临时增幅)": { desc: "获得 0.05 临时面板加成。", action: function(app) { app.playerData.tempAddBuffs += 0.05; app.addLog("[道具] 饮用黑咖啡，临时加成+0.05。"); alert("☕ 获得临时加成 +0.05"); return true; } },
    "全糖奶昔 (x1.1独立增幅)": { desc: "获得额外 x1.1 临时独立乘区增幅。", action: function(app) { app.playerData.tempMultBuffs = parseFloat((app.playerData.tempMultBuffs * 1.1).toFixed(2)); app.addLog("[道具] 饮用奶昔，临时乘区x1.1。"); alert("🥤 获得临时乘区 x1.1"); return true; } },
    "🧩 N级普通碎片": { desc: "不可单独使用。", action: function(app) { alert("⚠️ 请使用左侧【合成专属】！"); return false; } },
    "💎 R级稀有碎片": { desc: "不可单独使用。", action: function(app) { alert("⚠️ 请使用左侧【合成专属】！"); return false; } },
    "default": { desc: "特殊资源道具。", action: function(app) { return true; } }
};