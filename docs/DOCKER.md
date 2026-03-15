# Docker 部署配置

## Dockerfile (后端服务)

```dockerfile
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 切换用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "server.js"]
```

---

## docker-compose.yml

```yaml
version: '3.8'

services:
  # MongoDB 数据库
  mongodb:
    image: mongo:5.0
    container_name: fitness-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your_password_here
      MONGO_INITDB_DATABASE: fitness_checkin
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    ports:
      - "27017:27017"
    networks:
      - fitness-network

  # 后端服务
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: fitness-api
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3000
      MONGODB_URI: mongodb://admin:your_password_here@mongodb:27017/fitness_checkin?authSource=admin
      WECHAT_APPID: ${WECHAT_APPID}
      WECHAT_SECRET: ${WECHAT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
    networks:
      - fitness-network
    volumes:
      - ./server:/app
      - /app/node_modules

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: fitness-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - fitness-network

volumes:
  mongodb_data:
  mongodb_config:

networks:
  fitness-network:
    driver: bridge
```

---

## Nginx 配置

### nginx/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # 限流
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    upstream api_backend {
        server api:3000;
        keepalive 32;
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS 服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL 证书配置
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        # 现代 SSL 配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API 代理
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://api_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 90;
        }

        # 健康检查
        location /health {
            proxy_pass http://api_backend/health;
            access_log off;
        }
    }
}
```

---

## 环境变量文件

### .env.example

```env
# 微信小程序配置
WECHAT_APPID=wxXXXXXXXXXXXXXXX
WECHAT_SECRET=your_wechat_secret_here

# JWT 配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# MongoDB 密码
MONGODB_PASSWORD=your_mongodb_password
```

---

## 部署脚本

### deploy.sh

```bash
#!/bin/bash

set -e

echo "🚀 开始部署..."

# 1. 拉取最新代码
git pull origin main

# 2. 构建 Docker 镜像
docker-compose build

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

echo "✅ 部署完成!"
```

### rollback.sh

```bash
#!/bin/bash

set -e

echo "🔄 开始回滚..."

# 回滚到上一个版本
git reset --hard HEAD~1

# 重新构建并启动
docker-compose build
docker-compose up -d

echo "✅ 回滚完成!"
```

---

## 使用指南

### 1. 准备环境

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 验证安装
docker --version
docker-compose --version
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 准备 SSL 证书

```bash
mkdir -p nginx/ssl
# 将证书文件放入 nginx/ssl 目录
# - fullchain.pem (证书链)
# - privkey.pem (私钥)
```

### 4. 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f api
```

### 5. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷 (谨慎使用!)
docker-compose down -v
```

---

## 监控命令

```bash
# 查看容器资源使用
docker stats

# 查看 API 日志
docker-compose logs -f api

# 查看 MongoDB 日志
docker-compose logs -f mongodb

# 进入容器
docker-compose exec api sh
docker-compose exec mongodb mongosh -u admin -p your_password
```

---

## 备份脚本

### backup.sh

```bash
#!/bin/bash

BACKUP_DIR="/backup/fitness_checkin"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份 MongoDB
docker-compose exec mongodb mongodump --out /tmp/backup
docker cp mongodb:/tmp/backup $BACKUP_DIR/mongodb_$DATE

# 压缩备份
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/mongodb_$DATE

# 清理旧备份 (保留 7 天)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "备份完成：$BACKUP_DIR/backup_$DATE.tar.gz"
```

---

## 性能优化

### 1. MongoDB 优化

```yaml
# docker-compose.yml 添加
mongodb:
  command: mongod --wiredTigerCacheSizeGB 1.5
```

### 2. Node.js 优化

```dockerfile
# Dockerfile 添加
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=512
```

### 3. Nginx 优化

```nginx
# 增加 worker 进程
worker_processes auto;

# 增加连接数
events {
    worker_connections 4096;
}
```
