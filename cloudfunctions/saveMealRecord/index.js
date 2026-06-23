const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function normalizeFood(food = {}, index = 0) {
  const weightG = num(food.weightG || food.weight || food.amount || food.estimatedWeightG)
  const name = String(food.nameCn || food.name || food.foodName || food.title || '未命名食物').trim()
  const id = food.id || food.uid || food.foodId || `food_${index}_${Date.now()}`

  return {
    id,
    uid: food.uid || id,
    foodId: food.foodId || '',
    name,
    nameCn: food.nameCn || name,
    foodName: food.foodName || name,
    weight: weightG,
    weightG,
    amount: weightG,
    kcal: Math.round(num(food.kcal)),
    protein: r1(food.protein || food.proteinG),
    proteinG: r1(food.proteinG || food.protein),
    carbs: r1(food.carbs || food.carbsG),
    carbsG: r1(food.carbsG || food.carbs),
    fat: r1(food.fat || food.fatG),
    fatG: r1(food.fatG || food.fat),
    fiber: r1(food.fiber || food.fiberG),
    fiberG: r1(food.fiberG || food.fiber),
    confidence: num(food.confidence),
    confidenceLabel: food.confidenceLabel || '',
    weightConfidence: food.weightConfidence || '',
    source: food.source || '',
    recognitionSource: food.recognitionSource || '',
    matchedKeyword: food.matchedKeyword || '',
    estimateNote: food.estimateNote || '',
    kcalPer100g: num(food.kcalPer100g || food._kcalPer100g),
    proteinPer100g: num(food.proteinPer100g || food._proteinPer100g),
    carbsPer100g: num(food.carbsPer100g || food._carbsPer100g),
    fatPer100g: num(food.fatPer100g || food._fatPer100g),
    fiberPer100g: num(food.fiberPer100g || food._fiberPer100g)
  }
}

