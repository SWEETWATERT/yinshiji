const VISION_MODEL_VERSION = 'v0.4.0-step4'

async function analyzeImageWithVision(input = {}) {
  const imageFileID = String(input.imageFileID || '').trim()
  const imageUrl = String(input.imageUrl || '').trim()
  const warnings = []

  if (!imageFileID && !imageUrl) {
    warnings.push('未提供餐食图片，视觉识别占位层未执行图片分析。')
  } else {
    warnings.push('当前版本暂未接入真实视觉 AI，图片内容不会被模型解析，将继续使用备注关键词和食物库匹配。')
  }

  return {
    ok: Boolean(imageFileID || imageUrl),
    recognitionSource: imageFileID || imageUrl ? 'vision_placeholder' : 'keyword_fallback',
    modelProvider: 'placeholder',
    modelVersion: VISION_MODEL_VERSION,
    confidence: 0,
    detectedFoods: [],
    candidates: [],
    warnings
  }
}

// TODO: 后续可在这里接入 Tencent Cloud Vision / OpenAI Vision / Doubao / Qwen。
// 当前文件只提供稳定占位返回，不调用任何外部 AI 或付费接口。

module.exports = {
  analyzeImageWithVision
}
