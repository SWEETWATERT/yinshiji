const { calculateHealthScore } = require('../../utils/nutrition')

function _num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function _r1(n) { return Math.round(_num(n) * 10) / 10 }

function _safeWeight(food) {
  return Math.max(0, _num(food.weightG || food.amount || food.estimatedWeightG || food.weight || 0))
}

function _pickName(food) {
  return String(food.nameCn || food.name || food.foodName || food.title || '').trim()
}

function _per100(food, keys, totalValue, weightG) {
  for (const key of keys) {
    const value = _num(food[key], NaN)
    if (Number.isFinite(value)) return value
  }
  if (weightG > 0) return _r1((_num(totalValue) / weightG) * 100)
  return 0
}

function _calcTotals(foods) {
  return foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + _num(f.kcal),
      proteinG: _r1(acc.proteinG + _num(f.proteinG || f.protein)),
      carbsG: _r1(acc.carbsG + _num(f.carbsG || f.carbs)),
      fatG: _r1(acc.fatG + _num(f.fatG || f.fat)),
      fiberG: _r1(acc.fiberG + _num(f.fiberG || f.fiber))
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  )
}

function recalcFoodWeight(food, newWeightG) {
  const weightG = Math.max(0, _num(newWeightG))
  const ratio = weightG / 100
  return {
    ...food,
    weightG,
    amount: weightG,
    estimatedWeightG: weightG,
    kcal: Math.round(_num(food._kcalPer100g) * ratio),
    proteinG: _r1(_num(food._proteinPer100g) * ratio),
    carbsG: _r1(_num(food._carbsPer100g) * ratio),
    fatG: _r1(_num(food._fatPer100g) * ratio),
    fiberG: _r1(_num(food._fiberPer100g) * ratio),
    weightConfidence: 'user_confirmed',
    needUserConfirm: false,
    estimateNote: food._hasNutrition ? '已手动调整份量' : '未匹配营养数据，营养暂按 0 计算'
  }
}

function normalizeFood(food = {}, index = 0) {
  const weightG = _safeWeight(food) || 100
  const name = _pickName(food)
  const normalized = {
    ...food,
    uid: food.uid || food.id || food.foodId || `food_${Date.now()}_${index}_${Math.floor(Math.random() * 10000)}`,
    foodId: food.foodId || food.id || '',
    nameCn: name,
    name: food.name || name,
    foodName: food.foodName || name,
    icon: food.icon || '🍽️',
    weightG,
    amount: weightG,
    estimatedWeightG: weightG,
    kcal: Math.round(_num(food.kcal)),
    proteinG: _r1(_num(food.proteinG || food.protein)),
    carbsG: _r1(_num(food.carbsG || food.carbs)),
    fatG: _r1(_num(food.fatG || food.fat)),
    fiberG: _r1(_num(food.fiberG || food.fiber)),
    matchedKeyword: food.matchedKeyword || '',
    recognitionSource: food.recognitionSource || food.source || '',
    confidence: _num(food.confidence),
    confidenceLabel: food.confidenceLabel || '',
    weightConfidence: food.weightConfidence || 'user_confirm_required',
    needUserConfirm: food.needUserConfirm !== false,
    source: food.source || 'analysis_result'
  }

  normalized._kcalPer100g = _per100(food, ['_kcalPer100g', 'kcalPer100g'], normalized.kcal, weightG)
  normalized._proteinPer100g = _per100(food, ['_proteinPer100g', 'proteinPer100g'], normalized.proteinG, weightG)
  normalized._carbsPer100g = _per100(food, ['_carbsPer100g', 'carbsPer100g'], normalized.carbsG, weightG)
  normalized._fatPer100g = _per100(food, ['_fatPer100g', 'fatPer100g'], normalized.fatG, weightG)
  normalized._fiberPer100g = _per100(food, ['_fiberPer100g', 'fiberPer100g'], normalized.fiberG, weightG)
  normalized._hasNutrition = Boolean(
    normalized._kcalPer100g || normalized._proteinPer100g || normalized._carbsPer100g ||
    normalized._fatPer100g || normalized._fiberPer100g
  )

  return recalcFoodWeight(normalized, weightG)
}

function getRecognitionLabel(source, provider) {
  if (source === 'vision_placeholder') return '图片占位识别'
  if (source === 'keyword_fallback' && provider === 'mock_keyword') return '关键词估算'
  if (source === 'keyword_fallback') return '食物库匹配'
  if (source) return source
  return '食物库匹配'
}

