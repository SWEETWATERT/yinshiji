Page({
  data: {
    entered: false,
    frameIndex: 0,
    frameSrc: '/assets/splash-frames/frame_001.jpg',
    frameError: false
  },

  onLoad() {
    this.frames = Array.from({ length: 50 }, (_, index) => {
      const num = String(index + 1).padStart(3, '0')
      return `/assets/splash-frames/frame_${num}.jpg`
    })
    this.frameTimer = setInterval(() => {
      const nextIndex = Math.min(this.data.frameIndex + 1, this.frames.length - 1)
      if (nextIndex === this.data.frameIndex) return
      this.setData({
        frameIndex: nextIndex,
        frameSrc: this.frames[nextIndex]
      })
    }, 100)

    this.enterTimer = setTimeout(() => {
      this.enterHome()
    }, 5000)
  },

  onFrameError() {
    this.setData({ frameError: true })
  },

  onUnload() {
    if (this.frameTimer) {
      clearInterval(this.frameTimer)
      this.frameTimer = null
    }
    if (this.enterTimer) {
      clearTimeout(this.enterTimer)
      this.enterTimer = null
    }
  },

  enterHome() {
    if (this.data.entered) return
    this.setData({ entered: true })
    const app = getApp()
    if (app.markSplashShown) {
      app.markSplashShown()
    }
    if (this.frameTimer) {
      clearInterval(this.frameTimer)
      this.frameTimer = null
    }
    if (this.enterTimer) {
      clearTimeout(this.enterTimer)
      this.enterTimer = null
    }
    wx.switchTab({ url: '/pages/home/index' })
  }
})
