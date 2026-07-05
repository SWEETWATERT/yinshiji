const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const MAX_PAGE_SIZE = 20

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    const exists = message.includes('already exist') ||
      message.includes('already exists') ||
      message.includes('collection exists') ||
      message.includes('DATABASE_COLLECTION_ALREADY_EXISTS') ||
      message.includes('-502005') ||
      message.includes('ResourceExist') ||
      message.includes('DATABASE_COLLECTION_ALREADY_EXIST') ||
      message.includes('Table exist')
    if (!exists) throw err
  }
}

function normalizeText(value) {
  return String(value || '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function pageArgs(input) {
  const page = Math.max(1, num(input.page, 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, num(input.pageSize, 10)))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

function escapeRegExp(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isEnabled(food) {
  const status = normalizeText(food.status).toLowerCase()
  return food.enabled !== false && food.disabled !== true && status !== 'disabled'
}

function normalizeFood(food) {
  const name = normalizeText(food.nameCn || food.name || food.foodName || food.title)
  return {
    _id: food._id,
    foodId: food.foodId || food.id || food._id || '',
    nameCn: name,
    name: food.name || name,
    foodName: food.foodName || name,
    category: food.category || '未分类',
    aliases: Array.isArray(food.aliases) ? food.aliases : [],
    icon: food.icon || '🍽️',
    kcalPer100g: num(food.kcalPer100g || food.kcal || food.calories),
    proteinPer100g: num(food.proteinPer100g || food.protein),
    carbsPer100g: num(food.carbsPer100g || food.carbs),
    fatPer100g: num(food.fatPer100g || food.fat),
    fiberPer100g: num(food.fiberPer100g || food.fiber),
    defaultWeightG: num(food.defaultWeightG || food.weightG || food.weight, 100),
    enabled: isEnabled(food),
    status: food.status || (isEnabled(food) ? 'enabled' : 'disabled'),
    updatedAt: food.updatedAt || food.createdAt || null
  }
}

exports.main = async (event) => {
  await ensureCollection('food_items')

  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = { ...rawEvent, ...rawData }
  const keyword = normalizeText(input.keyword || input.q)
  const category = normalizeText(input.category)
  const { page, pageSize, skip } = pageArgs(input)

  const baseWhere = {
    enabled: _.neq(false),
    status: _.neq('disabled')
  }
  if (category) baseWhere.category = category

  let where = baseWhere
  if (keyword) {
    const keywordRegExp = db.RegExp({
      regexp: escapeRegExp(keyword),
      options: 'i'
    })
    where = _.and([
      baseWhere,
      _.or([
        { nameCn: keywordRegExp },
        { name: keywordRegExp },
        { foodName: keywordRegExp },
        { title: keywordRegExp },
        { category: keywordRegExp },
        { aliases: keywordRegExp }
      ])
    ])
  }

  const [listRes, countRes] = await Promise.all([
    db.collection('food_items')
      .where(where)
      .orderBy('updatedAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get(),
    db.collection('food_items').where(where).count()
  ])

  const foods = (listRes.data || []).filter(isEnabled).map(normalizeFood)

  return {
    page,
    pageSize,
    total: countRes.total || foods.length,
    keyword,
    foods,
    records: foods
  }
}
