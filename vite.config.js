import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
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
      // WebSocket 代理
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    // ⚠️ 根据相对路径直通后端 static 目录
    // 解释：../ 退到 Project，然后进入 labsystem/labsystem/...
    outDir: '../labsystem/labsystem/src/main/resources/static',
    
    // ⚠️ 警告：这会在打包前清空 static 目录。
    // 如果你在 static 里放了其他后端特有或手动添加的静态文件，设为 true 会导致它们被删除！
    // 建议先设为 false。如果确实全是前端产物，再改为 true。
    emptyOutDir: true 
  }
})