function normalizeTotal(total = {}, foods = []) {
  const fromInput = {
    kcal: Math.round(num(total.kcal)),
    protein: r1(total.protein || total.proteinG),
    carbs: r1(total.carbs || total.carbsG),
    fat: r1(total.fat || total.fatG),
    fiber: r1(total.fiber || total.fiberG)
  }

  if (fromInput.kcal || fromInput.protein || fromInput.carbs || fromInput.fat || fromInput.fiber) {
    return fromInput
  }

  return foods.reduce((acc, food) => ({
    kcal: acc.kcal + num(food.kcal),
    protein: r1(acc.protein + num(food.protein || food.proteinG)),
    carbs: r1(acc.carbs + num(food.carbs || food.carbsG)),
    fat: r1(acc.fat + num(food.fat || food.fatG)),
    fiber: r1(acc.fiber + num(food.fiber || food.fiberG))
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

function shouldCreateReviewTask(record) {
  return Boolean(
    record.needReview ||
    (record.confidence > 0 && record.confidence < 0.6) ||
    (record.imageFileID && !record.confirmedFoods.length)
  )
}

function getReviewReason(record) {
  if (record.needReview) return 'analysis_marked_need_review'
  if (record.confidence > 0 && record.confidence < 0.6) return 'low_confidence_analysis'
  if (record.imageFileID && !record.confirmedFoods.length) return 'image_without_detected_foods'
  return 'estimated_result_needs_confirmation'
}

function reviewTaskPayload(record, mealRecordId, openid) {
  const now = new Date()
  return {
    _openid: openid,
    source: 'meal_save',
    analysisId: record.analysisId || '',
    mealRecordId,
    mealType: record.mealType || '',
    date: record.date || '',
    time: record.time || '',
    imageFileID: record.imageFileID || '',
    note: record.note || '',
    detectedFoods: record.detectedFoods || [],
    confirmedFoods: record.confirmedFoods || [],
    total: record.total || {},
    totalNutrition: record.totalNutrition || {},
    candidates: record.candidates || [],
    visionResult: record.visionResult || null,
    recognitionSource: record.recognitionSource || '',
    modelProvider: record.modelProvider || '',
    modelVersion: record.modelVersion || '',
    confidence: record.confidence || 0,
    needReview: Boolean(record.needReview),
    reason: getReviewReason(record),
    status: 'pending',
    priority: record.confirmedFoods.length ? 'normal' : 'high',
    updatedAt: now
  }
}

async function upsertReviewTaskIfNeeded(record, mealRecordId, openid) {
  if (!shouldCreateReviewTask(record)) return { created: false, skipped: true }

  const data = reviewTaskPayload(record, mealRecordId, openid)
  const mergeExistingStatus = (existing) => {
    const status = String(existing && existing.status || '').trim()
    return status && status !== 'pending'
      ? { ...data, status }
      : data
  }

  if (record.analysisId) {
    const existingByAnalysis = await db.collection('review_tasks')
      .where({ analysisId: record.analysisId })
      .limit(1)
      .get()

    if (existingByAnalysis.data && existingByAnalysis.data[0]) {
      await db.collection('review_tasks').doc(existingByAnalysis.data[0]._id).update({
        data: mergeExistingStatus(existingByAnalysis.data[0])
      })
      return { created: false, updated: true, reviewTaskId: existingByAnalysis.data[0]._id }
    }
  }

  const existingByMeal = await db.collection('review_tasks')
    .where({ mealRecordId })
    .limit(1)
    .get()

  if (existingByMeal.data && existingByMeal.data[0]) {
    await db.collection('review_tasks').doc(existingByMeal.data[0]._id).update({
      data: mergeExistingStatus(existingByMeal.data[0])
    })
    return { created: false, updated: true, reviewTaskId: existingByMeal.data[0]._id }
  }

  const { _id } = await db.collection('review_tasks').add({
    data: {
      ...data,
      createdAt: new Date()
    }
  })
  return { created: true, updated: false, reviewTaskId: _id }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = { ...rawEvent, ...rawData }

  const confirmedFoods = (input.confirmedFoods || input.foods || input.detectedFoods || [])
    .map((food, index) => normalizeFood(food, index))
  const totalNutrition = normalizeTotal(input.totalNutrition || input.total || {}, confirmedFoods)
  const analysisId = input.analysisId || ''
  const recognitionSource = input.recognitionSource || input.modelSource || ''
  const confidence = num(input.confidence)
  const needReview = Boolean(input.needReview)
  const candidates = Array.isArray(input.candidates) ? input.candidates : []
  const visionResult = input.visionResult || null

  const record = {
    _openid: OPENID,
    mealType: input.mealType || '',
    date: input.date || '',
    time: input.time || '',
    imageFileID: input.imageFileID || input.imageUrl || '',
    note: input.note || '',
    foods: confirmedFoods,
    detectedFoods: confirmedFoods,
    confirmedFoods,
    totalNutrition,
    total: {
      kcal: totalNutrition.kcal,
      proteinG: totalNutrition.protein,
      carbsG: totalNutrition.carbs,
      fatG: totalNutrition.fat,
      fiberG: totalNutrition.fiber
    },
    healthScore: num(input.healthScore),
    suggestion: input.suggestion || input.aiAdvice || '',
    analysisId,
    analysisVersion: input.analysisVersion || input.modelVersion || 'nutrition_estimate_v1',
    recognitionSource,
    modelProvider: input.modelProvider || '',
    modelVersion: input.modelVersion || input.analysisVersion || '',
    confidence,
    needReview,
    candidates,
    visionResult,
    uncertainty: input.uncertainty || {
      foodRecognition: recognitionSource || 'estimated',
      weightRecognition: confirmedFoods.some(food => food.weightConfidence !== 'user_confirmed') ? 'user_confirm_required' : 'user_confirmed',
      note: '营养数据为估算值，食物和份量需用户确认。'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const { _id } = await db.collection('meal_records').add({ data: record })

  if (analysisId) {
    await Promise.all([
      db.collection('analysis_logs').where({ analysisId }).update({
        data: {
          mealRecordId: _id,
          confirmedFoods,
          totalNutrition,
          savedAt: new Date(),
          status: 'saved'
        }
      }).catch(() => null),
      db.collection('review_tasks').where({ analysisId }).update({
        data: {
          mealRecordId: _id,
          confirmedFoods,
          totalNutrition,
          updatedAt: new Date()
        }
      }).catch(() => null)
    ])
  }

  const reviewTaskResult = await upsertReviewTaskIfNeeded(record, _id, OPENID).catch(err => ({
    created: false,
    updated: false,
    error: err.message || String(err)
  }))

  return { recordId: _id, mealRecordId: _id, totalNutrition, foods: confirmedFoods, reviewTask: reviewTaskResult }
}
