# 健康饮食记 - 微信小程序

基于微信云开发的饮食记录与营养分析小程序 MVP。用户可拍照记录每日饮食，自动分析营养成分，追踪热量与宏量营养素摄入，生成周报。

**AppID**: `wxaaf0b18d6aa69fcc`  
**云环境**: `cloud1-d8g4goa7pa3308807`（个人版）  
**框架版本**: 基础库 3.16.0

---

## 目录结构

```
yinshiji-miniprogram/
├── app.js                         # 应用入口：云初始化、登录、onboarding 守卫
├── app.json                       # 页面路由、窗口配置、tabBar 配置
├── app.wxss                       # 全局样式（设计系统、通用组件类）
├── pages/                         # 用户端页面 + 小程序内后台页面
│   ├── home/                      # 首页仪表盘
│   ├── record/                    # 拍照/选图记录饮食
│   ├── analyze/                   # 食物识别与营养编辑
│   ├── diary/                     # 7 天饮食日记
│   ├── meal-detail/               # 餐食详情、编辑、删除入口
│   ├── report/                    # 周报分析
│   ├── profile/                   # 我的（个人资料）
│   ├── onboarding/                # 首次身体资料填写
│   └── admin/                     # 小程序内后台管理
├── components/                    # 公共组件
│   ├── BrandHeader/               # 品牌标题头
│   ├── meal-card/                 # 餐次卡片
│   └── stat-card/                 # 营养数据卡片
├── custom-tab-bar/                # 自定义底部导航栏
├── services/                      # 业务服务层
│   ├── auth.js                    # 登录鉴权
│   ├── config.js                  # 公共配置（FatSecret Client ID 等）
│   ├── config.local.js.example    # 本地密钥模板（git 忽略实际文件）
│   ├── request.js                 # HTTP 请求封装
│   ├── upload.js                  # 图片选择与上传
│   ├── mealAnalysis.js            # 文字→食物匹配
│   └── fatsecretApi.js            # FatSecret 第三方 API
├── utils/                         # 工具函数
│   ├── nutrition.js               # 营养计算（总量、评分）
│   └── storage.js                 # 本地缓存读写
├── cloudfunctions/                # 云函数
│   ├── login/                     # 登录 & 用户创建
│   ├── userProfile/               # 资料更新
│   ├── analyzeMeal/               # 食物库/关键词匹配和视觉占位层
│   ├── searchFoodItems/           # 用户端食物库搜索
│   ├── saveMealRecord/            # 保存或更新饮食记录
│   ├── deleteMealRecord/          # 删除本人饮食记录
│   ├── getMealRecords/            # 查询饮食记录
│   ├── getWeeklyReport/           # 周营养报告统计
│   ├── submitFeedback/            # 用户反馈与复核任务
│   ├── adminApi/                  # 后台管理接口
│   └── seedFoodItems/             # 初始化食物数据库
├── mock/                          # Mock 数据（开发用）
│   ├── foodDatabase.js            # 100+ 食物营养数据
│   └── mockAnalyzeMealImage.js    # 模拟图像分析
├── assets/                        # 图片资源
├── scripts/
│   └── check-miniprogram.js       # 项目完整性检查脚本
└── project.config.json            # 微信开发者工具配置
```

---

## 核心流程

### 1. 启动 & 登录

```
App.onLaunch
  ├── wx.cloud.init()              // 初始化云开发
  └── callFunction('login')        // 静默登录
        ├── 新用户 → 创建 users 记录（profileCompleted: false）
        └── 老用户 → 更新 lastLoginAt，返回完整 user 对象
              │
              └── globalData.loginReady (Promise) resolve
```

各 tabBar 页 `onShow` 中等待 `loginReady`，然后调用 `checkOnboarding()`：
- `profileCompleted !== true` → `wx.redirectTo('/pages/onboarding/index')`
- `profileCompleted === true` → 正常加载页面数据

### 2. Onboarding（首次资料填写）

