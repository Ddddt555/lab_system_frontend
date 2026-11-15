import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WsClient } from '../ws'

// 模拟 WebSocket 类
class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1 // 1 represents OPEN
    this.send = vi.fn()
    this.close = vi.fn()
    // 异步触发 onopen，模拟真实连接过程
    setTimeout(() => {
      if (this.onopen) this.onopen()
    }, 0)
  }
}

// 必须挂载到全局，且补充 OPEN 静态属性，因为 ws.js 内部做了严格比对
global.WebSocket = MockWebSocket
global.WebSocket.OPEN = 1

describe('WsClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('应正确连接并发送心跳', async () => {
    const urlProvider = vi.fn().mockResolvedValue('ws://test-url')
    const client = new WsClient(urlProvider)

    // 启动连接
    const connectPromise = client.connect()

    // 推进 0 毫秒以执行 setTimeout(..., 0) 和等待微任务
    await vi.advanceTimersByTimeAsync(0)
    await connectPromise

    expect(client.ws).toBeDefined()
    expect(client.ws.url).toBe('ws://test-url')

    // 推进 30 秒，触发心跳的 setInterval
    await vi.advanceTimersByTimeAsync(30000)
    expect(client.ws.send).toHaveBeenCalledWith('PING')

    // 清理定时器，防止测试卡死
    client.close()
  })

  it('断开后应自动重连', async () => {
    const urlProvider = vi.fn().mockResolvedValue('ws://test-url')
    const client = new WsClient(urlProvider)

    // 首次连接
    const connectPromise = client.connect()
    await vi.advanceTimersByTimeAsync(0)
    await connectPromise

    // 模拟网络断开
    if (client.ws.onclose) {
      client.ws.onclose({ reason: 'Network Error' })
    }

    // 推进 3 秒等待重连
    await vi.advanceTimersByTimeAsync(3000)
    // 推进 0 毫秒触发新连接
    await vi.advanceTimersByTimeAsync(0)

    // 验证 urlProvider 被调用了两次
    expect(urlProvider).toHaveBeenCalledTimes(2)

    // 清理
    client.close()
  })
})
