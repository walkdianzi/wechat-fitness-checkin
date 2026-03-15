// pages/rank/rank.js
const app = getApp();

Page({
  data: {
    rankType: 'steps',
    rankPeriod: '本周',
    userRank: null,
    userSteps: 0,
    beatPercent: 0,
    rankList: [],
    hasMore: false,
    loading: false
  },

  onLoad: function () {
    this.loadRankData();
  },

  onShow: function () {
    this.loadRankData();
  },

  onPullDownRefresh: function () {
    this.loadRankData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载排行数据
  loadRankData: function () {
    if (this.data.loading) return Promise.resolve();

    this.setData({ loading: true });

    // 模拟数据 (实际应从后端 API 获取)
    return new Promise((resolve) => {
      const mockData = this.generateMockRankData();

      setTimeout(() => {
        this.setData({
          rankList: mockData.list,
          userRank: mockData.userRank,
          userSteps: mockData.userSteps,
          beatPercent: mockData.beatPercent,
          loading: false
        });
        resolve();
      }, 500);
    });
  },

  // 生成模拟排行数据
  generateMockRankData: function () {
    const nicknames = ['运动达人', '健身小王子', '跑步爱好者', '打卡狂魔', '健身小白', '运动健将', '活力少女', '健康先锋'];
    const list = [];

    for (let i = 0; i < 10; i++) {
      const totalSteps = Math.floor(Math.random() * 100000) + 20000;
      list.push({
        userId: `user_${i}`,
        rank: i + 1,
        nickname: nicknames[i] || `用户${i + 1}`,
        avatar: '',
        totalSteps,
        checkinDays: Math.floor(Math.random() * 30) + 1,
        continuousDays: Math.floor(Math.random() * 15) + 1
      });
    }

    // 模拟用户排名
    const userRank = Math.floor(Math.random() * 50) + 1;
    const userSteps = Math.floor(Math.random() * 50000) + 10000;
    const beatPercent = Math.min(Math.round(((100 - userRank) / 100) * 100), 99);

    return {
      list,
      userRank,
      userSteps,
      beatPercent
    };
  },

  // 设置排行类型
  setRankType: function (e) {
    const type = e.currentTarget.dataset.type;
    const periodMap = {
      steps: '本周',
      checkin: '本月',
      continuous: '历史'
    };

    this.setData({ 
      rankType: type,
      rankPeriod: periodMap[type]
    });
    this.loadRankData();
  }
});
