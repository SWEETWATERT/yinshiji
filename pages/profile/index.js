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
  }
})
