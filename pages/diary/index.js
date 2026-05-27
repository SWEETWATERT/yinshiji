const MEAL_META = [
  { type: 'breakfast', name: '早餐', icon: '🥣', tone: 'pink' },
  { type: 'lunch',     name: '午餐', icon: '🥗', tone: 'mint' },
  { type: 'dinner',    name: '晚餐', icon: '🍲', tone: 'purple' },
  { type: 'snack',     name: '加餐', icon: '🫐', tone: 'gold' }
]

function formatDate(date) {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildDates() {
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date()
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - 3 + index)
    const isToday = formatDate(date) === formatDate(today)
    return {
      date: formatDate(date),
      day: date.getDate(),
      week: isToday ? '今天' : `周${weekMap[date.getDay()]}`
    }
  })
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

function getMealKcal(meal) {
  return Number((meal.totalNutrition && meal.totalNutrition.kcal) || (meal.total && meal.total.kcal) || meal.kcal || 0)
}

function getMealImage(meal) {
  return meal.imageFileID || meal.imageUrl || ''
}

Page({
  data: {
    dates: [],
    selectedDate: '',
    selectedMood: '开心',
    moods: ['开心', '一般', '疲惫', '满足'],
    states: ['轻盈', '有饱腹感', '不困', '想散步'],
    meals: [],
    mealCards: MEAL_META.map(m => ({
      ...m, recorded: false, kcal: 0, imageUrl: ''
    })),
    mealTypeText: {
      breakfast: '早餐', lunch: '午餐', dinner: '晚餐',
      snack: '加餐', drink: '饮品'
    }
  },

  onShow() {
    const app = getApp()
    app.globalData.loginReady.then(() => {
      if (app.checkOnboarding()) return
      const dates = buildDates()
      const selectedDate = formatDate()
      this.setData({ dates, selectedDate }, () => this.loadMeals())
    })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  selectDate(event) {
    this.setData({ selectedDate: event.currentTarget.dataset.date }, () => this.loadMeals())
  },

  selectMood(event) {
    this.setData({ selectedMood: event.currentTarget.dataset.value })
  },

  loadMeals() {
    const date = this.data.selectedDate
    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: { date }
    })
      .then(res => {
        const result = res.result || {}
        const meals = result.records || []
        const mealCards = MEAL_META.map(meta => {
          const meal = meals.find(item => normalizeMealType(item.mealType) === meta.type)
          return {
            ...meta,
            recorded: Boolean(meal),
            kcal: meal ? getMealKcal(meal) : 0,
            imageUrl: meal ? getMealImage(meal) : ''
          }
        })
        this.setData({ meals, mealCards })
      })
      .catch(() => {
        this.setData({
          meals: [],
          mealCards: MEAL_META.map(m => ({
            ...m, recorded: false, kcal: 0, imageUrl: ''
          }))
        })
      })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  },

  goRecord() {
    wx.switchTab({ url: '/pages/record/index' })
  }
})
