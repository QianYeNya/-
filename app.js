const app = {
    currentUser: null,
    playerData: null, 
    currentDraw: { m: [], sub: null },
    usingItemIndex: null, 
    destroyState: { entryIdx: null, req: null, selectedInvs: [] },
    specialActionState: null,
    extraDrawState: null,
    
    challengeLevelCount: 1,
    cachedEntryOpts: '',
    cachedItemOpts: '',
    cachedSpecialOpts: '', 

    init: function() { 
        this.populateAdminDropdowns(); 
    },
    
    addLog: function(msg) {
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        if(!this.playerData.logs) this.playerData.logs = [];
        this.playerData.logs.unshift(`<span style="color:#51cf66;">[${time}]</span> ${msg}`);
        if (this.playerData.logs.length > 50) this.playerData.logs.pop();
        this.renderLogs();
    },
    
    renderLogs: function() {
        const box = document.getElementById('sys-logs');
        if (box) box.innerHTML = this.playerData.logs.map(l => `<div style="margin-bottom:6px; border-bottom: 1px dashed #223; padding-bottom: 4px;">${l}</div>`).join('');
    },

    updateSyncStatus: function(text, color = "#aaa") {
        const el = document.getElementById('sync-status');
        if(el) { el.innerText = text; el.style.color = color; }
    },

    // 🌟 修复：接入双轨云检测的登录引擎
    login: async function() {
        const username = document.getElementById('username').value.trim();
        if (!username) { alert("请输入代号！"); return; }
        
        const btn = document.getElementById('login-btn');
        const oldText = btn.innerText;
        btn.innerText = "☁️ 扫描双端档案中...";
        btn.disabled = true;

        this.currentUser = username;
        
        // 呼叫 archiveSystem 进行双端比对
        const archives = await archiveSystem.checkArchives(username);
        
        document.getElementById('archive-username').innerText = username;
        
        const localInfo = document.getElementById('local-archive-info');
        if(archives.local) {
            localInfo.innerHTML = `<b style="color:#fff;">Lv.${reputationSystem.getTierInfo(archives.local.reputation).lvl}</b> (声望:${archives.local.reputation})<br>终端资产: <span style="color:#f1c40f;">${archives.local.balance.toFixed(2)}元</span><br>面板状态: ${archives.local.entries.length} 条契约`;
        } else {
            localInfo.innerHTML = "<br>无记录<br><span style='color:#888;'>(若选择将建立新号)</span>";
        }

        const cloudInfo = document.getElementById('cloud-archive-info');
        if(archives.cloud) {
            cloudInfo.innerHTML = `<b style="color:#fff;">Lv.${reputationSystem.getTierInfo(archives.cloud.reputation).lvl}</b> (声望:${archives.cloud.reputation})<br>终端资产: <span style="color:#f1c40f;">${archives.cloud.balance.toFixed(2)}元</span><br>面板状态: ${archives.cloud.entries.length} 条契约`;
        } else {
            cloudInfo.innerHTML = "<br>云端无记录<br><span style='color:#888;'>(若选择将建立新号)</span>";
        }

        document.getElementById('archive-modal').style.display = 'flex';
        btn.innerText = oldText;
        btn.disabled = false;
    },

    cancelLogin: function() {
        document.getElementById('archive-modal').style.display = 'none';
        this.currentUser = null;
    },

    selectArchive: function(source) {
        this.playerData = archiveSystem.loadData(source);
        document.getElementById('archive-modal').style.display = 'none';
        
        if (this.playerData.logs.length === 0) {
            this.addLog(`系统初建。特工 [${this.playerData.name}] 加载了 ${source==='local'?'本地':'云端'}档案。`);
        } else {
            this.addLog(`[系统] 成功加载了 ${source==='local'?'本地':'神枢云端'} 档案。`);
        }
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'flex';
        this.updateDashboard();
        this.updateSyncStatus("待命", "#aaa");
    },

    manualCloudUpload: async function() {
        if(!confirm("⚠️ 危险操作警告：\n你即将把当前面板的所有数据上传至神枢！\n如果你在其它设备上的进度比当前更高，它将会被彻底覆盖！\n\n确定执行上传吗？")) return;
        
        this.updateSyncStatus("☁️ 上传链接中...", "#f1c40f");
        const success = await cloudSystem.upload(this.playerData.name, this.playerData);
        if(success) {
            this.updateSyncStatus("☁️ 神枢同步完成", "#2ecc71");
            this.addLog("[云端] 档案已手动覆写并上传至云端服务器！");
            alert("✅ 成功！当前档案已安全上传并存入神枢云端！");
        } else {
            this.updateSyncStatus("☁️ 通讯受阻", "#e74c3c");
            alert("❌ 云端通讯受阻，上传失败，请检查网络或刷新重试。");
        }
    },

    logout: function() { this.currentUser = null; document.getElementById('main-screen').style.display = 'none'; document.getElementById('login-screen').style.display = 'flex'; },
    saveData: function() { archiveSystem.saveLocal(this.playerData); },
    hardReset: function() { 
        if(confirm("彻底删档？")) { 
            this.playerData = archiveSystem.reset(); 
            this.addLog("[系统] 档案已被彻底重置清空。");
            this.updateDashboard();
        } 
    },
    
    changeAvatar: function() { const url = prompt("头像URL:", this.playerData.avatar); if (url !== null) { this.playerData.avatar = url; this.saveData(); this.updateDashboard(); } },
    changeName: function() { const newName = prompt("新代号:", this.playerData.name); if (newName) { this.playerData.name = newName; this.saveData(); this.updateDashboard(); } },

    setReputation: function(newVal) {
        const oldInfo = reputationSystem.getTierInfo(this.playerData.reputation);
        this.playerData.reputation = Math.max(0, newVal);
        const newInfo = reputationSystem.getTierInfo(this.playerData.reputation);
        
        if (newInfo.lvl > oldInfo.lvl) {
            this.addLog(`<span style="color:#f1c40f;">[阶级]</span> 等级跃升至 Lv.${newInfo.lvl}。`);
            if (oldInfo.lvl < 3 && newInfo.lvl >= 3) { this.playerData.shieldCharges++; setTimeout(() => alert("🌟 等级跃升！免费获得了 1 次【阵线庇护】！"), 300); }
            if (oldInfo.lvl < 5 && newInfo.lvl >= 5) { this.playerData.shieldCharges++; setTimeout(() => alert("🌟 等级跃升！免费获得了 1 次【阵线庇护】！"), 300); }
        }
        if (this.playerData.shieldCharges > newInfo.maxShield) this.playerData.shieldCharges = newInfo.maxShield;
        this.saveData(); this.updateDashboard();
    },

    updateDashboard: function() {
        const repInfo = reputationSystem.getTierInfo(this.playerData.reputation);
        document.getElementById('current-user').innerText = this.playerData.name;
        if (this.playerData.avatar) { document.getElementById('player-avatar').src = this.playerData.avatar; document.getElementById('player-avatar').style.display = 'block'; document.getElementById('avatar-placeholder').style.display = 'none'; }
        
        document.getElementById('rep-level-name').innerText = `级别: Lv.${repInfo.lvl} 【${repInfo.name}】 (${this.playerData.reputation}点)`;
        if (this.playerData.shieldCharges > repInfo.maxShield) this.playerData.shieldCharges = repInfo.maxShield;
        document.getElementById('shield-count').innerText = `${this.playerData.shieldCharges} / ${repInfo.maxShield}`;

        let entriesAdd = 0; let entriesMult = 1.0;
        this.playerData.entries.forEach(e => { if (e.status === 'active') { entriesAdd += (e.add || 0); entriesMult *= (e.mult || 1.0); } });

        const addMultiplier = 1 + this.playerData.addBuffs + repInfo.add + this.playerData.tempAddBuffs + entriesAdd;
        const indMultiplier = this.playerData.multBuffs * repInfo.mult * this.playerData.tempMultBuffs * entriesMult;
        const finalTotal = addMultiplier * indMultiplier;
        
        let displayHtml = `总倍率: <span class="highlight" style="font-size: 20px;">${finalTotal.toFixed(2)}x</span>`;
        if (this.playerData.tempAddBuffs > 0.001 || Math.abs(this.playerData.tempMultBuffs - 1.0) > 0.001) displayHtml += `<br><span style="color:#ff6b6b; font-size:11px; font-weight:bold;">⚡ 临时加成在场</span>`;
        if (addMultiplier > 2.0) displayHtml += `<br><span style="color:#e67e22; font-size:11px;">⚠️ 命运倍率阀值溢出，基础资金受压</span>`;
        document.getElementById('multiplier-display').innerHTML = displayHtml;

        const invBox = document.getElementById('inventory-list');
        invBox.innerHTML = this.playerData.inventory.length ? '' : '<span style="color:#555;font-size:12px;">背包空空...</span>';
        this.playerData.inventory.forEach((item, index) => {
            const isPassiveOrMat = item.name.includes("碎片") || item.name.includes("纯金校徽") || item.name.includes("学科荣誉殿堂勋章");
            const lockEmoji = item.locked ? '<span style="color:#f1c40f; margin-left:5px;">🔒保</span>' : '';
            invBox.innerHTML += `<div class="inv-item level-${item.level}" ${item.locked ? 'style="border-color:#f1c40f;"' : ''}><div class="inv-img-placeholder img-${item.level}">✦</div><div class="inv-info"><b>[${item.level}]</b>${lockEmoji}<br>${item.name}</div>${isPassiveOrMat ? '' : `<button class="use-btn" onclick="app.openItemModal(${index})">使用</button>`}</div>`;
        });

        const entriesBox = document.getElementById('entries-list');
        entriesBox.innerHTML = this.playerData.entries.length ? '' : '<span style="color:#555;font-size:12px;">暂无词条...</span>';
        const sorted = [...this.playerData.entries].sort((a, b) => (gameData.rank[a.level] || 0) - (gameData.rank[b.level] || 0));
        
        sorted.forEach(item => {
            const realIdx = this.playerData.entries.findIndex(e => e === item);
            let statText = item.add > 0 ? `+${item.add.toFixed(2)}` : `x${item.mult.toFixed(2)}`;
            const lockEmoji = item.locked ? '<span style="color:#f1c40f; margin-left:5px;">🔒保</span>' : '';
            
            if (item.status === 'pending') {
                let btnsHtml = '';
                if (item.baseAdd !== undefined) {
                    btnsHtml = `
                        <button class="btn-small" style="background:#51cf66; color:#000; flex:1;" onclick="app.resolveEntry(${realIdx}, true)">✔ 完美</button>
                        <button class="btn-small" style="background:#f1c40f; color:#000; flex:1;" onclick="app.resolveEntry(${realIdx}, 'partial')">➖ 保底</button>
                        <button class="btn-small" style="background:#ff6b6b; color:#fff; flex:1;" onclick="app.resolveEntry(${realIdx}, false)">✖ 作废</button>
                    `;
                } else {
                    btnsHtml = `
                        <button class="btn-small" style="background:#51cf66; color:#000; flex:1;" onclick="app.resolveEntry(${realIdx}, true)">✔ 达成</button>
                        <button class="btn-small" style="background:#ff6b6b; color:#fff; flex:1;" onclick="app.resolveEntry(${realIdx}, false)">✖ 作废</button>
                    `;
                }
                entriesBox.innerHTML += `<div class="entry-item level-${item.level}" ${item.locked ? 'style="border-left-color:#f1c40f;"' : ''}><div><b>${item.title || item.name}</b> ${lockEmoji} <span style="font-size:10px; color:#ff9f43; border: 1px solid #ff9f43; padding:1px 3px; border-radius:3px;">待挑战</span></div><div style="color:#aaa; font-size:11px; margin-top:3px;">任务: ${item.desc}</div><div style="margin-top:5px; display:flex; gap:5px;">${btnsHtml}</div></div>`;
            } 
            else if (item.status === 'active') {
                entriesBox.innerHTML += `<div class="entry-item level-${item.level}" style="border-left-color:${item.locked ? '#f1c40f' : '#51cf66'}; background-color:rgba(81,207,102,0.05);"><div><b>${item.title || item.name}</b> ${lockEmoji} <span style="color:#51cf66; font-size:12px;">(已生效)</span></div><div style="color:#ddd; font-size:12px;">结算: <span class="highlight">${statText}</span></div></div>`;
            } 
        });

        seasonSystem.renderSeasonTab(this);
        this.renderLogs();
        this.renderTasks(); 

        let currentDrawCount = repInfo.choices + (this.playerData.extraChoiceActive ? 1 : 0);
        document.getElementById('draw-choice-title').innerText = `${currentDrawCount}选1`;

        document.getElementById('edit-rep').value = this.playerData.reputation; 
        document.getElementById('edit-add').value = this.playerData.addBuffs; 
        document.getElementById('edit-mult').value = this.playerData.multBuffs; 
        document.getElementById('display-add').innerText = `+${(addMultiplier - 1).toFixed(2)}`; 
        document.getElementById('display-mult').innerText = `x${indMultiplier.toFixed(2)}`;
        
        const removeSel = document.getElementById('admin-remove-entry-select'); if(removeSel) { removeSel.innerHTML = this.playerData.entries.length?'':'<option value="">暂无</option>'; this.playerData.entries.forEach((e, i) => removeSel.add(new Option(`[${e.level}] ${e.title || e.name}`, i))); }
        const removeItemSel = document.getElementById('admin-remove-item-select'); if(removeItemSel) { removeItemSel.innerHTML = this.playerData.inventory.length?'':'<option value="">暂无</option>'; this.playerData.inventory.forEach((item, i) => removeItemSel.add(new Option(`[${item.level}] ${item.name}`, i))); }
    },

    renderTasks: function() {
        const questBox = document.getElementById('active-quests-container');
        if (!questBox) return;
        questBox.innerHTML = '';
        
        if (this.playerData.activeQuests.length === 0) {
            questBox.innerHTML = `<div class="card" style="grid-column: 1 / -1; opacity: 0.3; border-color: #333;"><h2 style="color: #888; margin-top: 0;">📭 暂无待命指令</h2><p style="color: #555; font-size: 13px;">目前没有 NPC 派发的额外挑战或支线悬赏。</p></div>`;
            return;
        }

        this.playerData.activeQuests.forEach((q, idx) => {
            if (q.type === 'quest') {
                let rewardsHtml = '';
                if(q.money > 0) rewardsHtml += `<span style="color:#f1c40f; font-weight:bold; display:block;">💰 资金: ${q.money} 元</span>`;
                if(q.cash > 0) rewardsHtml += `<span style="color:#51cf66; font-weight:bold; display:block;">💵 红包: ${q.cash} 元</span>`;
                if(q.rep > 0) rewardsHtml += `<span style="color:#4dabf7; display:block;">🎖️ 声望: +${q.rep}</span>`;
                if(q.entry) rewardsHtml += `<span style="color:#51cf66; display:block;">📜 词条: ${q.entry.split('|')[1]}</span>`;
                if(q.item) rewardsHtml += `<span style="color:#e67e22; display:block;">🎒 道具: ${q.item.split('|')[1]}</span>`;

                questBox.innerHTML += `
                    <div class="card" style="width: 100%; border: 1px dashed #3b82f6; background: rgba(59, 130, 246, 0.1); box-sizing: border-box; justify-content: space-between;">
                        <div>
                            <h3 style="color:#3b82f6; margin-top:0; font-size:16px;">📜 悬赏</h3>
                            <p style="font-size:13px; color:#fff; margin-bottom:15px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; border-left: 3px solid #3b82f6;">${q.desc}</p>
                            <div style="font-size:12px; color:#ddd; margin-bottom:15px; line-height: 1.6;">
                                <b style="color:#fff;">报酬:</b><br>${rewardsHtml || '<span style="color:#888;">无实质奖励</span>'}
                            </div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button class="btn-small" style="background:#2ecc71; color:#000; flex:1;" onclick="taskSystem.resolveQuest(${idx}, true)">✔ 达成</button>
                            <button class="btn-small" style="background:#555; color:#fff; flex:1;" onclick="taskSystem.resolveQuest(${idx}, false)">✖ 放弃</button>
                        </div>
                    </div>
                `;
            } else if (q.type === 'multi_challenge') {
                let levelsHtml = '';
                q.levels.forEach((lvl, lIdx) => {
                    let rwHtml = '';
                    if(lvl.money > 0) rwHtml += `<span style="color:#f1c40f; display:inline-block; margin-right:8px;">💰:${lvl.money}</span>`;
                    if(lvl.cash > 0) rwHtml += `<span style="color:#51cf66; display:inline-block; margin-right:8px;">💵:${lvl.cash}</span>`;
                    if(lvl.rep > 0) rwHtml += `<span style="color:#4dabf7; display:inline-block; margin-right:8px;">🎖️:+${lvl.rep}</span>`;
                    if(lvl.entry) rwHtml += `<span style="color:#51cf66; display:block;">📜: ${lvl.entry.split('|')[1]}</span>`;
                    if(lvl.item) rwHtml += `<span style="color:#e67e22; display:block;">🎒: ${lvl.item.split('|')[1]}</span>`;

                    levelsHtml += `
                        <div style="border-left: 3px solid #e74c3c; background: rgba(0,0,0,0.3); padding: 8px; margin-bottom: 10px; border-radius: 4px;">
                            <h4 style="margin:0 0 5px 0; color:#fff; font-size:13px;">📍 ${lvl.desc}</h4>
                            <div style="font-size:11px; color:#ddd; margin-bottom:8px; line-height: 1.4;">
                                ${rwHtml || '<span style="color:#888;">无资源报酬</span>'}
                            </div>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-small" style="background:#2ecc71; color:#000; flex:1; font-size:11px;" onclick="taskSystem.resolveChallengeLevel(${idx}, ${lIdx}, true)">✔ 冲刺</button>
                                <button class="btn-small" style="background:#555; color:#fff; flex:1; font-size:11px;" onclick="taskSystem.resolveChallengeLevel(${idx}, ${lIdx}, false)">✖ 放弃</button>
                            </div>
                        </div>
                    `;
                });

                questBox.innerHTML += `
                    <div class="card" style="width: 100%; border: 2px solid #e74c3c; background: rgba(231, 76, 60, 0.1); box-sizing: border-box; box-shadow: 0 0 10px rgba(231,76,60,0.2);">
                        <h3 style="color:#e74c3c; margin-top:0; font-size:16px;">⚔️ 极限挑战令</h3>
                        <p style="font-size:11px; color:#aaa; margin-bottom: 10px;">
                            🎯 目标期限：<span style="color:#f1c40f; font-weight:bold;">${q.targetDate || '无期限'}</span>
                        </p>
                        ${levelsHtml}
                    </div>
                `;
            }
        });
    },

    addChallengeLevel: function() {
        this.challengeLevelCount++;
        const c = this.challengeLevelCount;
        const container = document.getElementById('challenge-levels-container');
        const div = document.createElement('div');
        div.className = 'challenge-level-block';
        div.innerHTML = `
            <hr style="border-color:#e67e22; opacity:0.3; margin:15px 0;">
            <h4 style="margin:0 0 10px 0; color:#e67e22;">📍 第 ${c} 难度级别</h4>
            <div class="input-group"><input type="text" id="clv-desc-${c}" placeholder="该级别难度描述 (必填)" style="border-color:#e67e22;"></div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1;"><input type="number" id="clv-money-${c}" placeholder="系统资金"></div>
                <div class="input-group" style="flex:1;"><input type="number" id="clv-rep-${c}" placeholder="奖励声望"></div>
                <div class="input-group" style="flex:1;"><input type="number" id="clv-cash-${c}" placeholder="现实红包" style="border-color:#51cf66;"></div>
            </div>
            <div style="display:flex; gap:10px;">
                <div class="input-group" style="flex:1;"><select id="clv-entry-${c}" class="custom-select dyn-entry-select">${this.cachedEntryOpts}</select></div>
                <div class="input-group" style="flex:1;"><select id="clv-item-${c}" class="custom-select dyn-item-select">${this.cachedItemOpts}</select></div>
            </div>
        `;
        container.appendChild(div);
    },

    populateAdminDropdowns: function() {
        let entryOpts = ['<option value="">-- 无/不选择 --</option>'];
        if(gameData.main) { ['N', 'R', 'SR', 'SSR'].forEach(lvl => gameData.main[lvl].forEach(obj => entryOpts.push(`<option value="${lvl}|${obj.title}">[${lvl}] ${obj.title} - ${obj.desc}</option>`))); }
        this.cachedEntryOpts = entryOpts.join('');

        let itemOpts = ['<option value="">-- 无/不选择 --</option>'];
        if(gameData.sub) { ['N', 'R', 'SR', 'SSR'].forEach(lvl => gameData.sub[lvl].forEach(name => itemOpts.push(`<option value="${lvl}|${name}">[${lvl}] ${name}</option>`))); }
        this.cachedItemOpts = itemOpts.join('');

        let spOpts = ['<option value="">-- 无/不选择 --</option>'];
        if(gameData.sub) { gameData.sub.Special.forEach(name => spOpts.push(`<option value="Special|${name}">[专属] ${name}</option>`)); }
        this.cachedSpecialOpts = spOpts.join('');

        document.querySelectorAll('.dyn-entry-select').forEach(el => el.innerHTML = this.cachedEntryOpts);
        document.querySelectorAll('.dyn-item-select').forEach(el => el.innerHTML = this.cachedItemOpts);
        document.querySelectorAll('.dyn-special-select').forEach(el => el.innerHTML = this.cachedSpecialOpts);
    },npcDirectReward: function() {
        const rep = parseInt(document.getElementById('npc-direct-rep').value) || 0;
        const entryVal = document.getElementById('npc-direct-entry').value;
        const itemVal = document.getElementById('npc-direct-item').value;

        if (rep > 0) { this.setReputation(this.playerData.reputation + rep); }
        if (entryVal) {
            const [lvl, val] = entryVal.split('|');
            const baseObj = gameData.main[lvl].find(e => e.title === val);
            const newEntry = JSON.parse(JSON.stringify(baseObj));
            newEntry.level = lvl; newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending';
            this.playerData.entries.push(newEntry);
        }
        if (itemVal) {
            const [lvl, val] = itemVal.split('|');
            let realLvl = lvl === 'Special' ? '专属' : lvl;
            this.playerData.inventory.push({ level: realLvl, name: val, img: "" });
        }
        
        document.getElementById('npc-direct-rep').value = ''; document.getElementById('npc-direct-entry').value = ''; document.getElementById('npc-direct-item').value = '';
        this.addLog(`[GM] 触发自由裁量系统，强行向终端注入了直接奖励。`);
        this.saveData(); this.updateDashboard(); alert("🎁 奖励已强行发放到账！");
    },

    npcPublishQuest: function() {
        const desc = document.getElementById('npc-quest-desc').value.trim();
        if (!desc) { alert("⚠️ 悬赏拦截：必须填写【任务描述】才能发布！"); return; }
        const money = parseFloat(document.getElementById('npc-quest-money').value) || 0;
        const rep = parseInt(document.getElementById('npc-quest-rep').value) || 0;
        const cash = parseFloat(document.getElementById('npc-quest-cash').value) || 0; 
        const entryVal = document.getElementById('npc-quest-entry').value;
        const itemVal = document.getElementById('npc-quest-item').value;

        this.playerData.activeQuests.push({ id: Date.now(), type: 'quest', desc: desc, money: money, rep: rep, cash: cash, entry: entryVal, item: itemVal });
        this.addLog(`[GM] 发布了 1 张支线悬赏单。`);
        
        document.getElementById('npc-quest-desc').value = ''; document.getElementById('npc-quest-money').value = ''; document.getElementById('npc-quest-rep').value = ''; document.getElementById('npc-quest-cash').value = ''; document.getElementById('npc-quest-entry').value = ''; document.getElementById('npc-quest-item').value = '';
        this.saveData(); this.updateDashboard(); alert(`📢 支线悬赏发布成功！`);
    },

    npcPublishChallenge: function() {
        const targetDate = document.getElementById('npc-challenge-date').value;
        let levels = [];

        for (let i = 1; i <= this.challengeLevelCount; i++) {
            const descEl = document.getElementById(`clv-desc-${i}`);
            if (!descEl) continue; 
            const desc = descEl.value.trim();
            if (!desc) { alert(`⚠️ 发布拦截：第 ${i} 级难度必须填写【难度描述】！`); return; }

            levels.push({
                desc: desc,
                money: parseFloat(document.getElementById(`clv-money-${i}`).value) || 0,
                rep: parseInt(document.getElementById(`clv-rep-${i}`).value) || 0,
                cash: parseFloat(document.getElementById(`clv-cash-${i}`).value) || 0,
                entry: document.getElementById(`clv-entry-${i}`).value,
                item: document.getElementById(`clv-item-${i}`).value,
                status: 'pending'
            });
        }

        this.playerData.activeQuests.push({ id: Date.now(), type: 'multi_challenge', targetDate: targetDate, levels: levels });
        this.addLog(`[GM] 发布了包含 ${levels.length} 个难度的自选挑战令。`);

        document.getElementById('npc-challenge-date').value = '';
        this.challengeLevelCount = 1;
        document.getElementById('challenge-levels-container').innerHTML = `
            <div class="challenge-level-block">
                <hr style="border-color:#e67e22; opacity:0.3; margin:15px 0;">
                <h4 style="margin:0 0 10px 0; color:#e67e22;">📍 第 1 难度级别</h4>
                <div class="input-group"><input type="text" id="clv-desc-1" placeholder="该级别难度描述 (必填)" style="border-color:#e67e22;"></div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;"><input type="number" id="clv-money-1" placeholder="系统资金"></div>
                    <div class="input-group" style="flex:1;"><input type="number" id="clv-rep-1" placeholder="奖励声望"></div>
                    <div class="input-group" style="flex:1;"><input type="number" id="clv-cash-1" placeholder="现实红包" style="border-color:#51cf66;"></div>
                </div>
                <div style="display:flex; gap:10px;">
                    <div class="input-group" style="flex:1;"><select id="clv-entry-1" class="custom-select dyn-entry-select">${this.cachedEntryOpts}</select></div>
                    <div class="input-group" style="flex:1;"><select id="clv-item-1" class="custom-select dyn-item-select">${this.cachedItemOpts}</select></div>
                </div>
            </div>`;

        this.saveData(); this.updateDashboard(); alert(`🔥 挑战令下达阵线成功！`);
    },

    calculateMoney: function() {
        const baseInput = parseFloat(document.getElementById('base-money').value) || 0;
        let extraInput = parseFloat(document.getElementById('extra-money').value) || 0;
        
        let medalCount = this.playerData.inventory.filter(i => i.name.includes("学科荣誉殿堂勋章")).length;
        let medalTriggered = false;
        if (extraInput > 0 && medalCount > 0) {
            extraInput += medalCount;
            medalTriggered = true;
            this.addLog(`[特权] 自动识别 ${medalCount} 枚学科勋章，已叠加至支线资金。`);
        }

        const totalBase = baseInput; 
        
        let entriesAdd = 0; let entriesMult = 1.0;
        this.playerData.entries.forEach(e => { if (e.status === 'active') { entriesAdd += (e.add||0); entriesMult *= (e.mult||1); } });
        
        const repInfo = reputationSystem.getTierInfo(this.playerData.reputation);
        const addMultiplier = 1 + this.playerData.addBuffs + this.playerData.tempAddBuffs + repInfo.add + entriesAdd;
        const indMultiplier = this.playerData.multBuffs * repInfo.mult * this.playerData.tempMultBuffs * entriesMult;

        let compressedAdd = addMultiplier;
        let compressionLevel = 0; 
        if (addMultiplier > 3.0) { compressedAdd = 2.5 + (addMultiplier - 3.0) * (1.0 / 3.0); compressionLevel = 2; } 
        else if (addMultiplier > 2.0) { compressedAdd = 2.0 + (addMultiplier - 2.0) * 0.5; compressionLevel = 1; }

        const finalBaseBounty = totalBase * compressedAdd * indMultiplier;
        const finalExtraBounty = extraInput * addMultiplier * indMultiplier; 
        const finalResult = finalBaseBounty + finalExtraBounty;

        this.playerData.balance += finalResult;
        document.getElementById('final-money').innerText = finalResult.toFixed(2);
        
        let detailStr = `基础赏金(${totalBase}) × 命运倍率(${compressionLevel > 0 ? `<span style="color:#e67e22">${compressedAdd.toFixed(2)} [Lv.${compressionLevel} 衰减]</span>` : addMultiplier.toFixed(2)}) × 独立乘区(${indMultiplier.toFixed(2)})<br>` +
                        `支线奖金(${extraInput}) × 命运倍率(<span style="color:#51cf66">${addMultiplier.toFixed(2)} [全额无视]</span>) × 独立乘区(${indMultiplier.toFixed(2)})`;
        if (medalTriggered) { detailStr += `<br><span style="color:#f1c40f;">🏅 专属勋章已生效：支线基础奖金已自动 +${medalCount} 元。</span>`; }
        
        document.getElementById('calc-detail-msg').innerHTML = detailStr;
        this.addLog(`[结算] 资金已核算。总产出: <span style="color:#ff6b6b">+${finalResult.toFixed(2)}元</span>。`);

        if (this.playerData.inventory.some(i => i.name.includes("纯金校徽"))) {
            this.playerData.settleCount = (this.playerData.settleCount || 0) + 1;
            if (this.playerData.settleCount >= 3) {
                this.playerData.settleCount = 0;
                this.playerData.inventory.push({ level: 'N', name: "🧩 N级普通碎片", img: "" });
                this.addLog("[装备] 校徽触发，空投了 1 枚 N级普通碎片。");
            }
        }

        if (this.playerData.tempAddBuffs > 0.001 || Math.abs(this.playerData.tempMultBuffs - 1.0) > 0.001) {
            this.playerData.tempAddBuffs = 0; this.playerData.tempMultBuffs = 1.0;
        }
        this.saveData(); this.updateDashboard();
    },

    adminResetSeason: function() {
        const sId = parseInt(document.getElementById('admin-reset-season-select').value);
        if(confirm(`⚠️ 时光倒流警告：\n回溯后，如果已获取此赛季奖励将被彻底抹除！`)) {
            delete this.playerData.seasonBets[sId];
            this.playerData.entries = this.playerData.entries.filter(e => e.isSeasonReward !== sId);
            this.addLog(`[GM] 操纵了时光权限，将第 ${sId} 赛季回溯。`);
            this.saveData(); this.updateDashboard();
            alert("⏪ 历史回溯完成！赛季及衍生词条已清空。");
        }
    },

    useShieldManual: function() { if(this.playerData.shieldCharges <= 0) { alert("⚠️ 庇护能量不足！"); return; } document.getElementById('shield-modal').style.display = 'flex'; },
    resolveShieldDefense: function(protocol) {
        document.getElementById('shield-modal').style.display = 'none';
        if (protocol === 'entry') {
            this.playerData.shieldCharges--;
            this.playerData.entries.forEach(e => e.locked = true); 
            this.addLog("[庇护] 发动 Alpha 防御，全词条进入无敌帧。");
            this.saveData(); this.updateDashboard();
            alert("🛡️ 协议 Alpha 激活：全词条已锁死，免疫本轮清算！");
        } else if (protocol === 'item') {
            const exclusives = this.playerData.inventory.filter(item => item.level === '专属');
            if (exclusives.length === 0) { alert("没有专属道具可锁定！"); return; }
            const listContainer = document.getElementById('shield-item-list'); listContainer.innerHTML = '';
            exclusives.forEach(item => {
                const realInvIdx = this.playerData.inventory.findIndex(i => i === item);
                listContainer.innerHTML += `<button class="btn" style="background:#f1c40f; color:#000;" onclick="app.confirmShieldItemRescue(${realInvIdx})">锁定：${item.name}</button>`;
            });
            document.getElementById('shield-item-select-modal').style.display = 'flex';
        }
    },
    confirmShieldItemRescue: function(savedInvIdx) {
        document.getElementById('shield-item-select-modal').style.display = 'none';
        this.playerData.shieldCharges--;
        this.playerData.inventory[savedInvIdx].locked = true; 
        this.addLog(`[庇护] 发动 Beta 防御，强保了 [${this.playerData.inventory[savedInvIdx].name}]。`);
        this.saveData(); this.updateDashboard();
        alert(`🛡️ 协议 Beta 执行：专属道具【${this.playerData.inventory[savedInvIdx].name}】已绝对锁定！`);
    },

    craftSpecialItem: function() {
        let nIndices = []; let rIndices = [];
        this.playerData.inventory.forEach((item, idx) => { if(item.name.includes("N级普通碎片")) nIndices.push(idx); if(item.name.includes("R级稀有碎片")) rIndices.push(idx); });
        
        const rCount = rIndices.length; const nCount = nIndices.length;
        if (rCount < 1 || ((rCount - 1) * 3 + nCount < 5)) { alert(`⚠️ 合成材料不足！需要 1个R + 5个N。\n(多余的R可1抵3)`); return; }
        
        let rUsed = 1; let nNeeded = 5; let nUsed = Math.min(nCount, nNeeded);
        nNeeded -= nUsed; 
        
        let changeN = 0;
        if (nNeeded > 0) { 
            let extraR = Math.ceil(nNeeded / 3);
            rUsed += extraR; 
            changeN = (extraR * 3) - nNeeded; 
        }

        let toDelete = []; 
        for(let i=0; i<nUsed; i++) toDelete.push(nIndices[i]); 
        for(let i=0; i<rUsed; i++) toDelete.push(rIndices[i]);
        toDelete.sort((a,b)=>b-a).forEach(idx => { this.playerData.inventory.splice(idx, 1); });

        const specials = gameData.sub.Special; const rewardName = this.getRand(specials);
        this.playerData.inventory.push({ level: '专属', name: rewardName, img: "" });
        
        let logMsg = `[合成] 消耗 ${nUsed}N + ${rUsed}R，获得了专属装备【${rewardName}】。`;
        if (changeN > 0) {
            for(let i=0; i<changeN; i++) { this.playerData.inventory.push({ level: 'N', name: "🧩 N级普通碎片", img: "" }); }
            logMsg += ` 找零机制触发，退回了 ${changeN} 个 N 级碎片。`;
        }

        this.addLog(logMsg);
        this.saveData(); this.updateDashboard();
        alert(`🎉 合成成功！获得了【${rewardName}】${changeN > 0 ? `\n(已找零找回 ${changeN} 个多余的 N 级碎片)` : ''}`);
    },

    openItemModal: function(index) {
        this.usingItemIndex = index; const item = this.playerData.inventory[index];
        const effectData = itemEffects[item.name] || itemEffects["default"];
        document.getElementById('item-modal').style.display = 'flex';
        document.getElementById('modal-title').innerText = item.name;
        document.getElementById('modal-title').className = `level-${item.level}`;
        document.getElementById('modal-desc').innerText = effectData.desc;
    },
    closeItemModal: function() { document.getElementById('item-modal').style.display = 'none'; },
    
    confirmUseItem: function() {
        const item = this.playerData.inventory[this.usingItemIndex];
        const effectLogic = (itemEffects[item.name] || itemEffects["default"]).action;
        const result = effectLogic(this); 
        this.closeItemModal(); 
        if (result !== false) {
            this.addLog(`[道具] 消耗了物资：【${item.name}】。`);
            this.playerData.inventory.splice(this.usingItemIndex, 1);
            this.usingItemIndex = null;
            this.saveData(); this.updateDashboard();
        }
    },

    triggerExtraDraw: function(type) {
        this.extraDrawState = { type: type, cards: [] }; let title = "🌟 特权抽取";
        
        if (type === 'normal') this.extraDrawState.cards = [this.generateDraw('main'), this.generateDraw('main')];
        else if (type === 'double_take') { title = "📜 双持特权"; for(let i=0; i<2; i++) { let c = this.generateDraw('main'); if (c.level === 'Rep') this.extraDrawState.cards.push({ voided: true, level: 'Void', title: '【作废】', desc: '声望位置作废' }); else this.extraDrawState.cards.push(c); } } 
        else if (type === 'fixed_n') { title = "🎒 N级锁定"; this.extraDrawState.cards = [{ level: 'N', ...this.getRand(gameData.main['N']) }, { level: 'N', ...this.getRand(gameData.main['N']) }]; } 
        else if (type === 'urgent_ticket') { 
            title = "🎫 加急准考证 (保底出R)"; 
            let rCard = this.getRand(gameData.main['R']);
            this.extraDrawState.cards = [{ level: 'R', ...rCard, desc: rCard.desc + '<br><span style="color:#f1c40f">(系统强制发放)</span>' }];
        } 
        else if (type === 'overload') { title = "🔴 无尽狂热"; for(let i=0; i<4; i++) { let l = this.getWeight([{l:'R',w:70}, {l:'SR',w:25}, {l:'SSR',w:5}]).l; this.extraDrawState.cards.push({ level: l, ...this.getRand(gameData.main[l]) }); } } 
        else if (type === 'guess_paper') { title = "📝 押题直通"; for(let i=0; i<1; i++) { let l = this.getWeight([{l:'R',w:70}, {l:'SR',w:25}, {l:'SSR',w:5}]).l; this.extraDrawState.cards.push({ level: l, ...this.getRand(gameData.main[l]) }); } }
        
        document.getElementById('extra-draw-title').innerText = title; document.getElementById('extra-draw-modal').style.display = 'flex';
        let html = '';
        this.extraDrawState.cards.forEach((obj, idx) => {
            if (obj.voided) html += `<div class="card" style="background-color:#16213e; opacity:0.5; border-color:#555;"><div class="img-placeholder" style="border-color:#555;"><span style="color:#555;">❌</span></div><h3 style="color:#555;">【作废】</h3><p style="flex:1; color:#555; font-weight:bold;">位置失效</p><p style="font-size:13px; color:#555;">${obj.desc}</p><button class="btn" style="background:#333; margin-top: 15px;" disabled>不可接取</button></div>`;
            else html += `<div class="card"><div class="img-placeholder img-${obj.level}"><span>✦</span></div><h3 class="level-${obj.level}">【${obj.level}级】</h3><p style="flex:1; font-weight:bold;">${obj.title || obj.name}</p><p style="font-size:13px; color:#aaa;">${obj.desc}</p>${type === 'double_take' ? '' : `<button class="btn btn-select" onclick="app.selectExtraDraw(${idx})">✅ 选择</button>`}</div>`;
        });
        document.getElementById('extra-draw-cards').innerHTML = html; document.getElementById('extra-draw-double-btn').style.display = (type === 'double_take') ? 'block' : 'none';
        return false;
    },
    
    closeExtraDrawModal: function() { document.getElementById('extra-draw-modal').style.display = 'none'; this.extraDrawState = null; },
    selectExtraDraw: function(idx) {
        const e = this.extraDrawState.cards[idx]; 
        if (e.type === 'rep') { this.setReputation(this.playerData.reputation + e.val); this.addLog(`[掉落] 获得了额外声望 +${e.val}。`); }
        else { const newEntry = JSON.parse(JSON.stringify(e)); newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending'; this.playerData.entries.push(newEntry); this.addLog(`[特权] 强行接取了词条：【${newEntry.title || newEntry.name}】。`); }
        this.playerData.inventory.splice(this.usingItemIndex, 1); this.usingItemIndex = null;
        this.saveData(); this.updateDashboard(); this.closeExtraDrawModal();
    },

    confirmDoubleTake: function() {
        let addedNIndices = [];
        this.extraDrawState.cards.forEach(c => {
            if (!c.voided) {
                const newEntry = JSON.parse(JSON.stringify(c)); newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending'; this.playerData.entries.push(newEntry);
                if (newEntry.level === 'N') addedNIndices.push(this.playerData.entries.length - 1);
            }
        });

        this.playerData.inventory.splice(this.usingItemIndex, 1); this.usingItemIndex = null; this.saveData(); this.updateDashboard(); this.closeExtraDrawModal();
        
        if (addedNIndices.length > 0) {
            this.openSpecialActionModal({ type: 'pass_upgrade', title: '📜 附加免费进阶', desc: '选择刚刚抽入的 1 个 N 级词条强升 R 级。', items: addedNIndices.map(idx => ({...this.playerData.entries[idx], originalIndex: idx})), reqCount: 1, renderItem: (item) => `[${item.level}] ${item.title || item.name}`, costCount: 0, toLvl: 'R' });
        }
    },

    triggerUpgrade: function(fromLvl, toLvl, itemName, costCount, actionType, title) {
        const count = this.playerData.inventory.filter(i => i.name === itemName).length; if(count < costCount) { alert(`⚠️ 需要 ${costCount} 个【${itemName}】。`); return false; }
        const pending = this.playerData.entries.map((e, idx) => ({...e, originalIndex: idx})).filter(e => e.level === fromLvl && e.status === 'pending');
        if(pending.length === 0) { alert(`⚠️ 面板上没有待挑战的 ${fromLvl} 级词条。`); return false; }
        this.openSpecialActionModal({ type: actionType, title: title, desc: `强行跃迁 1 个 ${fromLvl} 级词条。`, items: pending, reqCount: 1, renderItem: (item) => `[${item.level}] ${item.title || item.name}`, costName: itemName, costCount: costCount, toLvl: toLvl }); return false;
    },
    openSpecialActionModal: function(config) { this.specialActionState = { ...config, selected: [] }; document.getElementById('special-action-modal').style.display = 'flex'; document.getElementById('special-action-title').innerText = config.title; this.renderSpecialActionGrid(); },
    closeSpecialActionModal: function() { document.getElementById('special-action-modal').style.display = 'none'; this.specialActionState = null; },
    toggleSpecialActionSelect: function(origIdx) { const state = this.specialActionState; const idxInArray = state.selected.indexOf(origIdx); if (idxInArray > -1) state.selected.splice(idxInArray, 1); else if (state.selected.length < state.reqCount) state.selected.push(origIdx); this.renderSpecialActionGrid(); },
    renderSpecialActionGrid: function() {
        const state = this.specialActionState; const container = document.getElementById('special-action-grid'); document.getElementById('special-action-desc').innerHTML = state.desc; container.innerHTML = '';
        state.items.forEach(item => { const isSelected = state.selected.includes(item.originalIndex); container.innerHTML += `<div class="destroy-item ${isSelected ? 'selected' : ''}" onclick="app.toggleSpecialActionSelect(${item.originalIndex})"><span style="font-size:12px; flex:1;">${state.renderItem(item)}</span>${isSelected ? '✅' : ''}</div>`; });
        const btn = document.getElementById('confirm-special-action-btn'); if (state.selected.length === state.reqCount) { btn.style.opacity = 1; btn.disabled = false; btn.innerText = "确认"; } else { btn.style.opacity = 0.5; btn.disabled = true; btn.innerText = `还需选择 ${state.reqCount - state.selected.length} 个`; }
    },
    
    confirmSpecialAction: function() {
        const state = this.specialActionState; if (state.selected.length !== state.reqCount) return;
        
        const newRep = parseFloat(document.getElementById('edit-rep').value) || 0;
        const newAdd = parseFloat(document.getElementById('edit-add').value) || 0;
        const inputMult = parseFloat(document.getElementById('edit-mult').value);
        this.playerData.addBuffs = newAdd;
        this.playerData.multBuffs = isNaN(inputMult) ? 1 : inputMult;
        
        if (['red_pen', 'gold_pen', 'black_gold_pen', 'pass_upgrade'].includes(state.type)) {
            if (state.type !== 'pass_upgrade') { let removed = 0; for (let i = this.playerData.inventory.length - 1; i >= 0; i--) { if (this.playerData.inventory[i].name === state.costName && removed < state.costCount) { this.playerData.inventory.splice(i, 1); removed++; } } }
            this.playerData.entries.splice(state.selected[0], 1); 
            const newEntry = JSON.parse(JSON.stringify(this.getRand(gameData.main[state.toLvl]))); newEntry.level = state.toLvl; newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending'; this.playerData.entries.push(newEntry);
            this.addLog(`[跃迁] 将旧词条成功跃迁为 ${state.toLvl} 级：【${newEntry.title || newEntry.name}】。`);
        } else if (state.type === 'binder_clip') {
            const toDelete = [this.usingItemIndex, ...state.selected].sort((a,b) => b-a); toDelete.forEach(idx => { this.playerData.inventory.splice(idx, 1); });
            const rItemName = this.getRand(gameData.sub['R']); this.playerData.inventory.push({ level: 'R', name: rItemName, img: "" });
            this.addLog(`[长尾夹] 废品合成触发，产出了 ${rItemName}。`);
        } else if (state.type === 'copy_paper') {
            const target = this.playerData.entries[state.selected[0]]; this.playerData.entries.push(JSON.parse(JSON.stringify(target))); this.playerData.inventory.splice(this.usingItemIndex, 1);
            this.addLog(`[复写纸] 强行使契约获得二次克隆。`);
        } else if (state.type === 'akasha') {
            const target = this.playerData.entries[state.selected[0]]; this.playerData.entries.push(JSON.parse(JSON.stringify(target))); this.playerData.inventory.splice(this.usingItemIndex, 1);
            this.addLog(`[回溯仪] 克隆了已拥有的强力属性。`);
        }
        
        this.usingItemIndex = null; 
        this.setReputation(newRep);
        this.closeSpecialActionModal();
    },

    resolveEntry: function(idx, resolveStatus) {
        const entry = this.playerData.entries[idx];
        
        if (resolveStatus === false) { 
            const removedName = entry.title || entry.name;
            this.playerData.entries.splice(idx, 1);
            this.addLog(`[作废] 契约【${removedName}】挑战未达成，已从面板彻底删除。`); 
        } 
        else if (resolveStatus === 'partial') {
            entry.add = entry.baseAdd;
            entry.title = (entry.title || entry.name) + " (仅保底)";
            entry.status = 'active'; 
            this.addLog(`[保底] 契约【${entry.title}】未完全达成，已触发保底入账。`); 
        } 
        else {
            if (entry.destroyReq) { this.openDestroyModal(idx, entry.destroyReq); return; }
            entry.status = 'active'; 
            this.addLog(`[完成] 属性【${entry.title || entry.name}】完美激活入账。`); 
            
            // 👇 补丁：检测如果是透支契约，悄悄记下一笔扣除债
            if (entry.title && entry.title.includes("机会透支")) {
                this.playerData.drawOverdraft = (this.playerData.drawOverdraft || 0) + 1;
                this.addLog(`[代价] 触发等价交换，你明天的常规抽卡机会将被扣除 1 次！`);
            }
        }
        
        this.saveData(); this.updateDashboard();
    },

    openDestroyModal: function(entryIdx, req) { this.destroyState = { entryIdx: entryIdx, req: req, selectedInvs: [] }; document.getElementById('destroy-modal').style.display = 'flex'; this.renderDestroyInventory(); },
    closeDestroyModal: function() { document.getElementById('destroy-modal').style.display = 'none'; this.destroyState = { entryIdx: null, req: null, selectedInvs: [] }; },
    toggleDestroySelect: function(invIdx) { const req = this.destroyState.req; const idxInArray = this.destroyState.selectedInvs.indexOf(invIdx); if (idxInArray > -1) this.destroyState.selectedInvs.splice(idxInArray, 1); else if (this.destroyState.selectedInvs.length < req.count) this.destroyState.selectedInvs.push(invIdx); this.renderDestroyInventory(); },
    renderDestroyInventory: function() {
        const req = this.destroyState.req; const container = document.getElementById('destroy-inventory'); document.getElementById('destroy-desc').innerHTML = `需要献祭 <b style="color:#ff6b6b;">${req.count}</b> 个 <b style="color:#ff6b6b;">${req.level === 'any' ? '任意级别' : req.level+'级'}</b> 道具。`; container.innerHTML = '';
        if (this.playerData.inventory.length === 0) container.innerHTML = `<p style="width:100%; text-align:center; color:#888;">背包空空如也！</p>`;
        this.playerData.inventory.forEach((item, index) => { const isSelected = this.destroyState.selectedInvs.includes(index); const isValidLevel = req.level === 'any' || item.level === req.level; container.innerHTML += `<div class="destroy-item ${isSelected ? 'selected' : ''} ${!isValidLevel ? 'disabled' : ''}" onclick="app.toggleDestroySelect(${index})"><span style="font-size:12px; flex:1;">[${item.level}] ${item.name}</span></div>`; });
        const btn = document.getElementById('confirm-destroy-btn'); if (this.destroyState.selectedInvs.length === req.count) { btn.style.opacity = 1; btn.disabled = false; btn.innerText = "献祭！"; } else { btn.style.opacity = 0.5; btn.disabled = true; btn.innerText = `还差 ${req.count - this.destroyState.selectedInvs.length} 个`; }
    },
    confirmDestroy: function() {
        const req = this.destroyState.req; if (this.destroyState.selectedInvs.length !== req.count) return;
        const toDelete = [...this.destroyState.selectedInvs].sort((a,b) => b-a); toDelete.forEach(idx => { this.playerData.inventory.splice(idx, 1); });
        const entry = this.playerData.entries[this.destroyState.entryIdx]; entry.status = 'active';
        this.addLog(`[献祭] 支付代价完成，等价交换发动，【${entry.title || entry.name}】属性入账！`);
        this.saveData(); this.updateDashboard(); this.closeDestroyModal();
    },

    switchTab: function(tabId) { document.querySelectorAll('.tab-content, .tab-btn').forEach(el => el.classList.remove('active')); document.getElementById(`tab-${tabId}`).classList.add('active'); event.currentTarget.classList.add('active'); },
    adminAdd: function(type) {
        let sel; if (type === 'entry') sel = document.getElementById('admin-entry-select'); else if (type === 'item') sel = document.getElementById('admin-item-select'); else sel = document.getElementById('admin-special-select');
        const [lvl, val] = sel.value.split('|');
        if (type === 'entry') { const baseObj = gameData.main[lvl].find(e => e.title === val); const newEntry = JSON.parse(JSON.stringify(baseObj)); newEntry.level = lvl; newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending'; this.playerData.entries.push(newEntry); } 
        else { let realLvl = lvl; if (lvl === 'Special') { realLvl = '专属'; } this.playerData.inventory.push({ level: realLvl, name: val, img: "" }); }
        this.addLog(`[GM] 你通过外挂控制台强制发配了资产。`); this.saveData(); this.updateDashboard(); alert("发配成功！");
    },
    adminRemoveEntry: function() { const sel = document.getElementById('admin-remove-entry-select'); if(!sel || sel.value === '') return; this.playerData.entries.splice(sel.value, 1); this.addLog("[GM] 你强制从自己身上剥离了词条。"); this.saveData(); this.updateDashboard(); },
    adminRemoveItem: function() { const sel = document.getElementById('admin-remove-item-select'); if(!sel || sel.value === '') return; this.playerData.inventory.splice(sel.value, 1); this.addLog("[GM] 你的物品遭遇高维打击，已被销毁。"); this.saveData(); this.updateDashboard(); },

    getRand: function(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    getWeight: function(opts) { let rand = Math.random() * opts.reduce((a, b) => a + b.w, 0); for(let o of opts) if(rand < o.w) return o; else rand -= o.w; },
    generateDraw: function(type) {
        if (type === 'main') {
            const isRep = this.getWeight([{t:0, w:80}, {t:1, w:20}]).t;
            if (isRep) { const rep = this.getWeight([{v:0, w:70}, {v:1, w:30}]).v; return { level: 'Rep', ...gameData.main.Rep[rep] }; } 
            else { const lvl = this.getWeight([{l:'N',w:70},{l:'R',w:20},{l:'SR',w:8},{l:'SSR',w:2}]).l; return { level: lvl, ...this.getRand(gameData.main[lvl]) }; }
        } else { const lvl = this.getWeight([{l:'N',w:80},{l:'R',w:15},{l:'SR',w:4},{l:'SSR',w:1}]).l; return { level: lvl, name: this.getRand(gameData.sub[lvl]), img: "" }; }
    },
    
    drawAll: function() {
        const repInfo = reputationSystem.getTierInfo(this.playerData.reputation);
        
        // 👇 补丁：计算透支并扣除
        let overdraft = this.playerData.drawOverdraft || 0;
        let drawCount = repInfo.choices + (this.playerData.extraChoiceActive ? 1 : 0) - overdraft;
        if (drawCount < 0) drawCount = 0; // 确保不会抽出负数
        
        if (overdraft > 0) {
            this.playerData.drawOverdraft = 0; // 债还清了，清空记录
            this.addLog(`[透支清算] 本次抽卡已强行扣除了 ${overdraft} 次主线抽取机会。`);
        }
        
        this.currentDraw = { m: [], sub: this.generateDraw('sub') };
        for (let i = 0; i < drawCount; i++) { this.currentDraw.m.push(this.generateDraw('main')); }
        
        let html = '';
        this.currentDraw.m.forEach((obj, idx) => { html += `<div class="card"><div class="img-placeholder img-${obj.level}"><span>✦</span></div><h3 class="level-${obj.level}">【${obj.level}级】</h3><p style="flex:1; font-weight:bold;">${obj.title || obj.name}</p><p style="font-size:13px; color:#aaa;">${obj.desc}</p><button class="btn btn-select" onclick="app.selectEntry(${idx})">✅ 选择此项</button></div>`; });
        document.getElementById('main-cards').innerHTML = html;
        const s = this.currentDraw.sub; document.getElementById('sub-card').innerHTML = `<div class="card"><div class="img-placeholder img-${s.level}"><span>✦</span></div><h3 class="level-${s.level}">【掉落】</h3><p style="flex:1; font-weight:bold;">${s.name}</p><button class="btn" style="background-color:#4dabf7; width:100%; margin-top:15px;" onclick="app.claimSub()">📥 放入背包</button></div>`;
        
        this.addLog(`[系统] 执行了一次日常抽取，当前卡池卡口状态已锁定。`);

        if (this.playerData.extraChoiceActive) { 
            this.playerData.extraChoiceActive = false; 
            this.saveData();
            this.updateDashboard();
        }
    },
    
    selectEntry: function(idx) { 
        const e = this.currentDraw.m[idx]; 
        if (e.type === 'rep') {
            this.setReputation(this.playerData.reputation + e.val);
            this.addLog(`[掉落] 抽卡获取声望 +${e.val}。`);
        } else {
            const newEntry = JSON.parse(JSON.stringify(e)); 
            newEntry.status = (newEntry.type === 'passive') ? 'active' : 'pending';
            this.playerData.entries.push(newEntry);
            this.addLog(`[记录] 收录主线词条：【${newEntry.title || newEntry.name}】。`);
        }
        this.saveData(); this.updateDashboard(); 
        document.getElementById('main-cards').innerHTML = `<div class="card full-width"><h3 style="color:#51cf66;">✅ 已接取！</h3></div>`; 
    },
    claimSub: function() { this.playerData.inventory.push(this.currentDraw.sub); this.addLog(`[掉落] 盲盒道具入库: ${this.currentDraw.sub.name}`); this.saveData(); this.updateDashboard(); document.getElementById('sub-card').innerHTML = `<div class="card full-width"><h3 style="color:#51cf66;">✅ 盲盒物资已存入背包！</h3></div>`; },
    saveEditor: function() { 
        const newRep = parseFloat(document.getElementById('edit-rep').value) || 0; 
        const newAdd = parseFloat(document.getElementById('edit-add').value) || 0; 
        const inputMult = parseFloat(document.getElementById('edit-mult').value); 
        this.playerData.addBuffs = newAdd; 
        this.playerData.multBuffs = isNaN(inputMult) ? 1 : inputMult; 
        this.setReputation(newRep); 
        alert('⚙️ 属性修改已生效！'); 
    }
};

window.onload = function() { app.init(); };