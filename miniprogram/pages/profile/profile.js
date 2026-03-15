// pages/profile/profile.js
const app = getApp();

// 等级配置
const LEVEL_CONFIG = {
  365: '🏆 运动大师',
  180: '🥇 运动健将',
  90: '🥈 运动达人',
  30: '🥉 运动新手',
  7: '⭐ 运动入门',
  0: '🌱 运动萌芽'
};

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    level: '🌱 运动萌芽',
    totalSteps: 0,
    totalDays: 0,
    continuousDays: 0
  },

  onLoad: function () {
    this.loadUserInfo();
  },

  onShow: function () {
    this.loadUserInfo();
    this.loadStatistics();
  },

  // 加载用户信息
  loadUserInfo: function () {
    const userInfo = app.globalData.userInfo;
    const token = app.globalData.token;

    if (userInfo && token) {
      this.setData({
        userInfo,
        isLoggedIn: true,
        level: this.calculateLevel(userInfo.totalCheckinDays || 0)
      });
    } else {
      this.setData({
        userInfo: null,
        isLoggedIn: false
      });
    }
  },

  // 加载统计数据
  loadStatistics: function () {
    const checkinDays = wx.getStorageSync('checkinDays') || [];
    const lastStepCount = wx.getStorageSync('lastStepCount') || 0;

    this.setData({
      totalSteps: lastStepCount * checkinDays.length,
      totalDays: checkinDays.length,
      continuousDays: checkinDays.length
    });
  },

  // 计算等级
  calculateLevel: function (days) {
    if (days >= 365) return LEVEL_CONFIG[365];
    if (days >= 180) return LEVEL_CONFIG[180];
    if (days >= 90) return LEVEL_CONFIG[90];
    if (days >= 30) return LEVEL_CONFIG[30];
    if (days >= 7) return LEVEL_CONFIG[7];
    return LEVEL_CONFIG[0];
  },

  // 编辑资料
  editProfile: function () {
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
  },

  // 运动目标
  goToTarget: function () {
    wx.showToast({
      title: '目标设置开发中',
      icon: 'none'
    });
  },

  // 数据统计
  goToHistory: function () {
    wx.switchTab({
      url: '/pages/history/history'
    });
  },

  // 成就徽章
  goToAchievement: function () {
    wx.navigateTo({
      url: '/pages/achievement/achievement'
    });
  },

  // 设置
  goToSettings: function () {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    });
  },

  // 关于我们
  showAbout: function () {
    wx.showModal({
      title: '关于运动打卡',
      content: '运动打卡小程序 v1.0.0\n\n帮助你养成运动好习惯，每天进步一点点！',
      showCancel: false
    });
  },

  // 意见反馈
  showFeedback: function () {
    wx.showToast({
      title: '反馈功能开发中',
      icon: 'none'
    });
  },

  // 登录
  login: function () {
    wx.showLoading({ title: '登录中...' });

    app.wxLogin((err, userInfo) => {
      wx.hideLoading();
      if (err) {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      } else {
        this.setData({
          userInfo,
          isLoggedIn: true,
          level: this.calculateLevel(userInfo.totalCheckinDays || 0)
        });
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      }
    });
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地数据
          wx.removeStorageSync('token');
          wx.removeStorageSync('checkinDays');
          wx.removeStorageSync('lastStepCount');
          wx.removeStorageSync('lastSyncTime');

          // 清除全局数据
          app.globalData.token = null;
          app.globalData.userInfo = null;

          this.setData({
            userInfo: null,
            isLoggedIn: false,
            totalSteps: 0,
            totalDays: 0,
            continuousDays: 0
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  }
});
