<template>
  <div class="admin-course-panel">
    <div style="margin-bottom: 15px">
      <el-button type="primary" @click="openAddCourse">新增课程</el-button>
    </div>
    <div class="table-responsive">
      <el-table v-loading="loading" :data="courseList" border style="width: 100%">
        <el-table-column prop="courseNo" label="课程号" width="150" align="center" />
        <el-table-column prop="courseName" label="课程名" min-width="180" align="center" />
        <el-table-column prop="credit" label="学分" width="100" align="center" />
        <el-table-column prop="hours" label="学时" width="100" align="center" />
        <el-table-column prop="semester" label="学期" min-width="150" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"
            ><el-button type="danger" size="small" @click="deleteCourse(scope.row.courseNo)"
              >删除</el-button
            ></template
          >
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="coursePage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalCourses"
      style="margin-top: 15px; justify-content: center"
      @current-change="handlePageChange"
      @size-change="fetchCourses"
    />

    <el-dialog v-model="courseDialog" title="新增课程" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newCourse" label-width="80px">
        <el-form-item label="课程名" required
          ><el-input v-model="newCourse.courseName"
        /></el-form-item>
        <el-form-item label="学分"
          ><el-input-number v-model="newCourse.credit" :min="0.5" :step="0.5"
        /></el-form-item>
        <el-form-item label="学时"
          ><el-input-number v-model="newCourse.hours" :min="1"
        /></el-form-item>
        <el-form-item label="学期" required>
          <el-select v-model="newCourse.semester" placeholder="请选择学期" style="width: 100%">
            <el-option
              v-for="s in allSemesters"
              :key="s.semesterName"
              :label="s.semesterName"
              :value="s.semesterName"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="courseDialog = false">取消</el-button
        ><el-button type="primary" @click="submitAddCourse">确认</el-button></template
      >
    </el-dialog>
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const emit = defineEmits(['refresh-logs'])
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const courseList = ref([])
const totalCourses = ref(0)
const coursePage = ref(1)
const pageSize = ref(10)
const allSemesters = ref([])

const courseDialog = ref(false)
const newCourse = ref({ courseName: '', credit: 2.0, hours: 32, semester: '' })

onMounted(() => {
  fetchCourses()
  fetchSemesters()
})

const fetchCourses = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/courses', {
      params: { page: coursePage.value, size: pageSize.value }
    })
    if (res.code === 200) {
      courseList.value = res.data.records
      totalCourses.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}
const fetchSemesters = async () => {
  try {
    const res = await request.get('/admin/semesters')
    if (res.code === 200) allSemesters.value = res.data
  } catch (e) {}
}
const handlePageChange = (val) => {
  coursePage.value = val
  fetchCourses()
}

const openAddCourse = () => {
  newCourse.value = { courseName: '', credit: 2.0, hours: 32, semester: '' }
  courseDialog.value = true
}
const submitAddCourse = async () => {
  if (!newCourse.value.courseName) return ElMessage.warning('课程名不能为空！')
  if (!newCourse.value.semester) return ElMessage.warning('请选择开课学期！')
  const res = await request.post('/admin/course/add', newCourse.value)
  if (res.code === 200) {
    ElMessage.success(res.data)
    courseDialog.value = false
    fetchCourses()
    emit('refresh-logs')
  } else {
    ElMessage.error(res.msg)
  }
}
const deleteCourse = async (no) => {
  try {
    await ElMessageBox.confirm('确定删除该课程？', '警告', { type: 'warning' })
    const res = await request.delete(`/admin/course/delete?courseNo=${no}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchCourses()
      emit('refresh-logs')
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
}
</style>
