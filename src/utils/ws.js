// src/utils/ws.js
export class WsClient {
  // 🛑【严重警告：严禁改回接收固定字符串 URL】🛑
  // 原因：后端的 Ticket 是一次性的（用完即毁）。
  // 如果 cpolar 网络抖动导致断线，使用旧 URL 重连会直接触发 401 拒绝访问。
  // 必须通过 urlProvider 回调，在每次 connect 时动态获取一个新鲜的 Ticket。
  constructor(urlProvider) {
    this.urlProvider = urlProvider
    this.ws = null
    this.heartbeatTimer = null
    this.reconnectTimer = null
    this.isManualClose = false
    this.onMessageCallback = null
  }

  async connect() {
    this.isManualClose = false
    try {
      // 🛑【警告：这里必须在每次连接/重连时重新调用】🛑
      const freshUrl = await this.urlProvider()
      this.ws = new WebSocket(freshUrl)

      this.ws.onopen = () => {
        console.log('✅ WebSocket 已连接')
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        if (event.data === 'PONG') return
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
        
        if (!this.isManualClose) {
          // 🛑【警告：重连延迟严禁改为 0 或极小值】🛑
          // 立即重连可能导致 cpolar 瞬间涌入大量请求导致隧道崩溃。3秒是安全缓冲。
          console.log('♻️ 3秒后尝试重连...')
          this.reconnectTimer = setTimeout(() => this.connect(), 3000)
        }
      }
    } catch (error) {
      console.error('获取最新 WS 连接凭证失败，3秒后重试', error)
      if (!this.isManualClose) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }
  }

  send(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(msg)
    }
  }

  startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.send('PING')
    }, 30000)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  close() {
    this.isManualClose = true
    this.stopHeartbeat()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) this.ws.close()
  }
}