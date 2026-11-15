# ==========================================
# 第一阶段：构建前端项目
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm ci

# 复制所有源码并打包
COPY . .
RUN npm run build

# ==========================================
# 第二阶段：运行 Nginx 托管静态文件
# ==========================================
# 使用非 root 版本的 Nginx 镜像
FROM nginxinc/nginx-unprivileged:1.25-alpine

# 显式指定非 root 用户运行
USER nginx

# 删掉 Nginx 默认的配置
RUN rm /etc/nginx/conf.d/default.conf

# 把自定义的 nginx.conf 放进去
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 把第一阶段打包好的 dist 目录里的文件，复制到 Nginx 的静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 非 root 镜像无法绑定 80 端口，默认暴露 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]