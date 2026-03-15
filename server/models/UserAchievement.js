// models/UserAchievement.js - 用户成就关联模型
const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  // 用户 ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 成就 ID
  achievementId: {
    type: String,
    required: true,
    index: true
  },
  // 达成时间
  achievedAt: {
    type: Date,
    default: Date.now
  },
  // 达成时的数据快照
  snapshot: {
    totalSteps: Number,
    totalCheckinDays: Number,
    continuousCheckinDays: Number,
    todaySteps: Number
  },
  // 是否已领取奖励
  rewardClaimed: {
    type: Boolean,
    default: false
  },
  // 领取奖励时间
  rewardClaimedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 复合索引：用户 + 成就
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// 静态方法：获取用户已达成就
userAchievementSchema.statics.findByUser = async function(userId) {
  return await this.find({ userId })
    .sort({ achievedAt: -1 })
    .populate({
      path: 'userId',
      select: 'nickname avatar'
    });
};

// 静态方法：获取用户成就数量
userAchievementSchema.statics.countByUser = async function(userId) {
  return await this.countDocuments({ userId });
};

// 静态方法：获取用户成就点数总和
userAchievementSchema.statics.getTotalPointsByUser = async function(userId, Achievement) {
  const userAchievements = await this.find({ userId }).select('achievementId');
  const achievementIds = userAchievements.map(ua => ua.achievementId);
  
  const achievements = await Achievement.find({ achievementId: { $in: achievementIds } })
    .select('points');
  
  return achievements.reduce((sum, a) => sum + a.points, 0);
};

// 静态方法：添加用户成就
userAchievementSchema.statics.addAchievement = async function(userId, achievementId, snapshot = {}) {
  try {
    const userAchievement = await this.findOneAndUpdate(
      { userId, achievementId },
      {
        $setOnInsert: {
          achievedAt: new Date(),
          snapshot
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    return userAchievement;
  } catch (error) {
    if (error.code === 11000) {
      // 已存在，忽略
      return null;
    }
    throw error;
  }
};

// 静态方法：检查用户是否已达成某成就
userAchievementSchema.statics.hasAchievement = async function(userId, achievementId) {
  const count = await this.countDocuments({ userId, achievementId });
  return count > 0;
};

// 静态方法：领取奖励
userAchievementSchema.statics.claimReward = async function(userId, achievementId) {
  return await this.findOneAndUpdate(
    { userId, achievementId },
    {
      $set: {
        rewardClaimed: true,
        rewardClaimedAt: new Date()
      }
    },
    { new: true }
  );
};

// 静态方法：获取用户最近达成的成就
userAchievementSchema.statics.getRecentAchievements = async function(userId, limit = 5) {
  return await this.find({ userId })
    .sort({ achievedAt: -1 })
    .limit(limit)
    .populate({
      path: 'userId',
      select: 'nickname avatar'
    });
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
