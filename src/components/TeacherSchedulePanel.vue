<template>
  <div class="teacher-schedule-panel">
    <div style="margin-bottom: 15px">
      <el-button type="primary" @click="openAddSession">安排新场次</el-button>
    </div>
    <div class="table-responsive">
      <el-table v-loading="loading" :data="sessionList" border style="width: 100%">
        <el-table-column prop="sessionNo" label="场次号" width="120" align="center" />
        <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
        <el-table-column label="上课时间" align="center" min-width="180">
          <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
        </el-table-column>
        <el-table-column prop="capacity" label="总容量" width="100" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="danger" size="small" @click="deleteSession(scope.row.sessionNo)"
              >取消排课</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="sessionPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalSessions"
      style="margin-top: 15px; justify-content: center"
      @current-change="handlePageChange"
      @size-change="fetchSessions"
    />

    <!-- 安排新场次弹窗 -->
    <el-dialog v-model="sessionDialog" title="安排实验场次" :width="isMobile ? '95%' : '500px'">
      <el-form :model="newSession" label-width="80px">
        <el-form-item label="实验项目" required>
          <el-select v-model="newSession.projectNo" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="p in allProjects"
              :key="p.projectNo"
              :label="p.projectNo + ' - ' + p.projectName"
              :value="p.projectNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实验室" required>
          <el-select
            v-model="newSession.roomNo"
            placeholder="请选择实验室"
            style="width: 100%"
            @change="handleLabChange"
          >
            <el-option
              v-for="r in labOptions"
              :key="r.roomNo"
              :label="r.roomNo + ' - ' + r.roomName"
              :value="r.roomNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="newSession.semester" style="width: 100%" placeholder="请选择学期">
            <el-option
              v-for="s in semesterOptions"
              :key="s.semesterName"
              :label="s.semesterName"
              :value="s.semesterName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="周次" required
          ><el-input-number v-model="newSession.weekNum" :min="1" :max="30" /><span
            style="margin-left: 10px; color: gray"
            >周</span
          ></el-form-item
        >
        <el-form-item label="星期" required>
          <el-select v-model="newSession.dayOfWeek" style="width: 100%">
            <el-option label="星期一" :value="1" /><el-option label="星期二" :value="2" /><el-option
              label="星期三"
              :value="3"
            />
            <el-option label="星期四" :value="4" /><el-option label="星期五" :value="5" /><el-option
              label="星期六"
              :value="6"
            /><el-option label="星期日" :value="7" />
          </el-select>
        </el-form-item>
        <el-form-item label="节次" required>
          <el-select v-model="newSession.period" style="width: 100%">
            <el-option label="1-2节 (08:00)" value="1-2节" /><el-option
              label="3-4节 (10:00)"
              value="3-4节"
            />
            <el-option label="5-6节 (14:00)" value="5-6节" /><el-option
              label="7-8节 (16:00)"
              value="7-8节"
            /><el-option label="9-10节 (19:00)" value="9-10节" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量(机位)" required>
          <el-input-number v-model="newSession.capacity" :min="1" :max="selectedLabCapacity" />
        </el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="sessionDialog = false">取消</el-button
        ><el-button type="primary" @click="submitAddSession">确认排课</el-button></template
      >
    </el-dialog>
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const emit = defineEmits(['success']) // 通知父组件刷新或其他操作

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const sessionList = ref([])
const sessionPage = ref(1)
const pageSize = ref(10)
const totalSessions = ref(0)

// 下拉框数据
const allProjects = ref([])
const labOptions = ref([])
const semesterOptions = ref([])

// 弹窗表单
const sessionDialog = ref(false)
const newSession = ref({
  projectNo: '',
  roomNo: '',
  semester: '',
  weekNum: 1,
  dayOfWeek: 1,
  period: '1-2节',
  capacity: 50
})
const selectedLabCapacity = ref(100)

onMounted(() => {
  fetchSessions()
  fetchAllProjects()
  fetchLabs()
  fetchSemesters()
})

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await request.get('/teacher/my-sessions', {
      params: { page: sessionPage.value, size: pageSize.value }
    })
    if (res.code === 200) {
      sessionList.value = res.data.records
      totalSessions.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const fetchAllProjects = async () => {
  try {
    const res = await request.get('/teacher/project/list')
    if (res.code === 200) allProjects.value = res.data
  } catch (e) {}
}

const fetchLabs = async () => {
  try {
    const res = await request.get('/teacher/labs')
    if (res.code === 200) labOptions.value = res.data
  } catch (e) {}
}

const fetchSemesters = async () => {
  try {
    const res = await request.get('/teacher/semesters')
    if (res.code === 200) {
      semesterOptions.value = res.data
      if (semesterOptions.value.length > 0 && !newSession.value.semester)
        newSession.value.semester = semesterOptions.value[0].semesterName
    }
  } catch (e) {}
}

const handlePageChange = (val) => {
  sessionPage.value = val
  fetchSessions()
}
const formatTeachingTime = (row) => {
  if (!row || !row.semester) return ''
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`
}

const handleLabChange = (roomNo) => {
  const lab = labOptions.value.find((r) => r.roomNo === roomNo)
  if (lab) {
    selectedLabCapacity.value = lab.capacity
    if (newSession.value.capacity > lab.capacity) newSession.value.capacity = lab.capacity
  }
}

const openAddSession = () => {
  newSession.value = {
    projectNo: '',
    roomNo: '',
    semester: semesterOptions.value.length > 0 ? semesterOptions.value[0].semesterName : '',
    weekNum: 1,
    dayOfWeek: 1,
    period: '1-2节',
    capacity: 50
  }
  selectedLabCapacity.value = 100
  sessionDialog.value = true
}

const submitAddSession = async () => {
  if (
    !newSession.value.projectNo ||
    !newSession.value.roomNo ||
    !newSession.value.period ||
    !newSession.value.semester
  )
    return ElMessage.warning('请填写完整信息！')
  try {
    const res = await request.post('/teacher/session/add', newSession.value)
    if (res.code === 200) {
      ElMessage.success(res.data)
      sessionDialog.value = false
      fetchSessions()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    ElMessage.error('排课失败！')
  }
}

const deleteSession = async (sessionNo) => {
  try {
    await ElMessageBox.confirm('确定要取消该场次的排课吗？', '警告', { type: 'warning' })
    const res = await request.delete(`/teacher/session/delete?sessionNo=${sessionNo}`)
    if (res.code === 200) {
      ElMessage.success('已取消排课！')
      fetchSessions()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {}
}
</script>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
