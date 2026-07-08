const { calculateHealthScore } = require('../../utils/nutrition')
const { calculateAiScore } = require('../../services/aiScoreService')

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function formatConfidence(value) {
  return Math.round(Math.max(0, Math.min(1, num(value))) * 100)
}

function normalizeTotal(total = {}) {
  return {
    kcal: Math.round(num(total.kcal)),
    proteinG: r1(total.proteinG || total.protein),
    carbsG: r1(total.carbsG || total.carbs),
    fatG: r1(total.fatG || total.fat),
    fiberG: r1(total.fiberG || total.fiber)
  }
}

function normalizeFood(food = {}, index = 0) {
  const name = food.nameCn || food.name || food.foodName || food.title || `食物${index + 1}`
  const weightG = Math.round(num(food.weightG || food.weight || food.amount || food.estimatedWeightG || 0))
  return {
    ...food,
    uid: food.uid || food.id || food.foodId || `food_${index}`,
    foodId: food.foodId || food.id || '',
    name,
    nameCn: name,
    foodName: food.foodName || name,
    icon: food.icon || '🍽️',
    weightG,
    kcal: Math.round(num(food.kcal)),
    proteinG: r1(food.proteinG || food.protein),
    carbsG: r1(food.carbsG || food.carbs),
    fatG: r1(food.fatG || food.fat),
    fiberG: r1(food.fiberG || food.fiber),
    confidence: num(food.confidence),
    confidenceText: `${formatConfidence(food.confidence)}%`,
    confidenceLabel: food.confidenceLabel || '',
    weightConfidence: food.weightConfidence || 'user_confirmed',
    source: food.source || '',
    recognitionSource: food.recognitionSource || food.source || '',
    matchedKeyword: food.matchedKeyword || '',
    estimateNote: food.estimateNote || '',
    kcalPer100g: num(food._kcalPer100g || food.kcalPer100g),
    proteinPer100g: num(food._proteinPer100g || food.proteinPer100g),
    carbsPer100g: num(food._carbsPer100g || food.carbsPer100g),
    fatPer100g: num(food._fatPer100g || food.fatPer100g),
    fiberPer100g: num(food._fiberPer100g || food.fiberPer100g)
  }
}

function buildFoodNames(foods = []) {
  return foods
    .map(food => food.nameCn || food.name || food.foodName)
    .filter(Boolean)
    .slice(0, 6)
}

function buildStrengths(aiScore = {}, total = {}, foods = []) {
  const strengths = []
  if (num(aiScore.proteinScore) >= 80 || num(total.proteinG) >= 30) strengths.push('蛋白质补充较好')
  if (num(aiScore.fatScore) >= 80) strengths.push('脂肪控制稳定')
  if (foods.length >= 2) strengths.push('餐食结构不单一')
  if (!strengths.length) strengths.push('已完成本餐记录，AI可以继续追踪全天摄入')
  return strengths.slice(0, 3)
}

function buildProblems(aiScore = {}, total = {}) {
  const problems = []
  if (num(aiScore.proteinScore) < 70) problems.push('蛋白质不足')
  if (num(aiScore.fiberScore) < 70 || num(total.fiberG) < 5) problems.push('蔬菜或膳食纤维不足')
  if (num(aiScore.fatScore) < 70) problems.push('脂肪可能偏高')
  if (num(aiScore.carbScore) < 70) problems.push('主食比例需要确认')
  if (!problems.length) problems.push('暂无明显问题，继续保持均衡搭配')
  return problems.slice(0, 3)
}

function buildNextMealRecommendation(problems = []) {
  if (problems.includes('蛋白质不足')) return '下一餐推荐：增加鱼肉、鸡蛋或豆腐。'
  if (problems.includes('蔬菜或膳食纤维不足')) return '下一餐推荐：增加绿色蔬菜200g。'
  if (problems.includes('脂肪可能偏高')) return '下一餐推荐：少油烹饪，优先清蒸或水煮。'
  return '下一餐推荐：保持一份蛋白质、一份主食和两份蔬菜。'
}

