// pages/achievement/achievement.js
const app = getApp();
const { request, showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    filterType: 'all',
    totalAchieved: 0,
    totalAchievements: 0,
    totalPoints: 0,
    progress: 0,
    achievementList: [],
    loading: false
  },

  onLoad: function () {
    this.loadAchievements();
  },

  onShow: function () {
    this.loadAchievements();
  },

  onPullDownRefresh: function () {
    this.loadAchievements().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载成就数据
  loadAchievements: function () {
    if (this.data.loading) return Promise.resolve();

    this.setData({ loading: true });

    return request({
      url: '/achievement/my',
      method: 'GET',
      data: {
        type: this.data.filterType === 'all' ? '' : this.data.filterType
      }
    }).then((res) => {
      this.setData({
        totalAchieved: res.totalAchieved,
        totalAchievements: res.totalAchievements,
        totalPoints: res.totalPoints,
        progress: res.progress,
        achievementList: res.list,
        loading: false
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  // 设置筛选
  setFilter: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type });
    this.loadAchievements();
  },

  // 领取奖励
  claimReward: function (e) {
    const achievementId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '领取奖励',
      content: '恭喜！领取成就点数奖励',
      success: (res) => {
        if (res.confirm) {
          showLoading('领取中...');

          request({
            url: `/achievement/claim/${achievementId}`,
            method: 'POST'
          }).then((res) => {
            hideLoading();
            showSuccess(`领取 ${res.points} 点`);
            
            // 更新列表
            const list = this.data.achievementList.map(item => {
              if (item.achievementId === achievementId) {
                return { ...item, rewardClaimed: true };
              }
              return item;
            });
            
            this.setData({
              totalPoints: this.data.totalPoints + res.points,
              achievementList: list
            });
          }).catch(() => {
            hideLoading();
          });
        }
      }
    });
  },

  // 获取条件文本
  getConditionText: function (item) {
    const { conditionType, conditionValue } = item;
    
    switch (conditionType) {
      case 'total_steps':
        return `累计行走 ${this.formatNumber(conditionValue)} 步`;
      case 'daily_steps':
        return `单日行走 ${this.formatNumber(conditionValue)} 步`;
      case 'total_checkin':
        return `累计打卡 ${conditionValue} 天`;
      case 'continuous_checkin':
        return `连续打卡 ${conditionValue} 天`;
      case 'special':
        return '完成特殊挑战';
      default:
        return '未知条件';
    }
  },

  // 获取等级文本
  getLevelText: function (level) {
    const levelMap = {
      bronze: '铜牌',
      silver: '银牌',
      gold: '金牌',
      platinum: '白金',
      diamond: '钻石'
    };
    return levelMap[level] || '';
  },

  // 格式化数字
  formatNumber: function (num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // 格式化日期
  formatDate: function (dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  }
});
