import mongoose from 'mongoose';

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/xia-laoji');
  const db = mongoose.connection.db!;

  // 测试中文搜索
  const r1 = await db.collection('foods').find({ nameZh: /米饭/ }).toArray();
  console.log(`"米饭" 找到 ${r1.length} 个`);

  // 测试模糊搜索
  const r2 = await db.collection('foods').find({ nameZh: { $regex: '米', $options: 'i' } }).toArray();
  console.log(`"米" 找到 ${r2.length} 个`);

  // 测试英文搜索
  const r3 = await db.collection('foods').find({ name: { $regex: 'rice', $options: 'i' } }).toArray();
  console.log(`"rice" 找到 ${r3.length} 个`);

  // 列出所有食物
  const all = await db.collection('foods').find({}).toArray();
  console.log(`\n所有食物 (${all.length} 个):`);
  all.forEach((f: any) => console.log(`  - ${f.nameZh} (${f.name})`));

  await mongoose.disconnect();
}

test();
