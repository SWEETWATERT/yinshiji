const { normalizeTotals } = require('./aiScoreService')

const EMPTY_TOTALS = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function formatDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDateKey(dateKey) {
  const parts = String(dateKey || '').split('-').map(part => Number(part))
  if (parts.length !== 3 || parts.some(part => !Number.isFinite(part))) return new Date()
  return new Date(parts[0], parts[1] - 1, parts[2])
}

function addDays(dateKey, delta) {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + delta)
  return formatDateKey(date)
}

function recentDateKeys(days = 7, todayKey = formatDateKey()) {
  const keys = []
  for (let i = days - 1; i >= 0; i -= 1) {
    keys.push(addDays(todayKey, -i))
  }
  return keys
}

function getMealDate(meal = {}) {
  if (meal.date) return String(meal.date).slice(0, 10)
  if (meal.createdAt) return formatDateKey(meal.createdAt.$date || meal.createdAt)
  return ''
}

function normalizeMealNutrition(meal = {}) {
  const total = meal.totalNutrition || meal.total || {}
  const fromTotal = {
    kcal: num(total.kcal || meal.kcal),
    protein: num(total.protein || total.proteinG),
    carbs: num(total.carbs || total.carbsG),
    fat: num(total.fat || total.fatG),
    fiber: num(total.fiber || total.fiberG)
  }
  if (fromTotal.kcal || fromTotal.protein || fromTotal.carbs || fromTotal.fat || fromTotal.fiber) {
    return fromTotal
  }

  return (meal.confirmedFoods || meal.foods || meal.detectedFoods || []).reduce((acc, food) => ({
    kcal: acc.kcal + num(food.kcal),
    protein: r1(acc.protein + num(food.protein || food.proteinG)),
    carbs: r1(acc.carbs + num(food.carbs || food.carbsG)),
    fat: r1(acc.fat + num(food.fat || food.fatG)),
    fiber: r1(acc.fiber + num(food.fiber || food.fiberG))
  }), { ...EMPTY_TOTALS })
}

function sumMealsNutrition(meals = []) {
  return normalizeTotals((meals || []).reduce((acc, meal) => {
    const current = normalizeMealNutrition(meal)
    return {
      kcal: acc.kcal + current.kcal,
      protein: r1(acc.protein + current.protein),
      carbs: r1(acc.carbs + current.carbs),
      fat: r1(acc.fat + current.fat),
      fiber: r1(acc.fiber + current.fiber)
    }
  }, { ...EMPTY_TOTALS }))
}

