// routes/achievement.js - 成就系统路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
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
 * GET /api/achievement/list
 * 获取所有成就列表
 */
router.get('/list', async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = {};
    if (type) {
      query.type = type;
    }

    const achievements = await Achievement.find(query)
      .sort({ sortOrder: 1, level: 1 })
      .select('-__v');

    res.json({
      list: achievements.map(a => ({
        achievementId: a.achievementId,
        name: a.name,
        description: a.description,
        icon: a.icon,
        type: a.type,
        level: a.level,
        conditionType: a.conditionType,
        conditionValue: a.conditionValue,
        points: a.points,
        isHidden: a.isHidden
      }))
    });

  } catch (error) {
    console.error('获取成就列表错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/achievement/my
 * 获取我的成就
 */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const { type } = req.query;

    // 获取用户所有成就记录
    let query = { userId: req.userId };
    const userAchievements = await UserAchievement.find(query)
      .sort({ achievedAt: -1 });

    const achievedIds = userAchievements.map(ua => ua.achievementId);

    // 获取所有成就
    let achievementQuery = {};
    if (type) {
      achievementQuery.type = type;
    }
    
    const allAchievements = await Achievement.find(achievementQuery)
      .sort({ sortOrder: 1, level: 1 });

    // 合并数据
    const list = allAchievements.map(a => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === a.achievementId);
      return {
        achievementId: a.achievementId,
        name: a.name,
        description: a.description,
        icon: a.icon,
        type: a.type,
        level: a.level,
        conditionType: a.conditionType,
        conditionValue: a.conditionValue,
        points: a.points,
        isHidden: a.isHidden && !userAchievement, // 未达成时隐藏
        achieved: !!userAchievement,
        achievedAt: userAchievement ? userAchievement.achievedAt : null,
        rewardClaimed: userAchievement ? userAchievement.rewardClaimed : false
      };
    });

    // 计算统计
    const totalAchieved = userAchievements.length;
    const totalPoints = await UserAchievement.getTotalPointsByUser(req.userId, Achievement);
    const totalAchievements = allAchievements.length;
    const progress = totalAchievements > 0 ? Math.round((totalAchieved / totalAchievements) * 100) : 0;

    res.json({
      totalAchieved,
      totalAchievements,
      totalPoints,
      progress,
      list
    });

  } catch (error) {
    console.error('获取我的成就错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/achievement/stats
 * 获取成就统计
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userAchievements = await UserAchievement.findByUser(req.userId);
    const totalAchieved = userAchievements.length;
    const totalPoints = await UserAchievement.getTotalPointsByUser(req.userId, Achievement);

    // 按类型统计
    const achievedIds = userAchievements.map(ua => ua.achievementId);
    const achievements = await Achievement.find({ achievementId: { $in: achievedIds } });

    const statsByType = {
      step: 0,
      checkin: 0,
      continuous: 0,
      special: 0
    };

    const statsByLevel = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    };

    achievements.forEach(a => {
      if (statsByType[a.type] !== undefined) statsByType[a.type]++;
      if (statsByLevel[a.level] !== undefined) statsByLevel[a.level]++;
    });

    res.json({
      totalAchieved,
      totalPoints,
      statsByType,
      statsByLevel,
      recentAchievements: userAchievements.slice(0, 5)
    });

  } catch (error) {
    console.error('获取成就统计错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * POST /api/achievement/claim/:achievementId
 * 领取成就奖励
 */
router.post('/claim/:achievementId', authMiddleware, async (req, res) => {
  try {
    const { achievementId } = req.params;

    // 检查成就是否已达成
    const userAchievement = await UserAchievement.findOne({
      userId: req.userId,
      achievementId
    });

    if (!userAchievement) {
      return res.status(400).json({ message: '成就未达成' });
    }

    if (userAchievement.rewardClaimed) {
      return res.status(400).json({ message: '奖励已领取' });
    }

    // 领取奖励
    const updated = await UserAchievement.claimReward(req.userId, achievementId);
    
    // 获取成就信息
    const achievement = await Achievement.findOne({ achievementId });

    res.json({
      message: '领取成功',
      points: achievement.points,
      claimedAt: updated.rewardClaimedAt
    });

  } catch (error) {
    console.error('领取成就奖励错误:', error.message);
    res.status(500).json({ message: '领取失败' });
  }
});

/**
 * POST /api/achievement/check
 * 检查新成就 (在打卡/同步时调用)
 */
router.post('/check', authMiddleware, async (req, res) => {
  try {
    // 获取用户统计数据
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const today = new Date().toISOString().split('T')[0];
    const todaySports = await SportsData.findOne({ userId: req.userId, date: today });

    const userStats = {
      totalSteps: user.totalSteps,
      totalCheckinDays: user.totalCheckinDays,
      continuousCheckinDays: user.continuousCheckinDays,
      todaySteps: todaySports ? todaySports.stepCount : 0
    };

    // 获取所有成就
    const allAchievements = await Achievement.find();
    
    // 获取用户已达成就
    const userAchievements = await UserAchievement.find({ userId: req.userId })
      .select('achievementId');
    const achievedIds = new Set(userAchievements.map(ua => ua.achievementId));

    // 检查新成就
    const newAchievements = [];

    for (const achievement of allAchievements) {
      // 跳过已达成的
      if (achievedIds.has(achievement.achievementId)) {
        continue;
      }

      // 检查是否达成
      let isAchieved = false;

      switch (achievement.conditionType) {
        case 'total_steps':
          isAchieved = userStats.totalSteps >= achievement.conditionValue;
          break;
        case 'daily_steps':
          isAchieved = userStats.todaySteps >= achievement.conditionValue;
          break;
        case 'total_checkin':
          isAchieved = userStats.totalCheckinDays >= achievement.conditionValue;
          break;
        case 'continuous_checkin':
          isAchieved = userStats.continuousCheckinDays >= achievement.conditionValue;
          break;
        case 'special':
          // 特殊成就需要单独逻辑
          isAchieved = await checkSpecialAchievement(req.userId, achievement, userStats);
          break;
      }

      if (isAchieved) {
        // 添加成就
        const userAchievement = await UserAchievement.addAchievement(
          req.userId,
          achievement.achievementId,
          userStats
        );

        if (userAchievement) {
          newAchievements.push({
            achievementId: achievement.achievementId,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            level: achievement.level,
            points: achievement.points,
            achievedAt: userAchievement.achievedAt
          });

          // 更新用户总成就点数
          await User.findByIdAndUpdate(req.userId, {
            $inc: { achievementPoints: achievement.points }
          });
        }
      }
    }

    res.json({
      newAchievements,
      count: newAchievements.length
    });

  } catch (error) {
    console.error('检查成就错误:', error.message);
    res.status(500).json({ message: '检查失败' });
  }
});

/**
 * GET /api/achievement/recent
 * 获取最近达成的成就
 */
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const recent = await UserAchievement.getRecentAchievements(req.userId, parseInt(limit));

    const achievements = await Achievement.find({
      achievementId: { $in: recent.map(r => r.achievementId) }
    });

    const list = recent.map(r => {
      const achievement = achievements.find(a => a.achievementId === r.achievementId);
      return {
        achievementId: r.achievementId,
        name: achievement?.name || '未知成就',
        icon: achievement?.icon || '🏅',
        level: achievement?.level || 'bronze',
        points: achievement?.points || 0,
        achievedAt: r.achievedAt
      };
    });

    res.json({ list });

  } catch (error) {
    console.error('获取最近成就错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

// 辅助函数：检查特殊成就
async function checkSpecialAchievement(userId, achievement, userStats) {
  // 早起鸟儿 - 早上 6 点前打卡
  if (achievement.achievementId === 'special_early_bird') {
    const todayCheckin = await Checkin.findTodayByUser(userId);
    if (todayCheckin) {
      const hour = new Date(todayCheckin.checkinTime).getHours();
      return hour < 6;
    }
    return false;
  }

  // 夜猫子 - 晚上 11 点后打卡
  if (achievement.achievementId === 'special_night_owl') {
    const todayCheckin = await Checkin.findTodayByUser(userId);
    if (todayCheckin) {
      const hour = new Date(todayCheckin.checkinTime).getHours();
      return hour >= 23;
    }
    return false;
  }

  // 完美月度 - 单月每天打卡
  if (achievement.achievementId === 'special_perfect_month') {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const checkins = await Checkin.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      status: 'success'
    });

    return checkins.length === daysInMonth;
  }

  return false;
}

module.exports = router;
