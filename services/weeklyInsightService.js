const {
  addDays,
  formatDateKey,
  recentDateKeys,
  sumMealsNutrition
} = require('./growthService')

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function round(value) {
  return Math.round(num(value))
}

function dateOf(record = {}) {
  return String(record.date || '').slice(0, 10)
}

function inRange(record, startDate, endDate) {
  const date = dateOf(record)
  return date >= startDate && date <= endDate
}

function groupMealsByDate(meals = []) {
  return meals.reduce((map, meal) => {
    const date = dateOf(meal)
    if (!date) return map
    if (!map[date]) map[date] = []
    map[date].push(meal)
    return map
  }, {})
}

function weightChange(weightRecords = [], startDate, endDate) {
  const records = (weightRecords || [])
    .filter(record => num(record.weightKg) > 0 && inRange(record, startDate, endDate))
    .slice()
    .sort((a, b) => dateOf(a).localeCompare(dateOf(b)))
  const first = records[0]
  const latest = records[records.length - 1]
  if (!first || !latest || first._id === latest._id) {
    return {
      changeKg: 0,
      text: '体重记录不足，暂不判断体重变化。'
    }
  }
  const changeKg = r1(num(latest.weightKg) - num(first.weightKg))
  if (changeKg < 0) {
    return {
      changeKg,
      text: `过去7天下降${Math.abs(changeKg).toFixed(1)}kg`
    }
  }
  if (changeKg > 0) {
    return {
      changeKg,
      text: `过去7天上升${changeKg.toFixed(1)}kg`
    }
  }
  return {
    changeKg,
    text: '过去7天体重基本稳定'
  }
}

function buildWeeklyInsight(options = {}) {
  const todayKey = options.todayKey || formatDateKey()
  const startDate = addDays(todayKey, -6)
  const dateKeys = recentDateKeys(7, todayKey)
  const meals = (options.mealRecords || []).filter(meal => inRange(meal, startDate, todayKey))
  const grouped = groupMealsByDate(meals)
  const activeDays = dateKeys.filter(date => (grouped[date] || []).length > 0).length
  const totals = sumMealsNutrition(meals)
  const avgCalories = activeDays ? round(totals.kcal / activeDays) : 0
  const avgProtein = activeDays ? r1(totals.protein / activeDays) : 0
  const goal = options.goal || {}
  const calorieTarget = round(goal.dailyCalories || 1800)
  const proteinTarget = round(goal.proteinGoal || 90)
  const calorieCompletionRate = calorieTarget ? Math.min(140, round((avgCalories / calorieTarget) * 100)) : 0
  const proteinCompletionRate = proteinTarget ? Math.min(140, round((avgProtein / proteinTarget) * 100)) : 0
  const completionRate = activeDays
    ? Math.round(((activeDays / 7) * 100 + Math.min(100, proteinCompletionRate)) / 2)
    : 0
  const weight = weightChange(options.weightRecords || [], startDate, todayKey)
  const summary = activeDays
    ? `${weight.text}，蛋白质完成${proteinCompletionRate}%，${proteinCompletionRate >= 80 ? '建议继续保持。' : '建议优先补足蛋白质。'}`
    : '过去7天饮食记录不足，先从每日记录一餐开始。'

  return {
    startDate,
    endDate: todayKey,
    activeDays,
    averageCalories: avgCalories,
    averageProtein: avgProtein,
    weightChangeKg: weight.changeKg,
    weightChangeText: weight.text,
    calorieCompletionRate,
    proteinCompletionRate,
    completionRate,
    summary
  }
}

function buildEmptyWeeklyInsight() {
  return {
    startDate: '',
    endDate: '',
    activeDays: 0,
    averageCalories: 0,
    averageProtein: 0,
    weightChangeKg: 0,
    weightChangeText: '体重记录不足，暂不判断体重变化。',
    calorieCompletionRate: 0,
    proteinCompletionRate: 0,
    completionRate: 0,
    summary: '过去7天饮食记录不足，先从每日记录一餐开始。'
  }
}

module.exports = {
  buildEmptyWeeklyInsight,
  buildWeeklyInsight
}
