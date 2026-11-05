<template>
  <el-dialog v-model="visible" title="实验报告历史版本" :width="isMobile ? '95%' : '700px'">
    <el-table v-loading="loading" :data="historyList" border style="width: 100%">
      <el-table-column prop="version" label="版本" width="80" align="center">
        <template #default="scope">第 {{ scope.row.version }} 版</template>
      </el-table-column>
      <el-table-column prop="submitTime" label="提交时间" align="center">
        <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
      </el-table-column>
      <el-table-column label="文件操作" align="center">
        <template #default="scope">
          <el-button type="primary" link @click="previewFile(scope.row.fileUrl)">预览</el-button>
          <el-button type="success" link @click="downloadFile(scope.row.fileUrl)">下载</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="score" label="得分" width="80" align="center">
        <template #default="scope"
          ><span v-if="scope.row.score !== null" style="color: red">{{ scope.row.score }}</span
          ><span v-else style="color: gray">-</span></template
        >
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, computed, watch } from 'vue'
import request from '../utils/request'
import { previewFile, downloadFile } from '../utils/file' // 🛑 引入刚才抽离的工具类

const props = defineProps({
  modelValue: Boolean,
  projectNo: String
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const historyList = ref([])

const formatTime = (timeStr) => (timeStr ? timeStr.replace('T', ' ').substring(0, 16) : '')

// 🛑 监听弹窗打开，自动去请求历史记录
watch(
  () => visible.value,
  async (newVal) => {
    if (newVal && props.projectNo) {
      loading.value = true
      try {
        const res = await request.get(`/report/my-versions?projectNo=${props.projectNo}`)
        if (res.code === 200) historyList.value = res.data
      } finally {
        loading.value = false
      }
    }
  }
)
</script>
