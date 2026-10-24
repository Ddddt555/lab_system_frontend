import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/student-home',
    name: 'StudentHome',
    component: () => import('../views/StudentHome.vue')
  },
  {
    path: '/teacher-home',
    name: 'TeacherHome',
    component: () => import('../views/TeacherHome.vue')
  },
  { 
    path: '/admin-home', 
    name: 'AdminHome', 
    component: () => import('../views/AdminHome.vue') 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ⚠️ 核心：全局前置路由守卫
router.beforeEach((to, from, next) => {
  // 1. 判断用户是否已经登录（检查 localStorage 里有没有存用户信息）
  const loginUserStr = localStorage.getItem('loginUser')
  const isLogin = !!loginUserStr // 如果有值，就是 true

  // 2. 如果去的是登录页，或者已经登录了，直接放行
  if (to.path === '/' || isLogin) {
    next()
  } else {
    // 3. 如果没登录，还想去其他页面，强行踢回登录页
    next('/')
  }
})

export default router