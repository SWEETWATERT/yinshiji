const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const RECOGNITION_SOURCE = 'keyword_fallback'
const MODEL_PROVIDER = 'mock_keyword'
const MODEL_VERSION = 'v0.4.0-step2'

const KEYWORD_FOOD_MAP = [
  { kws: ['番茄炒蛋', '西红柿炒鸡蛋', '蕃茄炒蛋'],   id: 'dish_tomato_egg',     wg: 200 },
  { kws: ['清炒青菜', '素炒青菜', '炒青菜', '时蔬'],   id: 'dish_stir_greens',    wg: 150 },
  { kws: ['蒸蛋', '水蒸蛋', '鸡蛋羹'],               id: 'dish_steamed_egg',    wg: 150 },
  { kws: ['鸡胸肉沙拉', '鸡肉沙拉'],                  id: 'dish_chicken_salad',  wg: 250 },
  { kws: ['牛肉饭', '牛肉盖饭'],                      id: 'dish_beef_rice',      wg: 350 },
  { kws: ['蛋炒饭', '炒饭', '扬州炒饭'],               id: 'dish_fried_rice',     wg: 250 },
  { kws: ['炒粉', '炒米粉'],                          id: 'dish_fried_noodles',  wg: 300 },
  { kws: ['螺蛳粉', '柳州烫粉', '柳州螺蛳粉'],         id: 'dish_luosifen',       wg: 400 },
  { kws: ['桂林米粉', '桂林粉'],                      id: 'dish_guilin_noodles', wg: 350 },
  { kws: ['糙米饭', '糙米'],                          id: 'sta_brown_rice',      wg: 150 },
  { kws: ['杂粮饭', '五谷饭'],                         id: 'sta_mixed_grain',     wg: 150 },
  { kws: ['粥', '稀饭', '白粥', '米粥'],               id: 'sta_porridge',        wg: 300 },
  { kws: ['燕麦', '燕麦粥', '麦片'],                   id: 'sta_oats',            wg: 80  },
  { kws: ['面条', '拉面', '乌冬面'],                    id: 'sta_noodles',         wg: 200 },
  { kws: ['米粉', '河粉', '米线'],                     id: 'sta_rice_noodles',    wg: 200 },
  { kws: ['馒头'],                                    id: 'sta_steamed_bun',     wg: 80  },
  { kws: ['包子'],                                    id: 'sta_baozi',           wg: 100 },
  { kws: ['面包', '吐司'],                             id: 'sta_bread',           wg: 60  },
  { kws: ['红薯', '地瓜', '番薯'],                     id: 'sta_sweet_potato',    wg: 150 },
  { kws: ['玉米', '玉米棒'],                           id: 'sta_corn',            wg: 150 },
  { kws: ['土豆', '马铃薯'],                           id: 'sta_potato',          wg: 150 },
  { kws: ['白米饭', '米饭', '白饭'],                    id: 'sta_white_rice',      wg: 150 },
  { kws: ['鸡胸肉', '鸡胸', '水煮鸡胸'],               id: 'pro_chicken_breast',  wg: 120 },
  { kws: ['鸡腿', '鸡腿肉', '烤鸡腿'],                 id: 'pro_chicken_leg',     wg: 120 },
  { kws: ['三文鱼', '鲑鱼'],                           id: 'pro_salmon',          wg: 100 },
  { kws: ['牛肉', '瘦牛肉', '牛里脊'],                  id: 'pro_beef',            wg: 100 },
  { kws: ['猪肉', '猪瘦肉', '里脊'],                    id: 'pro_pork_lean',       wg: 100 },
  { kws: ['鱼', '鱼肉', '草鱼', '鲈鱼', '清蒸鱼'],      id: 'pro_fish',            wg: 120 },
  { kws: ['虾', '大虾', '基围虾', '虾仁'],              id: 'pro_shrimp',          wg: 100 },
  { kws: ['豆腐'],                                    id: 'pro_tofu',            wg: 150 },
  { kws: ['鸡蛋', '煮蛋', '荷包蛋', '煎蛋', '炒蛋'],   id: 'pro_egg',             wg: 55  },
  { kws: ['西兰花', '花椰菜'],                          id: 'veg_broccoli',        wg: 100 },
  { kws: ['菠菜'],                                    id: 'veg_spinach',         wg: 100 },
  { kws: ['油麦菜'],                                   id: 'veg_youmaicai',       wg: 100 },
  { kws: ['生菜', '沙拉菜'],                            id: 'veg_lettuce',         wg: 80  },
  { kws: ['上海青', '青江菜', '油菜'],                   id: 'veg_bokchoy',         wg: 100 },
  { kws: ['小白菜', '白菜', '娃娃菜'],                   id: 'veg_small_cabbage',   wg: 100 },
  { kws: ['胡萝卜', '红萝卜'],                          id: 'veg_carrot',          wg: 80  },
  { kws: ['番茄', '西红柿', '圣女果'],                   id: 'veg_tomato',          wg: 100 },
  { kws: ['黄瓜', '青瓜'],                             id: 'veg_cucumber',        wg: 100 },
  { kws: ['南瓜'],                                    id: 'veg_pumpkin',         wg: 100 },
  { kws: ['蘑菇', '香菇', '金针菇', '杏鲍菇'],           id: 'veg_mushroom',        wg: 80  },
  { kws: ['芦笋'],                                    id: 'veg_asparagus',       wg: 100 },
  { kws: ['芹菜', '西芹'],                             id: 'veg_celery',          wg: 80  },
  { kws: ['苹果'],                                    id: 'fru_apple',           wg: 150 },
  { kws: ['香蕉'],                                    id: 'fru_banana',          wg: 100 },
  { kws: ['橙子', '橙', '脐橙', '橘子'],               id: 'fru_orange',          wg: 150 },
  { kws: ['蓝莓'],                                    id: 'fru_blueberry',       wg: 80  },
  { kws: ['草莓'],                                    id: 'fru_strawberry',      wg: 100 },
  { kws: ['葡萄'],                                    id: 'fru_grape',           wg: 100 },
  { kws: ['牛油果', '鳄梨'],                            id: 'fru_avocado',         wg: 60  },
  { kws: ['猕猴桃', '奇异果'],                          id: 'fru_kiwi',            wg: 100 },
  { kws: ['火龙果'],                                   id: 'fru_dragonfruit',     wg: 150 },
  { kws: ['梨', '雪梨'],                               id: 'fru_pear',            wg: 150 },
  { kws: ['牛奶', '鲜奶', '纯牛奶'],                    id: 'drk_milk',            wg: 250 },
  { kws: ['酸奶', '希腊酸奶'],                          id: 'drk_yogurt',          wg: 200 },
  { kws: ['豆浆'],                                    id: 'drk_soymilk',         wg: 250 },
  { kws: ['拿铁', '卡布奇诺'],                          id: 'drk_latte',           wg: 350 },
  { kws: ['奶茶', '珍珠奶茶'],                          id: 'drk_milk_tea',        wg: 500 },
  { kws: ['咖啡', '黑咖啡', '美式'],                    id: 'drk_black_coffee',    wg: 250 },
  { kws: ['果汁', '橙汁'],                             id: 'drk_juice',           wg: 250 },
  { kws: ['可乐', '碳酸饮料', '雪碧'],                   id: 'drk_cola',            wg: 330 },
  { kws: ['橄榄油'],                                   id: 'con_olive_oil',       wg: 10  },
  { kws: ['食用油'],                                   id: 'con_oil',             wg: 10  }
]

