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
  if (status === 'disabled') return '停用'
  if (status === 'enabled') return '启用'
  if (status) return status
  if (food.enabled === false || food.verified === false) return '停用'
  return '启用'
}

function isFoodEnabled(food) {
  return !(food.enabled === false || food.verified === false || food.status === 'disabled')
}

function normalizeFood(food) {
  const source = food || {}

  return {
    id: source._id || source.foodId || source.nameCn || source.name || 'unknown',
    foodId: source.foodId || '',
    icon: source.icon || '🍽️',
    name: source.nameCn || source.name || source.foodName || '未命名食物',
    category: source.category || '未分类',
    kcalValue: Number(source.kcalPer100g || source.kcal || source.calories || 0),
    proteinValue: Number(source.proteinPer100g || source.protein || 0),
    carbsValue: Number(source.carbsPer100g || source.carbs || 0),
    fatValue: Number(source.fatPer100g || source.fat || 0),
    fiberValue: Number(source.fiberPer100g || source.fiber || 0),
    kcalPer100g: displayNumber(source.kcalPer100g || source.kcal || source.calories, 'kcal'),
    proteinPer100g: displayNumber(source.proteinPer100g || source.protein, 'g'),
    carbsPer100g: displayNumber(source.carbsPer100g || source.carbs, 'g'),
    fatPer100g: displayNumber(source.fatPer100g || source.fat, 'g'),
    fiberPer100g: displayNumber(source.fiberPer100g || source.fiber, 'g'),
    enabled: isFoodEnabled(source),
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
    total: 0,
    totalPages: 1,
    keyword: '',
    searchValue: '',
    showForm: false,
    formMode: 'create',
    editingFoodId: '',
    saving: false,
    updatingFoodId: '',
    form: {
      name: '',
      foodId: '',
      category: '',
      kcalPer100g: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      enabled: true
    }
  },

  onLoad() {
    this.loadFoods()
  },

  loadFoods() {
    const { page, pageSize, keyword } = this.data
    this.setData({ loading: true, error: '' })

    const data = {
      action: 'listFoodItems',
      page,
      pageSize
    }
    if (keyword) data.keyword = keyword

    wx.cloud.callFunction({
      name: 'adminApi',
      data
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
          totalPages: this.getTotalPages(Number(result.total || foods.length || 0), Number(result.pageSize || pageSize)),
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

  getTotalPages(total, pageSize) {
    const size = Math.max(1, Number(pageSize || DEFAULT_PAGE_SIZE))
    return Math.max(1, Math.ceil(Number(total || 0) / size))
  },

  onSearchInput(event) {
    this.setData({
      searchValue: event.detail.value
    })
  },

  searchFoods() {
    this.setData({
      keyword: String(this.data.searchValue || '').trim(),
      page: DEFAULT_PAGE
    })
    this.loadFoods()
  },

  clearSearch() {
    this.setData({
      keyword: '',
      searchValue: '',
      page: DEFAULT_PAGE
    })
    this.loadFoods()
  },

  prevPage() {
    if (this.data.loading || this.data.page <= 1) return
    this.setData({
      page: this.data.page - 1
    })
    this.loadFoods()
  },

  nextPage() {
    if (this.data.loading || this.data.page >= this.data.totalPages) return
    this.setData({
      page: this.data.page + 1
    })
    this.loadFoods()
  },

  showCreateForm() {
    this.setData({
      showForm: true,
      formMode: 'create',
      editingFoodId: '',
      form: this.emptyForm()
    })
  },

  editFood(event) {
    const foodId = event.currentTarget.dataset.id
    const food = this.data.foods.find(item => item.id === foodId)
    if (!food) return

    this.setData({
      showForm: true,
      formMode: 'edit',
      editingFoodId: food.id,
      form: {
        name: food.name,
        foodId: food.foodId,
        category: food.category,
        kcalPer100g: String(food.kcalValue || ''),
        protein: String(food.proteinValue || ''),
        carbs: String(food.carbsValue || ''),
        fat: String(food.fatValue || ''),
        fiber: String(food.fiberValue || ''),
        enabled: food.enabled
      }
    })
  },

  hideForm() {
    this.setData({
      showForm: false,
      formMode: 'create',
      editingFoodId: '',
      saving: false,
      form: this.emptyForm()
    })
  },

  emptyForm() {
    return {
      name: '',
      foodId: '',
      category: '',
      kcalPer100g: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      enabled: true
    }
  },

  onFormInput(event) {
    const field = event.currentTarget.dataset.field
    if (!field) return
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  onEnabledChange(event) {
    this.setData({
      'form.enabled': event.detail.value
    })
  },

  submitFoodForm() {
    if (this.data.saving) return
    const form = this.data.form
    if (!String(form.name || '').trim()) {
      wx.showToast({ title: '请填写食物名称', icon: 'none' })
      return
    }

    const food = {
      name: String(form.name || '').trim(),
      foodId: String(form.foodId || '').trim() || undefined,
      category: String(form.category || '未分类').trim(),
      kcalPer100g: Number(form.kcalPer100g || 0),
      protein: Number(form.protein || 0),
      carbs: Number(form.carbs || 0),
      fat: Number(form.fat || 0),
      fiber: Number(form.fiber || 0),
      enabled: form.enabled !== false,
      status: form.enabled === false ? 'disabled' : 'enabled'
    }

    this.setData({ saving: true, error: '' })
    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: this.data.formMode === 'edit' ? 'updateFoodItem' : 'createFoodItem',
        foodItemId: this.data.formMode === 'edit' ? this.data.editingFoodId : '',
        data: food
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        wx.showToast({
          title: '已保存',
          icon: 'success'
        })

        const isCreate = this.data.formMode === 'create'
        this.hideForm()
        if (isCreate) {
          this.setData({ page: DEFAULT_PAGE })
        }
        this.loadFoods()
      })
      .catch(err => {
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          saving: false,
          error: '食物保存失败，请检查字段后重试。'
        })
      })
  },

  toggleFoodStatus(event) {
    const foodId = event.currentTarget.dataset.id
    const enabledValue = event.currentTarget.dataset.enabled
    const enabled = enabledValue === true || enabledValue === 'true'
    if (!foodId || this.data.updatingFoodId) return

    this.setData({ updatingFoodId: foodId, error: '' })
    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'setFoodItemStatus',
        foodItemId: foodId,
        enabled: !enabled,
        status: enabled ? 'disabled' : 'enabled'
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        wx.showToast({
          title: enabled ? '已停用' : '已启用',
          icon: 'success'
        })

        this.setData({ updatingFoodId: '' })
        this.loadFoods()
      })
      .catch(err => {
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          updatingFoodId: '',
          error: '食物状态更新失败，请稍后重试。'
        })
      })
  },

  setNoPermission() {
    this.setData({
      loading: false,
      foods: [],
      total: 0,
      totalPages: 1,
      saving: false,
      updatingFoodId: '',
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
