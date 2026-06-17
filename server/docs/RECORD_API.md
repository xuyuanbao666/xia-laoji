# 饮食记录 API 文档

## 概述

饮食记录 API 用于记录用户的每日饮食，自动计算营养素，并提供每日汇总功能。

## 认证

所有饮食记录 API 需要认证。在请求头中添加：
```
Authorization: Bearer <token>
```

## API 端点

### 1. 创建饮食记录

**POST /api/records**

请求体：
```json
{
  "date": "2026-06-16T12:00:00.000Z",
  "meal": "lunch",
  "foods": [
    {
      "foodId": "60d5ecb54b24a1234c8b4567",
      "amount": 200
    }
  ],
  "note": "午餐吃了一碗米饭",
  "imageUrl": "https://example.com/image.jpg"
}
```

字段说明：
- `date` (必需): 日期时间
- `meal` (必需): 餐次，可选值: `breakfast`, `lunch`, `dinner`, `snack`
- `foods` (必需): 食物数组，每个元素包含:
  - `foodId`: 食物 ID
  - `amount`: 食用量（克）
- `note` (可选): 备注
- `imageUrl` (可选): 图片 URL

响应（201 Created）：
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a1234c8b4568",
    "userId": "60d5ecb54b24a1234c8b4569",
    "date": "2026-06-16T12:00:00.000Z",
    "meal": "lunch",
    "foods": [
      {
        "foodId": "60d5ecb54b24a1234c8b4567",
        "name": "米饭",
        "amount": 200,
        "nutrition": {
          "calories": 232,
          "protein": 4.6,
          "carbs": 51.5,
          "fat": 0.6
        }
      }
    ],
    "totalNutrition": {
      "calories": 232,
      "protein": 4.6,
      "carbs": 51.5,
      "fat": 0.6
    },
    "note": "午餐吃了一碗米饭",
    "imageUrl": "https://example.com/image.jpg",
    "createdAt": "2026-06-16T12:00:00.000Z"
  }
}
```

### 2. 获取记录列表

**GET /api/records**

查询参数：
- `startDate` (可选): 开始日期 (YYYY-MM-DD)
- `endDate` (可选): 结束日期 (YYYY-MM-DD)

示例：
```
GET /api/records?startDate=2026-06-01&endDate=2026-06-16
```

响应（200 OK）：
```json
{
  "success": true,
  "data": [
    {
      "_id": "60d5ecb54b24a1234c8b4568",
      "userId": "60d5ecb54b24a1234c8b4569",
      "date": "2026-06-16T12:00:00.000Z",
      "meal": "lunch",
      "foods": [...],
      "totalNutrition": {...},
      "note": "午餐吃了一碗米饭",
      "createdAt": "2026-06-16T12:00:00.000Z"
    }
  ]
}
```

### 3. 获取每日汇总

**GET /api/records/daily/:date**

路径参数：
- `date`: 日期 (YYYY-MM-DD)

示例：
```
GET /api/records/daily/2026-06-16
```

响应（200 OK）：
```json
{
  "success": true,
  "data": {
    "date": "2026-06-16T00:00:00.000Z",
    "totalNutrition": {
      "calories": 1850,
      "protein": 75,
      "carbs": 250,
      "fat": 55
    },
    "meals": [
      {
        "meal": "breakfast",
        "records": [...],
        "totalNutrition": {
          "calories": 450,
          "protein": 20,
          "carbs": 60,
          "fat": 15
        }
      },
      {
        "meal": "lunch",
        "records": [...],
        "totalNutrition": {
          "calories": 650,
          "protein": 30,
          "carbs": 80,
          "fat": 20
        }
      },
      {
        "meal": "dinner",
        "records": [...],
        "totalNutrition": {
          "calories": 750,
          "protein": 25,
          "carbs": 110,
          "fat": 20
        }
      }
    ]
  }
}
```

### 4. 更新记录

**PUT /api/records/:id**

路径参数：
- `id`: 记录 ID

请求体（所有字段可选）：
```json
{
  "meal": "dinner",
  "foods": [
    {
      "foodId": "60d5ecb54b24a1234c8b4567",
      "amount": 300
    }
  ],
  "note": "更新后的备注",
  "imageUrl": "https://example.com/new-image.jpg"
}
```

响应（200 OK）：
```json
{
  "success": true,
  "data": {
    "_id": "60d5ecb54b24a1234c8b4568",
    ...
  }
}
```

### 5. 删除记录

**DELETE /api/records/:id**

路径参数：
- `id`: 记录 ID

响应（200 OK）：
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

## 错误响应

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: date, meal, foods"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Record not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## 使用示例

### 创建记录
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2026-06-16T12:00:00.000Z",
    "meal": "lunch",
    "foods": [
      {"foodId": "FOOD_ID_1", "amount": 200},
      {"foodId": "FOOD_ID_2", "amount": 150}
    ],
    "note": "午餐"
  }'
```

### 获取每日汇总
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/records/daily/2026-06-16
```
