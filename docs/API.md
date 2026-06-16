# 虾牢记 API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token

## 认证说明

所有需要认证的 API 都需要在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

Token 通过登录或注册接口获取，有效期为 7 天。

---

## 错误码说明

| HTTP 状态码 | 说明 | 常见原因 |
|------------|------|----------|
| 200 | 成功 | 请求成功处理 |
| 201 | 创建成功 | 资源创建成功 |
| 400 | 请求错误 | 参数缺失或格式错误 |
| 401 | 未认证 | Token 无效或过期 |
| 403 | 无权限 | 无权访问该资源 |
| 404 | 未找到 | 资源不存在 |
| 409 | 冲突 | 资源已存在（如重复注册） |
| 500 | 服务器错误 | 服务器内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息"
}
```

或

```json
{
  "error": {
    "message": "错误描述信息"
  }
}
```

---

## 认证 API

### 1. 用户注册

**POST** `/auth/register`

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "profile": {
    "name": "张三",
    "gender": "male",
    "birthday": "1990-01-15",
    "height": 175,
    "currentWeight": 70,
    "targetWeight": 65,
    "activityLevel": "moderate"
  },
  "goals": {
    "dailyCalories": 2000,
    "protein": 60,
    "carbs": 250,
    "fat": 65
  }
}
```

**请求参数说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码（至少6位） |
| profile.name | string | ✅ | 用户姓名（最多50字符） |
| profile.gender | string | ✅ | 性别：male/female/other |
| profile.birthday | string | ✅ | 生日（YYYY-MM-DD） |
| profile.height | number | ✅ | 身高（cm，50-300） |
| profile.currentWeight | number | ✅ | 当前体重（kg，20-500） |
| profile.targetWeight | number | ✅ | 目标体重（kg，20-500） |
| profile.activityLevel | string | ✅ | 活动水平：sedentary/light/moderate/active |
| goals.dailyCalories | number | ❌ | 每日热量目标（默认2000） |
| goals.protein | number | ❌ | 蛋白质目标（默认50g） |
| goals.carbs | number | ❌ | 碳水目标（默认250g） |
| goals.fat | number | ❌ | 脂肪目标（默认65g） |

**成功响应 (201)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": {
        "name": "张三",
        "gender": "male",
        "birthday": "1990-01-15T00:00:00.000Z",
        "height": 175,
        "currentWeight": 70,
        "targetWeight": 65,
        "activityLevel": "moderate"
      },
      "goals": {
        "dailyCalories": 2000,
        "protein": 60,
        "carbs": 250,
        "fat": 65
      },
      "favorites": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应 (409)：**
```json
{
  "error": {
    "message": "该邮箱已被注册"
  }
}
```

---

### 2. 用户登录

**POST** `/auth/login`

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

**请求参数说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✅ | 邮箱地址 |
| password | string | ✅ | 密码 |

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": {
        "name": "张三",
        "gender": "male",
        "birthday": "1990-01-15T00:00:00.000Z",
        "height": 175,
        "currentWeight": 70,
        "targetWeight": 65,
        "activityLevel": "moderate"
      },
      "goals": {
        "dailyCalories": 2000,
        "protein": 60,
        "carbs": 250,
        "fat": 65
      },
      "favorites": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应 (401)：**
```json
{
  "error": {
    "message": "邮箱或密码错误"
  }
}
```

---

### 3. 获取用户信息

**GET** `/auth/profile`

**请求头：**
```
Authorization: Bearer <token>
```

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": {
        "name": "张三",
        "gender": "male",
        "birthday": "1990-01-15T00:00:00.000Z",
        "height": 175,
        "currentWeight": 70,
        "targetWeight": 65,
        "activityLevel": "moderate"
      },
      "goals": {
        "dailyCalories": 2000,
        "protein": 60,
        "carbs": 250,
        "fat": 65
      },
      "favorites": ["507f1f77bcf86cd799439012"],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4. 更新用户信息

