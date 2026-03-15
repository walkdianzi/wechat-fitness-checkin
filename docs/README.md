# 微信运动打卡小程序

## 项目概述

基于微信小程序的运动打卡应用，支持获取微信运动步数、每日打卡、排行榜等功能。

## 技术栈

- **前端**: 微信小程序 (WXML/WXSS/JavaScript)
- **后端**: Node.js + Express
- **数据库**: MongoDB
- **认证**: 微信登录 + JWT

## 功能模块

1. **用户授权登录** - 微信一键登录
2. **运动数据同步** - 获取微信运动步数
3. **每日打卡** - 记录每日运动情况
4. **打卡记录** - 查看历史打卡数据
5. **排行榜** - 好友步数排名

## 目录结构

```
wechat_fitness_checkin/
├── miniprogram/          # 小程序前端
│   ├── pages/           # 页面
│   ├── components/      # 组件
│   ├── utils/           # 工具函数
│   └── app.js           # 入口
├── server/              # 后端服务
│   ├── routes/          # API 路由
│   ├── models/          # 数据模型
│   ├── middleware/      # 中间件
│   └── utils/           # 工具函数
└── docs/                # 文档
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/login | POST | 微信登录 |
| /api/sports/sync | POST | 同步运动数据 |
| /api/checkin/today | POST | 今日打卡 |
| /api/checkin/history | GET | 打卡历史 |
| /api/rank/list | GET | 排行榜 |

## 开发环境

- Node.js >= 16.0.0
- MongoDB >= 5.0
- 微信开发者工具
