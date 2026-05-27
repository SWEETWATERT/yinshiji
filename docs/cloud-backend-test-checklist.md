# 微信云开发后台手动测试清单

这份清单用于确认「健康饮食记」当前云开发后台是否真的能跑通。你不需要懂代码，按步骤在微信开发者工具里操作即可。

## 1. 打开云开发

1. 打开微信开发者工具。
2. 打开项目 `yinshiji-miniprogram`。
3. 看顶部工具栏，点击「云开发」。
4. 如果提示开通云开发，先按提示开通。
5. 确认当前环境是项目使用的环境，例如：`cloud1-d8g4goa7pa3308807`。

如果环境选错，云函数和数据库会查不到数据。

## 2. 确认云环境已经开通

进入「云开发」后，检查左侧是否能看到：

- 数据库
- 云函数
- 云存储
- 设置

如果这些菜单都能打开，说明云环境已经开通。

## 3. 确认数据库集合存在

1. 在「云开发」里点击「数据库」。
2. 查看左侧集合列表。
3. 需要存在这些集合：

| 集合名 | 用途 |
|---|---|
| `users` | 用户资料 |
| `meal_records` | 餐食记录 |
| `food_items` | 食物营养库 |
| `analysis_logs` | 每次识别/分析日志 |
| `review_tasks` | 需要人工复核的任务 |
| `user_feedback` | 用户反馈 |
| `admin_users` | 管理员记录 |
| `app_config` | 后台配置 |

如果缺少集合，就在数据库页面点击「新建集合」，按上面的名字逐个创建。

## 4. 确认云函数已部署

1. 在「云开发」里点击「云函数」。
2. 确认列表里有这些云函数：

- `login`
- `userProfile`
- `seedFoodItems`
- `analyzeMeal`
- `saveMealRecord`
- `getMealRecords`
- `getWeeklyReport`
- `submitFeedback`
- `adminApi`

如果某个不存在，回到微信开发者工具左侧项目文件，右键对应 `cloudfunctions/函数名`，选择「上传并部署：云端安装依赖」。

## 5. 测试 login

用途：确认当前微信用户能登录，并能拿到 openid。

操作：

1. 打开「云开发」。
2. 点击「云函数」。
3. 找到 `login`。
4. 点击「云端测试」。
5. 测试参数填：

```json
{}
```

期望结果：

```json
{
  "user": {
    "_openid": "这里是你的 openid",
    "profileCompleted": false
  }
}
```

重点确认：

- 返回里有 `user`
- `user` 里有 `_openid` 或 `openid`
- 有 `profileCompleted` 字段

## 6. 测试 seedFoodItems

用途：初始化食物营养库。

操作：

1. 找到 `seedFoodItems` 云函数。
2. 点击「云端测试」。
3. 测试参数填：

```json
{}
```

期望结果类似：

```json
{
  "message": "seed complete",
  "inserted": 80,
  "skipped": 0,
  "metadataUpdated": 0
}
```

说明：

- 第一次执行 `inserted` 通常大于 0。
- 第二次重复执行时，`inserted` 可能是 0，`skipped` 会增加，这是正常的。

确认数据库：

1. 打开「数据库」。
2. 进入 `food_items`。
3. 应该能看到白米饭、鸡胸肉、西兰花、鸡蛋、奶茶等食物数据。

## 7. 测试 analyzeMeal

用途：确认识别/营养估算能跑通，并写入分析日志。

前提：

- `food_items` 不能是空的。
- 如果是空的，先执行 `seedFoodItems`。

操作：

1. 找到 `analyzeMeal` 云函数。
2. 点击「云端测试」。
3. 测试参数填：

```json
{
  "mealType": "lunch",
  "note": "米饭 鸡胸肉 西兰花 少油",
  "imageFileID": ""
}
```

期望结果：

```json
{
  "analysisId": "ana_...",
  "detectedFoods": [],
  "total": {},
  "warnings": [],
  "aiAdvice": "..."
}
```

重点确认：

- 有 `analysisId`
- 有 `detectedFoods`
- 有 `total`
- 有 `warnings`
- 有 `aiAdvice`

然后检查数据库：

1. 打开 `analysis_logs` 集合。
2. 应该新增一条记录。
3. 记录里应该有 `analysisId`、`note`、`detectedFoods`、`total`、`status`。

## 8. 测试 saveMealRecord

用途：确认餐食记录能保存到数据库。

操作：

1. 找到 `saveMealRecord` 云函数。
2. 点击「云端测试」。
3. 测试参数填：

