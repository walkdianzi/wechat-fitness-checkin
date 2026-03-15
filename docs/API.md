# API 接口文档

## 基础信息

- **Base URL**: `https://your-domain.com/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

---

## 认证接口

### 1. 微信登录

**POST** `/auth/login`

**请求参数:**
```json
{
  "code": "微信登录 code"
}
```

**响应:**
```json
{
  "token": "JWT token",
  "userInfo": {
    "id": "用户 ID",
    "openid": "微信 openid",
    "nickname": "昵称",
    "avatar": "头像 URL",
    "gender": 1,
    "city": "城市",
    "province": "省份",
    "totalSteps": 0,
    "totalCheckinDays": 0,
    "continuousCheckinDays": 0,
    "level": "🌱 运动萌芽"
  }
}
```

---

### 2. 验证 Token

**POST** `/auth/validate`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "valid": true,
  "userInfo": { /* 用户信息 */ }
}
```

---

### 3. 更新用户信息

**POST** `/auth/userinfo`

**请求头:**
```
Authorization: Bearer {token}
```

**请求参数:**
```json
{
  "nickname": "新昵称",
  "avatar": "新头像 URL",
  "gender": 1,
  "city": "城市",
  "province": "省份"
}
```

---

## 运动数据接口

### 4. 同步运动数据

**POST** `/sports/sync`

**请求头:**
```
Authorization: Bearer {token}
```

**请求参数:**
```json
{
  "encryptedData": "微信加密数据",
  "iv": "初始向量"
}
```

**响应:**
```json
{
  "message": "同步成功",
  "stepCount": 12345,
  "distance": 9.26,
  "calorie": 494,
  "date": "2026-03-13"
}
```

---

### 5. 获取今日运动数据

**GET** `/sports/today`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "stepCount": 12345,
  "distance": 9.26,
  "calorie": 494,
  "syncTime": "2026-03-13T10:30:00.000Z",
  "isSynced": true
}
```

---

### 6. 获取运动历史

**GET** `/sports/history?startDate=2026-03-01&endDate=2026-03-31&limit=30`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "list": [
    {
      "date": "2026-03-13",
      "stepCount": 12345,
      "distance": 9.26,
      "calorie": 494,
      "source": "wechat",
      "syncTime": "2026-03-13T10:30:00.000Z"
    }
  ]
}
```

---

### 7. 获取统计数据

**GET** `/sports/statistics?days=30`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "totalSteps": 150000,
  "avgSteps": 5000,
  "maxSteps": 15000,
  "totalDistance": 112.5,
  "totalCalorie": 6000,
  "days": 30,
  "period": "30 天"
}
```

---

## 打卡接口

### 8. 今日打卡

**POST** `/checkin/today`

**请求头:**
```
Authorization: Bearer {token}
```

**请求参数:**
```json
{
  "note": "今天运动感觉不错！",
  "mood": "😄"
}
```

**响应:**
```json
{
  "message": "打卡成功",
  "checkin": {
    "id": "打卡 ID",
    "date": "2026-03-13",
    "stepCount": 12345,
    "checkinTime": "2026-03-13T10:30:00.000Z",
    "note": "今天运动感觉不错！",
    "mood": "😄",
    "continuousDays": 7
  }
}
```

---

### 9. 获取今日打卡状态

**GET** `/checkin/today`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "isCheckedIn": true,
  "checkin": {
    "id": "打卡 ID",
    "date": "2026-03-13",
    "stepCount": 12345,
    "checkinTime": "2026-03-13T10:30:00.000Z",
    "note": "今天运动感觉不错！",
    "mood": "😄"
  }
}
```

---

### 10. 获取打卡历史

**GET** `/checkin/history?startDate=2026-03-01&endDate=2026-03-31&limit=30`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "list": [
    {
      "id": "打卡 ID",
      "date": "2026-03-13",
      "stepCount": 12345,
      "checkinTime": "2026-03-13T10:30:00.000Z",
      "note": "今天运动感觉不错！",
      "mood": "😄",
      "isShared": false,
      "likeCount": 0,
      "commentCount": 0
    }
  ]
}
```

---

### 11. 获取打卡统计

**GET** `/checkin/statistics`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "totalCheckinDays": 30,
  "continuousCheckinDays": 7,
  "lastCheckinDate": "2026-03-13",
  "level": "⭐ 运动入门",
  "streak": true
}
```

---

### 12. 更新打卡记录

**PUT** `/checkin/:id`

**请求头:**
```
Authorization: Bearer {token}
```

**请求参数:**
```json
{
  "note": "更新备注",
  "mood": "😊"
}
```

---

### 13. 删除打卡记录

**DELETE** `/checkin/:id`

**请求头:**
```
Authorization: Bearer {token}
```

---

## 排行榜接口

### 14. 获取排行榜

**GET** `/rank/list?type=steps&days=7&limit=50`

**参数说明:**
- `type`: 排行类型 (steps/checkin/continuous)
- `days`: 统计天数
- `limit`: 返回数量

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "type": "steps",
  "period": "7 天",
  "userRank": 15,
  "list": [
    {
      "rank": 1,
      "userId": "用户 ID",
      "nickname": "运动达人",
      "avatar": "头像 URL",
      "totalSteps": 100000,
      "avgSteps": 14285,
      "days": 7
    }
  ]
}
```

---

### 15. 获取好友排行

**GET** `/rank/friends?type=steps&days=7&limit=20`

**请求头:**
```
Authorization: Bearer {token}
```

---

### 16. 获取周榜

**GET** `/rank/week?type=steps`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "type": "steps",
  "period": "本周 (2026-03-10 ~ 2026-03-16)",
  "list": [ /* 排行列表 */ ]
}
```

---

### 17. 获取月榜

**GET** `/rank/month?type=steps`

**请求头:**
```
Authorization: Bearer {token}
```

**响应:**
```json
{
  "type": "steps",
  "period": "本月 (2026-03-01 ~ 2026-03-31)",
  "list": [ /* 排行列表 */ ]
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证/Token 无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应格式:**
```json
{
  "message": "错误描述",
  "code": "错误码"
}
```

---

## 限流说明

- 所有接口：100 次/分钟/IP
- 打卡接口：10 次/分钟/用户
- 同步接口：30 次/分钟/用户

---

## 数据字典

### 心情枚举

| 值 | 说明 |
|----|------|
| 😄 | 开心 |
| 😊 | 满意 |
| 😐 | 一般 |
| 😔 | 失落 |
| 😡 | 生气 |
| 💪 | 加油 |
| 🔥 | 火热 |
| ⭐ | 精彩 |

### 等级配置

| 打卡天数 | 等级 |
|----------|------|
| >= 365 | 🏆 运动大师 |
| >= 180 | 🥇 运动健将 |
| >= 90 | 🥈 运动达人 |
| >= 30 | 🥉 运动新手 |
| >= 7 | ⭐ 运动入门 |
| < 7 | 🌱 运动萌芽 |
