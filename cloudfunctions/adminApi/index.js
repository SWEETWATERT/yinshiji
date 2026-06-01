const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const MAX_PAGE_SIZE = 50
const ADMIN_ROLE_SET = ['owner', 'admin']

function pageArgs(event) {
  const page = Math.max(1, Number(event.page || 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(event.pageSize || 20)))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

function normalizeOpenid(value) {
  return String(value || '')
    .replace(/[\s\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeAdminOpenids() {
  return String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map(item => normalizeOpenid(item))
    .filter(Boolean)
}

async function isAdmin(openid) {
  const info = await getAdminInfo(openid)
  return info.isAdmin
}

async function getAdminInfo(openid) {
  const currentOpenid = normalizeOpenid(openid)

  if (!currentOpenid) {
    return {
      openid: '',
      isAdmin: false,
      roles: [],
      message: '当前账号暂无后台权限。'
    }
  }

  if (normalizeAdminOpenids().includes(currentOpenid)) {
    return {
      openid: currentOpenid,
      isAdmin: true,
      roles: ['owner'],
      message: '当前账号已通过 ADMIN_OPENIDS 白名单获得后台权限。'
    }
  }

  const adminRecord = await findAdminRecord(currentOpenid)
  if (adminRecord) {
    const adminInfo = parseAdminRecord(adminRecord)
    if (adminInfo.isAdmin) {
      return {
        openid: currentOpenid,
        isAdmin: true,
        roles: adminInfo.roles,
        message: '当前账号已通过 admin_users 集合获得后台权限。'
      }
    }
  }

  return {
    openid: currentOpenid,
    isAdmin: false,
    roles: [],
    message: '当前账号暂无后台权限。'
  }
}

async function findAdminRecord(openid) {
  const currentOpenid = normalizeOpenid(openid)
  if (!currentOpenid) return null

  try {
    const { data } = await db.collection('admin_users')
      .where({ _openid: currentOpenid })
      .limit(1)
      .get()
    if (data && data[0]) return data[0]
  } catch (err) {
    // Continue to fallback queries for manually created admin records.
  }

  try {
    const { data } = await db.collection('admin_users')
      .where({ openid: currentOpenid })
      .limit(1)
      .get()
    if (data && data[0]) return data[0]
  } catch (err) {
    // Continue to final fallback.
  }

  const { data } = await db.collection('admin_users')
    .limit(100)
    .get()

  return (data || []).find(record => {
    const recordOpenid = normalizeOpenid(record && record.openid)
    const recordUnderscoreOpenid = normalizeOpenid(record && record._openid)
    return recordOpenid === currentOpenid || recordUnderscoreOpenid === currentOpenid
  }) || null
}

function parseAdminRecord(record) {
  const status = normalizeText(record && record.status)
  const role = normalizeText(record && record.role)
  const roles = Array.isArray(record && record.roles)
    ? record.roles.map(item => normalizeText(item)).filter(Boolean)
    : []
  const activeOk = status === 'active'
  const roleOk = ADMIN_ROLE_SET.includes(role) || roles.some(item => ADMIN_ROLE_SET.includes(item))
  const normalizedRoles = roles.length ? roles : (role ? [role] : [])

  return {
    isAdmin: Boolean(record && activeOk && roleOk),
    roles: normalizedRoles
  }
}

async function requireAdmin(openid) {
  const ok = await isAdmin(openid)
  if (!ok) {
    const err = new Error('NO_ADMIN_PERMISSION')
    err.code = 'NO_ADMIN_PERMISSION'
    throw err
  }
}

async function bootstrapAdmin(event, openid) {
  const setupKey = process.env.ADMIN_SETUP_KEY
  if (!setupKey || event.setupKey !== setupKey) {
    return { ok: false, code: 'INVALID_SETUP_KEY', message: '请先在云函数环境变量配置 ADMIN_SETUP_KEY。' }
  }

  const existing = await db.collection('admin_users')
    .where({ _openid: openid })
    .limit(1)
    .get()

  if (existing.data.length) {
    await db.collection('admin_users').doc(existing.data[0]._id).update({
      data: {
        role: 'owner',
        status: 'active',
        updatedAt: new Date()
      }
    })
  } else {
    await db.collection('admin_users').add({
      data: {
        _openid: openid,
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  }

  return { ok: true, openid, role: 'owner' }
}

async function dashboard() {
  const today = new Date()
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [
    users,
    meals,
    todayMeals,
    foodItems,
    analysisLogs,
    pendingReviews,
    openFeedback
  ] = await Promise.all([
    db.collection('users').count(),
    db.collection('meal_records').count(),
    db.collection('meal_records').where({ date: todayText }).count(),
    db.collection('food_items').count(),
    db.collection('analysis_logs').count(),
    db.collection('review_tasks').where({ status: 'pending' }).count(),
    db.collection('user_feedback').where({ status: _.neq('closed') }).count()
  ])

  return {
    today: todayText,
    cards: {
      users: users.total,
      meals: meals.total,
      todayMeals: todayMeals.total,
      foodItems: foodItems.total,
      analysisLogs: analysisLogs.total,
      pendingReviews: pendingReviews.total,
      openFeedback: openFeedback.total
    }
  }
}

async function listUsers(event) {
  const { page, pageSize, skip } = pageArgs(event)
  const res = await db.collection('users')
    .orderBy('updatedAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  const count = await db.collection('users').count()
  const users = res.data || []
  return { page, pageSize, total: count.total, users, records: users }
}

async function listMeals(event) {
  const { page, pageSize, skip } = pageArgs(event)
  const where = {}
  if (event.openid) where._openid = event.openid
  if (event.date) where.date = event.date
  if (event.mealType) where.mealType = event.mealType

  let query = db.collection('meal_records').where(where)
  const res = await query.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get()
  const count = await db.collection('meal_records').where(where).count()
  const meals = res.data || []
  return { page, pageSize, total: count.total, meals, records: meals }
}

async function listFoodItems(event) {
  const { page, pageSize, skip } = pageArgs(event)
  const keyword = String(event.keyword || '').trim()
  const where = {}
  if (event.category) where.category = event.category

  let query = db.collection('food_items').where(where)
  let countQuery = db.collection('food_items').where(where)

  if (keyword) {
    const keywordRegExp = db.RegExp({
      regexp: keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      options: 'i'
    })
    const keywordWhere = _.or([
      { nameCn: keywordRegExp },
      { name: keywordRegExp },
      { foodName: keywordRegExp },
      { title: keywordRegExp },
      { category: keywordRegExp }
    ])
    query = db.collection('food_items').where(keywordWhere)
    countQuery = db.collection('food_items').where(keywordWhere)
  }

  const res = await query
    .orderBy('category', 'asc')
    .skip(skip)
    .limit(pageSize)
    .get()
  const count = await countQuery.count()
  const foods = res.data || []
  return { page, pageSize, total: count.total, foods, records: foods }
}

function sanitizeFoodItem(data) {
  const source = data || {}
  const foodName = source.nameCn || source.name || source.foodName
  const foodId = source.foodId || source.id || `food_${Date.now()}`
  const normalized = {
    foodId: String(foodId),
    nameCn: String(foodName || ''),
    name: String(foodName || ''),
    category: String(source.category || '未分类'),
    aliases: Array.isArray(source.aliases) ? source.aliases : [],
    kcalPer100g: Number(source.kcalPer100g || source.kcal || source.calories || 0),
    proteinPer100g: Number(source.proteinPer100g || source.protein || 0),
    carbsPer100g: Number(source.carbsPer100g || source.carbs || 0),
    fatPer100g: Number(source.fatPer100g || source.fat || 0),
    fiberPer100g: Number(source.fiberPer100g || source.fiber || 0),
    icon: source.icon || '🍽️',
    defaultWeightG: Number(source.defaultWeightG || 100),
    enabled: source.enabled !== false,
    verified: source.verified !== false && source.enabled !== false,
    status: source.status || (source.enabled === false ? 'disabled' : 'enabled'),
    dataSource: source.dataSource || 'admin',
    dataSourceNote: source.dataSourceNote || '后台人工维护数据。',
    updatedAt: new Date()
  }

  const required = ['foodId', 'nameCn', 'category', 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g']
  for (const key of required) {
    if (normalized[key] === undefined || normalized[key] === '' || Number.isNaN(normalized[key])) {
      const err = new Error(`MISSING_${key}`)
      err.code = 'INVALID_FOOD_ITEM'
      throw err
    }
  }
  return normalized
}

async function upsertFoodItem(event) {
  const item = sanitizeFoodItem(event.data || {})
  const existing = await db.collection('food_items')
    .where({ foodId: item.foodId })
    .limit(1)
    .get()

  if (existing.data.length) {
    await db.collection('food_items').doc(existing.data[0]._id).update({ data: item })
    return { ok: true, action: 'updated', foodId: item.foodId }
  }

  await db.collection('food_items').add({ data: { ...item, createdAt: new Date() } })
  return { ok: true, action: 'created', foodId: item.foodId }
}

async function createFoodItem(event) {
  const item = sanitizeFoodItem(event.data || event.food || {})
  await db.collection('food_items').add({ data: { ...item, createdAt: new Date() } })
  return { ok: true, action: 'created', foodId: item.foodId }
}

async function updateFoodItem(event) {
  const foodItemId = event.foodItemId || event.id
  const item = sanitizeFoodItem(event.data || event.food || {})

  if (foodItemId) {
    await db.collection('food_items').doc(foodItemId).update({ data: item })
    return { ok: true, action: 'updated', foodItemId, foodId: item.foodId }
  }

  const existing = await db.collection('food_items')
    .where({ foodId: item.foodId })
    .limit(1)
    .get()

  if (!existing.data.length) {
    const err = new Error('FOOD_ITEM_NOT_FOUND')
    err.code = 'FOOD_ITEM_NOT_FOUND'
    throw err
  }

  await db.collection('food_items').doc(existing.data[0]._id).update({ data: item })
  return { ok: true, action: 'updated', foodId: item.foodId }
}

async function setFoodItemStatus(event) {
  const foodItemId = event.foodItemId || event.id
  if (!foodItemId) {
    const err = new Error('MISSING_FOOD_ITEM_ID')
    err.code = 'MISSING_FOOD_ITEM_ID'
    throw err
  }

  const enabled = event.enabled !== false && normalizeText(event.status) !== 'disabled'
  const status = enabled ? 'enabled' : 'disabled'
  await db.collection('food_items').doc(foodItemId).update({
    data: {
      enabled,
      verified: enabled,
      status,
      updatedAt: new Date()
    }
  })

  return { ok: true, foodItemId, enabled, status }
}

async function toggleFoodItemStatus(event) {
  return setFoodItemStatus(event)
}

async function listReviewTasks(event) {
  const { page, pageSize, skip } = pageArgs(event)
  const where = {}
  if (event.status) where.status = event.status
  const res = await db.collection('review_tasks')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  const count = await db.collection('review_tasks').where(where).count()
  const tasks = res.data || []
  return { page, pageSize, total: count.total, tasks, records: tasks }
}

function normalizeReviewStatus(status) {
  const value = normalizeText(status)
  if (value === 'resolved' || value === 'rejected') return value

  const err = new Error('INVALID_REVIEW_STATUS')
  err.code = 'INVALID_REVIEW_STATUS'
  throw err
}

async function updateReviewTask(event, openid) {
  const taskId = event.taskId || event.reviewTaskId || event.id
  if (!taskId) {
    const err = new Error('MISSING_TASK_ID')
    err.code = 'MISSING_TASK_ID'
    throw err
  }

  const status = normalizeReviewStatus(event.status || 'resolved')
  const now = new Date()
  const data = {
    status,
    reviewedAt: now,
    reviewerOpenid: openid,
    adminNote: event.adminNote || '',
    updatedAt: now
  }

  if (event.resolutionNote !== undefined) data.resolutionNote = event.resolutionNote || ''
  if (Array.isArray(event.correctedFoods)) data.correctedFoods = event.correctedFoods

  await db.collection('review_tasks').doc(taskId).update({ data })
  return { ok: true, taskId, status }
}

async function resolveReviewTask(event, openid) {
  return updateReviewTask({ ...event, status: event.status || 'resolved' }, openid)
}

async function rejectReviewTask(event, openid) {
  return updateReviewTask({ ...event, status: 'rejected' }, openid)
}

async function listFeedback(event) {
  const { page, pageSize, skip } = pageArgs(event)
  const where = {}
  if (event.status) where.status = event.status
  if (event.type) where.type = event.type
  const res = await db.collection('user_feedback')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()
  const count = await db.collection('user_feedback').where(where).count()
  const feedback = res.data || []
  return { page, pageSize, total: count.total, feedback, records: feedback }
}

async function updateFeedbackStatus(event, openid) {
  const feedbackId = event.feedbackId || event.id
  if (!feedbackId) {
    const err = new Error('MISSING_FEEDBACK_ID')
    err.code = 'MISSING_FEEDBACK_ID'
    throw err
  }

  const status = normalizeText(event.status || 'closed')
  const allowedStatuses = ['open', 'processing', 'resolved', 'closed']
  if (!allowedStatuses.includes(status)) {
    const err = new Error('INVALID_FEEDBACK_STATUS')
    err.code = 'INVALID_FEEDBACK_STATUS'
    throw err
  }

  const now = new Date()
  const data = {
    status,
    adminOpenid: openid,
    adminNote: event.adminNote || '',
    updatedAt: now
  }

  if (status === 'resolved' || status === 'closed') {
    data.handledAt = now
  }

  await db.collection('user_feedback').doc(feedbackId).update({
    data: {
      ...data
    }
  })
  return { ok: true, feedbackId, status }
}

async function getAppConfig(event) {
  const key = event.key || 'default'
  const res = await db.collection('app_config').where({ key }).limit(1).get()
  const config = res.data[0] || null
  return { key, config: config || {}, records: config ? [config] : [] }
}

async function listAppConfig() {
  const res = await db.collection('app_config')
    .orderBy('updatedAt', 'desc')
    .limit(50)
    .get()
  const records = res.data || []
  return { config: records[0] || {}, records }
}

async function setAppConfig(event, openid) {
  const key = event.key || 'default'
  const value = event.value || {}
  const existing = await db.collection('app_config').where({ key }).limit(1).get()
  const data = { key, value, updatedBy: openid, updatedAt: new Date() }
  if (existing.data.length) {
    await db.collection('app_config').doc(existing.data[0]._id).update({ data })
  } else {
    await db.collection('app_config').add({ data: { ...data, createdAt: new Date() } })
  }
  return { ok: true, key }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const action = event.action || 'dashboard'

  if (action === 'whoami') {
    return getAdminInfo(OPENID)
  }

  if (action === 'bootstrapAdmin') {
    return bootstrapAdmin(event, OPENID)
  }

  await requireAdmin(OPENID)

  const actions = {
    dashboard,
    listUsers,
    listMeals,
    listFoodItems,
    upsertFoodItem,
    createFoodItem,
    updateFoodItem,
    setFoodItemStatus,
    toggleFoodItemStatus,
    listReviewTasks,
    updateReviewTask: (e) => updateReviewTask(e, OPENID),
    resolveReviewTask: (e) => resolveReviewTask(e, OPENID),
    rejectReviewTask: (e) => rejectReviewTask(e, OPENID),
    listFeedback,
    updateFeedbackStatus: (e) => updateFeedbackStatus(e, OPENID),
    getAppConfig,
    listAppConfig,
    setAppConfig: (e) => setAppConfig(e, OPENID)
  }

  if (!actions[action]) {
    const err = new Error('UNKNOWN_ADMIN_ACTION')
    err.code = 'UNKNOWN_ADMIN_ACTION'
    throw err
  }

  return actions[action](event)
}
