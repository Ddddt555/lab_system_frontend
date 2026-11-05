<template>
  <div class="teacher-score-panel">
    <div style="margin-bottom: 15px; display: flex; align-items: center; gap: 15px;">
      <el-select v-model="selectedClassNo" placeholder="请选择教学班" :style="{ width: isMobile ? '100%' : '300px' }" @change="handleClassChange">
        <el-option v-for="c in myClassOptions" :key="c.classNo" :label="c.displayName" :value="c.classNo" />
      </el-select>
      <el-button type="warning" v-if="selectedClassNo" @click="openWeightDialog">权重设置</el-button>
      <el-button type="success" v-if="selectedClassNo" @click="exportScores">导出成绩单</el-button>
    </div>
    <div class="table-responsive">
      <el-table :data="scoreList" border style="width: 100%" v-loading="loading" v-if="selectedClassNo">
        <el-table-column prop="studentNo" label="学号" width="150" align="center" />
        <el-table-column prop="teacherName" label="姓名" width="100" align="center" />
        <el-table-column :label="`平时成绩 (${currentDailyWeight}%)`" width="150" align="center">
          <template #default="scope"><el-input-number v-model="scope.row.score" :min="0" :max="100" size="small" /></template>
        </el-table-column>
        <el-table-column :label="`报告均分 (${currentReportWeight}%)`" width="120" align="center">
          <template #default="scope"><span style="color: #409EFF; font-weight: bold;">{{ scope.row.reportScore }}</span></template>
        </el-table-column>
        <el-table-column label="总评成绩" width="120" align="center">
          <template #default="scope"><span style="color: red; font-weight: bold; font-size: 16px;">{{ scope.row.totalScore }}</span></template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope"><el-button type="primary" size="small" @click="saveScore(scope.row.studentNo)">保存</el-button></template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination v-if="selectedClassNo" v-model:current-page="scorePage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalScores" @current-change="handlePageChange" @size-change="fetchCourseScores" style="margin-top: 15px; justify-content: center;" />

    <!-- 权重设置弹窗 -->
    <el-dialog v-model="weightDialogVisible" title="成绩权重设置" :width="isMobile ? '90%' : '400px'" center>
      <el-form label-width="100px">
        <el-form-item label="平时成绩占比">
          <el-input-number v-model="weightForm.dailyWeight" :min="0" :max="100" />
          <span style="margin-left: 10px;">%</span>
        </el-form-item>
        <el-form-item label="报告成绩占比">
          <el-input-number v-model="weightForm.reportWeight" :min="0" :max="100" />
          <span style="margin-left: 10px;">%</span>
        </el-form-item>
        <el-alert title="注意：修改权重后，系统会自动重算该班级所有已录入成绩的学生总评！" type="warning" :closable="false" show-icon />
      </el-form>
      <template #footer>
        <el-button @click="weightDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWeight">保存并重算</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)

const scoreList = ref([])
const totalScores = ref(0)
const scorePage = ref(1)
const pageSize = ref(10)

const myClassOptions = ref([])
const selectedClassNo = ref('')

const weightDialogVisible = ref(false)
const weightForm = ref({ dailyWeight: 30, reportWeight: 70 })
const currentDailyWeight = ref(30)
const currentReportWeight = ref(70)

onMounted(() => { fetchMyClasses() })

const fetchMyClasses = async () => { 
  try { 
    const res = await request.get('/teacher/my-classes'); 
    if (res.code === 200) {
      myClassOptions.value = res.data.map(item => ({
        ...item,
        dailyWeight: item.dailyWeight || 30,
        reportWeight: item.reportWeight || 70
      }))
    } 
  } catch (e) {} 
}

const fetchCourseScores = async () => { 
  if (!selectedClassNo.value) return; 
  loading.value = true; 
  try { 
    const res = await request.get('/teacher/scores', { params: { classNo: selectedClassNo.value, page: scorePage.value, size: pageSize.value } }); 
    if (res.code === 200) { scoreList.value = res.data.records; totalScores.value = res.data.total; } 
  } catch (e) { 
    ElMessage.error('获取成绩单失败') 
  } finally { 
    loading.value = false 
  } 
}

const handlePageChange = (val) => { scorePage.value = val; fetchCourseScores(); }

const handleClassChange = () => { 
  scorePage.value = 1; 
  const targetClass = myClassOptions.value.find(c => c.classNo === selectedClassNo.value);
  if (targetClass) {
    currentDailyWeight.value = targetClass.dailyWeight || 30;
    currentReportWeight.value = targetClass.reportWeight || 70;
  } else {
    currentDailyWeight.value = 30;
    currentReportWeight.value = 70;
  }
  fetchCourseScores(); 
}

const saveScore = async (studentNo) => {
  const row = scoreList.value.find(item => item.studentNo === studentNo)
  if (!row || row.score === null || row.score === undefined) return ElMessage.warning('请输入平时成绩')
  try {
    const res = await request.post(`/teacher/score/save?studentNo=${studentNo}&classNo=${selectedClassNo.value}&dailyScore=${row.score}`)
    if (res.code === 200) { ElMessage.success(res.data); fetchCourseScores() } else { ElMessage.error(res.msg) }
  } catch (error) { ElMessage.error('保存失败') }
}

const exportScores = () => {
  if (!selectedClassNo.value) return
  request.get(`/teacher/score/export?classNo=${selectedClassNo.value}`, {
    responseType: 'blob'
  }).then(res => {
    const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `成绩单_${selectedClassNo.value}_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }).catch(e => {
    console.error(e)
    ElMessage.error('导出失败，请检查后端服务')
  })
}

const openWeightDialog = () => {
  weightForm.value = { 
    dailyWeight: currentDailyWeight.value, 
    reportWeight: currentReportWeight.value 
  }
  weightDialogVisible.value = true
}

const submitWeight = async () => {
  if (weightForm.value.dailyWeight + weightForm.value.reportWeight !== 100) {
    return ElMessage.warning('平时成绩和报告成绩的占比之和必须等于 100%！')
  }
  try {
    const res = await request.post('/teacher/score/weight', null, {
      params: {
        classNo: selectedClassNo.value,
        dailyWeight: weightForm.value.dailyWeight,
        reportWeight: weightForm.value.reportWeight
      }
    })
    if (res.code === 200) {
      ElMessage.success(res.data)
      weightDialogVisible.value = false
      currentDailyWeight.value = weightForm.value.dailyWeight
      currentReportWeight.value = weightForm.value.reportWeight
      fetchCourseScores() 
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}
</script>

<style scoped>
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
</style>
