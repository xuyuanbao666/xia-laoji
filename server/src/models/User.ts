import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  profile: {
    name: string;
    avatar?: string;
    gender: 'male' | 'female' | 'other';
    birthday: Date;
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
  favorites: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    profile: {
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters'],
      },
      avatar: {
        type: String,
        default: null,
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, 'Gender is required'],
      },
      birthday: {
        type: Date,
        required: [true, 'Birthday is required'],
      },
      height: {
        type: Number,
        required: [true, 'Height is required'],
        min: [50, 'Height must be at least 50 cm'],
        max: [300, 'Height cannot exceed 300 cm'],
      },
      currentWeight: {
        type: Number,
        required: [true, 'Current weight is required'],
        min: [20, 'Weight must be at least 20 kg'],
        max: [500, 'Weight cannot exceed 500 kg'],
      },
      targetWeight: {
        type: Number,
        required: [true, 'Target weight is required'],
        min: [20, 'Target weight must be at least 20 kg'],
        max: [500, 'Target weight cannot exceed 500 kg'],
      },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active'],
        required: [true, 'Activity level is required'],
      },
    },
    goals: {
      dailyCalories: {
        type: Number,
        required: true,
        min: [500, 'Daily calories must be at least 500'],
        max: [10000, 'Daily calories cannot exceed 10000'],
      },
      protein: {
        type: Number,
        required: true,
        min: [0, 'Protein cannot be negative'],
      },
      carbs: {
        type: Number,
        required: true,
        min: [0, 'Carbs cannot be negative'],
      },
      fat: {
        type: Number,
        required: true,
        min: [0, 'Fat cannot be negative'],
      },
    },
    favorites: [{
      type: Schema.Types.ObjectId,
      ref: 'Food',
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'profile.name': 1 });

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
