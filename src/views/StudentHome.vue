<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 学生端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <div style="display: flex; align-items: center;">
        <el-badge :is-dot="hasUnread" style="margin-right: 20px; cursor: pointer;" @click="openNoticeDrawer">
          <el-icon :size="22" color="#409EFF"><Bell /></el-icon>
        </el-badge>
        <el-button type="warning" size="small" @click="openPwdDialog" style="margin-right: 15px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab" class="demo-tabs" @tab-change="handleTabChange">
        
        <!-- 标签页 1：选课中心 -->
        <el-tab-pane label="选课中心" name="select-class">
          <el-table v-if="!isMobile" :data="paginatedClassList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="classNo" label="教学班号" width="150" align="center" />
            <el-table-column prop="courseName" label="课程名称" min-width="180" align="center" />
            <el-table-column prop="teacherName" label="任课教师" width="120" align="center" />
            <el-table-column prop="semester" label="开课学期" width="150" align="center" />
            <el-table-column label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag v-if="scope.row.isSelected" type="success">已加入</el-tag>
                <el-tag v-else type="info">未加入</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button v-if="!scope.row.isSelected" type="primary" size="small" @click="selectClass(scope.row.classNo)">加入班级</el-button>
                <el-button v-else type="danger" size="small" @click="dropClass(scope.row.classNo)">退课</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 移动端卡片 -->
          <div v-else class="mobile-card-list" v-loading="loading">
            <el-card v-for="item in paginatedClassList" :key="item.classNo" class="mobile-card">
              <div class="card-header">
                <span class="project-name">{{ item.courseName }}</span>
                <el-tag v-if="item.isSelected" type="success" size="small">已加入</el-tag>
                <el-tag v-else type="info" size="small">未加入</el-tag>
              </div>
              <div class="card-body">
                <p><strong>教学班号：</strong> {{ item.classNo }}</p>
                <p><strong>教师：</strong> {{ item.teacherName }}</p>
                <p><strong>学期：</strong> {{ item.semester }}</p>
              </div>
              <div class="card-footer">
                <el-button v-if="!item.isSelected" type="primary" size="small" @click="selectClass(item.classNo)">加入班级</el-button>
                <el-button v-else type="danger" size="small" @click="dropClass(item.classNo)">退课</el-button>
              </div>
            </el-card>
          </div>

          <el-pagination 
            v-model:current-page="classPage" 
            v-model:page-size="pageSize" 
            :page-sizes="[5, 10, 20, 50]" 
            :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" 
            :total="availableClasses.length" 
            style="margin-top: 15px; justify-content: center;" 
          />
        </el-tab-pane>

        <!-- 标签页 2：可预约的实验场次 -->
        <el-tab-pane label="可预约的实验场次" name="all-sessions">
          <el-table v-if="!isMobile" :data="paginatedSessionList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
            <el-table-column label="上课时间" align="center">
              <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
            </el-table-column>
            <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.remainingSeats > 0 ? 'success' : 'danger'">{{ scope.row.remainingSeats }} / {{ scope.row.capacity }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="实验指导书" width="150" align="center">
              <template #default="scope">
                <template v-if="scope.row.guideFile">
                  <el-button type="primary" link @click="previewFile(scope.row.guideFile)">预览</el-button>
                  <el-button type="success" link @click="downloadFile(scope.row.guideFile)">下载</el-button>
                </template>
                <span v-else style="color: gray;">暂无</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" :disabled="scope.row.remainingSeats <= 0" @click="handleBook(scope.row.sessionNo)">预约</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-else class="mobile-card-list" v-loading="loading">
            <el-card v-for="item in paginatedSessionList" :key="item.sessionNo" class="mobile-card">
              <div class="card-header">
                <span class="project-name">{{ item.projectName }}</span>
                <el-tag :type="item.remainingSeats > 0 ? 'success' : 'danger'" size="small">
                  剩余: {{ item.remainingSeats }} / {{ item.capacity }}
                </el-tag>
              </div>
              <div class="card-body">
                <p><strong>场次号：</strong> {{ item.sessionNo }}</p>
                <p><strong>教师：</strong> {{ item.teacherName }}</p>
                <p><strong>时间：</strong> {{ formatTeachingTime(item) }}</p>
              </div>
              <div class="card-footer" style="gap: 10px;">
                <template v-if="item.guideFile">
                  <el-button type="primary" plain size="small" @click="previewFile(item.guideFile)">预览指导书</el-button>
                  <el-button type="success" plain size="small" @click="downloadFile(item.guideFile)">下载</el-button>
                </template>
                <span v-else class="no-file">暂无指导书</span>
                <el-button type="primary" size="small" :disabled="item.remainingSeats <= 0" @click="handleBook(item.sessionNo)">预约</el-button>
              </div>
            </el-card>
          </div>

          <el-pagination 
            v-model:current-page="sessionPage" 
            v-model:page-size="pageSize" 
            :page-sizes="[5, 10, 20, 50]" 
            :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" 
            :total="sessionList.length" 
            style="margin-top: 15px; justify-content: center;" 
          />
        </el-tab-pane>

        <!-- 标签页 3：我的预约记录 -->
        <el-tab-pane label="我的预约记录" name="my-bookings">
          <el-table v-if="!isMobile" :data="paginatedBookingList" border style="width: 100%" v-loading="bookingLoading">
            <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
            <el-table-column label="上课时间" align="center">
              <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="指导书" width="150" align="center">
              <template #default="scope">
                <template v-if="scope.row.guideFile">
                  <el-button type="primary" link @click="previewFile(scope.row.guideFile)">预览</el-button>
                  <el-button type="success" link @click="downloadFile(scope.row.guideFile)">下载</el-button>
                </template>
                <span v-else style="color: gray;">暂无</span>
              </template>
            </el-table-column>
            <el-table-column label="成绩" width="100" align="center">
              <template #default="scope">
                <span v-if="scope.row.score !== null && scope.row.score !== undefined" style="color: red; font-weight: bold; font-size: 16px;">{{ scope.row.score }} 分</span>
                <span v-else style="color: gray;">未批阅</span>
              </template>
            </el-table-column>
            <el-table-column label="教师评语" width="150" align="center">
              <template #default="scope">
                <span v-if="scope.row.comment">{{ scope.row.comment }}</span>
                <span v-else style="color: gray;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" align="center">
              <template #default="scope">
                <el-button type="success" size="small" @click="openUploadDialog(scope.row)">上传报告</el-button>
                <el-button type="primary" link @click="openHistory(scope.row)" style="margin: 0 10px;">版本历史</el-button>
                <el-button v-if="!scope.row.isGraded" type="danger" size="small" @click="cancelBooking(scope.row.bookingNo)">取消预约</el-button>
                <el-tag v-else type="info" effect="plain">已批阅</el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div v-else class="mobile-card-list" v-loading="bookingLoading">
            <el-card v-for="item in paginatedBookingList" :key="item.bookingNo" class="mobile-card">
              <div class="card-header">
                <span class="project-name">{{ item.projectName }}</span>
                <el-tag v-if="item.score !== null && item.score !== undefined" type="danger" size="small">得分: {{ item.score }}</el-tag>
                <el-tag v-else type="info" size="small">未批阅</el-tag>
              </div>
              <div class="card-body">
                <p><strong>场次号：</strong> {{ item.sessionNo }}</p>
                <p><strong>教师：</strong> {{ item.teacherName }}</p>
                <p><strong>时间：</strong> {{ formatTeachingTime(item) }}</p>
                <p v-if="item.comment"><strong>评语：</strong> {{ item.comment }}</p>
              </div>
              <div class="card-footer" style="justify-content: flex-start; gap: 10px; flex-wrap: wrap;">
                <template v-if="item.guideFile">
                  <el-button type="primary" plain size="small" @click="previewFile(item.guideFile)">预览指导书</el-button>
                </template>
                <el-button type="success" size="small" @click="openUploadDialog(item)">上传报告</el-button>
                <el-button type="primary" plain size="small" @click="openHistory(item)">版本历史</el-button>
                <el-button v-if="!item.isGraded" type="danger" size="small" @click="cancelBooking(item.bookingNo)">取消预约</el-button>
              </div>
            </el-card>
          </div>

          <el-pagination 
            v-model:current-page="bookingPage" 
            v-model:page-size="pageSize" 
            :page-sizes="[5, 10, 20, 50]" 
            :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" 
            :total="myBookingList.length" 
            style="margin-top: 15px; justify-content: center;" 
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗群 -->
    <el-dialog v-model="uploadDialogVisible" title="上传实验报告" :width="isMobile ? '90%' : '400px'">
      <div style="text-align: center;">
        <p>正在为 <strong>{{ uploadProjectName }}</strong> 提交报告</p>
        <el-upload class="upload-demo" drag action="#" :auto-upload="false" :on-change="handleFileChange" :limit="1">
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

    <el-dialog v-model="historyDialogVisible" title="实验报告历史版本" :width="isMobile ? '95%' : '700px'">
      <el-table :data="historyList" border style="width: 100%">
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
           <template #default="scope"><span v-if="scope.row.score !== null" style="color: red;">{{ scope.row.score }}</span><span v-else style="color: gray;">-</span></template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="pwdDialog" title="修改密码" :width="isMobile ? '90%' : '400px'">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码" required><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码" required><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码" required><el-input v-model="pwdForm.confirmPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="pwdDialog = false">取消</el-button><el-button type="primary" @click="submitPwd">确认修改</el-button></template>
    </el-dialog>

    <!-- ⚠️ 在线预览弹窗 -->
    <el-dialog v-model="previewDialogVisible" :title="'在线预览 - ' + previewFileName" :width="isMobile ? '100%' : '80%'" top="5vh" destroy-on-close>
      <div style="width: 100%; height: 70vh;">
        <iframe v-if="previewFileUrl" :src="previewFileUrl" width="100%" height="100%" frameborder="0"></iframe>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadFile(previewFileName)">下载文件</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="noticeDrawerVisible" title="我的通知" :size="isMobile ? '100%' : '400px'">
      <el-empty v-if="noticeList.length === 0" description="暂无通知" />
      <el-timeline v-else>
        <el-timeline-item v-for="item in noticeList" :key="item.noticeId" :timestamp="formatTime(item.createTime)" placement="top" :type="item.publisherName === '管理员' ? 'danger' : 'primary'">
          <el-card shadow="hover">
            <h4 style="margin: 0 0 10px 0; color: #333;">{{ item.title }}</h4>
            <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.5;">{{ item.content }}</p>
            <div style="margin-top: 10px; text-align: right; font-size: 12px; color: #999;">发布人：{{ item.publisherName }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request' 
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const currentStudentNo = loginUser ? loginUser.studentNo : ''
if (!currentStudentNo) router.push('/')

const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)
const handleResize = () => { screenWidth.value = window.innerWidth }