**PUT** `/auth/profile`

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "profile": {
    "currentWeight": 68,
    "targetWeight": 63
  },
  "goals": {
    "dailyCalories": 1800,
    "protein": 70
  }
}
```

**请求参数说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| profile | object | ❌ | 要更新的资料字段 |
| goals | object | ❌ | 要更新的目标字段 |

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "profile": {
        "name": "张三",
        "gender": "male",
        "birthday": "1990-01-15T00:00:00.000Z",
        "height": 175,
        "currentWeight": 68,
        "targetWeight": 63,
        "activityLevel": "moderate"
      },
      "goals": {
        "dailyCalories": 1800,
        "protein": 70,
        "carbs": 250,
        "fat": 65
      }
    }
  }
}
```

---

## 食物 API

### 5. 搜索食物

**GET** `/foods`

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | ❌ | 搜索关键词（支持中英文） |
| page | number | ❌ | 页码（默认1） |
| limit | number | ❌ | 每页数量（默认20，最大100） |

**请求示例：**
```
GET /api/foods?q=鸡胸肉&page=1&limit=10
```

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Chicken Breast",
        "nameZh": "鸡胸肉",
        "brand": null,
        "category": "meat",
        "nutrition": {
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fat": 3.6,
          "fiber": 0,
          "sugar": 0,
          "sodium": 74
        },
        "servingSize": 100,
        "servingName": "克",
        "barcode": null,
        "imageUrl": null,
        "source": "builtin"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 6. 获取食物详情

**GET** `/foods/:id`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 食物 ID |

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Chicken Breast",
    "nameZh": "鸡胸肉",
    "brand": null,
    "category": "meat",
    "nutrition": {
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fat": 3.6,
      "fiber": 0,
      "sugar": 0,
      "sodium": 74
    },
    "servingSize": 100,
    "servingName": "克",
    "barcode": null,
    "imageUrl": null,
    "source": "builtin"
  }
}
```

**错误响应 (404)：**
```json
{
  "success": false,
  "message": "Food not found"
}
```

---

### 7. 条形码查询食物

**GET** `/foods/barcode/:code`

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| code | string | 条形码 |

**请求示例：**
```
GET /api/foods/barcode/6920459950183
```

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Instant Noodles",
    "nameZh": "方便面",
    "brand": "康师傅",
    "category": "staple",
    "nutrition": {
      "calories": 450,
      "protein": 9,
      "carbs": 62,
      "fat": 18,
      "fiber": 2,
      "sugar": 3,
      "sodium": 1800
    },
    "servingSize": 100,
    "servingName": "克",
    "barcode": "6920459950183",
    "imageUrl": null,
    "source": "api"
  }
}
```

**错误响应 (404)：**
```json
{
  "success": false,
  "message": "Food not found"
}
```

---

### 8. 获取收藏列表

**GET** `/foods/favorites`

**请求头：**
```
Authorization: Bearer <token>
```

**成功响应 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Chicken Breast",
      "nameZh": "鸡胸肉",
      "category": "meat",
      "nutrition": {
        "calories": 165,
        "protein": 31,
        "carbs": 0,
        "fat": 3.6
      }
    },
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Brown Rice",
      "nameZh": "糙米饭",
      "category": "staple",
      "nutrition": {
        "calories": 123,
        "protein": 2.7,
        "carbs": 25.6,
        "fat": 1.0
      }
    }
  ]
}
```

---

### 9. 添加收藏

**POST** `/foods/favorites/:id`

**请求头：**
```
Authorization: Bearer <token>
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 食物 ID |

**成功响应 (201)：**
```json
{
  "success": true,
  "message": "Food added to favorites"
}
```

**错误响应 (409)：**
```json
{
  "success": false,
  "message": "Food already in favorites"
}
```

---

### 10. 取消收藏

**DELETE** `/foods/favorites/:id`

**请求头：**
```
Authorization: Bearer <token>
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 食物 ID |

**成功响应 (200)：**
```json
{
  "success": true,
  "message": "Food removed from favorites"
}
```

**错误响应 (404)：**
```json
{
  "success": false,
  "message": "Food not in favorites"
}
```

---

## 记录 API

### 11. 创建饮食记录

**POST** `/records`

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "date": "2024-01-15",
  "meal": "lunch",
  "foods": [
    {
      "foodId": "507f1f77bcf86cd799439012",
      "name": "鸡胸肉",
      "amount": 200,
      "nutrition": {
        "calories": 330,
        "protein": 62,
        "carbs": 0,
        "fat": 7.2
      }
    },
    {
      "foodId": "507f1f77bcf86cd799439014",
      "name": "糙米饭",
      "amount": 150,
      "nutrition": {
        "calories": 184.5,
        "protein": 4.05,
        "carbs": 38.4,
        "fat": 1.5
      }
    }
  ],
  "note": "午餐吃饱了",
  "imageUrl": "https://example.com/lunch.jpg"
}
```

