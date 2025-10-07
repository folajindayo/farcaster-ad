import mongoose, { Document, Schema } from 'mongoose';

export interface ISettlement extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  merkleRoot: string;
  totalAmount: number; // USDC
  operatorFee: number; // USDC
  hostPayouts: Array<{
    hostId: mongoose.Types.ObjectId;
    amount: number; // USDC
    merkleProof: string[];
    isClaimed: boolean;
    claimedAt?: Date;
  }>;
  status: 'pending' | 'distributed' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    unique: true
  },
  merkleRoot: {
    type: String,
    required: true,
    unique: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  operatorFee: {
    type: Number,
    required: true,
    min: 0
  },
  hostPayouts: [{
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    merkleProof: [String],
    isClaimed: {
      type: Boolean,
      default: false
    },
    claimedAt: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'distributed', 'completed'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'settlements'
});

// Indexes for performance
SettlementSchema.index({ campaignId: 1 });
SettlementSchema.index({ status: 1 });
SettlementSchema.index({ 'hostPayouts.hostId': 1 });

export const Settlement = mongoose.model<ISettlement>('Settlement', SettlementSchema);
