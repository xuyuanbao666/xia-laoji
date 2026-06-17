import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// 测试数据
let authToken: string = '';
let testUserId: string = '';
let testFoodId: string = '';
let testRecordId: string = '';

// 辅助函数：发送请求
async function makeRequest(
  method: 'get' | 'post' | 'put' | 'delete',
  url: string,
  data?: any,
  token?: string
) {
  const headers: any = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      data,
      headers,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// 测试用例
async function runTests() {
  console.log('=== 饮食记录 API 测试 ===\n');

  // 1. 首先需要登录获取 token
  console.log('1. 登录获取 token...');
  try {
    // 使用测试用户登录（假设已存在）
    const loginResult = await makeRequest('post', '/api/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    if (loginResult.success) {
      authToken = loginResult.data.token;
      testUserId = loginResult.data.user.id;
      console.log('✅ 登录成功');
      console.log('   Token:', authToken.substring(0, 20) + '...');
    } else {
      console.log('❌ 登录失败:', loginResult.message);
      console.log('   请确保测试用户已存在，或修改测试邮箱/密码');
      return;
    }
  } catch (error) {
    console.log('❌ 登录请求失败，请确保服务器正在运行');
    return;
  }

  // 2. 获取一个食物用于测试
  console.log('\n2. 获取测试食物...');
  try {
    const foodsResult = await makeRequest('get', '/api/foods?limit=1');
    if (foodsResult.success && foodsResult.data.foods.length > 0) {
      testFoodId = foodsResult.data.foods[0]._id;
      console.log('✅ 获取食物成功:', foodsResult.data.foods[0].nameZh || foodsResult.data.foods[0].name);
    } else {
      console.log('❌ 无法获取食物，请确保数据库中有食物数据');
      return;
    }
  } catch (error) {
    console.log('❌ 获取食物失败');
    return;
  }

  // 3. 创建饮食记录
  console.log('\n3. 创建饮食记录...');
  const createData = {
    date: new Date().toISOString(),
    meal: 'lunch',
    foods: [
      { foodId: testFoodId, amount: 200 },
    ],
    note: '测试午餐',
  };

  const createResult = await makeRequest('post', '/api/records', createData, authToken);
  if (createResult.success) {
    testRecordId = createResult.data._id;
    console.log('✅ 创建记录成功');
    console.log('   记录 ID:', testRecordId);
    console.log('   总热量:', createResult.data.totalNutrition.calories, 'kcal');
    console.log('   蛋白质:', createResult.data.totalNutrition.protein, 'g');
    console.log('   碳水化合物:', createResult.data.totalNutrition.carbs, 'g');
    console.log('   脂肪:', createResult.data.totalNutrition.fat, 'g');
  } else {
    console.log('❌ 创建记录失败:', createResult.message);
  }

  // 4. 获取记录列表
  console.log('\n4. 获取记录列表...');
  const today = new Date().toISOString().split('T')[0];
  const listResult = await makeRequest('get', `/api/records?startDate=${today}&endDate=${today}`, undefined, authToken);
  if (listResult.success) {
    console.log('✅ 获取记录列表成功');
    console.log('   记录数量:', listResult.data.length);
  } else {
    console.log('❌ 获取记录列表失败:', listResult.message);
  }

  // 5. 获取每日汇总
  console.log('\n5. 获取每日汇总...');
  const summaryResult = await makeRequest('get', `/api/records/daily/${today}`, undefined, authToken);
  if (summaryResult.success) {
    console.log('✅ 获取每日汇总成功');
    console.log('   日期:', summaryResult.data.date);
    console.log('   总热量:', summaryResult.data.totalNutrition.calories, 'kcal');
    console.log('   餐次数:', summaryResult.data.meals.length);
  } else {
    console.log('❌ 获取每日汇总失败:', summaryResult.message);
  }

  // 6. 更新记录
  console.log('\n6. 更新记录...');
  if (testRecordId) {
    const updateData = {
      note: '更新后的午餐记录',
      foods: [
        { foodId: testFoodId, amount: 250 },
      ],
    };

    const updateResult = await makeRequest('put', `/api/records/${testRecordId}`, updateData, authToken);
    if (updateResult.success) {
      console.log('✅ 更新记录成功');
      console.log('   新总热量:', updateResult.data.totalNutrition.calories, 'kcal');
    } else {
      console.log('❌ 更新记录失败:', updateResult.message);
    }
  }

  // 7. 删除记录
  console.log('\n7. 删除记录...');
  if (testRecordId) {
    const deleteResult = await makeRequest('delete', `/api/records/${testRecordId}`, undefined, authToken);
    if (deleteResult.success) {
      console.log('✅ 删除记录成功');
    } else {
      console.log('❌ 删除记录失败:', deleteResult.message);
    }
  }

  console.log('\n=== 测试完成 ===');
}

// 运行测试
runTests().catch(console.error);
