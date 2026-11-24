import { storeCode } from '../services/verificationService';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/User';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup';

// 测试用户数据
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  profile: {
    name: '测试用户',
    gender: 'male' as const,
    birthday: new Date('1990-01-01'),
    height: 175,
    currentWeight: 70,
    targetWeight: 65,
    activityLevel: 'moderate' as const,
  },
  goals: {
    dailyCalories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
  },
};

function verifiedRegistration() {
  const code = '123456';
  storeCode(testUser.email, code);
  return { ...testUser, code };
}

describe('认证 API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('rejects incorrect verification codes', async () => {
      storeCode(testUser.email, '123456');
      await request(app).post('/api/auth/register').send({ ...testUser, code: '654321' }).expect(400);
    });
    it('consumes a valid code and rejects replay', async () => {
      const payload = verifiedRegistration();
      await request(app).post('/api/auth/register').send(payload).expect(201);
      await request(app).post('/api/auth/register').send(payload).expect(400);
    });
    it('应该成功注册新用户', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(verifiedRegistration())
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.profile.name).toBe(testUser.profile.name);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('应该在缺少邮箱时返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'password123',
          profile: testUser.profile,
        })
        .expect(400);

      expect(res.body.error.message).toContain('邮箱');
    });

    it('应该在缺少密码时返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          profile: testUser.profile,
        })
        .expect(400);

      expect(res.body.error.message).toContain('邮箱和密码');
    });

    it('应该在密码长度不足时返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          password: '12345',
        })
        .expect(400);

      expect(res.body.error.message).toContain('密码长度');
    });

    it('应该在缺少邮箱验证码时返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(400);

      expect(res.body.error.message).toContain('邮箱验证码');
    });

    it('应该在重复注册时返回 409', async () => {
      // 第一次注册
      await request(app)
        .post('/api/auth/register')
        .send(verifiedRegistration())
        .expect(201);

      // 重复注册
      const res = await request(app)
        .post('/api/auth/register')
        .send(verifiedRegistration())
        .expect(409);

      expect(res.body.error.message).toContain('已被注册');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 注册用户
      await request(app)
        .post('/api/auth/register')
        .send(verifiedRegistration());
    });

    it('应该成功登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    });

    it('应该在密码错误时返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.error.message).toContain('邮箱或密码错误');
    });

    it('应该在邮箱不存在时返回 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(res.body.error.message).toContain('邮箱或密码错误');
    });

    it('应该在缺少邮箱时返回 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);

      expect(res.body.error.message).toContain('邮箱和密码');
    });
  });

  describe('GET /api/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      // 注册并获取 token
      const res = await request(app)
        .post('/api/auth/register')
        .send(verifiedRegistration());

      token = res.body.data.token;
    });

    it('应该成功获取用户信息', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.profile.name).toBe(testUser.profile.name);
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('应该在未提供 token 时返回 401', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(res.body.error.message).toContain('未提供认证 token');
    });

    it('应该在 token 无效时返回 401', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(res.body.error.message).toContain('无效的 token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token: string;

    beforeEach(async () => {
      // 注册并获取 token
      const res = await request(app)
        .post('/api/auth/register')
        .send(verifiedRegistration());

      token = res.body.data.token;
    });

    it('应该成功更新用户资料', async () => {
      const updates = {
        profile: {
          name: '更新后的名字',
          currentWeight: 68,
        },
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.profile.name).toBe('更新后的名字');
      expect(res.body.data.user.profile.currentWeight).toBe(68);
    });

    it('应该成功更新用户目标', async () => {
      const updates = {
        goals: {
          dailyCalories: 1800,
          protein: 60,
        },
      };

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.goals.dailyCalories).toBe(1800);
      expect(res.body.data.user.goals.protein).toBe(60);
    });

    it('应该在未提供更新内容时返回 400', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(res.body.error.message).toContain('要更新的内容');
    });

    it('应该在未提供 token 时返回 401', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({
          profile: { name: 'test' },
        })
        .expect(401);

      expect(res.body.error.message).toContain('未提供认证 token');
    });
  });
});
