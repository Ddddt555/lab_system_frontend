import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus' // ⚠️ 引入 ElMessage 用于越权提示

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
    meta: { role: 'student' } // ⚠️ 核心：标记必须是学生
  },
  {
    path: '/teacher-home',
    name: 'TeacherHome',
    component: () => import('../views/TeacherHome.vue'),
    meta: { role: 'teacher' } // ⚠️ 核心：标记必须是教师
  },
  { 
    path: '/admin-home', 
    name: 'AdminHome', 
    component: () => import('../views/AdminHome.vue'),
    meta: { role: 'admin' } // ⚠️ 核心：标记必须是管理员
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ⚠️ 核心：全局前置路由守卫（升级版）
router.beforeEach((to, from, next) => {
  const loginUserStr = localStorage.getItem('loginUser')
  const token = localStorage.getItem('token')
  const isLogin = !!loginUserStr && !!token

  // 1. 准备前往登录页
  if (to.path === '/') {
    if (isLogin) {
      // 如果已经登录了，别去登录页了，自动重定向去各自的首页
      const user = JSON.parse(loginUserStr)
      if (user.role === 'student') return next('/student-home')
      if (user.role === 'teacher') return next('/teacher-home')
      if (user.role === 'admin') return next('/admin-home')
    }
    // 未登录，正常前往登录页
    return next()
  }

  // 2. 如果去其他页面，但没登录，强行踢回登录页
  if (!isLogin) {
    return next('/')
  }

  // 3. 已经登录，校验角色权限（防篡改）
  const user = JSON.parse(loginUserStr)
  const requiredRole = to.meta.role // 获取目标路由要求的角色

  // 如果目标路由需要角色要求，并且当前用户的角色不匹配
  if (requiredRole && user.role !== requiredRole) {
    ElMessage.error('非法访问：您没有权限进入该页面！')
    
    // 把他“押送”回属于他自己的首页
    if (user.role === 'student') return next('/student-home')
    if (user.role === 'teacher') return next('/teacher-home')
    if (user.role === 'admin') return next('/admin-home')
  }

  // 校验通过，正常放行
  next()
})

export default router