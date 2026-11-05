<template>
  <div class="admin-major-panel">
    <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddMajor">新增专业</el-button></div>
    <div class="table-responsive">
      <el-table :data="majorList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="majorNo" label="专业号" width="150" align="center" />
        <el-table-column prop="majorName" label="专业名称" min-width="180" align="center" />
        <el-table-column prop="deptName" label="所属院系" min-width="180" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="danger" size="small" @click="deleteMajor(scope.row.majorNo)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-model:current-page="majorPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalMajors" @current-change="handlePageChange" @size-change="fetchMajors" style="margin-top: 15px; justify-content: center;" />

    <el-dialog v-model="majorDialog" title="新增专业" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newMajor" label-width="80px">
        <el-form-item label="专业名称" required><el-input v-model="newMajor.majorName" /></el-form-item>
        <el-form-item label="所属院系" required>
          <el-select v-model="newMajor.deptNo" placeholder="请选择院系" style="width: 100%">
            <el-option v-for="d in deptList" :key="d.deptNo" :label="d.deptName" :value="d.deptNo" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="majorDialog = false">取消</el-button><el-button type="primary" @click="submitAddMajor">确认</el-button></template>
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
const majorList = ref([])
const totalMajors = ref(0)
const majorPage = ref(1)
const pageSize = ref(10)
const deptList = ref([])

const majorDialog = ref(false)
const newMajor = ref({ majorName: '', deptNo: '' })

onMounted(() => { fetchMajors(); fetchDepts() })

const fetchMajors = async () => { 
  loading.value = true
  try { 
    const res = await request.get('/admin/majors', { params: { page: majorPage.value, size: pageSize.value } }); 
    if (res.code === 200) { majorList.value = res.data.records; totalMajors.value = res.data.total; } 
  } finally { loading.value = false } 
}
const fetchDepts = async () => { try { const res = await request.get('/admin/departments'); if (res.code === 200) deptList.value = res.data } catch (e) {} }
const handlePageChange = (val) => { majorPage.value = val; fetchMajors(); }

const openAddMajor = () => { newMajor.value = { majorName: '', deptNo: '' }; majorDialog.value = true }
const submitAddMajor = async () => {
  if (!newMajor.value.majorName || !newMajor.value.deptNo) return ElMessage.warning('请填写完整信息')
  const res = await request.post('/admin/major/add', newMajor.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    majorDialog.value = false; 
    fetchMajors(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}
const deleteMajor = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该专业？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/major/delete?majorNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchMajors(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
</style>
