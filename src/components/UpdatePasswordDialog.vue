<template>
  <!-- 当 forced 为 true 时，不显示右上角关闭按钮，并且点击遮罩层也不关闭 -->
  <el-dialog
    v-model="visible"
    title="修改密码"
    :width="isMobile ? '90%' : '400px'"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!props.forced"
    @close="closeDialog"
  >
    <!-- 强制改密时的顶部警告提示 -->
    <div v-if="props.forced" style="margin-bottom: 15px; color: #f56c6c; font-size: 13px">
      ⚠️ 系统检测到您的密码为初始密码或已被重置，必须修改后才能继续使用系统！
    </div>

    <el-form :model="pwdForm" label-width="80px">
      <el-form-item label="原密码" required>
        <el-input v-model="pwdForm.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input
          v-model="pwdForm.newPassword"
          type="password"
          show-password
          placeholder="至少 8 位，含大小写、数字、特殊字符"
        />
      </el-form-item>
      <el-form-item label="确认密码" required>
        <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <!-- 如果是强制改密，隐藏“取消”按钮 -->
      <el-button v-if="!props.forced" @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submitPwd">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: Boolean,
  role: {
    type: String,
    default: 'student'
  },
  forced: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const loading = ref(false)

// 控制弹窗显示隐藏
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

// 移动端适配
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const closeDialog = () => {
  // 如果是强制模式，禁止关闭
  if (props.forced) {
    ElMessage.warning('必须修改初始密码才能继续使用系统！')
    return
  }
  visible.value = false
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

const submitPwd = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！')
  if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！')

  // 与后端 PasswordValidator 完全对齐的强密码校验
  if (newPassword.length < 8) return ElMessage.warning('密码长度不能少于 8 位！')

  const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,}$/
  if (!pwdRegex.test(newPassword)) {
    return ElMessage.warning('密码必须包含大写字母、小写字母、数字和特殊字符（如 @$!%*?&._-）！')
  }

  loading.value = true
  try {
    // 根据角色动态拼接接口，三个端均已改造为统一接收 JSON Body
    const url = props.role === 'admin' ? '/admin/update-password' : `/${props.role}/update-password`

    // 直接发送 JSON 请求体，杜绝 URL 明文传参
    const res = await request.post(url, {
      oldPassword,
      newPassword
    })

    if (res.code === 200) {
      ElMessage.success('修改成功，请重新登录！')
      visible.value = false
      // 强制登出重新登录
      localStorage.removeItem('loginUser')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')

      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    ElMessage.error('网络错误，修改失败！')
  } finally {
    loading.value = false
  }
}
</script>
