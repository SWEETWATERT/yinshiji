const { getCurrentUserId } = require('./goalService')

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function r1(value) {
  return Math.round(num(value) * 10) / 10
}

function formatDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getWeightCollection() {
  return wx.cloud.database().collection('weight_records')
}

function normalizeRecord(record = {}) {
  const weightKg = r1(record.weightKg || record.weight || 0)
  return {
    ...record,
    id: record._id || record.id || '',
    userId: record.userId || '',
    weightKg,
    weightText: weightKg ? `${weightKg.toFixed(1)} kg` : '--',
    date: record.date || '',
    note: record.note || ''
  }
}

function buildRecordQuery(collection, userId) {
  if (!userId) return collection.where({ userId: '__missing_user__' })
  return collection.where({ userId })
}

function addWeightRecord(options = {}) {
  const userId = options.userId || getCurrentUserId()
  const weightKg = r1(options.weightKg)
  const date = options.date || formatDate()
  const note = String(options.note || '').trim()

  if (!userId) return Promise.reject(new Error('MISSING_USER_ID'))
  if (!weightKg || weightKg <= 0) return Promise.reject(new Error('INVALID_WEIGHT'))

  const db = wx.cloud.database()
  const collection = db.collection('weight_records')
  const data = {
    userId,
    weightKg,
    date,
    note,
    updatedAt: db.serverDate()
  }

  return collection.where({ userId, date }).limit(1).get()
    .then(res => {
      const existing = (res.data && res.data[0]) || null
      if (existing && existing._id) {
        return collection.doc(existing._id).update({ data })
          .then(() => normalizeRecord({ ...existing, ...data }))
      }

      return collection.add({
        data: {
          ...data,
          createdAt: db.serverDate()
        }
      }).then(addRes => normalizeRecord({
        ...data,
        _id: addRes._id,
        createdAt: new Date()
      }))
    })
}

function getWeightRecords(options = {}) {
  const userId = options.userId || getCurrentUserId()
  const limit = Math.max(1, Math.min(100, Math.round(num(options.limit, 7))))
  const collection = getWeightCollection()

  return buildRecordQuery(collection, userId)
    .orderBy('date', 'desc')
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()
    .then(res => ((res.data || []).map(normalizeRecord)))
}

function getLatestWeight(userId) {
  return getWeightRecords({ userId, limit: 1 })
    .then(records => records[0] || null)
}

function calculateProgress(goal = {}, latestWeightRecord = null) {
  const startWeight = r1(goal.currentWeight)
  const targetWeight = r1(goal.targetWeight)
  const latestWeight = latestWeightRecord ? r1(latestWeightRecord.weightKg) : 0
  const currentWeight = latestWeight || startWeight
  const targetLossKg = Math.max(0, r1(startWeight - targetWeight))
  const lostKg = Math.max(0, r1(startWeight - currentWeight))
  const remainingKg = Math.max(0, r1(currentWeight - targetWeight))
  const progressPercent = targetLossKg > 0
    ? Math.min(100, Math.round((lostKg / targetLossKg) * 100))
    : 0

  return {
    hasGoal: Boolean(targetWeight),
    hasWeightRecord: Boolean(latestWeightRecord),
    startWeight,
    currentWeight: r1(currentWeight),
    targetWeight,
    targetLossKg,
    lostKg,
    remainingKg,
    progressPercent,
    latestDate: latestWeightRecord ? latestWeightRecord.date : '',
    currentWeightText: currentWeight ? r1(currentWeight).toFixed(1) : '--',
    targetWeightText: targetWeight ? targetWeight.toFixed(1) : '--',
    lostKgText: lostKg.toFixed(1),
    remainingKgText: remainingKg.toFixed(1)
  }
}

module.exports = {
  addWeightRecord,
  calculateProgress,
  formatDate,
  getLatestWeight,
  getWeightRecords,
  normalizeRecord
}
