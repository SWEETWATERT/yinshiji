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

function dateToTime(dateText) {
  if (!dateText) return 0
  const time = new Date(`${dateText}T00:00:00`).getTime()
  return Number.isFinite(time) ? time : 0
}

function formatShortDate(dateText) {
  if (!dateText || dateText.indexOf('-') === -1) return '--'
  const parts = dateText.split('-')
  return `${Number(parts[1])}.${Number(parts[2])}`
}

function buildTargetDateInfo(goal = {}) {
  const targetDate = goal.targetDate || ''
  if (!targetDate) {
    return {
      dateText: '--',
      desc: '设置周期后生成预计达成日期'
    }
  }

  const today = dateToTime(formatDate())
  const target = dateToTime(targetDate)
  const daysLeft = target > today ? Math.ceil((target - today) / 86400000) : 0

  return {
    dateText: targetDate,
    desc: daysLeft > 0 ? `预计还需 ${daysLeft} 天` : '目标日期已到，建议更新计划'
  }
}

function countConsecutiveRecordDays(records = []) {
  const dates = Array.from(new Set(
    records
      .map(record => record.date)
      .filter(Boolean)
  )).sort((a, b) => b.localeCompare(a))

  if (!dates.length) return 0

  let count = 1
  for (let i = 1; i < dates.length; i += 1) {
    const prev = dateToTime(dates[i - 1])
    const current = dateToTime(dates[i])
    if (!prev || !current || Math.round((prev - current) / 86400000) !== 1) break
    count += 1
  }
  return count
}

function buildMilestones(progress, records = []) {
  const consecutiveDays = countConsecutiveRecordDays(records)
  const lostKg = num(progress.lostKg)
  const percent = num(progress.progressPercent)

  return [
    {
      id: 'first_kg',
      done: lostKg >= 1,
      title: '第一次下降 1kg',
      desc: lostKg >= 1 ? `已下降 ${progress.lostKgText}kg` : '距离第一个里程碑还差一点'
    },
    {
      id: 'seven_days',
      done: consecutiveDays >= 7,
      title: '连续记录 7 天',
      desc: consecutiveDays >= 7 ? '体重追踪已形成习惯' : `当前连续 ${consecutiveDays} 天`
    },
    {
      id: 'half_goal',
      done: percent >= 50,
      title: '达成目标 50%',
      desc: percent >= 50 ? '已经完成一半目标' : `当前完成 ${percent}%`
    }
  ]
}

function buildCurvePoints(records = [], progress = {}) {
  const sorted = (records || [])
    .filter(record => Number(record.weightKg) > 0)
    .slice()
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
    .slice(-7)

  if (!sorted.length) return []

  const weights = sorted.map(record => Number(record.weightKg))
  const minWeight = Math.min(...weights, num(progress.targetWeight, weights[0]))
  const maxWeight = Math.max(...weights, num(progress.startWeight, weights[0]))
  const range = Math.max(0.1, maxWeight - minWeight)

  return sorted.map((record, index) => {
    const weight = Number(record.weightKg)
    const top = Math.round(12 + ((weight - minWeight) / range) * 64)
    const dropHeight = Math.max(18, 88 - top)

    return {
      id: record.id || record._id || `${record.date}_${index}`,
      dateLabel: formatShortDate(record.date),
      weightText: `${weight.toFixed(1)}kg`,
      top,
      dropHeight,
      isLatest: index === sorted.length - 1
    }
  })
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
    trendSummary: buildTrendSummary([], defaultProgress()),
    targetDateInfo: buildTargetDateInfo(),
    curvePoints: [],
    milestones: buildMilestones(defaultProgress(), [])
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
        const targetDateInfo = buildTargetDateInfo(goal || {})
        const curvePoints = buildCurvePoints(safeRecords, progress)
        const milestones = buildMilestones(progress, safeRecords)
        this.setData({
          loading: false,
          goal: goal || null,
          records: safeRecords,
          latestWeight,
          progress,
          trendSummary,
          targetDateInfo,
          curvePoints,
          milestones,
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
