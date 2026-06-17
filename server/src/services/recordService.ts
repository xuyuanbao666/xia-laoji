import DietRecord, { IDietRecord } from '../models/DietRecord';
import Food from '../models/Food';
import mongoose from 'mongoose';

export interface CreateRecordData {
  date: Date;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: {
    foodId: string;
    amount: number;
  }[];
  note?: string;
  imageUrl?: string;
}

export interface UpdateRecordData {
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods?: {
    foodId: string;
    amount: number;
  }[];
  note?: string;
  imageUrl?: string;
}

export class RecordService {
  /**
   * 创建饮食记录
   * @param userId - 用户 ID
   * @param data - 记录数据
   * @returns 创建的记录
   */
  static async createRecord(userId: string, data: CreateRecordData): Promise<IDietRecord> {
    // 验证所有食物存在并获取营养信息
    const foodsData = await Promise.all(
      data.foods.map(async (item) => {
        const food = await Food.findById(item.foodId);
        if (!food) {
          throw new Error(`Food not found: ${item.foodId}`);
        }

        // 计算营养素（根据食用量和标准份量）
        const ratio = item.amount / food.servingSize;
        const nutrition = {
          calories: Math.round(food.nutrition.calories * ratio * 100) / 100,
          protein: Math.round(food.nutrition.protein * ratio * 100) / 100,
          carbs: Math.round(food.nutrition.carbs * ratio * 100) / 100,
          fat: Math.round(food.nutrition.fat * ratio * 100) / 100,
        };

        return {
          foodId: food._id,
          name: food.nameZh || food.name,
          amount: item.amount,
          nutrition,
        };
      })
    );

    // 计算总营养素
    const totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    foodsData.forEach((food) => {
      totalNutrition.calories += food.nutrition.calories;
      totalNutrition.protein += food.nutrition.protein;
      totalNutrition.carbs += food.nutrition.carbs;
      totalNutrition.fat += food.nutrition.fat;
    });

    // 四舍五入到两位小数
    totalNutrition.calories = Math.round(totalNutrition.calories * 100) / 100;
    totalNutrition.protein = Math.round(totalNutrition.protein * 100) / 100;
    totalNutrition.carbs = Math.round(totalNutrition.carbs * 100) / 100;
    totalNutrition.fat = Math.round(totalNutrition.fat * 100) / 100;

    // 创建记录
    const record = new DietRecord({
      userId: new mongoose.Types.ObjectId(userId),
      date: data.date,
      meal: data.meal,
      foods: foodsData,
      totalNutrition,
      note: data.note,
      imageUrl: data.imageUrl,
    });

    await record.save();
    return record;
  }

  /**
   * 获取记录列表
   * @param userId - 用户 ID
   * @param startDate - 开始日期
   * @param endDate - 结束日期
   * @returns 记录列表
   */
  static async getRecords(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IDietRecord[]> {
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = startDate;
      }
      if (endDate) {
        // 设置结束日期为当天的 23:59:59
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date.$lte = endOfDay;
      }
    }

