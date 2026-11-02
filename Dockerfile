# ==========================================
# 第一阶段：构建前端项目
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm ci

# 复制所有源码并打包 (这里默认使用标准的 dist 输出)
COPY . .
RUN npm run build

# ==========================================
# 第二阶段：运行 Nginx 托管静态文件
# ==========================================
FROM nginx:1.25-alpine

# 删掉 Nginx 默认的配置
RUN rm /etc/nginx/conf.d/default.conf

# 把我们刚才写的 nginx.conf 放进去
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 把第一阶段打包好的 dist 目录里的文件，复制到 Nginx 的静态目录
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]