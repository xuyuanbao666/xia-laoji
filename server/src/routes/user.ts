import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /me - 获取当前用户信息（需要认证）
 */
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        error: {
          message: '未授权访问',
        },
      });
      return;
    }

    // 这里可以调用用户服务获取用户信息
    // 暂时返回简单信息
    res.json({
      success: true,
      data: {
        userId,
      },
    });
  } catch (error: any) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: {
        message: '获取用户信息失败',
      },
    });
  }
});

export default router;
