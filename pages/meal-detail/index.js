function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function normalizeMealType(mealType) {
  const map = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
    drink: '饮品',
    早餐: '早餐',
    午餐: '午餐',
    晚餐: '晚餐',
    加餐: '加餐',
    饮品: '饮品'
  }
  return map[mealType] || mealType || '餐食'
}

function normalizeTotal(meal) {
  const total = meal.totalNutrition || meal.total || {}
  return {
    kcal: Math.round(num(total.kcal || meal.kcal)),
    protein: r1(total.protein || total.proteinG),
    carbs: r1(total.carbs || total.carbsG),
    fat: r1(total.fat || total.fatG),
    fiber: r1(total.fiber || total.fiberG)
  }
}

function normalizeFoods(meal) {
  const foods = meal.confirmedFoods || meal.foods || meal.detectedFoods || []
  return foods.map((food, index) => ({
    id: food.id || food.uid || food.foodId || `${meal._id || 'meal'}_${index}`,
    icon: food.icon || '🍽️',
    name: food.nameCn || food.name || food.foodName || food.title || `食物${index + 1}`,
    weight: Math.round(num(food.weightG || food.weight || food.amount || food.estimatedWeightG)),
    kcal: Math.round(num(food.kcal)),
    protein: r1(food.protein || food.proteinG),
    carbs: r1(food.carbs || food.carbsG),
    fat: r1(food.fat || food.fatG),
    fiber: r1(food.fiber || food.fiberG),
    source: food.recognitionSource || food.source || '',
    matchedKeyword: food.matchedKeyword || '',
    foodId: food.foodId || ''
  }))
}

function recognitionText(meal) {
  if (meal.recognitionSource === 'vision_placeholder') return '图片占位识别'
  if (meal.recognitionSource === 'keyword_fallback') return '关键词 / 食物库估算'
  if (meal.recognitionSource === 'manual_input') return '手动记录'
  return meal.recognitionSource || (meal.analysisId ? 'AI估算' : '手动记录')
}

function normalizeMeal(meal) {
  if (!meal) return null
  const foods = normalizeFoods(meal)
  return {
    id: meal._id || meal.id || '',
    mealName: normalizeMealType(meal.mealType),
    mealType: meal.mealType || '',
    date: meal.date || '',
    time: meal.time || '',
    imageUrl: meal.imageFileID || meal.imageUrl || '',
    note: meal.note || '',
    foods,
    hasFoods: foods.length > 0,
    total: normalizeTotal(meal),
    suggestion: meal.suggestion || meal.aiAdvice || '',
    healthScore: Math.round(num(meal.healthScore)),
    recognitionText: recognitionText(meal),
    recognitionSource: meal.recognitionSource || '',
    modelProvider: meal.modelProvider || '',
    modelVersion: meal.modelVersion || meal.analysisVersion || '',
    confidencePercent: Math.round(num(meal.confidence) * 100),
    needReview: Boolean(meal.needReview),
    candidatesCount: Array.isArray(meal.candidates) ? meal.candidates.length : 0,
    createdAt: meal.createdAt || '',
    updatedAt: meal.updatedAt || ''
  }
}

Page({
  data: {
    id: '',
    date: '',
    loading: true,
    hasLoaded: false,
    errorMessage: '',
    meal: null
  },

  onLoad(query) {
    const id = decodeURIComponent(query.id || '')
    const date = decodeURIComponent(query.date || '')
    this.setData({ id, date }, () => this.loadMeal())
  },

  onShow() {
    if (this.data.hasLoaded && this.data.id && this.data.date) {
      this.loadMeal()
    }
  },

  loadMeal() {
    const { id, date } = this.data
    if (!id || !date) {
      this.setData({
        loading: false,
        hasLoaded: true,
        errorMessage: '缺少餐食记录参数，请从日记页重新进入。'
      })
      return
    }

    this.setData({ loading: true, errorMessage: '' })
    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: { date }
    })
      .then(res => {
        const records = (res.result && res.result.records) || []
        const meal = records.find(item => (item._id || item.id) === id)
        if (!meal) {
          this.setData({
            loading: false,
            hasLoaded: true,
            meal: null,
            errorMessage: '没有找到这条餐食记录，可能已被删除或日期不匹配。'
          })
          return
        }
        this.setData({ loading: false, hasLoaded: true, meal: normalizeMeal(meal) })
      })
      .catch(() => {
        this.setData({
          loading: false,
          hasLoaded: true,
          errorMessage: '餐食详情读取失败，请稍后重试。'
        })
      })
  },

  retry() {
    this.loadMeal()
  },

  editMeal() {
    const { id, date } = this.data
    if (!id || !date) return
    wx.navigateTo({
      url: `/pages/analyze/index?mode=edit&recordId=${encodeURIComponent(id)}&date=${encodeURIComponent(date)}`
    })
  },

  deleteMeal() {
    const { id } = this.data
    if (!id) return

    wx.showModal({
      title: '删除这餐？',
      content: '删除后首页和日记统计会同步更新，此操作不能撤回。',
      confirmText: '删除',
      confirmColor: '#d85b73',
      success: (modalRes) => {
        if (!modalRes.confirm) return
        wx.showLoading({ title: '正在删除' })
        wx.cloud.callFunction({
          name: 'deleteMealRecord',
          data: { recordId: id }
        })
          .then(() => {
            wx.hideLoading()
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 500)
          })
          .catch(() => {
            wx.hideLoading()
            wx.showToast({ title: '删除失败，请重试', icon: 'none' })
          })
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})