onMounted(() => { 
  window.addEventListener('resize', handleResize)
  fetchSessions(); 
  fetchNotices() 
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const activeTab = ref('select-class')
const sessionList = ref([])
const loading = ref(false)
const myBookingList = ref([])
const bookingLoading = ref(false)

const availableClasses = ref([])
const classPage = ref(1)

const sessionPage = ref(1)
const bookingPage = ref(1)
const pageSize = ref(10)

const paginatedClassList = computed(() => availableClasses.value.slice((classPage.value - 1) * pageSize.value, classPage.value * pageSize.value))
const paginatedSessionList = computed(() => sessionList.value.slice((sessionPage.value - 1) * pageSize.value, sessionPage.value * pageSize.value))
const paginatedBookingList = computed(() => myBookingList.value.slice((bookingPage.value - 1) * pageSize.value, bookingPage.value * pageSize.value))

const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const uploadProjectNo = ref('')
const uploadProjectName = ref('')

const historyDialogVisible = ref(false)
const historyList = ref([])

const previewDialogVisible = ref(false)
const previewFileUrl = ref('')
const previewFileName = ref('')

const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

const fetchNotices = async () => {
  try {
    const res = await request.get('/notice/list?role=student')
    if (res.code === 200) {
      noticeList.value = res.data
      if (noticeList.value.length > 0) {
        const latestTime = new Date(noticeList.value[0].createTime).getTime()
        const lastReadStr = localStorage.getItem('lastReadNoticeTime')
        const lastReadTime = lastReadStr ? new Date(lastReadStr).getTime() : 0
        hasUnread.value = latestTime > lastReadTime
      }
    }
  } catch (e) {}
}

const openNoticeDrawer = () => {
  noticeDrawerVisible.value = true
  hasUnread.value = false
  if (noticeList.value.length > 0) localStorage.setItem('lastReadNoticeTime', noticeList.value[0].createTime)
}

const handleTabChange = (name) => { 
  if (name === 'my-bookings') fetchMyBookings(); 
  else if (name === 'all-sessions') fetchSessions(); 
  else if (name === 'select-class') fetchAvailableClasses();
}

const fetchAvailableClasses = async () => {
  loading.value = true
  try {
    const res = await request.get('/student/available-classes')
    if (res.code === 200) availableClasses.value = res.data
  } finally {
    loading.value = false
  }
}

const selectClass = async (classNo) => {
  try {
    const res = await request.post(`/student/select-class?classNo=${classNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchAvailableClasses()
    } else {
      ElMessage.warning(res.msg)
    }
  } catch (e) {
    ElMessage.error('选课失败')
  }
}

const dropClass = async (classNo) => {
  try {
    await ElMessageBox.confirm('确定要退出该教学班吗？', '警告', { type: 'warning' })
    const res = await request.post(`/student/drop-class?classNo=${classNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchAvailableClasses()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {}
}

const fetchSessions = async () => { 
  loading.value = true; 
  try { 
    const res = await request.get('/student/session/list'); 
    if (res.code === 200) sessionList.value = res.data 
  } finally { 
    loading.value = false 
  } 
}

const fetchMyBookings = async () => { 
  bookingLoading.value = true; 
  try { 
    const res = await request.get('/student/my-bookings'); 
    if (res.code === 200) myBookingList.value = res.data 
  } finally { 
    bookingLoading.value = false 
  } 
}

const formatTeachingTime = (row) => { if (!row || !row.semester) return ''; const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']; return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`; }
const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const handleBook = async (sessionNo) => { 
  try { 
    const res = await request.post(`/student/book?sessionNo=${sessionNo}`); 
    if (res.code === 200) { ElMessage.success('预约成功！'); fetchSessions() } 
    else { ElMessage.warning(res.msg) } 
  } catch (error) { ElMessage.error('预约失败！') } 
}

const cancelBooking = async (bookingNo) => { 
  try { 
    await ElMessageBox.confirm('确定要取消该场次的预约吗？', '提示', { type: 'warning' }); 
    const res = await request.post(`/student/cancel?bookingNo=${bookingNo}`); 
    if (res.code === 200) { ElMessage.success('取消预约成功！'); fetchMyBookings(); fetchSessions() } 
    else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}

const openUploadDialog = (row) => { uploadProjectNo.value = row.projectNo; uploadProjectName.value = row.projectName; uploadFile.value = null; uploadDialogVisible.value = true }
const handleFileChange = (file) => { uploadFile.value = file.raw }

const submitUpload = async () => { 
  if (!uploadFile.value) return ElMessage.warning('请先选择文件！'); 
  uploading.value = true; 
  const formData = new FormData(); 
  formData.append('file', uploadFile.value); 
  formData.append('studentNo', currentStudentNo); 
  formData.append('projectNo', uploadProjectNo.value); 
  try { 
    const res = await request.post('/report/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); 
    if (res.code === 200) { ElMessage.success(res.data); uploadDialogVisible.value = false; fetchMyBookings() } 
    else { ElMessage.error(res.msg) } 
  } catch (error) { ElMessage.error('上传失败，请检查后端！') } 
  finally { uploading.value = false } 
}

const openHistory = async (row) => { 
  try { 
    const res = await request.get(`/report/my-versions?studentNo=${currentStudentNo}&projectNo=${row.projectNo}`); 
    if (res.code === 200) { historyList.value = res.data; historyDialogVisible.value = true } 
  } catch (error) { ElMessage.error('获取版本历史失败！') } 
}

// ⚠️ 修正：直接通过后端 preview URL 预览
const previewFile = (fileName) => {
  previewFileName.value = fileName
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    ElMessage.warning('该文件格式不支持在线预览，请下载后查看！')
    return
  }
  // 换成了 /preview/
  previewFileUrl.value = `/api/report/preview/${fileName}`
  previewDialogVisible.value = true
}

// ⚠️ 下载不变
const downloadFile = (fileName) => {
  window.open(`/api/report/download/${fileName}`, '_blank')
}

const openPwdDialog = () => { pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }; pwdDialog.value = true }

const submitPwd = async () => { 
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value; 
  if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！'); 
  if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！'); 
  try { 
    const res = await request.post('/student/update-password', null, { params: { oldPwd: oldPassword, newPwd: newPassword } }); 
    if (res.code === 200) { 
      ElMessage.success('修改成功，请重新登录！'); 
      pwdDialog.value = false; 
      setTimeout(() => { 
        localStorage.removeItem('loginUser'); 
        localStorage.removeItem('token'); 
        router.push('/') 
      }, 1000) 
    } else { ElMessage.error(res.msg) } 
  } catch (error) { ElMessage.error('网络错误，修改失败！') } 
}

const logout = () => { 
  localStorage.removeItem('loginUser'); 
  localStorage.removeItem('token'); 
  router.push('/') 
}
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); margin-top: 20px;}

/* 📱 手机端卡片与响应式样式 */
.mobile-card-list { display: flex; flex-direction: column; gap: 15px; }
.mobile-card { border-radius: 8px; margin-bottom: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ebeef5; padding-bottom: 10px; margin-bottom: 10px; }
.project-name { font-weight: bold; font-size: 16px; color: #303133; flex: 1; }
.card-body p { margin: 5px 0; font-size: 14px; color: #606266; line-height: 1.5; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ebeef5; flex-wrap: wrap; }
.download-link { color: #409EFF; text-decoration: underline; font-size: 14px; }
.no-file { color: #909399; font-size: 14px; }

@media screen and (max-width: 768px) {
  .header { padding: 10px 15px; height: auto; min-height: 60px; flex-direction: column; align-items: flex-start; gap: 10px; }
  .header h2 { font-size: 16px; }
  .header > div { width: 100%; justify-content: flex-end; }
  .main-content { padding: 15px; margin-top: 10px; border-radius: 0; }
  .el-tabs__nav-wrap::after { display: none; }
  .el-pagination { justify-content: center !important; flex-wrap: wrap; }
}
</style>