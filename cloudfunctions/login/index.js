const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function ensureCollection(name) {
  try {
    await db.createCollection(name)
  } catch (err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    const exists = message.includes('already exist') ||
      message.includes('already exists') ||
      message.includes('collection exists') ||
      message.includes('DATABASE_COLLECTION_ALREADY_EXISTS') ||
      message.includes('-502005') ||
      message.includes('ResourceExist') ||
      message.includes('DATABASE_COLLECTION_ALREADY_EXIST') ||
      message.includes('Table exist')
    if (!exists) throw err
  }
}

exports.main = async (event, context) => {
  const rawEvent = event || {}
  const rawData = rawEvent.data || {}
  const { OPENID: wxOpenid } = cloud.getWXContext()
  const OPENID = wxOpenid || rawEvent.openid || rawData.openid || 'cloud_recovery_openid'
  const now = new Date()

  await ensureCollection('users')

  const { data } = await db.collection('users').where({ _openid: OPENID }).limit(1).get()

  if (data.length > 0) {
    const user = data[0]
    const patch = { lastLoginAt: now }
    if (user.profileCompleted === undefined) {
      patch.profileCompleted = false
    }
    await db.collection('users').doc(user._id).update({ data: patch })
    return { openid: OPENID, user: { ...user, ...patch } }
  }

  const newUser = {
    _openid: OPENID,
    nickName: '',
    avatarUrl: '',
    gender: '',
    age: 0,
    heightCm: 0,
    weightKg: 0,
    bmi: 0,
    bmiLevel: '',
    healthGoal: '',
    remark: '',
    calorieTarget: 1800,
    proteinTarget: 90,
    profileCompleted: false,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  }

  const { _id } = await db.collection('users').add({ data: newUser })
  newUser._id = _id
  return { openid: OPENID, user: newUser }
}