function normalizeResult(payload = {}) {
  const total = normalizeTotal(payload.total || {})
  const detectedFoods = (payload.detectedFoods || []).map(normalizeFood)
  const aiScore = payload.aiScore || calculateAiScore({
    totals: total,
    mealType: payload.mealType || 'lunch',
    scope: 'meal'
  })
  const confidence = num(payload.confidence)
  const strengths = buildStrengths(aiScore, total, detectedFoods)
  const problems = buildProblems(aiScore, total)
  return {
    ...payload,
    total,
    detectedFoods,
    aiScore,
    score: aiScore.score || 0,
    grade: aiScore.grade || '暂无',
    explanation: aiScore.explanation || 'AI已完成本餐分析。',
    aiAdvice: payload.aiAdvice || aiScore.explanation || '请确认结果后保存，首页会继续生成今日建议。',
    confidence,
    confidencePercent: formatConfidence(confidence),
    modelText: `${payload.modelProvider || '本地估算'} ${payload.modelVersion || ''}`.trim(),
    hasFoods: detectedFoods.length > 0,
    recognizedNames: buildFoodNames(detectedFoods),
    strengths,
    problems,
    nextMealRecommendation: buildNextMealRecommendation(problems),
    warnings: payload.warnings || []
  }
}

function buildSaveFoods(foods = []) {
  return foods.map(food => ({
    id: food.uid,
    foodId: food.foodId,
    name: food.nameCn || food.name || food.foodName || '未命名食物',
    nameCn: food.nameCn || food.name || food.foodName || '未命名食物',
    foodName: food.foodName || food.nameCn || food.name || '未命名食物',
    weight: num(food.weightG),
    weightG: num(food.weightG),
    amount: num(food.weightG),
    kcal: Math.round(num(food.kcal)),
    protein: r1(food.proteinG),
    proteinG: r1(food.proteinG),
    carbs: r1(food.carbsG),
    carbsG: r1(food.carbsG),
    fat: r1(food.fatG),
    fatG: r1(food.fatG),
    fiber: r1(food.fiberG),
    fiberG: r1(food.fiberG),
    confidence: num(food.confidence),
    confidenceLabel: food.confidenceLabel,
    weightConfidence: food.weightConfidence,
    source: food.source,
    recognitionSource: food.recognitionSource,
    matchedKeyword: food.matchedKeyword,
    estimateNote: food.estimateNote,
    kcalPer100g: num(food.kcalPer100g),
    proteinPer100g: num(food.proteinPer100g),
    carbsPer100g: num(food.carbsPer100g),
    fatPer100g: num(food.fatPer100g),
    fiberPer100g: num(food.fiberPer100g)
  }))
}

Page({
  data: {
    missing: false,
    saving: false,
    result: null
  },

  onLoad() {
    const app = getApp()
    const payload = app.globalData.pendingAiResult
    if (!payload) {
      this.setData({ missing: true })
      return
    }
    this.setData({
      missing: false,
      result: normalizeResult(payload)
    })
  },

  saveRecord() {
    const result = this.data.result
    if (!result || this.data.saving) return
    if (!result.detectedFoods.length) {
      wx.showToast({ title: '没有可保存的食物结果', icon: 'none' })
      return
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const date = result.mode === 'edit' && result.recordDate ? result.recordDate : today
    const time = result.mode === 'edit' && result.recordTime ? result.recordTime : currentTime
    const foods = buildSaveFoods(result.detectedFoods)

    this.setData({ saving: true })
    wx.cloud.callFunction({
      name: 'saveMealRecord',
      data: {
        recordId: result.mode === 'edit' ? result.recordId : '',
        mealType: result.mealType || 'lunch',
        date,
        time,
        imageFileID: result.imageUrl || '',
        note: result.note || '',
        foods,
        detectedFoods: foods,
        total: result.total,
        totalNutrition: {
          kcal: result.total.kcal,
          protein: result.total.proteinG,
          carbs: result.total.carbsG,
          fat: result.total.fatG,
          fiber: result.total.fiberG
        },
        healthScore: calculateHealthScore(result.total),
        suggestion: result.aiAdvice,
        analysisId: result.analysisId || '',
        analysisVersion: result.modelVersion || 'nutrition_estimate_v1',
        recognitionSource: result.recognitionSource || '',
        modelProvider: result.modelProvider || '',
        modelVersion: result.modelVersion || '',
        confidence: result.confidence,
        needReview: Boolean(result.needReview),
        candidates: result.candidates || [],
        visionResult: result.visionResult || null,
        uncertainty: {
          foodRecognition: result.recognitionSource || 'ai_estimated',
          weightRecognition: result.detectedFoods.some(food => food.weightConfidence !== 'user_confirmed') ? 'user_confirm_required' : 'user_confirmed',
          note: '营养数据为估算值，食物和份量以用户确认后的记录为准。'
        }
      }
    })
      .then(() => {
        getApp().globalData.pendingAiResult = null
        wx.showToast({ title: result.mode === 'edit' ? '已更新' : '已保存', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/home/index' }), 500)
      })
      .catch(() => {
        this.setData({ saving: false })
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index' })
  }
})
