<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 学生端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <div style="display: flex; align-items: center;">
        <el-badge :is-dot="hasUnread" style="margin-right: 20px; cursor: pointer;" @click="openNoticeDrawer">
          <el-icon :size="22" color="#409EFF"><Bell /></el-icon>
        </el-badge>
        <el-button type="warning" size="small" @click="pwdDialog = true" style="margin-right: 15px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab" class="demo-tabs" @tab-change="handleTabChange">

        <el-tab-pane label="选课中心" name="select-class">
          <SelectClassPanel v-if="activeTab === 'select-class'" />
        </el-tab-pane>

        <el-tab-pane label="可预约的实验场次" name="all-sessions">
          <SessionListPanel v-if="activeTab === 'all-sessions'" ref="sessionPanelRef" />
        </el-tab-pane>

        <el-tab-pane label="我的周课表" name="calendar">
          <CalendarPanel v-if="activeTab === 'calendar'" />
        </el-tab-pane>

        <el-tab-pane label="我的预约记录" name="my-bookings">
          <MyBookingPanel 
            v-if="activeTab === 'my-bookings'" 
            ref="bookingPanelRef"
            @upload="openUploadDialog"
            @history="openHistory"
            @sign="openSignDialog"
            @cancel-success="onCancelSuccess"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗群 -->
    <UploadReportDialog 
      v-model="uploadDialogVisible" 
      :projectNo="selectedProjectNo" 
      :projectName="selectedProjectName" 
      @success="onUploadSuccess" 
    />

    <ReportHistoryDialog 
      v-model="historyDialogVisible" 
      :projectNo="historyProjectNo" 
    />

    <!-- 🛑 核心修复：传入 forced 属性 -->
    <UpdatePasswordDialog v-model="pwdDialog" role="student" :forced="loginUser?.mustChangePassword === true" />

    <SignInDialog 
      v-model="signDialogVisible"
      :sessionNo="signSessionNo"
      :projectName="signProjectName"
    />

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
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import { WsClient } from '../utils/ws'
// 🛑【核心改造】引入统一的窗口大小监听 Hook
import { useWindowSize } from '../composables/useWindowSize'

// 【引入所有的独立组件】
import UpdatePasswordDialog from '../components/UpdatePasswordDialog.vue'
import UploadReportDialog from '../components/UploadReportDialog.vue'
import ReportHistoryDialog from '../components/ReportHistoryDialog.vue'
import SelectClassPanel from '../components/SelectClassPanel.vue'
import SessionListPanel from '../components/SessionListPanel.vue'
import CalendarPanel from '../components/CalendarPanel.vue'
import MyBookingPanel from '../components/MyBookingPanel.vue'
import SignInDialog from '../components/SignInDialog.vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const currentStudentNo = loginUser ? loginUser.userNo : ''
if (!currentStudentNo) router.push('/')

// 🛑【核心改造】使用 Hook 监听窗口变化
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const activeTab = ref('select-class')

// 【各个弹窗的状态】
const uploadDialogVisible = ref(false)
const selectedProjectNo = ref('')
const selectedProjectName = ref('')

const historyDialogVisible = ref(false)
const historyProjectNo = ref('')

const pwdDialog = ref(false)

const signDialogVisible = ref(false)
const signProjectName = ref('')
const signSessionNo = ref('')

const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

// 【获取子组件实例引用，用于接收 WS 更新】
const sessionPanelRef = ref(null)
const bookingPanelRef = ref(null)

let globalWs = null

onMounted(() => {
  // 🛑【核心改造】移除了原来的 window.addEventListener
  fetchNotices()
  initGlobalWebSocket()
  
  // 🛑【核心修复】如果登录时标记了需要改密，进入主页自动弹出强制改密窗口
  if (loginUser && loginUser.mustChangePassword) {
    pwdDialog.value = true
  }
})

onUnmounted(() => {
  // 🛑【核心改造】移除了原来的 window.removeEventListener
  if (globalWs) globalWs.close()
})

// ⚠️ WebSocket 核心逻辑
const initGlobalWebSocket = async () => {
  const urlProvider = async () => {
    const res = await request.get('/ws-ticket')
    if (res.code !== 200) throw new Error('获取WS凭证失败')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host 
    return `${protocol}//${host}/ws/global?ticket=${res.data}`
  }

  globalWs = new WsClient(urlProvider)
  globalWs.onMessageCallback = (msg) => {
    try {
      const data = JSON.parse(msg)
      
      if (data.type === 'NEW_NOTICE') {
        fetchNotices() 
        ElMessage({ type: 'warning', message: '您有一条新的未读通知！' })
      }
      
      if (data.type === 'SEAT_UPDATE') {
        if (sessionPanelRef.value) {
          sessionPanelRef.value.updateSeats(data.sessionNo, data.seats)
        }
      }

      if (data.type === 'WAITLIST_SUCCESS') {
        ElMessage({ 
          type: 'success', 
          message: data.message || '恭喜！您的候补已成功，系统已为您自动预约！',
          duration: 5000,
          showClose: true
        })
        if (sessionPanelRef.value) sessionPanelRef.value.refresh()
        if (bookingPanelRef.value) bookingPanelRef.value.refresh()
      }
    } catch (e) {}
  }
  globalWs.connect()
}

const handleTabChange = (name) => {
  // 现在的切换不需要写复杂的逻辑了，因为组件挂载时自己会拉数据
}

// 【处理子组件抛出的弹窗事件】
const openUploadDialog = (row) => {
  selectedProjectNo.value = row.projectNo
  selectedProjectName.value = row.projectName
  uploadDialogVisible.value = true
}

const openHistory = (row) => {
  historyProjectNo.value = row.projectNo
  historyDialogVisible.value = true
}

const openSignDialog = (row) => {
  signSessionNo.value = row.sessionNo
  signProjectName.value = row.projectName
  signDialogVisible.value = true
}

// 【操作成功后的刷新】
const onUploadSuccess = () => {
  if (bookingPanelRef.value) bookingPanelRef.value.refresh()
}

const onCancelSuccess = () => {
  if (sessionPanelRef.value) sessionPanelRef.value.refresh()
}

const fetchNotices = async () => {
  try {
    const res = await request.get('/notice/list')
    if (res.code === 200) {
      // 🛑【核心改造】适配后端新的返回结构 { list: [], unreadCount: 0 }
      noticeList.value = res.data.list
      hasUnread.value = res.data.unreadCount > 0
    }
  } catch (e) {}
}

const openNoticeDrawer = () => {
  noticeDrawerVisible.value = true
  // 🛑【核心改造】不再使用 localStorage，而是通知后端标记已读
  if (hasUnread.value) {
    request.post('/notice/mark-read').then(() => {
      hasUnread.value = false
    })
  }
}

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const logout = async () => {
  try {
    await request.post('/logout')
  } catch (e) {
    // 忽略网络错误
  } finally {
    if (globalWs) globalWs.close()
    localStorage.removeItem('loginUser')
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken') // 🛑【核心修复】清理刷新令牌
    router.push('/')
  }
}
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); margin-top: 20px;}

@media screen and (max-width: 768px) {
  .header { padding: 10px 15px; height: auto; min-height: 60px; flex-direction: column; align-items: flex-start; gap: 10px; }
  .header h2 { font-size: 16px; }
  .header > div { width: 100%; justify-content: flex-end; }
  .main-content { padding: 15px; margin-top: 10px; border-radius: 0; }
  .el-tabs__nav-wrap::after { display: none; }
  .el-pagination { justify-content: center !important; flex-wrap: wrap; }
}
</style>