// models/User.js - 用户模型
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // 微信 openid
  openid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // 微信 unionid (可选)
  unionid: {
    type: String,
    sparse: true
  },
  // 用户昵称
  nickname: {
    type: String,
    default: '运动达人'
  },
  // 头像 URL
  avatar: {
    type: String,
    default: ''
  },
  // 性别 (0:未知，1:男，2:女)
  gender: {
    type: Number,
    default: 0
  },
  // 城市
  city: {
    type: String,
    default: ''
  },
  // 省份
  province: {
    type: String,
    default: ''
  },
  // 国家
  country: {
    type: String,
    default: '中国'
  },
  // 语言
  language: {
    type: String,
    default: 'zh_CN'
  },
  // 总步数
  totalSteps: {
    type: Number,
    default: 0
  },
  // 总打卡天数
  totalCheckinDays: {
    type: Number,
    default: 0
  },
  // 连续打卡天数
  continuousCheckinDays: {
    type: Number,
    default: 0
  },
  // 最后打卡日期
  lastCheckinDate: {
    type: Date,
    default: null
  },
  // 最后同步步数时间
  lastSyncTime: {
    type: Date,
    default: null
  },
  // 成就点数
  achievementPoints: {
    type: Number,
    default: 0
  },
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
userSchema.index({ totalSteps: -1 });
userSchema.index({ totalCheckinDays: -1 });
userSchema.index({ createdAt: -1 });

// 虚拟字段：等级
userSchema.virtual('level').get(function() {
  const days = this.totalCheckinDays;
  if (days >= 365) return '🏆 运动大师';
  if (days >= 180) return '🥇 运动健将';
  if (days >= 90) return '🥈 运动达人';
  if (days >= 30) return '🥉 运动新手';
  if (days >= 7) return '⭐ 运动入门';
  return '🌱 运动萌芽';
});

// 静态方法：查找或创建用户
userSchema.statics.findByOpenid = async function(openid, userData = {}) {
  let user = await this.findOne({ openid });
  if (!user) {
    user = await this.create({
      openid,
      ...userData
    });
  } else if (userData.nickname || userData.avatar) {
    // 更新用户信息
    if (userData.nickname) user.nickname = userData.nickname;
    if (userData.avatar) user.avatar = userData.avatar;
    if (userData.gender) user.gender = userData.gender;
    if (userData.city) user.city = userData.city;
    if (userData.province) user.province = userData.province;
    if (userData.country) user.country = userData.country;
    await user.save();
  }
  return user;
};

module.exports = mongoose.model('User', userSchema);
