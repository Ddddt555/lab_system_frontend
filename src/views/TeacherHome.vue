<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 教师端（欢迎你，{{ loginUser ? loginUser.name : '' }}）</h2>
      <div class="header-actions">
        <el-badge :is-dot="hasUnread" style="margin-right: 15px; cursor: pointer;" @click="openNoticeDrawer">
          <el-icon :size="22" color="#409EFF"><Bell /></el-icon>
        </el-badge>
        <el-button type="primary" size="small" @click="openPublishDialog" style="margin-right: 10px;">发布通知</el-button>
        <el-button type="warning" size="small" @click="openPwdDialog" style="margin-right: 10px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <div class="main-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        
        <!-- 1. 我负责的场次 -->
        <el-tab-pane label="我负责的场次" name="sessions">
          <div class="table-responsive">
            <el-table :data="paginatedSessionList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
              <el-table-column prop="projectName" label="实验项目名称" width="200" align="center" />
              <el-table-column label="上课时间" align="center" min-width="180">
                <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
              </el-table-column>
              <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
                <template #default="scope">{{ scope.row.remainingSeats }} / {{ scope.row.capacity }}</template>
              </el-table-column>
              <el-table-column label="操作" width="200" align="center">
                <template #default="scope">
                  <el-button type="primary" size="small" @click="viewBookings(scope.row)">预约名单</el-button>
                  <el-button type="success" size="small" @click="openReports(scope.row)">批阅报告</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="sessionPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="sessionList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 2. 实验项目管理 -->
        <el-tab-pane label="实验项目管理" name="projects">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddProject">发布新实验项目</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedProjectList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="projectNo" label="项目号" width="120" align="center" />
              <el-table-column prop="projectName" label="项目名称" width="180" align="center" />
              <el-table-column prop="courseNo" label="所属课程" width="120" align="center" />
              <el-table-column prop="hours" label="学时" width="80" align="center" />
              <el-table-column prop="standard" label="考核标准" width="180" align="center" />
              <el-table-column label="实验指导书" width="150" align="center">
                <template #default="scope">
                  <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="(file) => handleGuideUpload(file, scope.row.projectNo)">
                    <el-button type="primary" size="small" plain>
                      {{ scope.row.guideFile ? '重新上传' : '上传指导书' }}
                    </el-button>
                  </el-upload>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="projectPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="projectList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 3. 安排实验场次 -->
        <el-tab-pane label="安排实验场次" name="schedule">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddSession">安排新场次</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedSessionList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
              <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
              <el-table-column label="上课时间" align="center" min-width="180">
                <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
              </el-table-column>
              <el-table-column prop="capacity" label="总容量" width="100" align="center" />
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope"><el-button type="danger" size="small" @click="deleteSession(scope.row.sessionNo)">取消排课</el-button></template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="sessionPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="sessionList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 4. 成绩管理 -->
        <el-tab-pane label="成绩管理" name="scores">
          <div style="margin-bottom: 15px;">
            <el-select v-model="selectedCourseNo" placeholder="请选择课程" :style="{ width: isMobile ? '100%' : '300px' }" @change="fetchCourseScores">
              <el-option v-for="c in courseOptions" :key="c.courseNo" :label="c.courseNo + ' - ' + c.courseName" :value="c.courseNo" />
            </el-select>
          </div>
          <div class="table-responsive">
            <el-table :data="paginatedScoreList" border style="width: 100%" v-loading="loading" v-if="selectedCourseNo">
              <el-table-column prop="studentNo" label="学号" width="150" align="center" />
              <el-table-column prop="teacherName" label="姓名" width="100" align="center" />
              <el-table-column label="平时成绩 (30%)" width="150" align="center">
                <template #default="scope"><el-input-number v-model="scope.row.score" :min="0" :max="100" size="small" /></template>
              </el-table-column>
              <el-table-column label="报告均分 (70%)" width="120" align="center">
                <template #default="scope"><span style="color: #409EFF; font-weight: bold;">{{ scope.row.reportScore }}</span></template>
              </el-table-column>
              <el-table-column label="总评成绩" width="120" align="center">
                <template #default="scope"><span style="color: red; font-weight: bold; font-size: 16px;">{{ scope.row.totalScore }}</span></template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope"><el-button type="primary" size="small" @click="saveScore(scope.row.studentNo)">保存</el-button></template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-if="selectedCourseNo" v-model:current-page="scorePage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="scoreList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 5. 数据报表 -->
        <el-tab-pane label="数据报表" name="stats">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" style="margin-bottom: 20px;">
              <el-card shadow="hover">
                <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">成绩分布</div>
                <div ref="scoreChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-card shadow="hover">
                <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">实验开出率</div>
                <div ref="rateChartRef" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗群 (全部改成响应式宽度) -->
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

    <el-dialog v-model="reportDialogVisible" title="实验报告批阅" :width="isMobile ? '95%' : '80%'">
      <div class="table-responsive">
        <el-table :data="reportList" border style="width: 100%">
          <el-table-column prop="studentName" label="姓名" width="90" align="center" />
          <el-table-column prop="className" label="班级" width="110" align="center" />
          <el-table-column prop="submitTime" label="提交时间" width="150" align="center">
            <template #default="scope">{{ formatTime(scope.row.submitTime) }}</template>
          </el-table-column>
          <el-table-column label="报告文件" width="120" align="center">
            <template #default="scope"><a :href="'/api/report/download/' + scope.row.fileUrl" target="_blank" style="color: #409EFF; text-decoration: underline;">点击下载</a></template>
          </el-table-column>
          <el-table-column label="分数" width="80" align="center">
             <template #default="scope">{{ scope.row.score !== null ? scope.row.score : '未批阅' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope"><el-button type="warning" size="small" @click="gradeReport(scope.row)">批阅</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="projectDialog" title="发布新实验项目" :width="isMobile ? '95%' : '500px'">
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

    <el-dialog v-model="sessionDialog" title="安排实验场次" :width="isMobile ? '95%' : '500px'">
      <el-form :model="newSession" label-width="80px">
        <el-form-item label="场次号" required><el-input v-model="newSession.sessionNo" placeholder="如：S003" /></el-form-item>
        <el-form-item label="实验项目" required>
          <el-select v-model="newSession.projectNo" placeholder="请选择项目" style="width: 100%">
            <el-option v-for="p in projectList" :key="p.projectNo" :label="p.projectNo + ' - ' + p.projectName" :value="p.projectNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="实验室" required>
          <el-select v-model="newSession.roomNo" placeholder="请选择实验室" style="width: 100%" @change="handleLabChange">
            <el-option v-for="r in labOptions" :key="r.roomNo" :label="r.roomNo + ' - ' + r.roomName" :value="r.roomNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="newSession.semester" style="width: 100%" placeholder="请选择学期">
            <el-option v-for="s in semesterOptions" :key="s.semesterName" :label="s.semesterName" :value="s.semesterName" />
          </el-select>
        </el-form-item>
        <el-form-item label="周次" required><el-input-number v-model="newSession.weekNum" :min="1" :max="30" /><span style="margin-left:10px; color:gray;">周</span></el-form-item>
        <el-form-item label="星期" required>
          <el-select v-model="newSession.dayOfWeek" style="width: 100%">
            <el-option label="星期一" :value="1" /><el-option label="星期二" :value="2" /><el-option label="星期三" :value="3" />
            <el-option label="星期四" :value="4" /><el-option label="星期五" :value="5" /><el-option label="星期六" :value="6" /><el-option label="星期日" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="节次" required>
          <el-select v-model="newSession.period" style="width: 100%">
            <el-option label="1-2节 (08:00)" value="1-2节" /><el-option label="3-4节 (10:00)" value="3-4节" />
            <el-option label="5-6节 (14:00)" value="5-6节" /><el-option label="7-8节 (16:00)" value="7-8节" /><el-option label="9-10节 (19:00)" value="9-10节" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量(机位)" required>
          <el-input-number v-model="newSession.capacity" :min="1" :max="selectedLabCapacity" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="sessionDialog = false">取消</el-button><el-button type="primary" @click="submitAddSession">确认排课</el-button></template>
    </el-dialog>

    <el-dialog v-model="pwdDialog" title="修改密码" :width="isMobile ? '95%' : '400px'">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码" required><el-input v-model="pwdForm.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码" required><el-input v-model="pwdForm.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码" required><el-input v-model="pwdForm.confirmPassword" type="password" show-password /></el-form-item>
      </el-form>
      <template #footer><el-button @click="pwdDialog = false">取消</el-button><el-button type="primary" @click="submitPwd">确认修改</el-button></template>
    </el-dialog>

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
import { ref, onMounted, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { Bell } from '@element-plus/icons-vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const workNo = loginUser ? loginUser.workNo : ''
if (!workNo) router.push('/')

// ⚠️ 新增：响应式判断
const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)
const handleResize = () => { screenWidth.value = window.innerWidth }

