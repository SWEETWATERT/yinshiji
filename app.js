const { mockLogin } = require('./services/auth')
const { getUserProfile, saveUserProfile } = require('./utils/storage')

App({
  globalData: {
    user: null,
    calorieTarget: 1800
  },

  onLaunch() {
    const profile = getUserProfile()
    if (profile) {
      this.globalData.user = profile
      this.globalData.calorieTarget = profile.calorieTarget || 1800
      return
    }

    const user = mockLogin()
    saveUserProfile(user)
    this.globalData.user = user
    this.globalData.calorieTarget = user.calorieTarget
  }
})