```json
{
  "mealType": "lunch",
  "date": "2026-05-27",
  "time": "12:30",
  "imageFileID": "",
  "note": "米饭 鸡胸肉 西兰花 少油",
  "foods": [
    {
      "foodId": "sta_white_rice",
      "name": "白米饭",
      "weight": 150,
      "kcal": 174,
      "protein": 3.9,
      "carbs": 38.9,
      "fat": 0.5,
      "fiber": 0.5,
      "confidence": 0.82,
      "confidenceLabel": "较高",
      "weightConfidence": "user_confirmed",
      "source": "test"
    },
    {
      "foodId": "pro_chicken_breast",
      "name": "鸡胸肉",
      "weight": 120,
      "kcal": 160,
      "protein": 32,
      "carbs": 0,
      "fat": 3,
      "fiber": 0,
      "confidence": 0.82,
      "confidenceLabel": "较高",
      "weightConfidence": "user_confirmed",
      "source": "test"
    }
  ],
  "totalNutrition": {
    "kcal": 334,
    "protein": 35.9,
    "carbs": 38.9,
    "fat": 3.5,
    "fiber": 0.5
  },
  "healthScore": 82,
  "suggestion": "测试记录：搭配比较均衡。",
  "analysisId": "ana_manual_test",
  "analysisVersion": "nutrition_estimate_v1",
  "uncertainty": {
    "foodRecognition": "manual_test",
    "weightRecognition": "user_confirmed",
    "note": "手动测试记录"
  }
}
```

期望结果：

```json
{
  "recordId": "..."
}
```

然后检查数据库：

1. 打开 `meal_records` 集合。
2. 应该新增一条记录。
3. 记录里应该有 `mealType`、`date`、`foods`、`totalNutrition`、`healthScore`。

## 9. 测试 getMealRecords

用途：确认首页、日记能读取餐食记录。

按日期查询：

```json
{
  "date": "2026-05-27"
}
```

期望结果：

```json
{
  "records": []
}
```

按范围查询：

```json
{
  "startDate": "2026-05-21",
  "endDate": "2026-05-27"
}
```

期望结果：

```json
{
  "records": []
}
```

如果你刚刚执行过 `saveMealRecord`，这里应该能查到那条测试记录。

## 10. 测试 getWeeklyReport

用途：确认周报能读取真实餐食记录并生成统计。

测试参数：

```json
{
  "days": 7
}
```

期望结果包含：

```json
{
  "avgScore": 0,
  "avgCalories": 0,
  "avgProtein": 0,
  "vegDays": 0,
  "sugaryDrinks": 0,
  "lateSnacks": 0,
  "trend": [],
  "summary": "..."
}
```

如果有餐食记录，数值会大于 0。

## 11. 测试 adminApi whoami

用途：确认当前用户是不是管理员。

测试参数：

```json
{
  "action": "whoami"
}
```

可能结果一：

```json
{
  "openid": "你的 openid",
  "isAdmin": true
}
```

说明：你已经是管理员。

可能结果二：

```json
{
  "openid": "你的 openid",
  "isAdmin": false
}
```

说明：你还不是管理员。

成为管理员有两种方式：

方式 A：配置环境变量

1. 打开「云开发」。
2. 进入「云函数」。
3. 找到 `adminApi`。
4. 打开「环境变量」。
5. 添加：

```text
ADMIN_OPENIDS=你的openid
```

多个管理员用英文逗号隔开：

```text
ADMIN_OPENIDS=openid1,openid2,openid3
```

方式 B：写入 `admin_users`

在 `admin_users` 集合里插入一条：

```json
{
  "_openid": "你的openid",
  "role": "owner",
  "status": "active"
}
```

一般建议先用方式 A，简单清楚。

## 12. 常见错误解释

### cloud function not found

意思：云函数没有部署，或者函数名写错。

处理：

1. 打开「云函数」。
2. 看对应函数是否存在。
3. 不存在就右键本地 `cloudfunctions/函数名`。
4. 选择「上传并部署：云端安装依赖」。

### collection not exists

意思：数据库集合不存在。

处理：

1. 打开「数据库」。
2. 点击「新建集合」。
3. 创建缺少的集合。

### food_items 为空

意思：食物营养库还没初始化。

处理：

1. 部署 `seedFoodItems`。
2. 云端测试 `seedFoodItems`。
3. 检查 `food_items` 是否出现食物数据。

### NO_ADMIN_PERMISSION

意思：当前 openid 不是管理员。

处理：

1. 先测试 `adminApi`：

```json
{
  "action": "whoami"
}
```

2. 拿到当前 openid。
3. 把 openid 加入 `ADMIN_OPENIDS` 环境变量，或写入 `admin_users`。

### openid 不一致

意思：你测试云函数时使用的微信账号，和配置管理员时的微信账号不是同一个。

处理：

1. 用 `login` 云函数重新测试。
2. 复制返回的 `_openid`。
3. 用这个 openid 配置管理员。

### env 环境不对

意思：你当前打开的是另一个云环境，导致云函数或数据库不是同一套。

处理：

1. 在「云开发」顶部确认环境。
2. 项目当前使用环境：`cloud1-d8g4goa7pa3308807`。
3. 部署云函数、创建集合、测试数据都要在同一个环境里。

### 云函数未部署依赖

意思：云函数里找不到 `wx-server-sdk`。

处理：

1. 右键对应云函数目录。
2. 选择「上传并部署：云端安装依赖」。
3. 不要只选择普通上传。

## 13. 最后本地检查

在项目目录执行：

```bash
node scripts/check-cloud-backend.js
node scripts/check-miniprogram.js
```

期望看到：

```text
验收通过
Mini program file check passed.
```
