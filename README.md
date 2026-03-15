# 微信运动打卡小程序

基于微信小程序的运动打卡应用，支持获取微信运动步数、每日打卡、排行榜等功能。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D5.0-brightgreen.svg)

---

## 📱 功能特性

### 核心功能
- ✅ **微信登录** - 一键授权登录
- ✅ **运动同步** - 自动获取微信运动步数
- ✅ **每日打卡** - 记录每日运动情况
- ✅ **心情记录** - 选择心情 + 备注
- ✅ **打卡历史** - 查看历史打卡记录
- ✅ **数据统计** - 累计/连续打卡统计
- ✅ **排行榜** - 步数/打卡/连续打卡榜单
- ✅ **等级系统** - 运动萌芽 → 运动大师

### 技术亮点
- 🔐 **JWT 认证** - 安全的 Token 机制
- 🔓 **数据解密** - 微信运动数据解密
- 📊 **MongoDB** - 灵活的文档数据库
- 🚀 **Express** - 轻量级 Node.js 框架
- 📦 **Docker** - 容器化部署
- 🔄 **PM2** - 进程管理

---

## 🏗️ 项目结构

```
wechat_fitness_checkin/
├── miniprogram/              # 小程序前端
│   ├── app.js               # 应用入口
│   ├── app.json             # 全局配置
│   ├── app.wxss             # 全局样式
│   ├── pages/               # 页面目录
│   │   ├── index/           # 首页
│   │   ├── checkin/         # 打卡页
│   │   ├── history/         # 记录页
│   │   ├── rank/            # 排行页
│   │   └── profile/         # 个人页
│   ├── utils/               # 工具函数
│   └── project.config.json  # 项目配置
│
├── server/                   # Node.js 后端
│   ├── server.js            # 服务入口
│   ├── package.json         # 依赖配置
│   ├── ecosystem.config.js  # PM2 配置
│   ├── models/              # 数据模型
│   │   ├── User.js          # 用户模型
│   │   ├── SportsData.js    # 运动数据模型
│   │   └── Checkin.js       # 打卡记录模型
│   ├── routes/              # API 路由
│   │   ├── auth.js          # 认证接口
│   │   ├── sports.js        # 运动接口
│   │   ├── checkin.js       # 打卡接口
│   │   └── rank.js          # 排行接口
│   ├── middleware/          # 中间件
│   │   └── auth.js          # JWT 认证
│   └── utils/               # 工具函数
│       └── wechat.js        # 微信 API 封装
│
└── docs/                     # 文档
    ├── README.md            # 项目说明
    ├── API.md               # API 文档
    ├── DEPLOY.md            # 部署文档
    └── DOCKER.md            # Docker 文档
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MongoDB >= 5.0
- 微信开发者工具
- 微信小程序账号

### 1. 克隆项目

```bash
git clone https://github.com/your-repo/wechat_fitness_checkin.git
cd wechat_fitness_checkin
```

### 2. 安装后端依赖

```bash
cd server
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入微信 AppID、Secret 等配置
```

### 4. 启动 MongoDB

```bash
# macOS (Homebrew)
brew services start mongodb-community

# 或直接运行
mongod --config /usr/local/etc/mongod.conf
```

### 5. 启动后端服务

```bash
# 开发环境
npm run dev

# 生产环境
npm start

# 使用 PM2
pm2 start ecosystem.config.js
```

### 6. 导入小程序

1. 打开微信开发者工具
2. 导入项目，选择 `miniprogram/` 目录
3. 填写 AppID
4. 修改 `app.js` 中的 `baseUrl` 为后端地址

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [API 文档](docs/API.md) | 接口详细说明 |
| [部署文档](docs/DEPLOY.md) | 生产环境部署 |
| [Docker 文档](docs/DOCKER.md) | 容器化部署 |

---

## 🔌 API 接口

### 认证接口
- `POST /api/auth/login` - 微信登录
- `POST /api/auth/validate` - 验证 Token
- `POST /api/auth/userinfo` - 更新用户信息

### 运动接口
- `POST /api/sports/sync` - 同步运动数据
- `GET /api/sports/today` - 今日运动数据
- `GET /api/sports/history` - 运动历史
- `GET /api/sports/statistics` - 统计数据

### 打卡接口
- `POST /api/checkin/today` - 今日打卡
- `GET /api/checkin/today` - 打卡状态
- `GET /api/checkin/history` - 打卡历史
- `GET /api/checkin/statistics` - 打卡统计

### 排行接口
- `GET /api/rank/list` - 排行榜
- `GET /api/rank/friends` - 好友排行
- `GET /api/rank/week` - 周榜
- `GET /api/rank/month` - 月榜

详细文档：[docs/API.md](docs/API.md)

---

## 📊 数据模型

### User (用户)
```javascript
{
  openid: String,          // 微信 openid
  nickname: String,        // 昵称
  avatar: String,          // 头像
  totalSteps: Number,      // 总步数
  totalCheckinDays: Number, // 总打卡天数
  continuousCheckinDays: Number // 连续打卡天数
}
```

### SportsData (运动数据)
```javascript
{
  userId: ObjectId,        // 用户 ID
  date: String,            // 日期 (YYYY-MM-DD)
  stepCount: Number,       // 步数
  distance: Number,        // 距离 (km)
  calorie: Number          // 卡路里
}
```

### Checkin (打卡记录)
```javascript
{
  userId: ObjectId,        // 用户 ID
  date: String,            // 日期
  stepCount: Number,       // 步数
  mood: String,            // 心情
  note: String,            // 备注
  checkinTime: Date        // 打卡时间
}
```

---

## 🎨 界面预览

### 首页
- 用户信息展示
- 今日步数统计
- 快捷操作入口

### 打卡页
- 心情选择器
- 备注输入
- 打卡日历

### 记录页
- 统计概览
- 日期筛选
- 历史列表

### 排行页
- 我的排名
- 三种榜单
- 实时更新

### 个人页
- 用户信息
- 等级展示
- 功能菜单

---

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| **前端** | 微信小程序 |
| **后端** | Node.js + Express |
| **数据库** | MongoDB |
| **认证** | JWT |
| **部署** | Docker + PM2 |
| **反向代理** | Nginx |

---

## 📝 开发计划

### 已完成
- [x] 用户认证系统
- [x] 运动数据同步
- [x] 打卡功能
- [x] 历史记录
- [x] 排行榜
- [x] 等级系统

### 进行中
- [ ] 成就徽章系统
- [ ] 好友关注功能
- [ ] 打卡分享

### 计划中
- [ ] 运动目标设定
- [ ] 数据分析报表
- [ ] 消息推送
- [ ] 多语言支持

---

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 👥 联系方式

- 作者：工部
- 项目：微信运动打卡小程序
- 版本：1.0.0

---

## 🙏 致谢

感谢以下开源项目:
- [微信小程序官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)

---

**⭐ 如果这个项目对你有帮助，请给一个 Star!**
