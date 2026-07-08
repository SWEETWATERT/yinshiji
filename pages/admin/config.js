const DEFAULT_CONFIG = {
  aiRecognitionEnabled: true,
  keywordFallbackEnabled: true,
  visionPlaceholderEnabled: true,
  mealRecordEnabled: true,
  foodSearchEnabled: true,
  weeklyReportEnabled: true,
  reviewEnabled: true,
  feedbackEnabled: true,
  adminDashboardEnabled: true,
  demoMode: false,
  maintenanceMode: false,
  calorieTargetDefault: 1800,
  proteinTargetDefault: 90,
  carbsTargetDefault: 220,
  fatTargetDefault: 55,
  fiberTargetDefault: 25,
  waterTargetDefault: 2000,
  reviewConfidenceThreshold: 0.6,
  lowConfidenceThreshold: 0.45,
  maxUploadImageMB: 8,
  maxMealFoods: 12,
  version: '1.0.8',
  announcement: '欢迎使用饮食记后台，当前云开发服务已恢复。',
  supportContact: '',
  dataSourceNote: '常见食物营养为估算值，正式上线前建议用权威食物成分表或品牌营养标签复核。',
  cloudRecovery: true,
  status: 'ready'
}

const CONFIG_SECTIONS = [
  {
    title: '核心功能',
    desc: '控制小程序主链路和后台入口是否开放。',
    fields: [
      { key: 'aiRecognitionEnabled', label: 'AI识别', type: 'switch' },
      { key: 'keywordFallbackEnabled', label: '关键词识别兜底', type: 'switch' },
      { key: 'visionPlaceholderEnabled', label: '图片占位识别提示', type: 'switch' },
      { key: 'mealRecordEnabled', label: '餐食记录', type: 'switch' },
      { key: 'foodSearchEnabled', label: '食物库搜索', type: 'switch' },
      { key: 'weeklyReportEnabled', label: '周报', type: 'switch' },
      { key: 'reviewEnabled', label: '人工复核', type: 'switch' },
      { key: 'feedbackEnabled', label: '用户反馈', type: 'switch' },
      { key: 'adminDashboardEnabled', label: '后台看板', type: 'switch' }
    ]
  },
  {
    title: '默认营养目标',
    desc: '新用户或资料缺失时使用的默认目标。',
    fields: [
      { key: 'calorieTargetDefault', label: '每日热量', type: 'number', unit: 'kcal' },
      { key: 'proteinTargetDefault', label: '蛋白质', type: 'number', unit: 'g' },
      { key: 'carbsTargetDefault', label: '碳水', type: 'number', unit: 'g' },
      { key: 'fatTargetDefault', label: '脂肪', type: 'number', unit: 'g' },
      { key: 'fiberTargetDefault', label: '膳食纤维', type: 'number', unit: 'g' },
      { key: 'waterTargetDefault', label: '饮水', type: 'number', unit: 'ml' }
    ]
  },
  {
    title: '识别与复核规则',
    desc: '控制低置信度结果、上传限制和单餐食物数量。',
    fields: [
      { key: 'reviewConfidenceThreshold', label: '复核阈值', type: 'number' },
      { key: 'lowConfidenceThreshold', label: '低置信度阈值', type: 'number' },
      { key: 'maxUploadImageMB', label: '图片上限', type: 'number', unit: 'MB' },
      { key: 'maxMealFoods', label: '单餐最多食物', type: 'number', unit: '项' }
    ]
  },
  {
    title: '运营状态',
    desc: '演示模式、维护状态和后台展示文案。',
    fields: [
      { key: 'demoMode', label: '演示模式', type: 'switch' },
      { key: 'maintenanceMode', label: '维护模式', type: 'switch' },
      { key: 'version', label: '版本号', type: 'text' },
      { key: 'status', label: '服务状态', type: 'text' },
      { key: 'announcement', label: '公告', type: 'textarea' },
      { key: 'supportContact', label: '客服联系', type: 'text' },
      { key: 'dataSourceNote', label: '数据说明', type: 'textarea' }
    ]
  }
]

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

function fieldCount() {
  return CONFIG_SECTIONS.reduce((sum, section) => sum + section.fields.length, 0)
}

function fieldMap() {
  return CONFIG_SECTIONS.reduce((map, section) => {
    section.fields.forEach(field => {
      map[field.key] = field
    })
    return map
  }, {})
}

const FIELDS_BY_KEY = fieldMap()

function configValue(config) {
  if (!config) return {}
  if (config.value && typeof config.value === 'object') return config.value
  return config
}

function mergeDefaults(value) {
  return {
    ...DEFAULT_CONFIG,
    ...(value || {})
  }
}

function displayFormValue(value, field) {
  if (field.type === 'switch') return value === true
  if (field.type === 'number') return value === undefined || value === null ? '' : String(value)
  return value === undefined || value === null ? '' : String(value)
}

