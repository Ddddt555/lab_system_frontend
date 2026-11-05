<template>
  <div class="select-class-panel">
    <!-- 桌面端表格 -->
    <el-table v-if="!isMobile" :data="availableClasses" border style="width: 100%" v-loading="loading">
      <el-table-column prop="classNo" label="教学班号" width="150" align="center" />
      <el-table-column prop="courseName" label="课程名称" min-width="180" align="center" />
      <el-table-column prop="teacherName" label="任课教师" width="120" align="center" />
      <el-table-column prop="semester" label="开课学期" width="150" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.isSelected" type="success">已加入</el-tag>
          <el-tag v-else type="info">未加入</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button v-if="!scope.row.isSelected" type="primary" size="small" @click="selectClass(scope.row.classNo)">加入班级</el-button>
          <el-button v-else type="danger" size="small" @click="dropClass(scope.row.classNo)">退课</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 移动端卡片 -->
    <div v-else class="mobile-card-list" v-loading="loading">
      <el-card v-for="item in availableClasses" :key="item.classNo" class="mobile-card">
        <div class="card-header">
          <span class="project-name">{{ item.courseName }}</span>
          <el-tag v-if="item.isSelected" type="success" size="small">已加入</el-tag>
          <el-tag v-else type="info" size="small">未加入</el-tag>
        </div>
        <div class="card-body">
          <p><strong>教学班号：</strong> {{ item.classNo }}</p>
          <p><strong>教师：</strong> {{ item.teacherName }}</p>
          <p><strong>学期：</strong> {{ item.semester }}</p>
        </div>
        <div class="card-footer">
          <el-button v-if="!item.isSelected" type="primary" size="small" @click="selectClass(item.classNo)">加入班级</el-button>
          <el-button v-else type="danger" size="small" @click="dropClass(item.classNo)">退课</el-button>
        </div>
      </el-card>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="classPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalClasses"
      @current-change="handlePageChange"
      @size-change="fetchAvailableClasses"
      style="margin-top: 15px; justify-content: center;"
    />
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

// 该组件独立维护自己的数据，不干扰外面
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const availableClasses = ref([])
const classPage = ref(1)
const pageSize = ref(10)
const totalClasses = ref(0)

// 组件挂载时自动拉取数据
onMounted(() => {
  fetchAvailableClasses()
})

const fetchAvailableClasses = async () => {
  loading.value = true
  try {
    const res = await request.get('/student/available-classes', { 
      params: { page: classPage.value, size: pageSize.value } 
    })
    if (res.code === 200) { 
      availableClasses.value = res.data.records
      totalClasses.value = res.data.total 
    }
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val) => { 
  classPage.value = val
  fetchAvailableClasses() 
}

const selectClass = async (classNo) => {
  try {
    const res = await request.post(`/student/select-class?classNo=${classNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchAvailableClasses()
    } else {
      ElMessage.warning(res.msg)
    }
  } catch (e) {
    ElMessage.error('选课失败')
  }
}

const dropClass = async (classNo) => {
  try {
    await ElMessageBox.confirm('确定要退出该教学班吗？', '警告', { type: 'warning' })
    const res = await request.post(`/student/drop-class?classNo=${classNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchAvailableClasses()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {}
}
</script>

<style scoped>
/* 这里只保留选课中心相关的样式 */
.mobile-card-list { display: flex; flex-direction: column; gap: 15px; }
.mobile-card { border-radius: 8px; margin-bottom: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ebeef5; padding-bottom: 10px; margin-bottom: 10px; }
.project-name { font-weight: bold; font-size: 16px; color: #303133; flex: 1; }
.card-body p { margin: 5px 0; font-size: 14px; color: #606266; line-height: 1.5; }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ebeef5; flex-wrap: wrap; }
</style>