const activeTab = ref('sessions')
const loading = ref(false)

const sessionList = ref([])
const projectList = ref([])
const courseOptions = ref([])
const labOptions = ref([])
const semesterOptions = ref([]) 
const scoreList = ref([])

const sessionPage = ref(1)
const projectPage = ref(1)
const scorePage = ref(1)
const pageSize = ref(10)

const paginatedSessionList = computed(() => sessionList.value.slice((sessionPage.value - 1) * pageSize.value, sessionPage.value * pageSize.value))
const paginatedProjectList = computed(() => projectList.value.slice((projectPage.value - 1) * pageSize.value, projectPage.value * pageSize.value))
const paginatedScoreList = computed(() => scoreList.value.slice((scorePage.value - 1) * pageSize.value, scorePage.value * pageSize.value))

const selectedCourseNo = ref('')
const bookingDialogVisible = ref(false)
const studentList = ref([])
const reportDialogVisible = ref(false)
const reportList = ref([])

const projectDialog = ref(false)
const newProject = ref({ projectNo: '', projectName: '', courseNo: '', hours: 2, standard: '' })

const sessionDialog = ref(false)
const newSession = ref({ sessionNo: '', projectNo: '', roomNo: '', semester: '', weekNum: 1, dayOfWeek: 1, period: '1-2节', capacity: 50 })
const selectedLabCapacity = ref(100)

