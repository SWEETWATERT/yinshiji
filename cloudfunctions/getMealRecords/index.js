const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

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

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()

  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = {
    ...rawEvent,
    ...rawData
  }
  const OPENID = wxContext.OPENID || input.openid || 'cloud_recovery_openid'

  const date = String(input.date || '').trim()
  const startDate = String(input.startDate || '').trim()
  const endDate = String(input.endDate || '').trim()
  const debugInput = {
    rawEventKeys: Object.keys(event || {}),
    rawDataKeys: Object.keys((event && event.data) || {}),
    date,
    startDate,
    endDate,
    hasOpenid: !!OPENID
  }

  if (!OPENID) {
    return { records: [], debugInput, error: 'OPENID_EMPTY' }
  }

  await ensureCollection('meal_records')

  const where = {
    _openid: OPENID
  }

  let limit = 20
  if (date) {
    where.date = date
    limit = 100
  } else if (startDate && endDate) {
    where.date = _.gte(startDate).and(_.lte(endDate))
    limit = 100
  }

  const { data } = await db.collection('meal_records')
    .where(where)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return { records: data, debugInput }
}
