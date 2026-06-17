import mongoose from 'mongoose';
import Food from '../models/Food';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/xia-laoji';

// 常见中国食物数据库（200+种）
const foods = [
  // ========== 主食类 ==========
  { name: 'White Rice', nameZh: '白米饭', category: 'staple', nutrition: { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3, fiber: 0.4, sugar: 0, sodium: 2 }, servingSize: 100, servingName: '1碗' },
  { name: 'Brown Rice', nameZh: '糙米饭', category: 'staple', nutrition: { calories: 111, protein: 2.6, carbs: 23, fat: 0.9, fiber: 1.8, sugar: 0, sodium: 4 }, servingSize: 100, servingName: '1碗' },
  { name: 'Steamed Bun', nameZh: '馒头', category: 'staple', nutrition: { calories: 223, protein: 7, carbs: 44.2, fat: 1.1, fiber: 1.3, sugar: 1, sodium: 232 }, servingSize: 100, servingName: '1个' },
  { name: 'Noodles', nameZh: '面条', category: 'staple', nutrition: { calories: 110, protein: 3.4, carbs: 22.3, fat: 0.5, fiber: 1.2, sugar: 0.5, sodium: 3 }, servingSize: 100, servingName: '1碗' },
  { name: 'Ramen', nameZh: '拉面', category: 'staple', nutrition: { calories: 138, protein: 4.5, carbs: 25.2, fat: 1.8, fiber: 1.5, sugar: 0.8, sodium: 350 }, servingSize: 100, servingName: '1碗' },
  { name: 'Rice Noodles', nameZh: '米粉', category: 'staple', nutrition: { calories: 109, protein: 2.2, carbs: 24.5, fat: 0.3, fiber: 0.9, sugar: 0, sodium: 5 }, servingSize: 100, servingName: '1碗' },
  { name: 'Porridge', nameZh: '白粥', category: 'staple', nutrition: { calories: 46, protein: 1.1, carbs: 10.2, fat: 0.1, fiber: 0.1, sugar: 0, sodium: 2 }, servingSize: 100, servingName: '1碗' },
  { name: 'Congee with Egg', nameZh: '蛋花粥', category: 'staple', nutrition: { calories: 58, protein: 2.5, carbs: 9.8, fat: 1.2, fiber: 0.2, sugar: 0, sodium: 180 }, servingSize: 100, servingName: '1碗' },
  { name: 'Fried Rice', nameZh: '蛋炒饭', category: 'staple', nutrition: { calories: 180, protein: 6.5, carbs: 24.5, fat: 6.2, fiber: 0.8, sugar: 0.5, sodium: 450 }, servingSize: 100, servingName: '1盘' },
  { name: 'Bread', nameZh: '面包', category: 'staple', nutrition: { calories: 265, protein: 8.4, carbs: 49.1, fat: 3.2, fiber: 2.7, sugar: 5, sodium: 463 }, servingSize: 100, servingName: '2片' },
  { name: 'Whole Wheat Bread', nameZh: '全麦面包', category: 'staple', nutrition: { calories: 247, protein: 10, carbs: 41.3, fat: 3.5, fiber: 6.8, sugar: 3, sodium: 400 }, servingSize: 100, servingName: '2片' },
  { name: 'Steamed Bun with Meat', nameZh: '肉包子', category: 'staple', nutrition: { calories: 227, protein: 9.2, carbs: 28.5, fat: 8.3, fiber: 1.1, sugar: 2, sodium: 380 }, servingSize: 100, servingName: '1个' },
  { name: 'Vegetable Bun', nameZh: '菜包子', category: 'staple', nutrition: { calories: 195, protein: 7.5, carbs: 32.8, fat: 4.2, fiber: 2.1, sugar: 2.5, sodium: 320 }, servingSize: 100, servingName: '1个' },
  { name: 'Dumpling', nameZh: '饺子', category: 'staple', nutrition: { calories: 185, protein: 8.5, carbs: 22.3, fat: 6.8, fiber: 1.2, sugar: 1.5, sodium: 420 }, servingSize: 100, servingName: '10个' },
  { name: 'Wonton', nameZh: '馄饨', category: 'staple', nutrition: { calories: 120, protein: 6.2, carbs: 15.8, fat: 3.5, fiber: 0.8, sugar: 0.8, sodium: 380 }, servingSize: 100, servingName: '1碗' },
  { name: 'Baozi', nameZh: '小笼包', category: 'staple', nutrition: { calories: 210, protein: 9.5, carbs: 25.2, fat: 8.1, fiber: 0.8, sugar: 1.2, sodium: 450 }, servingSize: 100, servingName: '1笼' },
  { name: 'Spring Roll', nameZh: '春卷', category: 'staple', nutrition: { calories: 230, protein: 6.5, carbs: 28.5, fat: 10.2, fiber: 1.5, sugar: 2, sodium: 380 }, servingSize: 100, servingName: '3个' },
  { name: 'Soy Milk', nameZh: '豆浆', category: 'staple', nutrition: { calories: 31, protein: 2.9, carbs: 1.8, fat: 1.6, fiber: 0.6, sugar: 0, sodium: 5 }, servingSize: 100, servingName: '1杯' },
  { name: 'Youtiao', nameZh: '油条', category: 'staple', nutrition: { calories: 386, protein: 6.9, carbs: 44.5, fat: 19.2, fiber: 1.2, sugar: 0.5, sodium: 320 }, servingSize: 100, servingName: '1根' },
  { name: 'Zongzi', nameZh: '粽子', category: 'staple', nutrition: { calories: 195, protein: 5.2, carbs: 35.8, fat: 3.5, fiber: 0.8, sugar: 2, sodium: 180 }, servingSize: 100, servingName: '1个' },
  { name: 'Mantou', nameZh: '花卷', category: 'staple', nutrition: { calories: 210, protein: 6.8, carbs: 42.5, fat: 1.5, fiber: 1.1, sugar: 0.8, sodium: 210 }, servingSize: 100, servingName: '1个' },
  { name: 'Tangyuan', nameZh: '汤圆', category: 'staple', nutrition: { calories: 250, protein: 4.5, carbs: 48.2, fat: 4.8, fiber: 0.5, sugar: 15, sodium: 35 }, servingSize: 100, servingName: '8个' },
  { name: 'Sweet Potato', nameZh: '红薯', category: 'staple', nutrition: { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55 }, servingSize: 100, servingName: '1个' },
  { name: 'Corn', nameZh: '玉米', category: 'staple', nutrition: { calories: 86, protein: 3.2, carbs: 18.7, fat: 1.2, fiber: 2.7, sugar: 3.2, sodium: 15 }, servingSize: 100, servingName: '1根' },
  { name: 'Potato', nameZh: '土豆', category: 'staple', nutrition: { calories: 77, protein: 2, carbs: 17.5, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6 }, servingSize: 100, servingName: '1个' },
  { name: 'Taro', nameZh: '芋头', category: 'staple', nutrition: { calories: 79, protein: 2.2, carbs: 18.5, fat: 0.1, fiber: 4.1, sugar: 0, sodium: 12 }, servingSize: 100, servingName: '1个' },

  // ========== 肉类 ==========
  { name: 'Pork', nameZh: '猪肉', category: 'meat', nutrition: { calories: 242, protein: 13.2, carbs: 0, fat: 20.6, fiber: 0, sugar: 0, sodium: 62 }, servingSize: 100, servingName: '1份' },
  { name: 'Pork Loin', nameZh: '猪里脊', category: 'meat', nutrition: { calories: 155, protein: 20.2, carbs: 0, fat: 7.9, fiber: 0, sugar: 0, sodium: 55 }, servingSize: 100, servingName: '1份' },
  { name: 'Pork Belly', nameZh: '五花肉', category: 'meat', nutrition: { calories: 395, protein: 14, carbs: 0, fat: 37, fiber: 0, sugar: 0, sodium: 48 }, servingSize: 100, servingName: '1份' },
  { name: 'Chicken Breast', nameZh: '鸡胸肉', category: 'meat', nutrition: { calories: 133, protein: 25, carbs: 0, fat: 2.8, fiber: 0, sugar: 0, sodium: 47 }, servingSize: 100, servingName: '1份' },
  { name: 'Chicken Thigh', nameZh: '鸡腿', category: 'meat', nutrition: { calories: 181, protein: 19, carbs: 0, fat: 10.9, fiber: 0, sugar: 0, sodium: 68 }, servingSize: 100, servingName: '1个' },
  { name: 'Chicken Wing', nameZh: '鸡翅', category: 'meat', nutrition: { calories: 222, protein: 18.4, carbs: 0, fat: 15.8, fiber: 0, sugar: 0, sodium: 72 }, servingSize: 100, servingName: '2个' },
  { name: 'Beef', nameZh: '牛肉', category: 'meat', nutrition: { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0, sodium: 72 }, servingSize: 100, servingName: '1份' },
  { name: 'Beef Shank', nameZh: '牛腱子', category: 'meat', nutrition: { calories: 120, protein: 22, carbs: 0, fat: 3, fiber: 0, sugar: 0, sodium: 65 }, servingSize: 100, servingName: '1份' },
  { name: 'Lamb', nameZh: '羊肉', category: 'meat', nutrition: { calories: 203, protein: 19, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 75 }, servingSize: 100, servingName: '1份' },
  { name: 'Duck', nameZh: '鸭肉', category: 'meat', nutrition: { calories: 240, protein: 16, carbs: 0, fat: 19, fiber: 0, sugar: 0, sodium: 60 }, servingSize: 100, servingName: '1份' },
  { name: 'Duck Breast', nameZh: '鸭胸', category: 'meat', nutrition: { calories: 132, protein: 19.7, carbs: 0, fat: 6, fiber: 0, sugar: 0, sodium: 55 }, servingSize: 100, servingName: '1份' },
  { name: 'Chinese Sausage', nameZh: '腊肠', category: 'meat', nutrition: { calories: 415, protein: 24.1, carbs: 4.8, fat: 32.5, fiber: 0, sugar: 1.5, sodium: 1235 }, servingSize: 100, servingName: '2根' },
  { name: 'Bacon', nameZh: '培根', category: 'meat', nutrition: { calories: 541, protein: 37, carbs: 1.4, fat: 42, fiber: 0, sugar: 0, sodium: 1717 }, servingSize: 100, servingName: '2片' },
  { name: 'Ham', nameZh: '火腿', category: 'meat', nutrition: { calories: 145, protein: 16, carbs: 1.5, fat: 8, fiber: 0, sugar: 1, sodium: 1050 }, servingSize: 100, servingName: '2片' },
  { name: 'Liver', nameZh: '猪肝', category: 'meat', nutrition: { calories: 129, protein: 19.3, carbs: 3, fat: 3.5, fiber: 0, sugar: 0, sodium: 65 }, servingSize: 100, servingName: '1份' },

  // ========== 海鲜类 ==========
  { name: 'Fish', nameZh: '鱼肉', category: 'seafood', nutrition: { calories: 96, protein: 18.6, carbs: 0, fat: 2.1, fiber: 0, sugar: 0, sodium: 53 }, servingSize: 100, servingName: '1份' },
  { name: 'Salmon', nameZh: '三文鱼', category: 'seafood', nutrition: { calories: 139, protein: 21.3, carbs: 0, fat: 6, fiber: 0, sugar: 0, sodium: 44 }, servingSize: 100, servingName: '1片' },
  { name: 'Tuna', nameZh: '金枪鱼', category: 'seafood', nutrition: { calories: 132, protein: 28, carbs: 0, fat: 1.3, fiber: 0, sugar: 0, sodium: 47 }, servingSize: 100, servingName: '1份' },
  { name: 'Shrimp', nameZh: '虾', category: 'seafood', nutrition: { calories: 99, protein: 20.4, carbs: 0.2, fat: 1.7, fiber: 0, sugar: 0, sodium: 302 }, servingSize: 100, servingName: '1份' },
  { name: 'Crab', nameZh: '螃蟹', category: 'seafood', nutrition: { calories: 97, protein: 19.2, carbs: 0, fat: 2, fiber: 0, sugar: 0, sodium: 339 }, servingSize: 100, servingName: '1只' },
  { name: 'Squid', nameZh: '鱿鱼', category: 'seafood', nutrition: { calories: 75, protein: 15.6, carbs: 1.5, fat: 0.8, fiber: 0, sugar: 0, sodium: 213 }, servingSize: 100, servingName: '1份' },
  { name: 'Octopus', nameZh: '章鱼', category: 'seafood', nutrition: { calories: 82, protein: 15.4, carbs: 2.2, fat: 0.8, fiber: 0, sugar: 0, sodium: 230 }, servingSize: 100, servingName: '1份' },
  { name: 'Clam', nameZh: '蛤蜊', category: 'seafood', nutrition: { calories: 62, protein: 10.9, carbs: 2.8, fat: 0.8, fiber: 0, sugar: 0, sodium: 556 }, servingSize: 100, servingName: '1份' },
  { name: 'Oyster', nameZh: '生蚝', category: 'seafood', nutrition: { calories: 68, protein: 7, carbs: 3.9, fat: 2.3, fiber: 0, sugar: 0, sodium: 462 }, servingSize: 100, servingName: '2只' },
  { name: 'Eel', nameZh: '鳗鱼', category: 'seafood', nutrition: { calories: 184, protein: 16.4, carbs: 0, fat: 11.7, fiber: 0, sugar: 0, sodium: 58 }, servingSize: 100, servingName: '1份' },

  // ========== 蔬菜类 ==========
  { name: 'Cabbage', nameZh: '白菜', category: 'vegetable', nutrition: { calories: 13, protein: 1.5, carbs: 2.2, fat: 0.2, fiber: 1.2, sugar: 1.2, sodium: 65 }, servingSize: 100, servingName: '1份' },
  { name: 'Spinach', nameZh: '菠菜', category: 'vegetable', nutrition: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 }, servingSize: 100, servingName: '1份' },
  { name: 'Tomato', nameZh: '番茄', category: 'vegetable', nutrition: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 }, servingSize: 100, servingName: '1个' },
  { name: 'Cucumber', nameZh: '黄瓜', category: 'vegetable', nutrition: { calories: 15, protein: 0.7, carbs: 2.6, fat: 0.2, fiber: 0.5, sugar: 1.7, sodium: 2 }, servingSize: 100, servingName: '1根' },
  { name: 'Broccoli', nameZh: '西兰花', category: 'vegetable', nutrition: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 }, servingSize: 100, servingName: '1份' },
  { name: 'Carrot', nameZh: '胡萝卜', category: 'vegetable', nutrition: { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 }, servingSize: 100, servingName: '1根' },
  { name: 'Green Pepper', nameZh: '青椒', category: 'vegetable', nutrition: { calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7, sugar: 2.4, sodium: 3 }, servingSize: 100, servingName: '1个' },
  { name: 'Eggplant', nameZh: '茄子', category: 'vegetable', nutrition: { calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3, sugar: 3.5, sodium: 2 }, servingSize: 100, servingName: '1根' },
  { name: 'Bean Sprouts', nameZh: '豆芽', category: 'vegetable', nutrition: { calories: 31, protein: 3, carbs: 5.9, fat: 0.2, fiber: 1.8, sugar: 0, sodium: 6 }, servingSize: 100, servingName: '1份' },
  { name: 'Green Beans', nameZh: '四季豆', category: 'vegetable', nutrition: { calories: 31, protein: 1.8, carbs: 7, fat: 0.1, fiber: 3.4, sugar: 0.7, sodium: 6 }, servingSize: 100, servingName: '1份' },
  { name: 'Mushroom', nameZh: '蘑菇', category: 'vegetable', nutrition: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, sugar: 2, sodium: 5 }, servingSize: 100, servingName: '1份' },
  { name: 'Shiitake Mushroom', nameZh: '香菇', category: 'vegetable', nutrition: { calories: 34, protein: 2.2, carbs: 6.8, fat: 0.3, fiber: 2.5, sugar: 2.5, sodium: 9 }, servingSize: 100, servingName: '3朵' },
  { name: 'Enoki Mushroom', nameZh: '金针菇', category: 'vegetable', nutrition: { calories: 31, protein: 2.7, carbs: 6, fat: 0.2, fiber: 2.7, sugar: 1, sodium: 3 }, servingSize: 100, servingName: '1份' },
  { name: 'Wood Ear', nameZh: '木耳', category: 'vegetable', nutrition: { calories: 38, protein: 0.5, carbs: 6.5, fat: 0.2, fiber: 5.5, sugar: 0, sodium: 9 }, servingSize: 100, servingName: '1份' },
  { name: 'Lotus Root', nameZh: '莲藕', category: 'vegetable', nutrition: { calories: 74, protein: 2.6, carbs: 16.4, fat: 0.1, fiber: 4.9, sugar: 0, sodium: 24 }, servingSize: 100, servingName: '1节' },
  { name: 'Bitter Melon', nameZh: '苦瓜', category: 'vegetable', nutrition: { calories: 17, protein: 1, carbs: 3.7, fat: 0.2, fiber: 2.8, sugar: 1, sodium: 5 }, servingSize: 100, servingName: '1根' },
  { name: 'Celery', nameZh: '芹菜', category: 'vegetable', nutrition: { calories: 14, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6, sugar: 1.3, sodium: 80 }, servingSize: 100, servingName: '1份' },
  { name: 'Corn', nameZh: '玉米粒', category: 'vegetable', nutrition: { calories: 86, protein: 3.2, carbs: 18.7, fat: 1.2, fiber: 2.7, sugar: 3.2, sodium: 15 }, servingSize: 100, servingName: '1份' },
  { name: 'Peas', nameZh: '豌豆', category: 'vegetable', nutrition: { calories: 81, protein: 5.4, carbs: 14.5, fat: 0.4, fiber: 5.7, sugar: 5.7, sodium: 5 }, servingSize: 100, servingName: '1份' },
  { name: 'Lettuce', nameZh: '生菜', category: 'vegetable', nutrition: { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, sugar: 0.8, sodium: 28 }, servingSize: 100, servingName: '1份' },
  { name: 'Choy Sum', nameZh: '菜心', category: 'vegetable', nutrition: { calories: 20, protein: 2.8, carbs: 2.6, fat: 0.4, fiber: 2.1, sugar: 0.6, sodium: 55 }, servingSize: 100, servingName: '1份' },
  { name: 'Water Spinach', nameZh: '空心菜', category: 'vegetable', nutrition: { calories: 19, protein: 2.6, carbs: 3.1, fat: 0.3, fiber: 1.8, sugar: 0.5, sodium: 45 }, servingSize: 100, servingName: '1份' },
  { name: 'Pumpkin', nameZh: '南瓜', category: 'vegetable', nutrition: { calories: 26, protein: 1, carbs: 6.5, fat: 0.1, fiber: 0.5, sugar: 2.8, sodium: 1 }, servingSize: 100, servingName: '1份' },

  // ========== 豆制品 ==========
  { name: 'Tofu', nameZh: '豆腐', category: 'tofu', nutrition: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, sugar: 0.6, sodium: 7 }, servingSize: 100, servingName: '1块' },
  { name: 'Fried Tofu', nameZh: '油豆腐', category: 'tofu', nutrition: { calories: 271, protein: 17.1, carbs: 4.9, fat: 20.2, fiber: 0.5, sugar: 0, sodium: 15 }, servingSize: 100, servingName: '1份' },
  { name: 'Dried Tofu', nameZh: '豆腐干', category: 'tofu', nutrition: { calories: 140, protein: 16.2, carbs: 4.9, fat: 5.6, fiber: 0.6, sugar: 0, sodium: 20 }, servingSize: 100, servingName: '1份' },
  { name: 'Tofu Skin', nameZh: '腐竹', category: 'tofu', nutrition: { calories: 459, protein: 44.6, carbs: 22.3, fat: 21.7, fiber: 1, sugar: 0, sodium: 26 }, servingSize: 100, servingName: '1份' },
  { name: 'Soy Milk', nameZh: '豆浆', category: 'tofu', nutrition: { calories: 31, protein: 2.9, carbs: 1.8, fat: 1.6, fiber: 0.6, sugar: 0, sodium: 5 }, servingSize: 100, servingName: '1杯' },
  { name: 'Doufu Nao', nameZh: '豆腐脑', category: 'tofu', nutrition: { calories: 15, protein: 1.6, carbs: 0.6, fat: 0.7, fiber: 0.1, sugar: 0, sodium: 3 }, servingSize: 100, servingName: '1碗' },
  { name: 'Fermented Tofu', nameZh: '腐乳', category: 'tofu', nutrition: { calories: 133, protein: 12, carbs: 5, fat: 8, fiber: 0.5, sugar: 0, sodium: 3000 }, servingSize: 100, servingName: '1块' },

  // ========== 水果类 ==========
  { name: 'Apple', nameZh: '苹果', category: 'fruit', nutrition: { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 }, servingSize: 100, servingName: '1个' },
  { name: 'Banana', nameZh: '香蕉', category: 'fruit', nutrition: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 }, servingSize: 100, servingName: '1根' },
  { name: 'Orange', nameZh: '橙子', category: 'fruit', nutrition: { calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0 }, servingSize: 100, servingName: '1个' },
  { name: 'Grape', nameZh: '葡萄', category: 'fruit', nutrition: { calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, sugar: 15.5, sodium: 2 }, servingSize: 100, servingName: '1串' },
  { name: 'Watermelon', nameZh: '西瓜', category: 'fruit', nutrition: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1 }, servingSize: 100, servingName: '1块' },
  { name: 'Strawberry', nameZh: '草莓', category: 'fruit', nutrition: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1 }, servingSize: 100, servingName: '1盒' },
  { name: 'Peach', nameZh: '桃子', category: 'fruit', nutrition: { calories: 39, protein: 0.9, carbs: 9.5, fat: 0.3, fiber: 1.5, sugar: 8.4, sodium: 0 }, servingSize: 100, servingName: '1个' },
  { name: 'Pear', nameZh: '梨', category: 'fruit', nutrition: { calories: 57, protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1, sugar: 9.8, sodium: 1 }, servingSize: 100, servingName: '1个' },
  { name: 'Mango', nameZh: '芒果', category: 'fruit', nutrition: { calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6, sugar: 13.7, sodium: 1 }, servingSize: 100, servingName: '1个' },
  { name: 'Pineapple', nameZh: '菠萝', category: 'fruit', nutrition: { calories: 50, protein: 0.5, carbs: 13.1, fat: 0.1, fiber: 1.4, sugar: 9.9, sodium: 1 }, servingSize: 100, servingName: '1块' },
  { name: 'Kiwi', nameZh: '猕猴桃', category: 'fruit', nutrition: { calories: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, sugar: 9, sodium: 3 }, servingSize: 100, servingName: '1个' },
  { name: 'Lychee', nameZh: '荔枝', category: 'fruit', nutrition: { calories: 66, protein: 0.8, carbs: 16.5, fat: 0.4, fiber: 1.3, sugar: 15.2, sodium: 1 }, servingSize: 100, servingName: '5颗' },
  { name: 'Longan', nameZh: '龙眼', category: 'fruit', nutrition: { calories: 60, protein: 1, carbs: 15, fat: 0.1, fiber: 1.1, sugar: 15, sodium: 0 }, servingSize: 100, servingName: '10颗' },
  { name: 'Durian', nameZh: '榴莲', category: 'fruit', nutrition: { calories: 147, protein: 1.5, carbs: 27.1, fat: 5.3, fiber: 3.8, sugar: 0, sodium: 2 }, servingSize: 100, servingName: '1瓣' },
  { name: 'Cherry', nameZh: '樱桃', category: 'fruit', nutrition: { calories: 50, protein: 1, carbs: 12.2, fat: 0.3, fiber: 2.1, sugar: 8.5, sodium: 0 }, servingSize: 100, servingName: '1盒' },
  { name: 'Pomegranate', nameZh: '石榴', category: 'fruit', nutrition: { calories: 83, protein: 1.7, carbs: 18.7, fat: 1.2, fiber: 4, sugar: 13.7, sodium: 2 }, servingSize: 100, servingName: '1个' },
  { name: 'Fig', nameZh: '无花果', category: 'fruit', nutrition: { calories: 74, protein: 0.8, carbs: 19.2, fat: 0.3, fiber: 2.9, sugar: 16.3, sodium: 1 }, servingSize: 100, servingName: '2个' },
  { name: 'Dragon Fruit', nameZh: '火龙果', category: 'fruit', nutrition: { calories: 50, protein: 1.1, carbs: 11, fat: 0.4, fiber: 1.9, sugar: 0, sodium: 0 }, servingSize: 100, servingName: '半个' },
  { name: 'Blueberry', nameZh: '蓝莓', category: 'fruit', nutrition: { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, sugar: 10, sodium: 1 }, servingSize: 100, servingName: '1盒' },
  { name: 'Papaya', nameZh: '木瓜', category: 'fruit', nutrition: { calories: 43, protein: 0.5, carbs: 10.8, fat: 0.3, fiber: 1.7, sugar: 7.8, sodium: 4 }, servingSize: 100, servingName: '1块' },

  // ========== 奶制品 ==========
  { name: 'Milk', nameZh: '牛奶', category: 'dairy', nutrition: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5, sodium: 43 }, servingSize: 100, servingName: '1杯' },
  { name: 'Yogurt', nameZh: '酸奶', category: 'dairy', nutrition: { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7, sodium: 46 }, servingSize: 100, servingName: '1杯' },
  { name: 'Cheese', nameZh: '奶酪', category: 'dairy', nutrition: { calories: 350, protein: 25, carbs: 1.3, fat: 27, fiber: 0, sugar: 0.5, sodium: 621 }, servingSize: 100, servingName: '2片' },
  { name: 'Evaporated Milk', nameZh: '淡奶', category: 'dairy', nutrition: { calories: 134, protein: 6.8, carbs: 10, fat: 7.5, fiber: 0, sugar: 10, sodium: 100 }, servingSize: 100, servingName: '1杯' },
  { name: 'Condensed Milk', nameZh: '炼乳', category: 'dairy', nutrition: { calories: 321, protein: 7.9, carbs: 54.4, fat: 8.7, fiber: 0, sugar: 54.4, sodium: 120 }, servingSize: 100, servingName: '1勺' },
  { name: 'Milkshake', nameZh: '奶昔', category: 'dairy', nutrition: { calories: 120, protein: 3.2, carbs: 18, fat: 4, fiber: 0, sugar: 15, sodium: 60 }, servingSize: 100, servingName: '1杯' },

  // ========== 零食类 ==========
  { name: 'Potato Chips', nameZh: '薯片', category: 'snack', nutrition: { calories: 536, protein: 7, carbs: 53, fat: 33, fiber: 4.4, sugar: 0.3, sodium: 525 }, servingSize: 100, servingName: '1袋' },
  { name: 'Chocolate', nameZh: '巧克力', category: 'snack', nutrition: { calories: 546, protein: 4.9, carbs: 59.4, fat: 31.3, fiber: 7, sugar: 51.5, sodium: 24 }, servingSize: 100, servingName: '2块' },
  { name: 'Biscuit', nameZh: '饼干', category: 'snack', nutrition: { calories: 466, protein: 7, carbs: 65, fat: 20, fiber: 2, sugar: 25, sodium: 380 }, servingSize: 100, servingName: '1包' },
  { name: 'Nuts', nameZh: '坚果', category: 'snack', nutrition: { calories: 607, protein: 20, carbs: 21, fat: 54, fiber: 7, sugar: 4, sodium: 5 }, servingSize: 100, servingName: '1把' },
  { name: 'Peanuts', nameZh: '花生', category: 'snack', nutrition: { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2, fiber: 8.5, sugar: 4, sodium: 18 }, servingSize: 100, servingName: '1把' },
  { name: 'Walnut', nameZh: '核桃', category: 'snack', nutrition: { calories: 654, protein: 15.2, carbs: 13.7, fat: 65.2, fiber: 6.7, sugar: 2.6, sodium: 2 }, servingSize: 100, servingName: '3个' },
  { name: 'Almond', nameZh: '杏仁', category: 'snack', nutrition: { calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, fiber: 12.5, sugar: 4.4, sodium: 1 }, servingSize: 100, servingName: '1把' },
  { name: 'Sunflower Seeds', nameZh: '瓜子', category: 'snack', nutrition: { calories: 584, protein: 20.8, carbs: 20, fat: 51.5, fiber: 8.6, sugar: 2.6, sodium: 18 }, servingSize: 100, servingName: '1把' },
  { name: 'Dried Fruit', nameZh: '果脯', category: 'snack', nutrition: { calories: 350, protein: 1, carbs: 85, fat: 0.5, fiber: 2, sugar: 70, sodium: 50 }, servingSize: 100, servingName: '1包' },
  { name: 'Ice Cream', nameZh: '冰淇淋', category: 'snack', nutrition: { calories: 207, protein: 3.5, carbs: 24, fat: 11, fiber: 0.7, sugar: 21, sodium: 80 }, servingSize: 100, servingName: '1球' },
  { name: 'Pocky', nameZh: '百奇', category: 'snack', nutrition: { calories: 450, protein: 8, carbs: 65, fat: 18, fiber: 2, sugar: 30, sodium: 200 }, servingSize: 100, servingName: '1盒' },
  { name: 'Seaweed Snack', nameZh: '海苔', category: 'snack', nutrition: { calories: 350, protein: 25, carbs: 30, fat: 20, fiber: 5, sugar: 5, sodium: 2000 }, servingSize: 100, servingName: '1包' },
  { name: 'Rice Crackers', nameZh: '米饼', category: 'snack', nutrition: { calories: 390, protein: 6, carbs: 80, fat: 5, fiber: 1, sugar: 5, sodium: 500 }, servingSize: 100, servingName: '1包' },
  { name: 'Candy', nameZh: '糖果', category: 'snack', nutrition: { calories: 394, protein: 0, carbs: 98, fat: 0.2, fiber: 0, sugar: 95, sodium: 20 }, servingSize: 100, servingName: '5颗' },
  { name: 'Gum', nameZh: '口香糖', category: 'snack', nutrition: { calories: 360, protein: 0, carbs: 96, fat: 0, fiber: 0, sugar: 0, sodium: 5 }, servingSize: 100, servingName: '1片' },

  // ========== 饮料类 ==========
  { name: 'Cola', nameZh: '可乐', category: 'drink', nutrition: { calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, sugar: 10.6, sodium: 4 }, servingSize: 100, servingName: '1罐' },
  { name: 'Orange Juice', nameZh: '橙汁', category: 'drink', nutrition: { calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, sugar: 8.4, sodium: 1 }, servingSize: 100, servingName: '1杯' },
  { name: 'Coffee', nameZh: '咖啡', category: 'drink', nutrition: { calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5 }, servingSize: 100, servingName: '1杯' },
  { name: 'Latte', nameZh: '拿铁', category: 'drink', nutrition: { calories: 58, protein: 2.8, carbs: 5.5, fat: 2.8, fiber: 0, sugar: 5, sodium: 35 }, servingSize: 100, servingName: '1杯' },
  { name: 'Cappuccino', nameZh: '卡布奇诺', category: 'drink', nutrition: { calories: 45, protein: 2.5, carbs: 4.2, fat: 2.2, fiber: 0, sugar: 4, sodium: 30 }, servingSize: 100, servingName: '1杯' },
  { name: 'Green Tea', nameZh: '绿茶', category: 'drink', nutrition: { calories: 1, protein: 0, carbs: 0.3, fat: 0, fiber: 0, sugar: 0, sodium: 1 }, servingSize: 100, servingName: '1杯' },
  { name: 'Milk Tea', nameZh: '奶茶', category: 'drink', nutrition: { calories: 80, protein: 1.5, carbs: 14, fat: 2.5, fiber: 0, sugar: 12, sodium: 30 }, servingSize: 100, servingName: '1杯' },
  { name: 'Bubble Tea', nameZh: '珍珠奶茶', category: 'drink', nutrition: { calories: 95, protein: 1.2, carbs: 18, fat: 2, fiber: 0, sugar: 15, sodium: 25 }, servingSize: 100, servingName: '1杯' },
  { name: 'Beer', nameZh: '啤酒', category: 'drink', nutrition: { calories: 43, protein: 0.5, carbs: 3.6, fat: 0, fiber: 0, sugar: 0, sodium: 4 }, servingSize: 100, servingName: '1瓶' },
  { name: 'Red Wine', nameZh: '红酒', category: 'drink', nutrition: { calories: 85, protein: 0.1, carbs: 2.6, fat: 0, fiber: 0, sugar: 0.6, sodium: 4 }, servingSize: 100, servingName: '1杯' },
  { name: 'White Wine', nameZh: '白酒', category: 'drink', nutrition: { calories: 231, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }, servingSize: 100, servingName: '1两' },
  { name: 'Soda', nameZh: '雪碧', category: 'drink', nutrition: { calories: 40, protein: 0, carbs: 10.2, fat: 0, fiber: 0, sugar: 10.2, sodium: 5 }, servingSize: 100, servingName: '1罐' },
  { name: 'Coconut Water', nameZh: '椰子水', category: 'drink', nutrition: { calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, fiber: 1.1, sugar: 2.6, sodium: 105 }, servingSize: 100, servingName: '1瓶' },
  { name: 'Lemonade', nameZh: '柠檬水', category: 'drink', nutrition: { calories: 40, protein: 0.1, carbs: 10, fat: 0, fiber: 0, sugar: 9.5, sodium: 3 }, servingSize: 100, servingName: '1杯' },
  { name: 'Energy Drink', nameZh: '功能饮料', category: 'drink', nutrition: { calories: 45, protein: 0.4, carbs: 11, fat: 0, fiber: 0, sugar: 11, sodium: 200 }, servingSize: 100, servingName: '1罐' },

  // ========== 中式菜肴 ==========
  { name: 'Mapo Tofu', nameZh: '麻婆豆腐', category: 'dish', nutrition: { calories: 130, protein: 8.5, carbs: 4.2, fat: 9.1, fiber: 0.8, sugar: 1.2, sodium: 580 }, servingSize: 100, servingName: '1份' },
  { name: 'Kung Pao Chicken', nameZh: '宫保鸡丁', category: 'dish', nutrition: { calories: 180, protein: 15.2, carbs: 8.5, fat: 10.3, fiber: 1.5, sugar: 3.2, sodium: 620 }, servingSize: 100, servingName: '1份' },
  { name: 'Sweet and Sour Pork', nameZh: '糖醋排骨', category: 'dish', nutrition: { calories: 215, protein: 12.8, carbs: 15.3, fat: 12.1, fiber: 0.3, sugar: 12.5, sodium: 450 }, servingSize: 100, servingName: '1份' },
  { name: 'Stir-fried Vegetables', nameZh: '炒青菜', category: 'dish', nutrition: { calories: 45, protein: 2.1, carbs: 3.8, fat: 2.8, fiber: 1.8, sugar: 1.5, sodium: 320 }, servingSize: 100, servingName: '1份' },
  { name: 'Tomato Egg', nameZh: '番茄炒蛋', category: 'dish', nutrition: { calories: 98, protein: 6.5, carbs: 5.2, fat: 6.1, fiber: 0.8, sugar: 3.5, sodium: 380 }, servingSize: 100, servingName: '1份' },
  { name: 'Scrambled Eggs', nameZh: '炒鸡蛋', category: 'dish', nutrition: { calories: 148, protein: 10.2, carbs: 1.5, fat: 11.2, fiber: 0, sugar: 1, sodium: 350 }, servingSize: 100, servingName: '1份' },
  { name: 'Steamed Fish', nameZh: '清蒸鱼', category: 'dish', nutrition: { calories: 105, protein: 18.5, carbs: 0.5, fat: 3.2, fiber: 0, sugar: 0, sodium: 420 }, servingSize: 100, servingName: '1份' },
  { name: 'Braised Pork', nameZh: '红烧肉', category: 'dish', nutrition: { calories: 280, protein: 12, carbs: 5, fat: 24, fiber: 0.2, sugar: 3, sodium: 520 }, servingSize: 100, servingName: '1份' },
  { name: 'Dongpo Pork', nameZh: '东坡肉', category: 'dish', nutrition: { calories: 320, protein: 14, carbs: 3, fat: 28, fiber: 0, sugar: 2, sodium: 480 }, servingSize: 100, servingName: '1份' },
  { name: 'Twice Cooked Pork', nameZh: '回锅肉', category: 'dish', nutrition: { calories: 220, protein: 11, carbs: 6, fat: 18, fiber: 1.2, sugar: 2, sodium: 580 }, servingSize: 100, servingName: '1份' },
  { name: 'Shredded Pork with Garlic', nameZh: '鱼香肉丝', category: 'dish', nutrition: { calories: 185, protein: 12, carbs: 8, fat: 12, fiber: 1.5, sugar: 4, sodium: 620 }, servingSize: 100, servingName: '1份' },
  { name: 'Spicy Chicken', nameZh: '辣子鸡', category: 'dish', nutrition: { calories: 210, protein: 16, carbs: 5, fat: 15, fiber: 1, sugar: 1, sodium: 680 }, servingSize: 100, servingName: '1份' },
  { name: 'Fish with Tofu', nameZh: '鱼头豆腐汤', category: 'dish', nutrition: { calories: 65, protein: 8.5, carbs: 1.2, fat: 3, fiber: 0.3, sugar: 0.5, sodium: 380 }, servingSize: 100, servingName: '1碗' },
  { name: 'Hot and Sour Soup', nameZh: '酸辣汤', category: 'dish', nutrition: { calories: 35, protein: 2.8, carbs: 4.5, fat: 0.8, fiber: 0.5, sugar: 1, sodium: 520 }, servingSize: 100, servingName: '1碗' },
  { name: 'Egg Drop Soup', nameZh: '蛋花汤', category: 'dish', nutrition: { calories: 28, protein: 2.5, carbs: 2.8, fat: 0.8, fiber: 0.2, sugar: 0.8, sodium: 380 }, servingSize: 100, servingName: '1碗' },
  { name: 'Wonton Soup', nameZh: '馄饨汤', category: 'dish', nutrition: { calories: 65, protein: 4.2, carbs: 8.5, fat: 1.5, fiber: 0.3, sugar: 0.5, sodium: 420 }, servingSize: 100, servingName: '1碗' },
  { name: 'Sichuan Hot Pot', nameZh: '四川火锅', category: 'dish', nutrition: { calories: 120, protein: 8, carbs: 3, fat: 8, fiber: 0.5, sugar: 0.5, sodium: 800 }, servingSize: 100, servingName: '1份' },
  { name: 'Fried Chicken', nameZh: '炸鸡', category: 'dish', nutrition: { calories: 280, protein: 18, carbs: 12, fat: 18, fiber: 0.5, sugar: 0.5, sodium: 520 }, servingSize: 100, servingName: '1块' },
  { name: 'French Fries', nameZh: '薯条', category: 'dish', nutrition: { calories: 312, protein: 3.4, carbs: 41.4, fat: 15.1, fiber: 3.8, sugar: 0.3, sodium: 210 }, servingSize: 100, servingName: '1份' },
  { name: 'Hamburger', nameZh: '汉堡', category: 'dish', nutrition: { calories: 254, protein: 13, carbs: 31, fat: 9.5, fiber: 1.5, sugar: 5, sodium: 480 }, servingSize: 100, servingName: '1个' },
  { name: 'Pizza', nameZh: '披萨', category: 'dish', nutrition: { calories: 266, protein: 11, carbs: 33, fat: 10, fiber: 2.3, sugar: 3.6, sodium: 598 }, servingSize: 100, servingName: '1片' },
  { name: 'Sushi', nameZh: '寿司', category: 'dish', nutrition: { calories: 143, protein: 5.9, carbs: 26.4, fat: 1.4, fiber: 0.8, sugar: 4.5, sodium: 360 }, servingSize: 100, servingName: '4个' },
  { name: 'Ramen', nameZh: '日式拉面', category: 'dish', nutrition: { calories: 138, protein: 4.5, carbs: 25.2, fat: 1.8, fiber: 1.5, sugar: 0.8, sodium: 350 }, servingSize: 100, servingName: '1碗' },
  { name: 'Fried Noodles', nameZh: '炒面', category: 'dish', nutrition: { calories: 175, protein: 6.8, carbs: 24.5, fat: 5.8, fiber: 1.2, sugar: 1.5, sodium: 480 }, servingSize: 100, servingName: '1份' },
  { name: 'Dan Dan Noodles', nameZh: '担担面', category: 'dish', nutrition: { calories: 155, protein: 6.5, carbs: 20.5, fat: 5.5, fiber: 1.2, sugar: 1, sodium: 520 }, servingSize: 100, servingName: '1碗' },
  { name: 'Beef Noodle Soup', nameZh: '牛肉面', category: 'dish', nutrition: { calories: 115, protein: 7.5, carbs: 16, fat: 2.8, fiber: 0.8, sugar: 0.8, sodium: 580 }, servingSize: 100, servingName: '1碗' },
  { name: 'Wonton Noodles', nameZh: '云吞面', category: 'dish', nutrition: { calories: 105, protein: 5.8, carbs: 16.5, fat: 2, fiber: 0.8, sugar: 0.5, sodium: 450 }, servingSize: 100, servingName: '1碗' },
  { name: 'Congee', nameZh: '皮蛋瘦肉粥', category: 'dish', nutrition: { calories: 58, protein: 3.5, carbs: 8.5, fat: 1.2, fiber: 0.2, sugar: 0, sodium: 380 }, servingSize: 100, servingName: '1碗' },
  { name: 'Clay Pot Rice', nameZh: '煲仔饭', category: 'dish', nutrition: { calories: 155, protein: 7.5, carbs: 22, fat: 4.5, fiber: 0.8, sugar: 0.5, sodium: 520 }, servingSize: 100, servingName: '1份' },
  { name: 'Dim Sum', nameZh: '点心', category: 'dish', nutrition: { calories: 180, protein: 6, carbs: 25, fat: 6, fiber: 1, sugar: 3, sodium: 420 }, servingSize: 100, servingName: '1笼' },
  { name: 'Xiao Long Bao', nameZh: '小笼包', category: 'dish', nutrition: { calories: 210, protein: 9.5, carbs: 25.2, fat: 8.1, fiber: 0.8, sugar: 1.2, sodium: 450 }, servingSize: 100, servingName: '1笼' },
  { name: 'Steamed Shrimp Dumpling', nameZh: '虾饺', category: 'dish', nutrition: { calories: 120, protein: 8.5, carbs: 15.2, fat: 2.8, fiber: 0.5, sugar: 0.5, sodium: 380 }, servingSize: 100, servingName: '1笼' },
  { name: 'Egg Tart', nameZh: '蛋挞', category: 'dish', nutrition: { calories: 280, protein: 6.5, carbs: 32, fat: 14, fiber: 0.8, sugar: 15, sodium: 280 }, servingSize: 100, servingName: '1个' },
  { name: 'Char Siu Bao', nameZh: '叉烧包', category: 'dish', nutrition: { calories: 245, protein: 9.8, carbs: 32.5, fat: 8.5, fiber: 1, sugar: 5, sodium: 380 }, servingSize: 100, servingName: '1个' },
  { name: 'Cheung Fun', nameZh: '肠粉', category: 'dish', nutrition: { calories: 120, protein: 4.5, carbs: 18.5, fat: 3, fiber: 0.5, sugar: 1, sodium: 320 }, servingSize: 100, servingName: '1份' },

  // ========== 调味品 ==========
  { name: 'Soy Sauce', nameZh: '酱油', category: 'condiment', nutrition: { calories: 53, protein: 5.6, carbs: 5.4, fat: 0.1, fiber: 0.8, sugar: 0.4, sodium: 5637 }, servingSize: 100, servingName: '1勺' },
  { name: 'Vinegar', nameZh: '醋', category: 'condiment', nutrition: { calories: 18, protein: 0.1, carbs: 0.6, fat: 0, fiber: 0, sugar: 0.4, sodium: 2 }, servingSize: 100, servingName: '1勺' },
  { name: 'Oyster Sauce', nameZh: '蚝油', category: 'condiment', nutrition: { calories: 51, protein: 1.4, carbs: 11, fat: 0.3, fiber: 0, sugar: 8, sodium: 4350 }, servingSize: 100, servingName: '1勺' },
  { name: 'Chili Sauce', nameZh: '辣椒酱', category: 'condiment', nutrition: { calories: 60, protein: 2, carbs: 10, fat: 1.5, fiber: 2, sugar: 5, sodium: 1800 }, servingSize: 100, servingName: '1勺' },
  { name: 'Sesame Oil', nameZh: '香油', category: 'condiment', nutrition: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0 }, servingSize: 100, servingName: '1勺' },
  { name: 'Cooking Oil', nameZh: '食用油', category: 'condiment', nutrition: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 0 }, servingSize: 100, servingName: '1勺' },
  { name: 'Sugar', nameZh: '白糖', category: 'condiment', nutrition: { calories: 387, protein: 0, carbs: 100, fat: 0, fiber: 0, sugar: 100, sodium: 1 }, servingSize: 100, servingName: '1勺' },
  { name: 'Honey', nameZh: '蜂蜜', category: 'condiment', nutrition: { calories: 304, protein: 0.3, carbs: 82.4, fat: 0, fiber: 0.2, sugar: 82.1, sodium: 4 }, servingSize: 100, servingName: '1勺' },
  { name: 'Ketchup', nameZh: '番茄酱', category: 'condiment', nutrition: { calories: 101, protein: 1.2, carbs: 25.8, fat: 0.2, fiber: 0.3, sugar: 21.3, sodium: 907 }, servingSize: 100, servingName: '1勺' },
  { name: 'Mayonnaise', nameZh: '蛋黄酱', category: 'condiment', nutrition: { calories: 680, protein: 1, carbs: 1.6, fat: 75, fiber: 0, sugar: 1.4, sodium: 635 }, servingSize: 100, servingName: '1勺' },
  { name: 'Bean Paste', nameZh: '豆瓣酱', category: 'condiment', nutrition: { calories: 130, protein: 8, carbs: 12, fat: 6, fiber: 3, sugar: 5, sodium: 3500 }, servingSize: 100, servingName: '1勺' },
  { name: 'Doubanjiang', nameZh: '黄豆酱', category: 'condiment', nutrition: { calories: 120, protein: 10, carbs: 10, fat: 5, fiber: 2, sugar: 3, sodium: 3200 }, servingSize: 100, servingName: '1勺' },
  { name: 'Ginger', nameZh: '生姜', category: 'condiment', nutrition: { calories: 80, protein: 1.8, carbs: 17.8, fat: 0.8, fiber: 2, sugar: 1.7, sodium: 13 }, servingSize: 100, servingName: '1片' },
  { name: 'Garlic', nameZh: '大蒜', category: 'condiment', nutrition: { calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5, fiber: 2.1, sugar: 1, sodium: 17 }, servingSize: 100, servingName: '3瓣' },
  { name: 'Green Onion', nameZh: '葱', category: 'condiment', nutrition: { calories: 32, protein: 1.8, carbs: 7.3, fat: 0.2, fiber: 2.6, sugar: 2.6, sodium: 72 }, servingSize: 100, servingName: '1根' },
  { name: 'Coriander', nameZh: '香菜', category: 'condiment', nutrition: { calories: 23, protein: 2.1, carbs: 3.7, fat: 0.5, fiber: 2.8, sugar: 0.9, sodium: 46 }, servingSize: 100, servingName: '1把' },
  { name: 'Chili', nameZh: '辣椒', category: 'condiment', nutrition: { calories: 40, protein: 1.9, carbs: 8.8, fat: 0.4, fiber: 1.5, sugar: 5.3, sodium: 9 }, servingSize: 100, servingName: '2个' },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // 清空现有数据
    await Food.deleteMany({});
    console.log('Cleared existing foods');

    // 插入新数据
    const result = await Food.insertMany(foods);
    console.log(`Inserted ${result.length} foods`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error seeding foods:', error);
    process.exit(1);
  }
}

seed();
