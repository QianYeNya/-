/**
 * ====================================================
 * 🏆 赛季宏愿双档对赌引擎 (Season Engine)
 * ====================================================
 */
const seasonSystem = {
    data: [
        { id: 1, title: "第一赛季宏愿：211冲击线", tier1: { rep: 15, mult: 1.15, cash: 0, desc: "达成获得永久乘区 x1.15，声望+15" }, tier2: { rep: 30, mult: 1.00, cash: 200, desc: "失败代价：拥有词条全部归零，声望降级！成功拿走 200元，声望+30" } },
        { id: 2, title: "第二赛季宏愿：985决战线", tier1: { rep: 20, mult: 1.15, cash: 0, desc: "达成获得永久乘区 x1.15，声望+20" }, tier2: { rep: 40, mult: 1.00, cash: 350, desc: "失败代价：拥有词条全部归零，声望降级！成功拿走 350元，声望+40" } },
        { id: 3, title: "第三赛季宏愿：630分终局破壁", tier1: { rep: 25, mult: 1.20, cash: 0, desc: "达成获得高阶永久乘区 x1.20，声望+25" }, tier2: { rep: 50, mult: 1.00, cash: 500, desc: "失败代价：全场词条归零且降大声望等阶。成功包揽 500元，声望+50" } }
    ],

    renderSeasonTab: function(appInstance) {
        const box = document.getElementById('season-grid');
        if (!box) return;
        box.innerHTML = '';
        
        this.data.forEach(s => {
            const bet = appInstance.playerData.seasonBets[s.id];
            let statusHtml = '';
            
            if (!bet || bet.status !== 'resolved') {
                statusHtml = `
                    <div style="margin-top:15px;">
                        <div style="background: rgba(46, 204, 113, 0.1); border: 1px dashed #2ecc71; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                            <p style="color:#2ecc71; font-weight:bold; margin: 0 0 10px 0; font-size: 14px;">一档 (稳健流) 结算</p>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-small" style="background:#2ecc71; color:#000; flex:1;" onclick="seasonSystem.resolveBet(${s.id}, 1, true)">✔ 达成</button>
                                <button class="btn-small" style="background:#e74c3c; color:#fff; flex:1;" onclick="seasonSystem.resolveBet(${s.id}, 1, false)">✖ 失败</button>
                            </div>
                        </div>
                        <div style="background: rgba(231, 76, 60, 0.1); border: 1px dashed #e74c3c; padding: 10px; border-radius: 6px;">
                            <p style="color:#e74c3c; font-weight:bold; margin: 0 0 10px 0; font-size: 14px;">二档 (疯狂卷王) 结算</p>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-small" style="background:#2ecc71; color:#000; flex:1;" onclick="seasonSystem.resolveBet(${s.id}, 2, true)">✔ 达成</button>
                                <button class="btn-small" style="background:#e74c3c; color:#fff; flex:1;" onclick="seasonSystem.resolveBet(${s.id}, 2, false)">✖ 失败</button>
                            </div>
                        </div>
                    </div>`;
            } else {
                statusHtml = bet.won 
                    ? `<div style="margin-top:15px; color:#2ecc71; font-weight:bold; font-size:16px;">🏆 宏愿达成 (${bet.tier === 1 ? '一档' : '二档'})</div>` 
                    : `<div style="margin-top:15px; color:#e74c3c; font-weight:bold; font-size:16px;">💀 对赌崩盘 (${bet.tier === 1 ? '一档' : '二档'})</div>`;
            }

            box.innerHTML += `
                <div class="card" style="width: 31%; min-height: 420px; justify-content: flex-start;">
                    <h3 style="color:#e94560; border-bottom:1px solid #333; padding-bottom:5px; margin-top:0;">${s.title}</h3>
                    <p style="font-size:12px; color:#aaa; text-align:left; line-height:1.5;">
                        <b style="color:#4dabf7;">一档权益:</b> ${s.tier1.desc}<br><br>
                        <b style="color:#ff6b6b;">二档风险:</b> ${s.tier2.desc}
                    </p>
                    <div style="flex:1;"></div>
                    ${statusHtml}
                </div>`;
        });
    },

    resolveBet: function(sId, tier, isSuccess) {
        const s = this.data.find(item => item.id === sId);
        if(!confirm(`确定执行【${tier === 1 ? '一档' : '二档'}】的【${isSuccess ? '达成' : '失败'}】结算吗？`)) return;
        
        app.playerData.seasonBets[sId] = { tier: tier, status: 'resolved', won: isSuccess };
        
        if (isSuccess) {
            if (tier === 1) {
                app.setReputation(app.playerData.reputation + s.tier1.rep);
                // 🌟 将一档奖励转化为【专属词条】写入玩家身体
                app.playerData.entries.push({
                    title: `【宏愿特权】${s.title.split('：')[0]}`,
                    level: '专属', type: 'passive', add: 0, mult: s.tier1.mult,
                    status: 'active', isSeasonReward: sId,
                    desc: `一档长线对赌胜利结晶。无尽供能全局独立乘区 x${s.tier1.mult}。`
                });
                app.addLog(`[赛季] ${s.title} 一档达成，永久特权词条发放。`);
                alert(`🏆 达成宏愿！声望+${s.tier1.rep}，\n独立乘区特权已作为【专属词条】加入你的档案面板！`);
            } else {
                app.setReputation(app.playerData.reputation + s.tier2.rep);
                app.playerData.balance += s.tier2.cash;
                // 🌟 卷王奖励纯为纪念荣誉，无倍率加成
                app.playerData.entries.push({
                    title: `【卷王桂冠】${s.title.split('：')[0]}`,
                    level: '专属', type: 'passive', add: 0, mult: 1.0,
                    status: 'active', isSeasonReward: sId,
                    desc: `疯狂卷王死斗结晶。证明你曾狂揽 ${s.tier2.cash} 元一次性终极奖金。`
                });
                app.addLog(`[赛季] ${s.title} 二档达成，奖金已入账，桂冠入库。`);
                alert(`👑 卷王大捷！\n资金池【${s.tier2.cash} 元】已注入账户！胜利奖杯已存入词条档案！`);
            }
        } else {
            if (tier === 1) {
                app.addLog(`[赛季] ${s.title} 一档失败，安全着陆无惩罚。`);
                alert(`🚨 一档落空，稳健流无任何删档惩罚。`);
            } else {
                app.playerData.entries = []; // 抹除全部词条
                app.setReputation(Math.max(0, app.playerData.reputation - 30));
                app.addLog(`[赛季] ${s.title} 二档崩盘！全盘词条清空，声望剧烈受损。`);
                alert(`🚨🚨 对赌崩盘！触发毁灭因果律：拥有词条全部清空，声望暴跌！`);
            }
        }
        app.saveData(); app.updateDashboard();
    }
};