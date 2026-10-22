<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 教师端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <div>
        <el-button type="warning" size="small" @click="openPwdDialog" style="margin-right: 15px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="我负责的场次" name="sessions">
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
                <el-button type="primary" size="small" @click="viewBookings(scope.row)">预约名单</el-button>
                <el-button type="success" size="small" @click="openReports(scope.row)">批阅报告</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="实验项目管理" name="projects">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddProject">发布新实验项目</el-button></div>
          <el-table :data="projectList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="projectNo" label="项目号" width="120" align="center" />
            <el-table-column prop="projectName" label="项目名称" align="center" />
            <el-table-column prop="courseNo" label="所属课程" width="120" align="center" />
            <el-table-column prop="hours" label="学时" width="80" align="center" />
            <el-table-column prop="standard" label="考核标准" align="center" />
            
            <!-- ⚠️ 新增：指导书操作列 -->
            <el-table-column label="实验指导书" width="180" align="center">
              <template #default="scope">
                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="(file) => handleGuideUpload(file, scope.row.projectNo)"
                >
                  <el-button type="primary" size="small" plain>
                    {{ scope.row.guideFile ? '重新上传' : '上传指导书' }}
                  </el-button>
                </el-upload>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="安排实验场次" name="schedule">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddSession">安排新场次</el-button></div>
          <el-table :data="sessionList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" align="center" />
            <el-table-column prop="sessionTime" label="上课时间" align="center">
              <template #default="scope">{{ formatTime(scope.row.sessionTime) }}</template>
            </el-table-column>
            <el-table-column prop="capacity" label="总容量" width="100" align="center" />
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope"><el-button type="danger" size="small" @click="deleteSession(scope.row.sessionNo)">取消排课</el-button></template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗 1：预约名单 -->
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

    <!-- 弹窗 2：报告批阅 -->
    <el-dialog v-model="reportDialogVisible" title="实验报告批阅" width="70%">
      <el-table :data="reportList" border style="width: 100%">
        <el-table-column prop="studentName" label="姓名" width="100" align="center" />
        <el-table-column prop="className" label="班级" width="120" align="center" />
        <el-table-column prop="submitTime" label="提交时间" align="center">
          <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
        </el-table-column>
        <el-table-column label="报告文件" align="center">
          <template #default="scope"><a :href="'http://localhost:8080/api/report/download/' + scope.row.fileUrl" target="_blank" style="color: #409EFF; text-decoration: underline;">点击下载</a></template>
        </el-table-column>
        <el-table-column label="分数" width="100" align="center">
           <template #default="scope">{{ scope.row.score !== null ? scope.row.score : '未批阅' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="warning" size="small" @click="gradeReport(scope.row)">批阅</el-button></template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 弹窗 3：发布项目 -->
    <el-dialog v-model="projectDialog" title="发布新实验项目" width="500px">
      <el-form :model="newProject" label-width="100px">
        <el-form-item label="项目号" required><el-input v-model="newProject.projectNo" placeholder="如：P003" /></el-form-item>
        <el-form-item label="项目名称" required><el-input v-model="newProject.projectName" /></el-form-item>
        <el-form-item label="所属课程" required>
          <el-select v-model="newProject.courseNo" placeholder="请选择课程" style="width: 100%">
            <el-option v-for="c in courseOptions" :key="c.courseNo" :label="c.courseNo + ' - ' + c.courseName" :value="c.courseNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="学时"><el-input-number v-model="newProject.hours" :min="1" /></el-form-item>
        <el-form-item label="考核标准"><el-input v-model="newProject.standard" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="projectDialog = false">取消</el-button><el-button type="primary" @click="submitAddProject">确认发布</el-button></template>
    </el-dialog>

    <!-- 弹窗 4：安排新场次 -->
    <el-dialog v-model="sessionDialog" title="安排实验场次" width="500px">
      <el-form :model="newSession" label-width="100px">
        <el-form-item label="场次号" required><el-input v-model="newSession.sessionNo" placeholder="如：S003" /></el-form-item>
        <el-form-item label="实验项目" required>
          <el-select v-model="newSession.projectNo" placeholder="请选择项目" style="width: 100%">
            <el-option v-for="p in projectList" :key="p.projectNo" :label="p.projectNo + ' - ' + p.projectName" :value="p.projectNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="实验室" required>
          <el-select v-model="newSession.roomNo" placeholder="请选择实验室" style="width: 100%" @change="handleLabChange">
            <el-option v-for="r in labOptions" :key="r.roomNo" :label="r.roomNo + ' - ' + r.roomName + ' (容量:' + r.capacity + ')'" :value="r.roomNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="上课时间" required>
          <el-date-picker v-model="newSession.sessionTime" type="datetime" placeholder="选择日期和时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="容量(机位)" required>
          <el-input-number v-model="newSession.capacity" :min="1" :max="selectedLabCapacity" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;" v-if="newSession.roomNo">该实验室最大 {{ selectedLabCapacity }} 个机位</span>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="sessionDialog = false">取消</el-button><el-button type="primary" @click="submitAddSession">确认排课</el-button></template>
    </el-dialog>

    <!-- 弹窗 5：修改密码 -->
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

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const workNo = loginUser ? loginUser.workNo : ''
if (!workNo) router.push('/')

const activeTab = ref('sessions')
const loading = ref(false)

const sessionList = ref([])
const projectList = ref([])
const courseOptions = ref([])
const labOptions = ref([])

const bookingDialogVisible = ref(false)
const studentList = ref([])
const reportDialogVisible = ref(false)
const reportList = ref([])

const projectDialog = ref(false)
const newProject = ref({ projectNo: '', projectName: '', courseNo: '', hours: 2, standard: '' })

