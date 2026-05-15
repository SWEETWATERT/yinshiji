const MEALS_KEY = 'meals'
const USER_KEY = 'userProfile'

function getMeals() {
  return wx.getStorageSync(MEALS_KEY) || []
}

function setMeals(meals) {
  wx.setStorageSync(MEALS_KEY, meals)
}

function saveMeal(meal) {
  const meals = getMeals()
  setMeals([meal, ...meals])
}

function getMealsByDate(date) {
  return getMeals().filter((meal) => meal.date === date)
}

function getRecentMeals(days = 7) {
  const now = new Date()
  const dates = Array.from({ length: days }).map((_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - index)
    return formatDate(date)
  })
  return getMeals().filter((meal) => dates.includes(meal.date))
}

function getUserProfile() {
  return wx.getStorageSync(USER_KEY)
}

function saveUserProfile(profile) {
  wx.setStorageSync(USER_KEY, profile)
}

function formatDate(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(date = new Date()) {
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${hour}:${minute}`
}

module.exports = {
  getMeals,
  saveMeal,
  getMealsByDate,
  getRecentMeals,
  getUserProfile,
  saveUserProfile,
  formatDate,
  formatTime
}
