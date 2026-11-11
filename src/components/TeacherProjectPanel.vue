<template>
  <div class="teacher-project-panel">
    <div style="margin-bottom: 15px">
      <el-button type="primary" @click="openAddProject">发布新实验项目</el-button>
    </div>
    <div class="table-responsive">
      <el-table v-loading="loading" :data="projectList" border style="width: 100%">
        <el-table-column prop="projectNo" label="项目号" width="120" align="center" />
        <el-table-column prop="projectName" label="项目名称" width="180" align="center" />
        <el-table-column prop="classNo" label="所属教学班" width="150" align="center" />
        <el-table-column prop="hours" label="学时" width="80" align="center" />
        <el-table-column prop="standard" label="考核标准" width="180" align="center" />
        <el-table-column label="实验指导书" width="150" align="center">
          <template #default="scope">
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="(file) => handleGuideUpload(file, scope.row.projectNo)"
            >
              <el-button type="primary" size="small" plain>
                {{ scope.row.guideFile ? '重新上传' : '上传指导书' }}
              </el-button>
            </el-upload>
          </template>
        </el-table-column>
        <!-- 新增操作列 -->
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button type="danger" size="small" @click="deleteProject(scope.row.projectNo)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <el-pagination
      v-model:current-page="projectPage"
      v-model:page-size="pageSize"
      :page-sizes="[5, 10, 20, 50]"
      :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
      :total="totalProjects"
      style="margin-top: 15px; justify-content: center"
      @current-change="handlePageChange"
      @size-change="fetchProjects"
    />

    <!-- 发布新项目弹窗 -->
    <el-dialog v-model="projectDialog" title="发布新实验项目" :width="isMobile ? '95%' : '500px'">
      <el-form :model="newProject" label-width="100px">
        <el-form-item label="项目名称" required
          ><el-input v-model="newProject.projectName"
        /></el-form-item>
        <el-form-item label="所属教学班" required>
          <el-select v-model="newProject.classNo" placeholder="请选择教学班" style="width: 100%">
            <el-option
              v-for="c in myClassOptions"
              :key="c.classNo"
              :label="c.displayName"
              :value="c.classNo"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学时"
          ><el-input-number v-model="newProject.hours" :min="1"
        /></el-form-item>
        <el-form-item label="考核标准"
          ><el-input v-model="newProject.standard" type="textarea" :rows="2"
        /></el-form-item>
      </el-form>
      <template #footer
        ><el-button @click="projectDialog = false">取消</el-button
        ><el-button type="primary" @click="submitAddProject">确认发布</el-button></template
      >
    </el-dialog>
  </div>
</template>

<script setup>
import { useWindowSize } from '../composables/useWindowSize'
import { ref, onMounted, computed } from 'vue'
// 注意这里引入了 ElMessageBox
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const projectList = ref([])
const projectPage = ref(1)
const pageSize = ref(10)
const totalProjects = ref(0)

const projectDialog = ref(false)
const newProject = ref({ projectName: '', classNo: '', hours: 2, standard: '' })
const myClassOptions = ref([])

onMounted(() => {
  fetchProjects()
  fetchMyClasses()
})

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await request.get('/teacher/project/list', {
      params: { page: projectPage.value, size: pageSize.value }
    })
    if (res.code === 200) {
      projectList.value = res.data.records
      totalProjects.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const fetchMyClasses = async () => {
  try {
    const res = await request.get('/teacher/my-classes')
    if (res.code === 200) myClassOptions.value = res.data
  } catch (e) {}
}

const handlePageChange = (val) => {
  projectPage.value = val
  fetchProjects()
}

const handleGuideUpload = async (file, projectNo) => {
  const rawFile = file.raw
  if (!rawFile) return
  const formData = new FormData()
  formData.append('file', rawFile)
  formData.append('projectNo', projectNo)
  try {
    const res = await request.post('/teacher/project/upload-guide', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200) {
      ElMessage.success('指导书上传成功！')
      fetchProjects()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (error) {
    ElMessage.error('上传失败！')
  }
}

// 新增删除项目逻辑
const deleteProject = async (projectNo) => {
  try {
    await ElMessageBox.confirm('确定要删除该实验项目吗？删除后不可恢复！', '警告', {
      type: 'warning'
    })
    const res = await request.delete(`/teacher/project/delete?projectNo=${projectNo}`)
    if (res.code === 200) {
      ElMessage.success(res.data)
      fetchProjects()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    // 用户点击取消时，静默处理
  }
}

const openAddProject = () => {
  newProject.value = { projectName: '', classNo: '', hours: 2, standard: '' }
  projectDialog.value = true
}

const submitAddProject = async () => {
  if (!newProject.value.projectName || !newProject.value.classNo)
    return ElMessage.warning('请填写完整信息！')
  try {
    const res = await request.post('/teacher/project/add', newProject.value)
    if (res.code === 200) {
      ElMessage.success(res.data)
      projectDialog.value = false
      fetchProjects()
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e) {
    ElMessage.error('请求失败')
  }
}
</script>

<style scoped>
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
