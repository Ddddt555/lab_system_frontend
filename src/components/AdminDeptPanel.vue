<template>
  <div class="admin-dept-panel">
    <div style="margin-bottom: 15px;"><el-button type="primary" @click="deptDialog = true">新增院系</el-button></div>
    <div class="table-responsive">
      <el-table :data="deptList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="deptNo" label="院系号" width="150" align="center" />
        <el-table-column prop="deptName" label="院系名称" min-width="180" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="danger" size="small" @click="deleteDept(scope.row.deptNo)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-dialog v-model="deptDialog" title="新增院系" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newDept" label-width="80px">
        <el-form-item label="院系名称" required><el-input v-model="newDept.deptName" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="deptDialog = false">取消</el-button><el-button type="primary" @click="submitAddDept">确认</el-button></template>
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
const deptList = ref([])
const deptDialog = ref(false)
const newDept = ref({ deptName: '' })

onMounted(() => { fetchDepts() })

const fetchDepts = async () => { 
  loading.value = true
  try { 
    const res = await request.get('/admin/departments'); 
    if (res.code === 200) deptList.value = res.data 
  } finally { loading.value = false } 
}

const submitAddDept = async () => {
  if (!newDept.value.deptName) return ElMessage.warning('请输入院系名称')
  const res = await request.post('/admin/department/add', newDept.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    deptDialog.value = false; 
    fetchDepts(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}

const deleteDept = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该院系？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/department/delete?deptNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchDepts(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
</style>
