import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/student-home',
    name: 'StudentHome',
    component: () => import('../views/StudentHome.vue'),
    meta: { role: 'student' }
  },
  {
    path: '/teacher-home',
    name: 'TeacherHome',
    component: () => import('../views/TeacherHome.vue'),
    meta: { role: 'teacher' }
  },
  {
    path: '/admin-home',
    name: 'AdminHome',
    component: () => import('../views/AdminHome.vue'),
    meta: { role: 'admin' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const loginUserStr = localStorage.getItem('loginUser')
  const token = localStorage.getItem('token')

  let user = null
  if (loginUserStr && token) {
    try {
      user = JSON.parse(loginUserStr)
    } catch (e) {
      // 解析失败说明数据被篡改或损坏，直接清理本地缓存并踢回登录页
      localStorage.removeItem('loginUser')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      ElMessage.error('登录状态异常，请重新登录')
      return next('/')
    }
  }

  const isLogin = !!user && !!token

  // 1. 准备前往登录页
  if (to.path === '/') {
    if (isLogin) {
      if (user.role === 'student') return next('/student-home')
      if (user.role === 'teacher') return next('/teacher-home')
      if (user.role === 'admin') return next('/admin-home')
    }
    return next()
  }

  // 2. 如果去其他页面，但没登录，强行踢回登录页
  if (!isLogin) {
    return next('/')
  }

  // 3. 已经登录，校验角色权限（防篡改）
  const requiredRole = to.meta.role
  if (requiredRole && user.role !== requiredRole) {
    ElMessage.error('非法访问：您没有权限进入该页面！')

    if (user.role === 'student') return next('/student-home')
    if (user.role === 'teacher') return next('/teacher-home')
    if (user.role === 'admin') return next('/admin-home')
  }

  next()
})

export default router