    return DietRecord.find(filter)
      .sort({ date: -1, meal: 1 })
      .populate('foods.foodId', 'name nameZh category');
  }

  /**
   * 获取每日汇总
   * @param userId - 用户 ID
   * @param date - 日期
   * @returns 每日汇总
   */
  static async getDailySummary(userId: string, date: Date): Promise<{
    date: Date;
    totalNutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    meals: {
      meal: string;
      records: IDietRecord[];
      totalNutrition: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
    }[];
  }> {
    // 设置日期范围（当天 00:00:00 到 23:59:59）
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await DietRecord.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .sort({ meal: 1 })
      .populate('foods.foodId', 'name nameZh category');

    // 按餐次分组
    const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    const mealsMap = new Map<string, IDietRecord[]>();

    mealOrder.forEach((meal) => {
      mealsMap.set(meal, []);
    });

    records.forEach((record) => {
      const mealRecords = mealsMap.get(record.meal) || [];
      mealRecords.push(record);
      mealsMap.set(record.meal, mealRecords);
    });

    // 计算每日总营养素
    const totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };

    // 构建餐次数据
    const meals = mealOrder
      .filter((meal) => mealsMap.get(meal)?.length ?? 0 > 0)
      .map((meal) => {
        const mealRecords = mealsMap.get(meal) || [];
        const mealTotal = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };

        mealRecords.forEach((record) => {
          mealTotal.calories += record.totalNutrition.calories;
          mealTotal.protein += record.totalNutrition.protein;
          mealTotal.carbs += record.totalNutrition.carbs;
          mealTotal.fat += record.totalNutrition.fat;
        });

        // 累加到每日总计
        totalNutrition.calories += mealTotal.calories;
        totalNutrition.protein += mealTotal.protein;
        totalNutrition.carbs += mealTotal.carbs;
        totalNutrition.fat += mealTotal.fat;

        return {
          meal,
          records: mealRecords,
          totalNutrition: mealTotal,
        };
      });

    // 四舍五入
    totalNutrition.calories = Math.round(totalNutrition.calories * 100) / 100;
    totalNutrition.protein = Math.round(totalNutrition.protein * 100) / 100;
    totalNutrition.carbs = Math.round(totalNutrition.carbs * 100) / 100;
    totalNutrition.fat = Math.round(totalNutrition.fat * 100) / 100;

    return {
      date: startOfDay,
      totalNutrition,
      meals,
    };
  }

  /**
   * 更新记录
   * @param recordId - 记录 ID
   * @param userId - 用户 ID
   * @param updates - 更新数据
   * @returns 更新后的记录
   */
  static async updateRecord(
    recordId: string,
    userId: string,
    updates: UpdateRecordData
  ): Promise<IDietRecord | null> {
    // 查找记录并验证所有权
    const record = await DietRecord.findOne({
      _id: recordId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!record) {
      throw new Error('Record not found or access denied');
    }

    // 如果更新了食物，需要重新计算营养素
    if (updates.foods) {
      const foodsData = await Promise.all(
        updates.foods.map(async (item) => {
          const food = await Food.findById(item.foodId);
          if (!food) {
            throw new Error(`Food not found: ${item.foodId}`);
          }

          const ratio = item.amount / food.servingSize;
          const nutrition = {
            calories: Math.round(food.nutrition.calories * ratio * 100) / 100,
            protein: Math.round(food.nutrition.protein * ratio * 100) / 100,
            carbs: Math.round(food.nutrition.carbs * ratio * 100) / 100,
            fat: Math.round(food.nutrition.fat * ratio * 100) / 100,
          };

          return {
            foodId: food._id,
            name: food.nameZh || food.name,
            amount: item.amount,
            nutrition,
          };
        })
      );

      // 更新食物数据
      record.foods = foodsData as any;

      // 重新计算总营养素
      const totalNutrition = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };

      foodsData.forEach((food) => {
        totalNutrition.calories += food.nutrition.calories;
        totalNutrition.protein += food.nutrition.protein;
        totalNutrition.carbs += food.nutrition.carbs;
        totalNutrition.fat += food.nutrition.fat;
      });

      record.totalNutrition = {
        calories: Math.round(totalNutrition.calories * 100) / 100,
        protein: Math.round(totalNutrition.protein * 100) / 100,
        carbs: Math.round(totalNutrition.carbs * 100) / 100,
        fat: Math.round(totalNutrition.fat * 100) / 100,
      };
    }

    // 更新其他字段
    if (updates.meal !== undefined) {
      record.meal = updates.meal;
    }
    if (updates.note !== undefined) {
      record.note = updates.note;
    }
    if (updates.imageUrl !== undefined) {
      record.imageUrl = updates.imageUrl;
    }

    await record.save();
    return record;
  }

  /**
   * 删除记录
   * @param recordId - 记录 ID
   * @param userId - 用户 ID
   * @returns 是否删除成功
   */
  static async deleteRecord(recordId: string, userId: string): Promise<boolean> {
    const result = await DietRecord.deleteOne({
      _id: recordId,
      userId: new mongoose.Types.ObjectId(userId),
    });

    return result.deletedCount > 0;
  }
}
