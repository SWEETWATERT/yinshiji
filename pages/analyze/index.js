const { analyzeMealImage, recalcFoodWeight, searchFoodsByKeyword, _calcTotals } = require('../../services/mealAnalysis')
const { getFoodById, buildFoodItem } = require('../../mock/foodDatabase')
const { formatDate, formatTime, saveMeal } = require('../../utils/storage')
const { calculateHealthScore } = require('../../utils/nutrition')

Page({
  data: {
    imageUrl: '',
    mealType: 'lunch',
    note: '',
    loading: true,
    analysisId: '',
    detectedFoods: [],
    total: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    warnings: [],
    aiAdvice: '',
    showSearch: false,
    searchKeyword: '',
    searchResults: []
  },

  onLoad(query) {
    const imageUrl = decodeURIComponent(query.imagePath || query.imageUrl || '')
    const mealType = query.mealType || 'lunch'
    const note = decodeURIComponent(query.note || '')
    this.setData({ imageUrl, mealType, note })
    this._doAnalyze(imageUrl, mealType, note)
  },

  _doAnalyze(imageUrl, mealType, note) {
    this.setData({ loading: true })
    analyzeMealImage({ imageUrl, mealType, note })
      .then(result => {
        this.setData({
          loading: false,
          analysisId: result.analysisId,
          imageUrl: result.imageUrl || imageUrl,
          detectedFoods: result.detectedFoods,
          total: result.total,
          warnings: result.warnings,
          aiAdvice: result.aiAdvice
        })
      })
      .catch(() => {
        this.setData({ loading: false })
        wx.showToast({ title: '分析失败，请重试', icon: 'none' })
      })
  },

  // ── 删除食物 ──────────────────────────────────
  deleteFood(e) {
    const uid = e.currentTarget.dataset.uid
    const detectedFoods = this.data.detectedFoods.filter(f => f.uid !== uid)
    this.setData({ detectedFoods, total: _calcTotals(detectedFoods) })
  },

  // ── 调整重量 ─────────────────────────────────
  adjustWeight(e) {
    const { uid, delta } = e.currentTarget.dataset
    const detectedFoods = this.data.detectedFoods.map(f => {
      if (f.uid !== uid) return f
      const newW = Math.max(10, f.weightG + Number(delta))
      return recalcFoodWeight(f, newW)
    })
    this.setData({ detectedFoods, total: _calcTotals(detectedFoods) })
  },

  // ── 搜索 + 添加食物 ───────────────────────────
  openSearch() {
    this.setData({ showSearch: true, searchKeyword: '', searchResults: [] })
  },

  closeSearch() {
    this.setData({ showSearch: false })
  },

  onSearchInput(e) {
    const kw = e.detail.value
    this.setData({
      searchKeyword: kw,
      searchResults: kw.trim() ? searchFoodsByKeyword(kw) : []
    })
  },

  addFoodFromSearch(e) {
    const foodId = e.currentTarget.dataset.id
    const food = getFoodById(foodId)
    if (!food) return
    const newItem = buildFoodItem(food, food.defaultWeightG, 1.0)
    const detectedFoods = [...this.data.detectedFoods, newItem]
    this.setData({
      detectedFoods,
      total: _calcTotals(detectedFoods),
      showSearch: false,
      searchKeyword: '',
      searchResults: []
    })
    wx.showToast({ title: `已添加 ${food.nameCn}`, icon: 'none' })
  },

  // ── 确认保存 ─────────────────────────────────
  confirmSave() {
    const { detectedFoods, total, mealType, imageUrl, note, aiAdvice } = this.data
    if (!detectedFoods.length) {
      wx.showToast({ title: '请先添加食物', icon: 'none' })
      return
    }
    const meal = {
      id: `meal_${Date.now()}`,
      mealType,
      date: formatDate(),
      time: formatTime(),
      imageUrl,
      note,
      foods: detectedFoods.map(f => ({
        id: f.uid,
        name: f.nameCn,
        weight: f.weightG,
        kcal: f.kcal,
        protein: f.proteinG,
        carbs: f.carbsG,
        fat: f.fatG,
        fiber: f.fiberG
      })),
      totalNutrition: {
        kcal: total.kcal,
        protein: total.proteinG,
        carbs: total.carbsG,
        fat: total.fatG,
        fiber: total.fiberG
      },
      healthScore: calculateHealthScore(total),
      suggestion: aiAdvice
    }
    saveMeal(meal)
    wx.showToast({ title: '已保存', icon: 'success' })
    setTimeout(() => wx.switchTab({ url: '/pages/home/index' }), 500)
  },

  goBack() {
    wx.navigateBack()
  }
})
