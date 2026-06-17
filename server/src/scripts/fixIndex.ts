import mongoose from 'mongoose';

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/xia-laoji');
  const db = mongoose.connection.db!;

  // 删除旧索引
  try {
    await db.collection('foods').dropIndex('name_text_nameZh_text');
    console.log('旧索引已删除');
  } catch (e) {
    console.log('旧索引不存在，跳过');
  }

  // 创建新索引
  await db.collection('foods').createIndex({ nameZh: 'text', name: 'text' });
  console.log('新索引已创建');

  // 测试搜索
  const results = await db.collection('foods').find({ $text: { $search: '米饭' } }).toArray();
  console.log(`搜索"米饭"找到 ${results.length} 个结果`);

  // 测试英文搜索
  const results2 = await db.collection('foods').find({ $text: { $search: 'rice' } }).toArray();
  console.log(`搜索"rice"找到 ${results2.length} 个结果`);

  await mongoose.disconnect();
  console.log('完成！');
}

fix();
