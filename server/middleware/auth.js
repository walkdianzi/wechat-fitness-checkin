// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * JWT 认证中间件
 * 验证 Authorization header 中的 Bearer token
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      message: '未提供认证信息',
      code: 'NO_AUTH_HEADER'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: '认证格式错误，应为 Bearer {token}',
      code: 'INVALID_AUTH_FORMAT'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 将用户信息附加到请求对象
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    req.iat = decoded.iat;
    req.exp = decoded.exp;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'token 已过期',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'token 无效',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      message: '认证服务错误',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 可选认证中间件
 * token 存在则验证，不存在则跳过
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.openid = decoded.openid;
  } catch (error) {
    // token 无效则忽略，继续执行
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuth
};