```
用户填写：性别 → 年龄 → 身高 → 体重 → 健康目标 → 备注
            │
            ├── 实时计算 BMI = weight / (height/100)²
            ├── BMI 状态：<18.5 偏瘦 / <24 正常 / <28 超重 / ≥28 偏胖
            │
            └── 保存 → callFunction('userProfile', {action:'update', data:{...}})
                  ├── 云端设置 profileCompleted: true
                  ├── 前端兜底 globalData.user.profileCompleted = true
                  └── 新建模式 → switchTab 首页 / 编辑模式 → navigateBack
```

支持 `?mode=edit` 参数，从「我的」页进入编辑已有资料。

### 3. 饮食记录流程

```
记录页（record）
  ├── 选择餐次：早餐 / 午餐 / 晚餐 / 加餐 / 饮品
  ├── 拍照或从相册选图
  ├── 添加备注标签：少油 / 半碗饭 / 无糖 / 外食 / 夜宵 / 自定义
  └── 开始分析 → 上传图片到云存储 → 跳转 analyze 页
            │
分析页（analyze）
  ├── callFunction('analyzeMeal') → 食物库 + 关键词匹配
  ├── 可通过 searchFoodItems 从食物库手动添加食物
  ├── 展示识别结果列表，用户可调整重量、删除或新增食物
  ├── 实时重算营养数据（热量 / 蛋白质 / 碳水 / 脂肪 / 纤维）
  └── 确认保存 → callFunction('saveMealRecord')
            │
            └── 写入 meal_records 集合（含 _openid 隔离）
            │
日记页（diary）
  └── 点击餐食明细 → 餐食详情页（meal-detail）
        ├── 查看图片、食物明细、营养汇总、识别信息
        ├── 编辑这餐 → analyze 编辑模式 → saveMealRecord 更新本人记录
        └── 删除记录 → deleteMealRecord 删除本人记录
```

### 4. 首页仪表盘

- 今日健康评分（0-100）
- 热量摄入进度 vs 目标（默认 1800 kcal）
- 宏量营养素进度条（蛋白质 / 碳水 / 脂肪）
- 4 个餐次卡片（早 / 午 / 晚 / 加餐），已记录的显示缩略图和热量

### 5. 日记 & 周报

- **日记页**：7 天横向日期选择器，按天展示各餐记录
- **周报页**：平均评分、平均热量、周等级、蛋白质达标率、每日热量柱状图

---

## 云函数 API

| 云函数 | 调用方式 | 入参 | 返回 | 说明 |
|--------|---------|------|------|------|
| `login` | 启动时自动 | — | `{user}` | 静默登录，新用户自动创建 |
| `userProfile` | `{action:'get'}` | — | `{user}` | 获取当前用户资料 |
| `userProfile` | `{action:'update', data:{...}}` | gender, age, heightCm 等 | `{user}` | 更新资料，自动设 profileCompleted:true |
| `analyzeMeal` | `{mealType, note, imageFileID}` | 餐次类型、备注、图片 ID | `{detectedFoods,total,warnings,confidence,needReview,candidates}` | 食物库/关键词匹配，写入识别日志，不确定时生成复核任务 |
| `searchFoodItems` | `{keyword,page,pageSize}` | 食物关键词 | `{foods,total}` | 用户端只读搜索食物库，用于分析页手动添加 |
| `saveMealRecord` | `{mealType,date,foods,totalNutrition,...}` | 完整餐次数据 | `{recordId,updated}` | 新增饮食记录；传 `recordId` 时更新本人已有记录 |
| `deleteMealRecord` | `{recordId}` | 餐食记录 ID | `{ok,deleted}` | 删除本人餐食记录，并取消关联复核任务 |
| `getMealRecords` | `{date}` 或 `{startDate, endDate}` | 日期 | `{records:[]}` | 按日期查询 |
| `getWeeklyReport` | `{days:7}` | 最近天数 | 周报统计 | 统计热量、蛋白质、蔬菜、含糖饮料、外食、夜宵 |
| `submitFeedback` | `{type,message,...}` | 反馈内容 | `{feedbackId,reviewTaskId}` | 用户反馈，必要时生成复核任务 |
| `adminApi` | `{action,...}` | 后台管理动作 | 视 action 而定 | 管理员看板、用户、餐食、食物库、复核、反馈 |
| `seedFoodItems` | — | — | `{inserted, skipped}` | 导入食物数据（按 foodId 去重） |

