Component({
  data: {
    selected: 0,
    list: [
      { pagePath: 'pages/home/index',    text: '首页', key: 'home'    },
      { pagePath: 'pages/record/index',  text: '记录', key: 'record'  },
      { pagePath: 'pages/diary/index',   text: '日记', key: 'diary'   },
      { pagePath: 'pages/profile/index', text: '我的', key: 'profile' }
    ]
  },
  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      this.setData({ selected: index })
      wx.switchTab({ url: '/' + path })
    }
  }
})
