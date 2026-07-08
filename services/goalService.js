function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function formatDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(days, fromDate = new Date()) {
  const date = new Date(fromDate)
  date.setDate(date.getDate() + Math.max(1, Math.round(num(days, 1))))
  return formatDate(date)
}

function daysUntil(targetDate, fromDate = new Date()) {
  const target = new Date(`${targetDate}T00:00:00`)
  const start = new Date(formatDate(fromDate) + 'T00:00:00')
  const diff = Math.ceil((target.getTime() - start.getTime()) / 86400000)
  return Math.max(1, diff)
}

function calculateGoalPlan(options = {}) {
  const currentWeight = num(options.currentWeight)
  const targetWeight = num(options.targetWeight)
  const periodDays = Math.max(1, Math.round(num(options.periodDays, 60)))
  const targetDate = options.targetDate || addDays(periodDays)
  const days = options.targetDate ? daysUntil(targetDate) : periodDays
  const weightLossKg = Math.max(0, currentWeight - targetWeight)
  const maintenanceCalories = currentWeight > 0 ? currentWeight * 30 : 1800
  const dailyDeficit = weightLossKg > 0 ? (weightLossKg * 7700) / days : 0
  const dailyCalories = Math.round(clamp(maintenanceCalories - dailyDeficit, 1200, 2600))
  const proteinGoal = Math.round(clamp(currentWeight * 1.6, 50, 180))

  return {
    currentWeight,
    targetWeight,
    periodDays: days,
    targetDate,
    dailyCalories,
    proteinGoal
  }
}

function getCurrentUserId() {
  const user = (getApp().globalData && getApp().globalData.user) || {}
  return user._id || user.userId || user.openid || user._openid || ''
}

function getGoalCollection() {
  return wx.cloud.database().collection('user_goals')
}

function loadUserGoal(userId) {
  if (!userId) return Promise.resolve(null)
  return getGoalCollection()
    .where({ userId })
    .limit(1)
    .get()
    .then(res => (res.data && res.data[0]) || null)
}

function saveUserGoal(goal) {
  const userId = goal.userId || getCurrentUserId()
  const data = {
    userId,
    currentWeight: num(goal.currentWeight),
    targetWeight: num(goal.targetWeight),
    periodDays: Math.max(1, Math.round(num(goal.periodDays, 60))),
    targetDate: goal.targetDate,
    dailyCalories: Math.round(num(goal.dailyCalories)),
    proteinGoal: Math.round(num(goal.proteinGoal))
  }
  const db = wx.cloud.database()
  const collection = db.collection('user_goals')

  return collection.where({ userId }).limit(1).get()
    .then(res => {
      const existing = (res.data && res.data[0]) || null
      if (existing && existing._id) {
        return collection.doc(existing._id).update({
          data: {
            ...data,
            updatedAt: db.serverDate()
          }
        })
          .then(() => ({ ...existing, ...data }))
      }
      return collection.add({
        data: {
          ...data,
          createdAt: db.serverDate()
        }
      }).then(addRes => ({ ...data, _id: addRes._id, createdAt: new Date() }))
    })
}

module.exports = {
  addDays,
  calculateGoalPlan,
  daysUntil,
  formatDate,
  getCurrentUserId,
  loadUserGoal,
  saveUserGoal
}
