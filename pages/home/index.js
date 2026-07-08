const { calculateHealthScore, calculateTotals } = require('../../utils/nutrition')
const { loadTodayAiAdvice } = require('../../services/aiAdviceService')
const { loadUserGoal } = require('../../services/goalService')
const { calculateProgress, getLatestWeight } = require('../../services/weightService')
const {
  addDays,
  aiBehaviorInsight,
  buildShareCard,
  buildTrend,
  calculateStreak,
  formatDateKey
} = require('../../services/growthService')

const MEAL_META = [
  { type: 'breakfast', name: '早餐', image: '🥣', tone: 'pink' },
  { type: 'lunch',     name: '午餐', image: '🥗', tone: 'mint' },
  { type: 'dinner',    name: '晚餐', image: '🍲', tone: 'purple' },
  { type: 'snack',     name: '加餐', image: '🫐', tone: 'gold' }
]

const EMPTY_TOTALS = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

function buildEmptyAiDaily(options = {}) {
  const hasMeals = Boolean(options.hasMeals)
  const totals = options.totals || { ...EMPTY_TOTALS }
  return {
    loading: false,
    error: options.error || '',
    hasMeals,
    score: 0,
    grade: hasMeals ? '生成中' : '暂无',
    aiEvaluation: hasMeals ? 'AI正在根据今日累计摄入生成评价。' : '记录一餐后生成AI日报。',
    issues: hasMeals ? [] : ['暂无餐食记录'],
    nextMealAdvice: hasMeals ? '正在生成下一餐建议。' : '先记录一餐，AI会结合目标值给出建议。',
    recommendationCombos: [],
    totals,
    generatedAt: ''
  }
}

function formatRecommendedFoods(combos) {
  const foods = []
  ;(combos || []).forEach(combo => {
    ;(combo.foods || []).forEach(food => {
      const name = food.name || food.nameCn || food.foodName
      if (name && foods.indexOf(name) === -1) foods.push(name)
    })
  })
  return foods.length ? foods.join('、') : '暂无推荐组合'
}

function buildAiDailyView(summary) {
  const score = summary.score || {}
  return {
    loading: false,
    error: '',
    hasMeals: true,
    score: score.score || summary.totalScore || 0,
    grade: summary.grade || score.grade || '一般',
    aiEvaluation: summary.aiEvaluation || 'AI已根据今日累计摄入完成营养评价。',
    issues: summary.issues || [],
    nextMealAdvice: summary.nextMealAdvice || '下一餐保持均衡搭配。',
    recommendationCombos: summary.recommendationCombos || [],
    recommendedFoodsText: formatRecommendedFoods(summary.recommendationCombos),
    totals: summary.totals || { ...EMPTY_TOTALS },
    generatedAt: summary.generatedAt || ''
  }
}

function buildEmptyStreak() {
  return {
    consecutiveDays: 0,
    lastRecordDate: '',
    todayCheckedIn: false,
    reminderStatus: 'restart',
    reminderText: '今天记录第一餐，开始连续打卡。'
  }
}

function buildEmptyTrend() {
  return {
    days: [],
    activeDays: 0,
    avgKcal: 0,
    summary: '最近7天还没有记录，趋势会在记录后生成。'
  }
}

function buildEmptyInsight() {
  return {
    structureProblems: ['最近7天暂无可分析记录'],
    behaviorPatterns: ['还没有形成稳定记录习惯'],
    suggestions: ['从今天开始记录一餐，AI会在连续记录后生成趋势判断。'],
    summary: '记录数据不足，AI行为分析等待生成。'
  }
}

function buildDefaultShareCard(totals = EMPTY_TOTALS, aiDaily = buildEmptyAiDaily()) {
  return buildShareCard({ totals, aiDaily, streak: buildEmptyStreak() })
}

