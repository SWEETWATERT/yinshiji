const CONFIG_FIELDS = [
  { key: 'aiRecognitionEnabled', label: 'AI识别开关', fallback: '未配置' },
  { key: 'reviewEnabled', label: '人工复核开关', fallback: '未配置' },
  { key: 'calorieTargetDefault', label: '每日热量默认目标', unit: 'kcal', fallback: '--' },
  { key: 'proteinTargetDefault', label: '蛋白质默认目标', unit: 'g', fallback: '--' },
  { key: 'version', label: '版本号', fallback: '--' }
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

function displayValue(value, field) {
  if (value === true) return '开启'
  if (value === false) return '关闭'
  if (value === undefined || value === null || value === '') return field.fallback
  return field.unit ? `${value}${field.unit}` : String(value)
}

function pickConfigValue(config, key) {
  if (!config) return undefined
  if (config[key] !== undefined) return config[key]
  const value = config.value || {}
  return value[key]
}

function buildConfigItems(config) {
  return CONFIG_FIELDS.map(field => ({
    key: field.key,
    label: field.label,
    value: displayValue(pickConfigValue(config, field.key), field)
  }))
}

function buildRawPreview(config) {
  if (!config || !Object.keys(config).length) return '{}'

  try {
    const text = JSON.stringify(config, null, 2)
    return text.length > 800 ? `${text.slice(0, 800)}...` : text
  } catch (err) {
    return '{}'
  }
}

Page({
  data: {
    title: '配置管理',
    desc: '查看 app_config 集合里的系统配置，只读展示，不做编辑保存。',
    loading: false,
    error: '',
    config: {},
    records: [],
    configItems: buildConfigItems({}),
    rawPreview: '{}',
    updatedAt: '--'
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
          : (records[0] || {})

        this.setData({
          config,
          records,
          configItems: buildConfigItems(config),
          rawPreview: buildRawPreview(config),
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

  setNoPermission() {
    this.setData({
      loading: false,
      config: {},
      records: [],
      configItems: buildConfigItems({}),
      rawPreview: '{}',
      updatedAt: '--',
      error: '无后台权限'
    })
  },

  isNoPermissionError(err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    return message.indexOf('NO_ADMIN_PERMISSION') !== -1
  }
})
