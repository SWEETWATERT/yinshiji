function getBmiLevel(bmi) {
  if (bmi < 18.5) return '偏瘦'
  if (bmi < 24) return '正常'
  if (bmi < 28) return '超重'
  return '偏胖'
}

function calcBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return { bmi: 0, bmiLevel: '' }
  const h = heightCm / 100
  const bmi = Math.round((weightKg / (h * h)) * 10) / 10
  return { bmi, bmiLevel: getBmiLevel(bmi) }
}

Page({
  data: {
    mode: 'create',
    gender: '',
    age: '',
    heightCm: '',
    weightKg: '',
    bmi: 0,
    bmiLevel: '',
    healthGoal: '',
    remark: '',
    saving: false,
    goals: ['轻盈健康', '减脂', '增肌', '控糖', '规律记录']
  },

  onLoad(query) {
    if (query.mode === 'edit') {
      this.setData({ mode: 'edit' })
      const user = getApp().globalData.user || {}
      this.setData({
        gender: user.gender || '',
        age: user.age ? String(user.age) : '',
        heightCm: user.heightCm ? String(user.heightCm) : '',
        weightKg: user.weightKg ? String(user.weightKg) : '',
        bmi: user.bmi || 0,
        bmiLevel: user.bmiLevel || '',
        healthGoal: user.healthGoal || '',
        remark: user.remark || ''
      })
    }
  },

  selectGender(e) {
    this.setData({ gender: e.currentTarget.dataset.value })
  },

  onAgeInput(e) {
    this.setData({ age: e.detail.value })
  },

  onHeightInput(e) {
    const heightCm = e.detail.value
    this.setData({ heightCm })
    this._updateBmi(heightCm, this.data.weightKg)
  },

  onWeightInput(e) {
    const weightKg = e.detail.value
    this.setData({ weightKg })
    this._updateBmi(this.data.heightCm, weightKg)
  },

  _updateBmi(heightCm, weightKg) {
    const h = Number(heightCm)
    const w = Number(weightKg)
    const { bmi, bmiLevel } = calcBmi(h, w)
    this.setData({ bmi, bmiLevel })
  },

  selectGoal(e) {
    this.setData({ healthGoal: e.currentTarget.dataset.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  saveProfile() {
    const { gender, age, heightCm, weightKg, bmi, bmiLevel, healthGoal, remark, mode } = this.data

    if (!gender) {
      wx.showToast({ title: '请选择性别', icon: 'none' })
      return
    }
    if (!age || Number(age) <= 0) {
      wx.showToast({ title: '请输入年龄', icon: 'none' })
      return
    }
    if (!heightCm || Number(heightCm) <= 0) {
      wx.showToast({ title: '请输入身高', icon: 'none' })
      return
    }
    if (!weightKg || Number(weightKg) <= 0) {
      wx.showToast({ title: '请输入体重', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    wx.cloud.callFunction({
      name: 'userProfile',
      data: {
        action: 'update',
        data: {
          gender,
          age: Number(age),
          heightCm: Number(heightCm),
          weightKg: Number(weightKg),
          bmi,
          bmiLevel,
          healthGoal: healthGoal || '轻盈健康',
          remark,
          calorieTarget: 1800,
          proteinTarget: 90
        }
      }
    })
      .then(res => {
        this.setData({ saving: false })
        const result = res.result || {}
        if (result.error) {
          console.error('userProfile save failed:', result)
          wx.showToast({ title: result.message || '保存失败，请重试', icon: 'none' })
          return
        }

        const app = getApp()
        const saved = result.user
        if (saved) {
          app.globalData.user = saved
        }
        if (!app.globalData.user) app.globalData.user = {}
        app.globalData.user.profileCompleted = true
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          if (mode === 'edit') {
            wx.navigateBack()
          } else {
            wx.switchTab({ url: '/pages/home/index' })
          }
        }, 500)
      })
      .catch(err => {
        console.error('userProfile cloud call failed:', err)
        this.setData({ saving: false })
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
  }
})
