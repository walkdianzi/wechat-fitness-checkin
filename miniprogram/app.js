// app.js
App({
  onLaunch: function () {
    console.log('运动打卡小程序启动');
    
    // 检查登录状态
    this.checkLoginStatus();
  },

  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://your-domain.com/api',
    isOpenid: false
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      // 验证 token 有效性
      this.validateToken(token);
    }
  },

  // 验证 token
  validateToken: function(token) {
    wx.request({
      url: `${this.globalData.baseUrl}/auth/validate`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          this.globalData.userInfo = res.data.userInfo;
        } else {
          // token 失效，清除本地存储
          wx.removeStorageSync('token');
          this.globalData.token = null;
        }
      }
    });
  },

  // 微信登录
  wxLogin: function(callback) {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送 code 到后端换取 token
          wx.request({
            url: `${this.globalData.baseUrl}/auth/login`,
            method: 'POST',
            data: {
              code: res.code
            },
            success: (loginRes) => {
              if (loginRes.statusCode === 200) {
                const { token, userInfo } = loginRes.data;
                wx.setStorageSync('token', token);
                this.globalData.token = token;
                this.globalData.userInfo = userInfo;
                callback && callback(null, userInfo);
              } else {
                callback && callback(new Error('登录失败'));
              }
            },
            fail: (err) => {
              callback && callback(err);
            }
          });
        } else {
          callback && callback(new Error('微信登录失败'));
        }
      },
      fail: (err) => {
        callback && callback(err);
      }
    });
  },

  // 获取微信运动步数
  getWeRunData: function(callback) {
    wx.getWeRunData({
      success: (res) => {
        // 获取 encryptedData 和 iv
        const { encryptedData, iv } = res;
        callback && callback(null, { encryptedData, iv });
      },
      fail: (err) => {
        callback && callback(err);
      }
    });
  }
});
