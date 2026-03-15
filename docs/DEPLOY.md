# 部署文档

## 环境要求

- Node.js >= 16.0.0
- MongoDB >= 5.0
- 微信开发者工具 (最新版)
- 微信小程序账号 (已认证)

---

## 一、后端部署

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置:

```bash
cp .env.example .env
```

编辑 `.env` 文件:

```env
# 服务器端口
PORT=3000

# MongoDB 连接地址
MONGODB_URI=mongodb://localhost:27017/fitness_checkin

# 微信小程序配置 (从微信开放平台获取)
WECHAT_APPID=wxXXXXXXXXXXXXXXX
WECHAT_SECRET=your_wechat_secret_here

# JWT 配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# 微信 API 地址
WECHAT_API_BASE=https://api.weixin.qq.com
```

### 3. 启动服务

**开发环境:**
```bash
npm run dev
```

**生产环境:**
```bash
npm start
```

### 4. 使用 PM2 部署 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name fitness-checkin

# 设置开机自启
pm2 startup
pm2 save
```

### 5. 使用 Docker 部署

创建 `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

构建并运行:

```bash
docker build -t fitness-checkin .
docker run -d -p 3000:3000 --env-file .env fitness-checkin
```

---

## 二、小程序前端部署

### 1. 导入项目

1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram/` 目录
3. 填写 AppID (测试账号可使用测试号)

### 2. 配置服务器域名

登录 [微信公众平台](https://mp.weixin.qq.com/):

1. 开发 → 开发管理 → 开发设置
2. 服务器域名 → request 合法域名
3. 添加后端 API 地址：`https://your-domain.com`

### 3. 修改 API 地址

编辑 `miniprogram/app.js`:

```javascript
globalData: {
  baseUrl: 'https://your-domain.com/api',  // 修改为实际域名
  // ...
}
```

### 4. 上传代码

1. 在开发者工具中点击"上传"
2. 填写版本号和备注
3. 提交审核

### 5. 发布上线

1. 登录微信公众平台
2. 版本管理 → 审核版本 → 提交发布
3. 发布后用户即可搜索使用

---

## 三、MongoDB 配置

### 本地开发

```bash
# 安装 MongoDB (macOS)
brew install mongodb-community
brew services start mongodb-community

# 连接测试
mongosh mongodb://localhost:27017/fitness_checkin
```

### 生产环境 (MongoDB Atlas)

1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建集群和数据库用户
3. 获取连接字符串
4. 更新 `.env` 中的 `MONGODB_URI`

示例:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fitness_checkin?retryWrites=true&w=majority
```

---

## 四、微信小程序配置

### 1. 注册小程序

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号
3. 完成开发者认证

### 2. 获取 AppID 和 Secret

1. 开发 → 开发管理 → 开发设置
2. 记录 AppID(小程序 ID)
3. 开发 → 开发者工具 → 扫码绑定开发者
4. 生成并记录 AppSecret

### 3. 配置服务器域名

request 合法域名:
- `https://your-domain.com`

uploadFile 合法域名 (如需上传图片):
- `https://your-domain.com`

downloadFile 合法域名 (如需下载文件):
- `https://your-domain.com`

### 4. 开通微信运动接口

1. 功能 → 我的功能 → 添加功能
2. 搜索"微信运动"
3. 申请开通 (需要类目符合要求)

---

## 五、HTTPS 证书配置

### 使用 Let's Encrypt (免费)

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 六、健康检查

### API 健康检查

```bash
curl https://your-domain.com/health
```

预期响应:
```json
{
  "status": "ok",
  "timestamp": "2026-03-13T13:00:00.000Z",
  "uptime": 3600
}
```

### MongoDB 连接检查

```bash
mongosh mongodb://localhost:27017/fitness_checkin --eval "db.stats()"
```

---

## 七、常见问题

### 1. 微信登录失败

- 检查 AppID 和 Secret 是否正确
- 确认小程序已发布或处于开发版
- 检查用户是否在体验者名单中

### 2. 运动数据解密失败

- 确认 session_key 未过期
- 检查 encryptedData 和 iv 格式
- 验证 watermark 中的 appid

### 3. MongoDB 连接失败

- 检查 MongoDB 服务是否运行
- 验证连接字符串格式
- 确认防火墙允许连接

### 4. HTTPS 证书问题

- 证书是否过期
- 域名是否匹配
- 中间证书是否完整

---

## 八、监控与日志

### 使用 PM2 查看日志

```bash
pm2 logs fitness-checkin
pm2 monit
```

### 使用 MongoDB 监控

```javascript
// 查看慢查询
db.setProfileLevel(1, { slowms: 100 });
db.system.profile.find().sort({$natural:-1}).limit(5);
```

---

## 九、备份策略

### MongoDB 备份

```bash
# 导出数据库
mongodump --uri="mongodb://localhost:27017/fitness_checkin" --out=/backup/mongodb

# 导入数据库
mongorestore --uri="mongodb://localhost:27017/fitness_checkin" /backup/mongodb
```

### 定时备份脚本

```bash
# crontab -e
0 2 * * * /usr/bin/mongodump --uri="mongodb://localhost:27017/fitness_checkin" --out=/backup/mongodb/$(date +\%Y\%m\%d)
```

---

## 十、性能优化

### 1. 数据库索引

确保以下字段已建立索引:
- `User.openid` (唯一索引)
- `SportsData.userId + date` (复合索引)
- `Checkin.userId + date` (复合索引)

### 2. 缓存策略

- 使用 Redis 缓存 session_key
- 缓存用户信息 (TTL: 1 小时)
- 缓存排行榜数据 (TTL: 5 分钟)

### 3. CDN 加速

- 头像图片使用 CDN
- 静态资源使用 CDN

---

## 联系支持

如有问题，请查看:
- 项目文档：`docs/README.md`
- API 文档：后端路由注释
- 微信小程序文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
