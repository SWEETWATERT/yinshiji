const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    const exists = message.includes('already exist') ||
      message.includes('already exists') ||
      message.includes('collection exists') ||
      message.includes('DATABASE_COLLECTION_ALREADY_EXISTS') ||
      message.includes('-502005') ||
      message.includes('ResourceExist') ||
      message.includes('DATABASE_COLLECTION_ALREADY_EXIST') ||
      message.includes('Table exist')
    if (!exists) throw err
  }
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getDateRange(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  const dates = Array.from({ length: days }, (_, index) => {
    const d = new Date(start)
    d.setDate(start.getDate() + index)
    return formatDate(d)
  })
  return { startDate: formatDate(start), endDate: formatDate(end), dates }
}

function sumNutrition(meals, key) {
  return meals.reduce((sum, meal) => sum + Number((meal.totalNutrition || {})[key] || 0), 0)
}

function hasVegetable(meal) {
  return (meal.foods || []).some(food => {
    const name = `${food.name || ''}${food.foodId || ''}`
    return /蔬菜|青菜|西兰花|菠菜|生菜|白菜|番茄|黄瓜|胡萝卜|蘑菇|veg_|dish_stir_greens|salad/.test(name)
  })
}

function hasSugaryDrink(meal) {
  return (meal.foods || []).some(food => {
    const name = `${food.name || ''}${food.foodId || ''}`
    return /奶茶|果汁|可乐|碳酸|含糖|drk_milk_tea|drk_juice|drk_cola/.test(name)
  })
}

function isLateSnack(meal) {
  const hour = Number(String(meal.time || '').split(':')[0])
  return meal.mealType === 'snack' && hour >= 21
}

function buildSummary(avgScore, vegDays, sugaryDrinks, lateSnacks) {
  if (avgScore >= 85 && vegDays >= 5 && sugaryDrinks <= 1) {
    return '本周整体不错，蔬菜和蛋白质摄入比较稳定。继续保持记录，少量优化饮品选择即可。'
  }
  if (sugaryDrinks >= 3) {
    return '本周含糖饮品偏多，建议优先把奶茶、果汁替换成无糖茶或水，热量会更容易控制。'
  }
  if (vegDays < 4) {
    return '本周蔬菜摄入天数偏少，建议每天至少安排一份深色蔬菜，让餐盘更均衡。'
  }
  if (lateSnacks >= 2) {
    return '本周夜间加餐略多，建议把加餐提前到下午，晚间以清淡和少量为主。'
  }
  return '本周饮食记录已经有基础，建议继续补足蛋白质和蔬菜，减少高糖饮品。'
}

exports.main = async (event) => {
  await ensureCollection('meal_records')
  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = { ...rawEvent, ...rawData }
  const { OPENID: wxOpenid } = cloud.getWXContext()
  const OPENID = wxOpenid || input.openid || 'cloud_recovery_openid'
  const days = Math.min(14, Math.max(7, Number(input.days || 7)))
  const { startDate, endDate, dates } = getDateRange(days)

  const { data: meals } = await db.collection('meal_records')
    .where({
      _openid: OPENID,
      date: _.gte(startDate).and(_.lte(endDate))
    })
    .orderBy('date', 'asc')
    .limit(200)
    .get()

  const grouped = {}
  for (const meal of meals) {
    if (!grouped[meal.date]) grouped[meal.date] = []
    grouped[meal.date].push(meal)
  }

  const activeDates = Object.keys(grouped)
  const healthScores = meals.map(m => Number(m.healthScore || 0)).filter(Boolean)
  const avgScore = healthScores.length
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0

  const totalKcal = sumNutrition(meals, 'kcal')
  const totalProtein = sumNutrition(meals, 'protein')
  const totalCarbs = sumNutrition(meals, 'carbs')
  const totalFat = sumNutrition(meals, 'fat')
  const totalFiber = sumNutrition(meals, 'fiber')
  const activeDayCount = activeDates.length
  const avgCalories = activeDayCount ? Math.round(totalKcal / activeDayCount) : 0
  const avgProtein = activeDayCount ? Math.round(totalProtein / activeDayCount) : 0
  const avgCarbs = activeDayCount ? Math.round(totalCarbs / activeDayCount) : 0
  const avgFat = activeDayCount ? Math.round(totalFat / activeDayCount) : 0
  const avgFiber = activeDayCount ? Math.round(totalFiber / activeDayCount) : 0

  const proteinTargetDays = activeDates.filter(date => sumNutrition(grouped[date], 'protein') >= 90).length
  const vegDays = activeDates.filter(date => grouped[date].some(hasVegetable)).length
  const sugaryDrinks = meals.filter(hasSugaryDrink).length
  const eatingOut = meals.filter(meal => /外食|外卖|餐厅|下馆子/.test(meal.note || '')).length
  const lateSnacks = meals.filter(isLateSnack).length

  return {
    startDate,
    endDate,
    mealCount: meals.length,
    activeDays: activeDayCount,
    avgScore,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    avgFiber,
    proteinTargetDays,
    vegDays,
    sugaryDrinks,
    eatingOut,
    lateSnacks,
    trend: dates.map(date => ({
      date,
      kcal: sumNutrition(grouped[date] || [], 'kcal'),
      protein: sumNutrition(grouped[date] || [], 'protein')
    })),
    summary: buildSummary(avgScore, vegDays, sugaryDrinks, lateSnacks)
  }
}
