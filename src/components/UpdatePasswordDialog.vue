<template>
  <el-dialog v-model="visible" title="修改密码" :width="isMobile ? '90%' : '400px'" @close="closeDialog">
    <el-form :model="pwdForm" label-width="80px">
      <el-form-item label="原密码" required>
        <el-input v-model="pwdForm.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input v-model="pwdForm.newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认密码" required>
        <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submitPwd">确认修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: Boolean, // 接收父组件传过来的 v-model
  role: {
    type: String,
    default: 'student' // 默认学生，教师/管理员也可以复用，只需改接口
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

// 移动端适配（简单获取屏幕宽度）
const isMobile = computed(() => window.innerWidth < 768)

const closeDialog = () => {
  visible.value = false
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

const submitPwd = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！')
  if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！')

  loading.value = true
  try {
    // 根据角色动态拼接接口，如果是教师端直接传 role='teacher' 进来即可复用
    const url = props.role === 'admin' ? '/admin/update-password' : `/${props.role}/update-password`
    const params = props.role === 'admin' 
        ? { oldPassword, newPassword } 
        : { oldPwd: oldPassword, newPwd: newPassword }

    const res = await request.post(url, null, { params })
    
    if (res.code === 200) {
      ElMessage.success('修改成功，请重新登录！')
      visible.value = false
      setTimeout(() => {
        localStorage.removeItem('loginUser')
        localStorage.removeItem('token')
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