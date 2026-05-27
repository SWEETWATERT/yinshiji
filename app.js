App({
  globalData: {
    user: null,
    calorieTarget: 1800,
    loginReady: null,
    splashShown: false
  },

  onLaunch() {
    wx.cloud.init({
      env: 'cloud1-d8g4goa7pa3308807',
      traceUser: true
    })

    this.globalData.loginReady = new Promise((resolve) => {
      wx.cloud.callFunction({ name: 'login' })
        .then(res => {
          const user = res.result.user
          this.globalData.user = user
          this.globalData.calorieTarget = user.calorieTarget || 1800
          resolve()
        })
        .catch(() => {
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
