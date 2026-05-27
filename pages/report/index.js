const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function formatDate(date) {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

Page({
  data: {
    avgScore: 0,
    avgKcal: 0,
    grade: '--',
    proteinRate: 0,
    weekRange: '',
    bars: [],
    macros: [],
    stats: [],
    summary: ''
  },

  onShow() {
    this.buildReport()
  },

  buildReport() {
    wx.cloud.callFunction({
      name: 'getWeeklyReport',
      data: { days: 7 }
    })
      .then(res => {
        this._applyCloudReport(res.result || {})
      })
      .catch(() => {
        const today = new Date()
        const startD = new Date(today)
        startD.setDate(today.getDate() - 6)
        this._processReport([], today, startD)
      })
  },

  _applyCloudReport(report) {
    const avgScore = report.avgScore || 0
    const grade = avgScore >= 90 ? '优秀' : avgScore >= 80 ? '良好' : avgScore >= 70 ? '一般' : avgScore > 0 ? '待提升' : '--'
    const trend = report.trend || []
    const maxK = Math.max(...trend.map(d => d.kcal || 0), 1)
    const bars = Array.from({ length: 7 }, (_, index) => {
      const item = trend[index] || {}
      const date = item.date ? new Date(item.date.replace(/-/g, '/')) : null
      const dow = date ? date.getDay() : index + 1
      const label = index === 6 ? '今' : DAY_LABELS[dow === 0 ? 6 : dow - 1]
      const hasData = Number(item.kcal || 0) > 0
      return {
        pct: hasData ? Math.max(12, Math.round((item.kcal || 0) / maxK * 100)) : 8,
        label,
        isToday: index === 6,
        hasData
      }
    })

    const macros = [
      { name: '蛋白质', val: report.avgProtein || 0, unit: 'g', target: 75, pct: Math.min(100, Math.round((report.avgProtein || 0) / 75 * 100)), color: 'purple' },
      { name: '碳水化合物', val: report.avgCarbs || 0, unit: 'g', target: 250, pct: Math.min(100, Math.round((report.avgCarbs || 0) / 250 * 100)), color: 'amber' },
      { name: '脂肪', val: report.avgFat || 0, unit: 'g', target: 65, pct: Math.min(100, Math.round((report.avgFat || 0) / 65 * 100)), color: 'green' },
      { name: '膳食纤维', val: report.avgFiber || 0, unit: 'g', target: 25, pct: Math.min(100, Math.round((report.avgFiber || 0) / 25 * 100)), color: 'teal' }
    ]

    const stats = [
      { label: '蔬菜摄入', value: `${report.vegDays || 0} 天`, icon: '🥬' },
      { label: '含糖饮料', value: `${report.sugaryDrinks || 0} 杯`, icon: '🧋' },
      { label: '外出就餐', value: `${report.eatingOut || 0} 次`, icon: '🍽️' },
      { label: '夜宵摄入', value: `${report.lateSnacks || 0} 次`, icon: '🌙' }
    ]

    const proteinRate = Math.min(100, Math.round(((report.proteinTargetDays || 0) / 7) * 100))
    const weekRange = `${String(report.startDate || '').slice(5).replace('-', '/')} — ${String(report.endDate || '').slice(5).replace('-', '/')}`

    this.setData({
      avgScore,
      avgKcal: report.avgCalories || 0,
      grade,
      proteinRate,
      bars,
      macros,
      stats,
      weekRange,
      summary: report.summary || '暂无本周饮食数据，开始记录后将生成个性化总结。'
    })
  },

  _processReport(meals, today, startD) {
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
    const avgKcal = hasAnyData
      ? Math.round(days7.reduce((s, d) => s + d.kcal, 0) / 7)
      : 0

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
      : days7.map(d => ({ pct: 8, label: d.label, isToday: d.isToday, hasData: false }))

    const avgScore = meals.length
      ? Math.round(meals.reduce((s, m) => s + (m.healthScore || 80), 0) / meals.length)
      : 0
    const grade = avgScore >= 90 ? '优秀' : avgScore >= 80 ? '良好' : avgScore >= 70 ? '一般' : avgScore > 0 ? '待提升' : '--'

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
        { name: '蛋白质', val: ap, unit: 'g', target: 75, pct: Math.min(100, Math.round(ap / 75 * 100)), color: 'purple' },
        { name: '碳水化合物', val: ac, unit: 'g', target: 250, pct: Math.min(100, Math.round(ac / 250 * 100)), color: 'amber' },
        { name: '脂肪', val: af, unit: 'g', target: 65, pct: Math.min(100, Math.round(af / 65 * 100)), color: 'green' },
        { name: '膳食纤维', val: aFib, unit: 'g', target: 25, pct: Math.min(100, Math.round(aFib / 25 * 100)), color: 'teal' }
      ]
    } else {
      macros = [
        { name: '蛋白质', val: 0, unit: 'g', target: 75, pct: 0, color: 'purple' },
        { name: '碳水化合物', val: 0, unit: 'g', target: 250, pct: 0, color: 'amber' },
        { name: '脂肪', val: 0, unit: 'g', target: 65, pct: 0, color: 'green' },
        { name: '膳食纤维', val: 0, unit: 'g', target: 25, pct: 0, color: 'teal' }
      ]
    }

    const proteinDays = new Set(
      meals.filter(m => (m.totalNutrition ? m.totalNutrition.protein : 0) >= 30).map(m => m.date)
    ).size
    const vegDays = new Set(
      meals.filter(m => (m.foods || []).some(f => /西兰花|菠菜|青菜|蔬菜|沙拉|生菜/.test(f.name || ''))).map(m => m.date)
    ).size
    const nightSnacks = meals.filter(m => m.mealType === 'snack').length
    const proteinRate = meals.length ? Math.min(100, Math.round((proteinDays / 7) * 100)) : 0

    const stats = [
      { label: '蔬菜摄入', value: `${vegDays} 天`, icon: '🥬' },
      { label: '含糖饮料', value: '-- 杯', icon: '🧋' },
      { label: '外出就餐', value: '-- 次', icon: '🍽️' },
      { label: '夜宵摄入', value: `${nightSnacks} 次`, icon: '🌙' }
    ]

    const weekRange = formatDate(startD).slice(5).replace('-', '/') +
      ' — ' + formatDate().slice(5).replace('-', '/')

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
  if (score === 0) return '暂无本周饮食数据，开始记录后将生成个性化总结。'
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
  } else if (kcal < 1200 && kcal > 0) {
    lines.push('平均热量偏低，注意保证足够能量摄入，避免营养不足。')
  }
  lines.push('坚持每日记录饮食有助于建立长期健康习惯。')
  return lines.join('\n')
}
