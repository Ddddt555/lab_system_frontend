<template>
  <div class="teacher-session-panel">
    <div class="table-responsive">
      <el-table :data="sessionList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
        <el-table-column prop="projectName" label="实验项目名称" width="200" align="center" />
        <el-table-column label="上课时间" align="center" min-width="180">
          <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
          <template #default="scope">{{ scope.row.remainingSeats }} / {{ scope.row.capacity }}</template>
        </el-table-column>
        <el-table-column label="操作" width="380" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="openBookingDialog(scope.row)">预约名单</el-button>
            <el-button type="warning" size="small" @click="$emit('start-attendance', scope.row)">发起签到</el-button>
            <el-button type="success" size="small" @click="$emit('grade-report', scope.row)">批阅报告</el-button>
            <el-button type="info" size="small" @click="exportAttendance(scope.row.sessionNo)">导出考勤</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-model:current-page="sessionPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalSessions" @current-change="handlePageChange" @size-change="fetchSessions" style="margin-top: 15px; justify-content: center;" />

    <!-- 预约名单弹窗 -->
    <el-dialog v-model="bookingDialogVisible" title="学生预约名单" :width="isMobile ? '95%' : '60%'">
      <div class="table-responsive">
        <el-table :data="studentList" border style="width: 100%">
          <el-table-column prop="studentNo" label="学号" width="120" align="center" />
          <el-table-column prop="name" label="姓名" width="100" align="center" />
          <el-table-column prop="className" label="班级" width="120" align="center" />
          <el-table-column prop="bookingTime" label="预约时间" align="center" min-width="150">
             <template #default="scope">{{ formatTime(scope.row.bookingTime) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const emit = defineEmits(['start-attendance', 'grade-report'])

const isMobile = computed(() => window.innerWidth < 768)
const loading = ref(false)
const sessionList = ref([])
const sessionPage = ref(1)
const pageSize = ref(10)
const totalSessions = ref(0)

const bookingDialogVisible = ref(false)
const studentList = ref([])

onMounted(() => { fetchSessions() })

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await request.get('/teacher/my-sessions', { params: { page: sessionPage.value, size: pageSize.value } })
    if (res.code === 200) { sessionList.value = res.data.records; totalSessions.value = res.data.total; }
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val) => { sessionPage.value = val; fetchSessions(); }

const formatTeachingTime = (row) => {
  if (!row || !row.semester) return ''
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`
}
const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const openBookingDialog = async (session) => {
  try {
    const res = await request.get(`/teacher/session-bookings?sessionNo=${session.sessionNo}`)
    if (res.code === 200) { 
      studentList.value = res.data
      bookingDialogVisible.value = true 
    }
  } catch (error) {}
}

const exportAttendance = (sessionNo) => {
  request.get(`/teacher/attendance/export?sessionNo=${sessionNo}`, {
    responseType: 'blob'
  }).then(res => {
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `考勤表_${sessionNo}_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('考勤表导出成功！')
  }).catch(e => {
    ElMessage.error('导出失败，请检查网络或联系管理员')
  })
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
</style>