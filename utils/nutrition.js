/**
 * 营养计算工具 — 使用 foodDatabase 作为数据源
 */
const { getFoodById, buildFoodItem } = require('../mock/foodDatabase')

function round1(n) {
  return Math.round(n * 10) / 10
}

/**
 * 计算一组食物的营养合计
 */
function calculateTotals(foods) {
  return foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + (f.kcal || 0),
      protein: round1(acc.protein + (f.proteinG || f.protein || 0)),
      carbs: round1(acc.carbs + (f.carbsG || f.carbs || 0)),
      fat: round1(acc.fat + (f.fatG || f.fat || 0)),
      fiber: round1(acc.fiber + (f.fiberG || f.fiber || 0))
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  )
}

/**
 * 根据食物名和重量计算营养（兼容旧接口）
 */
function calculateFoodNutrition(food) {
  // Try to find in database by nameCn
  const dbFood = getFoodById(food.id) || findByName(food.name)
  const ratio = Number(food.weight || 0) / 100

  if (dbFood) {
    return buildFoodItem(dbFood, Number(food.weight || 0), food.confidence || 1.0)
  }

  // Fallback for unknown foods
  return {
    ...food,
    kcal: Math.round(80 * ratio),
    protein: round1(3 * ratio),
    carbs: round1(10 * ratio),
    fat: round1(2 * ratio),
    fiber: round1(1 * ratio)
  }
}

function findByName(name) {
  if (!name) return null
  const { FOOD_DATABASE } = require('../mock/foodDatabase')
  return FOOD_DATABASE.find(f =>
    f.nameCn === name || (f.aliases && f.aliases.includes(name))
  ) || null
}

function calculateHealthScore(totals) {
  const kcal = totals.kcal || 0
  const protein = totals.protein || totals.proteinG || 0
  const fat = totals.fat || totals.fatG || 0
  let score = 78
  if (protein >= 20) score += 6
  else if (protein >= 10) score += 3
  if (kcal <= 600) score += 5
  else if (kcal > 900) score -= 8
  if (fat > 35) score -= 5
  return Math.max(60, Math.min(98, score))
}

function buildSuggestion(totals) {
  const protein = totals.protein || totals.proteinG || 0
  const kcal = totals.kcal || 0
  if (protein < 15) {
    return '本餐蛋白质略少，可以补充鸡蛋、豆腐或鱼虾。'
  }
  if (kcal > 800) {
    return '本餐热量偏高，下一餐可以适当清淡，搭配轻量活动。'
  }
  return '本餐搭配不错，蛋白质和蔬菜比较均衡，继续保持。'
}

module.exports = {
  calculateTotals,
  calculateFoodNutrition,
  calculateHealthScore,
  buildSuggestion
}
