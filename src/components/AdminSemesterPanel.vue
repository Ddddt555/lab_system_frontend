<template>
  <div class="admin-semester-panel">
    <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddSemester">新增学期配置</el-button></div>
    <div class="table-responsive">
      <el-table :data="semesterList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="semesterName" label="学期名称" min-width="180" align="center" />
        <el-table-column prop="startDate" label="开学第一周(周一)" min-width="180" align="center" />
        <el-table-column prop="totalWeeks" label="总周数" width="120" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="danger" size="small" @click="deleteSemester(scope.row.semesterName)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-model:current-page="semesterPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalSemesters" @current-change="handlePageChange" @size-change="fetchSemesters" style="margin-top: 15px; justify-content: center;" />

    <el-dialog v-model="semesterDialog" title="新增学期配置" :width="isMobile ? '95%' : '450px'">
      <el-form :model="newSemester" label-width="120px">
        <el-form-item label="学期名称" required><el-input v-model="newSemester.semesterName" placeholder="如：2026-2027 上学期" /></el-form-item>
        <el-form-item label="开学第一周" required><el-date-picker v-model="newSemester.startDate" type="date" placeholder="选择日期" format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="总周数"><el-input-number v-model="newSemester.totalWeeks" :min="1" :max="30" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="semesterDialog = false">取消</el-button><el-button type="primary" @click="submitAddSemester">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const emit = defineEmits(['refresh-logs'])
const isMobile = computed(() => window.innerWidth < 768)
const loading = ref(false)
const semesterList = ref([])
const totalSemesters = ref(0)
const semesterPage = ref(1)
const pageSize = ref(10)
const semesterDialog = ref(false)
const newSemester = ref({ semesterName: '', startDate: '', totalWeeks: 20 })

onMounted(() => { fetchSemesters() })

const fetchSemesters = async () => { 
  loading.value = true; 
  try { 
    const res = await request.get('/admin/semesters', { params: { page: semesterPage.value, size: pageSize.value } }); 
    if (res.code === 200) { semesterList.value = res.data.records; totalSemesters.value = res.data.total; } 
  } finally { loading.value = false } 
}
const handlePageChange = (val) => { semesterPage.value = val; fetchSemesters(); }

const openAddSemester = () => { newSemester.value = { semesterName: '', startDate: '', totalWeeks: 20 }; semesterDialog.value = true }
const submitAddSemester = async () => {
  if (!newSemester.value.semesterName || !newSemester.value.startDate) return ElMessage.warning('学期名称和开学日期不能为空！')
  const res = await request.post('/admin/semester/add', newSemester.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    semesterDialog.value = false; 
    fetchSemesters(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}
const deleteSemester = async (name) => { 
  try { 
    await ElMessageBox.confirm('确定删除该学期？可能会导致关联排课失效！', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/semester/delete?semesterName=${name}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchSemesters(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
</style>