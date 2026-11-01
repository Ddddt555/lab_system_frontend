<template>
  <div class="admin-log-panel">
    <div class="table-responsive">
      <el-table :data="logList" border style="width: 100%" v-loading="loading">
        
        <!-- 1. 操作人 -->
        <el-table-column prop="operator" label="操作人" width="140" align="center" />

        <!-- 2. 操作动作 -->
        <el-table-column prop="action" label="操作动作" min-width="150" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.action.includes('删除') || scope.row.action.includes('取消') || scope.row.action.includes('失败') ? 'danger' : 'success'">
              {{ scope.row.action }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 3. 执行状态 (成功/失败) -->
        <el-table-column prop="success" label="状态" width="80" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.success === 1" type="success" size="small">成功</el-tag>
            <el-tooltip v-else :content="scope.row.errorMsg || '未知异常'" placement="top">
              <el-tag type="danger" size="small" style="cursor: pointer;">失败</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- 4. 请求路径 (超长省略) -->
        <el-table-column prop="uri" label="请求路径" min-width="180" show-overflow-tooltip align="center" />

        <!-- 5. 请求方法 (GET/POST/DELETE 等) -->
        <el-table-column prop="method" label="方法" width="80" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.method === 'GET' ? 'info' : (scope.row.method === 'POST' ? 'primary' : 'warning')" size="small">
              {{ scope.row.method }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 6. IP地址 -->
        <el-table-column prop="ip" label="IP地址" width="130" align="center" />

        <!-- 7. 耗时 -->
        <el-table-column prop="costMs" label="耗时(ms)" width="100" align="center" />

        <!-- 8. 操作时间 -->
        <el-table-column prop="createTime" label="操作时间" width="160" align="center">
          <template #default="scope">{{ scope.row.createTime ? scope.row.createTime.replace('T', ' ').substring(0, 19) : '' }}</template>
        </el-table-column>

      </el-table>
    </div>
    
    <el-pagination v-model:current-page="logPage" v-model:page-size="pageSize" :page-sizes="[5, 10, 20, 50]" :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'" :total="totalLogs" @current-change="handlePageChange" @size-change="fetchLogs" style="margin-top: 15px; justify-content: center;" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineExpose } from 'vue'
import request from '../utils/request'

const isMobile = computed(() => window.innerWidth < 768)
const loading = ref(false)
const logList = ref([])
const totalLogs = ref(0)
const logPage = ref(1)
const pageSize = ref(10)

onMounted(() => { fetchLogs() })

const fetchLogs = async () => { 
  loading.value = true; 
  try { 
    const res = await request.get('/admin/logs', { params: { page: logPage.value, size: pageSize.value } }); 
    if (res.code === 200) { logList.value = res.data.records; totalLogs.value = res.data.total; } 
  } finally { loading.value = false } 
}

const handlePageChange = (val) => { logPage.value = val; fetchLogs(); }

// 暴露方法，方便父组件在增删改查后调用刷新
defineExpose({ refresh: fetchLogs })
</script>

<style scoped>
.table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
</style>