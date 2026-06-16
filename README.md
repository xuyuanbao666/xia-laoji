# 虾牢记 - 营养追踪器

一款帮助用户记录饮食、追踪营养摄入、管理健康目标的移动应用。

## 功能特性

### MVP 功能
- ✅ 用户注册/登录（JWT 认证）
- ✅ 食物搜索（支持中英文）
- ✅ 饮食记录（早餐、午餐、晚餐、加餐）
- ✅ 营养分析（热量、蛋白质、碳水、脂肪）
- ✅ 目标设定（体重目标、热量预算）
- ✅ 数据可视化（趋势图表）
- ✅ 食物收藏功能
- ✅ 条形码扫描识别食物

## 技术栈

### 移动端
- React Native 0.73.4 + TypeScript
- Zustand 状态管理
- React Navigation 导航
- Axios 网络请求
- React Native Chart Kit 图表

### 后端
- Node.js + Express 5.2 + TypeScript
- MongoDB 9.7 + Mongoose
- JWT 认证
- bcrypt 密码加密
- Redis 缓存（可选）

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0
- React Native 开发环境（iOS/Android）

### 后端

1. 安装依赖
```bash
cd server
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下内容：
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/xia-laoji
JWT_SECRET=your-super-secret-key-change-this
REDIS_URL=redis://localhost:6379
```

3. 启动 MongoDB
```bash
# 如果使用本地 MongoDB
mongod

# 或使用 MongoDB Atlas 云服务
# 在 .env 中配置 MONGODB_URI 为 Atlas 连接字符串
```

4. 启动开发服务器
```bash
npm run dev
```

服务器将运行在 http://localhost:3000

5. 运行测试
```bash
npm test
```

### 移动端

1. 安装依赖
```bash
cd mobile
npm install
```

2. 配置 API 地址

编辑 `mobile/src/config/api.ts`（如不存在则创建），配置后端服务器地址：
```typescript
export const API_BASE_URL = 'http://localhost:3000/api';
```

3. 启动开发服务器

**iOS:**
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

**Android:**
```bash
npx react-native run-android
```

## API 文档

详细的 API 文档请参考 [docs/API.md](./docs/API.md)

### API 概览

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | POST /api/auth/register | 用户注册 |
| 认证 | POST /api/auth/login | 用户登录 |
| 认证 | GET /api/auth/profile | 获取用户信息 |
| 认证 | PUT /api/auth/profile | 更新用户信息 |
| 食物 | GET /api/foods?q=查询 | 搜索食物 |
| 食物 | GET /api/foods/:id | 获取食物详情 |
| 食物 | GET /api/foods/barcode/:code | 条形码查询 |
| 食物 | GET /api/foods/favorites | 获取收藏列表 |
| 食物 | POST /api/foods/favorites/:id | 添加收藏 |
| 食物 | DELETE /api/foods/favorites/:id | 取消收藏 |
| 记录 | POST /api/records | 创建饮食记录 |
| 记录 | GET /api/records | 获取记录列表 |
| 记录 | GET /api/records/daily/:date | 获取每日汇总 |
| 记录 | PUT /api/records/:id | 更新记录 |
| 记录 | DELETE /api/records/:id | 删除记录 |

## 项目结构

```
xia-laoji/
├── mobile/                  # React Native 移动端
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── screens/         # 页面组件
│   │   ├── navigation/      # 导航配置
│   │   ├── store/           # Zustand 状态管理
│   │   ├── services/        # API 服务
│   │   ├── types/           # TypeScript 类型定义
│   │   └── utils/           # 工具函数
│   └── package.json
├── server/                  # Node.js 后端
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── middleware/       # 中间件（认证等）
│   │   ├── models/          # Mongoose 数据模型
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑服务
│   │   └── __tests__/       # 测试文件
│   ├── .env.example         # 环境变量示例
│   └── package.json
└── docs/                    # 项目文档
    └── API.md               # API 详细文档
```

## 数据模型

### User（用户）
- 邮箱、密码（加密存储）
- 个人资料（姓名、性别、生日、身高、体重）
- 健康目标（每日热量、蛋白质、碳水、脂肪目标）
- 收藏食物列表

### Food（食物）
- 中英文名称
- 品牌、分类
- 营养信息（热量、蛋白质、碳水、脂肪、纤维、糖、钠）
- 份量信息
- 条形码（可选）
- 数据来源（内置/API/用户创建）

### DietRecord（饮食记录）
- 用户 ID、日期、餐次类型
- 食物列表（食物、份量、营养信息）
- 总营养汇总
- 备注、图片（可选）

## 开发规范

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### Git 提交规范
使用语义化 commit：
- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

### 测试规范
- 遵循 TDD 开发流程
- 每个功能模块独立测试
- 测试覆盖率目标：> 80%

## 常见问题

### Q: MongoDB 连接失败？
确保 MongoDB 服务已启动，或检查 `.env` 中的 `MONGODB_URI` 配置。

### Q: Android 模拟器无法连接后端？
确保使用 `10.0.2.2` 替代 `localhost`（Android 模拟器特殊配置）。

### Q: iOS 构建失败？
确保已安装 CocoaPods 并执行 `pod install`。

## License

MIT
