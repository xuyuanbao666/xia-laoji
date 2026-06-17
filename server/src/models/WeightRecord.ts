import mongoose, { Schema, Document } from 'mongoose';

export interface IWeightRecord extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  weight: number;
  bodyFat?: number;
  note?: string;
}

const WeightRecordSchema = new Schema<IWeightRecord>(
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
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [20, 'Weight must be at least 20 kg'],
      max: [500, 'Weight cannot exceed 500 kg'],
    },
    bodyFat: {
      type: Number,
      min: [0, 'Body fat cannot be negative'],
      max: [100, 'Body fat cannot exceed 100%'],
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
WeightRecordSchema.index({ userId: 1, date: -1 }); // Query by user and date
WeightRecordSchema.index({ userId: 1, createdAt: -1 }); // Recent records

// Compound index for unique weight record per user per day
WeightRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

const WeightRecord = mongoose.model<IWeightRecord>('WeightRecord', WeightRecordSchema);

export default WeightRecord;