const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const publishDialogVisible = ref(false)
const noticeForm = ref({ title: '', content: '' })
const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

const scoreChartRef = ref(null)
const rateChartRef = ref(null)
let scoreChart = null
let rateChart = null

onMounted(() => { 
  fetchSessions(); fetchProjects(); fetchCourses(); fetchLabs(); fetchSemesters(); fetchNotices();
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (scoreChart) scoreChart.dispose()
  if (rateChart) rateChart.dispose()
})

const handleTabChange = (name) => {
  if (name === 'stats') nextTick(() => renderCharts())
}

const fetchSessions = async () => { loading.value = true; try { const res = await axios.get(`/api/teacher/my-sessions?workNo=${workNo}`); if (res.data.code === 200) sessionList.value = res.data.data } finally { loading.value = false } }
const fetchProjects = async () => { try { const res = await axios.get('/api/teacher/project/list'); if (res.data.code === 200) projectList.value = res.data.data } catch (e) {} }
const fetchCourses = async () => { try { const res = await axios.get('/api/admin/courses'); if (res.data.code === 200) courseOptions.value = res.data.data } catch (e) {} }
const fetchLabs = async () => { try { const res = await axios.get('/api/teacher/labs'); if (res.data.code === 200) labOptions.value = res.data.data } catch (e) {} }
const fetchSemesters = async () => { 
  try { 
    const res = await axios.get('/api/teacher/semesters'); 
    if (res.data.code === 200) {
      semesterOptions.value = res.data.data
      if (semesterOptions.value.length > 0 && !newSession.value.semester) newSession.value.semester = semesterOptions.value[0].semesterName
    }
  } catch (e) {} 
}

