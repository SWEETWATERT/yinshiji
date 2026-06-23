const MEAL_META = [
  { type: 'breakfast', name: '早餐', icon: '🥣', tone: 'pink' },
  { type: 'lunch',     name: '午餐', icon: '🥗', tone: 'mint' },
  { type: 'dinner',    name: '晚餐', icon: '🍲', tone: 'purple' },
  { type: 'snack',     name: '加餐', icon: '🫐', tone: 'gold' }
]

function formatDate(date) {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDates() {
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date()
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - 3 + index)
    const isToday = formatDate(date) === formatDate(today)
    return {
      date: formatDate(date),
      day: date.getDate(),
      week: isToday ? '今天' : `周${weekMap[date.getDay()]}`
    }
  })
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

function getMealKcal(meal) {
  return Number((meal.totalNutrition && meal.totalNutrition.kcal) || (meal.total && meal.total.kcal) || meal.kcal || 0)
}

function getMealImage(meal) {
  return meal.imageFileID || meal.imageUrl || ''
}

function r1(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : 0
}

function getMealNutrition(meal) {
  const total = meal.totalNutrition || meal.total || {}
  return {
    kcal: Math.round(Number(total.kcal || meal.kcal || 0)),
    protein: r1(total.protein || total.proteinG),
    carbs: r1(total.carbs || total.carbsG),
    fat: r1(total.fat || total.fatG),
    fiber: r1(total.fiber || total.fiberG)
  }
}

function getFoods(meal) {
  const foods = meal.confirmedFoods || meal.foods || meal.detectedFoods || []
  return foods.map((food, index) => {
    const name = food.nameCn || food.name || food.foodName || food.title || `食物${index + 1}`
    const weight = Number(food.weightG || food.weight || food.amount || food.estimatedWeightG || 0)
    return {
      id: food.id || food.uid || food.foodId || `${meal._id || 'meal'}_${index}`,
      name,
      weight: Math.round(weight),
      kcal: Math.round(Number(food.kcal || 0)),
      source: food.recognitionSource || food.source || '',
      matchedKeyword: food.matchedKeyword || ''
    }
  })
}

function getRecognitionText(meal) {
  if (meal.recognitionSource === 'vision_placeholder') return '图片占位识别'
  if (meal.recognitionSource === 'keyword_fallback') return '关键词/食物库估算'
  if (meal.recognitionSource) return meal.recognitionSource
  return meal.analysisId ? 'AI估算' : '手动记录'
}

function buildDisplayMeals(meals) {
  return meals.map((meal, index) => {
    const type = normalizeMealType(meal.mealType)
    const nutrition = getMealNutrition(meal)
    const foods = getFoods(meal)
    return {
      id: meal._id || meal.id || `${meal.mealType || 'meal'}_${index}`,
      mealType: type,
      mealName: (MEAL_META.find(item => item.type === type) || {}).name || meal.mealType || '餐食',
      time: meal.time || '',
      imageUrl: getMealImage(meal),
      nutrition,
      foods,
      hasFoods: foods.length > 0,
      recognitionText: getRecognitionText(meal),
      confidencePercent: Math.round(Number(meal.confidence || 0) * 100),
      needReview: Boolean(meal.needReview),
      suggestion: meal.suggestion || ''
    }
  })
}

Page({
  data: {
    dates: [],
    selectedDate: '',
    selectedMood: '开心',
    moods: ['开心', '一般', '疲惫', '满足'],
    states: ['轻盈', '有饱腹感', '不困', '想散步'],
    loading: false,
    errorMessage: '',
    meals: [],
    displayMeals: [],
    mealCards: MEAL_META.map(m => ({
      ...m, recorded: false, kcal: 0, imageUrl: ''
    })),
    mealTypeText: {
      breakfast: '早餐', lunch: '午餐', dinner: '晚餐',
      snack: '加餐', drink: '饮品'
    }
  },

  onShow() {
    const app = getApp()
    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      const dates = buildDates()
      const selectedDate = formatDate()
      this.setData({ dates, selectedDate }, () => this.loadMeals())
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  selectDate(event) {
    this.setData({ selectedDate: event.currentTarget.dataset.date }, () => this.loadMeals())
  },

  selectMood(event) {
    this.setData({ selectedMood: event.currentTarget.dataset.value })
  },

  loadMeals() {
    const date = this.data.selectedDate
    this.setData({ loading: true, errorMessage: '' })
    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: { date }
    })
      .then(res => {
        const result = res.result || {}
        const meals = result.records || []
        const mealCards = MEAL_META.map(meta => {
          const meal = meals.find(item => normalizeMealType(item.mealType) === meta.type)
          return {
            ...meta,
            recorded: Boolean(meal),
            kcal: meal ? getMealKcal(meal) : 0,
            imageUrl: meal ? getMealImage(meal) : ''
          }
        })
        this.setData({ meals, displayMeals: buildDisplayMeals(meals), mealCards, loading: false })
      })
      .catch(() => {
        this.setData({
          loading: false,
          errorMessage: '日记读取失败，请稍后重试',
          meals: [],
          displayMeals: [],
          mealCards: MEAL_META.map(m => ({
            ...m, recorded: false, kcal: 0, imageUrl: ''
          }))
        })
      })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  },

  goRecord() {
    wx.switchTab({ url: '/pages/record/index' })
  }
})
