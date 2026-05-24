/**
 * 食物营养数据库 — 第一版内置 seed 数据
 * 营养值均为每 100g 可食用部分
 * 菜品营养为成品每 100g 估算值
 */

const FOOD_DATABASE = [

  // ── 主食 ──────────────────────────────────────
  {
    id: 'sta_white_rice',
    nameCn: '白米饭',
    category: '主食',
    aliases: ['米饭', '白饭', '蒸米饭', '大米饭'],
    kcalPer100g: 116, proteinPer100g: 2.6, carbsPer100g: 25.9,
    fatPer100g: 0.3, fiberPer100g: 0.3, sugarPer100g: 0, sodiumPer100gMg: 2,
    icon: '🍚', defaultWeightG: 150
  },
  {
    id: 'sta_brown_rice',
    nameCn: '糙米饭',
    category: '主食',
    aliases: ['糙米', '玄米饭'],
    kcalPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23.2,
    fatPer100g: 0.9, fiberPer100g: 1.8, sugarPer100g: 0, sodiumPer100gMg: 3,
    icon: '🍚', defaultWeightG: 150
  },
  {
    id: 'sta_mixed_grain',
    nameCn: '杂粮饭',
    category: '主食',
    aliases: ['五谷饭', '多谷饭', '杂粮粥'],
    kcalPer100g: 120, proteinPer100g: 3.2, carbsPer100g: 24.8,
    fatPer100g: 0.8, fiberPer100g: 2.5, sugarPer100g: 0, sodiumPer100gMg: 3,
    icon: '🍚', defaultWeightG: 150
  },
  {
    id: 'sta_porridge',
    nameCn: '白粥',
    category: '主食',
    aliases: ['粥', '稀饭', '米粥'],
    kcalPer100g: 46, proteinPer100g: 1.1, carbsPer100g: 10.1,
    fatPer100g: 0.1, fiberPer100g: 0.1, sugarPer100g: 0, sodiumPer100gMg: 1,
    icon: '🍜', defaultWeightG: 300
  },
  {
    id: 'sta_noodles',
    nameCn: '面条',
    category: '主食',
    aliases: ['面', '拉面', '乌冬面', '细面', '宽面', '煮面'],
    kcalPer100g: 109, proteinPer100g: 3.7, carbsPer100g: 22.0,
    fatPer100g: 0.6, fiberPer100g: 1.0, sugarPer100g: 0, sodiumPer100gMg: 10,
    icon: '🍜', defaultWeightG: 200
  },
  {
    id: 'sta_rice_noodles',
    nameCn: '米粉',
    category: '主食',
    aliases: ['河粉', '细米粉', '粗米粉', '米线'],
    kcalPer100g: 104, proteinPer100g: 1.6, carbsPer100g: 24.0,
    fatPer100g: 0.1, fiberPer100g: 0.3, sugarPer100g: 0, sodiumPer100gMg: 8,
    icon: '🍜', defaultWeightG: 200
  },
  {
    id: 'sta_steamed_bun',
    nameCn: '馒头',
    category: '主食',
    aliases: ['白馒头', '花卷'],
    kcalPer100g: 223, proteinPer100g: 7.0, carbsPer100g: 47.0,
    fatPer100g: 1.1, fiberPer100g: 1.2, sugarPer100g: 2, sodiumPer100gMg: 180,
    icon: '🥟', defaultWeightG: 80
  },
  {
    id: 'sta_baozi',
    nameCn: '包子',
    category: '主食',
    aliases: ['肉包', '菜包', '豆沙包'],
    kcalPer100g: 238, proteinPer100g: 9.1, carbsPer100g: 40.0,
    fatPer100g: 5.2, fiberPer100g: 0.9, sugarPer100g: 3, sodiumPer100gMg: 250,
    icon: '🥟', defaultWeightG: 100
  },
  {
    id: 'sta_bread',
    nameCn: '面包',
    category: '主食',
    aliases: ['白面包', '吐司', '全麦面包', '全麦吐司'],
    kcalPer100g: 265, proteinPer100g: 8.3, carbsPer100g: 53.2,
    fatPer100g: 2.3, fiberPer100g: 1.2, sugarPer100g: 6, sodiumPer100gMg: 400,
    icon: '🍞', defaultWeightG: 60
  },
  {
    id: 'sta_oats',
    nameCn: '燕麦',
    category: '主食',
    aliases: ['燕麦片', '麦片', '燕麦粥', '即食燕麦'],
    kcalPer100g: 84, proteinPer100g: 2.9, carbsPer100g: 14.2,
    fatPer100g: 1.5, fiberPer100g: 1.7, sugarPer100g: 0, sodiumPer100gMg: 5,
    icon: '🥣', defaultWeightG: 80
  },
  {
    id: 'sta_sweet_potato',
    nameCn: '红薯',
    category: '主食',
    aliases: ['地瓜', '番薯', '烤红薯', '蒸红薯'],
    kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20.1,
    fatPer100g: 0.2, fiberPer100g: 1.6, sugarPer100g: 4, sodiumPer100gMg: 36,
    icon: '🍠', defaultWeightG: 150
  },
  {
    id: 'sta_corn',
    nameCn: '玉米',
    category: '主食',
    aliases: ['玉米棒', '甜玉米', '煮玉米', '玉米粒'],
    kcalPer100g: 106, proteinPer100g: 3.4, carbsPer100g: 22.0,
    fatPer100g: 1.2, fiberPer100g: 2.0, sugarPer100g: 6, sodiumPer100gMg: 1,
    icon: '🌽', defaultWeightG: 150
  },
  {
    id: 'sta_potato',
    nameCn: '土豆',
    category: '主食',
    aliases: ['马铃薯', '薯仔', '洋芋', '蒸土豆'],
    kcalPer100g: 77, proteinPer100g: 2.0, carbsPer100g: 17.2,
    fatPer100g: 0.1, fiberPer100g: 0.7, sugarPer100g: 1, sodiumPer100gMg: 7,
    icon: '🥔', defaultWeightG: 150
  },

  // ── 蛋白质 ────────────────────────────────────
  {
    id: 'pro_egg',
    nameCn: '鸡蛋',
    category: '蛋白质',
    aliases: ['白煮蛋', '煮鸡蛋', '荷包蛋', '煎蛋', '炒鸡蛋', '全蛋'],
    kcalPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.7,
    fatPer100g: 9.5, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 133,
    icon: '🥚', defaultWeightG: 55
  },
  {
    id: 'pro_chicken_breast',
    nameCn: '鸡胸肉',
    category: '蛋白质',
    aliases: ['鸡胸', '水煮鸡胸', '鸡胸肉片', '白切鸡胸'],
    kcalPer100g: 133, proteinPer100g: 26.7, carbsPer100g: 0,
    fatPer100g: 2.5, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 60,
    icon: '🍗', defaultWeightG: 120
  },
  {
    id: 'pro_chicken_leg',
    nameCn: '鸡腿肉',
    category: '蛋白质',
    aliases: ['鸡腿', '烤鸡腿', '卤鸡腿', '去骨鸡腿'],
    kcalPer100g: 181, proteinPer100g: 18.2, carbsPer100g: 0,
    fatPer100g: 11.6, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 70,
    icon: '🍗', defaultWeightG: 120
  },
  {
    id: 'pro_beef',
    nameCn: '牛肉',
    category: '蛋白质',
    aliases: ['瘦牛肉', '牛里脊', '牛肉片', '炒牛肉'],
    kcalPer100g: 106, proteinPer100g: 20.2, carbsPer100g: 0,
    fatPer100g: 2.3, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 57,
    icon: '🥩', defaultWeightG: 100
  },
  {
    id: 'pro_pork_lean',
    nameCn: '猪瘦肉',
    category: '蛋白质',
    aliases: ['猪肉', '猪里脊', '瘦猪肉', '猪肉片'],
    kcalPer100g: 143, proteinPer100g: 20.3, carbsPer100g: 0,
    fatPer100g: 6.2, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 62,
    icon: '🥩', defaultWeightG: 100
  },
  {
    id: 'pro_fish',
    nameCn: '鱼肉',
    category: '蛋白质',
    aliases: ['鱼', '草鱼', '鲈鱼', '鳕鱼', '清蒸鱼', '烤鱼'],
    kcalPer100g: 113, proteinPer100g: 17.9, carbsPer100g: 0,
    fatPer100g: 4.3, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 78,
    icon: '🐟', defaultWeightG: 120
  },
  {
    id: 'pro_shrimp',
    nameCn: '虾',
    category: '蛋白质',
    aliases: ['大虾', '基围虾', '虾仁', '白灼虾', '水煮虾'],
    kcalPer100g: 93, proteinPer100g: 18.6, carbsPer100g: 2.8,
    fatPer100g: 0.9, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 302,
    icon: '🍤', defaultWeightG: 100
  },
  {
    id: 'pro_tofu',
    nameCn: '豆腐',
    category: '蛋白质',
    aliases: ['嫩豆腐', '老豆腐', '北豆腐', '南豆腐'],
    kcalPer100g: 81, proteinPer100g: 8.1, carbsPer100g: 3.2,
    fatPer100g: 3.7, fiberPer100g: 0.4, sugarPer100g: 0, sodiumPer100gMg: 7,
    icon: '🫘', defaultWeightG: 150
  },
  {
    id: 'pro_salmon',
    nameCn: '三文鱼',
    category: '蛋白质',
    aliases: ['鲑鱼', '烟熏三文鱼', '三文鱼刺身', '三文鱼排'],
    kcalPer100g: 208, proteinPer100g: 20.0, carbsPer100g: 0,
    fatPer100g: 13.8, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 59,
    icon: '🐟', defaultWeightG: 100
  },

  // ── 蔬菜 ──────────────────────────────────────
  {
    id: 'veg_broccoli',
    nameCn: '西兰花',
    category: '蔬菜',
    aliases: ['花椰菜', '绿花菜', '西蓝花', '嫩茎花椰菜'],
    kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 6.6,
    fatPer100g: 0.4, fiberPer100g: 2.6, sugarPer100g: 1.7, sodiumPer100gMg: 33,
    icon: '🥦', defaultWeightG: 100
  },
  {
    id: 'veg_spinach',
    nameCn: '菠菜',
    category: '蔬菜',
    aliases: ['菠菜叶', '嫩菠菜'],
    kcalPer100g: 24, proteinPer100g: 2.6, carbsPer100g: 3.0,
    fatPer100g: 0.5, fiberPer100g: 1.7, sugarPer100g: 0.4, sodiumPer100gMg: 79,
    icon: '🥬', defaultWeightG: 100
  },
  {
    id: 'veg_youmaicai',
    nameCn: '油麦菜',
    category: '蔬菜',
    aliases: ['油麦', '莜麦菜'],
    kcalPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.1,
    fatPer100g: 0.3, fiberPer100g: 0.8, sugarPer100g: 0, sodiumPer100gMg: 35,
    icon: '🥬', defaultWeightG: 100
  },
  {
    id: 'veg_lettuce',
    nameCn: '生菜',
    category: '蔬菜',
    aliases: ['罗马生菜', '奶油生菜', '球形生菜', '沙拉菜'],
    kcalPer100g: 13, proteinPer100g: 1.3, carbsPer100g: 1.7,
    fatPer100g: 0.3, fiberPer100g: 0.7, sugarPer100g: 0.8, sodiumPer100gMg: 28,
    icon: '🥬', defaultWeightG: 80
  },
  {
    id: 'veg_bokchoy',
    nameCn: '上海青',
    category: '蔬菜',
    aliases: ['青江菜', '油菜', '小油菜', '青菜'],
    kcalPer100g: 15, proteinPer100g: 1.9, carbsPer100g: 1.6,
    fatPer100g: 0.3, fiberPer100g: 1.1, sugarPer100g: 0, sodiumPer100gMg: 73,
    icon: '🥬', defaultWeightG: 100
  },
  {
    id: 'veg_small_cabbage',
    nameCn: '小白菜',
    category: '蔬菜',
    aliases: ['白菜', '大白菜', '娃娃菜'],
    kcalPer100g: 14, proteinPer100g: 1.5, carbsPer100g: 1.6,
    fatPer100g: 0.3, fiberPer100g: 1.1, sugarPer100g: 0, sodiumPer100gMg: 65,
    icon: '🥬', defaultWeightG: 100
  },
  {
    id: 'veg_carrot',
    nameCn: '胡萝卜',
    category: '蔬菜',
    aliases: ['红萝卜', '胡萝卜丝', '胡萝卜片'],
    kcalPer100g: 32, proteinPer100g: 0.8, carbsPer100g: 7.1,
    fatPer100g: 0.2, fiberPer100g: 1.0, sugarPer100g: 4.7, sodiumPer100gMg: 69,
    icon: '🥕', defaultWeightG: 80
  },
  {
    id: 'veg_tomato',
    nameCn: '番茄',
    category: '蔬菜',
    aliases: ['西红柿', '圣女果', '小番茄', '大番茄'],
    kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.3,
    fatPer100g: 0.2, fiberPer100g: 0.5, sugarPer100g: 2.6, sodiumPer100gMg: 5,
    icon: '🍅', defaultWeightG: 100
  },
  {
    id: 'veg_cucumber',
    nameCn: '黄瓜',
    category: '蔬菜',
    aliases: ['青瓜', '嫩黄瓜', '黄瓜片'],
    kcalPer100g: 15, proteinPer100g: 0.8, carbsPer100g: 2.9,
    fatPer100g: 0.1, fiberPer100g: 0.5, sugarPer100g: 1.7, sodiumPer100gMg: 2,
    icon: '🥒', defaultWeightG: 100
  },
  {
    id: 'veg_pumpkin',
    nameCn: '南瓜',
    category: '蔬菜',
    aliases: ['贝贝南瓜', '老南瓜', '蒸南瓜'],
    kcalPer100g: 23, proteinPer100g: 0.7, carbsPer100g: 5.3,
    fatPer100g: 0.1, fiberPer100g: 0.8, sugarPer100g: 2.5, sodiumPer100gMg: 1,
    icon: '🎃', defaultWeightG: 100
  },
  {
    id: 'veg_mushroom',
    nameCn: '蘑菇',
    category: '蔬菜',
    aliases: ['香菇', '金针菇', '杏鲍菇', '平菇', '口蘑'],
    kcalPer100g: 20, proteinPer100g: 2.7, carbsPer100g: 2.5,
    fatPer100g: 0.1, fiberPer100g: 1.3, sugarPer100g: 0, sodiumPer100gMg: 5,
    icon: '🍄', defaultWeightG: 80
  },
  {
    id: 'veg_asparagus',
    nameCn: '芦笋',
    category: '蔬菜',
    aliases: ['白芦笋', '绿芦笋', '烤芦笋'],
    kcalPer100g: 20, proteinPer100g: 2.2, carbsPer100g: 3.9,
    fatPer100g: 0.1, fiberPer100g: 2.1, sugarPer100g: 1.9, sodiumPer100gMg: 2,
    icon: '🌿', defaultWeightG: 100
  },
  {
    id: 'veg_celery',
    nameCn: '芹菜',
    category: '蔬菜',
    aliases: ['西芹', '水芹', '芹菜茎'],
    kcalPer100g: 16, proteinPer100g: 0.6, carbsPer100g: 3.9,
    fatPer100g: 0.1, fiberPer100g: 1.4, sugarPer100g: 1.8, sodiumPer100gMg: 80,
    icon: '🌿', defaultWeightG: 80
  },

  // ── 水果 ──────────────────────────────────────
  {
    id: 'fru_apple',
    nameCn: '苹果',
    category: '水果',
    aliases: ['红苹果', '绿苹果', '富士苹果'],
    kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 13.8,
    fatPer100g: 0.2, fiberPer100g: 2.4, sugarPer100g: 10.4, sodiumPer100gMg: 1,
    icon: '🍎', defaultWeightG: 150
  },
  {
    id: 'fru_banana',
    nameCn: '香蕉',
    category: '水果',
    aliases: ['香蕉', '芭蕉'],
    kcalPer100g: 93, proteinPer100g: 1.1, carbsPer100g: 21.0,
    fatPer100g: 0.3, fiberPer100g: 2.6, sugarPer100g: 12.2, sodiumPer100gMg: 1,
    icon: '🍌', defaultWeightG: 100
  },
  {
    id: 'fru_orange',
    nameCn: '橙子',
    category: '水果',
    aliases: ['橙', '脐橙', '甜橙', '橘子', '柑橘'],
    kcalPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 11.8,
    fatPer100g: 0.1, fiberPer100g: 2.4, sugarPer100g: 9.4, sodiumPer100gMg: 0,
    icon: '🍊', defaultWeightG: 150
  },
  {
    id: 'fru_blueberry',
    nameCn: '蓝莓',
    category: '水果',
    aliases: ['冻蓝莓', '新鲜蓝莓'],
    kcalPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14.5,
    fatPer100g: 0.3, fiberPer100g: 2.4, sugarPer100g: 9.9, sodiumPer100gMg: 1,
    icon: '🫐', defaultWeightG: 80
  },
  {
    id: 'fru_strawberry',
    nameCn: '草莓',
    category: '水果',
    aliases: ['新鲜草莓'],
    kcalPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7,
    fatPer100g: 0.3, fiberPer100g: 2.0, sugarPer100g: 4.9, sodiumPer100gMg: 1,
    icon: '🍓', defaultWeightG: 100
  },
  {
    id: 'fru_grape',
    nameCn: '葡萄',
    category: '水果',
    aliases: ['红葡萄', '绿葡萄', '无籽葡萄'],
    kcalPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18.0,
    fatPer100g: 0.2, fiberPer100g: 0.9, sugarPer100g: 15.5, sodiumPer100gMg: 2,
    icon: '🍇', defaultWeightG: 100
  },
  {
    id: 'fru_avocado',
    nameCn: '牛油果',
    category: '水果',
    aliases: ['鳄梨', '油梨', '熟牛油果'],
    kcalPer100g: 160, proteinPer100g: 2.0, carbsPer100g: 9.0,
    fatPer100g: 14.7, fiberPer100g: 6.7, sugarPer100g: 0.7, sodiumPer100gMg: 7,
    icon: '🥑', defaultWeightG: 60
  },
  {
    id: 'fru_kiwi',
    nameCn: '猕猴桃',
    category: '水果',
    aliases: ['奇异果', '绿心猕猴桃', '黄心猕猴桃'],
    kcalPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 14.7,
    fatPer100g: 0.5, fiberPer100g: 3.0, sugarPer100g: 9.0, sodiumPer100gMg: 3,
    icon: '🥝', defaultWeightG: 100
  },
  {
    id: 'fru_dragonfruit',
    nameCn: '火龙果',
    category: '水果',
    aliases: ['红心火龙果', '白心火龙果'],
    kcalPer100g: 60, proteinPer100g: 1.1, carbsPer100g: 13.2,
    fatPer100g: 0.6, fiberPer100g: 1.8, sugarPer100g: 8.2, sodiumPer100gMg: 39,
    icon: '🍈', defaultWeightG: 150
  },
  {
    id: 'fru_pear',
    nameCn: '梨',
    category: '水果',
    aliases: ['雪梨', '砀山梨', '水晶梨'],
    kcalPer100g: 57, proteinPer100g: 0.4, carbsPer100g: 15.1,
    fatPer100g: 0.1, fiberPer100g: 3.1, sugarPer100g: 9.8, sodiumPer100gMg: 2,
    icon: '🍐', defaultWeightG: 150
  },

  // ── 饮品 ──────────────────────────────────────
  {
    id: 'drk_water',
    nameCn: '水',
    category: '饮品',
    aliases: ['白水', '矿泉水', '温水', '热水'],
    kcalPer100g: 0, proteinPer100g: 0, carbsPer100g: 0,
    fatPer100g: 0, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 0,
    icon: '💧', defaultWeightG: 250
  },
  {
    id: 'drk_tea',
    nameCn: '无糖茶',
    category: '饮品',
    aliases: ['绿茶', '红茶', '乌龙茶', '普洱茶', '白茶', '茶'],
    kcalPer100g: 1, proteinPer100g: 0, carbsPer100g: 0,
    fatPer100g: 0, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 3,
    icon: '🍵', defaultWeightG: 250
  },
  {
    id: 'drk_black_coffee',
    nameCn: '黑咖啡',
    category: '饮品',
    aliases: ['咖啡', '美式咖啡', '手冲咖啡', '黑咖'],
    kcalPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0,
    fatPer100g: 0, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 2,
    icon: '☕', defaultWeightG: 250
  },
  {
    id: 'drk_latte',
    nameCn: '拿铁',
    category: '饮品',
    aliases: ['拿铁咖啡', '燕麦拿铁', '抹茶拿铁', '卡布奇诺'],
    kcalPer100g: 48, proteinPer100g: 2.3, carbsPer100g: 4.9,
    fatPer100g: 1.9, fiberPer100g: 0, sugarPer100g: 4.0, sodiumPer100gMg: 40,
    icon: '☕', defaultWeightG: 350
  },
  {
    id: 'drk_milk_tea',
    nameCn: '奶茶',
    category: '饮品',
    aliases: ['珍珠奶茶', '奶盖茶', '烧仙草', '港式奶茶'],
    kcalPer100g: 70, proteinPer100g: 1.0, carbsPer100g: 13.0,
    fatPer100g: 1.5, fiberPer100g: 0, sugarPer100g: 11.0, sodiumPer100gMg: 55,
    icon: '🧋', defaultWeightG: 500
  },
  {
    id: 'drk_juice',
    nameCn: '果汁',
    category: '饮品',
    aliases: ['橙汁', '苹果汁', '鲜榨果汁', '混合果汁'],
    kcalPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10.4,
    fatPer100g: 0.2, fiberPer100g: 0.2, sugarPer100g: 8.5, sodiumPer100gMg: 1,
    icon: '🧃', defaultWeightG: 250
  },
  {
    id: 'drk_cola',
    nameCn: '可乐',
    category: '饮品',
    aliases: ['百事可乐', '可口可乐', '雪碧', '碳酸饮料'],
    kcalPer100g: 42, proteinPer100g: 0, carbsPer100g: 10.6,
    fatPer100g: 0, fiberPer100g: 0, sugarPer100g: 10.6, sodiumPer100gMg: 11,
    icon: '🥤', defaultWeightG: 330
  },
  {
    id: 'drk_milk',
    nameCn: '牛奶',
    category: '饮品',
    aliases: ['全脂牛奶', '脱脂牛奶', '低脂牛奶', '鲜奶', '纯牛奶'],
    kcalPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.7,
    fatPer100g: 3.3, fiberPer100g: 0, sugarPer100g: 4.7, sodiumPer100gMg: 42,
    icon: '🥛', defaultWeightG: 250
  },
  {
    id: 'drk_yogurt',
    nameCn: '酸奶',
    category: '饮品',
    aliases: ['原味酸奶', '希腊酸奶', '无糖酸奶', '低脂酸奶'],
    kcalPer100g: 72, proteinPer100g: 3.5, carbsPer100g: 8.0,
    fatPer100g: 1.9, fiberPer100g: 0, sugarPer100g: 7.5, sodiumPer100gMg: 46,
    icon: '🥛', defaultWeightG: 200
  },
  {
    id: 'drk_soymilk',
    nameCn: '豆浆',
    category: '饮品',
    aliases: ['无糖豆浆', '原味豆浆', '淡豆浆'],
    kcalPer100g: 31, proteinPer100g: 3.0, carbsPer100g: 1.8,
    fatPer100g: 1.6, fiberPer100g: 0.5, sugarPer100g: 0, sodiumPer100gMg: 5,
    icon: '🥛', defaultWeightG: 250
  },

  // ── 调料 ──────────────────────────────────────
  {
    id: 'con_oil',
    nameCn: '食用油',
    category: '调料',
    aliases: ['花生油', '豆油', '菜籽油', '色拉油', '植物油'],
    kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0,
    fatPer100g: 100, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 0,
    icon: '🫙', defaultWeightG: 10
  },
  {
    id: 'con_olive_oil',
    nameCn: '橄榄油',
    category: '调料',
    aliases: ['特级初榨橄榄油', '冷压橄榄油'],
    kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0,
    fatPer100g: 100, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 0,
    icon: '🫙', defaultWeightG: 10
  },

  // ── 常见菜品（成品每100g营养估算）─────────────
  {
    id: 'dish_tomato_egg',
    nameCn: '番茄炒蛋',
    category: '菜品',
    aliases: ['西红柿炒鸡蛋', '蕃茄炒蛋', '番茄炒鸡蛋'],
    kcalPer100g: 85, proteinPer100g: 5.8, carbsPer100g: 4.2,
    fatPer100g: 5.4, fiberPer100g: 0.5, sugarPer100g: 2.0, sodiumPer100gMg: 210,
    icon: '🍳', defaultWeightG: 200
  },
  {
    id: 'dish_stir_greens',
    nameCn: '清炒青菜',
    category: '菜品',
    aliases: ['素炒青菜', '炒青菜', '清炒时蔬', '素炒蔬菜'],
    kcalPer100g: 40, proteinPer100g: 1.8, carbsPer100g: 3.8,
    fatPer100g: 2.1, fiberPer100g: 1.5, sugarPer100g: 0, sodiumPer100gMg: 180,
    icon: '🥬', defaultWeightG: 150
  },
  {
    id: 'dish_steamed_egg',
    nameCn: '蒸蛋',
    category: '菜品',
    aliases: ['水蒸蛋', '鸡蛋羹', '嫩蒸蛋'],
    kcalPer100g: 79, proteinPer100g: 6.5, carbsPer100g: 1.8,
    fatPer100g: 4.8, fiberPer100g: 0, sugarPer100g: 0, sodiumPer100gMg: 130,
    icon: '🥚', defaultWeightG: 150
  },
  {
    id: 'dish_chicken_salad',
    nameCn: '鸡胸肉沙拉',
    category: '菜品',
    aliases: ['鸡肉沙拉', '健康沙拉', '沙拉'],
    kcalPer100g: 95, proteinPer100g: 14.0, carbsPer100g: 3.8,
    fatPer100g: 2.8, fiberPer100g: 1.2, sugarPer100g: 1.5, sodiumPer100gMg: 95,
    icon: '🥗', defaultWeightG: 250
  },
  {
    id: 'dish_beef_rice',
    nameCn: '牛肉饭',
    category: '菜品',
    aliases: ['牛肉盖饭', '卤牛肉饭', '红烧牛肉饭'],
    kcalPer100g: 130, proteinPer100g: 8.5, carbsPer100g: 18.0,
    fatPer100g: 3.2, fiberPer100g: 0.5, sugarPer100g: 0, sodiumPer100gMg: 280,
    icon: '🍱', defaultWeightG: 350
  },
  {
    id: 'dish_fried_rice',
    nameCn: '炒饭',
    category: '菜品',
    aliases: ['蛋炒饭', '扬州炒饭', '杂锦炒饭'],
    kcalPer100g: 185, proteinPer100g: 5.8, carbsPer100g: 32.0,
    fatPer100g: 5.5, fiberPer100g: 0.8, sugarPer100g: 0, sodiumPer100gMg: 320,
    icon: '🍳', defaultWeightG: 250
  },
  {
    id: 'dish_fried_noodles',
    nameCn: '炒粉',
    category: '菜品',
    aliases: ['炒米粉', '干炒牛河', '炒河粉'],
    kcalPer100g: 148, proteinPer100g: 4.2, carbsPer100g: 26.0,
    fatPer100g: 3.8, fiberPer100g: 0.7, sugarPer100g: 0, sodiumPer100gMg: 290,
    icon: '🍜', defaultWeightG: 300
  },
  {
    id: 'dish_luosifen',
    nameCn: '螺蛳粉',
    category: '菜品',
    aliases: ['柳州螺蛳粉', '柳州烫粉'],
    kcalPer100g: 115, proteinPer100g: 4.5, carbsPer100g: 20.0,
    fatPer100g: 2.5, fiberPer100g: 0.8, sugarPer100g: 0, sodiumPer100gMg: 650,
    icon: '🍜', defaultWeightG: 400
  },
  {
    id: 'dish_guilin_noodles',
    nameCn: '桂林米粉',
    category: '菜品',
    aliases: ['桂林粉', '桂林卤粉'],
    kcalPer100g: 108, proteinPer100g: 4.8, carbsPer100g: 19.5,
    fatPer100g: 1.8, fiberPer100g: 0.6, sugarPer100g: 0, sodiumPer100gMg: 520,
    icon: '🍜', defaultWeightG: 350
  }
]

