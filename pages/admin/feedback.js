const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

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

function pickContent(item) {
  return item.content || item.message || item.text || item.feedback || '未填写反馈内容'
}

function pickContact(item) {
  return item.contact || item.phone || item.email || (item.payload && (item.payload.contact || item.payload.phone || item.payload.email)) || '--'
}

function normalizeFeedback(item) {
  const source = item || {}
  const type = source.type || source.category || 'general'
  const status = source.status || 'open'

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
    loading: false,
    error: '',
    feedback: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    updatingFeedbackId: ''
  },

  onLoad() {
    this.loadFeedback()
  },

  loadFeedback() {
    const { page, pageSize } = this.data
    this.setData({ loading: true, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'listFeedback',
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

        const rawFeedback = pickFeedback(result)
        const feedback = Array.isArray(rawFeedback) ? rawFeedback.map(normalizeFeedback) : []

        this.setData({
          feedback,
          total: Number(result.total || feedback.length || 0),
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
          error: '用户反馈加载失败，请稍后重试。'
        })
      })
  },

  refreshFeedback() {
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
      updatingFeedbackId: '',
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
