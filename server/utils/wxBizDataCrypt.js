/**
 * WeChat Mini Program Data Cryptography Utility
 * 微信小程序数据解密工具
 * 
 * Source: https://github.com/wechat-miniprogram/miniprogram-sigma
 */

const crypto = require('crypto');

class WXBizDataCrypt {
  constructor(appId, sessionKey) {
    this.appId = appId;
    this.sessionKey = sessionKey;
  }

  /**
   * 解密微信加密数据
   * @param {string} encryptedData - 加密数据 (base64)
   * @param {string} iv - 初始向量 (base64)
   * @returns {object} 解密后的数据对象
   */
  decryptData(encryptedData, iv) {
    // base64 decode
    const sessionKey = Buffer.from(this.sessionKey, 'base64');
    const encryptedDataBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');

    // decrypt
    let decoded;
    try {
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, ivBuffer);
      decipher.setAutoPadding(true);
      decoded = decipher.update(encryptedDataBuffer, 'binary', 'utf8');
      decoded += decipher.final('utf8');
      decoded = JSON.parse(decoded);
    } catch (e) {
      throw new Error('Illegal Buffer');
    }

    // validate
    if (decoded.watermark.appid !== this.appId) {
      throw new Error('Illegal Buffer');
    }

    return decoded;
  }

  /**
   * 解密用户信息
   * @param {string} encryptedData 
   * @param {string} iv 
   * @returns {object} 用户信息对象
   */
  decryptUserInfo(encryptedData, iv) {
    const data = this.decryptData(encryptedData, iv);
    return {
      openId: data.openId,
      nickName: data.nickName,
      avatarUrl: data.avatarUrl,
      gender: data.gender,
      city: data.city,
      province: data.province,
      country: data.country,
      language: data.language
    };
  }

  /**
   * 解密微信运动步数
   * @param {string} encryptedData 
   * @param {string} iv 
   * @returns {object} 运动数据
   */
  decryptWeRunData(encryptedData, iv) {
    const data = this.decryptData(encryptedData, iv);
    return {
      step: data.step,
      timestamp: data.timestamp
    };
  }
}

module.exports = WXBizDataCrypt;
