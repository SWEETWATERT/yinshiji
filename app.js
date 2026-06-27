const config = require('./services/config')

App({
  globalData: {
    user: null,
    calorieTarget: 1800,
    loginReady: null,
    splashShown: false
  },

  onLaunch() {
    const cloudOptions = { traceUser: true }
    if (config.CLOUD_ENV_ID) {
      cloudOptions.env = config.CLOUD_ENV_ID
    }
    wx.cloud.init(cloudOptions)

    this.globalData.loginReady = new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'login' })
        .then(res => {
          const user = res.result.user
          this.globalData.user = user
          this.globalData.calorieTarget = user.calorieTarget || 1800
          resolve()
        })
        .catch(err => {
          console.warn('login cloud call failed:', err)
          this.globalData.user = { nickName: '', calorieTarget: 1800, profileCompleted: false }
          resolve()
        })
    })
  },

  checkOnboarding() {
    const user = this.globalData.user
    if (user && user.profileCompleted !== true) {
      wx.redirectTo({ url: '/pages/onboarding/index' })
      return true
    }
    return false
  },

  shouldShowSplash() {
    return this.globalData.splashShown !== true
  },

  markSplashShown() {
    this.globalData.splashShown = true
  }
})
