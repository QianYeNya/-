window.cloudSystem = {
    enableCloud: true,
    GITEE_TOKEN: "你的_TOKEN", // 记得填你的 Token

    _getHeaders: function() {
        return {
            "Authorization": "token " + this.GITEE_TOKEN,
            "Content-Type": "application/json;charset=UTF-8",
            "User-Agent": "RogueTerminal/1.0"
        };
    },

    _findUserGist: async function(username) {
        try {
            const url = `https://gitee.com/api/v5/gists?access_token=${this.GITEE_TOKEN}&page=1&per_page=100`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const gists = await res.json();
            for (let gist of gists) {
                if (gist.description === `rogue_save_${username}`) return gist.id;
            }
            return null;
        } catch (e) {
            console.error("查找Gist出错:", e);
            return null;
        }
    },

    upload: async function(username, data) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("TOKEN")) return false;
        try {
            const gistId = await this._findUserGist(username);
            const fileName = `rogue_${username}.json`;
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
            console.error("上传失败:", err);
            return false;
        }
    },

    download: async function(username) {
        if (!this.enableCloud || this.GITEE_TOKEN.includes("TOKEN")) return null;
        try {
            const gistId = await this._findUserGist(username);
            if (!gistId) return null;

            const response = await fetch(`https://gitee.com/api/v5/gists/${gistId}?access_token=${this.GITEE_TOKEN}`);
            if (response.ok) {
                const gistData = await response.json();
                const fileName = `rogue_${username}.json`;
                const base64Data = gistData.files[fileName].content;
                const jsonString = decodeURIComponent(escape(atob(base64Data)));
                return JSON.parse(jsonString);
            }
            return null;
        } catch (err) {
            console.error("下载失败:", err);
            return null;
        }
    }
};