所有云函数通过 `cloud.getWXContext().OPENID` 获取用户身份，**不信任前端传入的 openid**。

---

## 数据库集合

### users

```javascript
{
  _id, _openid,
  nickName, avatarUrl,
  gender: "男" | "女",         // 性别
  age: 25,                     // 年龄
  heightCm: 170,               // 身高 cm
  weightKg: 60,                // 体重 kg
  bmi: 20.8,                   // BMI
  bmiLevel: "正常",             // 偏瘦 / 正常 / 超重 / 偏胖
  healthGoal: "轻盈健康",       // 轻盈健康 / 减脂 / 增肌 / 控糖 / 规律记录
  calorieTarget: 1800,         // 每日热量目标 kcal
  proteinTarget: 90,           // 蛋白质目标 g
  profileCompleted: true,      // onboarding 完成标记
  createdAt, updatedAt, lastLoginAt
}
```

### meal_records

```javascript
{
  _id, _openid,
  mealType: "lunch",           // breakfast / lunch / dinner / snack / drink
  date: "2026-05-25",
  time: "12:30",
  imageFileID: "cloud://...",  // 图片云存储 ID
  note: "少油",
  foods: [
    { foodId: "sta_white_rice", name: "白米饭", weight: 200,
      kcal: 232, protein: 5.2, carbs: 51.6, fat: 0.6,
      confidence: 0.82, confidenceLabel: "较高",
      weightConfidence: "user_confirmed", source: "keyword_match" }
  ],
  totalNutrition: { kcal: 520, protein: 22, carbs: 65, fat: 12 },
  recognitionSource: "keyword_fallback",
  modelProvider: "mock_keyword",
  modelVersion: "v0.4.0-step2",
  confidence: 0.64,
  needReview: false,
  candidates: [],
  healthScore: 78,
  suggestion: "建议增加蔬菜摄入",
  uncertainty: {
    foodRecognition: "keyword_estimated",
    weightRecognition: "user_confirm_required",
    note: "营养数据为估算值，食物和份量以用户确认后的记录为准。"
  },
  createdAt
}
```

### food_items

```javascript
{
  _id,
  foodId: "sta_white_rice",    // 唯一标识（去重依据）
  nameCn: "白米饭",
  category: "主食",
  aliases: ["米饭", "白饭"],
  icon: "🍚",
  kcalPer100g: 116,
  proteinPer100g: 2.6,
  carbsPer100g: 25.9,
  fatPer100g: 0.3,
  fiberPer100g: 0.3,
  defaultWeightG: 150,
  commonUnits: [
    { label: "半份", weightG: 75 },
    { label: "常规份", weightG: 150 },
    { label: "大份", weightG: 225 }
  ],
  verified: true,
  dataSource: "nutrition_seed_v1",
  dataSourceNote: "常见食物营养估算值，正式上线前建议用权威食物成分表或品牌营养标签复核。"
}
```

### analysis_logs

```javascript
{
  _id, _openid,
  analysisId: "ana_...",
  mealType: "lunch",
  imageFileID: "cloud://...",
  note: "少油 鸡胸肉 米饭",
  detectedFoods: [],
  total: {},
  warnings: [],
  aiAdvice: "",
  status: "estimated" | "empty",
  modelProvider: "mock_keyword",
  modelVersion: "nutrition_estimate_v1",
  confidenceSummary: {
    foodCount: 2,
    hasImage: true,
    hasNote: true,
    needUserConfirm: true
  },
  createdAt
}
```

### review_tasks

```javascript
{
  _id, _openid,
  source: "analysis" | "user_feedback",
  analysisId,
  feedbackId,
  mealRecordId,
  imageFileID,
  reason: "no_food_detected" | "estimated_result_needs_confirmation" | "recognition_wrong",
  detectedFoods: [],
  correctedFoods: [],
  status: "pending" | "resolved" | "ignored",
  priority: "high" | "normal" | "low",
  reviewerOpenid,
  resolutionNote,
  createdAt, updatedAt, resolvedAt
}
```

