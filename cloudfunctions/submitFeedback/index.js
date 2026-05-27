const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function shouldCreateReview(type) {
  return ['recognition_wrong', 'nutrition_wrong', 'weight_wrong', 'image_unclear'].includes(type)
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const type = event.type || 'general'
  const feedback = {
    _openid: OPENID,
    type,
    message: event.message || '',
    mealRecordId: event.mealRecordId || '',
    analysisId: event.analysisId || '',
    imageFileID: event.imageFileID || '',
    payload: event.payload || {},
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const { _id } = await db.collection('user_feedback').add({ data: feedback })

  let reviewTaskId = ''
  if (shouldCreateReview(type)) {
    const review = await db.collection('review_tasks').add({
      data: {
        _openid: OPENID,
        source: 'user_feedback',
        feedbackId: _id,
        mealRecordId: event.mealRecordId || '',
        analysisId: event.analysisId || '',
        imageFileID: event.imageFileID || '',
        reason: type,
        status: 'pending',
        priority: type === 'image_unclear' ? 'low' : 'normal',
        payload: event.payload || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    reviewTaskId = review._id
  }

  return { ok: true, feedbackId: _id, reviewTaskId }
}