function buildAiCenter(aiDaily = buildEmptyAiDaily(), totals = EMPTY_TOTALS) {
  const issues = (aiDaily.issues || []).slice(0, 3)
  const advice = []
  if (aiDaily.nextMealAdvice) advice.push(aiDaily.nextMealAdvice)
  ;(aiDaily.recommendationCombos || []).slice(0, 1).forEach(combo => {
    if (combo.reason) advice.push(combo.reason)
  })
  return {
    score: aiDaily.score || 0,
    grade: aiDaily.grade || '暂无',
    issues: issues.length ? issues : ['记录一餐后生成今日营养问题'],
    advice: advice.slice(0, 2),
    evaluation: aiDaily.aiEvaluation || 'AI正在等待今日饮食记录。',
    kcal: totals.kcal || 0,
    protein: totals.protein || 0,
    carbs: totals.carbs || 0,
    fat: totals.fat || 0
  }
}

function buildEmptyWeightProgress() {
  return {
    loading: false,
    visible: false,
    text: '',
    remainingKgText: '0.0',
    currentWeightText: '--',
    targetWeightText: '--'
  }
}

function normalizeMealType(mealType) {
  const typeMap = {
    breakfast: 'breakfast',
    早餐: 'breakfast',
    lunch: 'lunch',
    午餐: 'lunch',
    dinner: 'dinner',
    晚餐: 'dinner',
    snack: 'snack',
    加餐: 'snack',
    drink: 'snack',
    饮品: 'snack'
  }
  return typeMap[mealType] || mealType
}

