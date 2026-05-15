# 健康饮食记微信小程序 MVP

这是「健康饮食记」的微信小程序原生版本，已从 React + Vite 高保真原型重构为 WXML / WXSS / JS。

当前版本先使用 mock 数据和本地存储跑通完整流程，不接真实后端、不接真实付费 AI。

## 页面结构

```text
pages/
  home/       今日饮食首页
  record/     拍照记录页
  analyze/    AI 分析结果页
  diary/      饮食日记页
  report/     周营养报告页
  profile/    我的页面
components/
  meal-card/
  stat-card/
utils/
  nutrition.js
  storage.js
services/
  request.js
  auth.js
  upload.js
mock/
  mockAnalyzeMealImage.js
assets/
```

## 当前功能

- mock 微信登录
- 预留 `wx.login` 和 `POST /api/auth/wechat-login`
- 使用 `wx.chooseMedia` 选择或拍摄餐食图片
- 预留 `wx.uploadFile` 和 `POST /api/upload/meal-image`
- mock AI 识别餐食图片
- 内置 `nutritionMap` 计算热量、蛋白质、碳水、脂肪
- 支持修改食物重量并重新计算营养
- 使用 `wx.setStorageSync` 保存餐食记录
- 首页汇总今日热量和营养进度
- 饮食日记按日期查看本地餐食
- 周报告统计最近 7 天饮食数据

## 本地运行

1. 打开微信开发者工具。
2. 导入本目录：

```text
~/Documents/yinshiji
```

3. AppID 可以先选择测试号或使用 `project.config.json` 里的 `touristappid`。
4. 点击编译运行。

可选文件检查：

```bash
npm run check
```

## 后续真实 API

- `POST /api/auth/wechat-login`
- `POST /api/upload/meal-image`
- `POST /api/ai/analyze-meal`
- `POST /api/meals`
- `GET /api/meals/today`
- `GET /api/meals?date=YYYY-MM-DD`
- `GET /api/reports/weekly`

产品文案仅使用「饮食记录」「营养估算」「健康建议」「生活方式参考」，不提供诊断、治疗或医学判断。
