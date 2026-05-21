/**
 * ====================================================
 * 🗂️ 玩家档案与数据持久化中心 (Archive System)
 * ====================================================
 */

const archiveSystem = {
    currentUser: null,
    tempLocal: null,
    tempCloud: null,

    getDefaultData: function(username) {
        return {
            avatar: "", name: username, reputation: 0, balance: 0.0,
            addBuffs: 0.0, multBuffs: 1.0, tempAddBuffs: 0.0, tempMultBuffs: 1.0,
            extraChoiceActive: false, settleCount: 0, shieldCharges: 0,
            inventory: [], entries: [], seasonBets: {}, logs: [], activeQuests: []
        };
    },

    // 🌟 第一步：先扫描对比两个时间线的存档
    checkArchives: async function(username) {
        this.currentUser = username;
        
        // 获取本地
        const saved = localStorage.getItem(`rogue_v19_${username}`);
        this.tempLocal = saved ? JSON.parse(saved) : null;

        // 获取云端
        this.tempCloud = await cloudSystem.download(username);

        return { local: this.tempLocal, cloud: this.tempCloud };
    },

    // 🌟 第二步：用户做出选择后，初始化系统数据
    loadData: function(source) {
        let dataToLoad;
        if (source === 'local') {
            dataToLoad = this.tempLocal || this.getDefaultData(this.currentUser);
        } else if (source === 'cloud') {
            dataToLoad = this.tempCloud || this.getDefaultData(this.currentUser);
        }
        
        // 兼容性打补丁
        if (dataToLoad.extraChoiceActive === undefined) dataToLoad.extraChoiceActive = false;
        if (dataToLoad.logs === undefined) dataToLoad.logs = [];
        if (dataToLoad.activeQuests === undefined) dataToLoad.activeQuests = [];
        
        this.saveLocal(dataToLoad);
        return dataToLoad;
    },

    // 所有的默认保存，现在仅仅保存在本地！
    saveLocal: function(data) {
        if (this.currentUser && data) {
            localStorage.setItem(`rogue_v19_${this.currentUser}`, JSON.stringify(data));
        }
    },

    reset: function() {
        localStorage.removeItem(`rogue_v19_${this.currentUser}`);
        return this.getDefaultData(this.currentUser);
    },

    exportData: function(data) {
        if (!data) return;
        const dataStr = JSON.stringify(data, null, 4); 
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CampusRogue_Archive_${data.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    triggerImport: function() { document.getElementById('import-file').click(); },

    importData: function(event, callback) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported && imported.name !== undefined) {
                    this.saveLocal(imported);
                    if(callback) callback(imported);
                } else { alert("❌ 档案格式不正确！"); }
            } catch (err) { alert("❌ 读取失败，请确保导入的是有效的 JSON 文件！"); }
            event.target.value = ''; 
        };
        reader.readAsText(file);
    }
};