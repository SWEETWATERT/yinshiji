const { calculateStreak, formatDateKey } = require('./growthService')

const EMPTY_TOTALS = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function round(value) {
  return Math.round(num(value))
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

function buildTargets(goal = {}) {
  const currentWeight = num(goal.currentWeight)
  return {
    calories: round(goal.dailyCalories || 1800),
    protein: round(goal.proteinGoal || (currentWeight ? currentWeight * 1.6 : 90))
  }
}

function statusFromLevels(levels) {
  if (levels.includes('danger')) {
    return {
      level: 'danger',
      icon: '🔴',
      label: '超标',
      text: '今日减脂节奏需要调整'
    }
  }
  if (levels.includes('warning')) {
    return {
      level: 'warning',
      icon: '🟡',
      label: '注意',
      text: '今日还有关键目标需要补齐'
    }
  }
  return {
    level: 'success',
    icon: '🟢',
    label: '达标',
    text: '今日减脂节奏稳定'
  }
}

function buildCalorieStatus(totals, targets) {
  const current = round(totals.kcal)
  const target = round(targets.calories)
  const percent = target ? Math.round((current / target) * 100) : 0
  let level = 'success'
  let label = '达标'
  if (!current) {
    level = 'warning'
    label = '待记录'
  } else if (current > target * 1.08) {
    level = 'danger'
    label = '超标'
  } else if (current < target * 0.72) {
    level = 'warning'
    label = '偏低'
  }
  return {
    current,
    target,
    percent,
    level,
    label,
    text: `${current} / ${target} kcal`
  }
}

function buildProteinStatus(totals, targets) {
  const current = r1(totals.protein)
  const target = round(targets.protein)
  const percent = target ? Math.round((current / target) * 100) : 0
  const level = current >= target * 0.85 ? 'success' : 'warning'
  return {
    current,
    target,
    percent,
    level,
    label: level === 'success' ? '达标' : '不足',
    text: `${current.toFixed(1)} / ${target} g`
  }
}

function compareDate(a, b) {
  return String(a.date || '').localeCompare(String(b.date || ''))
}

function buildWeightTrend(weightRecords = [], goal = {}) {
  const sorted = (weightRecords || [])
    .filter(record => num(record.weightKg) > 0)
    .slice()
    .sort(compareDate)
  const first = sorted[0]
  const latest = sorted[sorted.length - 1]
  const startWeight = num(goal.currentWeight)
  const currentWeight = latest ? num(latest.weightKg) : startWeight
  const baseWeight = first ? num(first.weightKg) : startWeight
  const changeKg = r1(currentWeight - baseWeight)
  const targetWeight = num(goal.targetWeight)
  const remainingKg = Math.max(0, r1(currentWeight - targetWeight))

  let text = '暂无体重趋势，记录体重后生成变化判断。'
  if (latest && first && latest.date !== first.date) {
    if (changeKg < 0) text = `体重较首条记录下降 ${Math.abs(changeKg).toFixed(1)} kg。`
    else if (changeKg > 0) text = `体重较首条记录上升 ${changeKg.toFixed(1)} kg。`
    else text = '体重较首条记录保持稳定。'
  } else if (currentWeight) {
    text = `当前体重 ${currentWeight.toFixed(1)} kg，距离目标 ${remainingKg.toFixed(1)} kg。`
  }

  return {
    currentWeight: r1(currentWeight),
    targetWeight: r1(targetWeight),
    changeKg,
    remainingKg,
    text
  }
}

function buildAdvice(calorieStatus, proteinStatus, weightTrend) {
  if (calorieStatus.level === 'danger') {
    return '今天热量已经偏高，下一餐建议减少主食和油脂，优先选择蔬菜、鱼虾或豆腐。'
  }
  if (proteinStatus.level === 'warning') {
    return '今天蛋白质不足，晚餐建议增加150g鸡胸肉、鱼肉或豆腐。'
  }
  if (calorieStatus.level === 'warning') {
    return '今天摄入偏少，下一餐要补齐优质蛋白、主食和蔬菜，避免过度节食。'
  }
  if (weightTrend.changeKg > 0.3) {
    return '体重短期有上升，先检查晚餐油脂、饮料和加餐，继续保持记录。'
  }
  return '今天热量和蛋白质节奏稳定，继续保持记录和均衡搭配。'
}

function buildNextMealSuggestion(calorieStatus, proteinStatus) {
  if (calorieStatus.level === 'danger') return '下一餐：清淡蔬菜 + 鱼虾/豆腐，主食减半。'
  if (proteinStatus.level === 'warning') return '下一餐：增加150g鸡胸肉、鱼肉、鸡蛋或豆腐。'
  if (calorieStatus.level === 'warning') return '下一餐：正常吃一份主食 + 一份蛋白 + 两份蔬菜。'
  return '下一餐：保持蛋白质和蔬菜优先，主食适量。'
}

function buildFatLossCoach(options = {}) {
  const goal = options.goal || {}
  const totals = normalizeTotals(options.todayTotals || EMPTY_TOTALS)
  const targets = buildTargets(goal)
  const calorieStatus = buildCalorieStatus(totals, targets)
  const proteinStatus = buildProteinStatus(totals, targets)
  const weightTrend = buildWeightTrend(options.weightRecords || [], goal)
  const streak = calculateStreak(options.mealRecords || [], options.todayKey || formatDateKey())
  const fatLossStatus = statusFromLevels([calorieStatus.level, proteinStatus.level])

  return {
    fatLossStatus,
    weightTrend,
    calorieStatus,
    proteinStatus,
    advice: buildAdvice(calorieStatus, proteinStatus, weightTrend),
    nextMealSuggestion: buildNextMealSuggestion(calorieStatus, proteinStatus),
    consecutiveDays: streak.consecutiveDays,
    streakText: streak.consecutiveDays > 0
      ? `🔥 连续饮食记录 ${streak.consecutiveDays} 天`
      : '今天记录一餐，开始减脂闭环。',
    hasGoal: Boolean(goal && goal.targetWeight)
  }
}

function buildEmptyFatLossCoach() {
  return {
    fatLossStatus: statusFromLevels(['warning']),
    weightTrend: buildWeightTrend([], {}),
    calorieStatus: buildCalorieStatus(EMPTY_TOTALS, { calories: 1800, protein: 90 }),
    proteinStatus: buildProteinStatus(EMPTY_TOTALS, { calories: 1800, protein: 90 }),
    advice: '设置减脂目标并记录饮食后，AI会生成今日闭环建议。',
    nextMealSuggestion: '先完成一餐记录，系统会给出下一餐建议。',
    consecutiveDays: 0,
    streakText: '今天记录一餐，开始减脂闭环。',
    hasGoal: false
  }
}

module.exports = {
  buildEmptyFatLossCoach,
  buildFatLossCoach,
  normalizeTotals
}
