const { formatDate, getMealsByDate } = require('../../utils/storage')

function buildDates() {
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const today = new Date()
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - 3 + index)
    return {
      date: formatDate(date),
      day: date.getDate(),
      week: weekMap[date.getDay()]
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
    mealTypeText: {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '加餐',
      drink: '饮品'
    }
  },

  onShow() {
    const dates = buildDates()
    const selectedDate = formatDate()
    this.setData({ dates, selectedDate }, () => this.loadMeals())
  },

  selectDate(event) {
    this.setData({ selectedDate: event.currentTarget.dataset.date }, () => this.loadMeals())
  },

  selectMood(event) {
    this.setData({ selectedMood: event.currentTarget.dataset.value })
  },

  loadMeals() {
    this.setData({ meals: getMealsByDate(this.data.selectedDate) })
  },

  goReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  }
})