const COMMON_ALIAS_RULES = [
  { keyword: '米饭', nameCn: '白米饭', foodId: 'sta_white_rice', weightG: 150 },
  { keyword: '白饭', nameCn: '白米饭', foodId: 'sta_white_rice', weightG: 150 },
  { keyword: '鸡肉', nameCn: '鸡胸肉', foodId: 'pro_chicken_breast', weightG: 120 },
  { keyword: '鸡胸肉', nameCn: '鸡胸肉', foodId: 'pro_chicken_breast', weightG: 120 },
  { keyword: '西蓝花', nameCn: '西兰花', foodId: 'veg_broccoli', weightG: 100 },
  { keyword: '西兰花', nameCn: '西兰花', foodId: 'veg_broccoli', weightG: 100 }
]

function isVegetable(foodId) {
  return foodId.startsWith('veg_') || foodId === 'dish_stir_greens' || foodId === 'dish_chicken_salad'
}
function isProtein(foodId) {
  return foodId.startsWith('pro_') || foodId === 'dish_chicken_salad' || foodId === 'dish_beef_rice' || foodId === 'dish_tomato_egg' || foodId === 'dish_steamed_egg'
}
function isStaple(foodId) {
  return foodId.startsWith('sta_') ||
    ['dish_beef_rice', 'dish_fried_rice', 'dish_fried_noodles',
     'dish_luosifen', 'dish_guilin_noodles'].includes(foodId)
}

