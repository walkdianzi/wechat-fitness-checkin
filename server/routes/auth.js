// routes/auth.js - 认证路由
const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 微信 API 配置
const WECHAT_APPID = process.env.WECHAT_APPID;
const WECHAT_SECRET = process.env.WECHAT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/login
 * 微信登录 - 使用 code 换取 openid 和 session_key
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: '缺少 code 参数' });
    }

    // 调用微信 API 获取 openid
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: WECHAT_APPID,
        secret: WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key, unionid, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      return res.status(400).json({ 
        message: `微信登录失败：${errmsg}`,
        code: errcode
      });
    }

    // 查找或创建用户
    const user = await User.findByOpenid(openid, { unionid });

    // 生成 JWT token
    const token = jwt.sign(
      { 
        openid: user.openid,
        userId: user._id 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      userInfo: {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        city: user.city,
        province: user.province,
        totalSteps: user.totalSteps,
        totalCheckinDays: user.totalCheckinDays,
        continuousCheckinDays: user.continuousCheckinDays,
        level: user.level
      }
    });

  } catch (error) {
    console.error('登录错误:', error.message);
    res.status(500).json({ 
      message: '登录失败，请稍后重试' 
    });
  }
});

/**
 * POST /api/auth/validate
 * 验证 token 有效性
 */
router.post('/validate', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供 token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      valid: true,
      userInfo: {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        city: user.city,
        province: user.province,
        totalSteps: user.totalSteps,
        totalCheckinDays: user.totalCheckinDays,
        continuousCheckinDays: user.continuousCheckinDays,
        level: user.level
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'token 已过期' });
    }
    res.status(401).json({ message: 'token 无效' });
  }
});

/**
 * POST /api/auth/userinfo
 * 更新用户信息
 */
router.post('/userinfo', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: '未提供 token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { nickname, avatar, gender, city, province, country } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (gender !== undefined) user.gender = gender;
    if (city) user.city = city;
    if (province) user.province = province;
    if (country) user.country = country;

    await user.save();

    res.json({
      message: '更新成功',
      userInfo: {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        city: user.city,
        province: user.province,
        level: user.level
      }
    });

  } catch (error) {
    console.error('更新用户信息错误:', error.message);
    res.status(500).json({ message: '更新失败' });
  }
});

module.exports = router;
