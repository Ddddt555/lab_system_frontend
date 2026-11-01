import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  // 读取当前构建模式下的环境变量
  const env = loadEnv(mode, process.cwd())

  // 🛑【核心逻辑】如果环境变量中配置了 VITE_BUILD_TARGET=backend
  // 则输出到后端的 static 目录，否则输出到默认的 dist 目录
  const isBuildToBackend = env.VITE_BUILD_TARGET === 'backend'

  return {
    plugins: [vue()],
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
      
      // 🛑【安全底线】必须为 false！
      // 即使输出到 static，也绝对不能清空目录，防止误删后端手动放入的静态文件
      emptyOutDir: false 
    }
  }
})