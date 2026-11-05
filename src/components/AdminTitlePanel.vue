<template>
  <div class="admin-title-panel">
    <div style="margin-bottom: 15px;"><el-button type="primary" @click="titleDialog = true">新增职称</el-button></div>
    <div class="table-responsive">
      <el-table :data="titleList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="titleNo" label="职称号" width="150" align="center" />
        <el-table-column prop="titleName" label="职称名称" min-width="180" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="danger" size="small" @click="deleteTitle(scope.row.titleNo)">删除</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    
    <el-dialog v-model="titleDialog" title="新增职称" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newTitle" label-width="80px">
        <el-form-item label="职称名称" required><el-input v-model="newTitle.titleName" placeholder="如：高级工程师" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="titleDialog = false">取消</el-button><el-button type="primary" @click="submitAddTitle">确认</el-button></template>
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
const titleList = ref([])
const titleDialog = ref(false)
const newTitle = ref({ titleName: '' })

onMounted(() => { fetchTitles() })

const fetchTitles = async () => { 
  loading.value = true
  try { 
    const res = await request.get('/admin/titles'); 
    if (res.code === 200) titleList.value = res.data 
  } finally { loading.value = false } 
}

const submitAddTitle = async () => {
  if (!newTitle.value.titleName) return ElMessage.warning('请输入职称名称')
  const res = await request.post('/admin/title/add', newTitle.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    titleDialog.value = false; 
    fetchTitles(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}

const deleteTitle = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该职称？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/title/delete?titleNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchTitles(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
</style>
