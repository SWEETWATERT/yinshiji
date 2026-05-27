function normalizeGender(gender) {
  if (gender === 'male' || gender === '男') return 'male'
  if (gender === 'female' || gender === '女') return 'female'
  return 'neutral'
}

Page({
  data: {
    user: {},
    displayName: '我的档案',
    genderText: '未设置',
    avatarUrl: '',
    avatarFallbackText: '我',
    avatarLoadError: false,
    characterUrl: ''
  },

  onShow() {
    const app = getApp()
    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      this._loadProfile()
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  _loadProfile() {
    wx.cloud.callFunction({
      name: 'userProfile',
      data: { action: 'get' }
    })
      .then(res => {
        const u = res.result && res.result.user
        if (u) {
          getApp().globalData.user = u
          this._applyUserData(u)
        } else {
          this._applyUserData(getApp().globalData.user || {})
        }
      })
      .catch(() => {
        this._applyUserData(getApp().globalData.user || {})
      })
  },

  _applyUserData(u) {
    const gender = normalizeGender(u.gender)
    const displayName = u.nickName || u.nickname || '我的档案'

    let genderText, avatarUrl, avatarFallbackText, characterUrl
    if (gender === 'male') {
      genderText = '男'
      avatarUrl = '/assets/avatar-male.png'
      avatarFallbackText = '男'
      characterUrl = '/assets/boy-3d-character.png'
    } else if (gender === 'female') {
      genderText = '女'
      avatarUrl = '/assets/girl-avatar.jpg'
      avatarFallbackText = '女'
      characterUrl = '/assets/girl-3d-character-profile.png'
    } else {
      genderText = '未设置'
      avatarUrl = ''
      avatarFallbackText = '我'
      characterUrl = ''
    }

    this.setData({
      user: { ...u, isAdmin: u.isAdmin === true },
      displayName,
      genderText,
      avatarUrl,
      avatarFallbackText,
      avatarLoadError: false,
      characterUrl
    })
  },

  onAvatarError() {
    this.setData({ avatarLoadError: true })
  },

  onCharacterError() {
    this.setData({ characterUrl: '' })
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/onboarding/index?mode=edit' })
  },

  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/index' })
  },

  showSettingToast() {
    wx.showToast({ title: '设置功能待接入', icon: 'none' })
  },

  clearLocalData() {
    wx.showToast({ title: '数据已迁移到云端，无需清除本地缓存', icon: 'none' })
  }
})
