const ADMIN_MENU = [
  { title: '用户管理', desc: '查看用户资料和记录状态', url: '/pages/admin/users', icon: '用' },
  { title: '餐食记录', desc: '按用户、日期、餐次查看记录', url: '/pages/admin/meals', icon: '餐' },
  { title: 'AI 复核任务', desc: '处理低置信度识别和人工修正', url: '/pages/admin/reviews', icon: '复' },
  { title: '食物库', desc: '维护食物营养、分类和别名', url: '/pages/admin/foods', icon: '食' },
  { title: '用户反馈', desc: '跟进识别错误和产品反馈', url: '/pages/admin/feedback', icon: '馈' },
  { title: '系统配置', desc: '维护开关、阈值和后台配置', url: '/pages/admin/config', icon: '设' }
]

const EMPTY_CARDS = [
  { key: 'users', label: '用户数量', value: 0, unit: '人' },
  { key: 'meals', label: '餐食记录', value: 0, unit: '条' },
  { key: 'todayMeals', label: '今日餐食', value: 0, unit: '条' },
  { key: 'foodItems', label: '食物库', value: 0, unit: '项' },
  { key: 'analysisLogs', label: '分析日志', value: 0, unit: '条' },
  { key: 'pendingReviews', label: '待复核任务', value: 0, unit: '项' },
  { key: 'openFeedback', label: '反馈数量', value: 0, unit: '条' }
]

Page({
  data: {
    menu: ADMIN_MENU,
    cards: EMPTY_CARDS,
    adminStatus: '校验中',
    adminFlagText: 'false',
    roleText: '--',
    today: '',
    isAdmin: false,
    loading: true,
    errorText: ''
  },

  onLoad() {
    this.loadDashboard()
  },

  onShow() {
    if (this._loadedOnce) this.loadDashboard()
  },

  loadDashboard() {
    this.setData({
      loading: true,
      errorText: ''
    })

    Promise.all([
      wx.cloud.callFunction({
        name: 'adminApi',
        data: { action: 'whoami' }
      }),
      wx.cloud.callFunction({
        name: 'adminApi',
        data: { action: 'dashboard' }
      })
    ])
      .then(([whoamiRes, dashboardRes]) => {
        this._loadedOnce = true
        const whoami = whoamiRes.result || {}
        const dashboard = dashboardRes.result || {}
        const roles = Array.isArray(whoami.roles) ? whoami.roles : []

        if (whoami.isAdmin === false) {
          this.setNoPermission()
          return
        }

        this.setData({
          adminStatus: '管理员',
          adminFlagText: 'true',
          roleText: roles.length ? roles.join(' / ') : '--',
          isAdmin: true,
          today: dashboard.today || '',
          cards: this.buildCards(dashboard.cards || {}),
          loading: false,
          errorText: ''
        })
      })
      .catch(err => {
        this._loadedOnce = true
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          adminStatus: '加载失败',
          adminFlagText: 'false',
          roleText: '--',
          today: '',
          isAdmin: false,
          cards: EMPTY_CARDS,
          loading: false,
          errorText: '后台数据暂时无法加载，请稍后重试。'
        })
      })
  },

  buildCards(cards) {
    return EMPTY_CARDS.map(item => ({
      ...item,
      value: Number(cards[item.key] || 0)
    }))
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  },

  setNoPermission() {
    this.setData({
      adminStatus: '无后台权限',
      adminFlagText: 'false',
      roleText: '--',
      today: '',
      isAdmin: false,
      cards: EMPTY_CARDS,
      loading: false,
      errorText: '当前账号暂无后台管理权限。'
    })
  },

  openMenu(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  }
})