// ── Helper functions ──────────────────────────

function round1(n) {
  return Math.round(n * 10) / 10
}

function getFoodById(id) {
  return FOOD_DATABASE.find(f => f.id === id) || null
}

function searchFoodsByKeyword(keyword) {
  if (!keyword || !keyword.trim()) return []
  const kw = keyword.trim()
  const results = []
  for (const food of FOOD_DATABASE) {
    const inName = food.nameCn.includes(kw)
    const inAlias = food.aliases && food.aliases.some(a => a.includes(kw))
    if (inName || inAlias) {
      results.push(food)
    }
    if (results.length >= 10) break
  }
  return results
}

/**
 * 根据食物项和重量计算实际营养值，返回一个分析食物记录
 */
function buildFoodItem(food, weightG, confidence) {
  const ratio = weightG / 100
  const uid = food.id + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
  return {
    uid,
    foodId: food.id,
    nameCn: food.nameCn,
    category: food.category,
    icon: food.icon,
    weightG,
    confidence,
    needUserConfirm: confidence < 0.7,
    kcal: Math.round(food.kcalPer100g * ratio),
    proteinG: round1(food.proteinPer100g * ratio),
    carbsG: round1(food.carbsPer100g * ratio),
    fatG: round1(food.fatPer100g * ratio),
    fiberG: round1(food.fiberPer100g * ratio),
    // Keep reference per-100g for weight recalculation
    _kcalPer100g: food.kcalPer100g,
    _proteinPer100g: food.proteinPer100g,
    _carbsPer100g: food.carbsPer100g,
    _fatPer100g: food.fatPer100g,
    _fiberPer100g: food.fiberPer100g
  }
}

module.exports = {
  FOOD_DATABASE,
  getFoodById,
  searchFoodsByKeyword,
  buildFoodItem
}