function extractMatches(note) {
  if (!note || !note.trim()) return []
  const matches = []
  const usedIds = new Set()
  for (const rule of COMMON_ALIAS_RULES) {
    if (usedIds.has(rule.foodId)) continue
    if (note.includes(rule.keyword)) {
      matches.push({
        keyword: rule.keyword,
        foodId: rule.foodId,
        nameCn: rule.nameCn,
        weightG: rule.weightG
      })
      usedIds.add(rule.foodId)
    }
  }
  for (const mapping of KEYWORD_FOOD_MAP) {
    if (usedIds.has(mapping.id)) continue
    const matchedKw = mapping.kws.find(kw => note.includes(kw))
    if (matchedKw) {
      matches.push({ keyword: matchedKw, foodId: mapping.id, weightG: mapping.wg })
      usedIds.add(mapping.id)
    }
  }
  const vegKws = ['蔬菜', '绿叶菜', '青菜', '时蔬', '素菜']
  if (vegKws.some(kw => note.includes(kw)) && !matches.some(m => isVegetable(m.foodId))) {
    matches.push({ keyword: '青菜', foodId: 'dish_stir_greens', weightG: 150 })
  }
  return matches
}

function extractFoodItemMatches(note, foodDocs, existingMatches) {
  if (!note || !note.trim()) return []
  const usedIds = new Set((existingMatches || []).map(match => match.foodId))
  const matches = []
  for (const doc of foodDocs || []) {
    if (!doc || !doc.foodId || usedIds.has(doc.foodId)) continue
    const aliases = Array.isArray(doc.aliases) ? doc.aliases : []
    const keywords = [doc.nameCn, doc.name, doc.foodName, ...aliases].filter(Boolean)
    const matchedKw = keywords.find(keyword => note.includes(keyword))
    if (matchedKw) {
      matches.push({
        keyword: matchedKw,
        foodId: doc.foodId,
        nameCn: doc.nameCn || doc.name || doc.foodName,
        weightG: Number(doc.defaultWeightG || 100)
      })
      usedIds.add(doc.foodId)
    }
  }
  return matches
}

async function getAllFoodItems() {
  const all = []
  let batch
  do {
    const res = await db.collection('food_items')
      .skip(all.length)
      .limit(100)
      .get()
    batch = res.data || []
    all.push(...batch)
  } while (batch.length === 100)
  return all
}

function r1(n) { return Math.round(n * 10) / 10 }

function confidenceFromKeyword(keyword, foodDoc) {
  const exactNames = [foodDoc.nameCn, foodDoc.name, foodDoc.foodName].filter(Boolean)
  if (exactNames.includes(keyword)) return { value: 0.7, label: '中等' }
  if ((foodDoc.aliases || []).includes(keyword)) return { value: 0.62, label: '中等' }
  return { value: 0.55, label: '较低' }
}

function normalizeFoodDoc(foodDoc) {
  return {
    foodId: foodDoc.foodId || '',
    nameCn: foodDoc.nameCn || foodDoc.name || foodDoc.foodName || '',
    name: foodDoc.name || foodDoc.nameCn || foodDoc.foodName || '',
    kcalPer100g: Number(foodDoc.kcalPer100g || 0),
    proteinPer100g: Number(foodDoc.proteinPer100g || 0),
    carbsPer100g: Number(foodDoc.carbsPer100g || 0),
    fatPer100g: Number(foodDoc.fatPer100g || 0),
    fiberPer100g: Number(foodDoc.fiberPer100g || 0)
  }
}

function buildCandidate(foodDoc, match) {
  const normalized = normalizeFoodDoc(foodDoc)
  const confidence = confidenceFromKeyword(match.keyword, foodDoc)
  return {
    ...normalized,
    matchedKeyword: match.keyword,
    weightG: match.weightG,
    confidence: confidence.value,
    confidenceLabel: confidence.label,
    recognitionSource: RECOGNITION_SOURCE
  }
}

function buildRecognitionMeta(detectedFoods) {
  if (!detectedFoods.length) {
    return {
      recognitionSource: RECOGNITION_SOURCE,
      modelProvider: MODEL_PROVIDER,
      modelVersion: MODEL_VERSION,
      confidence: 0.3,
      needReview: true
    }
  }

  const avg = detectedFoods.reduce((sum, food) => sum + Number(food.confidence || 0), 0) / detectedFoods.length
  const confidence = Math.max(0.3, Math.min(0.7, r1(avg)))
  return {
    recognitionSource: RECOGNITION_SOURCE,
    modelProvider: MODEL_PROVIDER,
    modelVersion: MODEL_VERSION,
    confidence,
    needReview: confidence < 0.6
  }
}

