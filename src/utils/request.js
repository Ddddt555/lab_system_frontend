import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { getDeviceId } from './device' // 引入设备指纹获取方法

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000
})

// 用于处理单页面内的并发刷新控制
let isRefreshing = false
let requestsQueue = []

const handleLogout = () => {
  localStorage.removeItem('loginUser')
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    // 注入设备 ID
    config.headers['X-Device-Id'] = getDeviceId()
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        if (originalRequest.url !== '/refresh-token' && !originalRequest._retry) {
          originalRequest._retry = true

          // 单页面内的并发控制
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              requestsQueue.push({
                retry: (newToken) => {
                  originalRequest.headers['Authorization'] = 'Bearer ' + newToken
                  resolve(request(originalRequest))
                },
                reject
              })
            })
          }

          const refreshToken = localStorage.getItem('refreshToken')
          if (!refreshToken) {
            ElMessage.error('登录已过期或失效，请重新登录！')
            handleLogout()
            return Promise.reject(error)
          }

          isRefreshing = true

          // 定义刷新逻辑，通过 Web Locks 封装执行
          const doRefresh = async () => {
            // 拿到锁后，检查 localStorage 中的 Token 是否已被其他标签页更新
            const currentToken = localStorage.getItem('token')
            const currentRefreshToken = localStorage.getItem('refreshToken')

            if (currentRefreshToken !== refreshToken) {
              return {
                token: currentToken,
                refreshToken: currentRefreshToken,
                updatedByOtherTab: true
              }
            }

            // 发起刷新请求，需携带 deviceId
            const res = await axios.post(import.meta.env.VITE_API_BASE_URL + '/refresh-token', {
              refreshToken,
              deviceId: getDeviceId()
            })

            if (res.data.code === 200) {
              const newToken = res.data.data.token
              const newRefreshToken = res.data.data.refreshToken

              localStorage.setItem('token', newToken)
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken)
              }
              return { token: newToken, refreshToken: newRefreshToken }
            } else {
              throw new Error(res.data.msg || 'refresh failed')
            }
          }

          try {
            let result

            // 使用 Web Locks API 执行跨标签页加锁
            if (navigator.locks) {
              result = await navigator.locks.request('token_refresh_lock', async () => {
                return await doRefresh()
              })
            } else {
              // 兼容不支持 Web Locks 的浏览器
              result = await doRefresh()
            }

            // 刷新成功（或由其他标签页刷新成功），更新本地状态并处理队列
            const finalToken = result.token
            originalRequest.headers['Authorization'] = 'Bearer ' + finalToken

            requestsQueue.forEach((item) => item.retry(finalToken))
            requestsQueue = []

            return request(originalRequest)
          } catch (err) {
            // 刷新失败：中断队列，清理状态并跳转登录
            requestsQueue.forEach((item) => item.reject(err))
            requestsQueue = []
            ElMessage.error('登录已彻底过期，请重新登录！')
            handleLogout()
            return Promise.reject(err)
          } finally {
            isRefreshing = false
          }
        } else {
          // 刷新接口本身返回 401，或者重试后依然 401
          ElMessage.error('登录已过期或失效，请重新登录！')
          handleLogout()
        }
      } else if (status === 403) {
        const backendMsg = error.response.data?.msg
        if (backendMsg === '请先修改初始密码！') {
          ElMessage.warning(backendMsg)
        } else {
          ElMessage.error(backendMsg || '非法操作：您没有权限访问该资源！')
        }
      } else {
        ElMessage.error(error.response.data?.msg || `请求失败 (${status})`)
      }
    } else {
      ElMessage.error('网络连接异常，请检查后端服务是否启动！')
    }

    return Promise.reject(error)
  }
)

export default request
