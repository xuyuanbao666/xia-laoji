import Food, { IFood } from '../models/Food';
import User from '../models/User';

export class FoodService {
  /**
   * 搜索食物
   * @param query - 搜索关键词
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 食物列表
   */
  static async searchFoods(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ foods: IFood[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (query && query.trim()) {
      const searchQuery = query.trim();
      // 使用正则模糊搜索（支持中英文）
      filter.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { nameZh: { $regex: searchQuery, $options: 'i' } },
        { category: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const [foods, total] = await Promise.all([
      Food.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ nameZh: 1 }),
      Food.countDocuments(filter),
    ]);

    return {
      foods,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取食物详情
   * @param id - 食物 ID
   * @returns 单个食物
   */
  static async getFoodById(id: string): Promise<IFood | null> {
    return Food.findById(id);
  }

  /**
   * 通过条形码获取食物
   * @param barcode - 条形码
   * @returns 食物
   */
  static async getFoodByBarcode(barcode: string): Promise<IFood | null> {
    return Food.findOne({ barcode });
  }

  /**
   * 获取用户收藏的食物
   * @param userId - 用户 ID
   * @returns 收藏的食物列表
   */
  static async getFavorites(userId: string): Promise<IFood[]> {
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      throw new Error('User not found');
    }
    return user.favorites as any;
  }

  /**
   * 添加收藏
   * @param userId - 用户 ID
   * @param foodId - 食物 ID
   * @returns 更新后的用户
   */
  static async addFavorite(userId: string, foodId: string): Promise<void> {
    const [user, food] = await Promise.all([
      User.findById(userId),
      Food.findById(foodId),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    if (!food) {
      throw new Error('Food not found');
    }

    // 检查是否已收藏
    const existingFavorite = user.favorites.find(
      (fav) => fav.toString() === foodId
    );

    if (existingFavorite) {
      throw new Error('Food already in favorites');
    }

    user.favorites.push(new (require('mongoose').Types.ObjectId)(foodId));
    await user.save();
  }

  /**
   * 取消收藏
   * @param userId - 用户 ID
   * @param foodId - 食物 ID
   * @returns 更新后的用户
   */
  static async removeFavorite(userId: string, foodId: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // 检查是否在收藏中
    const favoriteIndex = user.favorites.findIndex(
      (fav) => fav.toString() === foodId
    );

    if (favoriteIndex === -1) {
      throw new Error('Food not in favorites');
    }

    user.favorites.splice(favoriteIndex, 1);
    await user.save();
  }
}
