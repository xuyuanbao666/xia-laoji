import { Router, Request, Response } from 'express';
import authService from '../services/authService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /register - 用户注册
 * Body: { email, password, profile: { name, gender, birthday, height, currentWeight, targetWeight, activityLevel }, goals? }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, profile, goals } = req.body;

    // 验证必填字段
    if (!email || !password) {
      res.status(400).json({
        error: {
          message: '请提供邮箱和密码',
        },
      });
      return;
    }

    if (!profile) {
      res.status(400).json({
        error: {
          message: '请提供用户资料',
        },
      });
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({
        error: {
          message: '密码长度至少为 6 位',
        },
      });
      return;
    }

    // 验证 profile 必填字段
    const requiredProfileFields = [
      'name',
      'gender',
      'birthday',
      'height',
      'currentWeight',
      'targetWeight',
      'activityLevel',
    ];

    for (const field of requiredProfileFields) {
      if (!profile[field]) {
        res.status(400).json({
          error: {
            message: `请提供用户资料中的 ${field} 字段`,
          },
        });
        return;
      }
    }

    // 调用注册服务
    const result = await authService.register(email, password, profile, goals);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.message === '该邮箱已被注册') {
      res.status(409).json({
        error: {
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        message: '注册失败，请稍后重试',
      },
    });
  }
});

/**
 * POST /login - 用户登录
 * Body: { email, password }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      res.status(400).json({
        error: {
          message: '请提供邮箱和密码',
        },
      });
      return;
    }

    // 调用登录服务
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message === '邮箱或密码错误') {
      res.status(401).json({
        error: {
          message: error.message,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        message: '登录失败，请稍后重试',
      },
    });
  }
});

/**
 * GET /profile - 获取用户信息（需要认证）
 * Headers: Authorization: Bearer <token>
 */
router.get(
  '/profile',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
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

      // 调用获取用户信息服务
      const user = await authService.getProfile(userId);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      console.error('Get profile error:', error);

      if (error.message === '用户不存在') {
        res.status(404).json({
          error: {
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          message: '获取用户信息失败',
        },
      });
    }
  }
);

/**
 * PUT /profile - 更新用户信息（需要认证）
 * Headers: Authorization: Bearer <token>
 * Body: { profile?: {...}, goals?: {...} }
 */
router.put(
  '/profile',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      const updates = req.body;

      if (!userId) {
        res.status(401).json({
          error: {
            message: '未授权访问',
          },
        });
        return;
      }

      // 验证更新内容
      if (!updates.profile && !updates.goals) {
        res.status(400).json({
          error: {
            message: '请提供要更新的内容',
          },
        });
        return;
      }

      // 调用更新用户信息服务
      const user = await authService.updateProfile(userId, updates);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error: any) {
      console.error('Update profile error:', error);

      if (error.message === '用户不存在') {
        res.status(404).json({
          error: {
            message: error.message,
          },
        });
        return;
      }

      res.status(500).json({
        error: {
          message: '更新用户信息失败',
        },
      });
    }
  }
);

export default router;
