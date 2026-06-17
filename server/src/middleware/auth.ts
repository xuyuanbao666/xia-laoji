import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT 配置
const JWT_SECRET = process.env.JWT_SECRET || 'xia-laoji-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 扩展 Request 接口，添加 userId
export interface AuthRequest extends Request {
  userId?: string;
}

// 生成 JWT Token
export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

// 验证 JWT Token 中间件
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 从 Authorization header 获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          message: '未提供认证 token',
        },
      });
      return;
    }

    // 提取 token
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: {
          message: 'token 格式错误',
        },
      });
      return;
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // 将 userId 添加到 request 对象
    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          message: 'token 已过期',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          message: '无效的 token',
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        message: '认证服务错误',
      },
    });
  }
};

export default authMiddleware;
