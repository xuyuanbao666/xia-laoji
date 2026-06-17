import axios from 'axios';

const API_BASE = 'http://localhost:3000';

async function testFoodAPI() {
  console.log('=== 食物 API 测试 ===\n');

  try {
    // 测试 1: 搜索食物
    console.log('1. 测试搜索食物...');
    const searchResult = await axios.get(`${API_BASE}/api/foods`, {
      params: { q: '米饭', page: 1, limit: 10 }
    });
    console.log('✓ 搜索成功');
    console.log('  返回数据:', JSON.stringify(searchResult.data, null, 2));
    console.log('');

    // 测试 2: 获取食物详情（如果没有数据，跳过）
    if (searchResult.data.data.foods.length > 0) {
      const foodId = searchResult.data.data.foods[0]._id;
      console.log('2. 测试获取食物详情...');
      const detailResult = await axios.get(`${API_BASE}/api/foods/${foodId}`);
      console.log('✓ 获取详情成功');
      console.log('  食物名称:', detailResult.data.data.nameZh);
      console.log('');

      // 测试 3: 通过条形码获取食物（如果有条形码）
      if (detailResult.data.data.barcode) {
        console.log('3. 测试通过条形码获取食物...');
        const barcodeResult = await axios.get(`${API_BASE}/api/foods/barcode/${detailResult.data.data.barcode}`);
        console.log('✓ 通过条形码获取成功');
        console.log('');
      }
    }

    // 测试 4: 获取收藏（需要认证）
    console.log('4. 测试获取收藏（需要认证）...');
    try {
      const favoritesResult = await axios.get(`${API_BASE}/api/foods/favorites`);
      console.log('✓ 获取收藏成功');
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✓ 正确返回 401 未授权（未提供 token）');
      } else {
        throw error;
      }
    }
    console.log('');

    // 测试 5: 健康检查
    console.log('5. 测试健康检查...');
    const healthResult = await axios.get(`${API_BASE}/health`);
    console.log('✓ 服务正常');
    console.log('  状态:', healthResult.data.status);
    console.log('');

    console.log('=== 所有测试通过 ===');

  } catch (error: any) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

testFoodAPI();
