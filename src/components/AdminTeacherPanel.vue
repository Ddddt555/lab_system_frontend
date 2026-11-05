<template>
  <div class="admin-teacher-panel">
    <div style="margin-bottom: 15px; display: flex; gap: 10px;">
      <el-button type="primary" @click="openAddTeacher">新增教师</el-button>
      <el-button type="info" @click="openRecycleDialog">教师回收站</el-button>
    </div>
    
    <div class="table-responsive">
      <el-table :data="teacherList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="workNo" label="工号" width="150" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="deptName" label="所属院系" min-width="180" align="center" />
        <el-table-column prop="titleName" label="职称" width="120" align="center" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="warning" size="small" @click="resetPwd(scope.row.workNo)">重置密码</el-button>
            <el-button type="danger" size="small" @click="deleteTeacher(scope.row.workNo)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-pagination v-model:current-page="teacherPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalTeachers" @current-change="handlePageChange" @size-change="fetchTeachers" style="margin-top: 15px; justify-content: center;" />

    <!-- 新增教师弹窗 -->
    <el-dialog v-model="teacherDialog" title="新增教师" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newTeacher" label-width="80px">
        <el-form-item label="姓名" required><el-input v-model="newTeacher.name" /></el-form-item>
        <el-form-item label="初始密码"><el-input v-model="newTeacher.password" type="password" show-password placeholder="不填默认123456" /></el-form-item>
        <el-form-item label="所属院系">
          <el-select v-model="newTeacher.deptNo" placeholder="请选择院系" style="width: 100%">
            <el-option v-for="d in deptList" :key="d.deptNo" :label="d.deptName" :value="d.deptNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="职称">
          <el-select v-model="newTeacher.titleNo" placeholder="请选择职称" style="width: 100%">
            <el-option v-for="t in titleList" :key="t.titleNo" :label="t.titleName" :value="t.titleNo" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="teacherDialog = false">取消</el-button><el-button type="primary" @click="submitAddTeacher">确认</el-button></template>
    </el-dialog>

    <!-- 教师回收站弹窗 -->
    <el-dialog v-model="recycleDialogVisible" title="教师回收站" :width="isMobile ? '95%' : '700px'">
      <el-empty v-if="deletedTeacherList.length === 0" description="回收站为空，没有已删除的教师" />
      <el-table v-else :data="deletedTeacherList" border style="width: 100%">
        <el-table-column prop="workNo" label="工号" width="150" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="deptNo" label="院系号" min-width="150" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button type="success" size="small" @click="restoreTeacher(scope.row.workNo)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
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
const teacherList = ref([])
const totalTeachers = ref(0)
const teacherPage = ref(1)
const pageSize = ref(10)

const deptList = ref([])
const titleList = ref([])

const teacherDialog = ref(false)
const newTeacher = ref({ name: '', password: '', deptNo: '', titleNo: '' })

const recycleDialogVisible = ref(false)
const deletedTeacherList = ref([])

onMounted(() => {
  fetchTeachers()
  fetchDropdownData()
})

const fetchTeachers = async () => { 
  loading.value = true; 
  try { 
    const res = await request.get('/admin/teachers', { params: { page: teacherPage.value, size: pageSize.value } }); 
    if (res.code === 200) { teacherList.value = res.data.records; totalTeachers.value = res.data.total; } 
  } finally { loading.value = false } 
}

const fetchDropdownData = async () => {
  try {
    const resDepts = await request.get('/admin/departments');
    if (resDepts.code === 200) deptList.value = resDepts.data;
    const resTitles = await request.get('/admin/titles');
    if (resTitles.code === 200) titleList.value = resTitles.data;
  } catch (e) {}
}

const handlePageChange = (val) => { teacherPage.value = val; fetchTeachers(); }

const openAddTeacher = () => { newTeacher.value = { name: '', password: '', deptNo: '', titleNo: '' }; teacherDialog.value = true }

const submitAddTeacher = async () => {
  if (!newTeacher.value.name) return ElMessage.warning('姓名不能为空！')
  const res = await request.post('/admin/teacher/add', newTeacher.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    teacherDialog.value = false; 
    fetchTeachers(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}

const deleteTeacher = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该教师？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/teacher/delete?workNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchTeachers(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}

const resetPwd = async (account) => {
  try {
    await ElMessageBox.confirm(`确定要将该教师的密码强制重置为 123456 吗？`, '提示', { type: 'warning' })
    const res = await request.post(`/admin/reset-password?account=${account}&role=teacher`)
    if (res.code === 200) { 
      ElMessage.success(res.data); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) }
  } catch (e) {}
}

const openRecycleDialog = () => {
  recycleDialogVisible.value = true
  fetchDeletedTeachers()
}

const fetchDeletedTeachers = async () => {
  try {
    const res = await request.get('/admin/teacher/recycle')
    if (res.code === 200) deletedTeacherList.value = res.data
  } catch (e) { ElMessage.error('获取回收站数据失败') }
}

const restoreTeacher = async (workNo) => {
  try {
    const res = await request.post(`/admin/teacher/restore?workNo=${workNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchDeletedTeachers()
      fetchTeachers()
      emit('refresh-logs')
    }
  } catch (e) { ElMessage.error('恢复失败') }
}
</script>

<style scoped>
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
</style>
