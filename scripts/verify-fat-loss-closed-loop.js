const assert = require('assert')
const { buildFatLossCoach } = require('../services/fatLossCoachService')
const { calculateGoalPlan } = require('../services/goalService')
const { calculateProgress } = require('../services/weightService')
const { buildWeeklyInsight } = require('../services/weeklyInsightService')

const todayKey = '2026-07-07'
const goal = {
  userId: 'test-user',
  ...calculateGoalPlan({
    currentWeight: 80,
    targetWeight: 70,
    periodDays: 90
  })
}
assert.strictEqual(goal.periodDays, 90)
assert.strictEqual(goal.dailyCalories, 1544)
assert.strictEqual(goal.proteinGoal, 128)

const weightRecords = [
  { _id: 'w1', userId: 'test-user', weightKg: 80, date: '2026-07-01' },
  { _id: 'w2', userId: 'test-user', weightKg: 79.5, date: '2026-07-03' },
  { _id: 'w3', userId: 'test-user', weightKg: 78.8, date: '2026-07-07' }
]

const mealRecords = [
  { date: '2026-07-01', totalNutrition: { kcal: 1780, protein: 108, carbs: 190, fat: 52 } },
  { date: '2026-07-02', totalNutrition: { kcal: 1820, protein: 112, carbs: 205, fat: 50 } },
  { date: '2026-07-03', totalNutrition: { kcal: 1740, protein: 100, carbs: 188, fat: 48 } },
  { date: '2026-07-04', totalNutrition: { kcal: 1690, protein: 95, carbs: 180, fat: 45 } },
  { date: '2026-07-05', totalNutrition: { kcal: 1810, protein: 118, carbs: 198, fat: 51 } },
  { date: '2026-07-06', totalNutrition: { kcal: 1760, protein: 104, carbs: 186, fat: 47 } },
  { date: '2026-07-07', totalNutrition: { kcal: 1650, protein: 95, carbs: 172, fat: 44 } }
]

const latestWeight = weightRecords[weightRecords.length - 1]
const progress = calculateProgress(goal, latestWeight)
assert.strictEqual(progress.currentWeight, 78.8)
assert.strictEqual(progress.targetWeight, 70)
assert.strictEqual(progress.lostKg, 1.2)
assert.strictEqual(progress.remainingKg, 8.8)

const coach = buildFatLossCoach({
  goal,
  weightRecords,
  mealRecords,
  todayTotals: mealRecords[mealRecords.length - 1].totalNutrition,
  todayKey
})
assert.strictEqual(coach.consecutiveDays, 7)
assert.strictEqual(coach.weightTrend.changeKg, -1.2)
assert.ok(coach.calorieStatus.percent > 0)
assert.ok(coach.proteinStatus.percent > 0)
assert.ok(coach.advice)

const weekly = buildWeeklyInsight({
  goal,
  weightRecords,
  mealRecords,
  todayKey
})
assert.strictEqual(weekly.activeDays, 7)
assert.strictEqual(weekly.weightChangeKg, -1.2)
assert.strictEqual(weekly.averageCalories, 1750)
assert.ok(weekly.proteinCompletionRate > 0)
assert.ok(weekly.summary.includes('下降1.2kg'))

console.log('Fat loss closed loop verification passed.')
