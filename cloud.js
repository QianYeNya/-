/**
 * ☁️ 校园肉鸽终端 - Gitee 云同步引擎 (完整版)
 */

const cloudSystem = {
    enableCloud: true,
    GITEE_TOKEN: "8808042adc1356fdd75500e85acc1567", // 记得把这里换成你真正的 Token

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
    // 修复版：添加了 Base64 编码，解决数据库不兼容 Emoji 的报错
    // 修复版：添加了 Base64 编码，解决数据库不兼容 Emoji 的报错
    upload: async function(username, data) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("TOKEN")) return false;
        try {
            const gistId = await this._findUserGist(username);
            const fileName = `rogue_${username}.json`;
            
            // 【关键修改】：将 JSON 字符串转为 Base64，绕过 Gitee 数据库的 Emoji 限制
            const jsonString = JSON.stringify(data, null, 4);
            const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

            const payload = gistId ? 
                { files: { [fileName]: { content: base64Data } } } : 
                { 
                    description: `rogue_save_${username}`,
                    public: false,
                    files: { [fileName]: { content: base64Data } } 
                };

            const method = gistId ? 'PATCH' : 'POST';
            const baseUrl = gistId ? `https://gitee.com/api/v5/gists/${gistId}` : `https://gitee.com/api/v5/gists`;
            const url = `${baseUrl}?access_token=${this.GITEE_TOKEN}`;
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json;charset=UTF-8' },
                body: JSON.stringify(payload)
            });
            return response.ok;
        } catch (err) { 
            console.error("🔥 编码上传失败:", err);
            return false; 
        }
    },

    // 修复版：添加了解码逻辑
    download: async function(username) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("TOKEN")) return null;
        try {
            const gistId = await this._findUserGist(username);
            if (!gistId) return null;

            const response = await fetch(`https://gitee.com/api/v5/gists/${gistId}?access_token=${this.GITEE_TOKEN}`);
            if (response.ok) {
                const gistData = await response.json();
                const fileName = `rogue_${username}.json`;
                
                // 【关键修改】：解码 Base64 回 JSON
                const base64Data = gistData.files[fileName].content;
                const jsonString = decodeURIComponent(escape(atob(base64Data)));
                
                return JSON.parse(jsonString);
            }
            return null;
        } catch (err) { return null; }
    };