**请求参数说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | ✅ | 日期（YYYY-MM-DD） |
| meal | string | ✅ | 餐次：breakfast/lunch/dinner/snack |
| foods | array | ✅ | 食物列表（至少1项） |
| foods[].foodId | string | ✅ | 食物 ID |
| foods[].name | string | ✅ | 食物名称 |
| foods[].amount | number | ✅ | 份量（克，>=0） |
| foods[].nutrition | object | ✅ | 营养信息 |
| foods[].nutrition.calories | number | ✅ | 热量 |
| foods[].nutrition.protein | number | ✅ | 蛋白质 |
| foods[].nutrition.carbs | number | ✅ | 碳水 |
| foods[].nutrition.fat | number | ✅ | 脂肪 |
| note | string | ❌ | 备注（最多500字符） |
| imageUrl | string | ❌ | 图片链接 |

**成功响应 (201)：**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "meal": "lunch",
    "foods": [
      {
        "foodId": "507f1f77bcf86cd799439012",
        "name": "鸡胸肉",
        "amount": 200,
        "nutrition": {
          "calories": 330,
          "protein": 62,
          "carbs": 0,
          "fat": 7.2
        }
      },
      {
        "foodId": "507f1f77bcf86cd799439014",
        "name": "糙米饭",
        "amount": 150,
        "nutrition": {
          "calories": 184.5,
          "protein": 4.05,
          "carbs": 38.4,
          "fat": 1.5
        }
      }
    ],
    "totalNutrition": {
      "calories": 514.5,
      "protein": 66.05,
      "carbs": 38.4,
      "fat": 8.7
    },
    "note": "午餐吃饱了",
    "imageUrl": "https://example.com/lunch.jpg",
    "createdAt": "2024-01-15T12:30:00.000Z"
  }
}
```

**错误响应 (400)：**
```json
{
  "success": false,
  "message": "Invalid meal type. Must be: breakfast, lunch, dinner, or snack"
}
```

---

### 12. 获取记录列表

**GET** `/records`

**请求头：**
```
Authorization: Bearer <token>
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | ❌ | 开始日期（YYYY-MM-DD） |
| endDate | string | ❌ | 结束日期（YYYY-MM-DD） |

**请求示例：**
```
GET /api/records?startDate=2024-01-01&endDate=2024-01-31
```

**成功响应 (200)：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "userId": "507f1f77bcf86cd799439011",
      "date": "2024-01-15T00:00:00.000Z",
      "meal": "lunch",
      "foods": [
        {
          "foodId": "507f1f77bcf86cd799439012",
          "name": "鸡胸肉",
          "amount": 200,
          "nutrition": {
            "calories": 330,
            "protein": 62,
            "carbs": 0,
            "fat": 7.2
          }
        }
      ],
      "totalNutrition": {
        "calories": 330,
        "protein": 62,
        "carbs": 0,
        "fat": 7.2
      },
      "note": "午餐吃饱了",
      "createdAt": "2024-01-15T12:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "userId": "507f1f77bcf86cd799439011",
      "date": "2024-01-15T00:00:00.000Z",
      "meal": "dinner",
      "foods": [
        {
          "foodId": "507f1f77bcf86cd799439015",
          "name": "清蒸鱼",
          "amount": 250,
          "nutrition": {
            "calories": 225,
            "protein": 46,
            "carbs": 0,
            "fat": 4.5
          }
        }
      ],
      "totalNutrition": {
        "calories": 225,
        "protein": 46,
        "carbs": 0,
        "fat": 4.5
      },
      "note": null,
      "createdAt": "2024-01-15T19:00:00.000Z"
    }
  ]
}
```

---

### 13. 获取每日汇总

**GET** `/records/daily/:date`

**请求头：**
```
Authorization: Bearer <token>
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| date | string | 日期（YYYY-MM-DD） |

