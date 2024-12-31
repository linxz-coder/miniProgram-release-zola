Page({
    data: {
        articles: [], // 用于存储解析后的数组
        articleNames: [],
        selectedContent: "" // 当前选中的文章内容
    },

    onLoad(options) {
        // console.log(options)
        if (options.article) {
            const articles = JSON.parse(decodeURIComponent(options.article));

            // 提取每个对象的 name 属性
            const articleNames = articles.map(item => item.name.replace('.md', ''));

            this.setData({
                articles,
                articleNames
            });
        }
    },

    
  // 点击事件处理：根据索引找到对应的内容
  onArticleClick(e) {
    const index = e.currentTarget.dataset.index; // 获取点击项的索引
    const contentURL = this.data.articles[index].download_url; // 获取对应文章的 URL

    console.log(contentURL)

    // 获取文章内容
    wx.request({
      url: contentURL,
      method: "GET",
      success: (res) => {
        //剪切+++信息
        const contentWithoutMeta = res.data.replace(/\+\+\+[\s\S]*?\+\+\+/, '').trim();

        this.setData({
          selectedContent: contentWithoutMeta // 将内容设置到 selectedContent
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

  // 关闭详情页
  closeContent() {
    this.setData({
      selectedContent: "" // 清空选中的内容
    });
  }
});