const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

async function findUser(openid) {
  const { data } = await db.collection('users')
    .where({ _openid: openid }).limit(1).get()
  if (data.length > 0) return data[0]
  const fallback = await db.collection('users')
    .where({ openid: openid }).limit(1).get()
  return fallback.data[0] || null
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data } = event

  if (action === 'update' && data) {
    const updateData = {
      ...data,
      profileCompleted: true,
      updatedAt: new Date()
    }

    const existing = await findUser(OPENID)

    if (existing) {
      await db.collection('users').doc(existing._id).update({ data: updateData })
    } else {
      await db.collection('users').add({
        data: {
          _openid: OPENID,
          nickName: '',
          avatarUrl: '',
          ...updateData,
          createdAt: new Date()
        }
      })
    }

    const user = await findUser(OPENID)
    return { user }
  }

  const user = await findUser(OPENID)
  return { user }
}
