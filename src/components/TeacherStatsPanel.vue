<template>
  <div class="teacher-stats-panel">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" style="margin-bottom: 20px;">
        <el-card shadow="hover">
          <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">成绩分布</div>
          <div ref="scoreChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <div style="font-weight: bold; margin-bottom: 15px; text-align: center;">实验开出率</div>
          <div ref="rateChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const scoreChartRef = ref(null)
const rateChartRef = ref(null)
let scoreChart = null
let rateChart = null

onMounted(async () => {
  // 🛑【核心修复】等待 DOM 渲染完成，并稍微延迟 100ms 确保 tab 切换动画结束，容器宽度撑开
  await nextTick()
  setTimeout(() => {
    renderCharts()
  }, 100)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (scoreChart) scoreChart.dispose()
  if (rateChart) rateChart.dispose()
})

const handleResize = () => {
  if (scoreChart) scoreChart.resize()
  if (rateChart) rateChart.resize()
}

const renderCharts = async () => {
  if (scoreChartRef.value) {
    if (!scoreChart) scoreChart = echarts.init(scoreChartRef.value)
    
    const res = await request.get('/teacher/stats/score-distribution')
    if (res.code === 200) {
      const data = res.data
      scoreChart.setOption({
        tooltip: { trigger: 'item' }, legend: { top: 'bottom' },
        series: [{ name: '成绩分布', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }, label: { show: false, position: 'center' }, emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } }, labelLine: { show: false },
            data: [{ value: data['优秀'], name: '优秀 (90-100)', itemStyle: { color: '#67C23A' } }, { value: data['良好'], name: '良好 (80-89)', itemStyle: { color: '#409EFF' } }, { value: data['中等'], name: '中等 (70-79)', itemStyle: { color: '#E6A23C' } }, { value: data['及格'], name: '及格 (60-69)', itemStyle: { color: '#909399' } }, { value: data['不及格'], name: '不及格 (<60)', itemStyle: { color: '#F56C6C' } }]
        }]
      }, true)
      
      // 🛑【核心修复】强制重绘一次，解决容器宽度被判定为 0 的问题
      scoreChart.resize()
    }
  }
  
  if (rateChartRef.value) {
    if (!rateChart) rateChart = echarts.init(rateChartRef.value)
    
    const res = await request.get('/teacher/stats/experiment-rate')
    if (res.code === 200) {
      const data = res.data
      rateChart.setOption({
        tooltip: { formatter: '{b}: {c}%' },
        series: [{ type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100, splitNumber: 5, itemStyle: { color: '#409EFF' }, progress: { show: true, width: 18 }, pointer: { show: false }, axisLine: { lineStyle: { width: 18 } }, axisTick: { show: false }, splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } }, axisLabel: { distance: 25, color: '#999', fontSize: 12 }, detail: { valueAnimation: true, formatter: '{value}%', color: '#409EFF', fontSize: 30, offsetCenter: [0, '40%'] }, data: [{ value: parseFloat(data.rate), name: `已开 ${data.opened} / 共 ${data.total} 个` }], title: { offsetCenter: [0, '70%'], fontSize: 14, color: '#666' } }]
      }, true)
      
      rateChart.resize()
    }
  }
}
</script>