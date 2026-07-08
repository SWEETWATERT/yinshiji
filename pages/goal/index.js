const {
  addDays,
  calculateGoalPlan,
  getCurrentUserId,
  loadUserGoal,
  saveUserGoal
} = require('../../services/goalService')

function asInput(value) {
  return value || value === 0 ? String(value) : ''
}

Page({
  data: {
    loading: true,
    saving: false,
    error: '',
    userId: '',
    currentWeight: '',
    targetWeight: '',
    periodDays: '60',
    targetDate: '',
    dailyCalories: 0,
    proteinGoal: 0,
    weightGap: 0
  },

  onLoad() {
    const app = getApp()
    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      this.initGoal()
    })
  },

  initGoal() {
    const user = getApp().globalData.user || {}
    const userId = getCurrentUserId()
    const fallbackWeight = Number(user.weightKg || user.weight || 0)
    const currentWeight = fallbackWeight || ''
    const targetWeight = fallbackWeight ? Math.max(1, Math.round((fallbackWeight - 3) * 10) / 10) : ''
    const periodDays = 60
    const targetDate = addDays(periodDays)

    this.setData({
      userId,
      currentWeight: asInput(currentWeight),
      targetWeight: asInput(targetWeight),
      periodDays: String(periodDays),
      targetDate,
      loading: true,
      error: ''
    }, () => {
      this.recalculate()
      loadUserGoal(userId)
        .then(goal => {
          if (!goal) {
            this.setData({ loading: false })
            return
          }
          this.setData({
            currentWeight: asInput(goal.currentWeight),
            targetWeight: asInput(goal.targetWeight),
            targetDate: goal.targetDate || targetDate,
            periodDays: String(goal.periodDays || periodDays),
            dailyCalories: goal.dailyCalories || 0,
            proteinGoal: goal.proteinGoal || 0,
            loading: false
          }, () => this.recalculate())
        })
        .catch(() => {
          this.setData({
            loading: false,
            error: '目标读取失败，可直接重新保存。'
          })
        })
    })
  },

  onCurrentWeightInput(e) {
    this.setData({ currentWeight: e.detail.value }, () => this.recalculate())
  },

  onTargetWeightInput(e) {
    this.setData({ targetWeight: e.detail.value }, () => this.recalculate())
  },

  onPeriodInput(e) {
    const periodDays = e.detail.value
    this.setData({
      periodDays,
      targetDate: addDays(Number(periodDays || 1))
    }, () => this.recalculate())
  },

  recalculate() {
    const plan = calculateGoalPlan({
      currentWeight: this.data.currentWeight,
      targetWeight: this.data.targetWeight,
      periodDays: this.data.periodDays,
      targetDate: this.data.targetDate
    })
    const weightGap = Math.max(0, Math.round((plan.currentWeight - plan.targetWeight) * 10) / 10)
    this.setData({
      targetDate: plan.targetDate,
      dailyCalories: plan.dailyCalories,
      proteinGoal: plan.proteinGoal,
      weightGap
    })
  },

  validate() {
    const currentWeight = Number(this.data.currentWeight)
    const targetWeight = Number(this.data.targetWeight)
    const periodDays = Number(this.data.periodDays)

    if (!currentWeight || currentWeight <= 0) return '请输入当前体重'
    if (!targetWeight || targetWeight <= 0) return '请输入目标体重'
    if (targetWeight >= currentWeight) return '目标体重需要低于当前体重'
    if (!periodDays || periodDays < 14) return '周期至少 14 天，避免过快减重'
    if (periodDays > 365) return '周期最长 365 天'
    return ''
  },

  saveGoal() {
    const message = this.validate()
    if (message) {
      wx.showToast({ title: message, icon: 'none' })
      return
    }

    const plan = calculateGoalPlan({
      currentWeight: this.data.currentWeight,
      targetWeight: this.data.targetWeight,
      periodDays: this.data.periodDays,
      targetDate: this.data.targetDate
    })

    this.setData({ saving: true, error: '' })
    saveUserGoal({
      userId: this.data.userId,
      ...plan
    })
      .then(goal => {
        const app = getApp()
        app.globalData.user = {
          ...(app.globalData.user || {}),
          weightKg: goal.currentWeight,
          calorieTarget: goal.dailyCalories,
          proteinTarget: goal.proteinGoal,
          fatLossGoal: goal
        }
        this.setData({ saving: false })
        wx.showToast({ title: '目标已保存', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      })
      .catch(err => {
        console.error('save user goal failed', err)
        this.setData({
          saving: false,
          error: '保存失败，请确认 user_goals 集合已创建并允许当前用户写入。'
        })
      })
  }
})
