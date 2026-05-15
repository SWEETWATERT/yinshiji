const {
  buildSuggestion,
  calculateFoodNutrition,
  calculateHealthScore,
  calculateTotals
} = require('../utils/nutrition')

function mockAnalyzeMealImage({ imagePath, mealType }) {
  const foods = [
    { id: 'rice', name: '米饭', weight: 150, image: '🍚' },
    { id: 'chicken', name: '鸡胸肉', weight: 120, image: '🍗' },
    { id: 'broccoli', name: '西兰花', weight: 80, image: '🥦' },
    { id: 'egg', name: '鸡蛋', weight: 50, image: '🥚' }
  ].map(calculateFoodNutrition)

  const totalNutrition = calculateTotals(foods)

  return {
    imagePath,
    mealType,
    foods,
    totalNutrition,
    healthScore: calculateHealthScore(totalNutrition),
    suggestion: buildSuggestion(totalNutrition)
  }
}

module.exports = {
  mockAnalyzeMealImage
}