function buildForm(value) {
  const merged = mergeDefaults(value)
  return Object.keys(DEFAULT_CONFIG).reduce((form, key) => {
    const field = FIELDS_BY_KEY[key] || { type: typeof DEFAULT_CONFIG[key] === 'boolean' ? 'switch' : 'text' }
    form[key] = displayFormValue(merged[key], field)
    return form
  }, {})
}

function buildSections(form) {
  return CONFIG_SECTIONS.map(section => ({
    ...section,
    fields: section.fields.map(field => ({
      ...field,
      value: form[field.key],
      inputType: field.type === 'number' ? 'digit' : 'text',
      isSwitch: field.type === 'switch',
      isTextarea: field.type === 'textarea',
      isInput: field.type !== 'switch' && field.type !== 'textarea'
    }))
  }))
}

function numberValue(value, fallback) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function buildConfigValue(form) {
  return Object.keys(DEFAULT_CONFIG).reduce((value, key) => {
    const field = FIELDS_BY_KEY[key]
    if (field && field.type === 'switch') {
      value[key] = form[key] === true
    } else if (field && field.type === 'number') {
      value[key] = numberValue(form[key], DEFAULT_CONFIG[key])
    } else if (typeof DEFAULT_CONFIG[key] === 'boolean') {
      value[key] = form[key] === true
    } else {
      value[key] = String(form[key] === undefined ? DEFAULT_CONFIG[key] : form[key]).trim()
    }
    return value
  }, {})
}

function buildRawPreview(value) {
  try {
    const text = JSON.stringify({ key: 'default', value }, null, 2)
    return text.length > 1600 ? `${text.slice(0, 1600)}...` : text
  } catch (err) {
    return '{}'
  }
}

Page({
  data: {
    title: '配置管理',
    desc: '维护 app_config.default 的功能开关、营养目标、复核规则和运营文案。',
    loading: false,
    saving: false,
    error: '',
    config: {},
    records: [],
    form: buildForm(DEFAULT_CONFIG),
    sections: buildSections(buildForm(DEFAULT_CONFIG)),
    rawPreview: buildRawPreview(DEFAULT_CONFIG),
    updatedAt: '--',
    configFieldCount: fieldCount()
  },

  onLoad() {
    this.loadConfig()
  },

  loadConfig() {
    this.setData({ loading: true, error: '' })

    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'getAppConfig',
        key: 'default'
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        const records = Array.isArray(result.records) ? result.records : []
        const config = result.config && Object.keys(result.config).length
          ? result.config
          : {}
        const value = mergeDefaults(configValue(config))
        const form = buildForm(value)

        this.setData({
          config,
          records,
          form,
          sections: buildSections(form),
          rawPreview: buildRawPreview(buildConfigValue(form)),
          updatedAt: formatDate(config.updatedAt || config.createdAt),
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
          error: '系统配置加载失败，请稍后重试。'
        })
      })
  },

  refreshConfig() {
    this.loadConfig()
  },

  onFieldInput(event) {
    const key = event.currentTarget.dataset.key
    if (!key) return
    const form = {
      ...this.data.form,
      [key]: event.detail.value
    }
    this.updateForm(form)
  },

  onSwitchChange(event) {
    const key = event.currentTarget.dataset.key
    if (!key) return
    const form = {
      ...this.data.form,
      [key]: event.detail.value === true
    }
    this.updateForm(form)
  },

  updateForm(form) {
    this.setData({
      form,
      sections: buildSections(form),
      rawPreview: buildRawPreview(buildConfigValue(form))
    })
  },

  resetDefaultConfig() {
    const form = buildForm(DEFAULT_CONFIG)
    this.updateForm(form)
  },

  saveConfig() {
    if (this.data.saving) return
    const value = buildConfigValue(this.data.form)

    this.setData({ saving: true, error: '' })
    wx.cloud.callFunction({
      name: 'adminApi',
      data: {
        action: 'setAppConfig',
        key: 'default',
        value
      }
    })
      .then(res => {
        const result = res.result || {}
        if (result.isAdmin === false || result.code === 'NO_ADMIN_PERMISSION' || result.error === 'NO_ADMIN_PERMISSION') {
          this.setNoPermission()
          return
        }

        wx.showToast({ title: '配置已保存', icon: 'success' })
        this.setData({ saving: false })
        this.loadConfig()
      })
      .catch(err => {
        if (this.isNoPermissionError(err)) {
          this.setNoPermission()
          return
        }

        this.setData({
          saving: false,
          error: '系统配置保存失败，请稍后重试。'
        })
      })
  },

  setNoPermission() {
    const form = buildForm(DEFAULT_CONFIG)
    this.setData({
      loading: false,
      saving: false,
      config: {},
      records: [],
      form,
      sections: buildSections(form),
      rawPreview: buildRawPreview(DEFAULT_CONFIG),
      updatedAt: '--',
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
