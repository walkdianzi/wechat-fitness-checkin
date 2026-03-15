// pages/checkin/checkin.js
const app = getApp();
const { formatNumber } = require('../../utils/util');

// 心情选项
const MOOD_OPTIONS = [
  { emoji: '😄', value: '😄' },
  { emoji: '😊', value: '😊' },
  { emoji: '😐', value: '😐' },
  { emoji: '😔', value: '😔' },
  { emoji: '😡', value: '😡' },
  { emoji: '💪', value: '💪' },
  { emoji: '🔥', value: '🔥' },
  { emoji: '⭐', value: '⭐' }
];

// 星期
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: {
    currentDate: '',
    isToday: false,
    stepCount: 0,
    distance: 0,
    calorie: 0,
    target: 10000,
    progressPercent: 0,
    isCheckedIn: false,
    checkinTime: '',
    checkinMood: '',
    checkinNote: '',
    continuousDays: 0,
    canCheckin: false,
    mood: '😄',
    moodOptions: MOOD_OPTIONS,
    weekDays: WEEK_DAYS,
    calendarDays: [],
    note: ''
  },

  onLoad: function () {
    this.initDate();
    this.loadMoodFromStorage();
  },

  onShow: function () {
    this.loadTodayData();
    this.loadCalendar();
  },

  // 初始化日期
  initDate: function () {
    const today = new Date();
    const dateStr = this.formatDate(today);
    this.setData({
      currentDate: dateStr,
      isToday: true
    });
  },

  // 加载今日数据
  loadTodayData: function () {
    wx.showLoading({ title: '加载中...' });

    // 获取今日运动数据
    this.loadSportsData();
    
    // 获取打卡状态
    this.loadCheckinStatus();

    wx.hideLoading();
  },

  // 加载运动数据
  loadSportsData: function () {
    const lastStepCount = wx.getStorageSync('lastStepCount') || 0;
    const stepCount = lastStepCount;
    const distance = (stepCount * 0.00075).toFixed(2);
    const calorie = Math.round(stepCount * 0.04);
    const progressPercent = Math.min(Math.round((stepCount / 10000) * 100), 100);

    this.setData({
      stepCount,
      distance,
      calorie,
      progressPercent,
      canCheckin: stepCount > 0
    });
  },

  // 加载打卡状态
  loadCheckinStatus: function () {
    if (!app.globalData.token) {
      return;
    }

    wx.request({
      url: `${app.globalData.baseUrl}/checkin/today`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.isCheckedIn) {
          const checkin = res.data.checkin;
          this.setData({
            isCheckedIn: true,
            checkinTime: this.formatTime(new Date(checkin.checkinTime)),
            checkinMood: checkin.mood,
            checkinNote: checkin.note,
            continuousDays: 0 // TODO: 从后端获取
          });
        }
      }
    });
  },

  // 加载日历
  loadCalendar: function () {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 获取当月第一天
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstDayWeek = firstDay.getDay();
    
    // 获取当月天数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 获取打卡记录 (简化版，实际应从后端获取)
    const checkinDays = wx.getStorageSync('checkinDays') || [];
    
    const calendarDays = [];
    
    // 填充上月日期
    for (let i = 0; i < firstDayWeek; i++) {
      calendarDays.push({ day: '', class: 'empty' });
    }
    
    // 填充当月日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isCheckedIn = checkinDays.includes(dateStr);
      const isToday = day === today.getDate();
      
      calendarDays.push({
        day: day.toString(),
        date: dateStr,
        isCheckedIn,
        class: isToday ? 'today' : (isCheckedIn ? 'checked' : '')
      });
    }
    
    this.setData({ calendarDays });
  },

  // 选择心情
  selectMood: function (e) {
    const mood = e.currentTarget.dataset.mood;
    this.setData({ mood });
    wx.setStorageSync('selectedMood', mood);
  },

  // 加载心情
  loadMoodFromStorage: function () {
    const savedMood = wx.getStorageSync('selectedMood');
    if (savedMood) {
      this.setData({ mood: savedMood });
    }
  },

  // 备注输入
  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
  },

  // 执行打卡
  doCheckin: function () {
    if (!this.data.canCheckin) {
      wx.showToast({
        title: '请先同步步数',
        icon: 'none'
      });
      return;
    }

    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '打卡中...' });

    wx.request({
      url: `${app.globalData.baseUrl}/checkin/today`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${app.globalData.token}`,
        'Content-Type': 'application/json'
      },
      data: {
        mood: this.data.mood,
        note: this.data.note
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          // 保存打卡记录
          const today = this.formatDate(new Date());
          const checkinDays = wx.getStorageSync('checkinDays') || [];
          if (!checkinDays.includes(today)) {
            checkinDays.push(today);
            wx.setStorageSync('checkinDays', checkinDays);
          }

          this.setData({
            isCheckedIn: true,
            checkinTime: this.formatTime(new Date()),
            checkinMood: this.data.mood,
            checkinNote: this.data.note,
            continuousDays: (this.data.continuousDays || 0) + 1
          });

          wx.showToast({
            title: '打卡成功',
            icon: 'success'
          });

          // 重新加载日历
          this.loadCalendar();
        } else {
          wx.showToast({
            title: res.data.message || '打卡失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 前一天
  prevDay: function () {
    const [year, month, day] = this.data.currentDate.split('-').map(Number);
    const prevDate = new Date(year, month - 1, day - 1);
    const dateStr = this.formatDate(prevDate);
    const isToday = dateStr === this.formatDate(new Date());

    this.setData({
      currentDate: dateStr,
      isToday
    });

    // TODO: 加载历史数据
  },

  // 后一天
  nextDay: function () {
    if (this.data.isToday) return;

    const [year, month, day] = this.data.currentDate.split('-').map(Number);
    const nextDate = new Date(year, month - 1, day + 1);
    const dateStr = this.formatDate(nextDate);
    const isToday = dateStr === this.formatDate(new Date());

    this.setData({
      currentDate: dateStr,
      isToday
    });

    // TODO: 加载历史数据
  },

  // 显示日期选择器
  showDatePicker: function () {
    // TODO: 实现日期选择器
    wx.showToast({
      title: '日期选择器开发中',
      icon: 'none'
    });
  },

  // 格式化日期 YYYY-MM-DD
  formatDate: function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化时间 HH:mm
  formatTime: function (date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
});
