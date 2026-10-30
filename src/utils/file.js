// src/utils/file.js
import { ElMessage } from 'element-plus'
import request from './request'

// 在线预览文件
export const previewFile = async (fileName) => {
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    ElMessage.warning('该文件格式不支持在线预览，请下载后查看！')
    return
  }
  try {
    const res = await request.get(`/report/preview-url/${fileName}`)
    if (res.code === 200) {
      window.open(res.data, '_blank')
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('获取预览链接失败')
  }
}

// 下载文件
export const downloadFile = async (fileName) => {
  try {
    const res = await request.get(`/report/download-url/${fileName}`)
    if (res.code === 200) {
      window.location.href = res.data
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('获取下载链接失败')
  }
}