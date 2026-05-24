/**
 * 已迁移至 services/mealAnalysis.js
 * 此文件保留向后兼容，直接代理到新服务
 */
const { analyzeMealImage } = require('../services/mealAnalysis')

function mockAnalyzeMealImage({ imagePath, mealType, note }) {
  return analyzeMealImage({ imagePath, mealType, note })
}

module.exports = { mockAnalyzeMealImage }
