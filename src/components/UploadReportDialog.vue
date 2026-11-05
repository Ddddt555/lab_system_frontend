<template>
  <el-dialog
    v-model="visible"
    title="上传实验报告"
    :width="isMobile ? '90%' : '400px'"
    @close="closeDialog"
  >
    <div style="text-align: center">
      <p>
        正在为 <strong>{{ projectName }}</strong> 提交报告
      </p>
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </el-upload>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">确认上传</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import request from '../utils/request'

const props = defineProps({
  modelValue: Boolean,
  projectNo: String,
  projectName: String
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const uploading = ref(false)
const uploadFile = ref(null)

const closeDialog = () => {
  visible.value = false
  uploadFile.value = null
}

const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

const submitUpload = async () => {
  if (!uploadFile.value) return ElMessage.warning('请先选择文件！')
  uploading.value = true
  const formData = new FormData()
  formData.append('file', uploadFile.value)
  formData.append('projectNo', props.projectNo)

  try {
    const res = await request.post('/report/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200) {
      ElMessage.success(res.data)
      visible.value = false
      emit('success') // 通知父组件刷新列表
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    ElMessage.error('上传失败，请检查后端！')
  } finally {
    uploading.value = false
  }
}
</script>
