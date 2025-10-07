import mongoose, { Document, Schema } from 'mongoose';

export interface IPayout extends Document {
  _id: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  merkleProof?: string;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>({
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'Host',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  merkleProof: {
    type: String
  },
  claimedAt: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'payouts'
});

// Indexes for performance
PayoutSchema.index({ hostId: 1 });
PayoutSchema.index({ status: 1 });

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);