const fetchNotices = async () => {
  try {
    const res = await axios.get('/api/notice/list?role=teacher')
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

const openNoticeDrawer = () => { noticeDrawerVisible.value = true; hasUnread.value = false; if (noticeList.value.length > 0) localStorage.setItem('lastReadNoticeTime', noticeList.value[0].createTime) }
const openPublishDialog = () => { noticeForm.value = { title: '', content: '' }; publishDialogVisible.value = true }

const submitPublish = async () => {
  if (!noticeForm.value.title || !noticeForm.value.content) return ElMessage.warning('标题和内容不能为空')
  try {
    const res = await axios.post('/api/notice/publish', null, {
      params: { title: noticeForm.value.title, content: noticeForm.value.content, publisherName: loginUser ? loginUser.name : '老师', targetRole: 'student' }
    })
    if (res.data.code === 200) { ElMessage.success('通知发布成功！'); publishDialogVisible.value = false; fetchNotices() }
  } catch (e) { ElMessage.error('发布失败') }
}

const renderCharts = async () => {
  if (scoreChartRef.value) {
    if (!scoreChart) scoreChart = echarts.init(scoreChartRef.value)
    const res = await axios.get('/api/teacher/stats/score-distribution')
    if (res.data.code === 200) {
      const data = res.data.data
      scoreChart.setOption({
        tooltip: { trigger: 'item' }, legend: { top: 'bottom' },
        series: [{ name: '成绩分布', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }, label: { show: false, position: 'center' }, emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } }, labelLine: { show: false },
            data: [{ value: data['优秀'], name: '优秀 (90-100)', itemStyle: { color: '#67C23A' } }, { value: data['良好'], name: '良好 (80-89)', itemStyle: { color: '#409EFF' } }, { value: data['中等'], name: '中等 (70-79)', itemStyle: { color: '#E6A23C' } }, { value: data['及格'], name: '及格 (60-69)', itemStyle: { color: '#909399' } }, { value: data['不及格'], name: '不及格 (<60)', itemStyle: { color: '#F56C6C' } }]
        }]
      })
    }
  }
  if (rateChartRef.value) {
    if (!rateChart) rateChart = echarts.init(rateChartRef.value)
    const res = await axios.get('/api/teacher/stats/experiment-rate')
    if (res.data.code === 200) {
      const data = res.data.data
      rateChart.setOption({
        tooltip: { formatter: '{b}: {c}%' },
        series: [{ type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100, splitNumber: 5, itemStyle: { color: '#409EFF' }, progress: { show: true, width: 18 }, pointer: { show: false }, axisLine: { lineStyle: { width: 18 } }, axisTick: { show: false }, splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } }, axisLabel: { distance: 25, color: '#999', fontSize: 12 }, detail: { valueAnimation: true, formatter: '{value}%', color: '#409EFF', fontSize: 30, offsetCenter: [0, '40%'] }, data: [{ value: parseFloat(data.rate), name: `已开 ${data.opened} / 共 ${data.total} 个` }], title: { offsetCenter: [0, '70%'], fontSize: 14, color: '#666' } }]
      })
    }
  }
}

