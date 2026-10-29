// src/utils/ws.js
import { ElMessage } from 'element-plus'

export class WsClient {
  constructor(url) {
    this.url = url
    this.ws = null
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.isManualClose = false // 是否主动关闭（防止退出时自动重连）
    this.onMessageCallback = null // 收到消息的回调
  }

  // 连接
  connect() {
    this.isManualClose = false
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('✅ WebSocket 已连接')
      this.startHeartbeat()
    }

    this.ws.onmessage = (event) => {
      // 忽略心跳回执
      if (event.data === 'PONG') return
      
      // 触发业务回调
      if (this.onMessageCallback) {
        this.onMessageCallback(event.data)
      }
    }

    this.ws.onerror = (e) => {
      console.error('❌ WebSocket 出错', e)
    }

    this.ws.onclose = (e) => {
      console.log('🔌 WebSocket 已断开', e.reason)
      this.stopHeartbeat()
      
      // 如果不是主动关闭，尝试重连
      if (!this.isManualClose) {
        console.log('♻️ 3秒后尝试重连...')
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }
  }

  // 发送消息
  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg)
    }
  }

  // 开启心跳
  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send('PING')
    }, 30000) // 每 30 秒发一次 PING
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 手动关闭（例如组件卸载或页面退出时）
  close() {
    this.isManualClose = true
    this.stopHeartbeat()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) this.ws.close()
  }
}