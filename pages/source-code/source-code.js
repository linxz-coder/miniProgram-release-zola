// source-code.js
Page({
  data: {
    formattedContent: ''
  },

  onLoad: function () {

    const EventChannel = this.getOpenerEventChannel()

    EventChannel.on('myEvent', (res) => {
        console.log(res);
        const { title, date, authors, tags, content } = res;

        // 处理 tags 字符串，转换为数组
        const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        // 生成格式化的内容
        const formatted = this.generateFormattedContent({
            title,
            date,
            authors: authors ? authors.split(',') : [],
            tags: tagArray,
            content
        });
    
        this.setData({
            formattedContent: formatted
        });
    });
  },

  generateFormattedContent: function (data) {
    // 生成tags数组字符串
    const tagsStr = data.tags.map(tag => `"${tag}"`).join(', ');
    // 生成authors数组字符串
    const authorsStr = data.authors.map(author => `"${author}"`).join(', ');

    return `+++
title = "${data.title}"
date = ${data.date}
authors = [${authorsStr}]
[taxonomies]
tags = [${tagsStr}]
+++

${data.content}`;
  },

  // 复制内容到剪贴板
  copyContent: function () {
    wx.setClipboardData({
      data: this.data.formattedContent,
      success: function () {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  }
});