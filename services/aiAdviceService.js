const { calculateAiScore, normalizeTargets, normalizeTotals } = require('./aiScoreService')

const DEFAULT_CONFIG = {
  calorieTargetDefault: 1800,
  proteinTargetDefault: 90,
  carbsTargetDefault: 220,
  fatTargetDefault: 55,
  fiberTargetDefault: 25
}

const FALLBACK_RECOMMENDATIONS = {
  protein: ['鸡蛋', '鸡胸肉', '豆腐'],
  fiber: ['西兰花', '菠菜', '苹果'],
  carbs: ['糙米饭', '燕麦', '红薯'],
  light: ['清炒青菜', '白粥', '鱼肉']
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function getWxCloud() {
  if (typeof wx === 'undefined' || !wx.cloud) return null
  return wx.cloud
}

function normalizeMealNutrition(meal = {}) {
  const total = meal.totalNutrition || meal.total || {}
  const fromTotal = {
    kcal: num(total.kcal || meal.kcal),
    protein: num(total.protein || total.proteinG),
    carbs: num(total.carbs || total.carbsG),
    fat: num(total.fat || total.fatG),
    fiber: num(total.fiber || total.fiberG)
  }
  if (fromTotal.kcal || fromTotal.protein || fromTotal.carbs || fromTotal.fat || fromTotal.fiber) {
    return fromTotal
  }

  return (meal.confirmedFoods || meal.foods || meal.detectedFoods || []).reduce((acc, food) => ({
    kcal: acc.kcal + num(food.kcal),
    protein: r1(acc.protein + num(food.protein || food.proteinG)),
    carbs: r1(acc.carbs + num(food.carbs || food.carbsG)),
    fat: r1(acc.fat + num(food.fat || food.fatG)),
    fiber: r1(acc.fiber + num(food.fiber || food.fiberG))
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
}

function sumMealsNutrition(meals = []) {
  return normalizeTotals((meals || []).reduce((acc, meal) => {
    const current = normalizeMealNutrition(meal)
    return {
      kcal: acc.kcal + current.kcal,
      protein: r1(acc.protein + current.protein),
      carbs: r1(acc.carbs + current.carbs),
      fat: r1(acc.fat + current.fat),
      fiber: r1(acc.fiber + current.fiber)
    }
  }, { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }))
}

function buildTargets(appConfig = {}, user = {}) {
  const value = appConfig.value || appConfig || {}
  return normalizeTargets({
    calorieTargetDefault: user.calorieTarget || value.calorieTargetDefault || DEFAULT_CONFIG.calorieTargetDefault,
    proteinTargetDefault: user.proteinTarget || value.proteinTargetDefault || DEFAULT_CONFIG.proteinTargetDefault,
    carbsTargetDefault: value.carbsTargetDefault || DEFAULT_CONFIG.carbsTargetDefault,
    fatTargetDefault: value.fatTargetDefault || DEFAULT_CONFIG.fatTargetDefault,
    fiberTargetDefault: value.fiberTargetDefault || DEFAULT_CONFIG.fiberTargetDefault
  })
}

function buildIssues(totals, targets) {
  const issues = []
  if (totals.kcal > targets.kcal * 1.1) issues.push('今日热量已经偏高')
  if (totals.kcal < targets.kcal * 0.55) issues.push('今日热量摄入还偏少')
  if (totals.protein < targets.protein * 0.65) issues.push('蛋白质不足')
  if (totals.carbs > targets.carbs * 1.2) issues.push('碳水偏高')
  if (totals.fat > targets.fat * 1.2) issues.push('脂肪偏高')
  if (totals.fiber < targets.fiber * 0.65) issues.push('膳食纤维不足')
  return issues.length ? issues : ['营养结构整体稳定']
}

function nextMealAdvice(totals, targets, issues) {
  if (issues.includes('脂肪偏高') || issues.includes('今日热量已经偏高')) {
    return '下一餐建议少油清淡，优先选择蔬菜、鱼虾、豆腐，主食减半。'
  }
  if (issues.includes('蛋白质不足')) {
    return '下一餐建议补充优质蛋白，例如鸡蛋、鸡胸肉、鱼虾或豆腐。'
  }
  if (issues.includes('膳食纤维不足')) {
    return '下一餐建议加入一份深色蔬菜，再搭配适量水果。'
  }
  if (totals.kcal < targets.kcal * 0.55) {
    return '下一餐可以正常吃，注意主食、蛋白质和蔬菜都要有。'
  }
  return '下一餐保持均衡搭配，主食适量，蛋白质和蔬菜不要缺席。'
}

function recommendationKeywords(issues) {
  if (issues.includes('脂肪偏高') || issues.includes('今日热量已经偏高')) return FALLBACK_RECOMMENDATIONS.light
  const keywords = []
  if (issues.includes('蛋白质不足')) keywords.push(...FALLBACK_RECOMMENDATIONS.protein)
  if (issues.includes('膳食纤维不足')) keywords.push(...FALLBACK_RECOMMENDATIONS.fiber)
  if (issues.includes('今日热量摄入还偏少')) keywords.push(...FALLBACK_RECOMMENDATIONS.carbs)
  return keywords.length ? keywords.slice(0, 4) : ['鸡胸肉', '西兰花', '糙米饭']
}

function fetchAppConfig() {
  return new Promise(resolve => {
    const cloud = getWxCloud()
    if (!cloud || !cloud.database) {
      resolve({ key: 'default', value: DEFAULT_CONFIG })
      return
    }
    cloud.database().collection('app_config')
      .where({ key: 'default' })
      .limit(1)
      .get()
      .then(res => resolve((res.data && res.data[0]) || { key: 'default', value: DEFAULT_CONFIG }))
      .catch(() => resolve({ key: 'default', value: DEFAULT_CONFIG }))
  })
}

function searchFood(keyword) {
  return new Promise(resolve => {
    const cloud = getWxCloud()
    if (!cloud || !cloud.callFunction) {
      resolve({ nameCn: keyword, category: '推荐', kcalPer100g: 0 })
      return
    }
    cloud.callFunction({
      name: 'searchFoodItems',
      data: { keyword, page: 1, pageSize: 3 }
    })
      .then(res => {
        const result = res.result || {}
        const foods = result.foods || result.records || []
        resolve(foods[0] || { nameCn: keyword, category: '推荐', kcalPer100g: 0 })
      })
      .catch(() => resolve({ nameCn: keyword, category: '推荐', kcalPer100g: 0 }))
  })
}

function loadRecommendedFoods(issues) {
  const keywords = recommendationKeywords(issues)
  return Promise.all(keywords.map(searchFood)).then(foods => {
    const unique = []
    const seen = {}
    foods.forEach(food => {
      const name = food.nameCn || food.name || food.foodName
      if (!name || seen[name]) return
      seen[name] = true
      unique.push({
        name,
        category: food.category || '推荐',
        kcalPer100g: num(food.kcalPer100g || food.kcal)
      })
    })
    return unique
  })
}

function buildRecommendationCombos(foods, issues) {
  if (!foods.length) return []
  return [
    {
      title: issues.includes('脂肪偏高') ? '清淡修正组合' : '均衡补足组合',
      foods,
      reason: issues.includes('脂肪偏高')
        ? '优先降低油脂负担，同时保留蛋白质和蔬菜。'
        : '根据今日缺口补充蛋白质、纤维和稳定碳水。'
    }
  ]
}

function buildTodayAiAdvice(options = {}) {
  const meals = options.meals || []
  const user = options.user || {}
  const appConfig = options.appConfig || { value: DEFAULT_CONFIG }
  const totals = options.totals ? normalizeTotals(options.totals) : sumMealsNutrition(meals)
  const targets = buildTargets(appConfig, user)
  const score = calculateAiScore({ totals, targets, scope: 'day' })
  const issues = buildIssues(totals, targets)
  const advice = nextMealAdvice(totals, targets, issues)
  return loadRecommendedFoods(issues).then(foods => ({
    totals,
    targets,
    score,
    grade: score.grade,
    aiEvaluation: score.explanation,
    issues,
    nextMealAdvice: advice,
    recommendationCombos: buildRecommendationCombos(foods, issues),
    generatedAt: new Date().toISOString()
  }))
}

function loadTodayAiAdvice(options = {}) {
  return fetchAppConfig()
    .then(appConfig => buildTodayAiAdvice({ ...options, appConfig }))
}

module.exports = {
  DEFAULT_CONFIG,
  buildTodayAiAdvice,
  fetchAppConfig,
  loadTodayAiAdvice,
  sumMealsNutrition
}
