const {
  buildSuggestion,
  calculateFoodNutrition,
  calculateHealthScore,
  calculateTotals
} = require('../../utils/nutrition')
const { mockAnalyzeMealImage } = require('../../mock/mockAnalyzeMealImage')
const { formatDate, formatTime, saveMeal } = require('../../utils/storage')

Page({
  data: {
    imagePath: '',
    mealType: 'lunch',
    note: '',
    foods: [],
    totalNutrition: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    healthScore: 88,
    suggestion: ''
  },

  onLoad(query) {
    const imagePath = decodeURIComponent(query.imagePath || '')
    const mealType = query.mealType || 'lunch'
    const note = decodeURIComponent(query.note || '')
    const result = mockAnalyzeMealImage({ imagePath, mealType })
    this.setData({ ...result, note })
  },

  adjustWeight(event) {
    const id = event.currentTarget.dataset.id
    const delta = Number(event.currentTarget.dataset.delta)
    const foods = this.data.foods.map((food) => {
      if (food.id !== id) return food
      return calculateFoodNutrition({
        ...food,
        weight: Math.max(10, Number(food.weight) + delta)
      })
    })
    const totalNutrition = calculateTotals(foods)
    this.setData({
      foods,
      totalNutrition,
      healthScore: calculateHealthScore(totalNutrition),
      suggestion: buildSuggestion(totalNutrition)
    })
  },

  saveMeal() {
    const meal = {
      id: `meal-${Date.now()}`,
      mealType: this.data.mealType,
      date: formatDate(),
      time: formatTime(),
      imageUrl: this.data.imagePath,
      note: this.data.note,
      foods: this.data.foods,
      totalNutrition: this.data.totalNutrition,
      healthScore: this.data.healthScore,
      suggestion: this.data.suggestion
    }
    saveMeal(meal)
    wx.showToast({ title: '已保存' })
    setTimeout(() => wx.switchTab({ url: '/pages/home/index' }), 450)
  },

  goBack() {
    wx.navigateBack()
  }
})
