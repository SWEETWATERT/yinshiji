const { chooseMealImage } = require('../../services/upload')

Page({
  data: {
    selectedMeal: 'lunch',
    imagePath: '',
    note: '少油',
    mealTypes: [
      { type: 'breakfast', label: '早餐', icon: '☀️' },
      { type: 'lunch', label: '午餐', icon: '🥗' },
      { type: 'dinner', label: '晚餐', icon: '🌙' },
      { type: 'snack', label: '加餐', icon: '🫐' },
      { type: 'drink', label: '饮品', icon: '🥤' }
    ],
    noteTags: ['少油', '半碗饭', '无糖', '外食', '夜宵', '自定义']
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  selectMeal(event) {
    this.setData({ selectedMeal: event.currentTarget.dataset.type })
  },

  setNote(event) {
    this.setData({ note: event.currentTarget.dataset.note })
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
    const imagePath = this.data.imagePath || '/assets/mock-meal.png'
    wx.navigateTo({
      url: `/pages/analyze/index?imagePath=${encodeURIComponent(imagePath)}&mealType=${this.data.selectedMeal}&note=${encodeURIComponent(this.data.note)}`
    })
  }
})
