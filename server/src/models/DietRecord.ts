import mongoose, { Schema, Document } from 'mongoose';

export interface IDietRecord extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: [{
    foodId: mongoose.Types.ObjectId;
    name: string;
    amount: number;
    nutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  note?: string;
  imageUrl?: string;
  createdAt: Date;
}

const DietRecordSchema = new Schema<IDietRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    meal: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: [true, 'Meal type is required'],
    },
    foods: [{
      foodId: {
        type: Schema.Types.ObjectId,
        ref: 'Food',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative'],
      },
      nutrition: {
        calories: {
          type: Number,
          required: true,
          min: [0, 'Calories cannot be negative'],
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
    }],
    totalNutrition: {
      calories: {
        type: Number,
        required: true,
        min: [0, 'Total calories cannot be negative'],
      },
      protein: {
        type: Number,
        required: true,
        min: [0, 'Total protein cannot be negative'],
      },
      carbs: {
        type: Number,
        required: true,
        min: [0, 'Total carbs cannot be negative'],
      },
      fat: {
        type: Number,
        required: true,
        min: [0, 'Total fat cannot be negative'],
      },
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
DietRecordSchema.index({ userId: 1, date: -1 }); // Query by user and date
DietRecordSchema.index({ userId: 1, date: 1, meal: 1 }); // Query specific meal
DietRecordSchema.index({ userId: 1, createdAt: -1 }); // Recent records

const DietRecord = mongoose.model<IDietRecord>('DietRecord', DietRecordSchema);

export default DietRecord;
