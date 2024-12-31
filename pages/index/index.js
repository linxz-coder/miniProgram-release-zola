Page({
    data: {
        // 原有的表单数据
        title: '',
        date: '',
        authors: '',
        content: '',
        tags: '',

        // 新增的上传相关数据
        paths: [
            '/content/blog',
            '/content/shorts',
            '/content/books',
            '/content',
            '自定义路径'
        ],
        // GitHub 配置
        githubToken: "", // 需要替换成你的个人访问令牌
        owner: "",
        repo: ""
    },
    // 接收登录信息
    onLoad: function(options) {
        if (options.owner && options.repo && options.githubToken) {
          // 如果是从登录页面跳转过来,使用URL参数
          this.setData({
            owner: options.owner,
            repo: options.repo,
            githubToken: options.githubToken
          })
        } else {
          // 否则从本地存储获取
          const userInfo = wx.getStorageSync('userInfo')
          if (userInfo) {
            this.setData({
              owner: userInfo.name,
              repo: userInfo.repo,
              githubToken: userInfo.password
            })
          }
        }
      },

    // 原有的表单项变化监听函数
    onTitleChange(e) {
        this.setData({
            title: e.detail.value
        });
    },

    onDateChange(e) {
        this.setData({
            date: e.detail.value
        });
    },

    onAuthorsChange(e) {
        this.setData({
            authors: e.detail.value
        });
    },

    onContentChange(e) {
        this.setData({
            content: e.detail.value
        });
    },

    onTagsChange(e) {
        this.setData({
            tags: e.detail.value
        });
    },

    // 原有的表单提交函数,修改为显示确认弹窗
    formSubmit: function (e) {
        console.log('form发生了submit事件，携带数据为：', e.detail.value);
        wx.showModal({
            title: '确认上传',
            content: '是否确认上传该文章？',
            success: (res) => {
                if (res.confirm) {
                    this.showPathSelector();
                }
            }
        });
    },

    // 原有的重置函数
    formReset: function () {
        console.log('form发生了reset事件');
    },

    // 原有的源码检查函数
    checkSourceCode() {
        const {
            title,
            date,
            authors,
            content,
            tags
        } = this.data;

        // 检查必填项
        if (!title || !date || !authors) {
            wx.showToast({
                title: '请填写完整信息',
                icon: 'none'
            });
            return;
        }

        // 跳转到源码页面，携带表单数据
        wx.navigateTo({
            url: `/pages/source-code/source-code?title=${encodeURIComponent(title)}&date=${date}&authors=${encodeURIComponent(authors)}&content=${encodeURIComponent(content)}&tags=${encodeURIComponent(tags)}`
        });
    },

    // 路径显示
    showPathSelector() {
        wx.showActionSheet({
            itemList: this.data.paths,
            success: (res) => {
                const selectedPath = this.data.paths[res.tapIndex];
                if (selectedPath === '自定义路径') {
                    wx.showModal({
                        title: '输入路径',
                        editable: true,
                        placeholderText: '请输入自定义路径',
                        success: (res) => {
                            if (res.confirm && res.content) {
                                this.handlePathConfirm(res.content);
                            }
                        }
                    });
                } else {
                    this.handlePathConfirm(selectedPath);
                }
            }
        });
    },

    // 确认路径后的处理
    handlePathConfirm(path) {
        const {
            title,
            date,
            authors,
            tags,
            content
        } = this.data;

        // 处理 tags 字符串，转换为数组
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        // 处理 authors 字符串，转换为数组
        const authorArray = authors ? authors.split(',').map(author => author.trim()) : [];

        // 生成格式化的内容
        const formattedContent = `+++
title = "${title}"
date = ${date}
authors = [${authorArray.map(author => `"${author}"`).join(', ')}]
[taxonomies]
tags = [${tagArray.map(tag => `"${tag}"`).join(', ')}]
+++

${content}`;

        // console.log('准备上传的数据:', {
        //   formattedContent,
        //   path
        // });

        // 生成文件名（将标题转换为适合的文件名格式）
        const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;

        // 上传到GitHub
        this.uploadToGithub(path, fileName, formattedContent);
    },

    //  查看文章功能
    viewArticles() {
        wx.showActionSheet({
            itemList: this.data.paths,
            success: (res) => {
                const selectedPath = this.data.paths[res.tapIndex];
                if (selectedPath === '自定义路径') {
                    wx.showModal({
                        title: '输入路径',
                        editable: true,
                        placeholderText: '请输入自定义路径',
                        success: (res) => {
                            if (res.confirm && res.content) {
                                this.fetchArticles(res.content);
                            }
                        }
                    });
                } else {
                    this.fetchArticles(selectedPath);
                }
            }
        });
    },


    // 获取文章列表
    fetchArticles(path) {
        const cleanPath = path.replace(/^\//, '');

        wx.showLoading({
            title: '加载中...',
        });

        wx.request({
            url: `https://api.github.com/repos/${this.data.owner}/${this.data.repo}/contents/${cleanPath}`,
            method: 'GET',
            header: {
                'Authorization': `token ${this.data.githubToken}`,
                "Accept": "application/vnd.github.v3+json"
            },
            success: (res) => {
                // console.log('API响应:', res); // 添加日志
                if (res.statusCode === 200) {
                    const articles = res.data.filter(file =>
                        file.name.endsWith('.md') && file.name !== '_index.md'
                    );
                    //   console.log('过滤后的文章:', articles); // 添加日志
                    this.showArticlesList(articles);
                } else {
                    console.error('获取失败:', res); // 添加错误日志
                    wx.showToast({
                        title: '获取失败',
                        icon: 'error'
                    });
                }
            },
            fail: (error) => {
                console.error('请求失败:', error); // 添加错误日志
                wx.showToast({
                    title: '请求失败',
                    icon: 'error'
                });
            },
            complete: () => {
                wx.hideLoading();
            }
        });
    },

    // 显示文章列表
    showArticlesList(articles) {
        if (articles.length === 0) {
            wx.showToast({
                title: '暂无文章',
                icon: 'none'
            });
            return;
        }

        wx.navigateTo({
            url: `/pages/article-list/article-list?article=${encodeURIComponent(JSON.stringify(articles))}`,
        });

    },

    //  上传功能
    uploadToGithub(path, fileName, content) {
        // 移除开头的斜杠（如果存在）
        const cleanPath = path.replace(/^\//, '');

        // 转换内容为base64
        const utf8Content = unescape(encodeURIComponent(content)).split("").map(val => val.charCodeAt());
        const base64Content = wx.arrayBufferToBase64(new Uint8Array(utf8Content));

        wx.request({
            url: `https://api.github.com/repos/${this.data.owner}/${this.data.repo}/contents/${cleanPath}/${fileName}`,
            method: 'PUT',
            header: {
                'Authorization': `token ${this.data.githubToken}`,
                'Content-Type': 'application/json'
            },
            data: {
                message: `Add ${fileName}`,
                content: base64Content,
                branch: 'main' // 或者你的默认分支名
            },
            success: (res) => {
                if (res.statusCode === 201) {
                    wx.showToast({
                        title: '上传成功',
                        icon: 'success'
                    });
                    // 重置表单数据
                    this.setData({
                        title: '',
                        content: '',
                        tags: ''
                    });
                } else {
                    wx.showToast({
                        title: '上传失败',
                        icon: 'error'
                    });
                    console.error('上传失败:', res);
                }
            },
            fail: (error) => {
                wx.showToast({
                    title: '上传失败',
                    icon: 'error'
                });
                console.error('请求失败:', error);
            }
        });
    }
})