const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const now = new Date()

  const { data } = await db.collection('users').where({ _openid: OPENID }).limit(1).get()

  if (data.length > 0) {
    const user = data[0]
    const patch = { lastLoginAt: now }
    if (user.profileCompleted === undefined) {
      patch.profileCompleted = false
    }
    await db.collection('users').doc(user._id).update({ data: patch })
    return { user: { ...user, ...patch } }
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
  return { user: newUser }
}
