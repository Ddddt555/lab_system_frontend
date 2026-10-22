<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 学生端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <el-button type="danger" size="small" @click="logout">退出登录</el-button>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab" class="demo-tabs" @tab-change="handleTabChange">
        
        <!-- 标签页 1：所有可预约场次 -->
        <el-tab-pane label="可预约的实验场次" name="all-sessions">
          <el-table :data="sessionList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="200" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="120" align="center" />
            <el-table-column prop="sessionTime" label="上课时间" align="center">
              <template #default="scope">{{ formatTime(scope.row.sessionTime) }}</template>
            </el-table-column>
            <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.remainingSeats > 0 ? 'success' : 'danger'">
                  {{ scope.row.remainingSeats }} / {{ scope.row.capacity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button 
                  type="primary" size="small" 
                  :disabled="scope.row.remainingSeats <= 0"
                  @click="handleBook(scope.row.sessionNo)"
                >
                  预约
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签页 2：我的预约记录 (新增了上传按钮) -->
        <el-tab-pane label="我的预约记录" name="my-bookings">
          <el-table :data="myBookingList" border style="width: 100%" v-loading="bookingLoading">
            <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="200" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="120" align="center" />
            <el-table-column prop="sessionTime" label="上课时间" align="center">
              <template #default="scope">{{ formatTime(scope.row.sessionTime) }}</template>
            </el-table-column>

            <!-- ⚠️ 新增：分数列 -->
            <el-table-column label="成绩" width="100" align="center">
              <template #default="scope">
                <span v-if="scope.row.score !== null && scope.row.score !== undefined" style="color: red; font-weight: bold; font-size: 16px;">
                  {{ scope.row.score }} 分
                </span>
                <span v-else style="color: gray;">未批阅</span>
              </template>
            </el-table-column>
            
            <!-- ⚠️ 新增：评语列 -->
            <el-table-column label="教师评语" width="200" align="center">
              <template #default="scope">
                <span v-if="scope.row.comment">{{ scope.row.comment }}</span>
                <span v-else style="color: gray;">-</span>
              </template>
            </el-table-column>

            <!-- ⚠️ 新增：操作列 -->
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button type="success" size="small" @click="openUploadDialog(scope.row)">
                  上传报告
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- ⚠️ 新增：上传报告的弹窗 -->
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
          <template #tip>
            <div class="el-upload__tip">支持 PDF / Word 格式文件</div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">确认上传</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue' // 引入图标

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const currentStudentNo = loginUser ? loginUser.studentNo : ''
if (!currentStudentNo) router.push('/')

const activeTab = ref('all-sessions')
const sessionList = ref([])
const loading = ref(false)
const myBookingList = ref([])
const bookingLoading = ref(false)

// ⚠️ 新增：上传相关的变量
const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const uploadProjectNo = ref('')
const uploadProjectName = ref('')

onMounted(() => { fetchSessions() })

const handleTabChange = (name) => {
  if (name === 'my-bookings') fetchMyBookings()
  else fetchSessions()
}

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/student/session/list')
    if (res.data.code === 200) sessionList.value = res.data.data
  } catch (error) { ElMessage.error('获取场次失败！') } 
  finally { loading.value = false }
}

const fetchMyBookings = async () => {
  bookingLoading.value = true
  try {
    const res = await axios.get(`http://localhost:8080/api/student/my-bookings?studentNo=${currentStudentNo}`)
    if (res.data.code === 200) myBookingList.value = res.data.data
  } catch (error) { ElMessage.error('获取预约记录失败！') } 
  finally { bookingLoading.value = false }
}

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const handleBook = async (sessionNo) => {
  try {
    const res = await axios.post(`http://localhost:8080/api/student/book?studentNo=${currentStudentNo}&sessionNo=${sessionNo}`)
    if (res.data.code === 200) {
      ElMessage.success('预约成功！')
      fetchSessions()
    } else { ElMessage.warning(res.data.msg) }
  } catch (error) { ElMessage.error('预约失败！') }
}

// ⚠️ 新增：打开弹窗
const openUploadDialog = (row) => {
  uploadProjectNo.value = row.projectNo
  uploadProjectName.value = row.projectName
  uploadFile.value = null // 重置文件
  uploadDialogVisible.value = true
}

// ⚠️ 新增：选择文件时的回调
const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

// ⚠️ 新增：提交上传
const submitUpload = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件！')
    return
  }
  
  uploading.value = true
  // 注意：文件上传必须使用 FormData 对象
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

const logout = () => {
  localStorage.removeItem('loginUser')
  router.push('/')
}
</script>

<style scoped>
/* 保持你原来的样式不变即可 */
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); margin-top: 20px;}
</style>