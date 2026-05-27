const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function withFoodMeta(item) {
  return {
    ...item,
    verified: true,
    dataSource: 'nutrition_seed_v1',
    dataSourceNote: '常见食物营养估算值，正式上线前建议用权威食物成分表或品牌营养标签复核。',
    commonUnits: item.commonUnits || [
      { label: '半份', weightG: Math.round(item.defaultWeightG * 0.5) },
      { label: '常规份', weightG: item.defaultWeightG },
      { label: '大份', weightG: Math.round(item.defaultWeightG * 1.5) }
    ],
    updatedAt: new Date()
  }
}

const FOOD_DATABASE = [
  { foodId: 'sta_white_rice', nameCn: '白米饭', category: '主食', aliases: ['米饭', '白饭', '蒸米饭', '大米饭'], kcalPer100g: 116, proteinPer100g: 2.6, carbsPer100g: 25.9, fatPer100g: 0.3, fiberPer100g: 0.3, icon: '🍚', defaultWeightG: 150 },
  { foodId: 'sta_brown_rice', nameCn: '糙米饭', category: '主食', aliases: ['糙米', '玄米饭'], kcalPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23.2, fatPer100g: 0.9, fiberPer100g: 1.8, icon: '🍚', defaultWeightG: 150 },
  { foodId: 'sta_mixed_grain', nameCn: '杂粮饭', category: '主食', aliases: ['五谷饭', '多谷饭', '杂粮粥'], kcalPer100g: 120, proteinPer100g: 3.2, carbsPer100g: 24.8, fatPer100g: 0.8, fiberPer100g: 2.5, icon: '🍚', defaultWeightG: 150 },
  { foodId: 'sta_porridge', nameCn: '白粥', category: '主食', aliases: ['粥', '稀饭', '米粥'], kcalPer100g: 46, proteinPer100g: 1.1, carbsPer100g: 10.1, fatPer100g: 0.1, fiberPer100g: 0.1, icon: '🍜', defaultWeightG: 300 },
  { foodId: 'sta_noodles', nameCn: '面条', category: '主食', aliases: ['面', '拉面', '乌冬面', '细面', '宽面', '煮面'], kcalPer100g: 109, proteinPer100g: 3.7, carbsPer100g: 22.0, fatPer100g: 0.6, fiberPer100g: 1.0, icon: '🍜', defaultWeightG: 200 },
  { foodId: 'sta_rice_noodles', nameCn: '米粉', category: '主食', aliases: ['河粉', '细米粉', '粗米粉', '米线'], kcalPer100g: 104, proteinPer100g: 1.6, carbsPer100g: 24.0, fatPer100g: 0.1, fiberPer100g: 0.3, icon: '🍜', defaultWeightG: 200 },
  { foodId: 'sta_steamed_bun', nameCn: '馒头', category: '主食', aliases: ['白馒头', '花卷'], kcalPer100g: 223, proteinPer100g: 7.0, carbsPer100g: 47.0, fatPer100g: 1.1, fiberPer100g: 1.2, icon: '🥟', defaultWeightG: 80 },
  { foodId: 'sta_baozi', nameCn: '包子', category: '主食', aliases: ['肉包', '菜包', '豆沙包'], kcalPer100g: 238, proteinPer100g: 9.1, carbsPer100g: 40.0, fatPer100g: 5.2, fiberPer100g: 0.9, icon: '🥟', defaultWeightG: 100 },
  { foodId: 'sta_bread', nameCn: '面包', category: '主食', aliases: ['白面包', '吐司', '全麦面包', '全麦吐司'], kcalPer100g: 265, proteinPer100g: 8.3, carbsPer100g: 53.2, fatPer100g: 2.3, fiberPer100g: 1.2, icon: '🍞', defaultWeightG: 60 },
  { foodId: 'sta_oats', nameCn: '燕麦', category: '主食', aliases: ['燕麦片', '麦片', '燕麦粥', '即食燕麦'], kcalPer100g: 84, proteinPer100g: 2.9, carbsPer100g: 14.2, fatPer100g: 1.5, fiberPer100g: 1.7, icon: '🥣', defaultWeightG: 80 },
  { foodId: 'sta_sweet_potato', nameCn: '红薯', category: '主食', aliases: ['地瓜', '番薯', '烤红薯', '蒸红薯'], kcalPer100g: 86, proteinPer100g: 1.6, carbsPer100g: 20.1, fatPer100g: 0.2, fiberPer100g: 1.6, icon: '🍠', defaultWeightG: 150 },
  { foodId: 'sta_corn', nameCn: '玉米', category: '主食', aliases: ['玉米棒', '甜玉米', '煮玉米', '玉米粒'], kcalPer100g: 106, proteinPer100g: 3.4, carbsPer100g: 22.0, fatPer100g: 1.2, fiberPer100g: 2.0, icon: '🌽', defaultWeightG: 150 },
  { foodId: 'sta_potato', nameCn: '土豆', category: '主食', aliases: ['马铃薯', '薯仔', '洋芋', '蒸土豆'], kcalPer100g: 77, proteinPer100g: 2.0, carbsPer100g: 17.2, fatPer100g: 0.1, fiberPer100g: 0.7, icon: '🥔', defaultWeightG: 150 },
  { foodId: 'pro_egg', nameCn: '鸡蛋', category: '蛋白质', aliases: ['白煮蛋', '煮鸡蛋', '荷包蛋', '煎蛋', '炒鸡蛋', '全蛋'], kcalPer100g: 143, proteinPer100g: 12.6, carbsPer100g: 0.7, fatPer100g: 9.5, fiberPer100g: 0, icon: '🥚', defaultWeightG: 55 },
  { foodId: 'pro_chicken_breast', nameCn: '鸡胸肉', category: '蛋白质', aliases: ['鸡胸', '水煮鸡胸', '鸡胸肉片', '白切鸡胸'], kcalPer100g: 133, proteinPer100g: 26.7, carbsPer100g: 0, fatPer100g: 2.5, fiberPer100g: 0, icon: '🍗', defaultWeightG: 120 },
  { foodId: 'pro_chicken_leg', nameCn: '鸡腿肉', category: '蛋白质', aliases: ['鸡腿', '烤鸡腿', '卤鸡腿', '去骨鸡腿'], kcalPer100g: 181, proteinPer100g: 18.2, carbsPer100g: 0, fatPer100g: 11.6, fiberPer100g: 0, icon: '🍗', defaultWeightG: 120 },
  { foodId: 'pro_beef', nameCn: '牛肉', category: '蛋白质', aliases: ['瘦牛肉', '牛里脊', '牛肉片', '炒牛肉'], kcalPer100g: 106, proteinPer100g: 20.2, carbsPer100g: 0, fatPer100g: 2.3, fiberPer100g: 0, icon: '🥩', defaultWeightG: 100 },
  { foodId: 'pro_pork_lean', nameCn: '猪瘦肉', category: '蛋白质', aliases: ['猪肉', '猪里脊', '瘦猪肉', '猪肉片'], kcalPer100g: 143, proteinPer100g: 20.3, carbsPer100g: 0, fatPer100g: 6.2, fiberPer100g: 0, icon: '🥩', defaultWeightG: 100 },
  { foodId: 'pro_fish', nameCn: '鱼肉', category: '蛋白质', aliases: ['鱼', '草鱼', '鲈鱼', '鳕鱼', '清蒸鱼', '烤鱼'], kcalPer100g: 113, proteinPer100g: 17.9, carbsPer100g: 0, fatPer100g: 4.3, fiberPer100g: 0, icon: '🐟', defaultWeightG: 120 },
  { foodId: 'pro_shrimp', nameCn: '虾', category: '蛋白质', aliases: ['大虾', '基围虾', '虾仁', '白灼虾', '水煮虾'], kcalPer100g: 93, proteinPer100g: 18.6, carbsPer100g: 2.8, fatPer100g: 0.9, fiberPer100g: 0, icon: '🍤', defaultWeightG: 100 },
  { foodId: 'pro_tofu', nameCn: '豆腐', category: '蛋白质', aliases: ['嫩豆腐', '老豆腐', '北豆腐', '南豆腐'], kcalPer100g: 81, proteinPer100g: 8.1, carbsPer100g: 3.2, fatPer100g: 3.7, fiberPer100g: 0.4, icon: '🫘', defaultWeightG: 150 },
  { foodId: 'pro_salmon', nameCn: '三文鱼', category: '蛋白质', aliases: ['鲑鱼', '烟熏三文鱼', '三文鱼刺身', '三文鱼排'], kcalPer100g: 208, proteinPer100g: 20.0, carbsPer100g: 0, fatPer100g: 13.8, fiberPer100g: 0, icon: '🐟', defaultWeightG: 100 },
  { foodId: 'veg_broccoli', nameCn: '西兰花', category: '蔬菜', aliases: ['花椰菜', '绿花菜', '西蓝花', '嫩茎花椰菜'], kcalPer100g: 34, proteinPer100g: 2.8, carbsPer100g: 6.6, fatPer100g: 0.4, fiberPer100g: 2.6, icon: '🥦', defaultWeightG: 100 },
  { foodId: 'veg_spinach', nameCn: '菠菜', category: '蔬菜', aliases: ['菠菜叶', '嫩菠菜'], kcalPer100g: 24, proteinPer100g: 2.6, carbsPer100g: 3.0, fatPer100g: 0.5, fiberPer100g: 1.7, icon: '🥬', defaultWeightG: 100 },
  { foodId: 'veg_youmaicai', nameCn: '油麦菜', category: '蔬菜', aliases: ['油麦', '莜麦菜'], kcalPer100g: 15, proteinPer100g: 1.4, carbsPer100g: 2.1, fatPer100g: 0.3, fiberPer100g: 0.8, icon: '🥬', defaultWeightG: 100 },
  { foodId: 'veg_lettuce', nameCn: '生菜', category: '蔬菜', aliases: ['罗马生菜', '奶油生菜', '球形生菜', '沙拉菜'], kcalPer100g: 13, proteinPer100g: 1.3, carbsPer100g: 1.7, fatPer100g: 0.3, fiberPer100g: 0.7, icon: '🥬', defaultWeightG: 80 },
  { foodId: 'veg_bokchoy', nameCn: '上海青', category: '蔬菜', aliases: ['青江菜', '油菜', '小油菜', '青菜'], kcalPer100g: 15, proteinPer100g: 1.9, carbsPer100g: 1.6, fatPer100g: 0.3, fiberPer100g: 1.1, icon: '🥬', defaultWeightG: 100 },
  { foodId: 'veg_small_cabbage', nameCn: '小白菜', category: '蔬菜', aliases: ['白菜', '大白菜', '娃娃菜'], kcalPer100g: 14, proteinPer100g: 1.5, carbsPer100g: 1.6, fatPer100g: 0.3, fiberPer100g: 1.1, icon: '🥬', defaultWeightG: 100 },
  { foodId: 'veg_carrot', nameCn: '胡萝卜', category: '蔬菜', aliases: ['红萝卜', '胡萝卜丝', '胡萝卜片'], kcalPer100g: 32, proteinPer100g: 0.8, carbsPer100g: 7.1, fatPer100g: 0.2, fiberPer100g: 1.0, icon: '🥕', defaultWeightG: 80 },
  { foodId: 'veg_tomato', nameCn: '番茄', category: '蔬菜', aliases: ['西红柿', '圣女果', '小番茄', '大番茄'], kcalPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.3, fatPer100g: 0.2, fiberPer100g: 0.5, icon: '🍅', defaultWeightG: 100 },
  { foodId: 'veg_cucumber', nameCn: '黄瓜', category: '蔬菜', aliases: ['青瓜', '嫩黄瓜', '黄瓜片'], kcalPer100g: 15, proteinPer100g: 0.8, carbsPer100g: 2.9, fatPer100g: 0.1, fiberPer100g: 0.5, icon: '🥒', defaultWeightG: 100 },
  { foodId: 'veg_pumpkin', nameCn: '南瓜', category: '蔬菜', aliases: ['贝贝南瓜', '老南瓜', '蒸南瓜'], kcalPer100g: 23, proteinPer100g: 0.7, carbsPer100g: 5.3, fatPer100g: 0.1, fiberPer100g: 0.8, icon: '🎃', defaultWeightG: 100 },
  { foodId: 'veg_mushroom', nameCn: '蘑菇', category: '蔬菜', aliases: ['香菇', '金针菇', '杏鲍菇', '平菇', '口蘑'], kcalPer100g: 20, proteinPer100g: 2.7, carbsPer100g: 2.5, fatPer100g: 0.1, fiberPer100g: 1.3, icon: '🍄', defaultWeightG: 80 },
  { foodId: 'veg_asparagus', nameCn: '芦笋', category: '蔬菜', aliases: ['白芦笋', '绿芦笋', '烤芦笋'], kcalPer100g: 20, proteinPer100g: 2.2, carbsPer100g: 3.9, fatPer100g: 0.1, fiberPer100g: 2.1, icon: '🌿', defaultWeightG: 100 },
  { foodId: 'veg_celery', nameCn: '芹菜', category: '蔬菜', aliases: ['西芹', '水芹', '芹菜茎'], kcalPer100g: 16, proteinPer100g: 0.6, carbsPer100g: 3.9, fatPer100g: 0.1, fiberPer100g: 1.4, icon: '🌿', defaultWeightG: 80 },
  { foodId: 'fru_apple', nameCn: '苹果', category: '水果', aliases: ['红苹果', '绿苹果', '富士苹果'], kcalPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 13.8, fatPer100g: 0.2, fiberPer100g: 2.4, icon: '🍎', defaultWeightG: 150 },
  { foodId: 'fru_banana', nameCn: '香蕉', category: '水果', aliases: ['香蕉', '芭蕉'], kcalPer100g: 93, proteinPer100g: 1.1, carbsPer100g: 21.0, fatPer100g: 0.3, fiberPer100g: 2.6, icon: '🍌', defaultWeightG: 100 },
  { foodId: 'fru_orange', nameCn: '橙子', category: '水果', aliases: ['橙', '脐橙', '甜橙', '橘子', '柑橘'], kcalPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 11.8, fatPer100g: 0.1, fiberPer100g: 2.4, icon: '🍊', defaultWeightG: 150 },
  { foodId: 'fru_blueberry', nameCn: '蓝莓', category: '水果', aliases: ['冻蓝莓', '新鲜蓝莓'], kcalPer100g: 57, proteinPer100g: 0.7, carbsPer100g: 14.5, fatPer100g: 0.3, fiberPer100g: 2.4, icon: '🫐', defaultWeightG: 80 },
  { foodId: 'fru_strawberry', nameCn: '草莓', category: '水果', aliases: ['新鲜草莓'], kcalPer100g: 32, proteinPer100g: 0.7, carbsPer100g: 7.7, fatPer100g: 0.3, fiberPer100g: 2.0, icon: '🍓', defaultWeightG: 100 },
  { foodId: 'fru_grape', nameCn: '葡萄', category: '水果', aliases: ['红葡萄', '绿葡萄', '无籽葡萄'], kcalPer100g: 69, proteinPer100g: 0.7, carbsPer100g: 18.0, fatPer100g: 0.2, fiberPer100g: 0.9, icon: '🍇', defaultWeightG: 100 },
  { foodId: 'fru_avocado', nameCn: '牛油果', category: '水果', aliases: ['鳄梨', '油梨', '熟牛油果'], kcalPer100g: 160, proteinPer100g: 2.0, carbsPer100g: 9.0, fatPer100g: 14.7, fiberPer100g: 6.7, icon: '🥑', defaultWeightG: 60 },
  { foodId: 'fru_kiwi', nameCn: '猕猴桃', category: '水果', aliases: ['奇异果', '绿心猕猴桃', '黄心猕猴桃'], kcalPer100g: 61, proteinPer100g: 1.1, carbsPer100g: 14.7, fatPer100g: 0.5, fiberPer100g: 3.0, icon: '🥝', defaultWeightG: 100 },
  { foodId: 'fru_dragonfruit', nameCn: '火龙果', category: '水果', aliases: ['红心火龙果', '白心火龙果'], kcalPer100g: 60, proteinPer100g: 1.1, carbsPer100g: 13.2, fatPer100g: 0.6, fiberPer100g: 1.8, icon: '🍈', defaultWeightG: 150 },
  { foodId: 'fru_pear', nameCn: '梨', category: '水果', aliases: ['雪梨', '砀山梨', '水晶梨'], kcalPer100g: 57, proteinPer100g: 0.4, carbsPer100g: 15.1, fatPer100g: 0.1, fiberPer100g: 3.1, icon: '🍐', defaultWeightG: 150 },
  { foodId: 'drk_water', nameCn: '水', category: '饮品', aliases: ['白水', '矿泉水', '温水', '热水'], kcalPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0, icon: '💧', defaultWeightG: 250 },
  { foodId: 'drk_tea', nameCn: '无糖茶', category: '饮品', aliases: ['绿茶', '红茶', '乌龙茶', '普洱茶', '白茶', '茶'], kcalPer100g: 1, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0, icon: '🍵', defaultWeightG: 250 },
  { foodId: 'drk_black_coffee', nameCn: '黑咖啡', category: '饮品', aliases: ['咖啡', '美式咖啡', '手冲咖啡', '黑咖'], kcalPer100g: 2, proteinPer100g: 0.3, carbsPer100g: 0, fatPer100g: 0, fiberPer100g: 0, icon: '☕', defaultWeightG: 250 },
  { foodId: 'drk_latte', nameCn: '拿铁', category: '饮品', aliases: ['拿铁咖啡', '燕麦拿铁', '抹茶拿铁', '卡布奇诺'], kcalPer100g: 48, proteinPer100g: 2.3, carbsPer100g: 4.9, fatPer100g: 1.9, fiberPer100g: 0, icon: '☕', defaultWeightG: 350 },
  { foodId: 'drk_milk_tea', nameCn: '奶茶', category: '饮品', aliases: ['珍珠奶茶', '奶盖茶', '烧仙草', '港式奶茶'], kcalPer100g: 70, proteinPer100g: 1.0, carbsPer100g: 13.0, fatPer100g: 1.5, fiberPer100g: 0, icon: '🧋', defaultWeightG: 500 },
  { foodId: 'drk_juice', nameCn: '果汁', category: '饮品', aliases: ['橙汁', '苹果汁', '鲜榨果汁', '混合果汁'], kcalPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10.4, fatPer100g: 0.2, fiberPer100g: 0.2, icon: '🧃', defaultWeightG: 250 },
  { foodId: 'drk_cola', nameCn: '可乐', category: '饮品', aliases: ['百事可乐', '可口可乐', '雪碧', '碳酸饮料'], kcalPer100g: 42, proteinPer100g: 0, carbsPer100g: 10.6, fatPer100g: 0, fiberPer100g: 0, icon: '🥤', defaultWeightG: 330 },
  { foodId: 'drk_milk', nameCn: '牛奶', category: '饮品', aliases: ['全脂牛奶', '脱脂牛奶', '低脂牛奶', '鲜奶', '纯牛奶'], kcalPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.7, fatPer100g: 3.3, fiberPer100g: 0, icon: '🥛', defaultWeightG: 250 },
  { foodId: 'drk_yogurt', nameCn: '酸奶', category: '饮品', aliases: ['原味酸奶', '希腊酸奶', '无糖酸奶', '低脂酸奶'], kcalPer100g: 72, proteinPer100g: 3.5, carbsPer100g: 8.0, fatPer100g: 1.9, fiberPer100g: 0, icon: '🥛', defaultWeightG: 200 },
  { foodId: 'drk_soymilk', nameCn: '豆浆', category: '饮品', aliases: ['无糖豆浆', '原味豆浆', '淡豆浆'], kcalPer100g: 31, proteinPer100g: 3.0, carbsPer100g: 1.8, fatPer100g: 1.6, fiberPer100g: 0.5, icon: '🥛', defaultWeightG: 250 },
  { foodId: 'con_oil', nameCn: '食用油', category: '调料', aliases: ['花生油', '豆油', '菜籽油', '色拉油', '植物油'], kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fiberPer100g: 0, icon: '🫙', defaultWeightG: 10 },
  { foodId: 'con_olive_oil', nameCn: '橄榄油', category: '调料', aliases: ['特级初榨橄榄油', '冷压橄榄油'], kcalPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, fiberPer100g: 0, icon: '🫙', defaultWeightG: 10 },
  { foodId: 'dish_tomato_egg', nameCn: '番茄炒蛋', category: '菜品', aliases: ['西红柿炒鸡蛋', '蕃茄炒蛋', '番茄炒鸡蛋'], kcalPer100g: 85, proteinPer100g: 5.8, carbsPer100g: 4.2, fatPer100g: 5.4, fiberPer100g: 0.5, icon: '🍳', defaultWeightG: 200 },
  { foodId: 'dish_stir_greens', nameCn: '清炒青菜', category: '菜品', aliases: ['素炒青菜', '炒青菜', '清炒时蔬', '素炒蔬菜'], kcalPer100g: 40, proteinPer100g: 1.8, carbsPer100g: 3.8, fatPer100g: 2.1, fiberPer100g: 1.5, icon: '🥬', defaultWeightG: 150 },
  { foodId: 'dish_steamed_egg', nameCn: '蒸蛋', category: '菜品', aliases: ['水蒸蛋', '鸡蛋羹', '嫩蒸蛋'], kcalPer100g: 79, proteinPer100g: 6.5, carbsPer100g: 1.8, fatPer100g: 4.8, fiberPer100g: 0, icon: '🥚', defaultWeightG: 150 },
  { foodId: 'dish_chicken_salad', nameCn: '鸡胸肉沙拉', category: '菜品', aliases: ['鸡肉沙拉', '健康沙拉', '沙拉'], kcalPer100g: 95, proteinPer100g: 14.0, carbsPer100g: 3.8, fatPer100g: 2.8, fiberPer100g: 1.2, icon: '🥗', defaultWeightG: 250 },
  { foodId: 'dish_beef_rice', nameCn: '牛肉饭', category: '菜品', aliases: ['牛肉盖饭', '卤牛肉饭', '红烧牛肉饭'], kcalPer100g: 130, proteinPer100g: 8.5, carbsPer100g: 18.0, fatPer100g: 3.2, fiberPer100g: 0.5, icon: '🍱', defaultWeightG: 350 },
  { foodId: 'dish_fried_rice', nameCn: '炒饭', category: '菜品', aliases: ['蛋炒饭', '扬州炒饭', '杂锦炒饭'], kcalPer100g: 185, proteinPer100g: 5.8, carbsPer100g: 32.0, fatPer100g: 5.5, fiberPer100g: 0.8, icon: '🍳', defaultWeightG: 250 },
  { foodId: 'dish_fried_noodles', nameCn: '炒粉', category: '菜品', aliases: ['炒米粉', '干炒牛河', '炒河粉'], kcalPer100g: 148, proteinPer100g: 4.2, carbsPer100g: 26.0, fatPer100g: 3.8, fiberPer100g: 0.7, icon: '🍜', defaultWeightG: 300 },
  { foodId: 'dish_luosifen', nameCn: '螺蛳粉', category: '菜品', aliases: ['柳州螺蛳粉', '柳州烫粉'], kcalPer100g: 115, proteinPer100g: 4.5, carbsPer100g: 20.0, fatPer100g: 2.5, fiberPer100g: 0.8, icon: '🍜', defaultWeightG: 400 },
  { foodId: 'dish_guilin_noodles', nameCn: '桂林米粉', category: '菜品', aliases: ['桂林粉', '桂林卤粉'], kcalPer100g: 108, proteinPer100g: 4.8, carbsPer100g: 19.5, fatPer100g: 1.8, fiberPer100g: 0.6, icon: '🍜', defaultWeightG: 350 }
]

