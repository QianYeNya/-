/**
 * ====================================================
 * 👑 声望等级树控制中枢 (Reputation System)
 * ====================================================
 */
const reputationSystem = {
    tiers: [
        { lvl: 1, min: 0,   max: 9,   name: "觉醒者", choices: 2, add: 0,   mult: 1.00, baseMoney: 10 },
        { lvl: 2, min: 10,  max: 34,  name: "探索者", choices: 3, add: 0,   mult: 1.00, baseMoney: 10 },
        { lvl: 3, min: 35,  max: 74,  name: "破局者", choices: 3, add: 0.05, mult: 1.00, baseMoney: 10 },
        { lvl: 4, min: 75,  max: 149, name: "远征统帅", choices: 3, add: 0.05, mult: 1.00, baseMoney: 12 },
        { lvl: 5, min: 150, max: 279, name: "传奇先锋", choices: 3, add: 0.05, mult: 1.00, baseMoney: 12 },
        { lvl: 6, min: 280, max: 449, name: "神话缔造者", choices: 4, add: 0.05, mult: 1.00, baseMoney: 12 },
        { lvl: 7, min: 450, max: 9999,name: "知识神殿·再铸者", choices: 4, add: 0.05, mult: 1.02, baseMoney: 12 }
    ],

    getTierInfo: function(repValue) {
        for (let i = 0; i < this.tiers.length; i++) {
            if (repValue >= this.tiers[i].min && repValue <= this.tiers[i].max) {
                let maxShield = 0;
                if (this.tiers[i].lvl >= 3) maxShield = 1;
                if (this.tiers[i].lvl >= 5) maxShield = 2;
                return { ...this.tiers[i], maxShield };
            }
        }
        return { ...this.tiers[0], maxShield: 0 };
    }
};