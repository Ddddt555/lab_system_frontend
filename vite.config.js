import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  // 读取当前构建模式下的环境变量
  const env = loadEnv(mode, process.cwd())

  // 如果环境变量中配置了 VITE_BUILD_TARGET=backend，则输出到后端的 static 目录，否则输出到默认的 dist 目录
  const isBuildToBackend = env.VITE_BUILD_TARGET === 'backend'

  return {
    plugins: [
      vue(),
      // 自动导入 Vue 相关函数及 Element Plus 的 API（如 ElMessage）
      AutoImport({
        imports: ['vue', 'vue-router'],
        resolvers: [ElementPlusResolver()]
      }),
      // 自动导入 Element Plus 的组件（如 el-button, el-table）
      Components({
        resolvers: [ElementPlusResolver()]
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://localhost:8080',
          ws: true,
          changeOrigin: true
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1500,
      // 动态切换输出目录
      outDir: isBuildToBackend 
        ? '../labsystem/labsystem/src/main/resources/static' 
        : 'dist',
      
      // 即使输出到 static，也绝对不能清空目录，防止误删后端手动放入的静态文件
      emptyOutDir: false 
    }
  }
})