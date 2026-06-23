# v0.5.1 餐食问题反馈闭环验收记录

## 版本范围

- 分支：`wechat-miniprogram-mvp`
- 功能提交：`e598917 feat: add meal issue feedback from detail`
- 目标：用户在餐食详情页发现识别或营养估算不准时，可以直接提交反馈，后台能看到并复核。

## 本步新增能力

- 餐食详情页新增 `反馈识别问题` 按钮。
- 用户可选择反馈类型：
  - 识别结果不准确
  - 营养估算不准确
  - 份量估算不准确
  - 图片不清楚
  - 其他问题
- 前端调用 `submitFeedback` 云函数。
- `submitFeedback` 兼容 `event.data` 入参格式。
- 对识别、营养、份量、图片类问题，会自动生成 `review_tasks`。
- 后台 `用户反馈` 页面能看到反馈。
- 后台 `AI复核任务` 页面能看到需要复核的任务。

## 部署要求

本步骤修改了云函数：

```text
cloudfunctions/submitFeedback
```

请在微信开发者工具中右键该云函数，选择：

```text
上传并部署：云端安装依赖
```

部署完成后重新编译小程序。

## 手动验收步骤

### 1. 提交反馈

1. 进入 `日记` 页。
2. 点击任意餐食记录进入 `餐食详情`。
3. 点击 `反馈识别问题`。
4. 选择 `识别结果不准确`。
5. 页面应提示 `已提交反馈`。

### 2. 后台用户反馈

1. 管理员进入 `我的 -> 后台管理 -> 用户反馈`。
2. 应看到刚提交的反馈。
3. 反馈内容应包含餐食记录 ID、反馈类型和相关 payload。

### 3. 后台复核任务

1. 管理员进入 `AI复核任务`。
2. 应看到由反馈创建的复核任务。
3. 来源应为 `user_feedback`。

## 当前限制

- 反馈暂时使用预设类型，不支持用户输入长文本。
- 反馈提交后不会自动修改餐食记录。
- 管理员复核结果暂不自动回写用户餐食。

## 检查命令

本步骤通过：

```bash
node scripts/check-miniprogram.js
node scripts/check-cloud-backend.js
node --check cloudfunctions/submitFeedback/index.js
node --check pages/meal-detail/index.js
```
