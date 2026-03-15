// routes/rank.js - 排行榜路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SportsData = require('../models/SportsData');
const Checkin = require('../models/Checkin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
 * GET /api/rank/list
 * 获取排行榜列表
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { type = 'steps', days = 7, limit = 50 } = req.query;

    let rankList = [];

    if (type === 'steps') {
      // 步数排行榜
      rankList = await getStepsRank(days, parseInt(limit));
    } else if (type === 'checkin') {
      // 打卡排行榜
      rankList = await getCheckinRank(days, parseInt(limit));
    } else if (type === 'continuous') {
      // 连续打卡排行榜
      rankList = await getContinuousRank(parseInt(limit));
    }

    // 找出当前用户的排名
    const userRank = rankList.findIndex(item => item.userId === req.userId.toString()) + 1;

    res.json({
      type,
      period: `${days}天`,
      userRank: userRank > 0 ? userRank : null,
      list: rankList.slice(0, 10) // 只返回前 10 名
    });

  } catch (error) {
    console.error('获取排行榜错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/rank/friends
 * 获取好友排行榜
 */
router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const { type = 'steps', days = 7, limit = 20 } = req.query;

    // TODO: 实际应用中应该获取用户的好友列表
    // 这里简化为返回所有用户
    let rankList = [];

    if (type === 'steps') {
      rankList = await getStepsRank(days, parseInt(limit));
    } else if (type === 'checkin') {
      rankList = await getCheckinRank(days, parseInt(limit));
    }

    res.json({
      type,
      period: `${days}天`,
      list: rankList
    });

  } catch (error) {
    console.error('获取好友排行错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/rank/week
 * 获取周榜
 */
router.get('/week', authMiddleware, async (req, res) => {
  try {
    const { type = 'steps' } = req.query;
    
    // 计算本周一和周日
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];

    let rankList = [];

    if (type === 'steps') {
      rankList = await getStepsRankWithDateRange(startDate, endDate, 50);
    }

    res.json({
      type,
      period: `本周 (${startDate} ~ ${endDate})`,
      list: rankList.slice(0, 10)
    });

  } catch (error) {
    console.error('获取周榜错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/rank/month
 * 获取月榜
 */
router.get('/month', authMiddleware, async (req, res) => {
  try {
    const { type = 'steps' } = req.query;
    
    // 计算本月 1 日和最后一天
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];

    let rankList = [];

    if (type === 'steps') {
      rankList = await getStepsRankWithDateRange(startDate, endDate, 50);
    }

    res.json({
      type,
      period: `本月 (${startDate} ~ ${endDate})`,
      list: rankList.slice(0, 10)
    });

  } catch (error) {
    console.error('获取月榜错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

// 辅助函数：获取步数排行榜
async function getStepsRank(days, limit) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // 聚合查询
  const result = await SportsData.aggregate([
    {
      $match: {
        date: { $gte: startDateStr }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalSteps: { $sum: '$stepCount' },
        avgSteps: { $avg: '$stepCount' },
        days: { $sum: 1 }
      }
    },
    {
      $sort: { totalSteps: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    }
  ]);

  return result.map((item, index) => ({
    rank: index + 1,
    userId: item._id,
    nickname: item.user.nickname,
    avatar: item.user.avatar,
    totalSteps: item.totalSteps,
    avgSteps: Math.round(item.avgSteps),
    days: item.days
  }));
}

// 辅助函数：获取指定日期范围的步数排行
async function getStepsRankWithDateRange(startDate, endDate, limit) {
  const result = await SportsData.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        totalSteps: { $sum: '$stepCount' },
        avgSteps: { $avg: '$stepCount' },
        days: { $sum: 1 }
      }
    },
    {
      $sort: { totalSteps: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    }
  ]);

  return result.map((item, index) => ({
    rank: index + 1,
    userId: item._id,
    nickname: item.user.nickname,
    avatar: item.user.avatar,
    totalSteps: item.totalSteps,
    avgSteps: Math.round(item.avgSteps),
    days: item.days
  }));
}

// 辅助函数：获取打卡排行榜
async function getCheckinRank(days, limit) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const result = await Checkin.aggregate([
    {
      $match: {
        date: { $gte: startDateStr },
        status: 'success'
      }
    },
    {
      $group: {
        _id: '$userId',
        checkinDays: { $sum: 1 },
        totalSteps: { $sum: '$stepCount' }
      }
    },
    {
      $sort: { checkinDays: -1, totalSteps: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    }
  ]);

  return result.map((item, index) => ({
    rank: index + 1,
    userId: item._id,
    nickname: item.user.nickname,
    avatar: item.user.avatar,
    checkinDays: item.checkinDays,
    totalSteps: item.totalSteps
  }));
}

// 辅助函数：获取连续打卡排行榜
async function getContinuousRank(limit) {
  const result = await User.find()
    .sort({ continuousCheckinDays: -1 })
    .limit(limit)
    .select('nickname avatar continuousCheckinDays lastCheckinDate');

  return result.map((user, index) => ({
    rank: index + 1,
    userId: user._id,
    nickname: user.nickname,
    avatar: user.avatar,
    continuousDays: user.continuousCheckinDays,
    lastCheckinDate: user.lastCheckinDate
  }));
}

module.exports = router;
