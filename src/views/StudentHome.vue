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
        
        <!-- 标签页 1：可预约的实验场次 -->
        <el-tab-pane label="可预约的实验场次" name="all-sessions">
          <el-table :data="paginatedSessionList" border style="width: 100%" v-loading="loading">
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
            <el-table-column label="实验指导书" width="130" align="center">
              <template #default="scope">
                <a v-if="scope.row.guideFile" :href="'http://localhost:8080/api/report/download/' + scope.row.guideFile" target="_blank" style="color: #409EFF; text-decoration: underline;">下载指导书</a>
                <span v-else style="color: gray;">暂无</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="scope">
                <el-button type="primary" size="small" :disabled="scope.row.remainingSeats <= 0" @click="handleBook(scope.row.sessionNo)">预约</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination v-model:current-page="sessionPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="sessionList.length" style="margin-top: 15px; justify-content: flex-end;" />
        </el-tab-pane>

        <!-- 标签页 2：我的预约记录 -->
        <el-tab-pane label="我的预约记录" name="my-bookings">
          <el-table :data="paginatedBookingList" border style="width: 100%" v-loading="bookingLoading">
            <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
            <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
            <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
            <el-table-column label="上课时间" align="center">
              <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="指导书" width="120" align="center">
              <template #default="scope">
                <a v-if="scope.row.guideFile" :href="'http://localhost:8080/api/report/download/' + scope.row.guideFile" target="_blank" style="color: #409EFF; text-decoration: underline;">下载指导书</a>
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
          <el-pagination v-model:current-page="bookingPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" :total="myBookingList.length" style="margin-top: 15px; justify-content: flex-end;" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗群 -->
    <el-dialog v-model="uploadDialogVisible" title="上传实验报告" width="400px">
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

    <el-dialog v-model="historyDialogVisible" title="实验报告历史版本" width="700px">
      <el-table :data="historyList" border style="width: 100%">
        <el-table-column prop="version" label="版本号" width="100" align="center">
          <template #default="scope">第 {{ scope.row.version }} 版</template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" align="center">
           <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
        </el-table-column>
        <el-table-column label="文件操作" align="center">
           <template #default="scope"><a :href="'http://localhost:8080/api/report/download/' + scope.row.fileUrl" target="_blank" style="color: #409EFF; text-decoration: underline;">点击下载</a></template>
        </el-table-column>
        <el-table-column prop="score" label="得分" width="80" align="center">
           <template #default="scope"><span v-if="scope.row.score !== null" style="color: red;">{{ scope.row.score }}</span><span v-else style="color: gray;">-</span></template>
        </el-table-column>
        <el-table-column prop="comment" label="评语" align="center">
           <template #default="scope">{{ scope.row.comment || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="pwdDialog" title="修改密码" width="400px">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码" required><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码" required><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码" required><el-input v-model="pwdForm.confirmPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="pwdDialog = false">取消</el-button><el-button type="primary" @click="submitPwd">确认修改</el-button></template>
    </el-dialog>

    <el-drawer v-model="noticeDrawerVisible" title="我的通知" size="400px">
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const currentStudentNo = loginUser ? loginUser.studentNo : ''
if (!currentStudentNo) router.push('/')

const activeTab = ref('all-sessions')
const sessionList = ref([])
const loading = ref(false)
const myBookingList = ref([])
const bookingLoading = ref(false)

// ⚠️ 分页参数
const sessionPage = ref(1)
const bookingPage = ref(1)
const pageSize = ref(10)

// ⚠️ 分页切片数据
const paginatedSessionList = computed(() => sessionList.value.slice((sessionPage.value - 1) * pageSize.value, sessionPage.value * pageSize.value))
const paginatedBookingList = computed(() => myBookingList.value.slice((bookingPage.value - 1) * pageSize.value, bookingPage.value * pageSize.value))

const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadFile = ref(null)
const uploadProjectNo = ref('')
const uploadProjectName = ref('')

