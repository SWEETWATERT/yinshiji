const {
  addWeightRecord,
  calculateProgress,
  formatDate,
  getLatestWeight,
  getWeightRecords
} = require('../../services/weightService')
const {
  getCurrentUserId,
  loadUserGoal
} = require('../../services/goalService')

function asInput(value) {
  return value || value === 0 ? String(value) : ''
}

function defaultProgress() {
  return calculateProgress({}, null)
}

Page({
  data: {
    loading: true,
    saving: false,
    error: '',
    userId: '',
    today: formatDate(),
    goal: null,
    progress: defaultProgress(),
    records: [],
    latestWeight: null,
    weightInput: '',
    noteInput: '',
    hasGoal: false,
    hasRecords: false
  },

  onLoad() {
    const app = getApp()
    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      this.loadProgress()
    })
  },

  loadProgress() {
    const userId = getCurrentUserId()
    this.setData({
      loading: true,
      error: '',
      userId,
      today: formatDate()
    })

    Promise.all([
      loadUserGoal(userId),
      getWeightRecords({ userId, limit: 7 }),
      getLatestWeight(userId)
    ])
      .then(([goal, records, latestWeight]) => {
        const safeRecords = records || []
        const progress = calculateProgress(goal || {}, latestWeight)
        this.setData({
          loading: false,
          goal: goal || null,
          records: safeRecords,
          latestWeight,
          progress,
          hasGoal: Boolean(goal && goal.targetWeight),
          hasRecords: safeRecords.length > 0,
          weightInput: asInput(progress.currentWeight),
          error: ''
        })
      })
      .catch(() => {
        this.setData({
          loading: false,
          error: '减脂进度读取失败，请稍后重试。'
        })
      })
  },

  refreshProgress() {
    this.loadProgress()
  },

  onWeightInput(e) {
    this.setData({ weightInput: e.detail.value })
  },

  onNoteInput(e) {
    this.setData({ noteInput: e.detail.value })
  },

  saveTodayWeight() {
    if (this.data.saving) return
    const weightKg = Number(this.data.weightInput)

    if (!this.data.hasGoal) {
      wx.showToast({ title: '请先设置减脂目标', icon: 'none' })
      return
    }
    if (!weightKg || weightKg < 20 || weightKg > 300) {
      wx.showToast({ title: '请输入有效体重', icon: 'none' })
      return
    }

    this.setData({ saving: true, error: '' })
    addWeightRecord({
      userId: this.data.userId,
      weightKg,
      date: this.data.today,
      note: this.data.noteInput
    })
      .then(record => {
        const app = getApp()
        app.globalData.user = {
          ...(app.globalData.user || {}),
          weightKg: record.weightKg
        }
        this.setData({
          saving: false,
          noteInput: ''
        })
        wx.showToast({ title: '体重已记录', icon: 'success' })
        this.loadProgress()
      })
      .catch(() => {
        this.setData({
          saving: false,
          error: '保存失败，请确认 weight_records 集合已创建并允许当前用户写入。'
        })
      })
  },

  goGoal() {
    wx.navigateTo({ url: '/pages/goal/index' })
  }
})
