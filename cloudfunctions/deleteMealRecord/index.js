const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
  await Promise.all([
    ensureCollection('meal_records'),
    ensureCollection('analysis_logs'),
    ensureCollection('review_tasks')
  ])

  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = { ...rawEvent, ...rawData }
  const { OPENID: wxOpenid } = cloud.getWXContext()
  const OPENID = wxOpenid || input.openid || 'cloud_recovery_openid'
  const recordId = String(input.recordId || input.mealRecordId || input.id || '').trim()

  if (!recordId) {
    const err = new Error('MISSING_RECORD_ID')
    err.code = 'MISSING_RECORD_ID'
    throw err
  }

  const existing = await db.collection('meal_records').doc(recordId).get().catch(() => null)
  if (!existing || !existing.data) {
    const err = new Error('MEAL_RECORD_NOT_FOUND')
    err.code = 'MEAL_RECORD_NOT_FOUND'
    throw err
  }

  if (existing.data._openid !== OPENID) {
    const err = new Error('NO_RECORD_PERMISSION')
    err.code = 'NO_RECORD_PERMISSION'
    throw err
  }

  await db.collection('meal_records').doc(recordId).remove()

  await Promise.all([
    db.collection('review_tasks').where({ mealRecordId: recordId }).update({
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date(),
        cancelReason: 'meal_record_deleted_by_user'
      }
    }).catch(() => null),
    existing.data.analysisId
      ? db.collection('analysis_logs').where({ analysisId: existing.data.analysisId }).update({
        data: {
          status: 'meal_deleted',
          mealRecordId: recordId,
          updatedAt: new Date()
        }
      }).catch(() => null)
      : Promise.resolve(null)
  ])

  return { ok: true, recordId, deleted: true }
}
