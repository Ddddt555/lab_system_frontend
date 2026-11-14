import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { getDeviceId } from './device'

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

    if (!error.response) {
      ElMessage.error('网络连接异常，请检查后端服务是否启动！')
      return Promise.reject(error)
    }

    const status = error.response.status
    let errorMsg

    // 处理由于 responseType: 'blob' 导致的错误信息无法被 JSON 解析的问题
    if (error.response.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        const json = JSON.parse(text)
        errorMsg = json.msg
      } catch {
        errorMsg = '文件处理失败或权限不足'
      }
    } else {
      errorMsg = error.response.data?.msg
    }

    // 1. 处理 401 无感刷新
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

        const doRefresh = async () => {
          const currentToken = localStorage.getItem('token')
          const currentRefreshToken = localStorage.getItem('refreshToken')

          if (currentRefreshToken !== refreshToken) {
            return {
              token: currentToken,
              refreshToken: currentRefreshToken,
              updatedByOtherTab: true
            }
          }

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
          if (navigator.locks) {
            result = await navigator.locks.request('token_refresh_lock', async () => {
              return await doRefresh()
            })
          } else {
            result = await doRefresh()
          }

          const finalToken = result.token
          originalRequest.headers['Authorization'] = 'Bearer ' + finalToken
          requestsQueue.forEach((item) => item.retry(finalToken))
          requestsQueue = []
          return request(originalRequest)
        } catch (err) {
          requestsQueue.forEach((item) => item.reject(err))
          requestsQueue = []
          ElMessage.error('登录已彻底过期，请重新登录！')
          handleLogout()
          return Promise.reject(err)
        } finally {
          isRefreshing = false
        }
      } else {
        ElMessage.error('登录已过期或失效，请重新登录！')
        handleLogout()
      }
    }
    // 2. 处理 403 无权限或强制改密
    else if (status === 403) {
      if (errorMsg === '请先修改初始密码！') {
        ElMessage.warning(errorMsg)
      } else {
        ElMessage.error(errorMsg || '非法操作：您没有权限访问该资源！')
      }
    }
    // 3. 处理其他 4xx 客户端错误（如 400 参数错误、404 找不到、409 冲突等）
    else if (status >= 400 && status < 500) {
      // 后端 GlobalExceptionHandler 中返回的 Result.msg 会在这里被读取
      ElMessage.error(errorMsg || `请求错误 (${status})`)
    }
    // 4. 处理 5xx 服务端错误
    else if (status >= 500) {
      ElMessage.error(errorMsg || '服务器开小差了，请稍后重试')
    }

    return Promise.reject(error)
  }
)

export default request
