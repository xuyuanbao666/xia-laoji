import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';

// 用户信息（不含密码）
type UserWithoutPassword = Omit<IUser, 'password'>;

// 用户资料接口
export interface UserProfile {
  name: string;
  avatar?: string;
  gender: 'male' | 'female' | 'other';
  birthday: Date;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
}

// 用户目标接口
export interface UserGoals {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// 注册请求接口
export interface RegisterRequest {
  email: string;
  password: string;
  profile: UserProfile;
  goals?: UserGoals;
}

// 登录请求接口
export interface LoginRequest {
  email: string;
  password: string;
}

// 更新用户资料请求接口
export interface UpdateProfileRequest {
  profile?: Partial<UserProfile>;
  goals?: Partial<UserGoals>;
}

// 认证响应接口
export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  token: string;
}

// 认证服务类
class AuthService {
  /**
   * 注册新用户
   * @param email 邮箱
   * @param password 密码
   * @param profile 用户资料
   * @param goals 用户目标（可选）
   * @returns 用户信息和 JWT token
   */
  async register(
    email: string,
    password: string,
    profile: UserProfile,
    goals?: UserGoals
  ): Promise<AuthResponse> {
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      throw new Error('该邮箱已被注册');
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户（如果没有提供目标，使用默认值）
    const defaultGoals: UserGoals = {
      dailyCalories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65,
    };

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile,
      goals: goals || defaultGoals,
    });

    await user.save();

    // 生成 JWT token
    const token = generateToken(user._id.toString());

    // 返回用户信息（不含密码）
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return {
      user: userWithoutPassword as unknown as UserWithoutPassword,
      token,
    };
  }

  /**
   * 用户登录
   * @param email 邮箱
   * @param password 密码
   * @returns 用户信息和 JWT token
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // 查找用户（包含密码字段）
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('邮箱或密码错误');
    }

    // 生成 JWT token
    const token = generateToken(user._id.toString());

    // 返回用户信息（不含密码）
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return {
      user: userWithoutPassword as unknown as UserWithoutPassword,
      token,
    };
  }

  /**
   * 获取用户信息
   * @param userId 用户 ID
   * @returns 用户信息
   */
  async getProfile(userId: string): Promise<UserWithoutPassword> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('用户不存在');
    }

    // 返回用户信息（不含密码）
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return userWithoutPassword as unknown as UserWithoutPassword;
  }

  /**
   * 更新用户信息
   * @param userId 用户 ID
   * @param updates 更新内容
   * @returns 更新后的用户信息
   */
  async updateProfile(
    userId: string,
    updates: UpdateProfileRequest
  ): Promise<UserWithoutPassword> {
    // 构建更新对象，只包含有值的字段
    const updateOps: any = {};

    if (updates.profile) {
      Object.keys(updates.profile).forEach((key) => {
        const value = (updates.profile as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          // 对于生日字段，确保是有效的日期
          if (key === 'birthday') {
            try {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                updateOps[`profile.${key}`] = date;
              }
            } catch (e) {
              // 忽略无效日期
            }
          } else {
            updateOps[`profile.${key}`] = value;
          }
        }
      });
    }

    if (updates.goals) {
      Object.keys(updates.goals).forEach((key) => {
        const value = (updates.goals as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          updateOps[`goals.${key}`] = value;
        }
      });
    }

    // 使用 findOneAndUpdate 跳过必填验证（只更新指定字段）
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateOps },
      { new: true, runValidators: false }
    );

    if (!user) {
      throw new Error('用户不存在');
    }

    // 返回更新后的用户信息（不含密码）
    const userObj = user.toObject();
    const { password: _, ...userWithoutPassword } = userObj;

    return userWithoutPassword as unknown as UserWithoutPassword;
  }
}

// 导出单例
export default new AuthService();
