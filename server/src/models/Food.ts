import mongoose, { Schema, Document } from 'mongoose';

export interface IFood extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  nameZh: string;
  brand?: string;
  category: 'staple' | 'meat' | 'vegetable' | 'fruit' | 'dairy' | 'snack' | 'drink' | 'other';
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
  source: 'builtin' | 'api' | 'user';
}

const FoodSchema = new Schema<IFood>(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    nameZh: {
      type: String,
      required: [true, 'Chinese name is required'],
      trim: true,
      maxlength: [100, 'Chinese name cannot exceed 100 characters'],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [100, 'Brand cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: ['staple', 'meat', 'vegetable', 'fruit', 'dairy', 'snack', 'drink', 'other'],
      required: [true, 'Category is required'],
    },
    nutrition: {
      calories: {
        type: Number,
        required: [true, 'Calories is required'],
        min: [0, 'Calories cannot be negative'],
      },
      protein: {
        type: Number,
        required: [true, 'Protein is required'],
        min: [0, 'Protein cannot be negative'],
      },
      carbs: {
        type: Number,
        required: [true, 'Carbs is required'],
        min: [0, 'Carbs cannot be negative'],
      },
      fat: {
        type: Number,
        required: [true, 'Fat is required'],
        min: [0, 'Fat cannot be negative'],
      },
      fiber: {
        type: Number,
        default: 0,
        min: [0, 'Fiber cannot be negative'],
      },
      sugar: {
        type: Number,
        default: 0,
        min: [0, 'Sugar cannot be negative'],
      },
      sodium: {
        type: Number,
        default: 0,
        min: [0, 'Sodium cannot be negative'],
      },
    },
    servingSize: {
      type: Number,
      required: [true, 'Serving size is required'],
      min: [0, 'Serving size cannot be negative'],
    },
    servingName: {
      type: String,
      required: [true, 'Serving name is required'],
      trim: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
    imageUrl: {
      type: String,
    },
    source: {
      type: String,
      enum: ['builtin', 'api', 'user'],
      default: 'builtin',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FoodSchema.index({ name: 'text', nameZh: 'text' }); // Full-text search
FoodSchema.index({ category: 1 });
FoodSchema.index({ barcode: 1 }, { sparse: true });
FoodSchema.index({ source: 1 });
FoodSchema.index({ 'nutrition.calories': 1 });

const Food = mongoose.model<IFood>('Food', FoodSchema);

export default Food;