exports.main = async () => {
  const allExisting = []
  let batch
  do {
    const res = await db.collection('food_items').skip(allExisting.length).limit(100).get()
    batch = res.data
    allExisting.push(...batch)
  } while (batch.length === 100)

  const existingIds = new Set(allExisting.map(doc => doc.foodId))

  let inserted = 0
  let skipped = 0
  let metadataUpdated = 0

  const size = 20
  for (let i = 0; i < FOOD_DATABASE.length; i += size) {
    const chunk = FOOD_DATABASE.slice(i, i + size)
    const tasks = chunk.map(async (item) => {
      if (existingIds.has(item.foodId)) {
        await db.collection('food_items')
          .where({ foodId: item.foodId })
          .update({
            data: {
              verified: true,
              dataSource: 'nutrition_seed_v1',
              dataSourceNote: '常见食物营养估算值，正式上线前建议用权威食物成分表或品牌营养标签复核。',
              commonUnits: item.commonUnits || [
                { label: '半份', weightG: Math.round(item.defaultWeightG * 0.5) },
                { label: '常规份', weightG: item.defaultWeightG },
                { label: '大份', weightG: Math.round(item.defaultWeightG * 1.5) }
              ],
              updatedAt: new Date()
            }
          })
        metadataUpdated++
        skipped++
        return
      }
      await db.collection('food_items').add({ data: withFoodMeta(item) })
      inserted++
    })
    await Promise.all(tasks)
  }

  return { message: 'seed complete', inserted, skipped, metadataUpdated }
}
