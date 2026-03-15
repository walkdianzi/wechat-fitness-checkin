// utils/wechat.js - 微信工具函数
const crypto = require('crypto');
const axios = require('axios');

const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_SECRET = process.env.WECHAT_SECRET;

/**
 * 使用 code 换取 openid 和 session_key
 * @param {string} code - 微信登录 code
 * @returns {Promise<{openid: string, session_key: string, unionid?: string}>}
 */
async function codeToSession(code) {
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: WECHAT_APPID,
        secret: WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const data = response.data;

    if (data.errcode) {
      throw new Error(`微信 API 错误：${data.errmsg} (code: ${data.errcode})`);
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid
    };

  } catch (error) {
    console.error('codeToSession 错误:', error.message);
    throw error;
  }
}

/**
 * 解密微信加密数据
 * @param {string} encryptedData - 加密数据
 * @param {string} sessionKey - session_key
 * @param {string} iv - 初始向量
 * @returns {object|null} 解密后的数据
 */
function decryptData(encryptedData, sessionKey, iv) {
  try {
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedDataBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');

    const data = JSON.parse(decrypted);

    // 验证 watermark
    if (data.watermark && data.watermark.appid !== WECHAT_APPID) {
      console.error('watermark 验证失败');
      return null;
    }

    return data;

  } catch (error) {
    console.error('decryptData 错误:', error.message);
    return null;
  }
}

/**
 * 解密微信运动数据
 * @param {string} encryptedData - 加密数据
 * @param {string} sessionKey - session_key
 * @param {string} iv - 初始向量
 * @returns {object|null} 包含 stepCount 和 date 的对象
 */
function decryptWeRunData(encryptedData, sessionKey, iv) {
  const data = decryptData(encryptedData, sessionKey, iv);
  
  if (!data || !data.stepInfo || !data.stepInfo[0]) {
    return null;
  }

  return {
    stepCount: data.stepInfo[0].step || 0,
    timestamp: data.stepInfo[0].timestamp,
    date: formatDate(new Date(data.stepInfo[0].timestamp * 1000)),
    rawData: data
  };
}

/**
 * 生成小程序码
 * @param {string} scene - 场景值
 * @param {string} page - 页面路径
 * @returns {Promise<Buffer>} 小程序码图片 buffer
 */
async function createQRCode(scene, page = 'pages/index/index') {
  try {
    // 先获取 access_token
    const tokenResponse = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: WECHAT_APPID,
        secret: WECHAT_SECRET
      }
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      throw new Error('获取 access_token 失败');
    }

    // 生成小程序码
    const qrResponse = await axios.post(
      `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
      {
        scene,
        page,
        width: 430,
        auto_color: false,
        line_color: { r: 76, g: 175, b: 80 },
        is_hyaline: false
      },
      {
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(qrResponse.data);

  } catch (error) {
    console.error('createQRCode 错误:', error.message);
    throw error;
  }
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取当前日期字符串
 * @returns {string} YYYY-MM-DD 格式的日期
 */
function getTodayString() {
  return formatDate(new Date());
}

/**
 * 获取 N 天前的日期字符串
 * @param {number} days - 天数
 * @returns {string} YYYY-MM-DD 格式的日期
 */
function getDaysAgoString(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

module.exports = {
  codeToSession,
  decryptData,
  decryptWeRunData,
  createQRCode,
  formatDate,
  getTodayString,
  getDaysAgoString
};
