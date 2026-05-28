const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

const MEAL_TYPE_TEXT = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
  drink: '饮品'
}

function maskOpenid(value) {
  const openid = String(value || '').trim()
  if (!openid) return '--'
  if (openid.length <= 10) return openid
  return `${openid.slice(0, 6)}****${openid.slice(-4)}`
}

function formatDate(value) {
  if (!value) return '--'

  let date = null
  if (value instanceof Date) {
    date = value
  } else if (value.$date) {
    date = new Date(value.$date)
  } else {
    date = new Date(value)
  }

  if (!date || Number.isNaN(date.getTime())) return '--'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}`
}

function displayNumber(value, unit) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num <= 0) return unit ? `0${unit}` : '0'
  const fixed = Math.round(num * 10) / 10
  return unit ? `${fixed}${unit}` : String(fixed)
}

function getNutrition(meal, key) {
  const total = meal.totalNutrition || meal.total || meal.nutrition || {}
  return total[key] || meal[key] || 0
}

function getFoodSummary(meal) {
  const foods = Array.isArray(meal.foods) ? meal.foods : []
  if (foods.length) {
    return foods
      .map(food => food.name || food.nameCn || food.foodName || food.displayName)
      .filter(Boolean)
      .slice(0, 4)
      .join('、') || '未识别食物'
  }
  return meal.summary || meal.note || meal.aiSummary || '未识别食物'
}

function getAiStatus(meal) {
  const foods = Array.isArray(meal.foods) ? meal.foods : []
  const firstFood = foods[0] || {}
  const confidence = meal.confidence || meal.confidenceLabel || firstFood.confidenceLabel || firstFood.confidence
  const status = meal.status || meal.analysisStatus || meal.recognitionStatus || ''
  const source = meal.source || meal.analysisSource || firstFood.source || ''

  if (confidence) return `可信度 ${confidence}`
  if (status) return status
  if (source) return source
  return '未标记'
}

function hasImage(meal) {
  return Boolean(meal.imageFileID || meal.imageUrl || meal.imagePath)
}

function normalizeMeal(meal) {
  const source = meal || {}
  const mealType = source.mealType || ''
  const createdAt = source.createdAt || source.time || source.date || ''

  return {
    id: source._id || source.id || `${source._openid || ''}-${createdAt}`,
    mealTypeText: MEAL_TYPE_TEXT[mealType] || source.mealTypeText || '未分类',
    foodSummary: getFoodSummary(source),
    kcal: displayNumber(getNutrition(source, 'kcal'), 'kcal'),
    protein: displayNumber(getNutrition(source, 'protein'), 'g'),
    carbs: displayNumber(getNutrition(source, 'carbs'), 'g'),
    fat: displayNumber(getNutrition(source, 'fat'), 'g'),
    maskedOpenid: maskOpenid(source._openid || source.openid),
    createdAt: formatDate(createdAt),
    imageText: hasImage(source) ? '有图' : '无图',
    aiStatus: getAiStatus(source)
  }
}

function pickMeals(result) {
  return result.meals || result.records || result.list || result.items || result.data || []
}

Page({
  data: {
    title: '餐食记录',
    desc: '查看用户拍照、AI识别和保存的餐食记录。',
    loading: false,
    error: '',
    meals: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  },

  onLoad() {
    this.loadMeals()
  },

  loadMeals() {
    const { page, pageSize } = this.data
    this.setData({ loading: true, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'listMeals',
        page,
        pageSize
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        const rawMeals = pickMeals(result)
        const meals = Array.isArray(rawMeals) ? rawMeals.map(normalizeMeal) : []

        this.setData({
          meals,
          total: Number(result.total || meals.length || 0),
          page: Number(result.page || page),
          pageSize: Number(result.pageSize || pageSize),
          loading: false,
          error: ''
        })
      })
      .catch(err => {
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          loading: false,
          error: '餐食记录加载失败，请稍后重试。'
        })
      })
  },

  refreshMeals() {
    this.loadMeals()
  },

  setNoPermission() {
    this.setData({
      loading: false,
      meals: [],
      total: 0,
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
