export const today = {
  dateText: '2026年5月14日 · 星期四',
  healthScore: 92,
  calories: {
    current: 1622,
    target: 1800,
  },
}

export const mealCards = [
  {
    id: 'breakfast',
    name: '早餐',
    status: '已记录',
    kcal: 412,
    visual: '🥣',
    gradient: 'pink',
  },
  {
    id: 'lunch',
    name: '午餐',
    status: '已记录',
    kcal: 568,
    visual: '🥗',
    gradient: 'mint',
  },
  {
    id: 'dinner',
    name: '晚餐',
    status: '已记录',
    kcal: 486,
    visual: '🍲',
    gradient: 'blueberry',
  },
  {
    id: 'snack',
    name: '加餐',
    status: '未记录',
    kcal: 156,
    visual: '🫐',
    gradient: 'gold',
  },
]

export const mealOptions = ['早餐', '午餐', '晚餐', '加餐', '饮品']

export const noteTags = ['少油', '半糖', '无糖', '自定义备注']

export const analysisSummary = {
  calories: 568,
  healthScore: 88,
  suggestion:
    '这餐搭配很好，蛋白质优良，建议饭后散步 20 分钟，促进消化。',
  nutrients: [
    { name: '蛋白质', value: 32, unit: 'g', percent: 86 },
    { name: '碳水', value: 72, unit: 'g', percent: 68 },
    { name: '脂肪', value: 18, unit: 'g', percent: 52 },
    { name: '膳食纤维', value: 6, unit: 'g', percent: 63 },
    { name: '糖', value: 8, unit: 'g', percent: 28 },
  ],
}

export const recognizedFoods = [
  {
    id: 'brown-rice',
    name: '糙米饭',
    baseWeight: 150,
    baseKcal: 174,
    visual: '🍚',
  },
  {
    id: 'broccoli',
    name: '清炒西兰花',
    baseWeight: 120,
    baseKcal: 78,
    visual: '🥦',
  },
  {
    id: 'chicken',
    name: '香煎鸡胸肉',
    baseWeight: 120,
    baseKcal: 198,
    visual: '🍗',
  },
  {
    id: 'tomato',
    name: '圣女果',
    baseWeight: 80,
    baseKcal: 18,
    visual: '🍅',
  },
  {
    id: 'olive-oil',
    name: '橄榄油',
    baseWeight: 5,
    baseKcal: 45,
    visual: '🫒',
  },
]

export const diary = {
  streakDays: 23,
  dates: [
    { day: 20, active: false },
    { day: 21, active: false },
    { day: 22, active: false },
    { day: 23, active: true },
    { day: 24, active: false },
    { day: 25, active: false },
  ],
  moods: ['开心', '一般', '疲惫', '满足'],
  meals: [
    { name: '早餐', time: '07:30', kcal: 412, photos: ['🥣', '🍳', '🫐'] },
    { name: '午餐', time: '12:40', kcal: 568, photos: ['🍚', '🥦', '🍗', '🍅'] },
    { name: '晚餐', time: '18:30', kcal: 486, photos: ['🍲', '🥗', '🍵'] },
    { name: '加餐', time: '15:30', kcal: 156, photos: ['🫐', '🥛'] },
  ],
}

export const report = {
  averageScore: 89,
  averageCalories: 1642,
  proteinRate: 92,
  trend: [46, 62, 52, 50, 57, 51, 64],
  stats: [
    { label: '蔬菜摄入天数', value: '6 天', visual: '🥬' },
    { label: '含糖饮料', value: '1 杯', visual: '🧋' },
    { label: '外出就餐', value: '3 次', visual: '🍽️' },
    { label: '夜宵摄入', value: '1 次', visual: '🌙' },
  ],
  advice: '本周整体不错，建议继续保持蔬菜摄入，减少含糖饮料。',
}