const sessionDialog = ref(false)
const newSession = ref({ sessionNo: '', projectNo: '', roomNo: '', sessionTime: '', capacity: 50 })
const selectedLabCapacity = ref(100)

const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

onMounted(() => { fetchSessions(); fetchProjects(); fetchCourses(); fetchLabs() })

const fetchSessions = async () => { loading.value = true; try { const res = await axios.get(`http://localhost:8080/api/teacher/my-sessions?workNo=${workNo}`); if (res.data.code === 200) sessionList.value = res.data.data } finally { loading.value = false } }
const fetchProjects = async () => { try { const res = await axios.get('http://localhost:8080/api/teacher/project/list'); if (res.data.code === 200) projectList.value = res.data.data } catch (e) {} }
const fetchCourses = async () => { try { const res = await axios.get('http://localhost:8080/api/admin/courses'); if (res.data.code === 200) courseOptions.value = res.data.data } catch (e) {} }
const fetchLabs = async () => { try { const res = await axios.get('http://localhost:8080/api/teacher/labs'); if (res.data.code === 200) labOptions.value = res.data.data } catch (e) {} }

const handleLabChange = (roomNo) => {
  const lab = labOptions.value.find(r => r.roomNo === roomNo)
  if (lab) { selectedLabCapacity.value = lab.capacity; if (newSession.value.capacity > lab.capacity) newSession.value.capacity = lab.capacity }
}

// ⚠️ 新增：处理指导书上传
const handleGuideUpload = async (file, projectNo) => {
  const rawFile = file.raw
  if (!rawFile) return

  const formData = new FormData()
  formData.append('file', rawFile)
  formData.append('projectNo', projectNo)

  try {
    const res = await axios.post('http://localhost:8080/api/teacher/project/upload-guide', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.code === 200) {
      ElMessage.success('指导书上传成功！')
      fetchProjects() // 刷新列表以更新按钮状态
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('上传失败，请检查网络或后端！')
  }
}

const openAddProject = () => { newProject.value = { projectNo: '', projectName: '', courseNo: '', hours: 2, standard: '' }; projectDialog.value = true }
const submitAddProject = async () => {
  if (!newProject.value.projectNo || !newProject.value.projectName || !newProject.value.courseNo) return ElMessage.warning('请填写完整信息！')
  try {
    const res = await axios.post('http://localhost:8080/api/teacher/project/add', newProject.value)
    if (res.data.code === 200) { ElMessage.success('发布成功！'); projectDialog.value = false; fetchProjects() } else { ElMessage.error(res.data.msg) }
  } catch (e) { ElMessage.error('请求失败') }
}

const openAddSession = () => { newSession.value = { sessionNo: '', projectNo: '', roomNo: '', sessionTime: '', capacity: 50 }; selectedLabCapacity.value = 100; sessionDialog.value = true }
const submitAddSession = async () => {
  if (!newSession.value.sessionNo || !newSession.value.projectNo || !newSession.value.roomNo || !newSession.value.sessionTime) return ElMessage.warning('请填写完整信息！')
  const payload = { ...newSession.value, workNo: workNo }
  try {
    const res = await axios.post('http://localhost:8080/api/teacher/session/add', payload)
    if (res.data.code === 200) { ElMessage.success('排课成功！'); sessionDialog.value = false; fetchSessions(); activeTab.value = 'sessions' } else { ElMessage.error(res.data.msg) }
  } catch (error) { ElMessage.error('排课失败！') }
}

const deleteSession = async (sessionNo) => {
  try {
    await ElMessageBox.confirm('确定要取消该场次的排课吗？', '警告', { type: 'warning' })
    const res = await axios.delete(`http://localhost:8080/api/teacher/session/delete?sessionNo=${sessionNo}`)
    if (res.data.code === 200) { ElMessage.success('已取消排课！'); fetchSessions() } else { ElMessage.error(res.data.msg) }
  } catch (e) {}
}

const viewBookings = async (session) => { try { const res = await axios.get(`http://localhost:8080/api/teacher/session-bookings?sessionNo=${session.sessionNo}`); if (res.data.code === 200) { studentList.value = res.data.data; bookingDialogVisible.value = true } } catch (error) {} }
const openReports = async (session) => { try { const res = await axios.get(`http://localhost:8080/api/report/list-by-project?projectNo=${session.projectNo}`); if (res.data.code === 200) { reportList.value = res.data.data; reportDialogVisible.value = true } } catch (error) {} }
const gradeReport = async (report) => {
  try {
    const { value: score } = await ElMessageBox.prompt('请输入分数', '打分', { inputPattern: /^([0-9]|[1-9]\d|100)$/, inputErrorMessage: '0-100' })
    const { value: comment } = await ElMessageBox.prompt('请输入评语', '评语')
    const res = await axios.post(`http://localhost:8080/api/report/grade?reportNo=${report.reportNo}&score=${score}&comment=${comment}`)
    if (res.data.code === 200) { ElMessage.success('批阅成功！'); openReports({ projectNo: report.projectNo }) }
  } catch (error) {}
}

const openPwdDialog = () => { pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }; pwdDialog.value = true }
const submitPwd = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！')
  if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！')
  try {
    const res = await axios.post('http://localhost:8080/api/teacher/update-password', null, { params: { workNo: workNo, oldPwd: oldPassword, newPwd: newPassword } })
    if (res.data.code === 200) {
      ElMessage.success('修改成功，请重新登录！'); pwdDialog.value = false
      setTimeout(() => { localStorage.removeItem('loginUser'); router.push('/') }, 1000)
    } else { ElMessage.error(res.data.msg) }
  } catch (error) { ElMessage.error('网络错误，修改失败！') }
}

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''
const logout = () => { localStorage.removeItem('loginUser'); router.push('/') }
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); margin-top: 20px;}
</style>