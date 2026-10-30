<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 教师端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
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

        <el-tab-pane label="我负责的场次" name="sessions">
          <TeacherSessionPanel 
            v-if="activeTab === 'sessions'" 
            @start-attendance="handleStartAttendance"
            @grade-report="handleGradeReport"
          />
        </el-tab-pane>

        <el-tab-pane label="实验项目管理" name="projects">
          <TeacherProjectPanel v-if="activeTab === 'projects'" />
        </el-tab-pane>

        <el-tab-pane label="安排实验场次" name="schedule">
          <TeacherSchedulePanel v-if="activeTab === 'schedule'" />
        </el-tab-pane>

        <el-tab-pane label="成绩管理" name="scores">
          <TeacherScorePanel v-if="activeTab === 'scores'" />
        </el-tab-pane>

        <el-tab-pane label="数据报表" name="stats">
          <TeacherStatsPanel v-if="activeTab === 'stats'" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 公共弹窗 -->
    <UpdatePasswordDialog v-model="pwdDialog" role="teacher" />

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

    <!-- 🛑【独立业务弹窗】🛑 -->
    <AttendanceDialog v-model="attendanceDialogVisible" :sessionNo="currentSessionNo" />
    <GradeReportDialog v-model="gradeDialogVisible" :projectNo="currentProjectNo" />

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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'

// 🛑【引入所有子组件】🛑
import TeacherSessionPanel from '../components/TeacherSessionPanel.vue'
import TeacherProjectPanel from '../components/TeacherProjectPanel.vue'
import TeacherSchedulePanel from '../components/TeacherSchedulePanel.vue'
import TeacherScorePanel from '../components/TeacherScorePanel.vue'
import TeacherStatsPanel from '../components/TeacherStatsPanel.vue'
import AttendanceDialog from '../components/AttendanceDialog.vue'
import GradeReportDialog from '../components/GradeReportDialog.vue'
import UpdatePasswordDialog from '../components/UpdatePasswordDialog.vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const workNo = loginUser ? loginUser.userNo : ''
if (!workNo) router.push('/')

const isMobile = computed(() => window.innerWidth < 768)
const activeTab = ref('sessions')

const pwdDialog = ref(false)

// 通知管理
const publishDialogVisible = ref(false)
const noticeForm = ref({ title: '', content: '' })
const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

// 签到和批阅弹窗的触发状态
const attendanceDialogVisible = ref(false)
const currentSessionNo = ref('')

const gradeDialogVisible = ref(false)
const currentProjectNo = ref('')

onMounted(() => {
  fetchNotices()
})

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
      params: { title: noticeForm.value.title, content: noticeForm.value.content, targetRole: 'student' }
    })
    if (res.code === 200) { ElMessage.success('通知发布成功！'); publishDialogVisible.value = false; fetchNotices() }
    else { ElMessage.error(res.msg) }
  } catch (e) { ElMessage.error('发布失败') }
}

const handleStartAttendance = (session) => {
  currentSessionNo.value = session.sessionNo
  attendanceDialogVisible.value = true
}

const handleGradeReport = (session) => {
  currentProjectNo.value = session.projectNo
  gradeDialogVisible.value = true
}

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const logout = async () => {
  try {
    await request.post('/logout')
  } catch (e) {
    // 忽略报错
  } finally {
    localStorage.removeItem('loginUser')
    localStorage.removeItem('token')
    router.push('/')
  }
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