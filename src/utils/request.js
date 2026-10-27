import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router' // 引入你的路由，用于跳转

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // 统一前缀，这样你代码里就不用每次写 /api 了
  timeout: 10000
})

// 请求拦截器：每次发请求前，自动带上 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      // 后端拦截器规定格式是 "Bearer " + token
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理 Token 过期或无效的情况
request.interceptors.response.use(
  response => {
    return response.data // 直接返回后端的数据，省去每次写 response.data
  },
  error => {
    if (error.response && error.response.status === 401) {
      ElMessage.error('登录已过期，请重新登录！')
      localStorage.removeItem('loginUser')
      localStorage.removeItem('token')
      router.push('/') // 踢回登录页
    } else {
      ElMessage.error(error.message || '网络请求失败')
    }
    return Promise.reject(error)
  }
)

export default request