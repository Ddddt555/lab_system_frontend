<template>
  <div class="admin-lab-panel">
    <div style="margin-bottom: 15px;"><el-button type="primary" @click="openAddLab">新增实验室</el-button></div>
    <div class="table-responsive">
      <el-table :data="labList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="roomNo" label="实验室号" width="120" align="center" />
        <el-table-column prop="roomName" label="实验室名称" min-width="180" align="center" />
        <el-table-column prop="location" label="位置" min-width="150" align="center" />
        <el-table-column prop="capacity" label="容量" width="100" align="center" />
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" size="small" plain @click="openEquipDialog(scope.row)">设备管理</el-button>
            <el-button type="danger" size="small" @click="deleteLab(scope.row.roomNo)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-model:current-page="labPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalLabs" @current-change="handlePageChange" @size-change="fetchLabs" style="margin-top: 15px; justify-content: center;" />

    <!-- 新增实验室 -->
    <el-dialog v-model="labDialog" title="新增实验室" :width="isMobile ? '95%' : '400px'">
      <el-form :model="newLab" label-width="100px">
        <el-form-item label="实验室名称" required><el-input v-model="newLab.roomName" /></el-form-item>
        <el-form-item label="位置"><el-input v-model="newLab.location" /></el-form-item>
        <el-form-item label="容量(机位)"><el-input-number v-model="newLab.capacity" :min="1" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="labDialog = false">取消</el-button><el-button type="primary" @click="submitAddLab">确认</el-button></template>
    </el-dialog>

    <!-- 设备管理 -->
    <el-dialog v-model="equipDialog" :title="'管理设备 - ' + (currentLab ? currentLab.roomName : '')" :width="isMobile ? '95%' : '600px'">
      <div style="margin-bottom: 15px; text-align: right;">
        <el-button type="primary" size="small" @click="openAddEquip">新增设备</el-button>
      </div>
      <div class="table-responsive">
        <el-table :data="currentLabEquipList" border style="width: 100%">
          <el-table-column prop="equipNo" label="设备号" width="120" align="center" />
          <el-table-column prop="equipName" label="设备名称" min-width="150" align="center" />
          <el-table-column prop="model" label="型号" min-width="120" align="center" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="scope"><el-button type="danger" size="small" @click="deleteEquip(scope.row.equipNo)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="addEquipDialog" title="新增设备" :width="isMobile ? '95%' : '400px'" append-to-body>
      <el-form :model="newEquip" label-width="100px">
        <el-form-item label="设备名称" required><el-input v-model="newEquip.equipName" /></el-form-item>
        <el-form-item label="型号"><el-input v-model="newEquip.model" /></el-form-item>
        <el-form-item label="数量"><el-input-number v-model="newEquip.quantity" :min="1" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="addEquipDialog = false">取消</el-button><el-button type="primary" @click="submitAddEquip">确认</el-button></template>
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
const labList = ref([])
const totalLabs = ref(0)
const labPage = ref(1)
const pageSize = ref(10)

const allEquipList = ref([])
const labDialog = ref(false)
const newLab = ref({ roomName: '', location: '', capacity: 30 })
const equipDialog = ref(false)
const addEquipDialog = ref(false)
const currentLab = ref(null)
const newEquip = ref({ equipName: '', model: '', quantity: 1, roomNo: '' })

const currentLabEquipList = computed(() => {
  if (!currentLab.value) return []
  return allEquipList.value.filter(e => e.roomNo === currentLab.value.roomNo)
})

onMounted(() => { fetchLabs() })

const fetchLabs = async () => { 
  loading.value = true; 
  try { 
    const res = await request.get('/admin/labs', { params: { page: labPage.value, size: pageSize.value } }); 
    if (res.code === 200) { labList.value = res.data.records; totalLabs.value = res.data.total; } 
  } finally { loading.value = false } 
}
const handlePageChange = (val) => { labPage.value = val; fetchLabs(); }

const openAddLab = () => { newLab.value = { roomName: '', location: '', capacity: 30 }; labDialog.value = true }
const submitAddLab = async () => {
  if (!newLab.value.roomName) return ElMessage.warning('实验室名称不能为空！')
  const res = await request.post('/admin/lab/add', newLab.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    labDialog.value = false; 
    fetchLabs(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}
const deleteLab = async (no) => { 
  try { 
    await ElMessageBox.confirm('确定删除该实验室？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/lab/delete?roomNo=${no}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchLabs(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}

const fetchAllEquipments = async () => { try { const res = await request.get('/admin/equipments'); if (res.code === 200) allEquipList.value = res.data } catch (e) {} }
const openEquipDialog = (lab) => { currentLab.value = lab; fetchAllEquipments(); equipDialog.value = true }
const openAddEquip = () => { newEquip.value = { equipName: '', model: '', quantity: 1, roomNo: currentLab.value.roomNo }; addEquipDialog.value = true }
const submitAddEquip = async () => {
  if (!newEquip.value.equipName) return ElMessage.warning('设备名称不能为空！')
  const res = await request.post('/admin/equipment/add', newEquip.value)
  if (res.code === 200) { 
    ElMessage.success(res.data); 
    addEquipDialog.value = false; 
    fetchAllEquipments(); 
    emit('refresh-logs') 
  } else { ElMessage.error(res.msg) }
}
const deleteEquip = async (equipNo) => { 
  try { 
    await ElMessageBox.confirm('确定删除该设备？', '警告', { type: 'warning' }); 
    const res = await request.delete(`/admin/equipment/delete?equipNo=${equipNo}`); 
    if (res.code === 200) { 
      ElMessage.success('删除成功'); 
      fetchAllEquipments(); 
      emit('refresh-logs') 
    } else { ElMessage.error(res.msg) } 
  } catch (e) {} 
}
</script>
<style scoped>
.table-responsive { width: 100%; overflow-x: auto; }
</style>
