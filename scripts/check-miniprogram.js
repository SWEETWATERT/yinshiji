const fs = require('fs')
const path = require('path')

const requiredFiles = [
  'app.json',
  'app.js',
  'app.wxss',
  'project.config.json',
  'pages/home/index.wxml',
  'pages/record/index.wxml',
  'pages/analyze/index.wxml',
  'pages/diary/index.wxml',
  'pages/report/index.wxml',
  'pages/profile/index.wxml',
  'services/request.js',
  'services/auth.js',
  'services/upload.js',
  'mock/mockAnalyzeMealImage.js',
  'utils/nutrition.js',
  'utils/storage.js'
]

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)))

if (missing.length) {
  console.error(`Missing files:\n${missing.join('\n')}`)
  process.exit(1)
}

console.log('Mini program file check passed.')
