<template>
  <div class="home-container">
    <div class="header">
      <h2>实验教学管理系统 - 管理员端</h2>
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
      <el-tabs v-model="activeTab">
        
        <!-- 1. 学生管理 -->
        <el-tab-pane label="学生管理" name="students">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddStudent">新增学生</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedStudentList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="studentNo" label="学号" width="150" align="center" />
              <el-table-column prop="name" label="姓名" width="120" align="center" />
              <el-table-column prop="className" label="班级" min-width="150" align="center" />
              <el-table-column prop="major" label="专业" min-width="150" align="center" />
              <el-table-column label="操作" width="200" align="center">
                <template #default="scope">
                  <el-button type="warning" size="small" @click="resetPwd(scope.row.studentNo, 'student')">重置密码</el-button>
                  <el-button type="danger" size="small" @click="deleteStudent(scope.row.studentNo)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="studentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="studentList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 2. 教师管理 -->
        <el-tab-pane label="教师管理" name="teachers">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddTeacher">新增教师</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedTeacherList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="workNo" label="工号" width="150" align="center" />
              <el-table-column prop="name" label="姓名" width="120" align="center" />
              <el-table-column prop="department" label="院系" min-width="180" align="center" />
              <el-table-column prop="title" label="职称" width="120" align="center" />
              <el-table-column label="操作" width="200" align="center">
                <template #default="scope">
                  <el-button type="warning" size="small" @click="resetPwd(scope.row.workNo, 'teacher')">重置密码</el-button>
                  <el-button type="danger" size="small" @click="deleteTeacher(scope.row.workNo)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="teacherPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="teacherList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 3. 实验室管理 -->
        <el-tab-pane label="实验室管理" name="labs">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddLab">新增实验室</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedLabList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="roomNo" label="实验室号" width="120" align="center" />
              <el-table-column prop="roomName" label="实验室名称" min-width="180" align="center" />
              <el-table-column prop="location" label="位置" min-width="150" align="center" />
              <el-table-column prop="capacity" label="容量" width="100" align="center" />
              <el-table-column label="操作" width="200" align="center">
                <template #default="scope">
                  <el-button type="primary" size="small" plain @click="openEquipDialog(scope.row)">设备管理</el-button>
                  <el-button type="danger" size="small" @click="deleteLab(scope.row.roomNo)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="labPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="labList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 4. 课程管理 -->
        <el-tab-pane label="课程管理" name="courses">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddCourse">新增课程</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedCourseList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="courseNo" label="课程号" width="150" align="center" />
              <el-table-column prop="courseName" label="课程名" min-width="180" align="center" />
              <el-table-column prop="credit" label="学分" width="100" align="center" />
              <el-table-column prop="hours" label="学时" width="100" align="center" />
              <el-table-column prop="semester" label="学期" min-width="150" align="center" />
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope"><el-button type="danger" size="small" @click="deleteCourse(scope.row.courseNo)">删除</el-button></template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="coursePage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="courseList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 5. 学期管理 -->
        <el-tab-pane label="学期管理" name="semesters">
          <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddSemester">新增学期配置</el-button></div>
          <div class="table-responsive">
            <el-table :data="paginatedSemesterList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="semesterName" label="学期名称" min-width="180" align="center" />
              <el-table-column prop="startDate" label="开学第一周(周一)" min-width="180" align="center" />
              <el-table-column prop="totalWeeks" label="总周数" width="120" align="center" />
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope"><el-button type="danger" size="small" @click="deleteSemester(scope.row.semesterName)">删除</el-button></template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="semesterPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="semesterList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>

        <!-- 6. 系统操作日志 -->
        <el-tab-pane label="系统操作日志" name="logs">
          <div class="table-responsive">
            <el-table :data="paginatedLogList" border style="width: 100%" v-loading="loading">
              <el-table-column prop="id" label="日志ID" width="100" align="center" />
              <el-table-column prop="operator" label="操作人" width="150" align="center" />
              <el-table-column prop="action" label="操作动作" min-width="200" align="center">
                <template #default="scope">
                  <el-tag :type="scope.row.action.includes('删除') || scope.row.action.includes('取消') || scope.row.action.includes('失败') ? 'danger' : 'success'">
                    {{ scope.row.action }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="操作时间" width="180" align="center">
                <template #default="scope">{{ scope.row.createTime ? scope.row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
              </el-table-column>
            </el-table>
          </div>
          <el-pagination v-model:current-page="logPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="logList.length" style="margin-top: 15px; justify-content: center;" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 弹窗群 (响应式宽度) -->
    <el-dialog v-model="studentDialog" title="新增学生" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newStudent" label-width="80px">
        <el-form-item label="学号" required><el-input v-model="newStudent.studentNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="newStudent.name" /></el-form-item>
        <el-form-item label="初始密码"><el-input v-model="newStudent.password" type="password" show-password placeholder="不填默认123456" /></el-form-item>
        <el-form-item label="班级"><el-input v-model="newStudent.className" /></el-form-item>
        <el-form-item label="专业"><el-input v-model="newStudent.major" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="studentDialog = false">取消</el-button><el-button type="primary" @click="submitAddStudent">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="teacherDialog" title="新增教师" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newTeacher" label-width="80px">
        <el-form-item label="工号" required><el-input v-model="newTeacher.workNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="newTeacher.name" /></el-form-item>
        <el-form-item label="初始密码"><el-input v-model="newTeacher.password" type="password" show-password placeholder="不填默认123456" /></el-form-item>
        <el-form-item label="院系"><el-input v-model="newTeacher.department" /></el-form-item>
        <el-form-item label="职称"><el-input v-model="newTeacher.title" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="teacherDialog = false">取消</el-button><el-button type="primary" @click="submitAddTeacher">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="labDialog" title="新增实验室" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newLab" label-width="100px">
        <el-form-item label="实验室号" required><el-input v-model="newLab.roomNo" /></el-form-item>
        <el-form-item label="实验室名称" required><el-input v-model="newLab.roomName" /></el-form-item>
        <el-form-item label="位置"><el-input v-model="newLab.location" /></el-form-item>
        <el-form-item label="容量(机位)"><el-input-number v-model="newLab.capacity" :min="1" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="labDialog = false">取消</el-button><el-button type="primary" @click="submitAddLab">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="equipDialog" :title="'管理设备 - ' + (currentLab ? currentLab.roomName : '')" :width="isMobile ? '95%' : '600px'">
      <div style="margin-bottom: 15px; text-align: right;">
        <el-button type="primary" size="small" @click="openAddEquip">新增设备</el-button>
      </div>
      <div class="table-responsive">
        <el-table :data="currentLabEquipList" border style="width: 100%">
          <el-table-column prop="equipNo" label="设备号" width="120" align="center" />
          <el-table-column prop="equipName" label="设备名称" min-width="150" align="center" />
          <el-table-column prop="model" label="型号" min-width="120" align="center" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope"><el-button type="danger" size="small" @click="deleteEquip(scope.row.equipNo)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="addEquipDialog" title="新增设备" :width="isMobile ? '95%' : '400px'" append-to-body>
      <el-form :model="newEquip" label-width="100px">
        <el-form-item label="设备号" required><el-input v-model="newEquip.equipNo" /></el-form-item>
        <el-form-item label="设备名称" required><el-input v-model="newEquip.equipName" /></el-form-item>
        <el-form-item label="型号"><el-input v-model="newEquip.model" /></el-form-item>
        <el-form-item label="数量"><el-input-number v-model="newEquip.quantity" :min="1" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="addEquipDialog = false">取消</el-button><el-button type="primary" @click="submitAddEquip">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="courseDialog" title="新增课程" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newCourse" label-width="80px">
        <el-form-item label="课程号" required><el-input v-model="newCourse.courseNo" /></el-form-item>
        <el-form-item label="课程名" required><el-input v-model="newCourse.courseName" /></el-form-item>
        <el-form-item label="学分"><el-input-number v-model="newCourse.credit" :min="0.5" :step="0.5" /></el-form-item>
        <el-form-item label="学时"><el-input-number v-model="newCourse.hours" :min="1" /></el-form-item>
        <el-form-item label="学期"><el-input v-model="newCourse.semester" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="courseDialog = false">取消</el-button><el-button type="primary" @click="submitAddCourse">确认</el-button></template>
    </el-dialog>

    <el-dialog v-model="semesterDialog" title="新增学期配置" :width="isMobile ? '95%' : '450px'">
      <el-form :model="newSemester" label-width="120px">
        <el-form-item label="学期名称" required><el-input v-model="newSemester.semesterName" placeholder="如：2026-2027 上学期" /></el-form-item>
        <el-form-item label="开学第一周" required><el-date-picker v-model="newSemester.startDate" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="总周数"><el-input-number v-model="newSemester.totalWeeks" :min="1" :max="30" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="semesterDialog = false">取消</el-button><el-button type="primary" @click="submitAddSemester">确认</el-button></template>
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'

const router = useRouter()
const loginUser = JSON.parse(localStorage.getItem('loginUser'))
const activeTab = ref('students')
const loading = ref(false)

// 响应式判断
const screenWidth = ref(window.innerWidth)
const isMobile = computed(() => screenWidth.value < 768)
const handleResize = () => { screenWidth.value = window.innerWidth }

// 数据列表
const studentList = ref([])
const teacherList = ref([])
const labList = ref([])
const courseList = ref([])
const semesterList = ref([])
const logList = ref([]) 
const allEquipList = ref([])

const studentPage = ref(1)
const teacherPage = ref(1)
const labPage = ref(1)
const coursePage = ref(1)
const semesterPage = ref(1)
const logPage = ref(1)
const pageSize = ref(10)

const paginatedStudentList = computed(() => studentList.value.slice((studentPage.value - 1) * pageSize.value, studentPage.value * pageSize.value))
const paginatedTeacherList = computed(() => teacherList.value.slice((teacherPage.value - 1) * pageSize.value, teacherPage.value * pageSize.value))
const paginatedLabList = computed(() => labList.value.slice((labPage.value - 1) * pageSize.value, labPage.value * pageSize.value))
const paginatedCourseList = computed(() => courseList.value.slice((coursePage.value - 1) * pageSize.value, coursePage.value * pageSize.value))
const paginatedSemesterList = computed(() => semesterList.value.slice((semesterPage.value - 1) * pageSize.value, semesterPage.value * pageSize.value))
const paginatedLogList = computed(() => logList.value.slice((logPage.value - 1) * pageSize.value, logPage.value * pageSize.value))

const studentDialog = ref(false)
const newStudent = ref({ studentNo: '', name: '', password: '', className: '', major: '' })
const teacherDialog = ref(false)
const newTeacher = ref({ workNo: '', name: '', password: '', department: '', title: '' })
const labDialog = ref(false)
const newLab = ref({ roomNo: '', roomName: '', location: '', capacity: 30 })
const equipDialog = ref(false)
const addEquipDialog = ref(false)
const currentLab = ref(null)
const newEquip = ref({ equipNo: '', equipName: '', model: '', quantity: 1, roomNo: '' })
const courseDialog = ref(false)
const newCourse = ref({ courseNo: '', courseName: '', credit: 2.0, hours: 32, semester: '' })
const semesterDialog = ref(false)
const newSemester = ref({ semesterName: '', startDate: '', totalWeeks: 20 })
const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const publishDialogVisible = ref(false)
const noticeForm = ref({ title: '', content: '' })
const noticeDrawerVisible = ref(false)
const noticeList = ref([])
const hasUnread = ref(false)

const formatTime = (timeStr) => timeStr ? timeStr.replace('T', ' ').substring(0, 16) : ''

const currentLabEquipList = computed(() => {
  if (!currentLab.value) return []
  return allEquipList.value.filter(e => e.roomNo === currentLab.value.roomNo)
})

onMounted(() => { 
  window.addEventListener('resize', handleResize)
  fetchStudents(); fetchTeachers(); fetchLabs(); fetchCourses(); fetchSemesters(); fetchLogs(); fetchNotices(); 
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// ================= 数据拉取 =================
const fetchStudents = async () => { loading.value = true; try { const res = await axios.get('/api/admin/students'); if (res.data.code === 200) studentList.value = res.data.data } finally { loading.value = false } }
const fetchTeachers = async () => { loading.value = true; try { const res = await axios.get('/api/admin/teachers'); if (res.data.code === 200) teacherList.value = res.data.data } finally { loading.value = false } }
const fetchLabs = async () => { loading.value = true; try { const res = await axios.get('/api/admin/labs'); if (res.data.code === 200) labList.value = res.data.data } finally { loading.value = false } }
const fetchCourses = async () => { loading.value = true; try { const res = await axios.get('/api/admin/courses'); if (res.data.code === 200) courseList.value = res.data.data } finally { loading.value = false } }
const fetchSemesters = async () => { loading.value = true; try { const res = await axios.get('/api/admin/semesters'); if (res.data.code === 200) semesterList.value = res.data.data } finally { loading.value = false } }
const fetchLogs = async () => { loading.value = true; try { const res = await axios.get('/api/admin/logs'); if (res.data.code === 200) logList.value = res.data.data } finally { loading.value = false } }
const fetchAllEquipments = async () => { try { const res = await axios.get('/api/admin/equipments'); if (res.data.code === 200) allEquipList.value = res.data.data } catch (e) {} }

const fetchNotices = async () => {
  try {
    const res = await axios.get('/api/notice/list?role=admin')
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

const openPublishDialog = () => { noticeForm.value = { title: '', content: '' }; publishDialogVisible.value = true }

const submitPublish = async () => {
  if (!noticeForm.value.title || !noticeForm.value.content) return ElMessage.warning('标题和内容不能为空')
  try {
    const res = await axios.post('/api/notice/publish', null, {
      params: { title: noticeForm.value.title, content: noticeForm.value.content, publisherName: loginUser ? loginUser.name : '管理员', targetRole: 'all' }
    })
    if (res.data.code === 200) { ElMessage.success('通知发布成功！'); publishDialogVisible.value = false; fetchNotices() }
  } catch (e) { ElMessage.error('发布失败') }
}

// ================= 学生操作 =================
const openAddStudent = () => { newStudent.value = { studentNo: '', name: '', password: '', className: '', major: '' }; studentDialog.value = true }
const submitAddStudent = async () => {
  if (!newStudent.value.studentNo || !newStudent.value.name) return ElMessage.warning('学号和姓名不能为空！')
  const res = await axios.post('/api/admin/student/add', newStudent.value)
  if (res.data.code === 200) { ElMessage.success(res.data.data); studentDialog.value = false; fetchStudents(); fetchLogs() } else { ElMessage.error(res.data.msg) }
}
const deleteStudent = async (no) => { try { await ElMessageBox.confirm('确定删除该学生？', '警告', { type: 'warning' }); const res = await axios.delete(`/api/admin/student/delete?studentNo=${no}`); if (res.data.code === 200) { ElMessage.success('删除成功'); fetchStudents(); fetchLogs() } else { ElMessage.error(res.data.msg) } } catch (e) {} }

// ================= 教师操作 =================
const openAddTeacher = () => { newTeacher.value = { workNo: '', name: '', password: '', department: '', title: '' }; teacherDialog.value = true }
const submitAddTeacher = async () => {
  if (!newTeacher.value.workNo || !newTeacher.value.name) return ElMessage.warning('工号和姓名不能为空！')
  const res = await axios.post('/api/admin/teacher/add', newTeacher.value)
  if (res.data.code === 200) { ElMessage.success(res.data.data); teacherDialog.value = false; fetchTeachers(); fetchLogs() } else { ElMessage.error(res.data.msg) }
}
const deleteTeacher = async (no) => { try { await ElMessageBox.confirm('确定删除该教师？', '警告', { type: 'warning' }); const res = await axios.delete(`/api/admin/teacher/delete?workNo=${no}`); if (res.data.code === 200) { ElMessage.success('删除成功'); fetchTeachers(); fetchLogs() } else { ElMessage.error(res.data.msg) } } catch (e) {} }

// ================= 实验室与设备操作 =================
const openAddLab = () => { newLab.value = { roomNo: '', roomName: '', location: '', capacity: 30 }; labDialog.value = true }
const submitAddLab = async () => {
  if (!newLab.value.roomNo || !newLab.value.roomName) return ElMessage.warning('实验室号和名称不能为空！')
  const res = await axios.post('/api/admin/lab/add', newLab.value)
  if (res.data.code === 200) { ElMessage.success(res.data.data); labDialog.value = false; fetchLabs(); fetchLogs() } else { ElMessage.error(res.data.msg) }
}
const deleteLab = async (no) => { try { await ElMessageBox.confirm('确定删除该实验室？', '警告', { type: 'warning' }); const res = await axios.delete(`/api/admin/lab/delete?roomNo=${no}`); if (res.data.code === 200) { ElMessage.success('删除成功'); fetchLabs(); fetchLogs() } else { ElMessage.error(res.data.msg) } } catch (e) {} }

const openEquipDialog = (lab) => { currentLab.value = lab; fetchAllEquipments(); equipDialog.value = true }
const openAddEquip = () => { newEquip.value = { equipNo: '', equipName: '', model: '', quantity: 1, roomNo: currentLab.value.roomNo }; addEquipDialog.value = true }
const submitAddEquip = async () => {
  if (!newEquip.value.equipNo || !newEquip.value.equipName) return ElMessage.warning('设备号和名称不能为空！')
  const res = await axios.post('/api/admin/equipment/add', newEquip.value)
  if (res.data.code === 200) { ElMessage.success(res.data.data); addEquipDialog.value = false; fetchAllEquipments(); fetchLogs() } else { ElMessage.error(res.data.msg) }
}
const deleteEquip = async (equipNo) => { try { await ElMessageBox.confirm('确定删除该设备？', '警告', { type: 'warning' }); const res = await axios.delete(`/api/admin/equipment/delete?equipNo=${equipNo}`); if (res.data.code === 200) { ElMessage.success('删除成功'); fetchAllEquipments(); fetchLogs() } else { ElMessage.error(res.data.msg) } } catch (e) {} }

// ================= 课程操作 =================
const openAddCourse = () => { newCourse.value = { courseNo: '', courseName: '', credit: 2.0, hours: 32, semester: '' }; courseDialog.value = true }
const submitAddCourse = async () => {
  if (!newCourse.value.courseNo || !newCourse.value.courseName) return ElMessage.warning('课程号和课程名不能为空！')
  const res = await axios.post('/api/admin/course/add', newCourse.value)
  if (res.data.code === 200) { ElMessage.success(res.data.data); courseDialog.value = false; fetchCourses(); fetchLogs() } else { ElMessage.error(res.data.msg) }
}
const deleteCourse = async (no) => { try { await ElMessageBox.confirm('确定删除该课程？', '警告', { type: 'warning' }); const res = await axios.delete(`/api/admin/course/delete?courseNo=${no}`); if (res.data.code === 200) { ElMessage.success('删除成功'); fetchCourses(); fetchLogs() } else { ElMessage.error(res.data.msg) } } catch (e) {} }

// ================= 学期操作 =================
const openAddSemester = () => { newSemester.value = { semesterName: '', startDate: '', totalWeeks: 20 }; semesterDialog.value = true }
const submitAddSemester = async () => {
  if (!newSemester.value.semesterName || !newSemester.value.startDate) return ElMessage.warning('学期名称和开学日期不能为空！')
  const res = await axios.post('/api/admin/semester/add', newSemester.value)
  if (res.data.code === 200) { ElMessage.success(res.data.data); semesterDialog.value = false; fetchSemesters(); fetchLogs() } else { ElMessage.error(res.data.msg) }
}
const deleteSemester = async (name) => { try { await ElMessageBox.confirm('确定删除该学期？可能会导致关联排课失效！', '警告', { type: 'warning' }); const res = await axios.delete(`/api/admin/semester/delete?semesterName=${name}`); if (res.data.code === 200) { ElMessage.success('删除成功'); fetchSemesters(); fetchLogs() } else { ElMessage.error(res.data.msg) } } catch (e) {} }

// ================= 账号安全 =================
const resetPwd = async (account, role) => {
  try {
    await ElMessageBox.confirm(`确定要将该用户的密码强制重置为 123456 吗？`, '提示', { type: 'warning' })
    const res = await axios.post(`/api/admin/reset-password?account=${account}&role=${role}`)
    if (res.data.code === 200) { ElMessage.success(res.data.data); fetchLogs() } else { ElMessage.error(res.data.msg) }
  } catch (e) {}
}

const openPwdDialog = () => { pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }; pwdDialog.value = true }
const submitPwd = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword || !confirmPassword) return ElMessage.warning('请填写完整信息！')
  if (newPassword !== confirmPassword) return ElMessage.warning('两次输入的新密码不一致！')
  const res = await axios.post('/api/admin/update-password', null, { params: { oldPassword, newPassword } })
  if (res.data.code === 200) { ElMessage.success('修改成功，请重新登录！'); pwdDialog.value = false; setTimeout(() => { localStorage.removeItem('loginUser'); router.push('/') }, 1000) } else { ElMessage.error(res.data.msg) }
}

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
  overflow-x: auto; /* 表格内部横向滑动 */
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