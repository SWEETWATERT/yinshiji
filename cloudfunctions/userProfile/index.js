const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const ADMIN_ROLE_SET = ['owner', 'admin']
const ENSURED_COLLECTIONS = {}

function normalizeOpenid(value) {
  return String(value || '')
    .replace(/[\s\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

async function findUser(openid) {
  if (!openid || !String(openid).trim()) return null

  await ensureCollection('users')

  const { data } = await db.collection('users')
    .where({ _openid: openid }).limit(1).get()
  if (data.length > 0) return data[0]
  const fallback = await db.collection('users')
    .where({ openid: openid }).limit(1).get()
  return fallback.data[0] || null
}

async function ensureCollection(name) {
  if (ENSURED_COLLECTIONS[name]) return

  try {
    await db.createCollection(name)
  } catch (err) {
    const message = String((err && (err.errMsg || err.message || err.code)) || '')
    const exists = message.indexOf('already exist') !== -1 ||
      message.indexOf('already exists') !== -1 ||
      message.indexOf('collection exists') !== -1 ||
      message.indexOf('DATABASE_COLLECTION_ALREADY_EXISTS') !== -1 ||
      message.indexOf('-502005') !== -1
    if (!exists) {
      throw err
    }
  }

  ENSURED_COLLECTIONS[name] = true
}

function normalizeAdminOpenids() {
  return String(process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

async function getAdminInfo(openid) {
  const currentOpenid = normalizeOpenid(openid)
  const debugInput = {
    hasOpenid: !!currentOpenid,
    openid: currentOpenid,
    adminByUnderscoreCount: 0,
    adminByOpenidCount: 0,
    adminFallbackCount: 0,
    matchedAdminRecord: null,
    matchedAdminOpenid: '',
    adminStatus: '',
    adminRole: '',
    activeOk: false,
    roleOk: false,
    isAdmin: false,
    adminRoles: [],
    adminQueryError: ''
  }

  if (!currentOpenid) return { isAdmin: false, roles: [], debugInput }

  if (normalizeAdminOpenids().includes(currentOpenid)) {
    debugInput.matchedAdminRecord = { source: 'ADMIN_OPENIDS' }
    debugInput.matchedAdminOpenid = currentOpenid
    debugInput.adminStatus = 'active'
    debugInput.adminRole = 'owner'
    debugInput.activeOk = true
    debugInput.roleOk = true
    debugInput.adminRoles = ['owner']
    debugInput.isAdmin = true
    return { isAdmin: true, roles: ['owner'], debugInput }
  }

  let matched = null

  try {
    const byUnderscoreOpenid = await db.collection('admin_users')
      .where({ _openid: currentOpenid })
      .limit(1)
      .get()
    const underscoreRecords = byUnderscoreOpenid.data || []
    debugInput.adminByUnderscoreCount = underscoreRecords.length
    matched = underscoreRecords[0] || null
  } catch (err) {
    debugInput.adminQueryError = appendQueryError(debugInput.adminQueryError, `_openid: ${err.message || String(err)}`)
  }

  if (!matched) {
    try {
      const byOpenid = await db.collection('admin_users')
        .where({ openid: currentOpenid })
        .limit(1)
        .get()
      const openidRecords = byOpenid.data || []
      debugInput.adminByOpenidCount = openidRecords.length
      matched = openidRecords[0] || null
    } catch (err) {
      debugInput.adminQueryError = appendQueryError(debugInput.adminQueryError, `openid: ${err.message || String(err)}`)
    }
  }

  if (!matched) {
    try {
      const fallbackRecords = await readAdminUsers(100)
      debugInput.adminFallbackCount = fallbackRecords.length

      matched = fallbackRecords.find(record => {
        const rid1 = normalizeOpenid(record && record._openid)
        const rid2 = normalizeOpenid(record && record.openid)
        return rid1 === currentOpenid || rid2 === currentOpenid
      }) || null
    } catch (err) {
      debugInput.adminQueryError = appendQueryError(debugInput.adminQueryError, `fallback: ${err.message || String(err)}`)
    }
  }

  if (matched) {
    const matchedAdminRecord = pickAdminRecord(matched)
    const adminStatus = normalizeText(matchedAdminRecord.status)
    const role = normalizeText(matchedAdminRecord.role)
    const roles = Array.isArray(matchedAdminRecord.roles)
      ? matchedAdminRecord.roles.map(item => normalizeText(item)).filter(Boolean)
      : []
    const activeOk = adminStatus === 'active'
    const roleOk = role === 'owner' || role === 'admin' || roles.includes('owner') || roles.includes('admin')
    const isAdmin = Boolean(matchedAdminRecord && activeOk && roleOk)
    const adminRoles = roles.length ? roles : (role ? [role] : [])

    debugInput.matchedAdminRecord = matchedAdminRecord
    debugInput.matchedAdminOpenid = matchedAdminRecord._openid || matchedAdminRecord.openid || ''
    debugInput.adminStatus = adminStatus
    debugInput.adminRole = role
    debugInput.activeOk = activeOk
    debugInput.roleOk = roleOk
    debugInput.isAdmin = isAdmin
    debugInput.adminRoles = isAdmin ? adminRoles : []

    return {
      isAdmin,
      roles: isAdmin ? adminRoles : [],
      debugInput
    }
  }

  return { isAdmin: false, roles: [], debugInput }
}

function appendQueryError(current, message) {
  return current ? `${current}; ${message}` : message
}

async function readAdminUsers(limit) {
  const { data } = await db.collection('admin_users')
    .limit(limit)
    .get()
  return data || []
}

function pickAdminRecord(record) {
  if (!record) return null
  return {
    _openid: normalizeOpenid(record._openid),
    openid: normalizeOpenid(record.openid),
    status: record.status || '',
    role: record.role || '',
    roles: Array.isArray(record.roles) ? record.roles : []
  }
}

function buildProfileResponse(user, adminInfo, action) {
  const adminRoles = adminInfo.roles || []
  const safeUser = user
    ? {
        ...user,
        isAdmin: adminInfo.isAdmin,
        adminRoles
      }
    : null

  return {
    user: safeUser,
    profileCompleted: safeUser ? safeUser.profileCompleted === true : false,
    isAdmin: adminInfo.isAdmin,
    adminRoles
  }
}

async function handleUserProfile(event) {
  const rawEvent = event || {}
  const wxContext = cloud.getWXContext()
  const rawData = rawEvent.data || {}
  const currentOpenid = normalizeOpenid(wxContext.OPENID || rawEvent.openid || rawData.openid || '')
  const action = rawEvent.action || (rawEvent.data && rawEvent.data.action) || 'get'
  const data = rawEvent.data && rawEvent.data.data ? rawEvent.data.data : rawEvent.data

  if (!currentOpenid) {
    if (action === 'update' || action === 'set' || action === 'save') {
      return {
        error: 'OPENID_EMPTY',
        message: '缺少 openid，请在小程序真实登录环境调用'
      }
    }

    return {
      user: null,
      profileCompleted: false,
      isAdmin: false,
      adminRoles: []
    }
  }

  if (action === 'update' && data) {
    await ensureCollection('users')

    const updateData = {
      ...data,
      profileCompleted: true,
      updatedAt: new Date()
    }

    const existing = await findUser(currentOpenid)

    if (existing) {
      await db.collection('users').doc(existing._id).update({ data: updateData })
    } else {
      await db.collection('users').add({
        data: {
          _openid: currentOpenid,
          nickName: '',
          avatarUrl: '',
          ...updateData,
          createdAt: new Date()
        }
      })
    }

    const user = await findUser(currentOpenid)
    const adminInfo = await getAdminInfo(currentOpenid)
    return buildProfileResponse(user, adminInfo, action)
  }

  const user = await findUser(currentOpenid)
  const adminInfo = await getAdminInfo(currentOpenid)
  return buildProfileResponse(user, adminInfo, action)
}

exports.main = async (event) => {
  try {
    return await handleUserProfile(event)
  } catch (err) {
    return {
      error: 'USER_PROFILE_SAVE_FAILED',
      message: err && (err.errMsg || err.message) ? (err.errMsg || err.message) : '用户资料保存失败',
      detail: err && err.code ? err.code : ''
    }
  }
}
