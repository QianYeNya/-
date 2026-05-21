/**
 * ☁️ 校园肉鸽终端 - Gitee 云同步引擎 (完整版)
 */

const cloudSystem = {
    enableCloud: true,
    GITEE_TOKEN: "你的_TOKEN", // 记得把这里换成你真正的 Token

    _getHeaders: function() {
        return {
            "Authorization": `token ${this.GITEE_TOKEN}`,
            "Content-Type": "application/json;charset=UTF-8",
            "User-Agent": "RogueTerminal/1.0"
        };
    },

    // 辅助方法：寻找专属存档片段
    _findUserGist: async function(username) {
        try {
            const res = await fetch(`https://gitee.com/api/v5/gists?access_token=${this.GITEE_TOKEN}&page=1&per_page=100`);
            if (!res.ok) return null;
            const gists = await res.json();
            for (let gist of gists) {
                if (gist.description === `rogue_save_${username}`) return gist.id;
            }
            return null;
        } catch (e) { return null; }
    },

    // 上传存档
    upload: async function(username, data) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("TOKEN")) return false;
        try {
            const gistId = await this._findUserGist(username);
            const fileName = `rogue_${username}.json`;
            const payload = {
                access_token: this.GITEE_TOKEN,
                description: `rogue_save_${username}`,
                public: false,
                files: { [fileName]: { content: JSON.stringify(data, null, 4) } }
            };

            const method = gistId ? 'PATCH' : 'POST';
            const url = gistId ? `https://gitee.com/api/v5/gists/${gistId}` : `https://gitee.com/api/v5/gists`;
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return response.ok;
        } catch (err) { return false; }
    },

    // 下载存档
    download: async function(username) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("TOKEN")) return null;
        try {
            const gistId = await this._findUserGist(username);
            if (!gistId) return null;

            const response = await fetch(`https://gitee.com/api/v5/gists/${gistId}?access_token=${this.GITEE_TOKEN}`);
            if (response.ok) {
                const gistData = await response.json();
                const fileName = `rogue_${username}.json`;
                return JSON.parse(gistData.files[fileName].content);
            }
            return null;
        } catch (err) { return null; }
    }
};
