const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const {
    mealType, date, time, imageFileID, note,
    foods, totalNutrition, healthScore, suggestion,
    analysisId, analysisVersion, uncertainty
  } = event

  const record = {
    _openid: OPENID,
    mealType,
    date,
    time,
    imageFileID: imageFileID || '',
    note: note || '',
    foods: foods || [],
    totalNutrition: totalNutrition || { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    healthScore: healthScore || 0,
    suggestion: suggestion || '',
    analysisId: analysisId || '',
    analysisVersion: analysisVersion || 'nutrition_estimate_v1',
    uncertainty: uncertainty || {
      foodRecognition: 'estimated',
      weightRecognition: 'user_confirm_required',
      note: '营养数据为估算值，食物和份量需用户确认。'
    },
    createdAt: new Date()
  }

  const { _id } = await db.collection('meal_records').add({ data: record })

  if (analysisId) {
    await Promise.all([
      db.collection('analysis_logs').where({ analysisId }).update({
        data: {
          mealRecordId: _id,
          savedAt: new Date(),
          status: 'saved'
        }
      }).catch(() => null),
      db.collection('review_tasks').where({ analysisId }).update({
        data: {
          mealRecordId: _id,
          updatedAt: new Date()
        }
      }).catch(() => null)
    ])
  }

  return { recordId: _id }
}
