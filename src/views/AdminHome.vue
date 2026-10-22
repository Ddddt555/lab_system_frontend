<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <div class="header">
      <h2>实验教学管理系统 - 管理员端</h2>
      <div>
        <el-button type="warning" size="small" @click="openPwdDialog" style="margin-right: 15px;">修改密码</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="main-content">
      <el-tabs v-model="activeTab">
        
        <!-- 标签页 1：学生管理 -->
        <el-tab-pane label="学生管理" name="students">
          <div style="margin-bottom: 15px;">
            <el-button type="primary" @click="openAddStudent">新增学生</el-button>
          </div>
          <el-table :data="studentList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="studentNo" label="学号" width="150" align="center" />
            <el-table-column prop="name" label="姓名" align="center" />
            <el-table-column prop="className" label="班级" align="center" />
            <el-table-column prop="major" label="专业" align="center" />
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteStudent(scope.row.studentNo)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 标签页 2：教师管理 -->
        <el-tab-pane label="教师管理" name="teachers">
          <div style="margin-bottom: 15px;">
            <el-button type="primary" @click="openAddTeacher">新增教师</el-button>
          </div>
          <el-table :data="teacherList" border style="width: 100%" v-loading="loading">
            <el-table-column prop="workNo" label="工号" width="150" align="center" />
            <el-table-column prop="name" label="姓名" align="center" />
            <el-table-column prop="department" label="院系" align="center" />
            <el-table-column prop="title" label="职称" align="center" />
            <el-table-column label="操作" width="150" align="center">
              <template #default="scope">
                <el-button type="danger" size="small" @click="deleteTeacher(scope.row.workNo)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

      </el-tabs>
    </div>

    <!-- 弹窗：新增学生 -->
    <el-dialog v-model="studentDialog" title="新增学生" width="400px">
      <el-form :model="newStudent" label-width="80px">
        <el-form-item label="学号" required><el-input v-model="newStudent.studentNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="newStudent.name" /></el-form-item>
        <el-form-item label="班级"><el-input v-model="newStudent.className" /></el-form-item>
        <el-form-item label="专业"><el-input v-model="newStudent.major" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="studentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAddStudent">确认</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：新增教师 -->
    <el-dialog v-model="teacherDialog" title="新增教师" width="400px">
      <el-form :model="newTeacher" label-width="80px">
        <el-form-item label="工号" required><el-input v-model="newTeacher.workNo" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="newTeacher.name" /></el-form-item>
        <el-form-item label="院系"><el-input v-model="newTeacher.department" /></el-form-item>
        <el-form-item label="职称"><el-input v-model="newTeacher.title" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teacherDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAddTeacher">确认</el-button>
      </template>
    </el-dialog>

    <!-- 弹窗：修改管理员密码 -->
    <el-dialog v-model="pwdDialog" title="修改管理员密码" width="400px">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码" required>
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPwd">确认修改</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const activeTab = ref('students')
const loading = ref(false)

// 列表数据
const studentList = ref([])
const teacherList = ref([])

// --- 学生管理 ---
const studentDialog = ref(false)
const newStudent = ref({ studentNo: '', name: '', className: '', major: '' })

const fetchStudents = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/admin/students')
    if (res.data.code === 200) studentList.value = res.data.data
  } catch (error) {
    ElMessage.error('获取学生列表失败')
  } finally { 
    loading.value = false 
  }
}

const openAddStudent = () => {
  newStudent.value = { studentNo: '', name: '', className: '', major: '' }
  studentDialog.value = true
}

const submitAddStudent = async () => {
  if (!newStudent.value.studentNo || !newStudent.value.name) {
    return ElMessage.warning('学号和姓名不能为空！')
  }
  try {
    const res = await axios.post('http://localhost:8080/api/admin/student/add', newStudent.value)
    if (res.data.code === 200) {
      ElMessage.success(res.data.data)
      studentDialog.value = false
      fetchStudents()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('添加失败，请检查网络')
  }
}

const deleteStudent = async (studentNo) => {
  try {
    await ElMessageBox.confirm('确定要删除该学生吗？删除后不可恢复！', '警告', { type: 'warning' })
    const res = await axios.delete(`http://localhost:8080/api/admin/student/delete?studentNo=${studentNo}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchStudents()
    } else {
      ElMessage.error('删除失败：该学生可能已有预约记录或报告')
    }
  } catch (e) {
    // 用户取消删除
  }
}

// --- 教师管理 ---
const teacherDialog = ref(false)
const newTeacher = ref({ workNo: '', name: '', department: '', title: '' })

const fetchTeachers = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:8080/api/admin/teachers')
    if (res.data.code === 200) teacherList.value = res.data.data
  } catch (error) {
    ElMessage.error('获取教师列表失败')
  } finally {
    loading.value = false
  }
}

const openAddTeacher = () => {
  newTeacher.value = { workNo: '', name: '', department: '', title: '' }
  teacherDialog.value = true
}

const submitAddTeacher = async () => {
  if (!newTeacher.value.workNo || !newTeacher.value.name) {
    return ElMessage.warning('工号和姓名不能为空！')
  }
  try {
    const res = await axios.post('http://localhost:8080/api/admin/teacher/add', newTeacher.value)
    if (res.data.code === 200) {
      ElMessage.success(res.data.data)
      teacherDialog.value = false
      fetchTeachers()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('添加失败，请检查网络')
  }
}

const deleteTeacher = async (workNo) => {
  try {
    await ElMessageBox.confirm('确定要删除该教师吗？删除后不可恢复！', '警告', { type: 'warning' })
    const res = await axios.delete(`http://localhost:8080/api/admin/teacher/delete?workNo=${workNo}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchTeachers()
    } else {
      ElMessage.error('删除失败：该教师可能已被排课')
    }
  } catch (e) {
    // 用户取消删除
  }
}

// --- 修改密码 ---
const pwdDialog = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const openPwdDialog = () => {
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  pwdDialog.value = true
}

const submitPwd = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    return ElMessage.warning('请填写完整信息！')
  }
  if (newPassword !== confirmPassword) {
    return ElMessage.warning('两次输入的新密码不一致！')
  }

  try {
    const res = await axios.post('http://localhost:8080/api/admin/update-password', null, {
      params: { oldPassword, newPassword }
    })
    
    if (res.data.code === 200) {
      ElMessage.success('修改成功，请重新登录！')
      pwdDialog.value = false
      // 延迟1秒跳回登录页，让用户看清提示
      setTimeout(() => {
        localStorage.removeItem('loginUser')
        router.push('/')
      }, 1000)
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (error) {
    ElMessage.error('网络错误，修改失败！')
  }
}

// --- 生命周期与退出 ---
onMounted(() => {
  fetchStudents()
  fetchTeachers()
})

const logout = () => {
  localStorage.removeItem('loginUser')
  router.push('/')
}
</script>

<style scoped>
.home-container { 
  min-height: 100vh; 
  background-color: #f5f7fa; 
}
.header { 
  background-color: #fff; 
  height: 60px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 40px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.1); 
}
.header h2 { 
  margin: 0; 
  color: #333; 
}
.main-content { 
  padding: 40px; 
  max-width: 1200px; 
  margin: 0 auto; 
  background: white; 
  border-radius: 8px; 
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1); 
  margin-top: 20px;
}
</style>