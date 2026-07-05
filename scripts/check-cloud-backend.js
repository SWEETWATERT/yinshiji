#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const cloudRoot = path.join(root, 'cloudfunctions')

const functions = [
  'login',
  'userProfile',
  'seedFoodItems',
  'analyzeMeal',
  'saveMealRecord',
  'deleteMealRecord',
  'getMealRecords',
  'getWeeklyReport',
  'submitFeedback',
  'searchFoodItems',
  'adminApi'
]

const requiredCollections = {
  login: ['users'],
  userProfile: ['users'],
  seedFoodItems: ['food_items'],
  analyzeMeal: ['food_items', 'analysis_logs', 'review_tasks'],
  saveMealRecord: ['meal_records', 'analysis_logs', 'review_tasks'],
  deleteMealRecord: ['meal_records', 'analysis_logs', 'review_tasks'],
  getMealRecords: ['meal_records'],
  getWeeklyReport: ['meal_records'],
  submitFeedback: ['feedback', 'review_tasks'],
  searchFoodItems: ['food_items'],
  adminApi: ['admin_users']
}

const textExtensions = new Set([
  '.js',
  '.json',
  '.wxml',
  '.wxss',
  '.ts'
])

const frontendRoots = [
  'app.js',
  'app.json',
  'pages',
  'components',
  'services',
  'utils',
  'mock'
]

const report = []
const errors = []
const warnings = []

function rel(file) {
  return path.relative(root, file)
}

function ok(message) {
  report.push(`✅ ${message}`)
}

function warn(message) {
  warnings.push(`⚠️ ${message}`)
}

function fail(message) {
  errors.push(`❌ ${message}`)
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (err) {
    fail(`${rel(file)} 不是合法 JSON：${err.message}`)
    return null
  }
}

function walk(target, files = []) {
  if (!fs.existsSync(target)) return files
  const stat = fs.statSync(target)
  if (stat.isFile()) {
    files.push(target)
    return files
  }
  for (const name of fs.readdirSync(target)) {
    if (['.git', 'node_modules', 'miniprogram_npm'].includes(name)) continue
    walk(path.join(target, name), files)
  }
  return files
}

function isTextFile(file) {
  if (file.endsWith('.example')) return false
  return textExtensions.has(path.extname(file))
}

function checkCloudRoot() {
  if (!fs.existsSync(cloudRoot)) {
    fail('缺少 cloudfunctions 目录')
    return
  }
  ok('cloudfunctions 目录存在')
}

function checkFunctionStructure() {
  for (const name of functions) {
    const dir = path.join(cloudRoot, name)
    const indexFile = path.join(dir, 'index.js')
    const packageFile = path.join(dir, 'package.json')

    if (!fs.existsSync(dir)) {
      fail(`缺少云函数目录：cloudfunctions/${name}`)
      continue
    }
    ok(`云函数目录存在：cloudfunctions/${name}`)

    if (!fs.existsSync(indexFile)) {
      fail(`缺少入口文件：cloudfunctions/${name}/index.js`)
    } else {
      ok(`入口文件存在：cloudfunctions/${name}/index.js`)
    }

    if (!fs.existsSync(packageFile)) {
      fail(`缺少依赖文件：cloudfunctions/${name}/package.json`)
      continue
    }

    const pkg = readJson(packageFile)
    if (!pkg) continue
    const deps = Object.assign({}, pkg.dependencies, pkg.devDependencies)
    if (!deps['wx-server-sdk']) {
      fail(`cloudfunctions/${name}/package.json 缺少 wx-server-sdk`)
    } else {
      ok(`cloudfunctions/${name}/package.json 已包含 wx-server-sdk`)
    }
  }
}

function checkCollectionReferences() {
  for (const [name, collections] of Object.entries(requiredCollections)) {
    const indexFile = path.join(cloudRoot, name, 'index.js')
    if (!fs.existsSync(indexFile)) continue
    const source = fs.readFileSync(indexFile, 'utf8')
    for (const collection of collections) {
      if (!source.includes(collection)) {
        fail(`cloudfunctions/${name}/index.js 未发现关键集合名：${collection}`)
      } else {
        ok(`cloudfunctions/${name}/index.js 包含关键集合：${collection}`)
      }
    }
  }
}

function checkSensitiveInfo() {
  const files = frontendRoots.flatMap(item => walk(path.join(root, item))).filter(isTextFile)
  const sourceFiles = walk(root).filter(file => {
    if (!isTextFile(file)) return false
    const relative = rel(file)
    return !relative.startsWith('assets/') &&
      !relative.startsWith('assets_backup_before_compress/') &&
      !relative.startsWith('docs/')
  })

  const openAiKeyPattern = new RegExp('\\b' + 's' + 'k' + '-[A-Za-z0-9_-]{10,}')
  const githubTokenPattern = new RegExp('\\b' + 'gh' + 'p_[A-Za-z0-9_]{10,}')
  const googleKeyPattern = new RegExp('AI' + 'za[0-9A-Za-z_-]{20,}')
  const slackTokenPattern = new RegExp('xo' + 'x[baprs]-[0-9A-Za-z-]{10,}')
  const nonEmptySecretPattern = /(?:SECRET|TOKEN|PRIVATE_KEY)\s*[:=]\s*['"`](?!YOUR_|your_|填|这里|$)[^'"`]{8,}['"`]/

  for (const file of sourceFiles) {
    const source = fs.readFileSync(file, 'utf8')
    if (openAiKeyPattern.test(source)) fail(`${rel(file)} 疑似包含 OpenAI API Key`)
    if (githubTokenPattern.test(source)) fail(`${rel(file)} 疑似包含 GitHub Token`)
    if (googleKeyPattern.test(source)) fail(`${rel(file)} 疑似包含 Google API Key`)
    if (slackTokenPattern.test(source)) fail(`${rel(file)} 疑似包含 Slack Token`)
    if (nonEmptySecretPattern.test(source)) fail(`${rel(file)} 疑似包含真实密钥或 Token`)
  }

  const localConfigImportPattern = /(require\s*\(|import\s+).*config\.local/
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    if (localConfigImportPattern.test(source)) {
      fail(`${rel(file)} 在前端代码中引用了 config.local 文件`)
    }
  }

  if (!errors.some(item => /API Key|Token|密钥|config\.local/.test(item))) {
    ok('未发现明显真实 API Key、Token 或前端 config.local 引用')
  }
}

function printReport() {
  console.log('微信云开发后端结构验收报告')
  console.log('='.repeat(32))
  console.log('')

  for (const line of report) console.log(line)
  if (warnings.length) {
    console.log('')
    console.log('提醒：')
    for (const line of warnings) console.log(line)
  }
  if (errors.length) {
    console.log('')
    console.log('失败项：')
    for (const line of errors) console.log(line)
    console.log('')
    console.log(`验收失败：共 ${errors.length} 个问题。`)
    process.exit(1)
  }

  console.log('')
  console.log('验收通过：云函数目录、依赖、集合引用和敏感信息检查均通过。')
  process.exit(0)
}

checkCloudRoot()
checkFunctionStructure()
checkCollectionReferences()
checkSensitiveInfo()
printReport()