function safeNum(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function r1(value) {
  return Math.round(safeNum(value) * 10) / 10
}

function sumFoodsNutrition(foods) {
  return (foods || []).reduce((acc, food) => ({
    kcal: acc.kcal + safeNum(food.kcal),
    protein: r1(acc.protein + safeNum(food.protein || food.proteinG)),
    carbs: r1(acc.carbs + safeNum(food.carbs || food.carbsG)),
    fat: r1(acc.fat + safeNum(food.fat || food.fatG)),
    fiber: r1(acc.fiber + safeNum(food.fiber || food.fiberG))
  }), { ...EMPTY_TOTALS })
}

function getMealNutrition(meal) {
  const total = meal.totalNutrition || meal.total || {}
  const fromTotal = {
    kcal: safeNum(total.kcal || meal.kcal),
    protein: safeNum(total.protein || total.proteinG),
    carbs: safeNum(total.carbs || total.carbsG),
    fat: safeNum(total.fat || total.fatG),
    fiber: safeNum(total.fiber || total.fiberG)
  }
  if (fromTotal.kcal || fromTotal.protein || fromTotal.carbs || fromTotal.fat || fromTotal.fiber) {
    return fromTotal
  }
  return sumFoodsNutrition(meal.confirmedFoods || meal.foods || meal.detectedFoods || [])
}

function sumMealNutrition(meals) {
  const totals = meals.reduce((acc, meal) => {
    const current = getMealNutrition(meal)
    return {
      kcal: acc.kcal + current.kcal,
      protein: r1(acc.protein + current.protein),
      carbs: r1(acc.carbs + current.carbs),
      fat: r1(acc.fat + current.fat),
      fiber: r1(acc.fiber + current.fiber)
    }
  }, { ...EMPTY_TOTALS })
  return calculateTotals([{ ...totals }])
}

function sumMealsByType(meals, type) {
  return sumMealNutrition(meals.filter(item => normalizeMealType(item.mealType) === type))
}

function getMealImage(meal) {
  return meal.imageFileID || meal.imageUrl || ''
}

Page({
  data: {
    user: {},
    todayText: '',
    target: 1800,
    healthScore: 0,
    hasMeals: false,
    remainingCalories: 1800,
    totals: EMPTY_TOTALS,
    caloriePercent: 0,
    proteinPercent: 0,
    carbsPercent: 0,
    fatPercent: 0,
    fiberPercent: 0,
    aiDaily: buildEmptyAiDaily(),
    growthLoading: false,
    streak: buildEmptyStreak(),
    trend: buildEmptyTrend(),
    insight: buildEmptyInsight(),
    shareCard: buildDefaultShareCard(),
    aiCenter: buildAiCenter(),
    weightProgress: buildEmptyWeightProgress(),
    mealCards: MEAL_META.map(m => ({
      ...m, recorded: false, kcal: 0
    }))
  },

  onShow() {
    const app = getApp()
    if (app.shouldShowSplash && app.shouldShowSplash()) {
      wx.navigateTo({ url: '/pages/splash/index' })
      return
    }
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }

    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      this.loadToday()
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  loadToday() {
    const app = getApp()
    const user = app.globalData.user || {}
    const target = user.calorieTarget || 1800
    const date = formatDateKey()

    this.setData({ user, target, todayText: date })

    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: { date }
    })
      .then(res => {
        const result = res.result || {}
        const meals = result.records || []
        const hasMeals = meals.length > 0

        const totals = hasMeals ? sumMealNutrition(meals) : { ...EMPTY_TOTALS }
        const score = hasMeals ? calculateHealthScore(totals) : 0
        const remaining = Math.max(0, target - totals.kcal)
        const calPct = hasMeals ? Math.min(100, Math.round((totals.kcal / target) * 100)) : 0
        const protPct = hasMeals ? Math.min(100, Math.round((totals.protein / (user.proteinTarget || 90)) * 100)) : 0
        const carbPct = hasMeals ? Math.min(100, Math.round((totals.carbs / 250) * 100)) : 0
        const fatPct = hasMeals ? Math.min(100, Math.round((totals.fat / 65) * 100)) : 0
        const fiberPct = hasMeals ? Math.min(100, Math.round((totals.fiber / 25) * 100)) : 0

        const mealCards = MEAL_META.map(meta => {
          const typeMeals = meals.filter(item => normalizeMealType(item.mealType) === meta.type)
          const latestMeal = typeMeals[0]
          const nutrition = typeMeals.length ? sumMealsByType(meals, meta.type) : EMPTY_TOTALS
          return {
            ...meta,
            recorded: typeMeals.length > 0,
            kcal: nutrition.kcal,
            imageUrl: latestMeal ? getMealImage(latestMeal) : ''
          }
        })

        this.setData({
          totals, hasMeals,
          healthScore: score, remainingCalories: remaining,
          caloriePercent: calPct, proteinPercent: protPct,
          carbsPercent: carbPct, fatPercent: fatPct, fiberPercent: fiberPct, mealCards
        })
        if (hasMeals) {
          this.loadAiDaily(meals, user, totals)
        } else {
          const aiDaily = buildEmptyAiDaily({ hasMeals: false, totals })
          this.setData({
            aiDaily,
            aiCenter: buildAiCenter(aiDaily, totals),
            shareCard: buildShareCard({ totals, aiDaily, streak: this.data.streak })
          })
        }
        this.loadGrowth(user, date, totals)
        this.loadWeightProgress()
      })
      .catch(() => {
        const aiDaily = buildEmptyAiDaily({
          hasMeals: false,
          totals: { ...EMPTY_TOTALS },
          error: '今日AI日报暂时无法生成'
        })
        this.setData({
          totals: { ...EMPTY_TOTALS },
          hasMeals: false,
          healthScore: 0,
          remainingCalories: target,
          caloriePercent: 0,
          proteinPercent: 0,
          carbsPercent: 0,
          fatPercent: 0,
          fiberPercent: 0,
          aiDaily,
          growthLoading: false,
          streak: buildEmptyStreak(),
          trend: buildEmptyTrend(),
          insight: buildEmptyInsight(),
          aiCenter: buildAiCenter(aiDaily, { ...EMPTY_TOTALS }),
          weightProgress: buildEmptyWeightProgress(),
          shareCard: buildShareCard({ totals: { ...EMPTY_TOTALS }, aiDaily, streak: buildEmptyStreak() }),
          mealCards: MEAL_META.map(m => ({
            ...m, recorded: false, kcal: 0, imageUrl: ''
          }))
        })
      })
  },

  loadWeightProgress() {
    const user = getApp().globalData.user || {}
    const userId = user._id || user.userId || user.openid || user._openid || ''
    if (!userId) {
      this.setData({ weightProgress: buildEmptyWeightProgress() })
      return
    }

    this.setData({
      weightProgress: {
        ...this.data.weightProgress,
        loading: true
      }
    })

    Promise.all([
      loadUserGoal(userId),
      getLatestWeight(userId)
    ])
      .then(([goal, latestWeight]) => {
        if (!goal || !goal.targetWeight) {
          this.setData({ weightProgress: buildEmptyWeightProgress() })
          return
        }
        const progress = calculateProgress(goal, latestWeight)
        this.setData({
          weightProgress: {
            loading: false,
            visible: true,
            text: `距离目标还差 ${progress.remainingKgText} kg`,
            remainingKgText: progress.remainingKgText,
            currentWeightText: progress.currentWeightText,
            targetWeightText: progress.targetWeightText
          }
        })
      })
      .catch(() => {
        this.setData({ weightProgress: buildEmptyWeightProgress() })
      })
  },

  loadAiDaily(meals, user, totals) {
    this.setData({
      aiDaily: {
        ...buildEmptyAiDaily({ hasMeals: true, totals }),
        loading: true
      }
    })
    loadTodayAiAdvice({ meals, user, totals })
      .then(summary => {
        const aiDaily = buildAiDailyView(summary)
        this.setData({
          aiDaily,
          healthScore: aiDaily.score,
          aiCenter: buildAiCenter(aiDaily, totals),
          shareCard: buildShareCard({
            totals,
            aiDaily,
            streak: this.data.streak
          })
        })
      })
      .catch(() => {
        this.setData({
          aiDaily: {
            ...buildEmptyAiDaily({
              hasMeals: true,
              totals,
              error: 'AI日报生成失败，已保留今日摄入数据。'
            }),
            loading: false
          },
          aiCenter: buildAiCenter(buildEmptyAiDaily({ hasMeals: true, totals }), totals)
        })
      })
  },

  loadGrowth(user, todayDate, todayTotals) {
    const app = getApp()
    const startDate = addDays(todayDate, -29)
    const recent7Start = addDays(todayDate, -6)

    this.setData({ growthLoading: true })
    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: {
        startDate,
        endDate: todayDate
      }
    })
      .then(res => {
        const result = res.result || {}
        const records = result.records || []
        const recent7Records = records.filter(meal => {
          const date = String(meal.date || '').slice(0, 10)
          return date >= recent7Start && date <= todayDate
        })
        const streak = calculateStreak(records, todayDate)
        const trend = buildTrend(recent7Records, { days: 7, todayKey: todayDate })
        const insight = aiBehaviorInsight(recent7Records, { todayKey: todayDate })
        const userWithGrowth = {
          ...(user || {}),
          consecutiveDays: streak.consecutiveDays,
          lastRecordDate: streak.lastRecordDate
        }

        app.globalData.user = {
          ...(app.globalData.user || {}),
          consecutiveDays: streak.consecutiveDays,
          lastRecordDate: streak.lastRecordDate
        }

        this.setData({
          user: userWithGrowth,
          growthLoading: false,
          streak,
          trend,
          insight,
          shareCard: buildShareCard({
            totals: todayTotals,
            aiDaily: this.data.aiDaily,
            streak
          })
        })
      })
      .catch(() => {
        const streak = buildEmptyStreak()
        this.setData({
          growthLoading: false,
          streak,
          trend: buildEmptyTrend(),
          insight: buildEmptyInsight(),
          shareCard: buildShareCard({
            totals: todayTotals,
            aiDaily: this.data.aiDaily,
            streak
          })
        })
      })
  },

  onShareAppMessage() {
    const shareCard = this.data.shareCard || buildDefaultShareCard(this.data.totals, this.data.aiDaily)
    return {
      title: shareCard.shareTitle || shareCard.title,
      path: shareCard.path || '/pages/home/index'
    }
  },

  onShareTimeline() {
    const shareCard = this.data.shareCard || buildDefaultShareCard(this.data.totals, this.data.aiDaily)
    return {
      title: shareCard.shareTitle || shareCard.title,
      query: ''
    }
  },

  goRecord() {
    wx.switchTab({ url: '/pages/record/index' })
  },

  goAnalyze() {
    wx.navigateTo({ url: '/pages/analyze/index?mealType=lunch' })
  },

  goProgress() {
    wx.navigateTo({ url: '/pages/progress/index' })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  }
})
