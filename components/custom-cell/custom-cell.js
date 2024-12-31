// components/custom-cell/custom-cell.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    placeholder: String,
    type: String,
    value: String
  },

  /**
   * 组件的初始数据
   */
  data: {
    date: ""
  },

  // attached指随页面开始展示，默认今天的日期
  attached: function () {
    if (this.properties.type === 'date') {
      // 获取今天的日期，格式化为YYYY-MM-DD
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`

      this.setData({
        date: todayStr
      })
      // 初始化时也触发一次datechange事件
      this.triggerEvent('datechange', {
        value: todayStr
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleInput: function (e) {
      // 触发自定义事件，将输入的值传递给父组件
      this.triggerEvent('input', {
        value: e.detail.value
      })
    },

    bindDateChange: function (e) {
      this.setData({
        date: e.detail.value
      })
      // 触发自定义事件，将选择的日期传递给父组件
      this.triggerEvent('datechange', {
        value: e.detail.value
      })
    }
  }
})