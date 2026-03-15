// pages/index/index.js
const app = getApp();

// 运动小贴士
const TIPS = [
  '每天走 10000 步，健康伴你行！',
  '运动后记得拉伸，避免肌肉酸痛哦~',
  '保持良好姿势，走路也能锻炼身体！',
  '多喝水，运动效果更佳！',
  '早起运动，一天都充满活力！',
  '和朋友一起运动，更有动力哦~',
  '坚持打卡，养成好习惯！',
  '运动不止，健康不息！'
];

Page({
  data: {
    userInfo: null,
    stepCount: 0,
    syncTime: '-',
    isSyncing: false,
    currentTip: TIPS[0]
  },

  onLoad: function () {
    this.loadUserInfo();
    this.loadStepCount();
    this.loadTip();
  },

  onShow: function () {
    this.loadUserInfo();
    this.loadStepCount();
  },

  // 加载用户信息
  loadUserInfo: function () {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
    }
  },

  // 加载步数
  loadStepCount: function () {
    const lastStepCount = wx.getStorageSync('lastStepCount');
    const lastSyncTime = wx.getStorageSync('lastSyncTime');
    if (lastStepCount) {
      this.setData({
        stepCount: lastStepCount,
        syncTime: lastSyncTime || '-'
      });
    }
  },

  // 加载小贴士
  loadTip: function () {
    const randomIndex = Math.floor(Math.random() * TIPS.length);
    this.setData({
      currentTip: TIPS[randomIndex]
    });
  },

  // 处理登录
  handleLogin: function () {
    wx.showLoading({ title: '登录中...' });
    
    app.wxLogin((err, userInfo) => {
      wx.hideLoading();
      if (err) {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      } else {
        this.setData({ userInfo });
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      }
    });
  },

  // 同步步数
  syncSteps: function () {
    if (this.data.isSyncing) return;

    this.setData({ isSyncing: true });
    wx.showLoading({ title: '同步中...' });

    app.getWeRunData((err, runData) => {
      if (err) {
        wx.hideLoading();
        this.setData({ isSyncing: false });
        wx.showToast({
          title: '同步失败，请授权运动数据',
          icon: 'none'
        });
        return;
      }

      // 发送 encryptedData 到后端解密
      wx.request({
        url: `${app.globalData.baseUrl}/sports/sync`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`
        },
        data: runData,
        success: (res) => {
          wx.hideLoading();
          this.setData({ isSyncing: false });
          if (res.statusCode === 200) {
            const { stepCount } = res.data;
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            this.setData({
              stepCount,
              syncTime: timeStr
            });

            // 缓存数据
            wx.setStorageSync('lastStepCount', stepCount);
            wx.setStorageSync('lastSyncTime', timeStr);

            wx.showToast({
              title: '同步成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: res.data.message || '同步失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.hideLoading();
          this.setData({ isSyncing: false });
          wx.showToast({
            title: '网络错误',
            icon: 'none'
          });
        }
      });
    });
  },

  // 跳转打卡页
  goCheckin: function () {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  // 跳转记录页
  goHistory: function () {
    wx.switchTab({ url: '/pages/history/history' });
  },

  // 跳转排行页
  goRank: function () {
    wx.switchTab({ url: '/pages/rank/rank' });
  },

  // 跳转个人页
  goProfile: function () {
    wx.navigateTo({ url: '/pages/profile/profile' });
  }
});
