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
        console.log("🚀 [上传流程] 开始触发..."); // 第 1 步
        if (!this.enableCloud) {
            console.error("❌ [上传流程] 失败：云端功能未开启");
            return false;
        }
        if (this.GITEE_TOKEN.includes("TOKEN")) {
            console.error("❌ [上传流程] 失败：Token 未正确设置");
            return false;
        }

        try {
            console.log("🔍 [上传流程] 正在寻找用户存档...");
            const gistId = await this._findUserGist(username);
            console.log("🔍 [上传流程] 找到 GistID:", gistId);
            
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
            const url = (gistId ? `https://gitee.com/api/v5/gists/${gistId}` : `https://gitee.com/api/v5/gists`) + `?access_token=${this.GITEE_TOKEN}`;
            
            console.log("🌐 [上传流程] 准备发起网络请求至:", url);
            
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json;charset=UTF-8' },
                body: JSON.stringify(payload)
            });

            console.log("🌐 [上传流程] 请求已发出，状态码:", response.status);
            
            if (!response.ok) {
                const errText = await response.text();
                console.error("❌ [上传流程] 服务器返回错误:", errText);
                return false;
            }

            console.log("✅ [上传流程] 上传成功！");
            return true;
        } catch (err) { 
            console.error("🔥 [上传流程] 代码崩溃:", err);
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
