// models/SportsData.js - 运动数据模型
const mongoose = require('mongoose');

const sportsDataSchema = new mongoose.Schema({
  // 用户 ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 日期 (格式：YYYY-MM-DD)
  date: {
    type: String,
    required: true,
    index: true
  },
  // 步数
  stepCount: {
    type: Number,
    required: true,
    default: 0
  },
  // 距离 (公里)
  distance: {
    type: Number,
    default: 0
  },
  // 卡路里消耗
  calorie: {
    type: Number,
    default: 0
  },
  // 数据来源 (wechat: 微信运动，manual: 手动录入)
  source: {
    type: String,
    enum: ['wechat', 'manual'],
    default: 'wechat'
  },
  // 同步时间
  syncTime: {
    type: Date,
    default: Date.now
  },
  // 原始数据 (encryptedData 解密后的完整数据)
  rawData: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// 复合索引：用户 + 日期
sportsDataSchema.index({ userId: 1, date: -1 }, { unique: true });

// 静态方法：获取用户某日运动数据
sportsDataSchema.statics.findByUserAndDate = async function(userId, date) {
  return await this.findOne({ userId, date });
};

// 静态方法：获取用户运动数据列表
sportsDataSchema.statics.findByUser = async function(userId, startDate, endDate, limit = 30) {
  const query = { userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return await this.find(query)
    .sort({ date: -1 })
    .limit(limit);
};

// 静态方法：更新或创建运动数据
sportsDataSchema.statics.upsertByUserAndDate = async function(userId, date, data) {
  return await this.findOneAndUpdate(
    { userId, date },
    {
      $set: {
        ...data,
        syncTime: new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// 实例方法：计算距离 (步数 * 0.00075 公里/步)
sportsDataSchema.methods.calculateDistance = function() {
  return Math.round(this.stepCount * 0.00075 * 1000) / 1000;
};

// 实例方法：计算卡路里 (步数 * 0.04 卡/步)
sportsDataSchema.methods.calculateCalorie = function() {
  return Math.round(this.stepCount * 0.04);
};

module.exports = mongoose.model('SportsData', sportsDataSchema);
