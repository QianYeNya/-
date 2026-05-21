/**
 * ====================================================
 * 📋 任务与行动控制中枢 (Task & Penalty Engine)
 * ====================================================
 */

const taskSystem = {
    penaltyState: null,

    clearLocks: function() {
        app.playerData.entries.forEach(e => e.locked = false);
        app.playerData.inventory.forEach(i => i.locked = false);
        app.saveData(); app.updateDashboard();
    },

    completeDaily: function() {
        app.setReputation(app.playerData.reputation + 1);
        app.addLog(`[主线] 每日任务完成，声望+1。解锁抽卡。`);
        this.clearLocks();
        alert("🎉 每日任务达成！已为你发放声望，即将跳转至【抽卡中心】获取今日物资。");
        app.switchTab('draw');
    },

    failDaily: function() {
        if(!confirm("⚠️ 严重警告：确定要报告任务失败吗？\n\n这将导致你的声望-1，并立即触发不可逆的【惩罚清算】程序！")) return;
        app.setReputation(app.playerData.reputation - 1);
        app.addLog(`[主线] 每日阵线失守！声望-1，触发清算机制。`);
        this.startEntryPenalty();
    },

    startEntryPenalty: function() {
        const vulnerableEntries = app.playerData.entries.map((e, idx) => ({...e, originalIndex: idx})).filter(e => !e.locked);
        if (vulnerableEntries.length === 0) {
            app.addLog(`[清算] 没有可剥离的词条，跳过词条销毁。`);
            this.startItemPenalty(); return;
        }
        this.penaltyState = { type: 'entry', items: vulnerableEntries, reqCount: 1, selected: [] };
        this.renderPenaltyModal("💀 清算 1/2：剥离词条", "请选择 1 个你要永久销毁的面板词条！\n(被阵线庇护锁定的词条绝对安全)");
    },

    startItemPenalty: function() {
        const vulnerableInv = app.playerData.inventory.map((item, idx) => ({...item, originalIndex: idx})).filter(i => !i.locked);
        if (vulnerableInv.length === 0) {
            app.addLog(`[清算] 没有可销毁的物资，惩罚清算结束。`);
            this.endPenalty(); return;
        }

        const exclusives = vulnerableInv.filter(i => i.level === '专属');
        if (exclusives.length > 0) {
            this.penaltyState = { type: 'item_exclusive', items: exclusives, reqCount: 1, selected: [] };
            this.renderPenaltyModal("💀 清算 2/2：粉碎专属神物", "守护者要求你献出最珍贵的物品！\n请选择 1 个【专属道具】进行销毁。");
        } else {
            const reqCount = Math.min(2, vulnerableInv.length);
            this.penaltyState = { type: 'item_normal', items: vulnerableInv, reqCount: reqCount, selected: [] };
            this.renderPenaltyModal("💀 清算 2/2：物资抵债", `你没有可用的专属道具。作为抵债，请选择 ${reqCount} 个普通道具进行销毁。`);
        }
    },

    endPenalty: function() {
        document.getElementById('penalty-modal').style.display = 'none';
        this.penaltyState = null; this.clearLocks();
        alert("💀 今日的惩罚清算已彻底结束。庇护锁定状态已重置。");
    },

    togglePenaltySelect: function(origIdx) {
        const state = this.penaltyState; const idxInArray = state.selected.indexOf(origIdx);
        if (idxInArray > -1) { state.selected.splice(idxInArray, 1); } else if (state.selected.length < state.reqCount) { state.selected.push(origIdx); }
        this.updatePenaltyModalUI();
    },

    renderPenaltyModal: function(title, desc) {
        document.getElementById('penalty-modal').style.display = 'flex';
        document.getElementById('penalty-title').innerText = title; document.getElementById('penalty-desc').innerText = desc;
        this.updatePenaltyModalUI();
    },

    updatePenaltyModalUI: function() {
        const state = this.penaltyState; const container = document.getElementById('penalty-grid'); container.innerHTML = '';
        state.items.forEach(item => {
            const isSelected = state.selected.includes(item.originalIndex);
            let text = state.type === 'entry' ? `[${item.level}] ${item.title || item.name}` : `[${item.level}] ${item.name}`;
            container.innerHTML += `<div class="destroy-item ${isSelected ? 'selected' : ''}" style="border-color:#e74c3c;" onclick="taskSystem.togglePenaltySelect(${item.originalIndex})"><span style="font-size:12px; flex:1;">${text}</span>${isSelected ? '✅' : ''}</div>`;
        });
        const btn = document.getElementById('confirm-penalty-btn');
        if (state.selected.length === state.reqCount) { btn.style.opacity = 1; btn.disabled = false; btn.innerText = "忍痛销毁"; } 
        else { btn.style.opacity = 0.5; btn.disabled = true; btn.innerText = `还需选择 ${state.reqCount - state.selected.length} 个`; }
    },

    confirmPenalty: function() {
        const state = this.penaltyState; if (state.selected.length !== state.reqCount) return;
        if (state.type === 'entry') {
            app.playerData.entries.splice(state.selected[0], 1);
            app.addLog(`[清算] 忍痛剥离了 1 个面板词条。`);
            this.startItemPenalty(); 
        } else {
            const toDelete = [...state.selected].sort((a,b) => b-a);
            toDelete.forEach(idx => { app.playerData.inventory.splice(idx, 1); });
            app.addLog(`[清算] 销毁了 ${toDelete.length} 个补偿物资。`);
            this.endPenalty(); 
        }
    },

    resolveQuest: function(idx, isSuccess) {
        const q = app.playerData.activeQuests[idx];
        if (isSuccess) {
            this.grantRewards(q, "支线悬赏");
        } else {
            alert(`✅ 已放弃该支线悬赏，无惩罚。`);
            app.addLog(`[支线] 放弃了支线悬赏【${q.desc}】，无惩罚。`);
        }
        app.playerData.activeQuests.splice(idx, 1);
        app.saveData(); app.updateDashboard();
    },

    // 🌟 处理多级互斥挑战 (只要选择一项，整个大任务直接闭环销毁)
    resolveChallengeLevel: function(questIdx, levelIdx, isSuccess) {
        const quest = app.playerData.activeQuests[questIdx];
        const lvlData = quest.levels[levelIdx];

        if (isSuccess) {
            this.grantRewards(lvlData, `挑战目标`);
        } else {
            alert(`✅ 已彻底放弃挑战目标：【${lvlData.desc}】。`);
            app.addLog(`[挑战] 放弃了挑战选项【${lvlData.desc}】。`);
        }

        // 🌟 核心：判定互斥。一旦你对某一级进行了抉择(成/败)，整个任务彻底清算并消失
        app.playerData.activeQuests.splice(questIdx, 1);
        app.addLog(`[挑战] 极限挑战令已完成清算，其余未选项已自动作废忽略。`);

        app.saveData(); app.updateDashboard();
    },

    grantRewards: function(rewardData, logPrefix) {
        if (rewardData.rep > 0) app.setReputation(app.playerData.reputation + rewardData.rep);
        if (rewardData.entry) {
            const [lvl, val] = rewardData.entry.split('|');
            const baseObj = gameData.main[lvl].find(e => e.title === val);
            const newEntry = JSON.parse(JSON.stringify(baseObj));
            newEntry.level = lvl; newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending';
            app.playerData.entries.push(newEntry);
        }
        if (rewardData.item) {
            const [lvl, val] = rewardData.item.split('|');
            let realLvl = lvl === 'Special' ? '专属' : lvl;
            app.playerData.inventory.push({ level: realLvl, name: val, img: "" });
        }
        
        let msg = `🎉 目标达成！【${rewardData.desc}】\n包含的声望、词条、道具已自动存入你的账户。`;
        
        if (rewardData.money > 0 || rewardData.cash > 0) {
            msg += `\n\n⚠️ 资金未自动到账提醒：`;
            if(rewardData.money > 0) msg += `\n- 系统资金【${rewardData.money} 元】！请手动将此数值填入【资产结算页 -> 支线奖金】框中！`;
            if(rewardData.cash > 0) msg += `\n- 现实红包【${rewardData.cash} 元】！请务必向相关系统或人员索要现实打款！`;
        }

        alert(msg);
        app.addLog(`[${logPrefix}] 成功达成目标，系统物资已发放。`);
    }
};