// ====================================================
// 🗄️ 校园肉鸽系统 - 静态图鉴数据库 (支持原生保底版)
// ====================================================

const gameData = {
    reputationTiers: [
        { lvl: 1, min: 0,   max: 9,   name: "觉醒者", choices: 2, add: 0,   mult: 1.00, baseMoney: 10, desc: "初入阵线，抉择抽卡保底【2选1】" },
        { lvl: 2, min: 10,  max: 34,  name: "探索者", choices: 3, add: 0,   mult: 1.00, baseMoney: 10, desc: "主线池扩容进阶为【3选1】" },
        { lvl: 3, min: 35,  max: 74,  name: "破局者", choices: 3, add: 0.05, mult: 1.00, baseMoney: 10, desc: "解锁阵线庇护，加法基础面板永久锁定 +0.05" },
        { lvl: 4, min: 75,  max: 149, name: "远征统帅", choices: 3, add: 0.05, mult: 1.00, baseMoney: 12, desc: "特权：每日基础大捷资金永久提升至 12 元" },
        { lvl: 5, min: 150, max: 279, name: "传奇先锋", choices: 3, add: 0.05, mult: 1.00, baseMoney: 12, desc: "阵线庇护最大充能上限提升至 2 次" },
        { lvl: 6, min: 280, max: 449, name: "神话缔造者", choices: 4, add: 0.05, mult: 1.00, baseMoney: 12, desc: "终极抽卡流扩容为绝对掌控的【4选1】" },
        { lvl: 7, min: 450, max: 9999,name: "知识神殿·再铸者", choices: 4, add: 0.05, mult: 1.02, baseMoney: 12, desc: "解锁神殿低保：全局获得独立乘区 x1.02 增幅" }
    ],

    main: {
        N: [
            { title: "【基础认知】", type: "passive", add: 0.03, mult: 1.0, desc: "无门槛稳定收益。最纯粹的加法，永久 +0.03 面板。" },
            { title: "【强制休眠契约】", type: "challenge", add: 0.05, mult: 1.0, desc: "底线时间前按时熄灯睡觉。成功 +0.05 | 失败作废" },
            { title: "【等价交换：道具回收】", type: "challenge", add: 0.06, mult: 1.0, desc: "永久销毁背包里的任意 1 个道具。成功 +0.06 | 失败作废", destroyReq: { count: 1, level: 'any' } },
            { title: "【等价交换：机会透支】", type: "challenge", add: 0.05, mult: 1.0, desc: "放弃明天的 1 次转盘抽奖机会。成功 +0.05 | 失败作废" },
            // 🌟 注入 baseAdd (保底数值)
            { title: "【深度聚焦】", type: "challenge", add: 0.04, baseAdd: 0.02, mult: 1.0, desc: "完成至少一次连续45分钟绝对专注。保底 +0.02 | 达成共 +0.04" },
            { title: "【温故知新】", type: "challenge", add: 0.04, baseAdd: 0.02, mult: 1.0, desc: "主动复习以前章节的知识点或错卷。保底 +0.02 | 达成共 +0.04" },
            { title: "【自我拓展】", type: "challenge", add: 0.04, baseAdd: 0.02, mult: 1.0, desc: "主动完成一项课外加餐练习。保底 +0.02 | 达成共 +0.04" }
        ],
        R: [
            { title: "【认知拓扑】", type: "passive", add: 0.08, mult: 1.0, desc: "基础且扎实。稳稳的面板大涨，永久 +0.08" },
            { title: "【巅峰破局契约】", type: "challenge", add: 0.15, mult: 1.0, desc: "独立完成2道压轴题，或1道竞赛级超纲题。成功 +0.15 | 失败作废" },
            { title: "【晨曦破晓契约】", type: "challenge", add: 0.13, mult: 1.0, desc: "底线时间前彻底起床，严禁赖床。成功 +0.13 | 失败作废" },
            { title: "【熔炼交换契约】", type: "challenge", add: 0.12, mult: 1.0, desc: "永久销毁背包里的 2 个 N 级道具。成功 +0.12 | 失败作废", destroyReq: { count: 2, level: 'N' } },
            // 🌟 注入 baseAdd (保底数值)
            { title: "【笔记反刍】", type: "challenge", add: 0.10, baseAdd: 0.05, mult: 1.0, desc: "对旧笔记进行深度加工并留下实体痕迹。保底 +0.05 | 达成共 +0.10" },
            { title: "【弱点狙击】", type: "challenge", add: 0.10, baseAdd: 0.05, mult: 1.0, desc: "针对自身薄弱考点进行一次专项攻坚。保底 +0.05 | 达成共 +0.10" },
            { title: "【白纸推演】", type: "challenge", add: 0.10, baseAdd: 0.05, mult: 1.0, desc: "纯白纸完整推导出一个核心公式或复杂错题。保底 +0.05 | 达成共 +0.10" }
        ],
        SR: [
            { title: "【核心觉醒】", type: "passive", add: 0.15, mult: 1.0, desc: "永久 +0.15 面板" },
            { title: "【天赋初步觉醒】", type: "passive", add: 0.0, mult: 1.03, desc: "永久独立乘区 x1.03" },
            { title: "【心流黑域契约】", type: "challenge", add: 0.22, mult: 1.0, desc: "成功进入极深度心流状态获 +0.22" },
            { title: "【逻辑闭环契约】", type: "challenge", add: 0.20, mult: 1.0, desc: "达成追加体系复盘获 +0.20" },
            { title: "【压轴破壁契约】", type: "challenge", add: 0.0, mult: 1.05, desc: "成功解锁乘区 x1.05" },
            { title: "【脑内超频回路】", type: "challenge", add: 0.0, mult: 1.04, desc: "挑战成功共获 x1.04 独立乘区" }
        ],
        SSR: [
            { title: "【文曲星垂青】", type: "passive", add: 0.60, mult: 1.0, desc: "神迹：永久获得逆天 +0.60 面板" },
            { title: "【灵感大降临】", type: "passive", add: 0.0, mult: 1.08, desc: "神迹：永久全局乘区 x1.08" },
            { title: "【因果律：绝境翻盘】", type: "challenge", add: 0.0, mult: 1.15, desc: "绝境突破：成功全局放大 x1.15" },
            { title: "【圣杯契约：极限登顶】", type: "challenge", add: 0.85, mult: 1.0, desc: "极限登顶：成功巨幅加成 +0.85" }
        ],
        Rep: [
            { title: "【微小的人气】", type: "rep", val: 1, desc: "直接获得 1 点声望" },
            { title: "【声望追加协议】", type: "rep", val: 2, desc: "直接获得 2 点声望" },
            { title: "【阵线荣誉表彰】", type: "rep", val: 3, desc: "直接获得 3 点声望" }
        ]
    },
    
    sub: {
        N: ["空白答题卡 (机会+1)", "红色批改笔 (N升R)", "万能长尾夹 (道具升级)", "特浓黑咖啡 (临时增幅)", "🧩 N级普通碎片"],
        R: ["加急准考证 (固定出R)", "金丝红笔 (R升SR)", "课后补充包 (锁定N级)", "全糖奶昔 (x1.1独立增幅)", "💎 R级稀有碎片"],
        SR: ["竞赛特批通行证 (双持+N升R)", "黑金签字笔 (SR升SSR)", "状元的复写纸 (收益翻倍)"],
        SSR: ["阿卡夏时空回溯仪", "深红过载引擎"],
        Special: ["【专属】纯金校徽 (加速发育)", "【专属】学科荣誉殿堂勋章 (额外+1)", "【专属】教研组押题密卷 (必定R级以上)"]
    },
    rank: { "N": 1, "R": 2, "SR": 3, "SSR": 4, "专属": 5, "Rep": 0 }
};