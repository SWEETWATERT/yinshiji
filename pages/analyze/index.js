const { calculateHealthScore } = require('../../utils/nutrition')

function _r1(n) { return Math.round(n * 10) / 10 }

function _calcTotals(foods) {
  return foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + f.kcal,
      proteinG: _r1(acc.proteinG + f.proteinG),
      carbsG: _r1(acc.carbsG + f.carbsG),
      fatG: _r1(acc.fatG + f.fatG),
      fiberG: _r1(acc.fiberG + f.fiberG)
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  )
}

function recalcFoodWeight(food, newWeightG) {
  const ratio = newWeightG / 100
  return {
    ...food,
    weightG: newWeightG,
    kcal: Math.round(food._kcalPer100g * ratio),
    proteinG: _r1(food._proteinPer100g * ratio),
    carbsG: _r1(food._carbsPer100g * ratio),
    fatG: _r1(food._fatPer100g * ratio),
    fiberG: _r1(food._fiberPer100g * ratio),
    weightConfidence: 'user_confirmed',
    needUserConfirm: false,
    estimateNote: '已手动调整份量'
  }
}

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
    const imageFileID = decodeURIComponent(query.imageFileID || query.imagePath || query.imageUrl || '')
    const mealType = query.mealType || 'lunch'
    const note = decodeURIComponent(query.note || '')
    this.setData({ imageUrl: imageFileID, mealType, note })
    this._doAnalyze(imageFileID, mealType, note)
  },

  _doAnalyze(imageFileID, mealType, note) {
    this.setData({ loading: true })
    wx.cloud.callFunction({
      name: 'analyzeMeal',
      data: { imageFileID, mealType, note }
    })
      .then(res => {
        const result = res.result
        this.setData({
          loading: false,
          analysisId: result.analysisId,
          imageUrl: result.imageUrl || imageFileID,
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

  deleteFood(e) {
    const uid = e.currentTarget.dataset.uid
    const detectedFoods = this.data.detectedFoods.filter(f => f.uid !== uid)
    this.setData({ detectedFoods, total: _calcTotals(detectedFoods) })
  },

  adjustWeight(e) {
    const { uid, delta } = e.currentTarget.dataset
    const detectedFoods = this.data.detectedFoods.map(f => {
      if (f.uid !== uid) return f
      const newW = Math.max(10, f.weightG + Number(delta))
      return recalcFoodWeight(f, newW)
    })
    this.setData({ detectedFoods, total: _calcTotals(detectedFoods) })
  },

  openSearch() {
    this.setData({ showSearch: true, searchKeyword: '', searchResults: [] })
  },

  closeSearch() {
    this.setData({ showSearch: false })
  },

  onSearchInput(e) {
    const kw = e.detail.value
    if (!kw.trim()) {
      this.setData({ searchKeyword: kw, searchResults: [] })
      return
    }
    this.setData({ searchKeyword: kw })
    const db = wx.cloud.database()
    db.collection('food_items')
      .where({ nameCn: db.RegExp({ regexp: kw, options: 'i' }) })
      .limit(10)
      .get()
      .then(res => {
        if (this.data.searchKeyword === kw) {
          this.setData({ searchResults: res.data })
        }
      })
  },

  addFoodFromSearch(e) {
    const foodId = e.currentTarget.dataset.id
    const food = this.data.searchResults.find(f => f.foodId === foodId)
    if (!food) return

    const weightG = food.defaultWeightG || 100
    const ratio = weightG / 100
    const uid = food.foodId + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
    const newItem = {
      uid,
      foodId: food.foodId,
      nameCn: food.nameCn,
      icon: food.icon || '🍽️',
      weightG,
      kcal: Math.round(food.kcalPer100g * ratio),
      proteinG: _r1(food.proteinPer100g * ratio),
      carbsG: _r1(food.carbsPer100g * ratio),
      fatG: _r1(food.fatPer100g * ratio),
      fiberG: _r1(food.fiberPer100g * ratio),
      confidence: 1,
      confidenceLabel: '手动添加',
      weightConfidence: 'user_confirmed',
      needUserConfirm: false,
      source: 'manual_search',
      estimateNote: '用户手动添加，份量可继续调整。',
      _kcalPer100g: food.kcalPer100g,
      _proteinPer100g: food.proteinPer100g,
      _carbsPer100g: food.carbsPer100g,
      _fatPer100g: food.fatPer100g,
      _fiberPer100g: food.fiberPer100g
    }
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

  confirmSave() {
    const { detectedFoods, total, mealType, imageUrl, note, aiAdvice, analysisId } = this.data
    if (!detectedFoods.length) {
      wx.showToast({ title: '请先添加食物', icon: 'none' })
      return
    }

    const now = new Date()
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    wx.cloud.callFunction({
      name: 'saveMealRecord',
      data: {
        mealType,
        date,
        time,
        imageFileID: imageUrl,
        note,
        foods: detectedFoods.map(f => ({
          id: f.uid,
          foodId: f.foodId,
          name: f.nameCn,
          weight: f.weightG,
          kcal: f.kcal,
          protein: f.proteinG,
          carbs: f.carbsG,
          fat: f.fatG,
          fiber: f.fiberG,
          confidence: f.confidence,
          confidenceLabel: f.confidenceLabel,
          weightConfidence: f.weightConfidence,
          source: f.source,
          estimateNote: f.estimateNote
        })),
        totalNutrition: {
          kcal: total.kcal,
          protein: total.proteinG,
          carbs: total.carbsG,
          fat: total.fatG,
          fiber: total.fiberG
        },
        healthScore: calculateHealthScore(total),
        suggestion: aiAdvice,
        analysisId,
        analysisVersion: 'nutrition_estimate_v1',
        uncertainty: {
          foodRecognition: detectedFoods.some(f => f.source === 'keyword_match') ? 'keyword_estimated' : 'manual',
          weightRecognition: detectedFoods.some(f => f.weightConfidence !== 'user_confirmed') ? 'user_confirm_required' : 'user_confirmed',
          note: '营养数据为估算值，食物和份量以用户确认后的记录为准。'
        }
      }
    })
      .then(() => {
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/home/index' }), 500)
      })
      .catch(() => {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
  },

  goBack() {
    wx.navigateBack()
  }
})
