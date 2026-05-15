const { calculateHealthScore, calculateTotals } = require('../../utils/nutrition')
const { formatDate, getMealsByDate, getUserProfile } = require('../../utils/storage')

const MEAL_META = [
  { type: 'breakfast', name: '早餐', image: '🥣', tone: 'pink' },
  { type: 'lunch', name: '午餐', image: '🥗', tone: 'mint' },
  { type: 'dinner', name: '晚餐', image: '🍲', tone: 'purple' },
  { type: 'snack', name: '加餐', image: '🫐', tone: 'gold' }
]

Page({
  data: {
    user: {},
    todayText: '',
    target: 1800,
    healthScore: 92,
    totals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    caloriePercent: 0,
    proteinPercent: 0,
    carbsPercent: 0,
    fatPercent: 0,
    mealCards: []
  },

  onShow() {
    this.loadToday()
  },

  loadToday() {
    const user = getUserProfile() || getApp().globalData.user || {}
    const target = user.calorieTarget || 1800
    const date = formatDate()
    const meals = getMealsByDate(date)
    const foods = meals.flatMap((meal) => meal.foods || [])
    const totals = calculateTotals(foods)
    const mealCards = MEAL_META.map((meta) => {
      const meal = meals.find((item) => item.mealType === meta.type)
      return {
        ...meta,
        recorded: Boolean(meal),
        image: meal && meal.imageUrl ? '🍽️' : meta.image,
        kcal: meal ? meal.totalNutrition.kcal : 0
      }
    })

    this.setData({
      user,
      target,
      todayText: date,
      totals,
      healthScore: meals.length ? calculateHealthScore(totals) : 92,
      caloriePercent: Math.min(100, Math.round((totals.kcal / target) * 100)),
      proteinPercent: Math.min(100, Math.round((totals.protein / (user.proteinTarget || 90)) * 100)),
      carbsPercent: Math.min(100, Math.round((totals.carbs / 250) * 100)),
      fatPercent: Math.min(100, Math.round((totals.fat / 65) * 100)),
      mealCards
    })
  },

  goRecord() {
    wx.switchTab({ url: '/pages/record/index' })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  }
})
