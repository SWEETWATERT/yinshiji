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

function aliasesText(value) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, 4).join('、')
  if (typeof value === 'string') return value
  return ''
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
  const nameCn = source.nameCn || source.name || source.foodName || '未命名食物'
  const name = source.name || source.foodName || ''
  const aliases = aliasesText(source.aliases)

  return {
    id: source._id || source.foodId || source.nameCn || source.name || 'unknown',
    foodId: source.foodId || '',
    icon: source.icon || '🍽️',
    name: nameCn,
    nameCn,
    secondaryName: name && name !== nameCn ? name : '',
    aliasesText: aliases,
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
    title: '食物库管理',
    desc: '后台维护工具，仅用于管理 food_items 基础营养数据。',
    loading: false,
    loadingMore: false,
    error: '',
    foods: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasMore: false,
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

  onReachBottom() {
    this.loadNextPage(true)
  },

  loadFoods(options = {}) {
    const append = options.append === true
    const targetPage = Number(options.page || (append ? this.data.page + 1 : this.data.page) || DEFAULT_PAGE)
    const { pageSize } = this.data
    const keyword = options.keyword !== undefined ? options.keyword : this.data.keyword
    if (append && (this.data.loading || this.data.loadingMore || !this.data.hasMore)) return

    this.requestSeq = (this.requestSeq || 0) + 1
    const requestSeq = this.requestSeq

    this.setData(append
      ? { loadingMore: true, error: '' }
      : { loading: true, loadingMore: false, error: '' })

    const data = {
      action: 'listFoodItems',
      page: targetPage,
      pageSize
    }
    if (keyword) data.keyword = keyword

    wx.cloud.callFunction({
      name: 'adminApi',
      data
    })
      .then(res => {
        if (requestSeq !== this.requestSeq) return
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        const rawFoods = pickFoods(result)
        const normalizedFoods = Array.isArray(rawFoods) ? rawFoods.map(normalizeFood) : []
        const total = Number(result.total || normalizedFoods.length || 0)
        const nextPageSize = Number(result.pageSize || pageSize)
        const totalPages = this.getTotalPages(total, nextPageSize)
        const nextPage = Math.min(totalPages, Number(result.page || targetPage))
        const foods = append ? this.mergeFoods(this.data.foods, normalizedFoods) : normalizedFoods

        this.setData({
          foods,
          total,
          page: nextPage,
          pageSize: nextPageSize,
          totalPages,
          hasMore: nextPage < totalPages,
          loading: false,
          loadingMore: false,
          error: ''
        })
      })
      .catch(err => {
        if (requestSeq !== this.requestSeq) return
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          loading: false,
          loadingMore: false,
          error: '食物库加载失败，请稍后重试。'
        })
      })
  },

  refreshFoods() {
    this.setData({ page: DEFAULT_PAGE, foods: [] })
    this.loadFoods({ page: DEFAULT_PAGE })
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
    if (this.data.loading || this.data.loadingMore) return
    const keyword = String(this.data.searchValue || '').trim()
    this.setData({
      keyword,
      page: DEFAULT_PAGE,
      foods: []
    })
    this.loadFoods({ page: DEFAULT_PAGE, keyword })
  },

  clearSearch() {
    if (this.data.loading || this.data.loadingMore) return
    this.setData({
      keyword: '',
      searchValue: '',
      page: DEFAULT_PAGE,
      foods: []
    })
    this.loadFoods({ page: DEFAULT_PAGE, keyword: '' })
  },

  prevPage() {
    if (this.data.loading || this.data.page <= 1) return
    const page = this.data.page - 1
    this.setData({ page, foods: [] })
    this.loadFoods({ page })
  },

  nextPage() {
    if (this.data.loading || this.data.page >= this.data.totalPages) return
    const page = this.data.page + 1
    this.setData({ page, foods: [] })
    this.loadFoods({ page })
  },

  loadNextPage(append = false) {
    if (this.data.loading || this.data.loadingMore || this.data.page >= this.data.totalPages) return
    const page = this.data.page + 1
    if (!append) {
      this.setData({ page, foods: [] })
    }
    this.loadFoods({ page, append })
  },

  mergeFoods(currentFoods, incomingFoods) {
    const seen = {}
    const merged = []
    ;(currentFoods || []).concat(incomingFoods || []).forEach(item => {
      const id = item.id || item.foodId || item.nameCn || item.name
      if (!id || seen[id]) return
      seen[id] = true
      merged.push(item)
    })
    return merged
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
      hasMore: false,
      loadingMore: false,
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
