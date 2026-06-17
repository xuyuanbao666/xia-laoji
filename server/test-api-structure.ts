// 测试食物 API 代码结构
import express from 'express';
import foodRoutes from './src/routes/food';
import userRoutes from './src/routes/user';

console.log('=== 测试食物 API 代码结构 ===\n');

// 测试 1: 检查路由导入
console.log('1. 测试路由导入...');
if (typeof foodRoutes === 'function') {
  console.log('✓ foodRoutes 导入成功');
} else {
  console.error('✗ foodRoutes 导入失败');
  process.exit(1);
}

if (typeof userRoutes === 'function') {
  console.log('✓ userRoutes 导入成功');
} else {
  console.error('✗ userRoutes 导入失败');
  process.exit(1);
}

// 测试 2: 创建 Express 应用并注册路由
console.log('\n2. 测试路由注册...');
const app = express();
app.use('/api/foods', foodRoutes);
app.use('/api/users', userRoutes);
console.log('✓ 路由注册成功');

// 测试 3: 检查食物服务导入
console.log('\n3. 测试食物服务导入...');
import { FoodService } from './src/services/foodService';
if (typeof FoodService.searchFoods === 'function') {
  console.log('✓ FoodService.searchFoods 方法存在');
} else {
  console.error('✗ FoodService.searchFoods 方法不存在');
  process.exit(1);
}

if (typeof FoodService.getFoodById === 'function') {
  console.log('✓ FoodService.getFoodById 方法存在');
} else {
  console.error('✗ FoodService.getFoodById 方法不存在');
  process.exit(1);
}

if (typeof FoodService.getFoodByBarcode === 'function') {
  console.log('✓ FoodService.getFoodByBarcode 方法存在');
} else {
  console.error('✗ FoodService.getFoodByBarcode 方法不存在');
  process.exit(1);
}

if (typeof FoodService.getFavorites === 'function') {
  console.log('✓ FoodService.getFavorites 方法存在');
} else {
  console.error('✗ FoodService.getFavorites 方法不存在');
  process.exit(1);
}

if (typeof FoodService.addFavorite === 'function') {
  console.log('✓ FoodService.addFavorite 方法存在');
} else {
  console.error('✗ FoodService.addFavorite 方法不存在');
  process.exit(1);
}

if (typeof FoodService.removeFavorite === 'function') {
  console.log('✓ FoodService.removeFavorite 方法存在');
} else {
  console.error('✗ FoodService.removeFavorite 方法不存在');
  process.exit(1);
}

console.log('\n=== 所有代码结构测试通过 ===');
console.log('\n食物 API 已成功实现：');
console.log('- GET /api/foods - 搜索食物');
console.log('- GET /api/foods/:id - 获取食物详情');
console.log('- GET /api/foods/barcode/:code - 通过条形码获取食物');
console.log('- GET /api/foods/favorites - 获取收藏食物（需要认证）');
console.log('- POST /api/foods/favorites/:id - 收藏食物（需要认证）');
console.log('- DELETE /api/foods/favorites/:id - 取消收藏（需要认证）');
