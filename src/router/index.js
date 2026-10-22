import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import StudentHome from '../views/StudentHome.vue'
import TeacherHome from '../views/TeacherHome.vue'
import AdminHome from '../views/AdminHome.vue' // 新增

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/student-home',
    name: 'StudentHome',
    component: StudentHome
  },
  {
    path: '/teacher-home',
    name: 'TeacherHome',
    component: TeacherHome
  },
  { path: '/admin-home', name: 'AdminHome', component: AdminHome } // 新增
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router