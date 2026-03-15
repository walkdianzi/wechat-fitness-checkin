// routes/checkin.js - 打卡路由
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Checkin = require('../models/Checkin');
const SportsData = require('../models/SportsData');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

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
 * POST /api/checkin/today
 * 今日打卡
 */
router.post('/today', authMiddleware, async (req, res) => {
  try {
    const { note = '', mood = '😄' } = req.body;

    // 获取今日运动数据
    const today = new Date().toISOString().split('T')[0];
    const sportsData = await SportsData.findByUserAndDate(req.userId, today);

    if (!sportsData || sportsData.stepCount === 0) {
      return res.status(400).json({ 
        message: '请先同步运动数据后再打卡' 
      });
    }

    // 创建打卡记录
    const checkin = await Checkin.createCheckin(
      req.userId,
      sportsData.stepCount,
      note,
      mood
    );

    // 更新用户打卡统计
    const continuousDays = await Checkin.getContinuousDays(req.userId);
    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalCheckinDays: 1, continuousCheckinDays: 1 },
      lastCheckinDate: new Date()
    });

    // 检查新成就
    const newAchievements = await checkNewAchievements(req.userId);

    res.json({
      message: '打卡成功',
      checkin: {
        id: checkin._id,
        date: checkin.date,
        stepCount: checkin.stepCount,
        checkinTime: checkin.checkinTime,
        note: checkin.note,
        mood: checkin.mood,
        continuousDays
      },
      newAchievements
    });

  } catch (error) {
    console.error('打卡错误:', error.message);
    if (error.message === '今日已打卡') {
      return res.status(400).json({ message: '今日已打卡，请勿重复打卡' });
    }
    res.status(500).json({ message: '打卡失败，请稍后重试' });
  }
});

/**
 * GET /api/checkin/today
 * 获取今日打卡状态
 */
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkin = await Checkin.findTodayByUser(req.userId);

    if (!checkin) {
      return res.json({
        isCheckedIn: false,
        canCheckin: true
      });
    }

    res.json({
      isCheckedIn: true,
      checkin: {
        id: checkin._id,
        date: checkin.date,
        stepCount: checkin.stepCount,
        checkinTime: checkin.checkinTime,
        note: checkin.note,
        mood: checkin.mood
      }
    });

  } catch (error) {
    console.error('获取打卡状态错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/checkin/history
 * 获取打卡历史
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    const history = await Checkin.findByUser(req.userId, startDate, endDate, parseInt(limit));

    res.json({
      list: history.map(item => item.toDisplayObject())
    });

  } catch (error) {
    console.error('获取历史记录错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * GET /api/checkin/statistics
 * 获取打卡统计
 */
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const continuousDays = await Checkin.getContinuousDays(req.userId);

    res.json({
      totalCheckinDays: user.totalCheckinDays,
      continuousCheckinDays: continuousDays,
      lastCheckinDate: user.lastCheckinDate,
      level: user.level,
      streak: continuousDays >= 7 ? true : false
    });

  } catch (error) {
    console.error('获取统计错误:', error.message);
    res.status(500).json({ message: '获取失败' });
  }
});

/**
 * PUT /api/checkin/:id
 * 更新打卡记录
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { note, mood } = req.body;

    const checkin = await Checkin.findOne({ _id: id, userId: req.userId });
    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    if (note !== undefined) checkin.note = note;
    if (mood !== undefined) checkin.mood = mood;

    await checkin.save();

    res.json({
      message: '更新成功',
      checkin: checkin.toDisplayObject()
    });

  } catch (error) {
    console.error('更新打卡记录错误:', error.message);
    res.status(500).json({ message: '更新失败' });
  }
});

/**
 * DELETE /api/checkin/:id
 * 删除打卡记录
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const checkin = await Checkin.findOneAndDelete({ _id: id, userId: req.userId });
    if (!checkin) {
      return res.status(404).json({ message: '打卡记录不存在' });
    }

    // 更新用户统计
    await User.findByIdAndUpdate(req.userId, {
      $inc: { totalCheckinDays: -1, continuousCheckinDays: -1 }
    });

    res.json({ message: '删除成功' });

  } catch (error) {
    console.error('删除打卡记录错误:', error.message);
    res.status(500).json({ message: '删除失败' });
  }
});

// 辅助函数：检查新成就
async function checkNewAchievements(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];
    const todaySports = await SportsData.findOne({ userId, date: today });

    const userStats = {
      totalSteps: user.totalSteps,
      totalCheckinDays: user.totalCheckinDays,
      continuousCheckinDays: user.continuousCheckinDays,
      todaySteps: todaySports ? todaySports.stepCount : 0
    };

    const allAchievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ userId }).select('achievementId');
    const achievedIds = new Set(userAchievements.map(ua => ua.achievementId));

    const newAchievements = [];

    for (const achievement of allAchievements) {
      if (achievedIds.has(achievement.achievementId)) continue;

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
      }

      if (isAchieved) {
        const userAchievement = await UserAchievement.addAchievement(
          userId,
          achievement.achievementId,
          userStats
        );

        if (userAchievement) {
          await User.findByIdAndUpdate(userId, {
            $inc: { achievementPoints: achievement.points }
          });

          newAchievements.push({
            achievementId: achievement.achievementId,
            name: achievement.name,
            icon: achievement.icon,
            points: achievement.points
          });
        }
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('检查成就错误:', error.message);
    return [];
  }
}

module.exports = router;
