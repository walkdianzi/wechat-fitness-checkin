// server.js - 微信运动打卡小程序后端服务
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 导入路由
const authRoutes = require('./routes/auth');
const sportsRoutes = require('./routes/sports');
const checkinRoutes = require('./routes/checkin');
const rankRoutes = require('./routes/rank');
const achievementRoutes = require('./routes/achievement');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 初始化数据库 (lowdb - 无需 MongoDB)
console.log('✅ 数据库已初始化 (lowdb)');

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/rank', rankRoutes);
app.use('/api/achievement', achievementRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err.message);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误'
  });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 服务器启动在端口 ${PORT}`);
  console.log(`📍 健康检查：http://localhost:${PORT}/health`);
});

module.exports = app;
