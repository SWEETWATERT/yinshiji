const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

const STATUS_FILTERS = [
  { label: '全部', value: '' },
  { label: '待复核', value: 'pending' },
  { label: '已处理', value: 'resolved' },
  { label: '已拒绝', value: 'rejected' },
  { label: '已取消', value: 'cancelled' }
]

const STATUS_TEXT = {
  pending: '待复核',
  resolved: '已处理',
  rejected: '已拒绝',
  cancelled: '已取消',
  ignored: '已忽略'
}

const MEAL_TYPE_TEXT = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
  drink: '饮品'
}

const REASON_TEXT = {
  estimated_result_needs_confirmation: '估算结果需人工确认',
  image_unclear: '图片不清晰',
  food_wrong: '食物识别可能错误',
  nutrition_wrong: '营养估算可能错误',
  portion_wrong: '份量可能不准确'
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

function getImageUrl(task) {
  return task.imageUrl || task.imageFileID || task.imagePath || ''
}

function getFoods(task) {
  if (Array.isArray(task.detectedFoods)) return task.detectedFoods
  if (task.aiResult && Array.isArray(task.aiResult.detectedFoods)) return task.aiResult.detectedFoods
  if (task.aiResult && Array.isArray(task.aiResult.foods)) return task.aiResult.foods
  if (Array.isArray(task.foods)) return task.foods
  return []
}

function getFoodSummary(task) {
  const foods = getFoods(task)
  if (foods.length) {
    return foods
      .map(food => food.name || food.nameCn || food.foodName || food.displayName)
      .filter(Boolean)
      .slice(0, 4)
      .join('、') || '待确认食物'
  }
  if (task.aiResult && task.aiResult.summary) return task.aiResult.summary
  return task.note || '暂无识别摘要'
}

function getTotalKcal(task) {
  const total = task.total || task.totalNutrition || (task.aiResult && (task.aiResult.total || task.aiResult.totalNutrition)) || {}
  return displayNumber(total.kcal || task.kcal, 'kcal')
}

function getConfidence(task) {
  if (task.confidenceLabel) return task.confidenceLabel
  if (task.confidence !== undefined && task.confidence !== null) return String(task.confidence)

  const foods = getFoods(task)
  const values = foods
    .map(food => Number(food.confidence || 0))
    .filter(value => value > 0)
  if (!values.length) return '未标记'

  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  return `${Math.round(avg * 100)}%`
}

function normalizeTask(task) {
  const source = task || {}
  const status = source.status || 'pending'
  const imageUrl = getImageUrl(source)

  return {
    id: source._id || source.id || `${source._openid || ''}-${source.createdAt || ''}`,
    status,
    statusText: STATUS_TEXT[status] || status || '未标记',
    statusClass: `status-${status || 'unknown'}`,
    mealTypeText: MEAL_TYPE_TEXT[source.mealType] || source.mealType || '未分类',
    reasonText: REASON_TEXT[source.reason] || source.reason || '待人工确认',
    confidenceText: getConfidence(source),
    maskedOpenid: maskOpenid(source._openid || source.openid),
    createdAt: formatDate(source.createdAt),
    updatedAt: formatDate(source.updatedAt),
    imageUrl,
    hasImage: Boolean(imageUrl),
    foodSummary: getFoodSummary(source),
    kcalText: getTotalKcal(source),
    canReview: status === 'pending',
    handledText: status === 'cancelled' ? '关联餐食已删除，任务已自动取消' : ''
  }
}

function pickTasks(result) {
  return result.tasks || result.records || result.list || result.items || result.data || []
}

Page({
  data: {
    title: 'AI复核任务',
    desc: '查看 AI 餐食识别后需要人工复核的任务列表。',
    filters: STATUS_FILTERS,
    currentStatus: '',
    currentStatusText: '全部',
    loading: false,
    error: '',
    tasks: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    reviewingTaskId: ''
  },

  onLoad() {
    this.loadTasks()
  },

  loadTasks() {
    const { page, pageSize, currentStatus } = this.data
    const data = {
      action: 'listReviewTasks',
      page,
      pageSize
    }
    if (currentStatus) data.status = currentStatus

    this.setData({ loading: true, error: '' })

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

        const rawTasks = pickTasks(result)
        const tasks = Array.isArray(rawTasks) ? rawTasks.map(normalizeTask) : []

        this.setData({
          tasks,
          total: Number(result.total || tasks.length || 0),
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
          error: '复核任务加载失败，请稍后重试。'
        })
      })
  },

  changeStatus(event) {
    const status = event.currentTarget.dataset.status || ''
    const current = STATUS_FILTERS.find(item => item.value === status) || STATUS_FILTERS[0]
    this.setData({
      currentStatus: status,
      currentStatusText: current.label,
      page: DEFAULT_PAGE
    })
    this.loadTasks()
  },

  refreshTasks() {
    this.loadTasks()
  },

  approveTask(event) {
    const taskId = event.currentTarget.dataset.id
    this.updateTaskStatus(taskId, 'resolved')
  },

  rejectTask(event) {
    const taskId = event.currentTarget.dataset.id
    wx.showModal({
      title: '确认拒绝',
      content: '确认将这条复核任务标记为已拒绝吗？',
      confirmText: '拒绝',
      confirmColor: '#D94B73',
      success: res => {
        if (res.confirm) {
          this.updateTaskStatus(taskId, 'rejected')
        }
      }
    })
  },

  updateTaskStatus(taskId, status) {
    if (!taskId || this.data.reviewingTaskId) return

    const adminNote = status === 'resolved' ? '管理员通过复核' : '管理员拒绝复核'
    this.setData({ reviewingTaskId: taskId, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'updateReviewTask',
        taskId,
        status,
        adminNote
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        wx.showToast({
          title: status === 'resolved' ? '已通过' : '已拒绝',
          icon: 'success'
        })

        this.setData({ reviewingTaskId: '' })
        this.loadTasks()
      })
      .catch(err => {
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          reviewingTaskId: '',
          error: '复核任务处理失败，请稍后重试。'
        })
      })
  },

  setNoPermission() {
    this.setData({
      loading: false,
      tasks: [],
      total: 0,
      reviewingTaskId: '',
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
