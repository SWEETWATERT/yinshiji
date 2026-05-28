const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

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
  if (!Number.isFinite(num)) return unit ? `0${unit}` : '0'
  const fixed = Math.round(num * 10) / 10
  return unit ? `${fixed}${unit}` : String(fixed)
}

function getStatusText(food) {
  const status = String(food.status || '').trim()
  if (status) return status
  if (food.enabled === false || food.verified === false) return '停用'
  return '启用'
}

function normalizeFood(food) {
  const source = food || {}

  return {
    id: source._id || source.foodId || source.nameCn || source.name || 'unknown',
    icon: source.icon || '🍽️',
    name: source.nameCn || source.name || source.foodName || '未命名食物',
    category: source.category || '未分类',
    kcalPer100g: displayNumber(source.kcalPer100g || source.kcal || source.calories, 'kcal'),
    proteinPer100g: displayNumber(source.proteinPer100g || source.protein, 'g'),
    carbsPer100g: displayNumber(source.carbsPer100g || source.carbs, 'g'),
    fatPer100g: displayNumber(source.fatPer100g || source.fat, 'g'),
    statusText: getStatusText(source),
    updatedAt: formatDate(source.updatedAt || source.createdAt)
  }
}

function pickFoods(result) {
  return result.foods || result.records || result.list || result.items || result.data || []
}

Page({
  data: {
    title: '食物库',
    desc: '查看 food_items 集合里的食物营养数据，只读展示，不做编辑操作。',
    loading: false,
    error: '',
    foods: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  },

  onLoad() {
    this.loadFoods()
  },

  loadFoods() {
    const { page, pageSize } = this.data
    this.setData({ loading: true, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'listFoodItems',
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

        const rawFoods = pickFoods(result)
        const foods = Array.isArray(rawFoods) ? rawFoods.map(normalizeFood) : []

        this.setData({
          foods,
          total: Number(result.total || foods.length || 0),
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
          error: '食物库加载失败，请稍后重试。'
        })
      })
  },

  refreshFoods() {
    this.loadFoods()
  },

  setNoPermission() {
    this.setData({
      loading: false,
      foods: [],
      total: 0,
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