### user_feedback

```javascript
{
  _id, _openid,
  type: "recognition_wrong" | "nutrition_wrong" | "weight_wrong" | "image_unclear" | "general",
  message: "用户反馈内容",
  mealRecordId,
  analysisId,
  imageFileID,
  payload: {},
  status: "open" | "processing" | "closed",
  adminOpenid,
  adminNote,
  createdAt, updatedAt
}
```

### admin_users

```javascript
{
  _id, _openid,
  role: "owner" | "admin",
  status: "active" | "disabled",
  createdAt, updatedAt
}
```

### app_config

```javascript
{
  _id,
  key: "default",
  value: {
    calorieTargetDefault: 1800,
    proteinTargetDefault: 90,
    reviewEnabled: true
  },
  updatedBy,
  createdAt,
  updatedAt
}
```

---

## 云开发后台第一阶段

### 后台管理接口

`adminApi` 是后台管理聚合云函数，通过 `action` 区分功能：

| action | 说明 |
|--------|------|
| `whoami` | 查看当前 openid 和管理员状态 |
| `bootstrapAdmin` | 用 `ADMIN_SETUP_KEY` 初始化当前用户为管理员 |
| `dashboard` | 后台看板：用户数、餐食数、今日记录、待复核、反馈 |
| `listUsers` | 用户列表 |
| `listMeals` | 餐食记录列表，支持 date/openid/mealType |
| `listFoodItems` | 食物库列表，支持 category/keyword |
| `upsertFoodItem` | 新增或更新食物营养数据 |
| `listReviewTasks` | 待复核任务 |
| `resolveReviewTask` | 处理复核任务 |
| `listFeedback` | 用户反馈列表 |
| `updateFeedbackStatus` | 更新反馈状态 |
| `getAppConfig` | 获取配置 |
| `setAppConfig` | 更新配置 |

### 管理员配置

后台接口默认只允许管理员 openid 调用。推荐两种方式：

1. 云函数环境变量配置：
   - `ADMIN_OPENIDS=openid1,openid2`
   - `ADMIN_SETUP_KEY=一串只有管理员知道的随机密钥`

2. 调用 `adminApi` 初始化管理员：

```javascript
wx.cloud.callFunction({
  name: 'adminApi',
  data: {
    action: 'bootstrapAdmin',
    setupKey: '你的 ADMIN_SETUP_KEY'
  }
})
```

初始化后会写入 `admin_users` 集合。后续后台管理页面应先调用 `adminApi({ action: 'whoami' })` 判断权限。

### 云函数部署顺序

1. 上传并部署 `login`
2. 上传并部署 `userProfile`
3. 上传并部署 `seedFoodItems`，并执行一次初始化食物库
4. 上传并部署 `analyzeMeal`
5. 上传并部署 `saveMealRecord`
6. 上传并部署 `getMealRecords`
7. 上传并部署 `getWeeklyReport`
8. 上传并部署 `submitFeedback`
9. 上传并部署 `searchFoodItems`
10. 上传并部署 `deleteMealRecord`
11. 上传并部署 `adminApi`

### 后台页面下一步

当前后台是在小程序内完成的管理模块，管理员从「我的」页进入。已包含：

- 数据看板
- 用户管理
- 餐食记录
- AI 复核
- 食物营养库
- 用户反馈
- 配置管理

### 识别可信度规则

当前版本不假装“看图就能精确知道热量”：`analyzeMeal` 先根据备注关键词匹配 `food_items`，图片仅作为记录附件保存。每个识别结果都会带：

- `confidence` / `confidenceLabel`：食物名称匹配可信度
- `weightConfidence`：份量是否由用户确认
- `needUserConfirm`：默认要求用户确认份量
- `estimateNote`：解释估算来源

后续接入真实视觉 AI 时，应继续保留这些字段。图片清晰度低、遮挡严重、混合菜无法分辨时，需要返回低可信度并提示用户手动确认，不能直接给出确定结论。

