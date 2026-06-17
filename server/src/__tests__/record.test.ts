import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import Food from '../models/Food';
import DietRecord from '../models/DietRecord';
import { setupTestDB, teardownTestDB, clearDatabase } from './setup';

// 测试食物数据
const testFood = {
  name: 'Rice',
  nameZh: '米饭',
  category: 'staple' as const,
  nutrition: {
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    fiber: 0.4,
    sugar: 0,
    sodium: 1,
  },
  servingSize: 100,
  servingName: '100g',
  source: 'builtin' as const,
};

// 测试用户数据
const testUser = {
  email: 'recordtest@example.com',
  password: 'password123',
  profile: {
    name: '记录测试用户',
    gender: 'male' as const,
    birthday: new Date('1992-08-20'),
    height: 180,
    currentWeight: 75,
    targetWeight: 70,
    activityLevel: 'active' as const,
  },
};

describe('记录 API', () => {
  let authToken: string;
  let userId: string;
  let foodId: string;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();

    // 创建测试用户
    const userRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = userRes.body.data.token;
    userId = userRes.body.data.user._id;

    // 创建测试食物
    const food = await Food.create(testFood);
    foodId = food._id.toString();
  });

  describe('POST /api/records', () => {
    it('应该成功创建饮食记录', async () => {
      const recordData = {
        date: '2024-01-15',
        meal: 'lunch',
        foods: [
          {
            foodId: foodId,
            amount: 200,
          },
        ],
        note: '午餐测试',
      };

      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send(recordData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.meal).toBe('lunch');
      expect(res.body.data.foods.length).toBe(1);
      expect(res.body.data.totalNutrition.calories).toBe(260); // 130 * 2
    });

    it('应该在缺少必填字段时返回 400', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          meal: 'lunch',
          // 缺少 foods
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('required');
    });

    it('应该在 meal 类型无效时返回 400', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          meal: 'invalid',
          foods: [{ foodId, amount: 100 }],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid meal type');
    });

    it('应该在 foods 为空数组时返回 400', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          meal: 'lunch',
          foods: [],
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('应该在食物不存在时返回 404', async () => {
      const fakeFoodId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: '2024-01-15',
          meal: 'lunch',
          foods: [{ foodId: fakeFoodId, amount: 100 }],
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Food not found');
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .post('/api/records')
        .send({
          date: '2024-01-15',
          meal: 'lunch',
          foods: [{ foodId, amount: 100 }],
        })
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('未提供认证 token');
    });
  });

  describe('GET /api/records', () => {
    beforeEach(async () => {
      // 创建测试记录
      await DietRecord.create({
        userId: userId,
        date: new Date('2024-01-15'),
        meal: 'breakfast',
        foods: [{
          foodId: new mongoose.Types.ObjectId(foodId),
          name: testFood.nameZh,
          amount: 100,
          nutrition: {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3,
          },
        }],
        totalNutrition: {
          calories: 130,
          protein: 2.7,
          carbs: 28,
          fat: 0.3,
        },
      });

      await DietRecord.create({
        userId: userId,
        date: new Date('2024-01-15'),
        meal: 'lunch',
        foods: [{
          foodId: new mongoose.Types.ObjectId(foodId),
          name: testFood.nameZh,
          amount: 200,
          nutrition: {
            calories: 260,
            protein: 5.4,
            carbs: 56,
            fat: 0.6,
          },
        }],
        totalNutrition: {
          calories: 260,
          protein: 5.4,
          carbs: 56,
          fat: 0.6,
        },
      });
    });

    it('应该返回所有记录', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('应该支持日期范围过滤', async () => {
      const res = await request(app)
        .get('/api/records?startDate=2024-01-15&endDate=2024-01-15')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('应该在日期范围外返回空列表', async () => {
      const res = await request(app)
        .get('/api/records?startDate=2024-02-01&endDate=2024-02-28')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .get('/api/records')
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('未提供认证 token');
    });
  });

  describe('GET /api/records/daily/:date', () => {
    beforeEach(async () => {
      // 创建测试记录
      await DietRecord.create({
        userId: userId,
        date: new Date('2024-01-15'),
        meal: 'breakfast',
        foods: [{
          foodId: new mongoose.Types.ObjectId(foodId),
          name: testFood.nameZh,
          amount: 100,
          nutrition: {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3,
          },
        }],
        totalNutrition: {
          calories: 130,
          protein: 2.7,
          carbs: 28,
          fat: 0.3,
        },
      });

      await DietRecord.create({
        userId: userId,
        date: new Date('2024-01-15'),
        meal: 'lunch',
        foods: [{
          foodId: new mongoose.Types.ObjectId(foodId),
          name: testFood.nameZh,
          amount: 200,
          nutrition: {
            calories: 260,
            protein: 5.4,
            carbs: 56,
            fat: 0.6,
          },
        }],
        totalNutrition: {
          calories: 260,
          protein: 5.4,
          carbs: 56,
          fat: 0.6,
        },
      });
    });

    it('应该返回每日汇总', async () => {
      const res = await request(app)
        .get('/api/records/daily/2024-01-15')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('date');
      expect(res.body.data).toHaveProperty('totalNutrition');
      expect(res.body.data).toHaveProperty('meals');
      expect(res.body.data.totalNutrition.calories).toBe(390); // 130 + 260
    });

    it('应该在日期格式无效时返回 400', async () => {
      const res = await request(app)
        .get('/api/records/daily/invalid-date')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('YYYY-MM-DD');
    });

    it('应该在没有记录时返回空汇总', async () => {
      const res = await request(app)
        .get('/api/records/daily/2024-02-01')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalNutrition.calories).toBe(0);
      expect(res.body.data.meals.length).toBe(0);
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .get('/api/records/daily/2024-01-15')
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('未提供认证 token');
    });
  });

  describe('PUT /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      // 创建测试记录
      const record = await DietRecord.create({
        userId: userId,
        date: new Date('2024-01-15'),
        meal: 'lunch',
        foods: [{
          foodId: new mongoose.Types.ObjectId(foodId),
          name: testFood.nameZh,
          amount: 200,
          nutrition: {
            calories: 260,
            protein: 5.4,
            carbs: 56,
            fat: 0.6,
          },
        }],
        totalNutrition: {
          calories: 260,
          protein: 5.4,
          carbs: 56,
          fat: 0.6,
        },
      });
      recordId = record._id.toString();
    });

    it('应该成功更新记录', async () => {
      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          meal: 'dinner',
          note: '更新后的备注',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.meal).toBe('dinner');
      expect(res.body.data.note).toBe('更新后的备注');
    });

    it('应该成功更新食物', async () => {
      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          foods: [{ foodId, amount: 300 }],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.foods[0].amount).toBe(300);
      expect(res.body.data.totalNutrition.calories).toBe(390); // 130 * 3
    });

    it('应该在记录不存在时返回 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/records/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          meal: 'dinner',
        })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .put(`/api/records/${recordId}`)
        .send({
          meal: 'dinner',
        })
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('未提供认证 token');
    });
  });

  describe('DELETE /api/records/:id', () => {
    let recordId: string;

    beforeEach(async () => {
      // 创建测试记录
      const record = await DietRecord.create({
        userId: userId,
        date: new Date('2024-01-15'),
        meal: 'lunch',
        foods: [{
          foodId: new mongoose.Types.ObjectId(foodId),
          name: testFood.nameZh,
          amount: 100,
          nutrition: {
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3,
          },
        }],
        totalNutrition: {
          calories: 130,
          protein: 2.7,
          carbs: 28,
          fat: 0.3,
        },
      });
      recordId = record._id.toString();
    });

    it('应该成功删除记录', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');

      // 验证记录已删除
      const record = await DietRecord.findById(recordId);
      expect(record).toBeNull();
    });

    it('应该在记录不存在时返回 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/records/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('应该在未认证时返回 401', async () => {
      const res = await request(app)
        .delete(`/api/records/${recordId}`)
        .expect(401);

      // auth middleware 返回 { error: { message: '...' } } 格式
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('未提供认证 token');
    });
  });
});
