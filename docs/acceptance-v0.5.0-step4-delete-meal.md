# v0.5.0-step4 餐食记录删除验收记录

## 版本范围

- 分支：`wechat-miniprogram-mvp`
- 功能提交：`e3bc355 feat: support deleting meal records`
- 目标：用户可以删除本人已保存的餐食记录，删除后首页和日记统计同步变化。

## 本步新增能力

- 新增云函数：`deleteMealRecord`
- 餐食详情页新增 `删除记录` 按钮。
- 删除前会弹出二次确认。
- 云函数通过 `cloud.getWXContext().OPENID` 校验记录归属：
  - 只能删除当前用户自己的 `meal_records`
  - 缺少记录 ID 返回 `MISSING_RECORD_ID`
  - 找不到记录返回 `MEAL_RECORD_NOT_FOUND`
  - 非本人记录返回 `NO_RECORD_PERMISSION`
- 删除餐食后：
  - 移除对应 `meal_records`
  - 关联 `review_tasks` 标记为 `cancelled`
  - 关联 `analysis_logs` 标记为 `meal_deleted`

## 部署要求

必须在微信开发者工具中部署新增云函数：

```text
cloudfunctions/deleteMealRecord
```

操作：

1. 右键 `cloudfunctions/deleteMealRecord`
2. 选择 `上传并部署：云端安装依赖`
3. 等待部署完成
4. 重新编译小程序

## 手动验收步骤

### 1. 删除入口

1. 进入 `日记` 页。
2. 点击一条餐食记录，进入 `餐食详情`。
3. 页面应显示 `删除记录` 按钮。

### 2. 删除确认

1. 点击 `删除记录`。
2. 应弹出确认框。
3. 点击取消时，不应删除记录。
4. 再次点击删除并确认。

### 3. 删除后验证

1. 删除成功后应返回日记页。
2. 日记页刷新后不应再显示这条餐食。
3. 首页今日摄入和营养汇总应减少。
4. 后台餐食记录中不应再看到该记录。

### 4. 复核任务联动

如果该餐食存在后台 AI 复核任务：

1. 后台 `AI复核任务` 中该任务应变为 `cancelled`。
2. 管理员不应继续按正常待复核任务处理这条已删除餐食。

## 当前限制

- 删除后不可恢复。
- 暂不提供回收站。
- 暂不支持批量删除。
- 管理员后台暂不提供删除用户餐食入口，本步骤仅支持用户删除本人记录。

## 检查命令

本步骤通过以下检查：

```bash
node scripts/check-miniprogram.js
node scripts/check-cloud-backend.js
node --check cloudfunctions/deleteMealRecord/index.js
node --check pages/meal-detail/index.js
```
