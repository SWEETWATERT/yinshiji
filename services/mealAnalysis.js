const { FOOD_DATABASE, getFoodById, buildFoodItem, searchFoodsByKeyword } = require('../mock/foodDatabase')
const fatsecretApi = require('./fatsecretApi')

// ── 关键词 → 食物 ID 映射（菜品优先于单品匹配）────────────
const KEYWORD_FOOD_MAP = [
  // 菜品（先匹配，避免"番茄"匹配到"番茄炒蛋"中的番茄单品）
  { kws: ['番茄炒蛋', '西红柿炒鸡蛋', '蕃茄炒蛋'],   id: 'dish_tomato_egg',     wg: 200 },
  { kws: ['清炒青菜', '素炒青菜', '炒青菜', '时蔬'],   id: 'dish_stir_greens',    wg: 150 },
  { kws: ['蒸蛋', '水蒸蛋', '鸡蛋羹'],               id: 'dish_steamed_egg',    wg: 150 },
  { kws: ['鸡胸肉沙拉', '鸡肉沙拉'],                  id: 'dish_chicken_salad',  wg: 250 },
  { kws: ['牛肉饭', '牛肉盖饭'],                      id: 'dish_beef_rice',      wg: 350 },
  { kws: ['蛋炒饭', '炒饭', '扬州炒饭'],               id: 'dish_fried_rice',     wg: 250 },
  { kws: ['炒粉', '炒米粉'],                          id: 'dish_fried_noodles',  wg: 300 },
  { kws: ['螺蛳粉', '柳州烫粉', '柳州螺蛳粉'],         id: 'dish_luosifen',       wg: 400 },
  { kws: ['桂林米粉', '桂林粉'],                      id: 'dish_guilin_noodles', wg: 350 },
  // 主食
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
  // 蛋白质
  { kws: ['鸡胸肉', '鸡胸', '水煮鸡胸'],               id: 'pro_chicken_breast',  wg: 120 },
  { kws: ['鸡腿', '鸡腿肉', '烤鸡腿'],                 id: 'pro_chicken_leg',     wg: 120 },
  { kws: ['三文鱼', '鲑鱼'],                           id: 'pro_salmon',          wg: 100 },
  { kws: ['牛肉', '瘦牛肉', '牛里脊'],                  id: 'pro_beef',            wg: 100 },
  { kws: ['猪肉', '猪瘦肉', '里脊'],                    id: 'pro_pork_lean',       wg: 100 },
  { kws: ['鱼', '鱼肉', '草鱼', '鲈鱼', '清蒸鱼'],      id: 'pro_fish',            wg: 120 },
  { kws: ['虾', '大虾', '基围虾', '虾仁'],              id: 'pro_shrimp',          wg: 100 },
  { kws: ['豆腐'],                                    id: 'pro_tofu',            wg: 150 },
  { kws: ['鸡蛋', '煮蛋', '荷包蛋', '煎蛋', '炒蛋'],   id: 'pro_egg',             wg: 55  },
  // 蔬菜
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
  // 水果
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
  // 饮品
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

// ── 分类判断 ─────────────────────────────────────
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

// ── 从 note 提取匹配条目（返回 keyword + localFoodId + weightG）──
function _extractMatches(note) {
  if (!note || !note.trim()) return []

  const matches = []
  const usedIds = new Set()

  for (const mapping of KEYWORD_FOOD_MAP) {
    if (usedIds.has(mapping.id)) continue
    const matchedKw = mapping.kws.find(kw => note.includes(kw))
    if (matchedKw) {
      matches.push({ keyword: matchedKw, foodId: mapping.id, weightG: mapping.wg })
      usedIds.add(mapping.id)
    }
  }

  // 兜底：note 含"蔬菜/青菜"但无具体蔬菜 → 清炒青菜
  const vegKws = ['蔬菜', '绿叶菜', '青菜', '时蔬', '素菜']
  if (vegKws.some(kw => note.includes(kw)) && !matches.some(m => isVegetable(m.foodId))) {
    matches.push({ keyword: '青菜', foodId: 'dish_stir_greens', weightG: 150 })
  }

  return matches
}

// ── 汇总营养 ─────────────────────────────────────
function _calcTotals(foods) {
  return foods.reduce(
    (acc, f) => ({
      kcal:     acc.kcal + f.kcal,
      proteinG: _r1(acc.proteinG + f.proteinG),
      carbsG:   _r1(acc.carbsG + f.carbsG),
      fatG:     _r1(acc.fatG + f.fatG),
      fiberG:   _r1(acc.fiberG + f.fiberG)
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  )
}

// ── 生成 warnings ────────────────────────────────
function _buildWarnings(foods) {
  if (!foods.length) return []
  const warnings = []
  if (!foods.some(f => isProtein(f.foodId))) {
    warnings.push('未识别到明显蛋白质食物（鸡蛋、鱼肉、豆腐等），如有遗漏请手动添加。')
  }
  if (!foods.some(f => isStaple(f.foodId))) {
    warnings.push('未识别到明显主食（米饭、面条、面包等），如有遗漏请手动添加。')
  }
  return warnings
}

// ── 生成 AI 建议 ─────────────────────────────────
function _buildAdvice(foods, total) {
  const hasVeg     = foods.some(f => isVegetable(f.foodId))
  const hasProtein = total.proteinG >= 15
  const isHighCal  = total.kcal > 700

  if (!hasProtein && !hasVeg) {
    return '本餐蛋白质和蔬菜都偏少。建议补充鸡蛋、鱼肉或豆腐，以及绿叶蔬菜，让营养更均衡。'
  }
  if (!hasProtein) {
    return '本餐蔬菜不错，但蛋白质偏少。可以加鸡蛋、鱼肉或豆腐，有助于维持饱腹感和肌肉合成。'
  }
  if (!hasVeg) {
    return '本餐蛋白质不错，但蔬菜偏少。建议搭配西兰花、菠菜等深色蔬菜，增加膳食纤维和维生素。'
  }
  if (isHighCal) {
    return '本餐热量较高，下一餐可以适当清淡。整体营养结构不错，饭后可以散步 20 分钟帮助消化。'
  }
  return '本餐搭配均衡，蛋白质和蔬菜都有涉及。保持规律记录有助于长期建立健康饮食习惯。'
}

function _r1(n) { return Math.round(n * 10) / 10 }

// ── 构建食物条目（来自 FatSecret 数据）────────────
function _buildItemFromApiData(fsData, displayName, localFoodId, weightG, confidence) {
  const ratio = weightG / 100
  const uid   = `uid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const local = getFoodById(localFoodId)
  return {
    uid,
    foodId:     localFoodId,
    nameCn:     displayName,
    icon:       local ? local.icon : '🍽️',
    weightG,
    kcal:       Math.round(fsData.kcalPer100g * ratio),
    proteinG:   _r1(fsData.proteinPer100g * ratio),
    carbsG:     _r1(fsData.carbsPer100g * ratio),
    fatG:       _r1(fsData.fatPer100g * ratio),
    fiberG:     _r1(fsData.fiberPer100g * ratio),
    needUserConfirm: confidence < 0.9,
    _kcalPer100g:    fsData.kcalPer100g,
    _proteinPer100g: fsData.proteinPer100g,
    _carbsPer100g:   fsData.carbsPer100g,
    _fatPer100g:     fsData.fatPer100g,
    _fiberPer100g:   fsData.fiberPer100g
  }
}

// ── 解析单个食物条目（优先 FatSecret，回退本地库）────
function _resolveFood(match) {
  return fatsecretApi.searchFood(match.keyword)
    .then(fsData => {
      if (fsData) {
        return _buildItemFromApiData(fsData, match.keyword, match.foodId, match.weightG, 0.9)
      }
      // FatSecret returned nothing → local DB
      const food = getFoodById(match.foodId)
      return food ? buildFoodItem(food, match.weightG, 0.85) : null
    })
    .catch(() => {
      // FatSecret failed (no secret / network error) → local DB
      const food = getFoodById(match.foodId)
      return food ? buildFoodItem(food, match.weightG, 0.85) : null
    })
}

// ── 对外接口 ─────────────────────────────────────

/**
 * 分析餐食（返回 Promise）
 * 有 FatSecret 凭证 → 调用真实营养数据 API
 * 无凭证或接口失败 → 回退到本地食物数据库
 */
function analyzeMealImage({ imageUrl, imagePath, mealType, note }) {
  const url     = imageUrl || imagePath || ''
  const matches = _extractMatches(note)

  if (matches.length === 0) {
    return Promise.resolve({
      analysisId:    'ana_' + Date.now(),
      imageUrl:      url,
      detectedFoods: [],
      total:         { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      warnings:      ['未从备注中识别到具体食物。请在备注中输入您吃了什么（如：苹果、白米饭、鸡胸肉），系统将自动匹配营养数据。'],
      aiAdvice:      ''
    })
  }

  return Promise.all(matches.map(_resolveFood)).then(resolved => {
    const detectedFoods = resolved.filter(Boolean)
    const total         = _calcTotals(detectedFoods)
    return {
      analysisId:    'ana_' + Date.now(),
      imageUrl:      url,
      detectedFoods,
      total,
      warnings:  _buildWarnings(detectedFoods),
      aiAdvice:  _buildAdvice(detectedFoods, total)
    }
  })
}

/**
 * 根据 uid 调整食物重量，并重算该食物的营养
 */
function recalcFoodWeight(food, newWeightG) {
  const ratio = newWeightG / 100
  return {
    ...food,
    weightG:  newWeightG,
    kcal:     Math.round(food._kcalPer100g * ratio),
    proteinG: _r1(food._proteinPer100g * ratio),
    carbsG:   _r1(food._carbsPer100g * ratio),
    fatG:     _r1(food._fatPer100g * ratio),
    fiberG:   _r1(food._fiberPer100g * ratio)
  }
}

module.exports = {
  analyzeMealImage,
  recalcFoodWeight,
  searchFoodsByKeyword,
  _calcTotals
}
