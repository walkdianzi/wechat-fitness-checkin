# 微信运动打卡 - 配置指南

## ⚠️ 必须配置的项目

### 1. 小程序 AppID 配置

在 **微信开发者工具** 中：
1. 打开项目
2. 点击右上角 **详情**
3. 复制你的 **AppID**

或者登录 https://mp.weixin.qq.com 查看

### 2. 修改 project.config.json

```json
{
  "appid": "你的真实 AppID",  // 替换 wxXXXXXXXXXXXXXXX
  "projectname": "wechat-fitness-checkin",
  ...
}
```

### 3. 修改 app.js 中的服务器地址

编辑 `miniprogram/app.js`，找到：
```javascript
baseUrl: 'https://your-domain.com/api'
```

改为你的实际服务器地址，例如：
```javascript
baseUrl: 'http://localhost:3000/api'  // 本地开发
// 或
baseUrl: 'https://api.yourdomain.com/api'  // 生产环境
```

### 4. 配置后端 .env 文件

编辑 `server/.env`：

```bash
# 微信小程序配置（必须修改！）
WECHAT_APPID=你的 AppID
WECHAT_SECRET=你的小程序 Secret（在微信公众平台获取）

# MongoDB 连接
MONGODB_URI=mongodb://localhost:27017/fitness_checkin
# 或使用 MongoDB Atlas：
# MONGODB_URI=mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/fitness_checkin

# JWT 配置（建议修改为随机字符串）
JWT_SECRET=your_random_secret_key_here_12345
```

### 5. 微信公众平台配置

登录 https://mp.weixin.qq.com：

1. **开发** → **开发管理** → **开发设置**
   - 复制 AppID 和 AppSecret

2. **开发** → **开发管理** → **服务器域名**
   - 配置 `request` 合法域名（你的后端服务器地址）
   - 例如：`https://api.yourdomain.com`

### 6. 真机调试注意事项

**本地开发：**
- 开发者工具 → 右上角 **详情** → 勾选 **不校验合法域名**
- app.js 中使用 `http://本地 IP:3000/api`

**生产环境：**
- 必须使用 HTTPS
- 必须在微信公众平台配置域名白名单

---

## 🚀 快速启动

### 后端服务
```bash
cd server
npm install
# 编辑 .env 配置
npm start
```

### 小程序
1. 微信开发者工具打开项目
2. 修改上述配置
3. 编译 → 预览/真机调试

---

## 📝 检查清单

- [ ] AppID 已替换（project.config.json）
- [ ] AppID 已配置（server/.env）
- [ ] AppSecret 已配置（server/.env）
- [ ] 服务器地址已配置（app.js）
- [ ] MongoDB 已连接
- [ ] 后端服务已启动
- [ ] 域名已配置（生产环境）
