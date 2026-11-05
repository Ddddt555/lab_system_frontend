import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000
})

// 🛑【核心新增】刷新 Token 的并发控制队列
let isRefreshing = false
let requestsQueue = []

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') {
      return response
    }
    return response.data
  },
  (error) => {
    const originalRequest = error.config

    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        // 🛑【核心改造】401 并发刷新去重逻辑
        if (originalRequest.url !== '/refresh-token' && !originalRequest._retry) {
          originalRequest._retry = true

          // 1. 如果正在刷新中，把当前请求挂起，推入队列
          if (isRefreshing) {
            return new Promise((resolve) => {
              requestsQueue.push((newToken) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + newToken
                resolve(request(originalRequest))
              })
            })
          }

          // 2. 如果没在刷新，开启刷新状态
          isRefreshing = true
          const refreshToken = localStorage.getItem('refreshToken')

          if (refreshToken) {
            return axios
              .post(
                import.meta.env.VITE_API_BASE_URL + '/refresh-token?refreshToken=' + refreshToken
              )
              .then((res) => {
                if (res.data.code === 200) {
                  const newToken = res.data.data.token
                  localStorage.setItem('token', newToken)
                  originalRequest.headers['Authorization'] = 'Bearer ' + newToken

                  // 🛑 刷新成功：执行队列中的所有请求
                  requestsQueue.forEach((cb) => cb(newToken))
                  requestsQueue = []

                  return request(originalRequest)
                } else {
                  throw new Error('refresh failed')
                }
              })
              .catch((err) => {
                // 🛑 刷新失败：清空队列，强制登出
                requestsQueue = []
                ElMessage.error('登录已彻底过期，请重新登录！')
                localStorage.removeItem('loginUser')
                localStorage.removeItem('token')
                localStorage.removeItem('refreshToken')
                if (router.currentRoute.value.path !== '/') {
                  router.push('/')
                }
                return Promise.reject(err)
              })
              .finally(() => {
                // 🛑 无论成功失败，刷新状态复位
                isRefreshing = false
              })
          } else {
            // 如果没有 RefreshToken，直接走登出逻辑
            isRefreshing = false
          }
        }

        // 如果没有 RefreshToken 或者重试也失败了
        ElMessage.error('登录已过期或失效，请重新登录！')
        localStorage.removeItem('loginUser')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        if (router.currentRoute.value.path !== '/') {
          router.push('/')
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
