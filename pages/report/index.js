const { getRecentMeals, formatDate } = require('../../utils/storage')

const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const MOCK_BARS = [
  { pct: 46, label: '一', isToday: false, hasData: true },
  { pct: 62, label: '二', isToday: false, hasData: true },
  { pct: 52, label: '三', isToday: false, hasData: true },
  { pct: 50, label: '四', isToday: false, hasData: true },
  { pct: 57, label: '五', isToday: false, hasData: true },
  { pct: 51, label: '六', isToday: false, hasData: true },
  { pct: 64, label: '今', isToday: true,  hasData: true }
]
const MOCK_MACROS = [
  { name: '蛋白质', val: 68,  unit: 'g', target: 75,  pct: 91, color: 'purple' },
  { name: '碳水化合物', val: 195, unit: 'g', target: 250, pct: 78, color: 'amber'  },
  { name: '脂肪',   val: 45,  unit: 'g', target: 65,  pct: 69, color: 'green'  },
  { name: '膳食纤维', val: 12,  unit: 'g', target: 25,  pct: 48, color: 'teal'   }
]

Page({
  data: {
    avgScore: 89,
    avgKcal: 1642,
    grade: '良好',
    proteinRate: 92,
    weekRange: '',
    bars: MOCK_BARS,
    macros: MOCK_MACROS,
    stats: [
      { label: '蔬菜摄入', value: '6 天', icon: '🥬' },
      { label: '含糖饮料', value: '1 杯', icon: '🧋' },
      { label: '外出就餐', value: '3 次', icon: '🍽️' },
      { label: '夜宵摄入', value: '1 次', icon: '🌙' }
    ],
    summary: '本周整体饮食均衡，营养结构良好，继续保持当前节奏。\n坚持每日记录饮食有助于建立长期健康习惯。'
  },

  onShow() {
    this.buildReport()
  },

  buildReport() {
    const meals = getRecentMeals(7)

    // 7-day date array oldest→today
    const today = new Date()
    const days7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - (6 - i))
      const dateStr = formatDate(d)
      const dayMeals = meals.filter(m => m.date === dateStr)
      const kcal = dayMeals.reduce((s, m) => s + (m.totalNutrition ? m.totalNutrition.kcal : 0), 0)
      const dow = d.getDay()
      const label = i === 6 ? '今' : DAY_LABELS[dow === 0 ? 6 : dow - 1]
      return { kcal, label, isToday: i === 6, hasData: kcal > 0 }
    })

    const hasAnyData = days7.some(d => d.hasData)

    // Weekly averages
    const avgKcal = hasAnyData
      ? Math.round(days7.reduce((s, d) => s + d.kcal, 0) / 7)
      : 1642

    // Build normalized bars
    const bars = hasAnyData
      ? (() => {
          const maxK = Math.max(...days7.map(d => d.kcal), 1)
          return days7.map(d => ({
            pct: d.hasData ? Math.max(12, Math.round(d.kcal / maxK * 100)) : 8,
            label: d.label,
            isToday: d.isToday,
            hasData: d.hasData
          }))
        })()
      : MOCK_BARS

    // Score
    const avgScore = meals.length
      ? Math.round(meals.reduce((s, m) => s + (m.healthScore || 80), 0) / meals.length)
      : 89
    const grade = avgScore >= 90 ? '优秀' : avgScore >= 80 ? '良好' : avgScore >= 70 ? '一般' : '待提升'

    // Macros
    const allFoods = meals.flatMap(m => m.foods || [])
    let macros
    if (allFoods.length) {
      const tot = allFoods.reduce((a, f) => ({
        protein: a.protein + (f.protein || 0),
        carbs: a.carbs + (f.carbs || 0),
        fat: a.fat + (f.fat || 0),
        fiber: a.fiber + (f.fiber || 0)
      }), { protein: 0, carbs: 0, fat: 0, fiber: 0 })
      const ap = Math.round(tot.protein / 7)
      const ac = Math.round(tot.carbs / 7)
      const af = Math.round(tot.fat / 7)
      const aFib = Math.round(tot.fiber / 7)
      macros = [
        { name: '蛋白质', val: ap,   unit: 'g', target: 75,  pct: Math.min(100, Math.round(ap / 75 * 100)),    color: 'purple' },
        { name: '碳水化合物', val: ac, unit: 'g', target: 250, pct: Math.min(100, Math.round(ac / 250 * 100)),  color: 'amber'  },
        { name: '脂肪',   val: af,   unit: 'g', target: 65,  pct: Math.min(100, Math.round(af / 65 * 100)),    color: 'green'  },
        { name: '膳食纤维', val: aFib, unit: 'g', target: 25,  pct: Math.min(100, Math.round(aFib / 25 * 100)), color: 'teal'   }
      ]
    } else {
      macros = MOCK_MACROS
    }

    // Behavior counts
    const proteinDays = new Set(
      meals.filter(m => (m.totalNutrition ? m.totalNutrition.protein : 0) >= 30).map(m => m.date)
    ).size
    const vegDays = new Set(
      meals.filter(m => (m.foods || []).some(f => /西兰花|菠菜|青菜|蔬菜|沙拉|生菜/.test(f.name || ''))).map(m => m.date)
    ).size
    const nightSnacks = meals.filter(m => m.mealType === 'snack').length
    const proteinRate = Math.min(100, Math.round((proteinDays / 7) * 100)) || 92

    const stats = [
      { label: '蔬菜摄入', value: `${vegDays || 6} 天`,       icon: '🥬' },
      { label: '含糖饮料', value: '1 杯',                     icon: '🧋' },
      { label: '外出就餐', value: '3 次',                     icon: '🍽️' },
      { label: '夜宵摄入', value: `${nightSnacks || 1} 次`,   icon: '🌙' }
    ]

    // Week range label
    const startD = new Date(today)
    startD.setDate(today.getDate() - 6)
    const weekRange = formatDate(startD).slice(5).replace('-', '/') +
      ' — ' + formatDate(today).slice(5).replace('-', '/')

    this.setData({
      avgScore, avgKcal, grade, proteinRate,
      bars, macros, stats, weekRange,
      summary: _buildSummary(avgScore, macros[0].val, avgKcal)
    })
  },

  goBack() {
    wx.navigateBack()
  }
})

function _buildSummary(score, protein, kcal) {
  const lines = []
  if (score >= 85) {
    lines.push('本周整体饮食均衡，营养结构良好，继续保持当前节奏。')
  } else {
    lines.push('本周饮食有进步空间，建议参考以下几点进行调整。')
  }
  if (protein < 50) {
    lines.push('每日蛋白质摄入偏少，建议增加鸡蛋、鱼肉或豆腐，目标 75g/天。')
  }
  if (kcal > 2000) {
    lines.push('平均热量偏高，下周可适量减少主食和高油脂食物。')
  } else if (kcal < 1200) {
    lines.push('平均热量偏低，注意保证足够能量摄入，避免营养不足。')
  }
  lines.push('坚持每日记录饮食有助于建立长期健康习惯。')
  return lines.join('\n')
}