**请求示例：**
```
GET /api/records/daily/2024-01-15
```

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15T00:00:00.000Z",
    "totalNutrition": {
      "calories": 1850,
      "protein": 120,
      "carbs": 180,
      "fat": 65
    },
    "meals": {
      "breakfast": {
        "count": 1,
        "totalNutrition": {
          "calories": 350,
          "protein": 12,
          "carbs": 55,
          "fat": 8
        }
      },
      "lunch": {
        "count": 1,
        "totalNutrition": {
          "calories": 680,
          "protein": 45,
          "carbs": 75,
          "fat": 22
        }
      },
      "dinner": {
        "count": 1,
        "totalNutrition": {
          "calories": 620,
          "protein": 48,
          "carbs": 40,
          "fat": 28
        }
      },
      "snack": {
        "count": 1,
        "totalNutrition": {
          "calories": 200,
          "protein": 15,
          "carbs": 10,
          "fat": 7
        }
      }
    },
    "records": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "meal": "breakfast",
        "foods": [
          {
            "foodId": "507f1f77bcf86cd799439016",
            "name": "全麦面包",
            "amount": 100,
            "nutrition": {
              "calories": 250,
              "protein": 9,
              "carbs": 41,
              "fat": 4
            }
          }
        ],
        "totalNutrition": {
          "calories": 350,
          "protein": 12,
          "carbs": 55,
          "fat": 8
        },
        "createdAt": "2024-01-15T07:30:00.000Z"
      }
    ]
  }
}
```

---

### 14. 更新记录

**PUT** `/records/:id`

**请求头：**
```
Authorization: Bearer <token>
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 记录 ID |

**请求体：**
```json
{
  "meal": "dinner",
  "foods": [
    {
      "foodId": "507f1f77bcf86cd799439015",
      "name": "清蒸鱼",
      "amount": 300,
      "nutrition": {
        "calories": 270,
        "protein": 55.2,
        "carbs": 0,
        "fat": 5.4
      }
    }
  ],
  "note": "晚餐吃饱了"
}
```

**请求参数说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| meal | string | ❌ | 餐次：breakfast/lunch/dinner/snack |
| foods | array | ❌ | 食物列表 |
| note | string | ❌ | 备注 |
| imageUrl | string | ❌ | 图片链接 |

**成功响应 (200)：**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "userId": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "meal": "dinner",
    "foods": [
      {
        "foodId": "507f1f77bcf86cd799439015",
        "name": "清蒸鱼",
        "amount": 300,
        "nutrition": {
          "calories": 270,
          "protein": 55.2,
          "carbs": 0,
          "fat": 5.4
        }
      }
    ],
    "totalNutrition": {
      "calories": 270,
      "protein": 55.2,
      "carbs": 0,
      "fat": 5.4
    },
    "note": "晚餐吃饱了",
    "createdAt": "2024-01-15T12:30:00.000Z"
  }
}
```

**错误响应 (404)：**
```json
{
  "success": false,
  "message": "Record not found"
}
```

---

### 15. 删除记录

**DELETE** `/records/:id`

**请求头：**
```
Authorization: Bearer <token>
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 记录 ID |

**成功响应 (200)：**
```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

**错误响应 (404)：**
```json
{
  "success": false,
  "message": "Record not found"
}
```

---

## 健康检查

### GET `/health`

用于监控服务器状态，无需认证。

**成功响应 (200)：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## 附录

### 活动水平说明

| 值 | 说明 |
|---|------|
| sedentary | 久坐（办公室工作） |
| light | 轻度活动（每周运动1-3次） |
| moderate | 中度活动（每周运动3-5次） |
| active | 高度活动（每周运动6-7次） |

### 食物分类

| 值 | 说明 |
|---|------|
| staple | 主食 |
| meat | 肉类 |
| vegetable | 蔬菜 |
| fruit | 水果 |
| dairy | 乳制品 |
| snack | 零食 |
| drink | 饮品 |
| other | 其他 |

### 餐次类型

| 值 | 说明 |
|---|------|
| breakfast | 早餐 |
| lunch | 午餐 |
| dinner | 晚餐 |
| snack | 加餐 |

### 数据来源

| 值 | 说明 |
|---|------|
| builtin | 内置数据 |
| api | 外部 API |
| user | 用户创建 |
