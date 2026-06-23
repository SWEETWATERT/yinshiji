# v0.5.0 用户餐食 MVP 验收总记录

## 版本范围

- 分支：`wechat-miniprogram-mvp`
- 阶段：`v0.5.0-user-meal-mvp`
- 范围：用户端餐食记录、确认、保存、详情、编辑、删除，以及后台复核联动。

## 当前已完成能力

### 1. 记录一餐

- 用户可在 `记录` 页选择餐次。
- 支持拍照或从相册选择餐食图片。
- 支持备注，例如 `牛肉100克`、`白粥200克`、`少油`。
- 点击开始分析后进入分析页。

### 2. 识别与确认

- `analyzeMeal` 已统一返回结构：
  - `detectedFoods`
  - `total`
  - `warnings`
  - `aiAdvice`
  - `recognitionSource`
  - `modelProvider`
  - `modelVersion`
  - `confidence`
  - `needReview`
  - `candidates`
  - `visionResult`
- 当前识别来源为：
  - `food_items` 食物库匹配
  - 关键词 fallback
  - 视觉识别占位层 `vision_placeholder`
- 当前不接外部视觉 AI，不会假装“看图就能准确识别热量”。

### 3. 分析页可编辑

- 用户可以修改每个食物的克数。
- 修改克数后自动重算：
  - 热量
  - 蛋白质
  - 碳水
  - 脂肪
  - 膳食纤维
- 用户可以删除识别项。
- 用户可以手动添加食物。
- 用户可以通过 `searchFoodItems` 搜索食物库并添加带营养数据的食物。

### 4. 保存与统计

- `saveMealRecord` 保存用户确认后的：
  - `foods`
  - `detectedFoods`
  - `confirmedFoods`
  - `totalNutrition`
  - `total`
  - 识别元数据
- 首页今日摄入和营养进度基于真实 `meal_records` 汇总。
- 日记页可以看到每日餐食明细。

### 5. 餐食详情

- 日记页餐食明细卡片可点击进入 `餐食详情`。
- 详情页展示：
  - 餐食图片
  - 餐次
  - 日期时间
  - 备注
  - 总热量
  - 蛋白质 / 碳水 / 脂肪 / 纤维
  - 食物明细
  - 识别方式
  - 置信度
  - 复核提示
  - 营养建议

### 6. 编辑餐食

- 详情页可点击 `编辑这餐`。
- 编辑模式复用分析页：
  - 修改克数
  - 删除食物
  - 手动添加食物
  - 食物库添加
- 保存时传 `recordId`，更新本人已有记录，不新增重复记录。
- `saveMealRecord` 校验 `_openid`，非本人不能更新。

### 7. 删除餐食

- 详情页可点击 `删除记录`。
- 删除前有二次确认。
- `deleteMealRecord` 校验 `_openid`，非本人不能删除。
- 删除后：
  - 移除 `meal_records`
  - 关联 `review_tasks` 标记为 `cancelled`
  - 关联 `analysis_logs` 标记为 `meal_deleted`

### 8. 后台复核联动

- `needReview=true` 或低置信度记录保存后，会创建或更新后台 `review_tasks`。
- 后台 AI 复核任务页可查看任务。
- 管理员可处理复核任务。
- 已处理任务不会被用户编辑强制重置成 `pending`。

## 必须部署的云函数

在微信开发者工具中，以下云函数需要上传并部署，选择 `云端安装依赖`：

```text
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

## 必须存在的数据库集合

```text
users
meal_records
food_items
analysis_logs
review_tasks
user_feedback
admin_users
app_config
```

## 手动验收流程

### A. 食物库准备

1. 进入后台 `食物库`。
2. 搜索 `牛肉`，确认存在启用状态的牛肉。
3. 搜索 `白粥`，确认存在启用状态的白粥。
4. 如果不存在，先用后台食物库新增。

### B. 新增记录

1. 进入 `记录` 页。
2. 上传任意图片。
3. 备注输入 `牛肉100克`。
4. 开始分析。
5. 分析页应显示牛肉。
6. 修改克数为 `200`。
7. 保存。
8. 首页今日摄入应增加。
9. 日记页应显示这条记录。

### C. 食物库添加

1. 在分析页点击 `食物库添加`。
2. 搜索 `白粥`。
3. 点击添加。
4. 白粥应进入食物列表并带入营养数据。
5. 修改克数后汇总应变化。

### D. 详情查看

1. 进入 `日记` 页。
2. 点击餐食明细卡。
3. 进入详情页。
4. 确认图片、总营养、食物明细、识别信息显示正常。

### E. 编辑记录

1. 在详情页点击 `编辑这餐`。
2. 修改食物克数。
3. 点击 `确认更新`。
4. 返回详情页后数据应刷新。
5. 日记页不应新增重复记录。
6. 首页统计应按更新后的记录汇总。

### F. 删除记录

1. 在详情页点击 `删除记录`。
2. 取消时不删除。
3. 再次点击并确认删除。
4. 返回日记页后记录应消失。
5. 首页统计应减少。

### G. 低置信度复核

1. 保存 `needReview=true` 或 `confidence < 0.6` 的餐食。
2. 进入后台 `AI复核任务`。
3. 应能看到对应任务。
4. 删除该餐食后，相关任务应标记为 `cancelled`。

## 已知限制

- 当前图片识别仍为占位层，真实视觉 AI 未接入。
- 用户手动输入未知食物时，若未从食物库添加，营养可能为 0。
- 暂无餐食图片重新上传编辑。
- 暂无删除恢复。
- 暂无管理员复核结果自动回写用户餐食。

## 下一阶段建议

### v0.6.0

- 引入真实视觉识别服务，但必须保留用户确认和低置信度复核。
- 增加餐食图片重新选择能力。
- 增加管理员复核结果回写流程。
- 增加操作日志 `operation_logs`。
- 完善用户隐私和营养估算免责声明。

## 检查命令

当前阶段应通过：

```bash
node scripts/check-miniprogram.js
node scripts/check-cloud-backend.js
node --check cloudfunctions/saveMealRecord/index.js
node --check cloudfunctions/deleteMealRecord/index.js
node --check cloudfunctions/searchFoodItems/index.js
node --check pages/analyze/index.js
node --check pages/meal-detail/index.js
```
