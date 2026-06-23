# v0.5.0-step3 餐食记录编辑验收记录

## 版本范围

- 分支：`wechat-miniprogram-mvp`
- 功能提交：`e81a883 feat: support editing meal records`
- 目标：用户保存餐食后，可以从日记进入餐食详情，并编辑本人已有餐食记录。

## 本步新增能力

- `saveMealRecord` 支持带 `recordId` 更新本人名下的 `meal_records`。
- 更新时会校验记录归属：
  - 只能更新当前 `OPENID` 自己的记录
  - 找不到记录返回 `MEAL_RECORD_NOT_FOUND`
  - 非本人记录返回 `NO_RECORD_PERMISSION`
- 餐食详情页新增 `编辑这餐` 按钮。
- 分析页新增编辑模式：
  - 从 `getMealRecords` 读取原记录
  - 复用现有食物克数修改、删除、手动添加、食物库添加能力
  - 保存时更新原记录，不再新增一条重复记录
- 编辑保存后返回餐食详情页，详情页会自动刷新。

## 部署要求

本步骤修改了云函数：

```text
cloudfunctions/saveMealRecord
```

请在微信开发者工具中右键该云函数，选择：

```text
上传并部署：云端安装依赖
```

部署完成后重新编译小程序。

## 手动验收步骤

### 1. 创建一条餐食

1. 进入 `记录` 页。
2. 备注输入 `牛肉100克`。
3. 进入分析页，确认保存。
4. 首页今日摄入应更新。
5. 日记页应显示这条记录。

### 2. 进入详情

1. 进入 `日记` 页。
2. 点击刚保存的餐食明细卡片。
3. 应进入 `餐食详情` 页。
4. 页面应展示：
   - 图片
   - 餐次
   - 日期时间
   - 总热量
   - 蛋白质 / 碳水 / 脂肪 / 纤维
   - 食物明细

### 3. 编辑并更新

1. 在餐食详情页点击 `编辑这餐`。
2. 分析页标题应显示 `编辑餐食`。
3. 把牛肉克数从 `100` 改为 `200`。
4. 点击 `确认更新`。
5. 返回详情页后，热量和食物克数应刷新。
6. 回到首页，今日摄入应按更新后的记录汇总。
7. 日记页不应出现重复餐食记录。

### 4. 复核任务联动

1. 如果该记录 `needReview=true` 或 `confidence < 0.6`，更新后应继续关联后台复核任务。
2. 已处理的复核任务不会被强制改回 `pending`。

## 当前限制

- 暂不支持删除餐食记录。
- 暂不支持修改餐食图片。
- 暂不支持管理员复核后自动回写用户餐食。
- 编辑入口只从餐食详情页进入。

## 检查命令

本步骤通过以下检查：

```bash
node scripts/check-miniprogram.js
node scripts/check-cloud-backend.js
node --check cloudfunctions/saveMealRecord/index.js
node --check pages/analyze/index.js
node --check pages/meal-detail/index.js
```
