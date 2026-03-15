// models/Achievement.js - 成就模型
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // 成就 ID (唯一标识)
  achievementId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // 成就名称
  name: {
    type: String,
    required: true
  },
  // 成就描述
  description: {
    type: String,
    required: true
  },
  // 成就图标 (emoji)
  icon: {
    type: String,
    default: '🏅'
  },
  // 成就类型 (step: 步数，checkin: 打卡，continuous: 连续，special: 特殊)
  type: {
    type: String,
    enum: ['step', 'checkin', 'continuous', 'special'],
    required: true
  },
  // 成就等级 (bronze: 铜，silver: 银，gold: 金，platinum: 白金，diamond: 钻石)
  level: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  // 达成条件类型
  conditionType: {
    type: String,
    enum: ['total_steps', 'daily_steps', 'total_checkin', 'continuous_checkin', 'special'],
    required: true
  },
  // 达成条件值
  conditionValue: {
    type: Number,
    required: true
  },
  // 成就点数
  points: {
    type: Number,
    default: 10
  },
  // 是否隐藏 (隐藏成就需要达成后才显示)
  isHidden: {
    type: Boolean,
    default: false
  },
  // 排序权重
  sortOrder: {
    type: Number,
    default: 0
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
achievementSchema.index({ type: 1, level: 1 });
achievementSchema.index({ sortOrder: 1 });

// 静态方法：获取所有成就分类
achievementSchema.statics.getAchievementsByType = async function(type) {
  return await this.find({ type }).sort({ sortOrder: 1, level: 1 });
};

// 静态方法：获取可达成就列表
achievementSchema.statics.getAvailableAchievements = async function() {
  return await this.find({ isHidden: false }).sort({ sortOrder: 1, level: 1 });
};

// 静态方法：初始化默认成就
achievementSchema.statics.initDefaultAchievements = async function() {
  const defaultAchievements = [
    // 步数成就
    {
      achievementId: 'step_newbie',
      name: '新手起步',
      description: '累计行走 10,000 步',
      icon: '👣',
      type: 'step',
      level: 'bronze',
      conditionType: 'total_steps',
      conditionValue: 10000,
      points: 10,
      sortOrder: 100
    },
    {
      achievementId: 'step_walker',
      name: '健走达人',
      description: '累计行走 100,000 步',
      icon: '🚶',
      type: 'step',
      level: 'silver',
      conditionType: 'total_steps',
      conditionValue: 100000,
      points: 20,
      sortOrder: 101
    },
    {
      achievementId: 'step_runner',
      name: '跑步健将',
      description: '累计行走 500,000 步',
      icon: '🏃',
      type: 'step',
      level: 'gold',
      conditionType: 'total_steps',
      conditionValue: 500000,
      points: 50,
      sortOrder: 102
    },
    {
      achievementId: 'step_master',
      name: '运动大师',
      description: '累计行走 1,000,000 步',
      icon: '🏆',
      type: 'step',
      level: 'platinum',
      conditionType: 'total_steps',
      conditionValue: 1000000,
      points: 100,
      sortOrder: 103
    },
    {
      achievementId: 'step_legend',
      name: '传奇之路',
      description: '累计行走 5,000,000 步',
      icon: '⭐',
      type: 'step',
      level: 'diamond',
      conditionType: 'total_steps',
      conditionValue: 5000000,
      points: 200,
      sortOrder: 104,
      isHidden: true
    },
    
    // 每日步数成就
    {
      achievementId: 'daily_5k',
      name: '日行五千',
      description: '单日行走达到 5,000 步',
      icon: '📍',
      type: 'step',
      level: 'bronze',
      conditionType: 'daily_steps',
      conditionValue: 5000,
      points: 5,
      sortOrder: 200
    },
    {
      achievementId: 'daily_10k',
      name: '日行一万',
      description: '单日行走达到 10,000 步',
      icon: '🎯',
      type: 'step',
      level: 'silver',
      conditionType: 'daily_steps',
      conditionValue: 10000,
      points: 10,
      sortOrder: 201
    },
    {
      achievementId: 'daily_20k',
      name: '日行两万',
      description: '单日行走达到 20,000 步',
      icon: '🔥',
      type: 'step',
      level: 'gold',
      conditionType: 'daily_steps',
      conditionValue: 20000,
      points: 25,
      sortOrder: 202
    },
    
    // 打卡成就
    {
      achievementId: 'checkin_first',
      name: '第一次打卡',
      description: '完成第一次打卡',
      icon: '📝',
      type: 'checkin',
      level: 'bronze',
      conditionType: 'total_checkin',
      conditionValue: 1,
      points: 5,
      sortOrder: 300
    },
    {
      achievementId: 'checkin_7days',
      name: '坚持一周',
      description: '累计打卡 7 天',
      icon: '📅',
      type: 'checkin',
      level: 'bronze',
      conditionType: 'total_checkin',
      conditionValue: 7,
      points: 10,
      sortOrder: 301
    },
    {
      achievementId: 'checkin_30days',
      name: '月度达人',
      description: '累计打卡 30 天',
      icon: '🌟',
      type: 'checkin',
      level: 'silver',
      conditionType: 'total_checkin',
      conditionValue: 30,
      points: 30,
      sortOrder: 302
    },
    {
      achievementId: 'checkin_100days',
      name: '百日坚持',
      description: '累计打卡 100 天',
      icon: '💎',
      type: 'checkin',
      level: 'gold',
      conditionType: 'total_checkin',
      conditionValue: 100,
      points: 100,
      sortOrder: 303
    },
    {
      achievementId: 'checkin_365days',
      name: '周年庆典',
      description: '累计打卡 365 天',
      icon: '🎉',
      type: 'checkin',
      level: 'platinum',
      conditionType: 'total_checkin',
      conditionValue: 365,
      points: 365,
      sortOrder: 304
    },
    
    // 连续打卡成就
    {
      achievementId: 'continuous_3days',
      name: '初露锋芒',
      description: '连续打卡 3 天',
      icon: '🔥',
      type: 'continuous',
      level: 'bronze',
      conditionType: 'continuous_checkin',
      conditionValue: 3,
      points: 10,
      sortOrder: 400
    },
    {
      achievementId: 'continuous_7days',
      name: '小试牛刀',
      description: '连续打卡 7 天',
      icon: '⭐',
      type: 'continuous',
      level: 'silver',
      conditionType: 'continuous_checkin',
      conditionValue: 7,
      points: 20,
      sortOrder: 401
    },
    {
      achievementId: 'continuous_21days',
      name: '习惯养成',
      description: '连续打卡 21 天',
      icon: '🏅',
      type: 'continuous',
      level: 'gold',
      conditionType: 'continuous_checkin',
      conditionValue: 21,
      points: 50,
      sortOrder: 402
    },
    {
      achievementId: 'continuous_100days',
      name: '毅力非凡',
      description: '连续打卡 100 天',
      icon: '👑',
      type: 'continuous',
      level: 'platinum',
      conditionType: 'continuous_checkin',
      conditionValue: 100,
      points: 150,
      sortOrder: 403
    },
    
    // 特殊成就
    {
      achievementId: 'special_early_bird',
      name: '早起鸟儿',
      description: '早上 6 点前完成打卡',
      icon: '🌅',
      type: 'special',
      level: 'bronze',
      conditionType: 'special',
      conditionValue: 6,
      points: 15,
      sortOrder: 500
    },
    {
      achievementId: 'special_night_owl',
      name: '夜猫子',
      description: '晚上 11 点后完成打卡',
      icon: '🌙',
      type: 'special',
      level: 'bronze',
      conditionType: 'special',
      conditionValue: 23,
      points: 15,
      sortOrder: 501
    },
    {
      achievementId: 'special_perfect_month',
      name: '完美月度',
      description: '单月每天都能打卡',
      icon: '💯',
      type: 'special',
      level: 'gold',
      conditionType: 'special',
      conditionValue: 0,
      points: 100,
      sortOrder: 502,
      isHidden: true
    }
  ];

  // 批量插入或更新
  for (const achievement of defaultAchievements) {
    await this.findOneAndUpdate(
      { achievementId: achievement.achievementId },
      achievement,
      { upsert: true, new: true }
    );
  }

  return defaultAchievements.length;
};

// 实例方法：检查是否达成
achievementSchema.methods.isAchieved = function(userStats) {
  const { conditionType, conditionValue } = this;

  switch (conditionType) {
    case 'total_steps':
      return userStats.totalSteps >= conditionValue;
    case 'daily_steps':
      return userStats.todaySteps >= conditionValue;
    case 'total_checkin':
      return userStats.totalCheckinDays >= conditionValue;
    case 'continuous_checkin':
      return userStats.continuousCheckinDays >= conditionValue;
    case 'special':
      // 特殊成就需要单独逻辑判断
      return false;
    default:
      return false;
  }
};

module.exports = mongoose.model('Achievement', achievementSchema);
