const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20

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

function displayValue(value, unit) {
  if (value === undefined || value === null || value === '') return '--'
  return unit ? `${value}${unit}` : String(value)
}

function normalizeGender(value) {
  if (value === 'male' || value === '男') return '男'
  if (value === 'female' || value === '女') return '女'
  return value || '未设置'
}

function normalizeUser(user) {
  const source = user || {}
  const openid = source._openid || source.openid || ''

  return {
    id: source._id || openid || source.nickName || 'unknown',
    nickName: source.nickName || source.nickname || source.name || '未填写昵称',
    gender: normalizeGender(source.gender),
    heightCm: displayValue(source.heightCm, 'cm'),
    weightKg: displayValue(source.weightKg, 'kg'),
    bmi: displayValue(source.bmi),
    profileCompleted: source.profileCompleted === true,
    profileCompletedText: source.profileCompleted === true ? '已完成' : '未完成',
    calorieTarget: displayValue(source.calorieTarget, 'kcal'),
    createdAt: formatDate(source.createdAt),
    lastLoginAt: formatDate(source.lastLoginAt),
    maskedOpenid: maskOpenid(openid)
  }
}

function pickUsers(result) {
  return result.users || result.list || result.items || result.records || result.data || []
}

Page({
  data: {
    title: '用户管理',
    desc: '查看 users 集合里的真实用户资料，只读展示，不做编辑操作。',
    loading: false,
    error: '',
    users: [],
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  },

  onLoad() {
    this.loadUsers()
  },

  loadUsers() {
    const { page, pageSize } = this.data
    this.setData({ loading: true, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'listUsers',
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

        const rawUsers = pickUsers(result)
        const users = Array.isArray(rawUsers) ? rawUsers.map(normalizeUser) : []

        this.setData({
          users,
          total: Number(result.total || users.length || 0),
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
          error: '用户列表加载失败，请稍后重试。'
        })
      })
  },

  refreshUsers() {
    this.loadUsers()
  },

  setNoPermission() {
    this.setData({
      loading: false,
      users: [],
      total: 0,
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