const fetchCourseScores = async () => { if (!selectedCourseNo.value) return; loading.value = true; try { const res = await axios.get(`/api/teacher/scores?courseNo=${selectedCourseNo.value}`); if (res.data.code === 200) scoreList.value = res.data.data } catch (e) { ElMessage.error('获取成绩单失败') } finally { loading.value = false } }
const saveScore = async (studentNo) => { const row = scoreList.value.find(item => item.studentNo === studentNo); if (!row || row.score === null || row.score === undefined) return ElMessage.warning('请输入平时成绩'); try { const res = await axios.post(`/api/teacher/score/save?studentNo=${studentNo}&courseNo=${selectedCourseNo.value}&dailyScore=${row.score}&workNo=${workNo}`); if (res.data.code === 200) { ElMessage.success(res.data.data); fetchCourseScores() } else { ElMessage.error(res.data.msg) } } catch (error) { ElMessage.error('保存失败') } }
const handleLabChange = (roomNo) => { const lab = labOptions.value.find(r => r.roomNo === roomNo); if (lab) { selectedLabCapacity.value = lab.capacity; if (newSession.value.capacity > lab.capacity) newSession.value.capacity = lab.capacity } }
const formatTeachingTime = (row) => { if (!row || !row.semester) return ''; const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']; return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`; }
const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const handleGuideUpload = async (file, projectNo) => { const rawFile = file.raw; if (!rawFile) return; const formData = new FormData(); formData.append('file', rawFile); formData.append('projectNo', projectNo); formData.append('workNo', workNo); try { const res = await axios.post('/api/teacher/project/upload-guide', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); if (res.data.code === 200) { ElMessage.success('指导书上传成功！'); fetchProjects() } else { ElMessage.error(res.data.msg) } } catch (error) { ElMessage.error('上传失败！') } }
const openAddProject = () => { newProject.value = { projectNo: '', projectName: '', courseNo: '', hours: 2, standard: '' }; projectDialog.value = true }
const submitAddProject = async () => { if (!newProject.value.projectNo || !newProject.value.projectName || !newProject.value.courseNo) return ElMessage.warning('请填写完整信息！'); try { const res = await axios.post('/api/teacher/project/add', newProject.value); if (res.data.code === 200) { ElMessage.success('发布成功！'); projectDialog.value = false; fetchProjects() } else { ElMessage.error(res.data.msg) } } catch (e) { ElMessage.error('请求失败') } }
const openAddSession = () => { newSession.value = { sessionNo: '', projectNo: '', roomNo: '', semester: semesterOptions.value.length > 0 ? semesterOptions.value[0].semesterName : '', weekNum: 1, dayOfWeek: 1, period: '1-2节', capacity: 50 }; selectedLabCapacity.value = 100; sessionDialog.value = true }
const submitAddSession = async () => { if (!newSession.value.sessionNo || !newSession.value.projectNo || !newSession.value.roomNo || !newSession.value.period || !newSession.value.semester) return ElMessage.warning('请填写完整信息！'); const payload = { ...newSession.value, workNo: workNo }; try { const res = await axios.post('/api/teacher/session/add', payload); if (res.data.code === 200) { ElMessage.success('排课成功！'); sessionDialog.value = false; fetchSessions(); activeTab.value = 'sessions' } else { ElMessage.error(res.data.msg) } } catch (error) { ElMessage.error('排课失败！') } }
const deleteSession = async (sessionNo) => { try { await ElMessageBox.confirm('确定要取消该场次的排课吗？', '警告', { type: 'warning' }); const res = await axios.delete(`/api/teacher/session/delete?sessionNo=${sessionNo}&workNo=${workNo}`); if (res.data.code === 200) { ElMessage.success('已取消排课！'); fetchSessions() } else { ElMessage.error(res.data.msg) } } catch (e) {} }
const viewBookings = async (session) => { try { const res = await axios.get(`/api/teacher/session-bookings?sessionNo=${session.sessionNo}`); if (res.data.code === 200) { studentList.value = res.data.data; bookingDialogVisible.value = true } } catch (error) {} }
const openReports = async (session) => { try { const res = await axios.get(`/api/report/list-by-project?projectNo=${session.projectNo}`); if (res.data.code === 200) { reportList.value = res.data.data; reportDialogVisible.value = true } } catch (error) {} }
const gradeReport = async (report) => { try { const { value: score } = await ElMessageBox.prompt('请输入分数', '打分', { inputPattern: /^([0-9]|[1-9]\d|100)$/, inputErrorMessage: '0-100' }); const { value: comment } = await ElMessageBox.prompt('请输入评语', '评语'); const res = await axios.post(`/api/report/grade?reportNo=${report.reportNo}&score=${score}&comment=${comment}`); if (res.data.code === 200) { ElMessage.success('批阅成功！'); openReports({ projectNo: report.projectNo }) } } catch (error) {} }
const openPwdDialog = () => { pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }; pwdDialog.value = true }
const submitPwd = async () => { const { oldPassword, newPassword, confirmPassword } = pwdForm.value; if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！'); if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！'); try { const res = await axios.post('/api/teacher/update-password', null, { params: { workNo: workNo, oldPwd: oldPassword, newPwd: newPassword } }); if (res.data.code === 200) { ElMessage.success('修改成功，请重新登录！'); pwdDialog.value = false; setTimeout(() => { localStorage.removeItem('loginUser'); router.push('/') }, 1000) } else { ElMessage.error(res.data.msg) } } catch (error) { ElMessage.error('网络错误，修改失败！') } }
const logout = () => { localStorage.removeItem('loginUser'); router.push('/') }
</script>

<style scoped>
.home-container { min-height: 100vh; background-color: #f5f7fa; }
.header { background-color: #fff; height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header h2 { margin: 0; color: #333; }
.main-content { padding: 40px; max-width: 1300px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); margin-top: 20px;}

/* 📱 手机端适配核心样式 */
.table-responsive {
  width: 100%;
  overflow-x: auto; /* 手机端表格内部横向滑动，不破坏布局 */
  -webkit-overflow-scrolling: touch;
}

@media screen and (max-width: 768px) {
  .header {
    padding: 10px 15px;
    height: auto;
    min-height: 60px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .header h2 { font-size: 16px; }
  .header-actions { width: 100%; justify-content: flex-end; flex-wrap: wrap; gap: 10px;}
  .main-content { padding: 15px; margin-top: 10px; border-radius: 0; }
  .el-tabs__nav-wrap::after { display: none; }
  .el-pagination { justify-content: center !important; flex-wrap: wrap; }
}
</style>