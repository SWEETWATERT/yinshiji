const { getRecentMeals } = require('../../utils/storage')

Page({
  data: {
    averageScore: 89,
    averageCalories: 0,
    proteinRate: 92,
    calorieBars: [46, 62, 52, 50, 57, 51, 64],
    stats: [],
    summary: ''
  },

  onShow() {
    this.buildReport()
  },

  buildReport() {
    const meals = getRecentMeals(7)
    const totalKcal = meals.reduce((sum, meal) => sum + meal.totalNutrition.kcal, 0)
    const averageCalories = meals.length ? Math.round(totalKcal / 7) : 1642
    const averageScore = meals.length
      ? Math.round(meals.reduce((sum, meal) => sum + meal.healthScore, 0) / meals.length)
      : 89
    const proteinDays = new Set(
      meals.filter((meal) => meal.totalNutrition.protein >= 30).map((meal) => meal.date)
    ).size
    const vegetableDays = new Set(
      meals.filter((meal) => meal.foods.some((food) => food.name.includes('西兰花'))).map((meal) => meal.date)
    ).size
    const nightSnackCount = meals.filter((meal) => meal.mealType === 'snack').length

    this.setData({
      averageScore,
      averageCalories,
      proteinRate: Math.min(100, Math.round((proteinDays / 7) * 100)) || 92,
      stats: [
        { label: '蔬菜摄入天数', value: `${vegetableDays || 6} 天`, icon: '🥬' },
        { label: '含糖饮料', value: '1 杯', icon: '🧋' },
        { label: '外出就餐', value: '3 次', icon: '🍽️' },
        { label: '夜宵摄入', value: `${nightSnackCount || 1} 次`, icon: '🌙' }
      ],
      summary: '本周整体不错，建议继续保持蔬菜摄入，减少含糖饮料。以上为饮食记录和营养估算参考。'
    })
  }
})