Page({
  data: {
    imageUrl: '',
    mealType: 'lunch',
    note: '',
    mode: 'create',
    recordId: '',
    recordDate: '',
    recordTime: '',
    loading: true,
    errorMessage: '',
    analysisId: '',
    detectedFoods: [],
    candidates: [],
    total: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    warnings: [],
    aiAdvice: '',
    recognitionSource: '',
    recognitionLabel: '食物库匹配',
    modelProvider: '',
    modelVersion: '',
    confidence: 0,
    confidencePercent: 0,
    needReview: false,
    visionResult: null,
    showSearch: false,
    searchKeyword: '',
    searchResults: [],
    searchLoading: false,
    searchError: ''
  },

  onLoad(query) {
    const mode = query.mode || 'create'
    const recordId = decodeURIComponent(query.recordId || query.mealRecordId || '')
    const recordDate = decodeURIComponent(query.date || '')
    if (mode === 'edit' && recordId && recordDate) {
      this.setData({ mode, recordId, recordDate })
      this._loadExistingMeal(recordId, recordDate)
      return
    }

    const imageFileID = decodeURIComponent(query.imageFileID || query.imagePath || query.imageUrl || '')
    const mealType = query.mealType || 'lunch'
    const note = decodeURIComponent(query.note || '')
    this.setData({ imageUrl: imageFileID, mealType, note, mode: 'create' })
    this._doAnalyze(imageFileID, mealType, note)
  },

  _loadExistingMeal(recordId, date) {
    this.setData({ loading: true, errorMessage: '' })
    wx.cloud.callFunction({
      name: 'getMealRecords',
      data: { date }
    })
      .then(res => {
        const records = (res.result && res.result.records) || []
        const meal = records.find(item => (item._id || item.id) === recordId)
        if (!meal) {
          this.setData({
            loading: false,
            errorMessage: '没有找到要编辑的餐食记录，请从日记页重新进入。'
          })
          return
        }
        const detectedFoods = (meal.confirmedFoods || meal.foods || meal.detectedFoods || []).map(normalizeFood)
        const total = detectedFoods.length ? _calcTotals(detectedFoods) : this._normalizeTotal(meal.totalNutrition || meal.total || {})
        const confidence = _num(meal.confidence)
        const recognitionSource = meal.recognitionSource || 'manual_edit'
        const modelProvider = meal.modelProvider || ''

        this.setData({
          loading: false,
          mode: 'edit',
          recordId,
          recordDate: meal.date || date,
          recordTime: meal.time || '',
          imageUrl: meal.imageFileID || meal.imageUrl || '',
          mealType: meal.mealType || 'lunch',
          note: meal.note || '',
          analysisId: meal.analysisId || '',
          detectedFoods,
          candidates: meal.candidates || [],
          total,
          warnings: [],
          aiAdvice: meal.suggestion || meal.aiAdvice || '',
          recognitionSource,
          recognitionLabel: getRecognitionLabel(recognitionSource, modelProvider),
          modelProvider,
          modelVersion: meal.modelVersion || meal.analysisVersion || '',
          confidence,
          confidencePercent: Math.round(confidence * 100),
          needReview: Boolean(meal.needReview),
          visionResult: meal.visionResult || null
        })
      })
      .catch(() => {
        this.setData({
          loading: false,
          errorMessage: '餐食记录读取失败，请稍后重试。'
        })
      })
  },

  _doAnalyze(imageFileID, mealType, note) {
    this.setData({ loading: true, errorMessage: '' })
    wx.cloud.callFunction({
      name: 'analyzeMeal',
      data: { imageFileID, mealType, note }
    })
      .then(res => {
        const result = res.result || {}
        const detectedFoods = (result.detectedFoods || result.foods || []).map(normalizeFood)
        const total = detectedFoods.length ? _calcTotals(detectedFoods) : this._normalizeTotal(result.total || {})
        const confidence = _num(result.confidence)
        const recognitionSource = result.recognitionSource || (result.visionResult && result.visionResult.recognitionSource) || 'keyword_fallback'
        const modelProvider = result.modelProvider || (result.visionResult && result.visionResult.modelProvider) || ''

        this.setData({
          loading: false,
          analysisId: result.analysisId || '',
          imageUrl: result.imageUrl || imageFileID,
          detectedFoods,
          candidates: result.candidates || [],
          total,
          warnings: result.warnings || [],
          aiAdvice: result.aiAdvice || '',
          recognitionSource,
          recognitionLabel: getRecognitionLabel(recognitionSource, modelProvider),
          modelProvider,
          modelVersion: result.modelVersion || (result.visionResult && result.visionResult.modelVersion) || '',
          confidence,
          confidencePercent: Math.round(confidence * 100),
          needReview: Boolean(result.needReview),
          visionResult: result.visionResult || null
        })
      })
      .catch(() => {
        this.setData({ loading: false, errorMessage: '分析失败，请手动添加食物后保存。' })
        wx.showToast({ title: '分析失败，可手动添加', icon: 'none' })
      })
  },

  _normalizeTotal(total) {
    return {
      kcal: Math.round(_num(total.kcal)),
      proteinG: _r1(_num(total.proteinG || total.protein)),
      carbsG: _r1(_num(total.carbsG || total.carbs)),
      fatG: _r1(_num(total.fatG || total.fat)),
      fiberG: _r1(_num(total.fiberG || total.fiber))
    }
  },

  _refreshTotals(detectedFoods) {
    this.setData({ detectedFoods, total: _calcTotals(detectedFoods) })
  },

  deleteFood(e) {
    const uid = e.currentTarget.dataset.uid
    const detectedFoods = this.data.detectedFoods.filter(f => f.uid !== uid)
    this._refreshTotals(detectedFoods)
  },

  adjustWeight(e) {
    const { uid, delta } = e.currentTarget.dataset
    const detectedFoods = this.data.detectedFoods.map(f => {
      if (f.uid !== uid) return f
      const newW = Math.max(0, _num(f.weightG) + Number(delta))
      return recalcFoodWeight(f, newW)
    })
    this._refreshTotals(detectedFoods)
  },

  onWeightInput(e) {
    const uid = e.currentTarget.dataset.uid
    const value = e.detail.value
    const detectedFoods = this.data.detectedFoods.map(f => {
      if (f.uid !== uid) return f
      return recalcFoodWeight(f, value)
    })
    this._refreshTotals(detectedFoods)
  },

  onNameInput(e) {
    const uid = e.currentTarget.dataset.uid
    const name = String(e.detail.value || '').trim()
    const detectedFoods = this.data.detectedFoods.map(f => {
      if (f.uid !== uid) return f
      return { ...f, nameCn: name, name, foodName: name }
    })
    this.setData({ detectedFoods })
  },

  addManualFood() {
    const uid = `manual_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const item = normalizeFood({
      uid,
      nameCn: '',
      name: '',
      foodName: '',
      icon: '✍️',
      weightG: 100,
      kcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      fiberG: 0,
      confidence: 0,
      confidenceLabel: '手动添加',
      weightConfidence: 'user_confirmed',
      needUserConfirm: false,
      source: 'manual_input',
      recognitionSource: 'manual_input',
      estimateNote: '未匹配营养数据，营养暂按 0 计算'
    }, this.data.detectedFoods.length)
    const detectedFoods = [...this.data.detectedFoods, item]
    this._refreshTotals(detectedFoods)
  },

  openSearch() {
    this.setData({ showSearch: true, searchKeyword: '', searchResults: [], searchError: '' })
  },

  closeSearch() {
    this.setData({ showSearch: false })
  },

  onSearchInput(e) {
    const kw = e.detail.value
    if (!kw.trim()) {
      this.setData({ searchKeyword: kw, searchResults: [], searchError: '' })
      return
    }
    this.setData({ searchKeyword: kw })
  },

  searchFoodItems() {
    const keyword = String(this.data.searchKeyword || '').trim()
    if (!keyword) {
      wx.showToast({ title: '请输入食物名称', icon: 'none' })
      return
    }

    this.setData({ searchLoading: true, searchError: '' })
    wx.cloud.callFunction({
      name: 'searchFoodItems',
      data: {
        keyword,
        page: 1,
        pageSize: 10
      }
    })
      .then(res => {
        const result = res.result || {}
        const foods = result.foods || result.records || []
        if (this.data.searchKeyword.trim() === keyword) {
          this.setData({ searchResults: foods, searchLoading: false })
        }
      })
      .catch(err => {
        console.error('search food items failed', err)
        this.setData({
          searchLoading: false,
          searchResults: [],
          searchError: '食物库搜索失败，请确认 searchFoodItems 云函数已部署。'
        })
      })
  },

  addFoodFromSearch(e) {
    const foodId = e.currentTarget.dataset.id
    const food = this.data.searchResults.find(f => f.foodId === foodId || f.id === foodId || f._id === foodId)
    if (!food) return

    const weightG = food.defaultWeightG || 100
    const ratio = weightG / 100
    const uid = (food.foodId || food.id || food._id || 'food') + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
    const newItem = normalizeFood({
      uid,
      foodId: food.foodId || food.id || food._id || '',
      nameCn: food.nameCn || food.name || food.foodName,
      name: food.name || food.nameCn || food.foodName,
      foodName: food.foodName || food.nameCn || food.name,
      icon: food.icon || '🍽️',
      weightG,
      kcal: Math.round(_num(food.kcalPer100g) * ratio),
      proteinG: _r1(_num(food.proteinPer100g) * ratio),
      carbsG: _r1(_num(food.carbsPer100g) * ratio),
      fatG: _r1(_num(food.fatPer100g) * ratio),
      fiberG: _r1(_num(food.fiberPer100g) * ratio),
      confidence: 1,
      confidenceLabel: '手动添加',
      weightConfidence: 'user_confirmed',
      needUserConfirm: false,
      source: 'manual_search',
      recognitionSource: 'manual_search',
      estimateNote: '用户手动添加，份量可继续调整。',
      _kcalPer100g: food.kcalPer100g,
      _proteinPer100g: food.proteinPer100g,
      _carbsPer100g: food.carbsPer100g,
      _fatPer100g: food.fatPer100g,
      _fiberPer100g: food.fiberPer100g
    }, this.data.detectedFoods.length)
    const detectedFoods = [...this.data.detectedFoods, newItem]
    this.setData({
      detectedFoods,
      total: _calcTotals(detectedFoods),
      showSearch: false,
      searchKeyword: '',
      searchResults: [],
      searchError: ''
    })
    wx.showToast({ title: `已添加 ${newItem.nameCn || '食物'}`, icon: 'none' })
  },

  confirmSave() {
    const {
      detectedFoods, total, mealType, imageUrl, note, aiAdvice, analysisId,
      recognitionSource, modelProvider, modelVersion, confidence, needReview, candidates, visionResult,
      mode, recordId, recordDate, recordTime
    } = this.data
    if (!detectedFoods.length) {
      wx.showToast({ title: '请先添加食物', icon: 'none' })
      return
    }

    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const date = mode === 'edit' && recordDate ? recordDate : today
    const time = mode === 'edit' && recordTime ? recordTime : currentTime
    const foods = detectedFoods.map(f => ({
      id: f.uid,
      foodId: f.foodId,
      name: f.nameCn || f.name || f.foodName || '未命名食物',
      nameCn: f.nameCn || f.name || f.foodName || '未命名食物',
      foodName: f.foodName || f.nameCn || f.name || '未命名食物',
      weight: _num(f.weightG),
      weightG: _num(f.weightG),
      amount: _num(f.weightG),
      kcal: Math.round(_num(f.kcal)),
      protein: _r1(_num(f.proteinG)),
      proteinG: _r1(_num(f.proteinG)),
      carbs: _r1(_num(f.carbsG)),
      carbsG: _r1(_num(f.carbsG)),
      fat: _r1(_num(f.fatG)),
      fatG: _r1(_num(f.fatG)),
      fiber: _r1(_num(f.fiberG)),
      fiberG: _r1(_num(f.fiberG)),
      confidence: _num(f.confidence),
      confidenceLabel: f.confidenceLabel,
      weightConfidence: f.weightConfidence,
      source: f.source,
      recognitionSource: f.recognitionSource,
      matchedKeyword: f.matchedKeyword,
      estimateNote: f.estimateNote,
      kcalPer100g: _num(f._kcalPer100g),
      proteinPer100g: _num(f._proteinPer100g),
      carbsPer100g: _num(f._carbsPer100g),
      fatPer100g: _num(f._fatPer100g),
      fiberPer100g: _num(f._fiberPer100g)
    }))

    wx.cloud.callFunction({
      name: 'saveMealRecord',
      data: {
        recordId: mode === 'edit' ? recordId : '',
        mealType,
        date,
        time,
        imageFileID: imageUrl,
        note,
        foods,
        detectedFoods: foods,
        total,
        totalNutrition: {
          kcal: total.kcal,
          protein: total.proteinG,
          carbs: total.carbsG,
          fat: total.fatG,
          fiber: total.fiberG
        },
        healthScore: calculateHealthScore(total),
        suggestion: aiAdvice,
        analysisId,
        analysisVersion: modelVersion || 'nutrition_estimate_v1',
        recognitionSource,
        modelProvider,
        modelVersion,
        confidence,
        needReview,
        candidates,
        visionResult,
        uncertainty: {
          foodRecognition: recognitionSource || (detectedFoods.some(f => f.source === 'keyword_match') ? 'keyword_estimated' : 'manual'),
          weightRecognition: detectedFoods.some(f => f.weightConfidence !== 'user_confirmed') ? 'user_confirm_required' : 'user_confirmed',
          note: '营养数据为估算值，食物和份量以用户确认后的记录为准。'
        }
      }
    })
      .then(() => {
        wx.showToast({ title: mode === 'edit' ? '已更新' : '已保存', icon: 'success' })
        setTimeout(() => {
          if (mode === 'edit') {
            wx.navigateBack()
          } else {
            wx.switchTab({ url: '/pages/home/index' })
          }
        }, 500)
      })
      .catch(() => {
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
  },

  goBack() {
    wx.navigateBack()
  }
})
