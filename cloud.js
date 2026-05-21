/**
 * ====================================================
 * ☁️ 国内高性能直连云同步引擎 (Gitee Gist API 版)
 * ====================================================
 */

const cloudSystem = {
    enableCloud: true, 

    // 🌟 填入你刚才在 Gitee 安全设置里生成的私人令牌 (Personal Access Token)
    GITEE_TOKEN: "8808042adc1356fdd75500e85acc1567",

    // 内部方法：在云端寻找属于这个玩家的特定存档文件
    _findUserGist: async function(username) {
        try {
            const res = await fetch(`https://gitee.com/api/v5/gists?access_token=${this.GITEE_TOKEN}&page=1&per_page=100`);
            if (!res.ok) return null;
            const gists = await res.json();
            // 遍历寻找描述为 rogue_save_开头的专属片段
            for (let gist of gists) {
                if (gist.description === `rogue_save_${username}`) {
                    return gist.id;
                }
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    // 🌟 手动一键覆盖并上传至云端
    upload: async function(username, data) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("替换")) return false;
        try {
            const gistId = await this._findUserGist(username);
            const fileName = `rogue_${username}.json`;
            
            const payload = {
                access_token: this.GITEE_TOKEN,
                description: `rogue_save_${username}`,
                public: false, // 设为私有片段，别人看不见你的存档
                files: {}
            };
            payload.files[fileName] = { content: JSON.stringify(data, null, 4) };

            let response;
            if (gistId) {
                // 如果云端已经有这个特工的存档文件了，执行 PATCH 覆写更新
                response = await fetch(`https://gitee.com/api/v5/gists/${gistId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // 如果云端是崭新的，执行 POST 创建该玩家的时空文件
                response = await fetch(`https://gitee.com/api/v5/gists`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            return response.ok;
        } catch (err) {
            console.error("🚀 Gitee 天梯上传断裂:", err);
            return false;
        }
    },

    // 🌟 登录时拉取云端数据进行多端比对
    download: async function(username) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("替换")) return null;
        try {
            const gistId = await this._findUserGist(username);
            if (!gistId) return null; // 云端没档案

            const response = await fetch(`https://gitee.com/api/v5/gists/${gistId}?access_token=${this.GITEE_TOKEN}`);
            if (response.ok) {
                const gistData = await response.json();
                const fileName = `rogue_${username}.json`;
                if (gistData.files && gistData.files[fileName]) {
                    // 解包并反序列化回肉鸽对象
                    return JSON.parse(gistData.files[fileName].content);
                }
            }
            return null;
        } catch (err) {
            console.error("🚀 Gitee 天梯拉取断裂:", err);
            return null;
        }
    }
};