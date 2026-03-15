// models/Checkin.js - 打卡记录模型
const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
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
  // 打卡时间
  checkinTime: {
    type: Date,
    default: Date.now
  },
  // 打卡状态 (success: 成功，missed: 未打卡)
  status: {
    type: String,
    enum: ['success', 'missed'],
    default: 'success'
  },
  // 备注/心情
  note: {
    type: String,
    default: ''
  },
  // 心情表情
  mood: {
    type: String,
    enum: ['😄', '😊', '😐', '😔', '😡', '💪', '🔥', '⭐'],
    default: '😄'
  },
  // 是否分享
  isShared: {
    type: Boolean,
    default: false
  },
  // 点赞数
  likeCount: {
    type: Number,
    default: 0
  },
  // 评论数
  commentCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 复合索引：用户 + 日期
checkinSchema.index({ userId: 1, date: -1 }, { unique: true });

// 静态方法：获取用户打卡记录
checkinSchema.statics.findByUser = async function(userId, startDate, endDate, limit = 30) {
  const query = { userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  return await this.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .populate('userId', 'nickname avatar');
};

// 静态方法：获取今日打卡记录
checkinSchema.statics.findTodayByUser = async function(userId) {
  const today = new Date().toISOString().split('T')[0];
  return await this.findOne({ userId, date: today });
};

// 静态方法：打卡
checkinSchema.statics.createCheckin = async function(userId, stepCount, note = '', mood = '😄') {
  const today = new Date().toISOString().split('T')[0];
  
  // 检查是否已打卡
  const existing = await this.findOne({ userId, date: today });
  if (existing) {
    throw new Error('今日已打卡');
  }

  return await this.create({
    userId,
    date: today,
    stepCount,
    note,
    mood,
    status: 'success',
    checkinTime: new Date()
  });
};

// 静态方法：获取连续打卡天数
checkinSchema.statics.getContinuousDays = async function(userId) {
  const today = new Date();
  const checkins = await this.find({ userId, status: 'success' })
    .sort({ date: -1 })
    .select('date');

  if (checkins.length === 0) return 0;

  let continuousDays = 0;
  let currentDate = new Date(today);

  for (const checkin of checkins) {
    const checkinDate = new Date(checkin.date);
    const diffDays = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));

    if (diffDays === continuousDays || diffDays === continuousDays + 1) {
      continuousDays++;
      currentDate = checkinDate;
    } else {
      break;
    }
  }

  return continuousDays;
};

// 实例方法：格式化显示
checkinSchema.methods.toDisplayObject = function() {
  return {
    id: this._id,
    date: this.date,
    stepCount: this.stepCount,
    checkinTime: this.checkinTime,
    note: this.note,
    mood: this.mood,
    isShared: this.isShared,
    likeCount: this.likeCount,
    commentCount: this.commentCount
  };
};

module.exports = mongoose.model('Checkin', checkinSchema);
