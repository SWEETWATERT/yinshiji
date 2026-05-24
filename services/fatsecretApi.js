const { FATSECRET_CLIENT_ID, FATSECRET_CLIENT_SECRET } = require('./config')

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token'
const API_URL   = 'https://platform.fatsecret.com/rest/server.api'

let _token       = null
let _tokenExpiry = 0

function _b64(s) {
  const t = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let r = '', i = 0
  while (i < s.length) {
    const c1 = s.charCodeAt(i++), c2 = s.charCodeAt(i++), c3 = s.charCodeAt(i++)
    r += t[c1 >> 2]
    r += t[((c1 & 3) << 4) | ((c2 || 0) >> 4)]
    r += isNaN(c2) ? '=' : t[((c2 & 15) << 2) | ((c3 || 0) >> 6)]
    r += isNaN(c3) ? '=' : t[c3 & 63]
  }
  return r
}

function _wxRequest(options) {
  return new Promise((resolve, reject) => {
    wx.request({ ...options, success: resolve, fail: reject })
  })
}

function getAccessToken() {
  if (!FATSECRET_CLIENT_SECRET) return Promise.reject(new Error('no_secret'))
  if (_token && Date.now() < _tokenExpiry) return Promise.resolve(_token)

  const creds = _b64(`${FATSECRET_CLIENT_ID}:${FATSECRET_CLIENT_SECRET}`)
  return _wxRequest({
    url: TOKEN_URL,
    method: 'POST',
    header: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: 'grant_type=client_credentials&scope=basic'
  }).then(res => {
    if (res.statusCode !== 200 || !res.data || !res.data.access_token) {
      throw new Error('token_failed')
    }
    _token = res.data.access_token
    _tokenExpiry = Date.now() + ((res.data.expires_in || 86400) - 60) * 1000
    return _token
  })
}

// Returns { kcalPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g } or null
function searchFood(keyword) {
  return getAccessToken().then(token => {
    return _wxRequest({
      url: API_URL,
      method: 'GET',
      header: { Authorization: `Bearer ${token}` },
      data: {
        method: 'foods.search',
        search_expression: keyword,
        language: 'zh',
        region: 'CN',
        format: 'json',
        max_results: 3
      }
    })
  }).then(res => {
    if (!res.data || !res.data.foods) return null
    const foodsRaw = res.data.foods.food
    if (!foodsRaw) return null
    const list = Array.isArray(foodsRaw) ? foodsRaw : [foodsRaw]
    return _mapNutrition(list[0])
  })
}

function _mapNutrition(fsFood) {
  if (!fsFood || !fsFood.servings) return null
  const servingRaw = fsFood.servings.serving
  const servings   = Array.isArray(servingRaw) ? servingRaw : [servingRaw]

  // Prefer a 100g-based serving; fall back to first
  const s = servings.find(sv =>
    sv.metric_serving_unit === 'g' && parseFloat(sv.metric_serving_amount || 0) > 0
  ) || servings[0]
  if (!s) return null

  const grams  = parseFloat(s.metric_serving_amount || 100)
  const unit   = (s.metric_serving_unit || 'g').toLowerCase()
  const factor = unit === 'g' && grams > 0 ? 100 / grams : 1  // scale to per-100g

  return {
    kcalPer100g:    Math.round(parseFloat(s.calories    || 0) * factor),
    proteinPer100g: _r1(parseFloat(s.protein     || 0) * factor),
    carbsPer100g:   _r1(parseFloat(s.carbohydrate || 0) * factor),
    fatPer100g:     _r1(parseFloat(s.fat          || 0) * factor),
    fiberPer100g:   _r1(parseFloat(s.fiber        || 0) * factor)
  }
}

function _r1(n) { return Math.round(parseFloat(n) * 10) / 10 }

module.exports = { searchFood }
