const { request } = require('./request')

function mockLogin() {
  const user = {
    id: 'mock-user-001',
    openid: 'mock-openid',
    nickname: '小禾',
    avatar: '',
    height: 165,
    weight: 52,
    calorieTarget: 1800,
    proteinTarget: 90
  }

  wx.setStorageSync('token', 'mock-token')
  return user
}

function wechatLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        request({
          url: '/api/auth/wechat-login',
          method: 'POST',
          data: { code: loginRes.code }
        }).then(resolve).catch(reject)
      },
      fail: reject
    })
  })
}

module.exports = {
  mockLogin,
  wechatLogin
}
