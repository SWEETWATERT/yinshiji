const DEFAULT_DAILY_TARGETS = {
  kcal: 1800,
  protein: 90,
  carbs: 220,
  fat: 55,
  fiber: 25
}

const MEAL_TARGET_RATIO = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.35,
  snack: 0.12,
  drink: 0.12
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function round(value) {
  return Math.round(num(value))
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function normalizeTotals(totals = {}) {
  return {
    kcal: round(totals.kcal),
    protein: r1(totals.protein || totals.proteinG),
    carbs: r1(totals.carbs || totals.carbsG),
    fat: r1(totals.fat || totals.fatG),
    fiber: r1(totals.fiber || totals.fiberG)
  }
}

function normalizeTargets(targets = {}) {
  return {
    kcal: num(targets.kcal || targets.calorieTargetDefault || targets.calorieTarget, DEFAULT_DAILY_TARGETS.kcal),
    protein: num(targets.protein || targets.proteinTargetDefault || targets.proteinTarget, DEFAULT_DAILY_TARGETS.protein),
    carbs: num(targets.carbs || targets.carbsTargetDefault, DEFAULT_DAILY_TARGETS.carbs),
    fat: num(targets.fat || targets.fatTargetDefault, DEFAULT_DAILY_TARGETS.fat),
    fiber: num(targets.fiber || targets.fiberTargetDefault, DEFAULT_DAILY_TARGETS.fiber)
  }
}

function targetForScope(targets, scope, mealType) {
  if (scope !== 'meal') return targets
  const ratio = MEAL_TARGET_RATIO[mealType] || 0.33
  return {
    kcal: round(targets.kcal * ratio),
    protein: r1(targets.protein * ratio),
    carbs: r1(targets.carbs * ratio),
    fat: r1(targets.fat * ratio),
    fiber: r1(targets.fiber * ratio)
  }
}

function enoughScore(value, target) {
  if (!target) return 0
  return round(clamp((num(value) / target) * 100))
}

function rangeScore(value, target, low = 0.75, high = 1.2) {
  if (!target) return 0
  const ratio = num(value) / target
  if (ratio >= low && ratio <= high) return 100
  if (ratio < low) return round(clamp((ratio / low) * 100))
  return round(clamp(100 - ((ratio - high) / high) * 70))
}

function gradeFromScore(score) {
  if (score >= 85) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 55) return '一般'
  return '差'
}

function buildExplanation(scores, totals, targets) {
  const points = []
  if (scores.proteinScore < 70) points.push('蛋白质还不够，建议补充鸡蛋、豆腐、鱼虾或鸡胸肉')
  if (scores.carbScore < 70 && totals.carbs < targets.carbs * 0.75) points.push('碳水偏少，可加入糙米、燕麦、玉米或红薯')
  if (scores.carbScore < 70 && totals.carbs > targets.carbs * 1.2) points.push('碳水偏高，下一餐减少主食份量')
  if (scores.fatScore < 70 && totals.fat > targets.fat * 1.2) points.push('脂肪偏高，下一餐选择清蒸、水煮或少油烹饪')
  if (scores.fiberScore < 70) points.push('膳食纤维不足，建议增加深色蔬菜和水果')

  if (!points.length) {
    return '本次营养结构较均衡，蛋白质、碳水、脂肪和膳食纤维接近推荐范围。'
  }
  return `AI 发现 ${points.join('；')}。`
}

function calculateAiScore(options = {}) {
  const totals = normalizeTotals(options.totals)
  const dailyTargets = normalizeTargets(options.targets)
  const targets = targetForScope(dailyTargets, options.scope || 'day', options.mealType)

  const proteinScore = enoughScore(totals.protein, targets.protein)
  const carbScore = rangeScore(totals.carbs, targets.carbs, 0.7, 1.25)
  const fatScore = rangeScore(totals.fat, targets.fat, 0.45, 1.15)
  const fiberScore = enoughScore(totals.fiber, targets.fiber)

  const totalScore = round(
    proteinScore * 0.3 +
    carbScore * 0.25 +
    fatScore * 0.2 +
    fiberScore * 0.25
  )
  const score = clamp(totalScore)

  return {
    proteinScore,
    carbScore,
    fatScore,
    fiberScore,
    totalScore: score,
    score,
    grade: gradeFromScore(score),
    explanation: buildExplanation({ proteinScore, carbScore, fatScore, fiberScore }, totals, targets),
    targets,
    totals
  }
}

module.exports = {
  DEFAULT_DAILY_TARGETS,
  calculateAiScore,
  gradeFromScore,
  normalizeTargets,
  normalizeTotals
}
