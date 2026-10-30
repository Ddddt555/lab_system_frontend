<template>
  <div class="admin-class-panel">
    <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddAdminClass">新增行政班</el-button></div>
    <div class="table-responsive">
      <el-table :data="adminClassList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="adminClassNo" label="班级号" width="150" align="center" />
        <el-table-column prop="adminClassName" label="班级名称" min-width="180" align="center" />
        <el-table-column prop="majorName" label="所属专业" min-width="180" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="danger" size="small" @click="deleteAdminClass(scope.row.adminClassNo)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-model:current-page="adminClassPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalAdminClasses" @current-change="handlePageChange" @size-change="fetchAdminClasses" style="margin-top: 15px; justify-content: center;" />

    <el-dialog v-model="adminClassDialog" title="新增行政班" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newAdminClass" label-width="80px">
        <el-form-item label="所属专业" required>
          <el-select v-model="newAdminClass.majorNo" placeholder="请选择专业" style="width: 100%">
            <el-option v-for="m in allMajors" :key="m.majorNo" :label="m.majorName" :value="m.majorNo" />
          </el-select>
        </el-form-item>
        <el-form-item label="入学年份" required><el-input-number v-model="newAdminClass.enrollmentYear" :min="2000" :max="2100" style="width: 100%" /></el-form-item>
        <el-form-item label="班级序号" required><el-input-number v-model="newAdminClass.classSeq" :min="1" :max="99" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="adminClassDialog = false">取消</el-button><el-button type="primary" @click="submitAddAdminClass">确认</el-button></template>
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
const adminClassList = ref([])
const totalAdminClasses = ref(0)
const adminClassPage = ref(1)
const pageSize = ref(10)
const allMajors = ref([])

const adminClassDialog = ref(false)
const newAdminClass = ref({ majorNo: '', enrollmentYear: new Date().getFullYear(), classSeq: 1 })

onMounted(() => { fetchAdminClasses(); fetchAllMajors() })

const fetchAdminClasses = async () => { 
  loading.value = true
  try { 
    const res = await request.get('/admin/admin-classes', { params: { page: adminClassPage.value, size: pageSize.value } }); 
    if (res.code === 200) { adminClassList.value = res.data.records; totalAdminClasses.value = res.data.total; } 
  } finally { loading.value = false } 
}
const fetchAllMajors = async () => { try { const res = await request.get('/admin/majors'); if (res.code === 200) allMajors.value = res.data } catch (e) {} }
const handlePageChange = (val) => { adminClassPage.value = val; fetchAdminClasses(); }

const openAddAdminClass = () => { 
  newAdminClass.value = { majorNo: '', enrollmentYear: new Date().getFullYear(), classSeq: 1 }; 
  adminClassDialog.value = true 
}
const submitAddAdminClass = async () => {
  if (!newAdminClass.value.majorNo) return ElMessage.warning('请选择所属专业')
  if (!newAdminClass.value.enrollmentYear || !newAdminClass.value.classSeq) return ElMessage.warning('请填写年份和班级序号')
  const res = await request.post('/admin/admin-class/add', newAdminClass.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    adminClassDialog.value = false; 
    fetchAdminClasses(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}
const deleteAdminClass = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该行政班？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/admin-class/delete?adminClassNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchAdminClasses(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
</style>