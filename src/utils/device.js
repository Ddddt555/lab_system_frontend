// src/utils/device.js
export function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId')
  if (!deviceId) {
    // 优先使用现代浏览器的 crypto API 生成 UUID
    if (window.crypto && window.crypto.randomUUID) {
      deviceId = window.crypto.randomUUID().replace(/-/g, '')
    } else {
      // 兜底生成方案
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    }
    localStorage.setItem('deviceId', deviceId)
  }
  return deviceId
}