import mongoose from 'mongoose';
import Food from '../models/Food';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/xia-laoji';

// 常见中国食物数据
const foods = [
  // 主食类
  { name: 'White Rice', nameZh: '白米饭', category: 'staple', nutrition: { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3, fiber: 0.4, sugar: 0, sodium: 2 }, servingSize: 100, servingName: '1碗' },
  { name: 'Steamed Bun', nameZh: '馒头', category: 'staple', nutrition: { calories: 223, protein: 7, carbs: 44.2, fat: 1.1, fiber: 1.3, sugar: 1, sodium: 232 }, servingSize: 100, servingName: '1个' },
  { name: 'Noodles', nameZh: '面条', category: 'staple', nutrition: { calories: 110, protein: 3.4, carbs: 22.3, fat: 0.5, fiber: 1.2, sugar: 0.5, sodium: 3 }, servingSize: 100, servingName: '1碗' },
  { name: 'Porridge', nameZh: '白粥', category: 'staple', nutrition: { calories: 46, protein: 1.1, carbs: 10.2, fat: 0.1, fiber: 0.1, sugar: 0, sodium: 2 }, servingSize: 100, servingName: '1碗' },
  { name: 'Fried Rice', nameZh: '蛋炒饭', category: 'staple', nutrition: { calories: 180, protein: 6.5, carbs: 24.5, fat: 6.2, fiber: 0.8, sugar: 0.5, sodium: 450 }, servingSize: 100, servingName: '1盘' },
  { name: 'Bread', nameZh: '面包', category: 'staple', nutrition: { calories: 265, protein: 8.4, carbs: 49.1, fat: 3.2, fiber: 2.7, sugar: 5, sodium: 463 }, servingSize: 100, servingName: '2片' },
  { name: 'Steamed Bun with Meat', nameZh: '肉包子', category: 'staple', nutrition: { calories: 227, protein: 9.2, carbs: 28.5, fat: 8.3, fiber: 1.1, sugar: 2, sodium: 380 }, servingSize: 100, servingName: '1个' },

  // 肉类
  { name: 'Pork', nameZh: '猪肉', category: 'meat', nutrition: { calories: 242, protein: 13.2, carbs: 0, fat: 20.6, fiber: 0, sugar: 0, sodium: 62 }, servingSize: 100, servingName: '1份' },
  { name: 'Chicken Breast', nameZh: '鸡胸肉', category: 'meat', nutrition: { calories: 133, protein: 25, carbs: 0, fat: 2.8, fiber: 0, sugar: 0, sodium: 47 }, servingSize: 100, servingName: '1份' },
  { name: 'Beef', nameZh: '牛肉', category: 'meat', nutrition: { calories: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, sugar: 0, sodium: 72 }, servingSize: 100, servingName: '1份' },
  { name: 'Fish', nameZh: '鱼肉', category: 'meat', nutrition: { calories: 96, protein: 18.6, carbs: 0, fat: 2.1, fiber: 0, sugar: 0, sodium: 53 }, servingSize: 100, servingName: '1份' },
  { name: 'Shrimp', nameZh: '虾', category: 'meat', nutrition: { calories: 99, protein: 20.4, carbs: 0.2, fat: 1.7, fiber: 0, sugar: 0, sodium: 302 }, servingSize: 100, servingName: '1份' },
  { name: 'Egg', nameZh: '鸡蛋', category: 'meat', nutrition: { calories: 144, protein: 13.3, carbs: 1.5, fat: 9.5, fiber: 0, sugar: 1.1, sodium: 142 }, servingSize: 100, servingName: '2个' },

  // 蔬菜类
  { name: 'Cabbage', nameZh: '白菜', category: 'vegetable', nutrition: { calories: 13, protein: 1.5, carbs: 2.2, fat: 0.2, fiber: 1.2, sugar: 1.2, sodium: 65 }, servingSize: 100, servingName: '1份' },
  { name: 'Spinach', nameZh: '菠菜', category: 'vegetable', nutrition: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 }, servingSize: 100, servingName: '1份' },
  { name: 'Tomato', nameZh: '番茄', category: 'vegetable', nutrition: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 }, servingSize: 100, servingName: '1个' },
  { name: 'Cucumber', nameZh: '黄瓜', category: 'vegetable', nutrition: { calories: 15, protein: 0.7, carbs: 2.6, fat: 0.2, fiber: 0.5, sugar: 1.7, sodium: 2 }, servingSize: 100, servingName: '1根' },
  { name: 'Broccoli', nameZh: '西兰花', category: 'vegetable', nutrition: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 }, servingSize: 100, servingName: '1份' },
  { name: 'Carrot', nameZh: '胡萝卜', category: 'vegetable', nutrition: { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 }, servingSize: 100, servingName: '1根' },

  // 水果类
  { name: 'Apple', nameZh: '苹果', category: 'fruit', nutrition: { calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 }, servingSize: 100, servingName: '1个' },
  { name: 'Banana', nameZh: '香蕉', category: 'fruit', nutrition: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 }, servingSize: 100, servingName: '1根' },
  { name: 'Orange', nameZh: '橙子', category: 'fruit', nutrition: { calories: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0 }, servingSize: 100, servingName: '1个' },
  { name: 'Grape', nameZh: '葡萄', category: 'fruit', nutrition: { calories: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, sugar: 15.5, sodium: 2 }, servingSize: 100, servingName: '1串' },
  { name: 'Watermelon', nameZh: '西瓜', category: 'fruit', nutrition: { calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1 }, servingSize: 100, servingName: '1块' },
  { name: 'Strawberry', nameZh: '草莓', category: 'fruit', nutrition: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, sugar: 4.9, sodium: 1 }, servingSize: 100, servingName: '1盒' },

  // 奶制品
  { name: 'Milk', nameZh: '牛奶', category: 'dairy', nutrition: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0, sugar: 5, sodium: 43 }, servingSize: 100, servingName: '1杯' },
  { name: 'Yogurt', nameZh: '酸奶', category: 'dairy', nutrition: { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, sugar: 4.7, sodium: 46 }, servingSize: 100, servingName: '1杯' },
  { name: 'Cheese', nameZh: '奶酪', category: 'dairy', nutrition: { calories: 350, protein: 25, carbs: 1.3, fat: 27, fiber: 0, sugar: 0.5, sodium: 621 }, servingSize: 100, servingName: '2片' },

  // 零食类
  { name: 'Potato Chips', nameZh: '薯片', category: 'snack', nutrition: { calories: 536, protein: 7, carbs: 53, fat: 33, fiber: 4.4, sugar: 0.3, sodium: 525 }, servingSize: 100, servingName: '1袋' },
  { name: 'Chocolate', nameZh: '巧克力', category: 'snack', nutrition: { calories: 546, protein: 4.9, carbs: 59.4, fat: 31.3, fiber: 7, sugar: 51.5, sodium: 24 }, servingSize: 100, servingName: '2块' },
  { name: 'Biscuit', nameZh: '饼干', category: 'snack', nutrition: { calories: 466, protein: 7, carbs: 65, fat: 20, fiber: 2, sugar: 25, sodium: 380 }, servingSize: 100, servingName: '1包' },

  // 饮料类
  { name: 'Cola', nameZh: '可乐', category: 'drink', nutrition: { calories: 42, protein: 0, carbs: 10.6, fat: 0, fiber: 0, sugar: 10.6, sodium: 4 }, servingSize: 100, servingName: '1罐' },
  { name: 'Orange Juice', nameZh: '橙汁', category: 'drink', nutrition: { calories: 45, protein: 0.7, carbs: 10.4, fat: 0.2, fiber: 0.2, sugar: 8.4, sodium: 1 }, servingSize: 100, servingName: '1杯' },
  { name: 'Coffee', nameZh: '咖啡', category: 'drink', nutrition: { calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 5 }, servingSize: 100, servingName: '1杯' },
  { name: 'Tea', nameZh: '茶', category: 'drink', nutrition: { calories: 1, protein: 0, carbs: 0.3, fat: 0, fiber: 0, sugar: 0, sodium: 1 }, servingSize: 100, servingName: '1杯' },

  // 中式菜肴
  { name: 'Mapo Tofu', nameZh: '麻婆豆腐', category: 'other', nutrition: { calories: 130, protein: 8.5, carbs: 4.2, fat: 9.1, fiber: 0.8, sugar: 1.2, sodium: 580 }, servingSize: 100, servingName: '1份' },
  { name: 'Kung Pao Chicken', nameZh: '宫保鸡丁', category: 'other', nutrition: { calories: 180, protein: 15.2, carbs: 8.5, fat: 10.3, fiber: 1.5, sugar: 3.2, sodium: 620 }, servingSize: 100, servingName: '1份' },
  { name: 'Sweet and Sour Pork', nameZh: '糖醋排骨', category: 'other', nutrition: { calories: 215, protein: 12.8, carbs: 15.3, fat: 12.1, fiber: 0.3, sugar: 12.5, sodium: 450 }, servingSize: 100, servingName: '1份' },
  { name: 'Stir-fried Vegetables', nameZh: '炒青菜', category: 'vegetable', nutrition: { calories: 45, protein: 2.1, carbs: 3.8, fat: 2.8, fiber: 1.8, sugar: 1.5, sodium: 320 }, servingSize: 100, servingName: '1份' },
  { name: 'Egg Fried Rice', nameZh: '蛋炒饭', category: 'staple', nutrition: { calories: 185, protein: 6.8, carbs: 25.2, fat: 6.5, fiber: 0.9, sugar: 0.8, sodium: 480 }, servingSize: 100, servingName: '1盘' },
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
