<template>
  <div class="calendar-container" v-loading="calendarLoading">
    <div class="calendar-header">
      <div class="time-col">节次</div>
      <div v-for="day in 7" :key="day" class="day-col">
        {{ ['周一','周二','周三','周四','周五','周六','周日'][day-1] }}
      </div>
    </div>
    <div class="calendar-body">
      <div v-for="period in ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节']" :key="period" class="calendar-row">
        <div class="time-col">{{ period }}</div>
        <div v-for="day in 7" :key="day" class="day-col cell">
          <div 
            v-for="course in getCoursesByTime(period, day)" 
            :key="course.sessionNo"
            class="course-block"
          >
            <div class="course-name">{{ course.projectName }}</div>
            <div class="course-room">{{ course.teacherName }} | 第{{ course.weekNum }}周</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted} from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const calendarLoading = ref(false)
const calendarEvents = ref([])

onMounted(() => { fetchCalendarData() })

const fetchCalendarData = async () => {
  calendarLoading.value = true
  try {
    const res = await request.get('/student/my-bookings')
    if (res.code === 200) {
      calendarEvents.value = res.data.records ? res.data.records : res.data
    }
  } catch (e) {
    ElMessage.error('获取课表数据失败')
  } finally {
    calendarLoading.value = false
  }
}

const getCoursesByTime = (period, day) => {
  return calendarEvents.value.filter(item => 
    item.period === period && item.dayOfWeek === day
  )
}

defineExpose({ refresh: fetchCalendarData })
</script>

<style scoped>
.calendar-container {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow-x: auto;
  margin-top: 10px;
}
.calendar-header, .calendar-row {
  display: flex;
  min-width: 800px;
}
.calendar-header {
  background-color: #f5f7fa;
  font-weight: bold;
}
.time-col {
  width: 100px;
  text-align: center;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  font-size: 14px;
  color: #606266;
}
.day-col {
  flex: 1;
  text-align: center;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  padding: 10px 0;
}
.cell {
  height: 90px;
  padding: 5px;
  position: relative;
  overflow-y: auto;
}
.course-block {
  background-color: #ecf5ff;
  border-left: 3px solid #409EFF;
  padding: 5px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 4px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}
.course-block:hover {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}
.course-name {
  font-weight: bold;
  color: #303133;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.course-room {
  color: #909399;
  font-size: 11px;
}

/* 🛑【核心修复】移动端适配 */
@media screen and (max-width: 768px) {
  .calendar-header, .calendar-row {
    min-width: 100%; /* 取消最小宽度限制，让表格自适应屏幕 */
  }
  .time-col {
    width: 50px; /* 缩窄节次列 */
    font-size: 12px;
    padding: 5px 0;
  }
  .day-col {
    font-size: 12px;
    padding: 5px 0;
  }
  .cell {
    height: 60px; /* 降低单元格高度 */
    padding: 2px;
  }
  .course-block {
    padding: 2px;
    font-size: 10px;
    margin-bottom: 2px;
    border-left-width: 2px;
  }
  .course-room {
    display: none; /* 手机端隐藏教师姓名，节省空间 */
  }
}
</style>