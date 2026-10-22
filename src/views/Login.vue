<template>
  <div class="login-container">
    <div class="login-box">
      <h2>实验教学管理系统</h2>
      
      <!-- 身份选择 -->
      <el-radio-group v-model="role" class="input-item">
        <el-radio value="student">学生登录</el-radio>
        <el-radio value="teacher">教师登录</el-radio>
        <el-radio value="admin">管理员登录</el-radio>
      </el-radio-group>
      
      <!-- 账号输入框 -->
      <el-input 
        v-model="username" 
        placeholder="请输入账号" 
        size="large" 
        class="input-item" 
      />
      
      <!-- 密码输入框 -->
      <el-input 
        v-model="password" 
        type="password" 
        placeholder="请输入密码" 
        size="large" 
        class="input-item" 
        show-password 
      />
      
      <!-- 登录按钮 -->
      <el-button 
        type="primary" 
        size="large" 
        class="login-btn" 
        @click="handleLogin"
        :loading="loading"
      >
        登 录
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const role = ref('student')
const username = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入账号和密码！')
    return
  }
  
  loading.value = true
  try {
    // 1. 动态选择接口
    let apiUrl = ''
    if (role.value === 'student') {
      apiUrl = 'http://localhost:8080/api/login/student'
    } else if (role.value === 'teacher') {
      apiUrl = 'http://localhost:8080/api/login/teacher'
    } else {
      apiUrl = 'http://localhost:8080/api/login/admin'
    }

    // ⚠️ 2. 发送请求（刚才漏掉的就是这里！）
    const response = await axios.post(apiUrl, null, {
      params: {
        username: username.value,
        password: password.value
      }
    })

    const res = response.data

    // 3. 处理响应结果
    if (res.code === 200) {
      // 管理员返回的 data 是字符串，学生/老师返回的是对象
      const welcomeName = role.value === 'admin' ? res.data : res.data.name
      ElMessage.success('登录成功！欢迎你，' + welcomeName)
      
      // 存用户信息
      const userData = role.value === 'admin' 
        ? { name: res.data, role: 'admin' } 
        : { ...res.data, role: role.value }
        
      localStorage.setItem('loginUser', JSON.stringify(userData)) 

      // 4. 跳转路由
      if (role.value === 'student') {
        router.push('/student-home')
      } else if (role.value === 'teacher') {
        router.push('/teacher-home')
      } else {
        router.push('/admin-home')
      }

    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    ElMessage.error('网络错误，请检查后端是否启动！')
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.login-box h2 {
  margin-bottom: 20px; 
  color: #333;
}

.input-item {
  margin-bottom: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>