function buildFoodItem(foodDoc, match) {
  const normalized = normalizeFoodDoc(foodDoc)
  const weightG = match.weightG
  const ratio = weightG / 100
  const uid = normalized.foodId + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
  const confidence = confidenceFromKeyword(match.keyword, foodDoc)
  return {
    uid,
    foodId: normalized.foodId,
    nameCn: normalized.nameCn,
    name: normalized.name,
    icon: foodDoc.icon || '🍽️',
    weightG,
    kcal: Math.round(normalized.kcalPer100g * ratio),
    proteinG: r1(normalized.proteinPer100g * ratio),
    carbsG: r1(normalized.carbsPer100g * ratio),
    fatG: r1(normalized.fatPer100g * ratio),
    fiberG: r1(normalized.fiberPer100g * ratio),
    matchedKeyword: match.keyword,
    confidence: confidence.value,
    confidenceLabel: confidence.label,
    weightConfidence: 'low',
    needUserConfirm: true,
    source: 'keyword_match',
    recognitionSource: RECOGNITION_SOURCE,
    estimateNote: '食物来自备注关键词匹配，份量为常见默认值，请按实际情况确认。',
    _kcalPer100g: normalized.kcalPer100g,
    _proteinPer100g: normalized.proteinPer100g,
    _carbsPer100g: normalized.carbsPer100g,
    _fatPer100g: normalized.fatPer100g,
    _fiberPer100g: normalized.fiberPer100g
  }
}

