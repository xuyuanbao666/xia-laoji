import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import Food from '../models/Food';
import User from '../models/User';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup';

// 测试食物数据
const testFood = {
  name: 'Apple',
  nameZh: '苹果',
  brand: 'Test Brand',
  category: 'fruit' as const,
  nutrition: {
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
    fiber: 4.4,
    sugar: 19,
    sodium: 2,
  },
  servingSize: 182,
  servingName: '1 medium',
  barcode: '1234567890123',
  source: 'builtin' as const,
};

// 测试用户数据
const testUser = {
  email: 'foodtest@example.com',
  password: 'password123',
  profile: {
    name: '食物测试用户',
    gender: 'female' as const,
    birthday: new Date('1995-05-15'),
    height: 165,
    currentWeight: 55,
    targetWeight: 50,
    activityLevel: 'light' as const,
  },
};

describe('食物 API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // 创建测试用户并获取 token
    const userRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = userRes.body.data.token;
    userId = userRes.body.data.user._id;
  });

  describe('GET /api/foods', () => {
    beforeEach(async () => {
      // 创建测试食物
      await Food.create(testFood);
      await Food.create({
        ...testFood,
        name: 'Banana',
        nameZh: '香蕉',
        barcode: '9876543210987',
        nutrition: {
          ...testFood.nutrition,
          calories: 105,
        },
      });
    });

    it('应该返回食物列表', async () => {
      const res = await request(app)
        .get('/api/foods')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.foods).toBeInstanceOf(Array);
      expect(res.body.data.foods.length).toBe(2);
      expect(res.body.data.total).toBe(2);
    });

    it('应该支持分页', async () => {
      const res = await request(app)
        .get('/api/foods?page=1&limit=1')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.foods.length).toBe(1);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.totalPages).toBe(2);
    });

    it('应该在分页参数无效时返回 400', async () => {
      const res = await request(app)
        .get('/api/foods?page=0')
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('应该在 limit 超出范围时返回 400', async () => {
      const res = await request(app)
        .get('/api/foods?limit=101')
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/foods/:id', () => {
    let foodId: string;

    beforeEach(async () => {
      const food = await Food.create(testFood);
      foodId = food._id.toString();
    });

    it('应该返回食物详情', async () => {
      const res = await request(app)
        .get(`/api/foods/${foodId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nameZh).toBe(testFood.nameZh);
      expect(res.body.data.nutrition.calories).toBe(testFood.nutrition.calories);
    });

    it('应该在食物不存在时返回 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/foods/${fakeId}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/foods/barcode/:code', () => {
    beforeEach(async () => {
      await Food.create(testFood);
    });

    it('应该通过条形码获取食物', async () => {
      const res = await request(app)
        .get(`/api/foods/barcode/${testFood.barcode}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nameZh).toBe(testFood.nameZh);
    });

    it('应该在条形码不存在时返回 404', async () => {
      const res = await request(app)
        .get('/api/foods/barcode/0000000000000')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/foods/favorites/:id', () => {
    let foodId: string;

    beforeEach(async () => {
      const food = await Food.create(testFood);
      foodId = food._id.toString();
    });

    it('应该成功收藏食物', async () => {
      const res = await request(app)
        .post(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('favorites');
    });

    it('应该在重复收藏时返回 409', async () => {
      // 第一次收藏
      await request(app)
        .post(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // 重复收藏
      const res = await request(app)
        .post(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already');
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .post(`/api/foods/favorites/${foodId}`)
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('认证');
    });

    it('应该在食物不存在时返回错误', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/foods/favorites/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500); // FoodService 会抛出错误

      // 服务层错误会被全局错误处理捕获
    });
  });

  describe('DELETE /api/foods/favorites/:id', () => {
    let foodId: string;

    beforeEach(async () => {
      const food = await Food.create(testFood);
      foodId = food._id.toString();

      // 先添加收藏
      await request(app)
        .post(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('应该成功取消收藏', async () => {
      const res = await request(app)
        .delete(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removed');
    });

    it('应该在取消未收藏的食物时返回 404', async () => {
      // 先取消收藏
      await request(app)
        .delete(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // 再次取消
      const res = await request(app)
        .delete(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not in favorites');
    });
  });

  describe('GET /api/foods/favorites', () => {
    let foodId: string;

    beforeEach(async () => {
      const food = await Food.create(testFood);
      foodId = food._id.toString();

      // 添加收藏
      await request(app)
        .post(`/api/foods/favorites/${foodId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('应该返回收藏的食物列表', async () => {
      const res = await request(app)
        .get('/api/foods/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].nameZh).toBe(testFood.nameZh);
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .get('/api/foods/favorites')
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('认证');
    });
  });
});
