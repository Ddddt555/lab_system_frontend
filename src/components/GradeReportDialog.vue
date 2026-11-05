<template>
  <el-dialog v-model="visible" title="实验报告批阅" :width="isMobile ? '95%' : '80%'" @close="closeDialog">
    <div class="table-responsive">
      <el-table :data="reportList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="studentName" label="姓名" width="90" align="center" />
        <el-table-column prop="className" label="班级" width="110" align="center" />
        <el-table-column prop="submitTime" label="提交时间" width="150" align="center">
          <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
        </el-table-column>
        <el-table-column label="报告文件" width="150" align="center">
          <template #default="scope">
            <el-button type="primary" link @click="previewFile(scope.row.fileUrl)">在线预览</el-button>
            <el-button type="success" link @click="downloadFile(scope.row.fileUrl)">下载</el-button>
          </template>
        </el-table-column>
        <el-table-column label="分数" width="80" align="center">
           <template #default="scope">{{ scope.row.score !== null ? scope.row.score : '未批阅' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="scope"><el-button type="warning" size="small" @click="gradeReport(scope.row)">批阅</el-button></template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { previewFile, downloadFile } from '../utils/file'

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
const reportList = ref([])

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

watch(() => visible.value, async (newVal) => {
  if (newVal && props.projectNo) {
    fetchReports()
  }
})

const fetchReports = async () => {
  loading.value = true
  try {
    const res = await request.get(`/report/list-by-project?projectNo=${props.projectNo}`)
    if (res.code === 200) {
      reportList.value = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {} finally {
    loading.value = false
  }
}

const gradeReport = async (report) => {
  try {
    const { value: score } = await ElMessageBox.prompt('请输入分数', '打分', { inputPattern: /^([0-9]|[1-9]\d|100)$/, inputErrorMessage: '0-100' })
    const { value: comment } = await ElMessageBox.prompt('请输入评语', '评语')
    const res = await request.post(`/report/grade?reportNo=${report.reportNo}&score=${score}&comment=${comment}`)
    if (res.code === 200) { 
      ElMessage.success('批阅成功！'); 
      fetchReports() 
    } else { 
      ElMessage.error(res.msg) 
    }
  } catch (error) {}
}

const closeDialog = () => {
  reportList.value = []
}
</script>