---

## 我的页 - 性别适配

`pages/profile/index.js` 根据 `user.gender` 动态切换显示内容：

| 字段 | 男 (male / 男) | 女 (female / 女) | 未设置 |
|------|---------------|-----------------|--------|
| displayName | nickName 或「我的档案」 | nickName 或「我的档案」 | nickName 或「我的档案」 |
| avatarUrl | /assets/avatar-male.png | /assets/girl-avatar.jpg | /assets/girl-avatar.jpg |
| characterUrl | /assets/boy-3d-character.png | /assets/girl-3d-character-profile.png | 隐藏 |
| avatarFallbackText | 男 | 女 | 我 |

头像图片加载失败时显示紫色圆形文字占位（`avatarLoadError` 机制），不会 fallback 到异性头像。

---

## 设计系统

| 变量 | 值 | 用途 |
|------|-----|------|
| 主色 | `#8B6CFF` | 按钮、选中态、强调 |
| 渐变 | `#FF83B7 → #8B6CFF` | 主按钮、进度条 |
| 页面背景 | `#F7F2EA` | 暖米色底 |
| 正文色 | `#25232A` | 标题、正文 |
| 辅助色 | `#807987` | 标签、说明 |
| 卡片 | `#FFF` + `border: #E9E1D8` | section-card |
| 健康绿 | `#7FA66A` | 饮食模式卡片 |

全局 class：`.section-card`（白卡片）、`.primary-button`（渐变按钮）、`.chip`（标签选择器）、`.fixed-bottom-button`（底部固定区域）

---

## 开发 & 部署

### 环境准备

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入项目目录，AppID 填 `wxaaf0b18d6aa69fcc`
3. 开通云开发，选择 `cloud1` 环境

### 云函数部署

在微信开发者工具中，右键每个云函数文件夹 → **上传并部署：云端安装依赖**：

```
cloudfunctions/login
cloudfunctions/userProfile
cloudfunctions/analyzeMeal
cloudfunctions/searchFoodItems
cloudfunctions/saveMealRecord
cloudfunctions/deleteMealRecord
cloudfunctions/getMealRecords
cloudfunctions/getWeeklyReport
cloudfunctions/submitFeedback
cloudfunctions/seedFoodItems
cloudfunctions/adminApi
```

### 数据库初始化

1. 云开发控制台 → 数据库 → 新建集合：
   - `users`
   - `meal_records`
   - `food_items`
   - `analysis_logs`
   - `review_tasks`
   - `user_feedback`
   - `admin_users`
   - `app_config`
2. 调用 `seedFoodItems` 云函数导入食物数据（按 foodId 去重，可重复调用）

### 本地密钥

```bash
cp services/config.local.js.example services/config.local.js
# 编辑填入 FatSecret Client Secret
```

> **安全要求**：不要提交 `config.local.js`，不要提交任何 API Key。

### 项目检查

```bash
node scripts/check-miniprogram.js
```

### 包体积

assets 约 532KB，总包约 700KB（2MB 上限内）。新增大图请先压缩到 200KB 以内。

---

## 安全规范

1. **openid 隔离**：所有数据读写按 `_openid` 过滤，来源为 `cloud.getWXContext().OPENID`
2. **云函数鉴权**：敏感操作走云函数，前端不直接操作数据库
3. **密钥管理**：第三方 API Secret 放 `config.local.js`（已 gitignore）
4. **userProfile 容错**：`findUser()` 兼容 `_openid` 和 `openid` 字段，查不到时自动创建

---

## 待办 & 已知限制

- [ ] 微信头像 / 昵称获取（需 `<button open-type="chooseAvatar">` 授权）
- [ ] AI 图像识别接入（当前用关键词匹配，预留云函数扩展点）
- [ ] FatSecret API 实际接通（`api.example.com` 为占位）
- [ ] 设置页功能（当前 toast 占位）
- [ ] 数据导出
- [ ] 多语言支持

---

> 产品文案仅使用「饮食记录」「营养估算」「健康建议」「生活方式参考」，不提供诊断、治疗或医学判断。
