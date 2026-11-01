<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 管理员端</h2>
      <div class="header-actions">
        <el-badge :is-dot="hasUnread" style="margin-right: 15px; cursor: pointer;" @click="openNoticeDrawer">
          <el-icon :size="22" color="#409EFF"><Bell /></el-icon>
        </el-badge>
        <el-button type="primary" size="small" @click="openPublishDialog" style="margin-right: 10px;">发布通知</el-button>
        <el-button type="warning" size="small" @click="pwdDialog = true" style="margin-right: 10px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab">
        <!-- 1. 学生管理 -->
        <el-tab-pane label="学生管理" name="students">
          <AdminStudentPanel v-if="activeTab === 'students'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 2. 教师管理 -->
        <el-tab-pane label="教师管理" name="teachers">
          <AdminTeacherPanel v-if="activeTab === 'teachers'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 3. 院系管理 -->
        <el-tab-pane label="院系管理" name="departments">
          <AdminDeptPanel v-if="activeTab === 'departments'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 4. 职称管理 -->
        <el-tab-pane label="职称管理" name="titles">
          <AdminTitlePanel v-if="activeTab === 'titles'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 5. 专业管理 -->
        <el-tab-pane label="专业管理" name="majors">
          <AdminMajorPanel v-if="activeTab === 'majors'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 6. 行政班管理 -->
        <el-tab-pane label="行政班管理" name="admin-classes">
          <AdminClassPanel v-if="activeTab === 'admin-classes'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 7. 实验室管理 -->
        <el-tab-pane label="实验室管理" name="labs">
          <AdminLabPanel v-if="activeTab === 'labs'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 8. 课程管理 -->
        <el-tab-pane label="课程管理" name="courses">
          <AdminCoursePanel v-if="activeTab === 'courses'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 9. 学期管理 -->
        <el-tab-pane label="学期管理" name="semesters">
          <AdminSemesterPanel v-if="activeTab === 'semesters'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 10. 教学班管理 -->
        <el-tab-pane label="教学班管理" name="teach-classes">
          <AdminTeachClassPanel v-if="activeTab === 'teach-classes'" @refresh-logs="refreshLogsPanel" />
        </el-tab-pane>

        <!-- 11. 系统操作日志 -->
        <el-tab-pane label="系统操作日志" name="logs">
          <AdminLogPanel v-if="activeTab === 'logs'" ref="logPanelRef" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 公共弹窗 -->
    <!-- 🛑 核心修复：传入 forced 属性 -->
    <UpdatePasswordDialog v-model="pwdDialog" role="admin" :forced="loginUser?.mustChangePassword === true" />

    <el-dialog v-model="publishDialogVisible" title="发布通知" :width="isMobile ? '95%' : '500px'">
      <el-form :model="noticeForm" label-width="80px">
        <el-form-item label="通知标题" required><el-input v-model="noticeForm.title" /></el-form-item>
        <el-form-item label="通知内容" required><el-input v-model="noticeForm.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPublish">发布</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="noticeDrawerVisible" title="系统通知" :size="isMobile ? '100%' : '400px'">
      <el-empty v-if="noticeList.length === 0" description="暂无通知" />
      <el-timeline v-else>
        <el-timeline-item v-for="item in noticeList" :key="item.noticeId" :timestamp="formatTime(item.createTime)" placement="top">
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import { WsClient } from '../utils/ws'

// 🛑 引入所有拆分的独立组件
import AdminStudentPanel from '../components/AdminStudentPanel.vue'
import AdminTeacherPanel from '../components/AdminTeacherPanel.vue'
import AdminDeptPanel from '../components/AdminDeptPanel.vue'
import AdminTitlePanel from '../components/AdminTitlePanel.vue'
import AdminMajorPanel from '../components/AdminMajorPanel.vue'
import AdminClassPanel from '../components/AdminClassPanel.vue'
import AdminLabPanel from '../components/AdminLabPanel.vue'
import AdminCoursePanel from '../components/AdminCoursePanel.vue'
import AdminSemesterPanel from '../components/AdminSemesterPanel.vue'
import AdminTeachClassPanel from '../components/AdminTeachClassPanel.vue'
import AdminLogPanel from '../components/AdminLogPanel.vue'
import UpdatePasswordDialog from '../components/UpdatePasswordDialog.vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const activeTab = ref('students')

const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)
const handleResize = () => { screenWidth.value = window.innerWidth }

const pwdDialog = ref(false)
const publishDialogVisible = ref(false)
const noticeForm = ref({ title: '', content: '' })
const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

let globalWs = null
const logPanelRef = ref(null)

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

onMounted(() => { 
  window.addEventListener('resize', handleResize)
  fetchNotices();
  initGlobalWebSocket()

  // 🛑【核心修复】如果登录时标记了需要改密，进入主页自动弹出强制改密窗口
  if (loginUser && loginUser.mustChangePassword) {
    pwdDialog.value = true
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (globalWs) globalWs.close()
})

const refreshLogsPanel = () => {
  if (logPanelRef.value) logPanelRef.value.refresh()
}

const initGlobalWebSocket = async () => {
  const urlProvider = async () => {
    const res = await request.get('/ws-ticket')
    if (res.code !== 200) throw new Error('获取WS凭证失败')
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const host = window.location.host 
    return `${protocol}${host}/ws/global?ticket=${res.data}`
  }

  globalWs = new WsClient(urlProvider)
  globalWs.onMessageCallback = (msg) => {
    try {
      const data = JSON.parse(msg)
      if (data.type === 'NEW_NOTICE') {
        fetchNotices() 
        ElMessage({ type: 'warning', message: '收到一条新系统通知！' })
      }
    } catch (e) {}
  }
  globalWs.connect()
}

const fetchNotices = async () => {
  try {
    const res = await request.get('/notice/list')
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

const openPublishDialog = () => { noticeForm.value = { title: '', content: '' }; publishDialogVisible.value = true }

const submitPublish = async () => {
  if (!noticeForm.value.title || !noticeForm.value.content) return ElMessage.warning('标题和内容不能为空')
  try {
    const res = await request.post('/notice/publish', null, {
      params: {
        title: noticeForm.value.title,
        content: noticeForm.value.content,
        targetRole: 'all'
      }
    })
    if (res.code === 200) { ElMessage.success('通知发布成功！'); publishDialogVisible.value = false; fetchNotices() }
    else { ElMessage.error(res.msg) }
  } catch (e) { ElMessage.error('发布失败') }
}

const logout = () => { 
  if (globalWs) globalWs.close()
  localStorage.removeItem('loginUser'); 
  localStorage.removeItem('token'); 
  router.push('/') 
}
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1300px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); margin-top: 20px;}

@media screen and (max-width: 768px) {
  .header { padding: 10px 15px; height: auto; min-height: 60px; flex-direction: column; align-items: flex-start; gap: 10px; }
  .header h2 { font-size: 16px; }
  .header-actions { width: 100%; justify-content: flex-end; flex-wrap: wrap; gap: 10px;}
  .main-content { padding: 15px; margin-top: 10px; border-radius: 0; }
  .el-tabs__nav-wrap::after { display: none; }
}
</style>