const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

const STATUS_FILTERS = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'open' },
  { label: '处理中', value: 'processing' },
  { label: '已处理', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]

const TYPE_TEXT = {
  general: '普通反馈',
  recognition_wrong: '识别错误',
  nutrition_wrong: '营养错误',
  weight_wrong: '份量错误',
  image_unclear: '图片不清晰',
  bug: '问题反馈',
  suggestion: '建议'
}

const STATUS_TEXT = {
  open: '待处理',
  processing: '处理中',
  closed: '已关闭',
  resolved: '已处理'
}

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

function maskId(value) {
  const id = String(value || '').trim()
  if (!id) return '--'
  if (id.length <= 12) return id
  return `${id.slice(0, 6)}...${id.slice(-4)}`
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

function pickContent(item) {
  return item.content || item.message || item.text || item.feedback || '未填写反馈内容'
}

function pickContact(item) {
  return item.contact || item.phone || item.email || (item.payload && (item.payload.contact || item.payload.phone || item.payload.email)) || '--'
}

function displayNumber(value, unit) {
  const num = Number(value || 0)
  if (!Number.isFinite(num) || num <= 0) return ''
  const fixed = Math.round(num * 10) / 10
  return unit ? `${fixed}${unit}` : String(fixed)
}

function buildMealContext(source) {
  const payload = source.payload || {}
  const total = payload.total || source.total || {}
  const foods = Array.isArray(payload.foods)
    ? payload.foods
    : Array.isArray(source.foods)
      ? source.foods
      : []

  const foodSummary = foods
    .map(food => {
      const name = food.nameCn || food.name || food.foodName || food.displayName
      const weight = displayNumber(food.weightG || food.estimatedWeightG || food.amount, 'g')
      return name ? `${name}${weight ? ` ${weight}` : ''}` : ''
    })
    .filter(Boolean)
    .slice(0, 4)
    .join('、')

  const contextItems = []
  const mealType = payload.mealType || source.mealType
  const mealDate = payload.date || source.date
  const mealTime = payload.time || source.time
  const kcal = displayNumber(total.kcal || payload.kcal || source.kcal, 'kcal')
  const confidence = payload.confidencePercent || source.confidencePercent || source.confidence
  const recognitionSource = payload.recognitionSource || source.recognitionSource

  if (mealType) contextItems.push({ label: '餐次', value: MEAL_TYPE_TEXT[mealType] || mealType })
  if (mealDate || mealTime) contextItems.push({ label: '记录时间', value: [mealDate, mealTime].filter(Boolean).join(' ') })
  if (kcal) contextItems.push({ label: '热量', value: kcal })
  if (recognitionSource) contextItems.push({ label: '识别来源', value: recognitionSource })
  if (confidence !== undefined && confidence !== null && confidence !== '') {
    contextItems.push({ label: '置信度', value: String(confidence).includes('%') ? String(confidence) : `${confidence}%` })
  }

  return {
    mealRecordIdText: maskId(source.mealRecordId),
    analysisIdText: maskId(source.analysisId),
    hasMealLink: Boolean(source.mealRecordId || source.analysisId || source.imageFileID || contextItems.length || foodSummary),
    imageText: source.imageFileID ? '有图' : '无图',
    foodSummary: foodSummary || '暂无食物明细',
    contextItems
  }
}

function normalizeFeedback(item) {
  const source = item || {}
  const type = source.type || source.category || 'general'
  const status = source.status || 'open'
  const mealContext = buildMealContext(source)

  return {
    id: source._id || source.id || `${source._openid || ''}-${source.createdAt || ''}`,
    content: pickContent(source),
    status,
    typeText: TYPE_TEXT[type] || type || '未分类',
    statusText: STATUS_TEXT[status] || status || '未标记',
    contact: pickContact(source),
    maskedOpenid: maskOpenid(source._openid || source.openid),
    createdAt: formatDate(source.createdAt),
    updatedAt: formatDate(source.updatedAt),
    mealContext,
    canMarkProcessing: status === 'open',
    canResolve: status === 'open' || status === 'processing',
    canClose: status !== 'closed'
  }
}

function pickFeedback(result) {
  return result.feedback || result.records || result.list || result.items || result.data || []
}

Page({
  data: {
    title: '用户反馈',
    desc: '查看用户提交的识别错误、营养估算和产品反馈。',
    filters: STATUS_FILTERS,
    currentStatus: '',
    currentStatusText: '全部',
    loading: false,
    error: '',
    feedback: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    updatingFeedbackId: ''
  },

  onLoad() {
    this.loadFeedback()
  },

  loadFeedback() {
    const { page, pageSize, currentStatus } = this.data
    const data = {
      action: 'listFeedback',
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

        const rawFeedback = pickFeedback(result)
        const feedback = Array.isArray(rawFeedback) ? rawFeedback.map(normalizeFeedback) : []

        this.setData({
          feedback,
          total: Number(result.total || feedback.length || 0),
          page: Number(result.page || page),
          pageSize: Number(result.pageSize || pageSize),
          totalPages: Math.max(1, Math.ceil(Number(result.total || feedback.length || 0) / Number(result.pageSize || pageSize || DEFAULT_PAGE_SIZE))),
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
          error: '用户反馈加载失败，请稍后重试。'
        })
      })
  },

  refreshFeedback() {
    this.loadFeedback()
  },

  changeStatus(event) {
    const status = event.currentTarget.dataset.status || ''
    const current = STATUS_FILTERS.find(item => item.value === status) || STATUS_FILTERS[0]
    this.setData({
      currentStatus: status,
      currentStatusText: current.label,
      page: DEFAULT_PAGE
    })
    this.loadFeedback()
  },

  prevPage() {
    if (this.data.loading || this.data.page <= 1) return
    this.setData({ page: this.data.page - 1 })
    this.loadFeedback()
  },

  nextPage() {
    if (this.data.loading || this.data.page >= this.data.totalPages) return
    this.setData({ page: this.data.page + 1 })
    this.loadFeedback()
  },

  markProcessing(event) {
    const feedbackId = event.currentTarget.dataset.id
    this.updateFeedbackStatus(feedbackId, 'processing')
  },

  resolveFeedback(event) {
    const feedbackId = event.currentTarget.dataset.id
    this.updateFeedbackStatus(feedbackId, 'resolved')
  },

  closeFeedback(event) {
    const feedbackId = event.currentTarget.dataset.id
    wx.showModal({
      title: '确认关闭',
      content: '确认关闭这条用户反馈吗？',
      confirmText: '关闭',
      confirmColor: '#D94B73',
      success: res => {
        if (res.confirm) {
          this.updateFeedbackStatus(feedbackId, 'closed')
        }
      }
    })
  },

  updateFeedbackStatus(feedbackId, status) {
    if (!feedbackId || this.data.updatingFeedbackId) return

    const statusNote = {
      processing: '管理员标记为处理中',
      resolved: '管理员标记为已处理',
      closed: '管理员关闭反馈'
    }

    this.setData({ updatingFeedbackId: feedbackId, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'updateFeedbackStatus',
        feedbackId,
        status,
        adminNote: statusNote[status] || '管理员更新反馈状态'
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        wx.showToast({
          title: STATUS_TEXT[status] || '已更新',
          icon: 'success'
        })

        this.setData({ updatingFeedbackId: '' })
        this.loadFeedback()
      })
      .catch(err => {
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          updatingFeedbackId: '',
          error: '反馈状态更新失败，请稍后重试。'
        })
      })
  },

  setNoPermission() {
    this.setData({
      loading: false,
      feedback: [],
      total: 0,
      totalPages: 1,
      updatingFeedbackId: '',
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
