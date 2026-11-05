# 实验教学管理系统 (Lab Teaching Management System) - 前端

基于 Vue 3 + Vite + Element Plus 构建的单页应用（SPA）。与 Spring Boot 后端配合，提供学生、教师、管理员三端交互界面。

> 💡 **致谢说明**：本项目使用了 **DeepSeek AI** 进行了优化与改进。

## 🌟 核心特性 (Features)

- **现代化前端架构**：Vue 3 `<script setup>` 语法，Vite 极速构建。
- **响应式设计**：自定义 `useWindowSize` Hook，完美适配桌面端与移动端布局。
- **安全通信**：Axios 封装，支持双 Token 无感刷新并发去重，防止 401 雪崩。
- **实时推送**：基于 WebSocket 的全局通知与考勤实时刷新，自动处理断线重连。
- **工程化规范**：集成 ESLint + Prettier，CI/CD 强制代码规范门禁。

## 🛠 技术栈 (Tech Stack)

- **核心框架**：Vue 3.5, Vue Router 4
- **构建工具**：Vite 8
- **UI 组件库**：Element Plus
- **图表可视化**：ECharts
- **网络请求**：Axios
- **代码规范**：ESLint 9 (Flat Config), Prettier

## 🚀 本地开发 (Local Development)

### 前置要求
- 安装 Node.js 20+
- 本地已启动后端环境（默认监听 http://localhost:8080）

### 步骤

**1. 安装依赖**

    npm install

**2. 启动开发服务器**

    npm run dev

访问控制台输出的地址（通常是 http://localhost:5173）。Vite 已配置代理，`/api` 请求会自动转发至后端。

**3. 代码规范检查与格式化**

    npm run lint
    npm run format

## 📦 生产构建与部署

构建产物默认输出到 `dist` 目录，通过 Nginx 托管静态文件并反向代理后端 API。

    npm run build

> **自动化部署**：推送到 `main` 分支后，GitHub Actions 会自动执行 `npm ci`、`npx eslint .` 和 `npm run build`，并构建 Docker 镜像推送至 Docker Hub。