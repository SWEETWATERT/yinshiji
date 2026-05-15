const nutritionMap = {
  米饭: { kcal: 116, protein: 2.6, carbs: 25.9, fat: 0.3 },
  鸡胸肉: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  西兰花: { kcal: 34, protein: 2.8, carbs: 6.6, fat: 0.4 },
  鸡蛋: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  糙米饭: { kcal: 116, protein: 2.6, carbs: 23, fat: 0.9 },
  圣女果: { kcal: 22, protein: 1, carbs: 4, fat: 0.2 },
  橄榄油: { kcal: 884, protein: 0, carbs: 0, fat: 100 }
}

function round(value, digits = 1) {
  const base = 10 ** digits
  return Math.round(value * base) / base
}

function calculateFoodNutrition(food) {
  const item = nutritionMap[food.name] || { kcal: 80, protein: 3, carbs: 10, fat: 2 }
  const ratio = Number(food.weight || 0) / 100

  return {
    ...food,
    kcal: Math.round(item.kcal * ratio),
    protein: round(item.protein * ratio),
    carbs: round(item.carbs * ratio),
    fat: round(item.fat * ratio)
  }
}

function calculateTotals(foods) {
  return foods.reduce(
    (totals, food) => {
      const item = calculateFoodNutrition(food)
      return {
        kcal: totals.kcal + item.kcal,
        protein: round(totals.protein + item.protein),
        carbs: round(totals.carbs + item.carbs),
        fat: round(totals.fat + item.fat)
      }
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

function calculateHealthScore(totals) {
  let score = 88
  if (totals.protein >= 30) score += 4
  if (totals.kcal > 800) score -= 8
  if (totals.fat > 35) score -= 4
  return Math.max(60, Math.min(98, score))
}

function buildSuggestion(totals) {
  if (totals.protein < 25) {
    return '这餐蛋白质略少，可以补充鸡蛋、豆腐或鱼虾，作为生活方式参考。'
  }
  if (totals.kcal > 800) {
    return '这餐热量偏高，建议下一餐清淡一些，并搭配轻量活动。'
  }
  return '这餐搭配不错，蛋白质和蔬菜都比较均衡，饭后散步 20 分钟会更轻松。'
}

module.exports = {
  nutritionMap,
  calculateFoodNutrition,
  calculateTotals,
  calculateHealthScore,
  buildSuggestion
}
