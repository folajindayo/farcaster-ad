import mongoose, { Document, Schema } from 'mongoose';

export interface IPayoutCycle extends Document {
  _id: mongoose.Types.ObjectId;
  merkleRoot: string;
  totalAmount: number;
  hostCount: number;
  status: 'generating' | 'ready' | 'distributed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

const PayoutCycleSchema = new Schema<IPayoutCycle>({
  merkleRoot: {
    type: String,
    required: true,
    maxlength: 66
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  hostCount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'distributed', 'failed'],
    default: 'generating'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'payout_cycles'
});

export const PayoutCycle = mongoose.model<IPayoutCycle>('PayoutCycle', PayoutCycleSchema);


