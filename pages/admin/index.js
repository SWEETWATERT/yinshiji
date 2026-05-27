const ADMIN_MENU = [
  { title: '数据看板', desc: '总览用户、餐食、复核和反馈数据', url: '' },
  { title: '用户管理', desc: '查看用户资料和记录状态', url: '/pages/admin/users' },
  { title: '餐食记录', desc: '按用户、日期、餐次查看记录', url: '/pages/admin/meals' },
  { title: 'AI 复核', desc: '处理低置信度识别和人工修正', url: '/pages/admin/reviews' },
  { title: '食物库', desc: '维护食物营养、分类和别名', url: '/pages/admin/foods' },
  { title: '用户反馈', desc: '跟进识别错误和产品反馈', url: '/pages/admin/feedback' },
  { title: '配置管理', desc: '维护开关、阈值和后台配置', url: '/pages/admin/config' }
]

Page({
  data: {
    menu: ADMIN_MENU,
    adminStatus: '未校验'
  },

  onLoad() {
    wx.cloud.callFunction({
      name: 'adminApi',
      data: { action: 'whoami' }
    })
      .then(res => {
        const result = res.result || {}
        this.setData({
          adminStatus: result.message || (result.isAdmin ? '管理员已确认' : '当前账号暂无后台权限')
        })
      })
      .catch(() => {
        this.setData({ adminStatus: '权限校验失败，请稍后重试' })
      })
  },

  openMenu(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  }
})
