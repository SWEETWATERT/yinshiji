const { mockLogin } = require('../../services/auth')
const { getUserProfile, saveUserProfile } = require('../../utils/storage')

Page({
  data: {
    user: {}
  },

  onShow() {
    this.setData({ user: getUserProfile() || mockLogin() })
  },

  mockRelogin() {
    const user = mockLogin()
    saveUserProfile(user)
    this.setData({ user })
    wx.showToast({ title: '已登录' })
  },

  showSettingToast() {
    wx.showToast({ title: '设置功能待接入', icon: 'none' })
  },

  clearLocalData() {
    wx.showModal({
      title: '清除本地数据',
      content: '将清除本机缓存中的餐食记录，个人资料会保留。',
      confirmText: '清除',
      confirmColor: '#d85c76',
      success: (res) => {
        if (!res.confirm) return
        wx.removeStorageSync('meals')
        wx.showToast({ title: '已清除' })
      }
    })
  }
})
