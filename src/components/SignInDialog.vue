<template>
  <el-dialog
    v-model="visible"
    title="课堂签到"
    :width="isMobile ? '90%' : '400px'"
    center
    @close="closeDialog"
  >
    <div style="text-align: center; margin-bottom: 20px">
      <p style="color: #666">
        正在为 <strong style="color: #409eff">{{ projectName }}</strong> 签到
      </p>
      <el-input
        v-model="signCode"
        placeholder="请输入老师提供的 6 位数字"
        size="large"
        maxlength="6"
        style="font-size: 28px; text-align: center; letter-spacing: 8px; margin-top: 15px"
      />
    </div>
    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="signing" @click="submitSign">确认签到</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const props = defineProps({
  modelValue: Boolean,
  sessionNo: String,
  projectName: String
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const signCode = ref('')
const signing = ref(false)

const closeDialog = () => {
  visible.value = false
  signCode.value = ''
}

const submitSign = async () => {
  if (!signCode.value || signCode.value.length !== 6)
    return ElMessage.warning('请输入完整的 6 位签到码！')
  signing.value = true
  try {
    const res = await request.post(
      `/student/attendance/sign?sessionNo=${props.sessionNo}&code=${signCode.value}`
    )
    if (res.code === 200) {
      ElMessage.success(res.data)
      visible.value = false
      emit('success')
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('签到失败，请检查网络')
  } finally {
    signing.value = false
  }
}
</script>
