import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import request from '../request'

describe('request.js 拦截器逻辑', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('token', 'old-token')
    localStorage.setItem('refreshToken', 'old-refresh')
  })

  it('401 时应该并发去重，只发送一次刷新请求', async () => {
    // 构造 401 错误对象
    const error401 = {
      response: { status: 401, data: { msg: 'Token Expired' } },
      config: { url: '/test-api', headers: {} }
    }
    const error401_2 = {
      response: { status: 401, data: { msg: 'Token Expired' } },
      config: { url: '/test-api-2', headers: {} }
    }

    // 1. 拦截 axios.post，模拟刷新 Token 成功
    const mockPost = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        code: 200,
        data: { token: 'new-token', refreshToken: 'new-refresh' }
      }
    })

    // 2. 给 config 注入自定义 adapter，防止重试时发起真实的网络请求
    error401.config.adapter = () => Promise.resolve({ data: { code: 200 }, status: 200 })
    error401_2.config.adapter = () => Promise.resolve({ data: { code: 200 }, status: 200 })

    // 获取拦截器的 error handler
    const interceptor = request.interceptors.response.handlers[0].rejected

    // 模拟并发触发
    await Promise.allSettled([interceptor(error401), interceptor(error401_2)])

    // 断言：刷新接口只调用了一次
    expect(mockPost).toHaveBeenCalledTimes(1)
    // 断言：新的 Token 被保存
    expect(localStorage.getItem('token')).toBe('new-token')
  })
})
