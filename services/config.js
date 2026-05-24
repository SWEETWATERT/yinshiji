// Public client ID — safe to commit
// DO NOT add your client secret here. Put it in services/config.local.js (gitignored).
const base = {
  FATSECRET_CLIENT_ID:     '7a6120c809bb43bf97cdcd9d180ad3cb',
  FATSECRET_CLIENT_SECRET: ''
}

let local = {}
try {
  local = require('./config.local')
} catch (_) {}

module.exports = Object.assign({}, base, local)
