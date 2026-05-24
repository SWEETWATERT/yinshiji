const { calculateHealthScore, calculateTotals } = require('../../utils/nutrition')
const { formatDate, getMealsByDate, getUserProfile } = require('../../utils/storage')

const MEAL_META = [
  { type: 'breakfast', name: '早餐', image: '🥣', tone: 'pink', mockKcal: 412 },
  { type: 'lunch',     name: '午餐', image: '🥗', tone: 'mint', mockKcal: 568 },
  { type: 'dinner',    name: '晚餐', image: '🍲', tone: 'purple', mockKcal: 0 },
  { type: 'snack',     name: '加餐', image: '🫐', tone: 'gold', mockKcal: 156 }
]

const MOCK = {
  kcal: 1622, protein: 78, carbs: 192, fat: 52,
  score: 92, remaining: 178,
  caloriePercent: 90, proteinPercent: 87, carbsPercent: 77, fatPercent: 80
}

Page({
  data: {
    user: {},
    todayText: '',
    target: 1800,
    healthScore: MOCK.score,
    hasMeals: false,
    remainingCalories: MOCK.remaining,
    totals: { kcal: MOCK.kcal, protein: MOCK.protein, carbs: MOCK.carbs, fat: MOCK.fat },
    caloriePercent: MOCK.caloriePercent,
    proteinPercent: MOCK.proteinPercent,
    carbsPercent: MOCK.carbsPercent,
    fatPercent: MOCK.fatPercent,
    mealCards: MEAL_META.map(m => ({
      ...m, recorded: m.mockKcal > 0, kcal: m.mockKcal
    }))
  },

  onShow() {
    this.loadToday()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  loadToday() {
    const user = getUserProfile() || getApp().globalData.user || {}
    const target = user.calorieTarget || 1800
    const date = formatDate()
    const meals = getMealsByDate(date)
    const hasMeals = meals.length > 0

    const foods = meals.flatMap((meal) => meal.foods || [])
    const totals = hasMeals ? calculateTotals(foods) : { kcal: MOCK.kcal, protein: MOCK.protein, carbs: MOCK.carbs, fat: MOCK.fat }
    const score = hasMeals ? calculateHealthScore(totals) : MOCK.score
    const remaining = hasMeals ? Math.max(0, target - totals.kcal) : MOCK.remaining
    const calPct = hasMeals ? Math.min(100, Math.round((totals.kcal / target) * 100)) : MOCK.caloriePercent
    const protPct = hasMeals ? Math.min(100, Math.round((totals.protein / (user.proteinTarget || 90)) * 100)) : MOCK.proteinPercent
    const carbPct = hasMeals ? Math.min(100, Math.round((totals.carbs / 250) * 100)) : MOCK.carbsPercent
    const fatPct  = hasMeals ? Math.min(100, Math.round((totals.fat / 65) * 100)) : MOCK.fatPercent

    const mealCards = hasMeals
      ? MEAL_META.map((meta) => {
          const meal = meals.find((item) => item.mealType === meta.type)
          return { ...meta, recorded: Boolean(meal), kcal: meal ? meal.totalNutrition.kcal : 0 }
        })
      : MEAL_META.map(m => ({ ...m, recorded: m.mockKcal > 0, kcal: m.mockKcal }))

    this.setData({
      user, target, todayText: date, totals, hasMeals,
      healthScore: score, remainingCalories: remaining,
      caloriePercent: calPct, proteinPercent: protPct,
      carbsPercent: carbPct, fatPercent: fatPct, mealCards
    })
  },

  goRecord() {
    wx.switchTab({ url: '/pages/record/index' })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  }
})
