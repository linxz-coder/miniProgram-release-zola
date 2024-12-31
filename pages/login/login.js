Page({
  data: {
    name: '',
    repo: '',
    password: ''
  },

  onLoad: function() {
    // 页面加载时检查本地存储
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      // 如果有存储的登录信息,直接跳转到首页
      wx.redirectTo({
        url: '/pages/index/index'
      })
    }
  },

  // 用户名输入事件处理
  onNameChange: function(e) {
    this.setData({
      name: e.detail.value
    })
  },

  // 仓库名输入事件处理 
  onRepoChange: function(e) {
    this.setData({
      repo: e.detail.value
    })
  },

  // 密码输入事件处理
  onPasswordChange: function(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 确认登录按钮事件
  formSubmit: function() {
    const { name, repo, password } = this.data

    // 验证输入不为空
    if (!name || !repo || !password) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    // 保存登录信息到本地
    wx.setStorageSync('userInfo', {
      name,
      repo,
      password
    })

    // 跳转到首页并传递参数
    wx.redirectTo({
      url: `/pages/index/index?owner=${name}&repo=${repo}&githubToken=${password}`
    })
  }
})