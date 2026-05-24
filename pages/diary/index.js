const { formatDate, getMealsByDate } = require('../../utils/storage')

const MEAL_META = [
  { type: 'breakfast', name: '早餐', icon: '🥣', tone: 'pink',   mockKcal: 412, mockRecorded: true },
  { type: 'lunch',     name: '午餐', icon: '🥗', tone: 'mint',   mockKcal: 568, mockRecorded: true },
  { type: 'dinner',    name: '晚餐', icon: '🍲', tone: 'purple', mockKcal: 0,   mockRecorded: false },
  { type: 'snack',     name: '加餐', icon: '🫐', tone: 'gold',   mockKcal: 156, mockRecorded: true }
]

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
    const dates = buildDates()
    const selectedDate = formatDate()
    this.setData({ dates, selectedDate }, () => this.loadMeals())
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
    const meals = getMealsByDate(this.data.selectedDate)
    const mealCards = MEAL_META.map((meta) => {
      const meal = meals.find((item) => item.mealType === meta.type)
      return {
        ...meta,
        recorded: Boolean(meal),
        kcal: meal ? meal.totalNutrition.kcal : 0,
        imageUrl: meal ? meal.imageUrl : ''
      }
    })
    this.setData({ meals, mealCards })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  }
})
