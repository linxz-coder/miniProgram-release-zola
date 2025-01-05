Page({
    data: {
        articles: [], // 用于存储解析后的数组
        articleNames: [],
        selectedContent: "", // 当前选中的文章内容
        isEditing: false,
        editingContent: "",
        currentArticle: null,
        // 编辑表单数据
        editForm: {
            title: "",
            date: "",
            authors: "",
            content: "",
            tags: ""
        }
    },

    onLoad() {
        const EventChannel = this.getOpenerEventChannel()

        EventChannel.on('myEvent', (res) => {
            console.log(res);
            const {
                articles
            } = res;

            // 提取每个对象的 name 属性
            const articleNames = articles.map(item => item.name.replace('.md', ''));

            this.setData({
                articles,
                articleNames
            });
        });
    },


    // 点击事件处理：根据索引找到对应的内容
    onArticleClick(e) {
        const index = e.currentTarget.dataset.index; // 获取点击项的索引
        const article = this.data.articles[index];
        const contentURL = article.download_url;

        console.log(contentURL)

        // 获取文章内容
        wx.request({
            url: contentURL,
            method: "GET",
            success: (res) => {
                // 解析文章元数据和内容
                const content = res.data;
                const metaMatch = content.match(/\+\+\+([\s\S]*?)\+\+\+/);
                const mainContent = content.replace(/\+\+\+[\s\S]*?\+\+\+/, '').trim();

                let metadata = {};
                if (metaMatch) {
                    const metaContent = metaMatch[1];
                    // 解析元数据
                    const titleMatch = metaContent.match(/title\s*=\s*"([^"]+)"/);
                    const dateMatch = metaContent.match(/date\s*=\s*([^\n]+)/);
                    const authorsMatch = metaContent.match(/authors\s*=\s*\[(.*?)\]/);
                    const tagsMatch = metaContent.match(/tags\s*=\s*\[(.*?)\]/);

                    metadata = {
                        title: titleMatch ? titleMatch[1] : "",
                        date: dateMatch ? dateMatch[1].trim() : "",
                        authors: authorsMatch ? authorsMatch[1].replace(/"/g, '').split(',').map(a => a.trim()).join(',') : "",
                        tags: tagsMatch ? tagsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()).join(',') : ""
                    };
                }

                this.setData({
                    selectedContent: mainContent,
                    currentArticle: article,
                    editForm: {
                        ...metadata,
                        content: mainContent
                    }
                });
            },
            fail: (err) => {
                console.log(err)
                wx.showToast({
                    title: '内容加载失败',
                    icon: 'none',
                    duration: 2000
                });
            }
        });
    },

    // 进入编辑模式
    startEditing() {
        this.setData({
            isEditing: true,
            editingContent: this.data.selectedContent
        });
    },

    // 处理表单输入变化
    handleEditInput(e) {
        const {
            field
        } = e.currentTarget.dataset;
        this.setData({
            [`editForm.${field}`]: e.detail.value
        });
    },

    // 保存编辑内容
    saveEdit() {
        const {
            editForm,
            currentArticle
        } = this.data;

        // 构建文章内容
        let frontMatter = `+++
title = "${editForm.title}"
date = ${editForm.date}
authors = [${editForm.authors.split(',').map(author => `"${author.trim()}"`).join(', ')}]`;

        // 只有当tags存在且不为空时才添加tags部分
        if (editForm.tags && editForm.tags.trim()) {
            frontMatter += `
[taxonomies]
tags = [${editForm.tags.split(',').map(tag => `"${tag.trim()}"`).join(', ')}]`;
        }

        const formattedContent = `${frontMatter}
+++

${editForm.content}`;

        // 获取父页面的数据
        const pages = getCurrentPages();
        const parentPage = pages[pages.length - 2];

        // 上传更新后的内容
        this.updateGithubContent(
            currentArticle.path,
            formattedContent,
            currentArticle.sha,
            parentPage.data.owner,
            parentPage.data.repo,
            parentPage.data.githubToken
        );
    },

    // 更新 GitHub 内容
    updateGithubContent(path, content, sha, owner, repo, token) {
        // 转换内容为base64
        const utf8Content = unescape(encodeURIComponent(content)).split("").map(val => val.charCodeAt());
        const base64Content = wx.arrayBufferToBase64(new Uint8Array(utf8Content));

        wx.request({
            url: `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            method: 'PUT',
            header: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                message: `Update ${path}`,
                content: base64Content,
                sha: sha
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    this.setData({
                        ['currentArticle.sha']: res.data.content.sha,
                        isEditing: false,
                        selectedContent: this.data.editForm.content
                    });
                    wx.showToast({
                        title: '更新成功',
                        icon: 'success'
                    });
                } else {
                    wx.showToast({
                        title: '更新失败',
                        icon: 'error'
                    });
                }
            },
            fail: (error) => {
                console.error('更新失败:', error);
                wx.showToast({
                    title: '更新失败',
                    icon: 'error'
                });
            }
        });
    },

    // 取消编辑
    cancelEdit() {
        this.setData({
            isEditing: false
        });
    },

    // 关闭详情页
    closeContent() {
        this.setData({
            selectedContent: "",
            isEditing: false,
            editForm: {
                title: "",
                date: "",
                authors: "",
                content: "",
                tags: ""
            }
        });
    }
});