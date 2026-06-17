import { Router, Request, Response } from 'express';
import authService from '../services/authService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendVerificationCode } from '../services/emailService';
import { generateCode, storeCode, verifyCode, canSendCode } from '../services/verificationService';

const router = Router();

/**
 * POST /send-code - 发送验证码
 * Body: { email }
 */
router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: '请输入有效的邮箱地址' });
      return;
    }

    // 检查是否发送太频繁
    if (!canSendCode(email)) {
      res.status(429).json({ success: false, message: '发送太频繁，请60秒后再试' });
      return;
    }

    // 生成验证码
    const code = generateCode();

    // 存储验证码
    storeCode(email, code);

    // 发送邮件
    const sent = await sendVerificationCode(email, code);

    if (sent) {
      res.json({ success: true, message: '验证码已发送，请查收邮箱' });
    } else {
      res.status(500).json({ success: false, message: '发送失败，请稍后重试' });
    }
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * POST /verify-code - 验证验证码
 * Body: { email, code }
 */
router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ success: false, message: '请输入邮箱和验证码' });
      return;
    }

    const isValid = verifyCode(email, code);

    if (isValid) {
      res.json({ success: true, message: '验证码正确' });
    } else {
      res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/**
 * POST /register - 用户注册
 * Body: { email, password, profile?: { name, ... }, goals? }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, profile: rawProfile, goals } = req.body;

    // 验证必填字段
    if (!email || !password) {
      res.status(400).json({
        error: {
          message: '请提供邮箱和密码',
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

    // 使用默认 profile，如果提供了则合并
    const defaultProfile = {
      name: email.split('@')[0],
      gender: 'male',
      birthday: '2000-01-01',
      height: 170,
      currentWeight: 65,
      targetWeight: 60,
      activityLevel: 'light',
    };

    const profile = { ...defaultProfile, ...(rawProfile || {}) };

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
