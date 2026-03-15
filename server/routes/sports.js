// routes/sports.js - 运动数据路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SportsData = require('../models/SportsData');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const WECHAT_APPID = process.env.WECHAT_APPID;

// 认证中间件
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未提供 token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'token 无效或已过期' });
  }
};

/**
 * POST /api/sports/sync
 * 同步微信运动数据
 */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { encryptedData, iv } = req.body;

    if (!encryptedData || !iv) {
      return res.status(400).json({ message: '缺少 encryptedData 或 iv 参数' });
    }

    // 获取用户的 session_key (实际应用中应从缓存或数据库获取)
    // 这里简化处理，实际应该从 Redis 等缓存中获取
    const sessionKey = await getSessionKey(req.openid);

    if (!sessionKey) {
      return res.status(401).json({ message: '请先重新登录' });
    }

    // 解密微信运动数据
    const decodedData = decryptWeRunData(encryptedData, sessionKey, iv);

    if (!decodedData) {
      return res.status(400).json({ message: '数据解密失败' });
    }

    const { stepCount, date } = decodedData;

    // 保存或更新运动数据
    const sportsData = await SportsData.upsertByUserAndDate(req.userId, date, {
      stepCount,
      distance: Math.round(stepCount * 0.00075 * 1000) / 1000,
      calorie: Math.round(stepCount * 0.04),
      source: 'wechat',
      rawData: decodedData
    });

    // 更新用户总步数
    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalSteps: stepCount },
      lastSyncTime: new Date()
    });

    res.json({
      message: '同步成功',
      stepCount,
      distance: sportsData.distance,
      calorie: sportsData.calorie,
      date
    });

  } catch (error) {
    console.error('同步运动数据错误:', error.message);
    res.status(500).json({ message: '同步失败，请稍后重试' });
  }
});

/**
 * GET /api/sports/history
 * 获取运动历史记录
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    const history = await SportsData.findByUser(req.userId, startDate, endDate, parseInt(limit));

    res.json({
      list: history.map(item => ({
        date: item.date,
        stepCount: item.stepCount,
        distance: item.distance,
        calorie: item.calorie,
        source: item.source,
        syncTime: item.syncTime
      }))
    });

  } catch (error) {
    console.error('获取历史记录错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/sports/today
 * 获取今日运动数据
 */
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sportsData = await SportsData.findByUserAndDate(req.userId, today);

    if (!sportsData) {
      return res.json({
        stepCount: 0,
        distance: 0,
        calorie: 0,
        isSynced: false
      });
    }

    res.json({
      stepCount: sportsData.stepCount,
      distance: sportsData.distance,
      calorie: sportsData.calorie,
      syncTime: sportsData.syncTime,
      isSynced: true
    });

  } catch (error) {
    console.error('获取今日数据错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/sports/statistics
 * 获取统计数据
 */
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString().split('T')[0];

    const history = await SportsData.findByUser(req.userId, startDateStr, null, parseInt(days));

    if (history.length === 0) {
      return res.json({
        totalSteps: 0,
        avgSteps: 0,
        maxSteps: 0,
        totalDistance: 0,
        totalCalorie: 0,
        days
      });
    }

    const totalSteps = history.reduce((sum, item) => sum + item.stepCount, 0);
    const totalDistance = history.reduce((sum, item) => sum + item.distance, 0);
    const totalCalorie = history.reduce((sum, item) => sum + item.calorie, 0);
    const maxSteps = Math.max(...history.map(item => item.stepCount));

    res.json({
      totalSteps,
      avgSteps: Math.round(totalSteps / history.length),
      maxSteps,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalCalorie,
      days: history.length,
      period: `${days}天`
    });

  } catch (error) {
    console.error('获取统计数据错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

// 辅助函数：获取 session_key
async function getSessionKey(openid) {
  // TODO: 实际应用中应该从 Redis 缓存中获取
  // 这里返回 null，实际使用时需要在登录时将 session_key 存入缓存
  return null;
}

// 辅助函数：解密微信运动数据
function decryptWeRunData(encryptedData, sessionKey, iv) {
  try {
    // base64 解码
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    // AES 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedDataBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    // 验证 watermark
    if (data.watermark && data.watermark.appid !== WECHAT_APPID) {
      return null;
    }

    return {
      stepCount: data.stepInfo[0].step || 0,
      date: formatDate(new Date(data.stepInfo[0].timestamp * 1000)),
      rawData: data
    };

  } catch (error) {
    console.error('解密失败:', error.message);
    return null;
  }
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = router;
