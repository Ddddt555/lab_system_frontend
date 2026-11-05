<template>
  <div class="session-list-panel">
    <el-table v-if="!isMobile" v-loading="loading" :data="sessionList" border style="width: 100%">
      <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
      <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
      <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
      <el-table-column label="上课时间" align="center">
        <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
      </el-table-column>
      <el-table-column prop="remainingSeats" label="剩余机位" width="120" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.remainingSeats > 0 ? 'success' : 'danger'"
            >{{ scope.row.remainingSeats }} / {{ scope.row.capacity }}</el-tag
          >
        </template>
      </el-table-column>
      <el-table-column label="实验指导书" width="150" align="center">
        <template #default="scope">
          <template v-if="scope.row.guideFile">
            <el-button type="primary" link @click="previewFile(scope.row.guideFile)"
              >预览</el-button
            >
            <el-button type="success" link @click="downloadFile(scope.row.guideFile)"
              >下载</el-button
            >
          </template>
          <span v-else style="color: gray">暂无</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template #default="scope">
          <el-button
            v-if="scope.row.remainingSeats > 0"
            type="primary"
            size="small"
            @click="handleBook(scope.row.sessionNo)"
            >预约</el-button
          >
          <el-button
            v-else
            type="warning"
            plain
            size="small"
            @click="handleWaitlist(scope.row.sessionNo)"
            >加入候补</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div v-else v-loading="loading" class="mobile-card-list">
      <el-card v-for="item in sessionList" :key="item.sessionNo" class="mobile-card">
        <div class="card-header">
          <span class="project-name">{{ item.projectName }}</span>
          <el-tag :type="item.remainingSeats > 0 ? 'success' : 'danger'" size="small">
            剩余: {{ item.remainingSeats }} / {{ item.capacity }}
          </el-tag>
        </div>
        <div class="card-body">
          <p><strong>场次号：</strong> {{ item.sessionNo }}</p>
          <p><strong>教师：</strong> {{ item.teacherName }}</p>
          <p><strong>时间：</strong> {{ formatTeachingTime(item) }}</p>
        </div>
        <div class="card-footer" style="gap: 10px">
          <template v-if="item.guideFile">
            <el-button type="primary" plain size="small" @click="previewFile(item.guideFile)"
              >预览指导书</el-button
            >
            <el-button type="success" plain size="small" @click="downloadFile(item.guideFile)"
              >下载</el-button
            >
          </template>
          <span v-else class="no-file">暂无指导书</span>
          <el-button
            v-if="item.remainingSeats > 0"
            type="primary"
            size="small"
            @click="handleBook(item.sessionNo)"
            >预约</el-button
          >
          <el-button
            v-else
            type="warning"
            plain
            size="small"
            @click="handleWaitlist(item.sessionNo)"
            >加入候补</el-button
          >
        </div>
      </el-card>
    </div>

    <el-pagination
      v-model:current-page="sessionPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalSessions"
      style="margin-top: 15px; justify-content: center"
      @current-change="handlePageChange"
      @size-change="fetchSessions"
    />
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { previewFile, downloadFile } from '../utils/file'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const sessionList = ref([])
const sessionPage = ref(1)
const pageSize = ref(10)
const totalSessions = ref(0)

onMounted(() => {
  fetchSessions()
})

const fetchSessions = async () => {
  loading.value = true
  try {
    const res = await request.get('/student/session/list', {
      params: { page: sessionPage.value, size: pageSize.value }
    })
    if (res.code === 200) {
      sessionList.value = res.data.records
      totalSessions.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val) => {
  sessionPage.value = val
  fetchSessions()
}

const formatTeachingTime = (row) => {
  if (!row || !row.semester) return ''
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`
}

const handleBook = async (sessionNo) => {
  try {
    const res = await request.post(`/student/book?sessionNo=${sessionNo}`)
    if (res.code === 200) {
      ElMessage.success('预约成功！')
      fetchSessions()
    } else {
      ElMessage.warning(res.msg)
    }
  } catch (error) {
    ElMessage.error('预约失败！')
  }
}

const handleWaitlist = async (sessionNo) => {
  try {
    const res = await request.post(`/student/waitlist?sessionNo=${sessionNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchSessions()
    } else {
      ElMessage.warning(res.msg)
    }
  } catch (error) {
    ElMessage.error('加入候补失败，请检查网络！')
  }
}

// 🛑 暴露给父组件的方法，用于响应 WebSocket 的实时更新
defineExpose({
  updateSeats: (sessionNo, seats) => {
    const target = sessionList.value.find((s) => s.sessionNo === sessionNo)
    if (target) target.remainingSeats = seats
  },
  refresh: fetchSessions
})
</script>

<style scoped>
.mobile-card-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.mobile-card {
  border-radius: 8px;
  margin-bottom: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  margin-bottom: 10px;
}
.project-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  flex: 1;
}
.card-body p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
  flex-wrap: wrap;
}
.no-file {
  color: #909399;
  font-size: 14px;
}
</style>
