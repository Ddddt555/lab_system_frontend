<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 教师端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <el-button type="danger" size="small" @click="logout">退出登录</el-button>
    </div>

    <div class="main-content">
      <h3>我负责的实验场次</h3>
      
      <el-table :data="sessionList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
        <el-table-column prop="projectName" label="实验项目名称" width="200" align="center" />
        <el-table-column prop="sessionTime" label="上课时间" align="center">
          <template #default="scope">{{ formatTime(scope.row.sessionTime) }}</template>
        </el-table-column>
        <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
          <template #default="scope">{{ scope.row.remainingSeats }} / {{ scope.row.capacity }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" @click="viewBookings(scope.row)">
              预约名单
            </el-button>
            <el-button type="success" size="small" @click="openReports(scope.row)">
              批阅报告
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 弹窗1：预约名单 -->
      <el-dialog v-model="bookingDialogVisible" title="学生预约名单" width="50%">
        <el-table :data="studentList" border style="width: 100%">
          <el-table-column prop="studentNo" label="学号" align="center" />
          <el-table-column prop="name" label="姓名" align="center" />
          <el-table-column prop="className" label="班级" align="center" />
          <el-table-column prop="bookingTime" label="预约时间" align="center">
             <template #default="scope">{{ formatTime(scope.row.bookingTime) }}</template>
          </el-table-column>
        </el-table>
      </el-dialog>

      <!-- 弹窗2：报告批阅 -->
      <el-dialog v-model="reportDialogVisible" title="实验报告批阅" width="70%">
        <el-table :data="reportList" border style="width: 100%">
          <el-table-column prop="studentName" label="姓名" width="100" align="center" />
          <el-table-column prop="className" label="班级" width="120" align="center" />
          <el-table-column prop="submitTime" label="提交时间" align="center">
            <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
          </el-table-column>
          <el-table-column label="报告文件" align="center">
            <template #default="scope">
              <!-- 直接拼下载链接 -->
              <a :href="'http://localhost:8080/api/report/download/' + scope.row.fileUrl" target="_blank" style="color: #409EFF; text-decoration: underline;">
                点击下载
              </a>
            </template>
          </el-table-column>
          <el-table-column label="分数" width="100" align="center">
             <template #default="scope">{{ scope.row.score ? scope.row.score : '未批阅' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="scope">
              <el-button type="warning" size="small" @click="gradeReport(scope.row)">批阅</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const workNo = loginUser ? loginUser.workNo : ''
if (!workNo) router.push('/')

const sessionList = ref([])
const loading = ref(false)

// 预约名单变量
const bookingDialogVisible = ref(false)
const studentList = ref([])

// 报告批阅变量
const reportDialogVisible = ref(false)
const reportList = ref([])

onMounted(() => { fetchSessions() })

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/teacher/my-sessions?workNo=${workNo}`)
    if (res.data.code === 200) sessionList.value = res.data.data
  } catch (error) { ElMessage.error('获取场次数据失败！') } 
  finally { loading.value = false }
}

const viewBookings = async (session) => {
  try {
    const res = await axios.get(`http://localhost:8080/api/teacher/session-bookings?sessionNo=${session.sessionNo}`)
    if (res.data.code === 200) {
      studentList.value = res.data.data
      bookingDialogVisible.value = true
    }
  } catch (error) { ElMessage.error('获取名单失败！') }
}

// 打开批阅弹窗
const openReports = async (session) => {
  try {
    // 注意：这里我们用 projectNo 去查该实验下所有报告
    const res = await axios.get(`http://localhost:8080/api/report/list-by-project?projectNo=${session.projectNo}`)
    if (res.data.code === 200) {
      reportList.value = res.data.data
      reportDialogVisible.value = true
    }
  } catch (error) { ElMessage.error('获取报告列表失败！') }
}

// 点击批阅按钮，弹出输入框
const gradeReport = async (report) => {
  try {
    const { value: score } = await ElMessageBox.prompt('请输入该报告的分数 (0-100)', '打分', {
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      inputPattern: /^([0-9]|[1-9]\d|100)$/,
      inputErrorMessage: '请输入 0-100 之间的数字',
    })
    
    const { value: comment } = await ElMessageBox.prompt('请输入教师评语', '评语', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
    })

    // 发送请求
    const res = await axios.post(`http://localhost:8080/api/report/grade?reportNo=${report.reportNo}&score=${score}&comment=${comment}`)
    if (res.data.code === 200) {
      ElMessage.success('批阅成功！')
      // 刷新列表
      openReports({ projectNo: report.projectNo })
    }
  } catch (error) {
    // 用户点了取消
    if (error !== 'cancel') ElMessage.error('批阅失败！')
  }
}

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const logout = () => {
  localStorage.removeItem('loginUser')
  router.push('/')
}
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); margin-top: 20px;}
</style>