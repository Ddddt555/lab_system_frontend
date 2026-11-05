<template>
  <div class="my-booking-panel">
    <el-table
      v-if="!isMobile"
      v-loading="bookingLoading"
      :data="myBookingList"
      border
      style="width: 100%"
    >
      <el-table-column prop="sessionNo" label="场次号" width="100" align="center" />
      <el-table-column prop="projectName" label="实验项目名称" width="180" align="center" />
      <el-table-column prop="teacherName" label="指导教师" width="100" align="center" />
      <el-table-column label="上课时间" align="center">
        <template #default="scope">{{ formatTeachingTime(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="指导书" width="150" align="center">
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
      <el-table-column label="成绩" width="100" align="center">
        <template #default="scope">
          <span
            v-if="scope.row.score !== null && scope.row.score !== undefined"
            style="color: red; font-weight: bold; font-size: 16px"
            >{{ scope.row.score }} 分</span
          >
          <span v-else style="color: gray">未批阅</span>
        </template>
      </el-table-column>
      <el-table-column label="教师评语" width="150" align="center">
        <template #default="scope">
          <span v-if="scope.row.comment">{{ scope.row.comment }}</span>
          <span v-else style="color: gray">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" align="center">
        <template #default="scope">
          <el-button type="success" size="small" @click="$emit('upload', scope.row)"
            >上传报告</el-button
          >
          <el-button type="primary" link style="margin: 0 5px" @click="$emit('history', scope.row)"
            >版本历史</el-button
          >
          <el-button type="warning" size="small" @click="$emit('sign', scope.row)">签到</el-button>
          <el-button
            v-if="!scope.row.isGraded"
            type="danger"
            size="small"
            @click="cancelBooking(scope.row.bookingNo)"
            >取消预约</el-button
          >
          <el-tag v-else type="info" effect="plain" style="margin-left: 5px">已批阅</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <div v-else v-loading="bookingLoading" class="mobile-card-list">
      <el-card v-for="item in myBookingList" :key="item.bookingNo" class="mobile-card">
        <div class="card-header">
          <span class="project-name">{{ item.projectName }}</span>
          <el-tag v-if="item.score !== null && item.score !== undefined" type="danger" size="small"
            >得分: {{ item.score }}</el-tag
          >
          <el-tag v-else type="info" size="small">未批阅</el-tag>
        </div>
        <div class="card-body">
          <p><strong>场次号：</strong> {{ item.sessionNo }}</p>
          <p><strong>教师：</strong> {{ item.teacherName }}</p>
          <p><strong>时间：</strong> {{ formatTeachingTime(item) }}</p>
          <p v-if="item.comment"><strong>评语：</strong> {{ item.comment }}</p>
        </div>
        <div class="card-footer" style="justify-content: flex-start; gap: 10px; flex-wrap: wrap">
          <template v-if="item.guideFile">
            <el-button type="primary" plain size="small" @click="previewFile(item.guideFile)"
              >预览指导书</el-button
            >
          </template>
          <el-button type="success" size="small" @click="$emit('upload', item)">上传报告</el-button>
          <el-button type="primary" plain size="small" @click="$emit('history', item)"
            >版本历史</el-button
          >
          <el-button type="warning" plain size="small" @click="$emit('sign', item)">签到</el-button>
          <el-button
            v-if="!item.isGraded"
            type="danger"
            size="small"
            @click="cancelBooking(item.bookingNo)"
            >取消预约</el-button
          >
        </div>
      </el-card>
    </div>

    <el-pagination
      v-model:current-page="bookingPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalBookings"
      style="margin-top: 15px; justify-content: center"
      @current-change="handlePageChange"
      @size-change="fetchMyBookings"
    />
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { previewFile, downloadFile } from '../utils/file'

const emit = defineEmits(['upload', 'history', 'sign', 'cancel-success'])

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const bookingLoading = ref(false)
const myBookingList = ref([])
const bookingPage = ref(1)
const pageSize = ref(10)
const totalBookings = ref(0)

onMounted(() => {
  fetchMyBookings()
})

const fetchMyBookings = async () => {
  bookingLoading.value = true
  try {
    const res = await request.get('/student/my-bookings', {
      params: { page: bookingPage.value, size: pageSize.value }
    })
    if (res.code === 200) {
      myBookingList.value = res.data.records
      totalBookings.value = res.data.total
    }
  } finally {
    bookingLoading.value = false
  }
}

const handlePageChange = (val) => {
  bookingPage.value = val
  fetchMyBookings()
}

const formatTeachingTime = (row) => {
  if (!row || !row.semester) return ''
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return `${row.semester} 第${row.weekNum}周 ${days[row.dayOfWeek]} ${row.period}`
}

const cancelBooking = async (bookingNo) => {
  try {
    await ElMessageBox.confirm('确定要取消该场次的预约吗？', '提示', { type: 'warning' })
    const res = await request.post(`/student/cancel?bookingNo=${bookingNo}`)
    if (res.code === 200) {
      ElMessage.success('取消预约成功！')
      fetchMyBookings()
      emit('cancel-success') // 通知父组件，可能有其他地方需要刷新
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {}
}

defineExpose({ refresh: fetchMyBookings })
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
</style>
