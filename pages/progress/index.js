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

function buildTrendSummary(records, progress) {
  const sorted = (records || [])
    .filter(record => Number(record.weightKg) > 0)
    .slice()
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  const first = sorted[0]
  const latest = sorted[sorted.length - 1]

  if (!first || !latest) {
    return {
      title: '等待第一次体重记录',
      desc: '保存今日体重后，系统会开始追踪最近7次变化。',
      changeText: '--',
      isDown: false
    }
  }

  if (first.id === latest.id || first._id === latest._id || first.date === latest.date) {
    return {
      title: '已记录首次体重',
      desc: '继续记录几次后，会显示下降或上升趋势。',
      changeText: '0.0 kg',
      isDown: false
    }
  }

  const change = Math.round((Number(latest.weightKg) - Number(first.weightKg)) * 10) / 10
  const absText = Math.abs(change).toFixed(1)
  if (change < 0) {
    return {
      title: '最近7次趋势向下',
      desc: `从 ${first.weightKg.toFixed(1)}kg 到 ${latest.weightKg.toFixed(1)}kg，距离目标还差 ${progress.remainingKgText}kg。`,
      changeText: `-${absText} kg`,
      isDown: true
    }
  }
  if (change > 0) {
    return {
      title: '最近7次体重上升',
      desc: `从 ${first.weightKg.toFixed(1)}kg 到 ${latest.weightKg.toFixed(1)}kg，建议检查晚餐和加餐。`,
      changeText: `+${absText} kg`,
      isDown: false
    }
  }
  return {
    title: '最近7次体重稳定',
    desc: `当前距离目标还差 ${progress.remainingKgText}kg，继续保持饮食记录。`,
    changeText: '0.0 kg',
    isDown: false
  }
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
    hasRecords: false,
    trendSummary: buildTrendSummary([], defaultProgress())
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
        const trendSummary = buildTrendSummary(safeRecords, progress)
        this.setData({
          loading: false,
          goal: goal || null,
          records: safeRecords,
          latestWeight,
          progress,
          trendSummary,
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
