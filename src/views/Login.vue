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
        @keyup.enter="handleLogin"
      />

      <!-- 验证码输入框及图片 -->
      <div class="captcha-container">
        <el-input
          v-model="captchaCode"
          placeholder="请输入验证码"
          size="large"
          class="captcha-input"
          @keyup.enter="handleLogin"
        />
        <img
          :src="captchaImage"
          @click="fetchCaptcha"
          class="captcha-img"
          title="点击刷新验证码"
          alt="验证码"
        />
      </div>

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
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '../utils/request'

const role = ref('student')
const username = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

const captchaKey = ref('')
const captchaCode = ref('')
const captchaImage = ref('')

const fetchCaptcha = async () => {
  try {
    const res = await request.get('/captcha')
    if (res.code === 200) {
      captchaKey.value = res.data.captchaKey
      captchaImage.value = res.data.captchaImage
      captchaCode.value = ''
    }
  } catch (error) {
    ElMessage.error('获取验证码失败，请检查网络！')
  }
}

onMounted(() => {
  fetchCaptcha()
})

const handleLogin = async () => {
  if (!username.value || !password.value) {
    ElMessage.warning('请输入账号和密码！')
    return
  }
  if (!captchaCode.value) {
    ElMessage.warning('请输入验证码！')
    return
  }

  loading.value = true
  try {
    let apiUrl = ''
    if (role.value === 'student') {
      apiUrl = '/login/student'
    } else if (role.value === 'teacher') {
      apiUrl = '/login/teacher'
    } else {
      apiUrl = '/login/admin'
    }

    const res = await request.post(apiUrl, null, {
      params: {
        username: username.value,
        password: password.value,
        captchaKey: captchaKey.value,
        captchaCode: captchaCode.value
      }
    })

    if (res.code === 200) {
      const userData = res.data.user
      const token = res.data.token

      ElMessage.success('登录成功！欢迎你，' + userData.name)

      localStorage.setItem('loginUser', JSON.stringify(userData))
      localStorage.setItem('token', token)

      // 🛑【核心修复】判断是否需要强制改密
      if (userData.mustChangePassword) {
        ElMessage({
          message: '您的密码为初始密码或已被重置，请先修改密码！',
          type: 'warning',
          duration: 5000,
          showClose: true
        })
        // 不需要跳转逻辑，直接去主页，主页的 onMounted 会检测并强制弹窗
      }

      if (userData.role === 'student') {
        router.push('/student-home')
      } else if (userData.role === 'teacher') {
        router.push('/teacher-home')
      } else {
        router.push('/admin-home')
      }
    } else {
      ElMessage.error(res.msg)
      fetchCaptcha()
    }
  } catch (error) {
    console.error(error)
    if (!error.response || error.response.status !== 401) {
      ElMessage.error('网络错误，请检查后端是否启动！')
    }
    fetchCaptcha()
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

.captcha-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
}

.captcha-input {
  width: 55%;
}

.captcha-img {
  width: 40%;
  height: 40px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.login-btn {
  width: 100%;
  margin-top: 10px;
}
</style>