const historyDialogVisible = ref(false)
const historyList = ref([])

const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

onMounted(() => { fetchSessions(); fetchNotices() })

const fetchNotices = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/notice/list?role=student')
    if (res.data.code === 200) {
      noticeList.value = res.data.data
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

const handleTabChange = (name) => { if (name === 'my-bookings') fetchMyBookings(); else fetchSessions() }
const fetchSessions = async () => { loading.value = true; try { const res = await axios.get('http://localhost:8080/api/student/session/list'); if (res.data.code === 200) sessionList.value = res.data.data } finally { loading.value = false } }
const fetchMyBookings = async () => { bookingLoading.value = true; try { const res = await axios.get(`http://localhost:8080/api/student/my-bookings?studentNo=${currentStudentNo}`); if (res.data.code === 200) myBookingList.value = res.data.data } finally { bookingLoading.value = false } }

const formatTeachingTime = (row) => { if (!row || !row.semester) return ''; const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']; return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`; }
const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const handleBook = async (sessionNo) => { try { const res = await axios.post(`http://localhost:8080/api/student/book?studentNo=${currentStudentNo}&sessionNo=${sessionNo}`); if (res.data.code === 200) { ElMessage.success('预约成功！'); fetchSessions() } else { ElMessage.warning(res.data.msg) } } catch (error) { ElMessage.error('预约失败！') } }
const cancelBooking = async (bookingNo) => { try { await ElMessageBox.confirm('确定要取消该场次的预约吗？', '提示', { type: 'warning' }); const res = await axios.post(`http://localhost:8080/api/student/cancel?bookingNo=${bookingNo}`); if (res.data.code === 200) { ElMessage.success('取消预约成功！'); fetchMyBookings(); fetchSessions() } else { ElMessage.error(res.data.msg) } } catch (e) {} }
const openUploadDialog = (row) => { uploadProjectNo.value = row.projectNo; uploadProjectName.value = row.projectName; uploadFile.value = null; uploadDialogVisible.value = true }
const handleFileChange = (file) => { uploadFile.value = file.raw }
const submitUpload = async () => { if (!uploadFile.value) return ElMessage.warning('请先选择文件！'); uploading.value = true; const formData = new FormData(); formData.append('file', uploadFile.value); formData.append('studentNo', currentStudentNo); formData.append('projectNo', uploadProjectNo.value); try { const res = await axios.post('http://localhost:8080/api/report/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); if (res.data.code === 200) { ElMessage.success(res.data.data); uploadDialogVisible.value = false; fetchMyBookings() } else { ElMessage.error(res.data.msg) } } catch (error) { ElMessage.error('上传失败，请检查后端！') } finally { uploading.value = false } }
const openHistory = async (row) => { try { const res = await axios.get(`http://localhost:8080/api/report/my-versions?studentNo=${currentStudentNo}&projectNo=${row.projectNo}`); if (res.data.code === 200) { historyList.value = res.data.data; historyDialogVisible.value = true } } catch (error) { ElMessage.error('获取版本历史失败！') } }
const openPwdDialog = () => { pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }; pwdDialog.value = true }
const submitPwd = async () => { const { oldPassword, newPassword, confirmPassword } = pwdForm.value; if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！'); if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！'); try { const res = await axios.post('http://localhost:8080/api/student/update-password', null, { params: { studentNo: currentStudentNo, oldPwd: oldPassword, newPwd: newPassword } }); if (res.data.code === 200) { ElMessage.success('修改成功，请重新登录！'); pwdDialog.value = false; setTimeout(() => { localStorage.removeItem('loginUser'); router.push('/') }, 1000) } else { ElMessage.error(res.data.msg) } } catch (error) { ElMessage.error('网络错误，修改失败！') } }
const logout = () => { localStorage.removeItem('loginUser'); router.push('/') }
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); margin-top: 20px;}
</style>