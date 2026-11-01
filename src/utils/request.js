import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建 axios 实例
const request = axios.create({
  // ⚠️ 核心修改：使用环境变量。开发环境自动读取 .env.development，生产环境读取 .env.production
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', 
  timeout: 20000 // 稍微调大一点，防止导出大文件超时
})

// 请求拦截器：每次发请求前，自动带上 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理 Token 过期、Blob 下载异常等情况
request.interceptors.response.use(
  response => {
    // ⚠️ 优化：如果是文件下载请求（blob），直接返回整个 response，不要返回 response.data
    // 否则前端无法获取到 header 里的文件名（Content-Disposition）
    if (response.config.responseType === 'blob') {
      return response;
    }
    
    // 正常 JSON 数据，直接返回后端的 Result 对象
    return response.data 
  },
  error => {
    if (error.response) {
      const status = error.response.status
      
      if (status === 401) {
        // 401 代表 Token 过期、无效或被拉黑
        ElMessage.error('登录已过期或失效，请重新登录！')
        localStorage.removeItem('loginUser')
        localStorage.removeItem('token')
        // 避免重复跳转
        if (router.currentRoute.value.path !== '/') {
          router.push('/')
        }
      } else if (status === 403) {
        // 403 代表没有权限（我们在后端写的 @RequireRole 或拦截器触发的）
        // 🛑【核心修复】优先显示后端返回的具体错误信息
        const backendMsg = error.response.data?.msg
        
        if (backendMsg === '请先修改初始密码！') {
          ElMessage.warning(backendMsg)
          // 可选：如果你想让它在每次报错时都弹一次，可以在这里加逻辑
          // 但一般建议靠主页面的全局弹窗来遮挡
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