const { chooseMealImage } = require('../../services/upload')

Page({
  data: {
    selectedMeal: 'lunch',
    mealTouched: false,
    imagePath: '',
    note: '',
    uploading: false,
    mealTypes: [
      { type: 'breakfast', label: '早餐', icon: '☀️' },
      { type: 'lunch', label: '午餐', icon: '🥗' },
      { type: 'dinner', label: '晚餐', icon: '🌙' },
      { type: 'snack', label: '加餐', icon: '🫐' },
      { type: 'drink', label: '饮品', icon: '🥤' }
    ],
    noteTags: ['牛肉100克', '白粥200克', '鸡蛋50克', '米饭半碗', '少油', '无糖']
  },

  onShow() {
    const app = getApp()
    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
    })
    this.applyTimeMeal()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  applyTimeMeal() {
    if (this.data.mealTouched) return
    const hour = new Date().getHours()
    let selectedMeal = 'lunch'
    if (hour < 10) selectedMeal = 'breakfast'
    else if (hour >= 15 && hour < 17) selectedMeal = 'snack'
    else if (hour >= 17) selectedMeal = 'dinner'
    this.setData({ selectedMeal })
  },

  selectMeal(event) {
    this.setData({ selectedMeal: event.currentTarget.dataset.type, mealTouched: true })
  },

  setNote(event) {
    const value = String(event.currentTarget.dataset.note || '').trim()
    if (!value) return
    const current = String(this.data.note || '').trim()
    const next = current
      ? current.includes(value) ? current : `${current} ${value}`
      : value
    this.setData({ note: next })
  },

  onNoteInput(event) {
    this.setData({ note: event.detail.value })
  },

  takePhoto() {
    this.chooseImage(['camera'])
  },

  chooseFromAlbum() {
    this.chooseImage(['album'])
  },

  chooseImage(sourceType) {
    chooseMealImage(sourceType)
      .then((imagePath) => this.setData({ imagePath }))
      .catch(() => {
        wx.showToast({ title: '未选择图片', icon: 'none' })
      })
  },

  startAnalyze() {
    const { imagePath, selectedMeal, note } = this.data

    if (!imagePath) {
      wx.showToast({ title: '先上传一张餐食照片', icon: 'none' })
      return
    }

    if (!this.hasFoodNote(note)) {
      wx.showModal({
        title: '补充食物名称',
        content: '请在备注里写上食物和大致份量，例如：牛肉100克、白粥200克。',
        showCancel: false,
        confirmText: '去填写'
      })
      return
    }

    this.setData({ uploading: true })
    const cloudPath = `meal-images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

    wx.cloud.uploadFile({
      cloudPath,
      filePath: imagePath
    })
      .then(res => {
        this.setData({ uploading: false })
        wx.navigateTo({
          url: `/pages/analyze/index?imageFileID=${encodeURIComponent(res.fileID)}&mealType=${selectedMeal}&note=${encodeURIComponent(note)}`
        })
      })
      .catch(() => {
        this.setData({ uploading: false })
        wx.showToast({ title: '图片上传失败', icon: 'none' })
      })
  },

  hasFoodNote(note) {
    const text = String(note || '').replace(/\s+/g, '')
    if (text.length < 2) return false
    const nonFoodOnly = ['少油', '少盐', '无糖', '半糖', '外食', '夜宵', '自定义']
    if (nonFoodOnly.includes(text)) return false
    return /[\u4e00-\u9fa5a-zA-Z]/.test(text)
  }
})
