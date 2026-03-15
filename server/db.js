/**
 * Lowdb 数据库适配层 - 替代 MongoDB
 * 基于 JSON 文件的轻量级数据库
 */

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, 'data/db.json');

// 创建适配器
const adapter = new FileSync(DB_PATH);
const db = low(adapter);

// 初始化数据结构
db.defaults({
  users: [],
  checkins: [],
  sportsData: [],
  achievements: [],
  userAchievements: []
}).write();

// 生成唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// MongoDB ObjectId 模拟
class ObjectId {
  constructor(id) {
    this.id = id || generateId();
  }
  toString() {
    return this.id;
  }
  valueOf() {
    return this.id;
  }
}

// User 模型
const User = {
  // 根据 openid 查找用户，不存在则创建
  findByOpenid: async (openid, extra = {}) => {
    let user = db.get('users').find({ openid }).value();
    
    if (!user) {
      user = {
        _id: new ObjectId(),
        openid,
        unionid: extra.unionid || null,
        nickname: '微信用户',
        avatar: '',
        gender: 0,
        city: '',
        province: '',
        country: '',
        totalSteps: 0,
        totalCheckinDays: 0,
        continuousCheckinDays: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      db.get('users').push(user).write();
    }
    
    return user;
  },

  // 根据 ID 查找用户
  findById: async (id) => {
    const userId = id.id || id;
    return db.get('users').find(u => (u._id.id === userId || u._id === userId)).value();
  },

  // 保存用户
  save: async (user) => {
    user.updatedAt = new Date().toISOString();
    db.get('users').find({ _id: user._id }).assign(user).write();
    return user;
  },

  // 更新步数
  updateSteps: async (userId, steps) => {
    const user = await User.findById(userId);
    if (user) {
      user.totalSteps = (user.totalSteps || 0) + steps;
      return await User.save(user);
    }
    return null;
  }
};

// Checkin 模型
const Checkin = {
  // 创建打卡记录
  create: async (data) => {
    const record = {
      _id: new ObjectId(),
      userId: data.userId,
      date: data.date,
      stepCount: data.stepCount || 0,
      remark: data.remark || '',
      createdAt: new Date().toISOString()
    };
    
    db.get('checkins').push(record).write();
    
    // 更新用户打卡天数
    const user = await User.findById(data.userId);
    if (user) {
      user.totalCheckinDays = (user.totalCheckinDays || 0) + 1;
      user.continuousCheckinDays = (user.continuousCheckinDays || 0) + 1;
      await User.save(user);
    }
    
    return record;
  },

  // 查找用户打卡记录
  findByUserId: async (userId) => {
    return db.get('checkins').find({ userId }).value();
  },

  // 按日期范围查找
  findByDateRange: async (userId, startDate, endDate) => {
    return db.get('checkins')
      .filter(c => c.userId === userId && c.date >= startDate && c.date <= endDate)
      .value() || [];
  }
};

// SportsData 模型
const SportsData = {
  // 保存运动数据
  save: async (data) => {
    const record = {
      _id: new ObjectId(),
      userId: data.userId,
      date: data.date,
      stepCount: data.stepCount,
      timestamp: data.timestamp,
      createdAt: new Date().toISOString()
    };
    
    // 删除同一天的旧记录
    db.get('sportsData').remove({ userId: data.userId, date: data.date }).write();
    
    db.get('sportsData').push(record).write();
    
    // 更新用户总步数
    await User.updateSteps(data.userId, data.stepCount);
    
    return record;
  },

  // 查找今日数据
  findToday: async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    return db.get('sportsData').find({ userId, date: today }).value();
  },

  // 按日期查找
  findByDate: async (userId, date) => {
    return db.get('sportsData').find({ userId, date }).value();
  }
};

// Achievement 模型
const Achievement = {
  // 获取所有成就
  findAll: async () => {
    return db.get('achievements').value() || [];
  },

  // 创建成就
  create: async (data) => {
    const achievement = {
      _id: new ObjectId(),
      name: data.name,
      description: data.description,
      icon: data.icon || '',
      condition: data.condition,
      createdAt: new Date().toISOString()
    };
    
    db.get('achievements').push(achievement).write();
    return achievement;
  }
};

// UserAchievement 模型
const UserAchievement = {
  // 授予用户成就
  award: async (userId, achievementId) => {
    // 检查是否已获得
    const exists = db.get('userAchievements')
      .find({ userId, achievementId })
      .value();
    
    if (!exists) {
      const record = {
        _id: new ObjectId(),
        userId,
        achievementId,
        awardedAt: new Date().toISOString()
      };
      
      db.get('userAchievements').push(record).write();
      return record;
    }
    
    return null;
  },

  // 获取用户成就
  findByUserId: async (userId) => {
    return db.get('userAchievements')
      .filter({ userId })
      .value() || [];
  }
};

// 初始化默认成就
async function initDefaultAchievements() {
  const achievements = db.get('achievements').value();
  if (achievements.length === 0) {
    await Achievement.create({
      name: '初次打卡',
      description: '完成第一次运动打卡',
      icon: '🎉',
      condition: { type: 'checkin', count: 1 }
    });
    
    await Achievement.create({
      name: '坚持不懈',
      description: '连续打卡 7 天',
      icon: '🔥',
      condition: { type: 'continuous_checkin', count: 7 }
    });
    
    await Achievement.create({
      name: '万步达人',
      description: '单日步数达到 10000 步',
      icon: '🏃',
      condition: { type: 'steps', count: 10000 }
    });
  }
}

// 初始化
initDefaultAchievements();

module.exports = {
  ObjectId,
  User,
  Checkin,
  SportsData,
  Achievement,
  UserAchievement,
  db
};
