const { calculateHealthScore, calculateTotals } = require('../../utils/nutrition')

const MEAL_META = [
  { type: 'breakfast', name: '早餐', image: '🥣', tone: 'pink' },
  { type: 'lunch',     name: '午餐', image: '🥗', tone: 'mint' },
  { type: 'dinner',    name: '晚餐', image: '🍲', tone: 'purple' },
  { type: 'snack',     name: '加餐', image: '🫐', tone: 'gold' }
]

const EMPTY_TOTALS = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

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

function safeNum(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function r1(value) {
  return Math.round(safeNum(value) * 10) / 10
}

function sumFoodsNutrition(foods) {
  return (foods || []).reduce((acc, food) => ({
    kcal: acc.kcal + safeNum(food.kcal),
    protein: r1(acc.protein + safeNum(food.protein || food.proteinG)),
    carbs: r1(acc.carbs + safeNum(food.carbs || food.carbsG)),
    fat: r1(acc.fat + safeNum(food.fat || food.fatG)),
    fiber: r1(acc.fiber + safeNum(food.fiber || food.fiberG))
  }), { ...EMPTY_TOTALS })
}

function getMealNutrition(meal) {
  const total = meal.totalNutrition || meal.total || {}
  const fromTotal = {
    kcal: safeNum(total.kcal || meal.kcal),
    protein: safeNum(total.protein || total.proteinG),
    carbs: safeNum(total.carbs || total.carbsG),
    fat: safeNum(total.fat || total.fatG),
    fiber: safeNum(total.fiber || total.fiberG)
  }
  if (fromTotal.kcal || fromTotal.protein || fromTotal.carbs || fromTotal.fat || fromTotal.fiber) {
    return fromTotal
  }
  return sumFoodsNutrition(meal.confirmedFoods || meal.foods || meal.detectedFoods || [])
}

function sumMealNutrition(meals) {
  const totals = meals.reduce((acc, meal) => {
    const current = getMealNutrition(meal)
    return {
      kcal: acc.kcal + current.kcal,
      protein: r1(acc.protein + current.protein),
      carbs: r1(acc.carbs + current.carbs),
      fat: r1(acc.fat + current.fat),
      fiber: r1(acc.fiber + current.fiber)
    }
  }, { ...EMPTY_TOTALS })
  return calculateTotals([{ ...totals }])
}

function sumMealsByType(meals, type) {
  return sumMealNutrition(meals.filter(item => normalizeMealType(item.mealType) === type))
}

function getMealImage(meal) {
  return meal.imageFileID || meal.imageUrl || ''
}

Page({
  data: {
    user: {},
    todayText: '',
    target: 1800,
    healthScore: 0,
    hasMeals: false,
    remainingCalories: 1800,
    totals: EMPTY_TOTALS,
    caloriePercent: 0,
    proteinPercent: 0,
    carbsPercent: 0,
    fatPercent: 0,
    fiberPercent: 0,
    mealCards: MEAL_META.map(m => ({
      ...m, recorded: false, kcal: 0
    }))
  },

  onShow() {
    const app = getApp()
    if (app.shouldShowSplash && app.shouldShowSplash()) {
      wx.navigateTo({ url: '/pages/splash/index' })
      return
    }

    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      this.loadToday()
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  loadToday() {
    const app = getApp()
    const user = app.globalData.user || {}
    const target = user.calorieTarget || 1800
    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    this.setData({ user, target, todayText: date })

    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: { date }
    })
      .then(res => {
        const result = res.result || {}
        const meals = result.records || []
        const hasMeals = meals.length > 0

        const totals = hasMeals ? sumMealNutrition(meals) : { ...EMPTY_TOTALS }
        const score = hasMeals ? calculateHealthScore(totals) : 0
        const remaining = Math.max(0, target - totals.kcal)
        const calPct = hasMeals ? Math.min(100, Math.round((totals.kcal / target) * 100)) : 0
        const protPct = hasMeals ? Math.min(100, Math.round((totals.protein / (user.proteinTarget || 90)) * 100)) : 0
        const carbPct = hasMeals ? Math.min(100, Math.round((totals.carbs / 250) * 100)) : 0
        const fatPct = hasMeals ? Math.min(100, Math.round((totals.fat / 65) * 100)) : 0
        const fiberPct = hasMeals ? Math.min(100, Math.round((totals.fiber / 25) * 100)) : 0

        const mealCards = MEAL_META.map(meta => {
          const typeMeals = meals.filter(item => normalizeMealType(item.mealType) === meta.type)
          const latestMeal = typeMeals[0]
          const nutrition = typeMeals.length ? sumMealsByType(meals, meta.type) : EMPTY_TOTALS
          return {
            ...meta,
            recorded: typeMeals.length > 0,
            kcal: nutrition.kcal,
            imageUrl: latestMeal ? getMealImage(latestMeal) : ''
          }
        })

        this.setData({
          totals, hasMeals,
          healthScore: score, remainingCalories: remaining,
          caloriePercent: calPct, proteinPercent: protPct,
          carbsPercent: carbPct, fatPercent: fatPct, fiberPercent: fiberPct, mealCards
        })
      })
      .catch(() => {
        this.setData({
          totals: { ...EMPTY_TOTALS },
          hasMeals: false,
          healthScore: 0,
          remainingCalories: target,
          caloriePercent: 0,
          proteinPercent: 0,
          carbsPercent: 0,
          fatPercent: 0,
          fiberPercent: 0,
          mealCards: MEAL_META.map(m => ({
            ...m, recorded: false, kcal: 0, imageUrl: ''
          }))
        })
      })
  },

  goRecord() {
    wx.switchTab({ url: '/pages/record/index' })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  }
})
