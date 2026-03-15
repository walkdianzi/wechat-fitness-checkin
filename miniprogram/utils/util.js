// utils/util.js - 通用工具函数

/**
 * 格式化数字，添加千分位分隔符
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {string} 格式化后的日期
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 格式化日期为 MM/DD
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {string} 格式化后的日期
 */
const formatDateShort = (date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
};

/**
 * 格式化时间为 HH:mm
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {string} 格式化后的时间
 */
const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 获取星期几
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {string} 星期几
 */
const getWeekDay = (date) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = new Date(date);
  return days[d.getDay()];
};

/**
 * 格式化日期显示 (包含星期)
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {string} 格式化后的日期
 */
const formatDateWithWeek = (date) => {
  return `${formatDateShort(date)} ${getWeekDay(date)}`;
};

/**
 * 计算两个日期之间的天数差
 * @param {Date} date1 - 日期 1
 * @param {Date} date2 - 日期 2
 * @returns {number} 天数差
 */
const getDaysDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 判断是否是今天
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {boolean} 是否是今天
 */
const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return d.getFullYear() === today.getFullYear() &&
         d.getMonth() === today.getMonth() &&
         d.getDate() === today.getDate();
};

/**
 * 判断是否是昨天
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {boolean} 是否是昨天
 */
const isYesterday = (date) => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getFullYear() === yesterday.getFullYear() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getDate() === yesterday.getDate();
};

/**
 * 获取相对时间描述
 * @param {Date|string|number} date - 日期对象/字符串/时间戳
 * @returns {string} 相对时间描述
 */
const getRelativeTime = (date) => {
  const d = new Date(date);
  if (isToday(d)) return '今天';
  if (isYesterday(d)) return '昨天';
  return formatDateShort(d);
};

/**
 * 防抖函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间 (ms)
 * @returns {Function} 防抖后的函数
 */
const debounce = (fn, delay = 300) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 节流函数
 * @param {Function} fn - 要执行的函数
 * @param {number} interval - 间隔时间 (ms)
 * @returns {Function} 节流后的函数
 */
const throttle = (fn, interval = 300) => {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
};

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  });
};

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading();
};

/**
 * 显示成功提示
 * @param {string} title - 提示文字
 */
const showSuccess = (title = '操作成功') => {
  wx.showToast({
    title,
    icon: 'success',
    duration: 1500
  });
};

/**
 * 显示错误提示
 * @param {string} title - 提示文字
 */
const showError = (title = '操作失败') => {
  wx.showToast({
    title,
    icon: 'none',
    duration: 2000
  });
};

/**
 * 请求封装
 * @param {Object} options - 请求配置
 * @returns {Promise} 请求 Promise
 */
const request = (options) => {
  const app = getApp();
  const { url, method = 'GET', data = {}, header = {} } = options;

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : '',
        ...header
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // token 失效，清除登录状态
          wx.removeStorageSync('token');
          app.globalData.token = null;
          app.globalData.userInfo = null;
          showError('登录已过期，请重新登录');
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/profile/profile' });
          }, 1500);
          reject(new Error('登录已过期'));
        } else {
          showError(res.data.message || '请求失败');
          reject(res.data);
        }
      },
      fail: (err) => {
        showError('网络错误，请检查网络连接');
        reject(err);
      }
    });
  });
};

module.exports = {
  formatNumber,
  formatDate,
  formatDateShort,
  formatTime,
  getWeekDay,
  formatDateWithWeek,
  getDaysDiff,
  isToday,
  isYesterday,
  getRelativeTime,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  request
};