function groupMealsByDate(meals = []) {
  return (meals || []).reduce((acc, meal) => {
    const date = getMealDate(meal)
    if (!date) return acc
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {})
}

function uniqueRecordDates(meals = []) {
  const seen = {}
  ;(meals || []).forEach(meal => {
    const date = getMealDate(meal)
    if (date) seen[date] = true
  })
  return Object.keys(seen).sort()
}

function calculateStreak(meals = [], todayKey = formatDateKey()) {
  const dates = uniqueRecordDates(meals)
  const dateSet = dates.reduce((acc, date) => {
    acc[date] = true
    return acc
  }, {})
  const todayCheckedIn = Boolean(dateSet[todayKey])
  const yesterdayKey = addDays(todayKey, -1)
  const anchorDate = todayCheckedIn ? todayKey : yesterdayKey
  let consecutiveDays = 0
  let cursor = anchorDate

  while (dateSet[cursor]) {
    consecutiveDays += 1
    cursor = addDays(cursor, -1)
  }

  if (!todayCheckedIn && !dateSet[yesterdayKey]) {
    consecutiveDays = 0
  }

  const lastRecordDate = dates.length ? dates[dates.length - 1] : ''
  const reminderStatus = todayCheckedIn
    ? 'done'
    : (consecutiveDays > 0 ? 'pending' : 'restart')
  const reminderText = todayCheckedIn
    ? '今日已完成打卡，连续记录正在延续。'
    : (consecutiveDays > 0
      ? '今天还没记录，补记一餐即可延续连续打卡。'
      : '今天记录第一餐，重新开始连续打卡。')

  return {
    consecutiveDays,
    lastRecordDate,
    todayCheckedIn,
    reminderStatus,
    reminderText
  }
}

function buildTrend(meals = [], options = {}) {
  const days = options.days || 7
  const todayKey = options.todayKey || formatDateKey()
  const dateKeys = recentDateKeys(days, todayKey)
  const grouped = groupMealsByDate(meals)
  const rows = dateKeys.map(date => {
    const totals = sumMealsNutrition(grouped[date] || [])
    return {
      date,
      label: date.slice(5).replace('-', '/'),
      kcal: totals.kcal,
      protein: totals.protein,
      fat: totals.fat,
      hasRecord: (grouped[date] || []).length > 0
    }
  })
  const maxKcal = Math.max(1, ...rows.map(row => row.kcal))
  const maxProtein = Math.max(1, ...rows.map(row => row.protein))
  const maxFat = Math.max(1, ...rows.map(row => row.fat))
  const enrichedRows = rows.map(row => ({
    ...row,
    kcalPercent: Math.round((row.kcal / maxKcal) * 100),
    proteinPercent: Math.round((row.protein / maxProtein) * 100),
    fatPercent: Math.round((row.fat / maxFat) * 100)
  }))
  const activeDays = enrichedRows.filter(row => row.hasRecord).length
  const avgKcal = activeDays
    ? Math.round(enrichedRows.reduce((sum, row) => sum + row.kcal, 0) / activeDays)
    : 0

  return {
    days: enrichedRows,
    activeDays,
    avgKcal,
    summary: activeDays
      ? `最近7天记录了 ${activeDays} 天，记录日平均 ${avgKcal} kcal。`
      : '最近7天还没有记录，趋势会在记录后生成。'
  }
}

function normalizeMealType(mealType) {
  const typeMap = {
    breakfast: 'breakfast',
    早餐: 'breakfast',
    lunch: 'lunch',
    午餐: 'lunch',
    dinner: 'dinner',
    晚餐: 'dinner',
    snack: 'snack',
    加餐: 'snack',
    drink: 'snack',
    饮品: 'snack'
  }
  return typeMap[mealType] || mealType
}

function countMealType(meals = [], type) {
  return meals.filter(meal => normalizeMealType(meal.mealType) === type).length
}

function aiBehaviorInsight(meals = [], options = {}) {
  const todayKey = options.todayKey || formatDateKey()
  const trend = buildTrend(meals, { todayKey, days: 7 })
  const totals = sumMealsNutrition(meals)
  const activeDays = trend.activeDays
  const avgProtein = activeDays ? r1(totals.protein / activeDays) : 0
  const avgFat = activeDays ? r1(totals.fat / activeDays) : 0
  const breakfastCount = countMealType(meals, 'breakfast')
  const snackCount = countMealType(meals, 'snack') + countMealType(meals, 'drink')
  const structureProblems = []
  const behaviorPatterns = []
  const suggestions = []

  if (!activeDays) {
    return {
      structureProblems: ['最近7天暂无可分析记录'],
      behaviorPatterns: ['还没有形成稳定记录习惯'],
      suggestions: ['从今天开始记录一餐，AI会在连续记录后生成趋势判断。'],
      summary: '记录数据不足，AI行为分析等待生成。'
    }
  }

  if (avgProtein < 45) structureProblems.push('蛋白质摄入偏低')
  if (avgFat > 70) structureProblems.push('脂肪摄入偏高')
  if (trend.avgKcal > 2200) structureProblems.push('平均热量偏高')
  if (!structureProblems.length) structureProblems.push('饮食结构整体稳定')

  if (activeDays < 4) behaviorPatterns.push('记录频率还不稳定')
  else behaviorPatterns.push(`最近7天已记录 ${activeDays} 天，习惯正在形成`)
  if (breakfastCount < Math.max(2, Math.floor(activeDays * 0.4))) {
    behaviorPatterns.push('早餐记录偏少，可能存在漏记或早餐不稳定')
  }
  if (snackCount >= 4) behaviorPatterns.push('加餐或饮品记录较多，需要关注额外热量')

  if (avgProtein < 45) suggestions.push('下一阶段优先补足优质蛋白，例如鸡蛋、豆腐、鱼虾或鸡胸肉。')
  if (avgFat > 70) suggestions.push('减少油炸和重油菜，晚餐优先选择清蒸、水煮或少油烹饪。')
  if (activeDays < 4) suggestions.push('先把每日一餐记录固定下来，再逐步补齐三餐。')
  if (!suggestions.length) suggestions.push('继续保持记录节奏，下一步关注蔬菜和膳食纤维的稳定性。')

  return {
    structureProblems,
    behaviorPatterns,
    suggestions,
    summary: `AI基于最近7天记录，发现 ${structureProblems[0]}，记录习惯为：${behaviorPatterns[0]}。`
  }
}

function buildShareCard(options = {}) {
  const totals = normalizeTotals(options.totals || {})
  const aiDaily = options.aiDaily || {}
  const score = num(aiDaily.score)
  const evaluation = aiDaily.aiEvaluation || 'AI已生成今日饮食评价。'
  return {
    score,
    title: `今日AI饮食评分 ${score} 分`,
    nutritionText: `${totals.kcal} kcal · 蛋白 ${totals.protein}g · 碳水 ${totals.carbs}g · 脂肪 ${totals.fat}g`,
    evaluation,
    shareTitle: `我的今日AI饮食评分 ${score} 分：${evaluation}`,
    path: '/pages/home/index'
  }
}

module.exports = {
  addDays,
  aiBehaviorInsight,
  buildShareCard,
  buildTrend,
  calculateStreak,
  formatDateKey,
  recentDateKeys,
  sumMealsNutrition
}
