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

function shouldCreateReview(type) {
  return ['recognition_wrong', 'nutrition_wrong', 'weight_wrong', 'image_unclear'].includes(type)
}

exports.main = async (event) => {
  await Promise.all([
    ensureCollection('feedback'),
    ensureCollection('review_tasks')
  ])
  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = { ...rawEvent, ...rawData }
  const { OPENID: wxOpenid } = cloud.getWXContext()
  const OPENID = wxOpenid || input.openid || 'cloud_recovery_openid'
  const type = input.type || 'general'
  const feedback = {
    _openid: OPENID,
    type,
    message: input.message || '',
    mealRecordId: input.mealRecordId || '',
    analysisId: input.analysisId || '',
    imageFileID: input.imageFileID || '',
    payload: input.payload || {},
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const { _id } = await db.collection('feedback').add({ data: feedback })

  let reviewTaskId = ''
  if (shouldCreateReview(type)) {
    const review = await db.collection('review_tasks').add({
      data: {
        _openid: OPENID,
        source: 'feedback',
        feedbackId: _id,
        mealRecordId: input.mealRecordId || '',
        analysisId: input.analysisId || '',
        imageFileID: input.imageFileID || '',
        reason: type,
        status: 'pending',
        priority: type === 'image_unclear' ? 'low' : 'normal',
        payload: input.payload || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    reviewTaskId = review._id
  }

  return { ok: true, feedbackId: _id, reviewTaskId }
}
