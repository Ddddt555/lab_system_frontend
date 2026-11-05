<template>
  <div class="admin-student-panel">
    <div style="margin-bottom: 15px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
      <el-button type="primary" @click="openAddStudent">新增学生</el-button>
      <el-button type="success" @click="downloadTemplate">下载导入模板</el-button>
      <el-upload action="#" :show-file-list="false" :auto-upload="false" :on-change="handleImportExcel" style="display: inline-block;">
        <el-button type="warning">批量导入学生</el-button>
      </el-upload>
      <el-button type="info" @click="openRecycleDialog">学生回收站</el-button>
    </div>
    
    <div class="table-responsive">
      <el-table :data="studentList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="studentNo" label="学号" width="150" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="adminClassName" label="所属行政班" min-width="150" align="center" />
        <el-table-column prop="majorName" label="专业" min-width="150" align="center" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="warning" size="small" @click="resetPwd(scope.row.studentNo, 'student')">重置密码</el-button>
            <el-button type="danger" size="small" @click="deleteStudent(scope.row.studentNo)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-pagination v-model:current-page="studentPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalStudents" @current-change="handlePageChange" @size-change="fetchStudents" style="margin-top: 15px; justify-content: center;" />

    <!-- 新增学生弹窗 -->
    <el-dialog v-model="studentDialog" title="新增学生" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newStudent" label-width="80px">
        <el-form-item label="姓名" required><el-input v-model="newStudent.name" /></el-form-item>
        <el-form-item label="初始密码"><el-input v-model="newStudent.password" type="password" show-password placeholder="不填默认123456" /></el-form-item>
        <el-form-item label="所属班级">
          <el-select v-model="newStudent.adminClassNo" placeholder="请选择行政班" style="width: 100%" clearable>
            <el-option v-for="c in allAdminClasses" :key="c.adminClassNo" :label="c.adminClassName" :value="c.adminClassNo" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="studentDialog = false">取消</el-button><el-button type="primary" @click="submitAddStudent">确认</el-button></template>
    </el-dialog>

    <!-- 学生回收站弹窗 -->
    <el-dialog v-model="recycleDialogVisible" title="学生回收站" :width="isMobile ? '95%' : '700px'">
      <el-empty v-if="deletedStudentList.length === 0" description="回收站为空，没有已删除的学生" />
      <el-table v-else :data="deletedStudentList" border style="width: 100%">
        <el-table-column prop="studentNo" label="学号" width="150" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="adminClassNo" label="行政班号" min-width="150" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="success" size="small" @click="restoreStudent(scope.row.studentNo)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
// 🛑【核心改造】引入统一的窗口大小监听 Hook
import { useWindowSize } from '../composables/useWindowSize'

const emit = defineEmits(['refresh-logs']) // 通知父组件刷新操作日志

// 🛑【核心改造】使用 Hook 监听窗口变化
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const loading = ref(false)
const studentList = ref([])
const totalStudents = ref(0)
const studentPage = ref(1)
const pageSize = ref(10)

const allAdminClasses = ref([])

// 弹窗控制
const studentDialog = ref(false)
const newStudent = ref({ name: '', password: '', adminClassNo: '' })
const recycleDialogVisible = ref(false)
const deletedStudentList = ref([])

onMounted(() => {
  fetchStudents()
  fetchAllAdminClasses()
})

const fetchStudents = async () => { 
  loading.value = true; 
  try { 
    const res = await request.get('/admin/students', { params: { page: studentPage.value, size: pageSize.value } }); 
    if (res.code === 200) { studentList.value = res.data.records; totalStudents.value = res.data.total; } 
  } finally { loading.value = false } 
}

const fetchAllAdminClasses = async () => {
  try {
    const res = await request.get('/admin/admin-classes');
    if (res.code === 200) allAdminClasses.value = res.data;
  } catch (e) {}
}

const handlePageChange = (val) => { studentPage.value = val; fetchStudents(); }

const openAddStudent = () => { newStudent.value = { name: '', password: '', adminClassNo: '' }; studentDialog.value = true }

const submitAddStudent = async () => {
  if (!newStudent.value.name) return ElMessage.warning('姓名不能为空！')
  const res = await request.post('/admin/student/add', newStudent.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    studentDialog.value = false; 
    fetchStudents(); 
    emit('refresh-logs')
  } else { ElMessage.error(res.msg) }
}

const deleteStudent = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该学生？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/student/delete?studentNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchStudents(); 
      emit('refresh-logs')
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}

const resetPwd = async (account, role) => {
  try {
    await ElMessageBox.confirm(`确定要将该用户的密码强制重置为 123456 吗？`, '提示', { type: 'warning' })
    const res = await request.post(`/admin/reset-password?account=${account}&role=${role}`)
    if (res.code === 200) { 
      ElMessage.success(res.data); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) }
  } catch (e) {}
}

const downloadTemplate = () => {
  request.get('/admin/student/import-template', {
    responseType: 'blob'
  }).then(res => {
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '学生导入模板.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功！')
  }).catch(e => {
    console.error(e)
    ElMessage.error('下载模板失败，请检查后端服务')
  })
}

const handleImportExcel = async (file) => {
  const rawFile = file.raw
  if (!rawFile) return
  const formData = new FormData()
  formData.append('file', rawFile)
  try {
    const res = await request.post('/admin/student/import', formData, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    })
    if (res.code === 200) {
      // 🛑 判断是否有失败的行
      if (res.data.includes('失败：0 条')) {
        ElMessage.success(res.data)
      } else {
        // 🛑 有失败行，用弹窗展示，并开启换行渲染
        ElMessageBox.alert(res.data, '导入结果', {
          confirmButtonText: '确定',
          type: 'warning',
          customStyle: { whiteSpace: 'pre-wrap', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto' }
        })
      }
      fetchStudents() 
      fetchAllAdminClasses()
      emit('refresh-logs')
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('导入失败，请检查文件格式！')
  }
}

const openRecycleDialog = async () => {
  recycleDialogVisible.value = true
  fetchDeletedStudents()
}

const fetchDeletedStudents = async () => {
  try {
    const res = await request.get('/admin/student/recycle')
    if (res.code === 200) {
      deletedStudentList.value = res.data
    }
  } catch (e) {
    ElMessage.error('获取回收站数据失败')
  }
}

const restoreStudent = async (studentNo) => {
  try {
    const res = await request.post(`/admin/student/restore?studentNo=${studentNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchDeletedStudents()
      fetchStudents()
      emit('refresh-logs')
    }
  } catch (e) {
    ElMessage.error('恢复失败')
  }
}
</script>

<style scoped>
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
</style>