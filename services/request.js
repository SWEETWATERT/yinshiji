const BASE_URL = 'https://api.example.com'

function request(options) {
  const token = wx.getStorageSync('token')

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...(options.header || {})
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
          return
        }
        reject(res)
      },
      fail: reject
    })
  })
}

module.exports = {
  request,
  BASE_URL
}
