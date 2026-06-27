// Frontend-safe config only. Do not import local secret files in the mini-program bundle.
const base = {
  // Leave empty to use the current/default CloudBase environment selected in WeChat DevTools.
  // Set this only when the AppID definitely owns that environment.
  CLOUD_ENV_ID: '',
  FATSECRET_CLIENT_ID:     '7a6120c809bb43bf97cdcd9d180ad3cb',
  FATSECRET_CLIENT_SECRET: ''
}

module.exports = base
