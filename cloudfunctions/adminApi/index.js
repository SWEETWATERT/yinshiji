const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const MAX_PAGE_SIZE = 50

function pageArgs(event) {
  const page = Math.max(1, Number(event.page || 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(event.pageSize || 20)))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

function normalizeAdminOpenids() {
  return String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

async function isAdmin(openid) {
  const info = await getAdminInfo(openid)
  return info.isAdmin
}

async function getAdminInfo(openid) {
  if (normalizeAdminOpenids().includes(openid)) {
    return {
      openid,
      isAdmin: true,
      roles: ['owner'],
      message: '当前账号已通过 ADMIN_OPENIDS 白名单获得后台权限。'
    }
  }

  const { data } = await db.collection('admin_users')
    .where({ _openid: openid, status: 'active' })
    .limit(1)
    .get()
  if (data.length > 0) {
    return {
      openid,
      isAdmin: true,
      roles: [data[0].role || 'admin'],
      message: '当前账号已通过 admin_users 集合获得后台权限。'
    }
  }

  return {
    openid,
    isAdmin: false,
    roles: [],
    message: '当前账号暂无后台权限。'
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
  return { page, pageSize, total: count.total, records: res.data }
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
  return { page, pageSize, total: count.total, records: res.data }
}

async function listFoodItems(event) {
  const { page, pageSize, skip } = pageArgs(event)
  const where = {}
  if (event.category) where.category = event.category
  if (event.keyword) {
    where.nameCn = db.RegExp({
      regexp: event.keyword,
      options: 'i'
    })
  }
  const res = await db.collection('food_items')
    .where(where)
    .orderBy('category', 'asc')
    .skip(skip)
    .limit(pageSize)
    .get()
  const count = await db.collection('food_items').where(where).count()
  return { page, pageSize, total: count.total, records: res.data }
}

function sanitizeFoodItem(data) {
  const required = ['foodId', 'nameCn', 'category', 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g']
  for (const key of required) {
    if (data[key] === undefined || data[key] === '') {
      const err = new Error(`MISSING_${key}`)
      err.code = 'INVALID_FOOD_ITEM'
      throw err
    }
  }
  return {
    foodId: String(data.foodId),
    nameCn: String(data.nameCn),
    category: String(data.category),
    aliases: Array.isArray(data.aliases) ? data.aliases : [],
    kcalPer100g: Number(data.kcalPer100g),
    proteinPer100g: Number(data.proteinPer100g),
    carbsPer100g: Number(data.carbsPer100g),
    fatPer100g: Number(data.fatPer100g),
    fiberPer100g: Number(data.fiberPer100g || 0),
    icon: data.icon || '🍽️',
    defaultWeightG: Number(data.defaultWeightG || 100),
    verified: data.verified !== false,
    dataSource: data.dataSource || 'admin',
    dataSourceNote: data.dataSourceNote || '后台人工维护数据。',
    updatedAt: new Date()
  }
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
  return { page, pageSize, total: count.total, records: res.data }
}

async function resolveReviewTask(event, openid) {
  if (!event.taskId) {
    const err = new Error('MISSING_TASK_ID')
    err.code = 'MISSING_TASK_ID'
    throw err
  }
  await db.collection('review_tasks').doc(event.taskId).update({
    data: {
      status: event.status || 'resolved',
      reviewerOpenid: openid,
      resolutionNote: event.resolutionNote || '',
      correctedFoods: event.correctedFoods || [],
      updatedAt: new Date(),
      resolvedAt: new Date()
    }
  })
  return { ok: true, taskId: event.taskId }
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
  return { page, pageSize, total: count.total, records: res.data }
}

async function updateFeedbackStatus(event, openid) {
  if (!event.feedbackId) {
    const err = new Error('MISSING_FEEDBACK_ID')
    err.code = 'MISSING_FEEDBACK_ID'
    throw err
  }
  await db.collection('user_feedback').doc(event.feedbackId).update({
    data: {
      status: event.status || 'closed',
      adminOpenid: openid,
      adminNote: event.adminNote || '',
      updatedAt: new Date()
    }
  })
  return { ok: true, feedbackId: event.feedbackId }
}

async function getAppConfig(event) {
  const key = event.key || 'default'
  const res = await db.collection('app_config').where({ key }).limit(1).get()
  return { key, config: res.data[0] || null }
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
    listReviewTasks,
    resolveReviewTask: (e) => resolveReviewTask(e, OPENID),
    listFeedback,
    updateFeedbackStatus: (e) => updateFeedbackStatus(e, OPENID),
    getAppConfig,
    setAppConfig: (e) => setAppConfig(e, OPENID)
  }

  if (!actions[action]) {
    const err = new Error('UNKNOWN_ADMIN_ACTION')
    err.code = 'UNKNOWN_ADMIN_ACTION'
    throw err
  }

  return actions[action](event)
}
