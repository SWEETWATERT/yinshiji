const { BASE_URL } = require('./request')

function chooseMealImage(sourceType = ['camera', 'album']) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType,
      camera: 'back',
      success(res) {
        resolve(res.tempFiles[0].tempFilePath)
      },
      fail: reject
    })
  })
}

function uploadMealImage(filePath) {
  const token = wx.getStorageSync('token')

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${BASE_URL}/api/upload/meal-image`,
      filePath,
      name: 'file',
      header: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      success(res) {
        try {
          resolve(JSON.parse(res.data))
        } catch (error) {
          reject(error)
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  chooseMealImage,
  uploadMealImage
}
