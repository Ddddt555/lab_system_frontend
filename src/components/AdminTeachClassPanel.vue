<template>
  <div class="admin-teach-class-panel">
    <div style="margin-bottom: 15px">
      <el-button type="primary" @click="openAddTeachClass">新增教学班</el-button>
    </div>
    <div class="table-responsive">
      <el-table v-loading="loading" :data="teachClassList" border style="width: 100%">
        <el-table-column prop="classNo" label="教学班号" width="150" align="center" />
        <el-table-column prop="courseName" label="所属课程" min-width="180" align="center" />
        <el-table-column prop="teacherName" label="任课教师" width="150" align="center" />
        <el-table-column prop="semester" label="开课学期" min-width="150" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="danger" size="small" @click="deleteTeachClass(scope.row.classNo)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="teachClassPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalTeachClasses"
      style="margin-top: 15px; justify-content: center"
      @current-change="handlePageChange"
      @size-change="fetchTeachClasses"
    />

    <el-dialog v-model="teachClassDialog" title="新增教学班" :width="isMobile ? '95%' : '500px'">
      <el-form :model="newTeachClass" label-width="100px">
        <el-form-item label="所属课程" required>
          <el-select v-model="newTeachClass.courseNo" placeholder="请选择课程" style="width: 100%">
            <el-option
              v-for="c in allCourses"
              :key="c.courseNo"
              :label="c.courseNo + ' - ' + c.courseName"
              :value="c.courseNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任课教师" required>
          <el-select v-model="newTeachClass.workNo" placeholder="请选择教师" style="width: 100%">
            <el-option
              v-for="t in allTeachers"
              :key="t.workNo"
              :label="t.workNo + ' - ' + t.name"
              :value="t.workNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开课学期" required>
          <el-select v-model="newTeachClass.semester" placeholder="请选择学期" style="width: 100%">
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
        ><el-button @click="teachClassDialog = false">取消</el-button
        ><el-button type="primary" @click="submitAddTeachClass">确认</el-button></template
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
const teachClassList = ref([])
const totalTeachClasses = ref(0)
const teachClassPage = ref(1)
const pageSize = ref(10)

const allCourses = ref([])
const allTeachers = ref([])
const allSemesters = ref([])

const teachClassDialog = ref(false)
const newTeachClass = ref({ courseNo: '', workNo: '', semester: '' })

onMounted(() => {
  fetchTeachClasses()
  fetchDropdownData()
})

const fetchTeachClasses = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/teach-classes', {
      params: { page: teachClassPage.value, size: pageSize.value }
    })
    if (res.code === 200) {
      teachClassList.value = res.data.records
      totalTeachClasses.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const fetchDropdownData = async () => {
  try {
    const [resCourses, resTeachers, resSemesters] = await Promise.all([
      request.get('/admin/courses'),
      request.get('/admin/teachers'),
      request.get('/admin/semesters')
    ])
    if (resCourses.code === 200) allCourses.value = resCourses.data
    if (resTeachers.code === 200) allTeachers.value = resTeachers.data
    if (resSemesters.code === 200) allSemesters.value = resSemesters.data
  } catch (e) {}
}

const handlePageChange = (val) => {
  teachClassPage.value = val
  fetchTeachClasses()
}

const openAddTeachClass = () => {
  newTeachClass.value = { courseNo: '', workNo: '', semester: '' }
  teachClassDialog.value = true
}
const submitAddTeachClass = async () => {
  if (
    !newTeachClass.value.courseNo ||
    !newTeachClass.value.workNo ||
    !newTeachClass.value.semester
  ) {
    return ElMessage.warning('请填写完整信息！')
  }
  try {
    const res = await request.post('/admin/teach-class/add', newTeachClass.value)
    if (res.code === 200) {
      ElMessage.success(res.data)
      teachClassDialog.value = false
      fetchTeachClasses()
      emit('refresh-logs')
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('保存失败')
  }
}
const deleteTeachClass = async (classNo) => {
  try {
    await ElMessageBox.confirm('确定删除该教学班？删除后相关的排课和成绩将可能失效！', '警告', {
      type: 'warning'
    })
    const res = await request.delete(`/admin/teach-class/delete?classNo=${classNo}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchTeachClasses()
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
