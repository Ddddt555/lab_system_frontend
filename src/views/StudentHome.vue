<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 学生端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <div>
        <el-button type="warning" size="small" @click="openPwdDialog" style="margin-right: 15px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab" class="demo-tabs" @tab-change="handleTabChange">
        
        <!-- 标签页 1：可预约的实验场次 -->
        <el-tab-pane label="可预约的实验场次" name="all-sessions">
          <el-table :data="sessionList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
            
            <!-- ⚠️ 教务化时间展示 -->
            <el-table-column label="上课时间" align="center">
              <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
            </el-table-column>
            
            <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.remainingSeats > 0 ? 'success' : 'danger'">
                  {{ scope.row.remainingSeats }} / {{ scope.row.capacity }}
                </el-tag>
              </template>
            </el-table-column>
            
            <el-table-column label="实验指导书" width="130" align="center">
              <template #default="scope">
                <a 
                  v-if="scope.row.guideFile" 
                  :href="'http://localhost:8080/api/report/download/' + scope.row.guideFile" 
                  target="_blank" 
                  style="color: #409EFF; text-decoration: underline;"
                >
                  下载指导书
                </a>
                <span v-else style="color: gray;">暂无</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" :disabled="scope.row.remainingSeats <= 0" @click="handleBook(scope.row.sessionNo)">预约</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签页 2：我的预约记录 -->
        <el-tab-pane label="我的预约记录" name="my-bookings">
          <el-table :data="myBookingList" border style="width: 100%" v-loading="bookingLoading">
            <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
            
            <!-- ⚠️ 教务化时间展示 -->
            <el-table-column label="上课时间" align="center">
              <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
            </el-table-column>
            
            <el-table-column label="指导书" width="120" align="center">
              <template #default="scope">
                <a 
                  v-if="scope.row.guideFile" 
                  :href="'http://localhost:8080/api/report/download/' + scope.row.guideFile" 
                  target="_blank" 
                  style="color: #409EFF; text-decoration: underline;"
                >
                  下载指导书
                </a>
                <span v-else style="color: gray;">暂无</span>
              </template>
            </el-table-column>

            <el-table-column label="成绩" width="100" align="center">
              <template #default="scope">
                <span v-if="scope.row.score !== null && scope.row.score !== undefined" style="color: red; font-weight: bold; font-size: 16px;">
                  {{ scope.row.score }} 分
                </span>
                <span v-else style="color: gray;">未批阅</span>
              </template>
            </el-table-column>
            <el-table-column label="教师评语" width="150" align="center">
              <template #default="scope">
                <span v-if="scope.row.comment">{{ scope.row.comment }}</span>
                <span v-else style="color: gray;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center">
              <template #default="scope">
                <el-button type="success" size="small" @click="openUploadDialog(scope.row)">上传报告</el-button>
                <el-button type="danger" size="small" @click="cancelBooking(scope.row.bookingNo)">取消预约</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- 弹窗：上传实验报告 -->
    <el-dialog v-model="uploadDialogVisible" title="上传实验报告" width="400px">
      <div style="text-align: center;">
        <p>正在为 <strong>{{ uploadProjectName }}</strong> 提交报告</p>
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
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">确认上传</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 弹窗：修改密码 -->
    <el-dialog v-model="pwdDialog" title="修改密码" width="400px">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码" required><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码" required><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码" required><el-input v-model="pwdForm.confirmPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="pwdDialog = false">取消</el-button><el-button type="primary" @click="submitPwd">确认修改</el-button></template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const currentStudentNo = loginUser ? loginUser.studentNo : ''
if (!currentStudentNo) router.push('/')

const activeTab = ref('all-sessions')
const sessionList = ref([])
const loading = ref(false)
const myBookingList = ref([])
const bookingLoading = ref(false)

const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const uploadProjectNo = ref('')
const uploadProjectName = ref('')

const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

onMounted(() => { 
  fetchSessions() 
})

const handleTabChange = (name) => {
  if (name === 'my-bookings') {
    fetchMyBookings()
  } else {
    fetchSessions()
  }
}

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/student/session/list')
    if (res.data.code === 200) sessionList.value = res.data.data
  } catch (error) { 
    ElMessage.error('获取场次失败！') 
  } finally { 
    loading.value = false 
  }
}

const fetchMyBookings = async () => {
  bookingLoading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/student/my-bookings?studentNo=${currentStudentNo}`)
    if (res.data.code === 200) myBookingList.value = res.data.data
  } catch (error) { 
    ElMessage.error('获取预约记录失败！') 
  } finally { 
    bookingLoading.value = false 
  }
}

// ⚠️ 格式化时间工具：将结构化数据转成好看的字符串
const formatTeachingTime = (row) => {
  if (!row || !row.semester) return '';
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`;
}

const handleBook = async (sessionNo) => {
  try {
    const res = await axios.post(`http://localhost:8080/api/student/book?studentNo=${currentStudentNo}&sessionNo=${sessionNo}`)
    if (res.data.code === 200) {
      ElMessage.success('预约成功！')
      fetchSessions()
    } else { 
      ElMessage.warning(res.data.msg) 
    }
  } catch (error) { 
    ElMessage.error('预约失败！') 
  }
}

const cancelBooking = async (bookingNo) => {
  try {
    await ElMessageBox.confirm('确定要取消该场次的预约吗？', '提示', { type: 'warning' })
    const res = await axios.post(`http://localhost:8080/api/student/cancel?bookingNo=${bookingNo}`)
    if (res.data.code === 200) {
      ElMessage.success('取消预约成功！')
      fetchMyBookings()
      fetchSessions()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    // 用户取消
  }
}

const openUploadDialog = (row) => {
  uploadProjectNo.value = row.projectNo
  uploadProjectName.value = row.projectName
  uploadFile.value = null 
  uploadDialogVisible.value = true
}

const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

const submitUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件！')
    return
  }
  
  uploading.value = true
  const formData = new FormData()
  formData.append('file', uploadFile.value)
  formData.append('studentNo', currentStudentNo)
  formData.append('projectNo', uploadProjectNo.value)

  try {
    const res = await axios.post('http://localhost:8080/api/report/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (res.data.code === 200) {
      ElMessage.success('报告上传成功！')
      uploadDialogVisible.value = false
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('上传失败，请检查后端！')
  } finally {
    uploading.value = false
  }
}

const openPwdDialog = () => { 
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  pwdDialog.value = true 
}

const submitPwd = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    return ElMessage.warning('请填写完整信息！')
  }
  if (newPassword !== confirmPassword) {
    return ElMessage.warning('两次输入的新密码不一致！')
  }

  try {
    const res = await axios.post('http://localhost:8080/api/student/update-password', null, {
      params: { studentNo: currentStudentNo, oldPwd: oldPassword, newPwd: newPassword }
    })
    
    if (res.data.code === 200) {
      ElMessage.success('修改成功，请重新登录！')
      pwdDialog.value = false
      setTimeout(() => {
        localStorage.removeItem('loginUser')
        router.push('/')
      }, 1000)
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('网络错误，修改失败！')
  }
}

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