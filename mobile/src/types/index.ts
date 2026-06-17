/**
 * 用户相关类型
 */
export interface User {
  _id: string;
  email: string;
  profile: {
    name: string;
    avatar?: string;
    gender: 'male' | 'female' | 'other';
    birthday: string;
    height: number;
    currentWeight: number;
    targetWeight: number;
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  };
  goals: {
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  favorites: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  height?: number;
  currentWeight?: number;
  targetWeight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active';
  dailyCalories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/**
 * 食物相关类型
 */
export interface Food {
  _id: string;
  name: string;
  nameZh: string;
  brand?: string;
  category: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  servingSize: number;
  servingName: string;
  barcode?: string;
  imageUrl?: string;
}

export interface SearchFoodsResponse {
  foods: Food[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 饮食记录相关类型
 */
export interface DietRecord {
  _id: string;
  userId: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Array<{
    foodId: string;
    name: string;
    amount: number;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  note?: string;
}

export interface CreateRecordRequest {
  foodId: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  amount: number;
  date?: string;
  note?: string;
}

export interface UpdateRecordRequest {
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  amount?: number;
  note?: string;
}

export interface DailySummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: {
    [key: string]: {
      foods: any[];
      totalCalories: number;
    };
  };
}

/**
 * 通用类型
 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
