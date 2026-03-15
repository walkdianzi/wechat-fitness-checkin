// pages/history/history.js
const app = getApp();

// 星期映射
const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

Page({
  data: {
    filterType: 'week',
    totalDays: 0,
    continuousDays: 0,
    totalSteps: 0,
    historyList: [],
    hasMore: false,
    page: 1,
    loading: false
  },

  onLoad: function () {
    this.loadStatistics();
    this.loadHistory();
  },

  onShow: function () {
    this.loadHistory();
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHistory(true);
    }
  },

  // 加载统计数据
  loadStatistics: function () {
    // 从本地缓存获取
    const checkinDays = wx.getStorageSync('checkinDays') || [];
    const lastStepCount = wx.getStorageSync('lastStepCount') || 0;

    this.setData({
      totalDays: checkinDays.length,
      continuousDays: checkinDays.length, // TODO: 计算连续天数
      totalSteps: lastStepCount * checkinDays.length // 简化计算
    });
  },

  // 加载历史记录
  loadHistory: function (isLoadMore = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    // 模拟数据 (实际应从后端 API 获取)
    const mockHistory = this.generateMockHistory();

    setTimeout(() => {
      let newList = [];
      if (isLoadMore) {
        newList = [...this.data.historyList, ...mockHistory];
      } else {
        newList = mockHistory;
      }

      this.setData({
        historyList: newList,
        hasMore: false,
        loading: false,
        page: this.data.page + 1
      });
    }, 500);
  },

  // 生成模拟历史数据
  generateMockHistory: function () {
    const today = new Date();
    const list = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dateStr = this.formatDate(date);
      const weekDay = WEEK_DAYS[date.getDay()];
      const stepCount = Math.floor(Math.random() * 15000) + 3000;
      const isCheckedIn = Math.random() > 0.3;

      list.push({
        id: i,
        date: dateStr,
        dateStr: this.formatDateDisplay(date),
        weekDay,
        stepCount,
        distance: (stepCount * 0.00075).toFixed(2),
        calorie: Math.round(stepCount * 0.04),
        mood: isCheckedIn ? '😄' : '',
        note: isCheckedIn ? '今天运动感觉不错！' : '',
        isCheckedIn
      });
    }

    return list;
  },

  // 设置筛选
  setFilter: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ filterType: type, page: 1 });
    this.loadHistory();
  },

  // 格式化日期 YYYY-MM-DD
  formatDate: function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期显示 (MM/DD)
  formatDateDisplay: function (date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  }
});
