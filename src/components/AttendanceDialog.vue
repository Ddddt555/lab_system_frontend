<template>
  <el-dialog
    v-model="visible"
    title="课堂考勤签到"
    :width="isMobile ? '90%' : '600px'"
    center
    @close="closeWebSocket"
  >
    <div style="text-align: center; margin-bottom: 20px">
      <p style="color: #666; font-size: 15px; margin-bottom: 15px">
        请学生打开学生端，输入以下 6 位数字进行签到
      </p>
      <div
        style="
          font-size: 56px;
          font-weight: bold;
          color: #409eff;
          letter-spacing: 12px;
          background: #ecf5ff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: inset 0 0 10px #d9ecff;
        "
      >
        {{ attendanceCode || '------' }}
      </div>
    </div>
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      "
    >
      <span style="font-weight: bold; color: #303133"
        >已签到名单 ({{ attendanceList.length }}人)</span
      >
      <el-button type="primary" size="small" @click="fetchAttendanceList">手动刷新</el-button>
    </div>
    <div
      class="table-responsive"
      style="max-height: 300px; overflow-y: auto; border: 1px solid #ebeef5; border-radius: 4px"
    >
      <el-table :data="attendanceList" size="small" stripe>
        <el-table-column prop="studentNo" label="学号" width="150" align="center" />
        <el-table-column prop="name" label="姓名" align="center" />
        <el-table-column label="签到时间" align="center">
          <template #default="scope">{{ formatTime(scope.row.bookingTime) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </el-dialog>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { WsClient } from '../utils/ws'

const props = defineProps({
  modelValue: Boolean,
  sessionNo: String
})
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const attendanceCode = ref('')
const attendanceList = ref([])
let wsClient = null

const formatTime = (timeStr) => (timeStr ? timeStr.replace('T', ' ').substring(0, 16) : '')

// 监听弹窗打开，自动发起签到
watch(
  () => visible.value,
  async (newVal) => {
    if (newVal && props.sessionNo) {
      attendanceCode.value = '------'
      attendanceList.value = []
      try {
        const res = await request.post(`/teacher/attendance/start?sessionNo=${props.sessionNo}`)
        if (res.code === 200) {
          attendanceCode.value = res.data
          fetchAttendanceList()
          await initWebSocket()
        } else {
          ElMessage.error(res.msg)
        }
      } catch (e) {
        ElMessage.error('获取签到码失败，请检查网络')
      }
    }
  }
)

const fetchAttendanceList = async () => {
  if (!props.sessionNo) return
  try {
    const res = await request.get(`/teacher/attendance/list?sessionNo=${props.sessionNo}`)
    if (res.code === 200) attendanceList.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const initWebSocket = async () => {
  closeWebSocket()
  const urlProvider = async () => {
    const res = await request.get('/ws-ticket')
    if (res.code !== 200) throw new Error('获取WS凭证失败')
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
    const host = window.location.host
    return `${protocol}${host}/ws/attendance/${props.sessionNo}?ticket=${res.data}`
  }

  wsClient = new WsClient(urlProvider)
  wsClient.onMessageCallback = (message) => {
    if (message === 'NEW_SIGN_IN') {
      fetchAttendanceList()
      ElMessage.success('有学生签到啦！')
    }
  }
  wsClient.connect()
}

const closeWebSocket = () => {
  if (wsClient) {
    wsClient.close()
    wsClient = null
  }
}
</script>