function calcTotals(foods) {
  return foods.reduce(
    (acc, f) => ({
      kcal: acc.kcal + f.kcal,
      proteinG: r1(acc.proteinG + f.proteinG),
      carbsG: r1(acc.carbsG + f.carbsG),
      fatG: r1(acc.fatG + f.fatG),
      fiberG: r1(acc.fiberG + f.fiberG)
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  )
}

function buildWarnings(foods, imageFileID) {
  const warnings = []
  if (imageFileID) {
    warnings.push('当前版本尚未真正解析图片内容，识别主要来自备注关键词和食物库匹配；图片会随记录保存，后续可接入视觉 AI。')
  }
  if (!foods.length) return warnings
  warnings.push('热量和营养为估算值，份量使用常见默认克重。请根据实际食量调整后再保存。')
  if (!foods.some(f => isProtein(f.foodId))) {
    warnings.push('未识别到明显蛋白质食物（鸡蛋、鱼肉、豆腐等），如有遗漏请手动添加。')
  }
  if (!foods.some(f => isStaple(f.foodId))) {
    warnings.push('未识别到明显主食（米饭、面条、面包等），如有遗漏请手动添加。')
  }
  return warnings
}

function buildAdvice(foods, total) {
  const hasVeg = foods.some(f => isVegetable(f.foodId))
  const hasProtein = total.proteinG >= 15
  const isHighCal = total.kcal > 700
  if (!hasProtein && !hasVeg) {
    return '按当前已确认食物估算，本餐蛋白质和蔬菜都偏少。建议补充鸡蛋、鱼肉或豆腐，以及绿叶蔬菜，让营养更均衡。'
  }
  if (!hasProtein) {
    return '按当前估算，本餐蔬菜不错，但蛋白质偏少。可以加鸡蛋、鱼肉或豆腐，有助于维持饱腹感。'
  }
  if (!hasVeg) {
    return '按当前估算，本餐蛋白质不错，但蔬菜偏少。建议搭配西兰花、菠菜等深色蔬菜，增加膳食纤维。'
  }
  if (isHighCal) {
    return '按当前估算，本餐热量较高，下一餐可以适当清淡。整体营养结构不错，饭后可以散步 20 分钟。'
  }
  return '按当前估算，本餐搭配比较均衡，蛋白质和蔬菜都有涉及。保持规律记录有助于长期建立健康饮食习惯。'
}

async function saveAnalysisLog(openid, result, input, status) {
  try {
    await db.collection('analysis_logs').add({
      data: {
        _openid: openid,
        analysisId: result.analysisId,
        mealType: input.mealType || '',
        imageFileID: input.imageFileID || '',
        note: input.note || '',
        debugInput: input.debugInput || {},
        detectedFoods: result.detectedFoods || [],
        total: result.total || {},
        warnings: result.warnings || [],
        aiAdvice: result.aiAdvice || '',
        recognitionSource: result.recognitionSource || RECOGNITION_SOURCE,
        modelProvider: result.modelProvider || MODEL_PROVIDER,
        modelVersion: result.modelVersion || MODEL_VERSION,
        confidence: Number(result.confidence || 0),
        needReview: Boolean(result.needReview),
        candidates: result.candidates || [],
        status,
        confidenceSummary: {
          foodCount: (result.detectedFoods || []).length,
          hasImage: Boolean(input.imageFileID),
          hasNote: Boolean(input.note),
          needUserConfirm: (result.detectedFoods || []).some(food => food.needUserConfirm),
          confidence: Number(result.confidence || 0),
          needReview: Boolean(result.needReview)
        },
        createdAt: new Date()
      }
    })
  } catch (err) {
    console.warn('save analysis log failed', err)
  }
}

async function createReviewTaskIfNeeded(openid, result, input, reason) {
  const shouldReview =
    reason ||
    result.needReview ||
    (input.imageFileID && !(result.detectedFoods || []).length) ||
    (result.detectedFoods || []).some(food => food.source === 'keyword_match' || food.needUserConfirm)

  if (!shouldReview) return

  try {
    await db.collection('review_tasks').add({
      data: {
        _openid: openid,
        source: 'analysis',
        analysisId: result.analysisId,
        mealType: input.mealType || '',
        imageFileID: input.imageFileID || '',
        note: input.note || '',
        detectedFoods: result.detectedFoods || [],
        total: result.total || {},
        candidates: result.candidates || [],
        recognitionSource: result.recognitionSource || RECOGNITION_SOURCE,
        modelProvider: result.modelProvider || MODEL_PROVIDER,
        modelVersion: result.modelVersion || MODEL_VERSION,
        confidence: Number(result.confidence || 0),
        needReview: Boolean(result.needReview),
        reason: reason || 'estimated_result_needs_confirmation',
        status: 'pending',
        priority: (result.detectedFoods || []).length ? 'normal' : 'high',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
  } catch (err) {
    console.warn('create review task failed', err)
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const input = {
    ...rawEvent,
    ...rawData
  }

  const note = String(input.note || '').trim()
  const mealType = String(input.mealType || '').trim()
  const imageFileID = String(input.imageFileID || input.imageUrl || '').trim()
  const debugInput = {
    rawEventKeys: Object.keys(event || {}),
    rawDataKeys: Object.keys((event && event.data) || {}),
    note,
    mealType,
    imageFileID
  }
  const request = { note, mealType, imageFileID, debugInput }
  const analysisId = 'ana_' + Date.now()

  const foodDocs = note ? await getAllFoodItems() : []
  const keywordMatches = extractMatches(note)
  const foodItemMatches = extractFoodItemMatches(note, foodDocs, keywordMatches)
  const matches = [...keywordMatches, ...foodItemMatches]

  if (matches.length === 0) {
    const meta = buildRecognitionMeta([])
    const result = {
      analysisId,
      imageUrl: imageFileID || '',
      detectedFoods: [],
      total: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      warnings: buildWarnings([], imageFileID).concat('未从备注中识别到具体食物。请在备注中输入您吃了什么（如：苹果、白米饭、鸡胸肉），系统将自动匹配营养数据。'),
      aiAdvice: '',
      candidates: [],
      ...meta,
      debugInput
    }
    await saveAnalysisLog(OPENID, result, request, 'empty')
    await createReviewTaskIfNeeded(OPENID, result, request, 'no_food_detected')
    return result
  }

  const foodMap = {}
  for (const doc of foodDocs) {
    foodMap[doc.foodId] = doc
  }

  const detectedFoods = []
  const candidates = []
  for (const match of matches) {
    const doc = foodMap[match.foodId]
    if (doc) {
      candidates.push(buildCandidate(doc, match))
      detectedFoods.push(buildFoodItem(doc, match))
    }
  }

  const total = calcTotals(detectedFoods)
  const meta = buildRecognitionMeta(detectedFoods)

  const result = {
    analysisId,
    imageUrl: imageFileID || '',
    detectedFoods,
    total,
    warnings: buildWarnings(detectedFoods, imageFileID),
    aiAdvice: buildAdvice(detectedFoods, total),
    candidates,
    ...meta,
    debugInput
  }

  await saveAnalysisLog(OPENID, result, request, detectedFoods.length ? 'estimated' : 'empty')
  await createReviewTaskIfNeeded(OPENID, result, request)
  return result
}
