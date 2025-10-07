import mongoose, { Document, Schema } from 'mongoose';

export interface IEpochPayout extends Document {
  _id: mongoose.Types.ObjectId;
  epochId: string; // campaignId_epoch format
  campaignId: number;
  epoch: number;
  index: number;
  hostAddress: string;
  amount: string;
  proof?: string[]; // JSON array of proof hashes
  claimed: boolean;
  claimedTxHash?: string;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EpochPayoutSchema = new Schema<IEpochPayout>({
  epochId: {
    type: String,
    required: true
  },
  campaignId: {
    type: Number,
    required: true
  },
  epoch: {
    type: Number,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  hostAddress: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  proof: [String],
  claimed: {
    type: Boolean,
    default: false
  },
  claimedTxHash: {
    type: String
  },
  claimedAt: Date
}, {
  timestamps: true,
  collection: 'epochpayouts'
});

// Indexes
EpochPayoutSchema.index({ epochId: 1, index: 1 });
EpochPayoutSchema.index({ hostAddress: 1 });
EpochPayoutSchema.index({ claimed: 1 });
EpochPayoutSchema.index({ campaignId: 1, epoch: 1 });

// Static methods
EpochPayoutSchema.statics.findByEpoch = function(epochId: string) {
  return this.find({ epochId }).sort({ index: 1 });
};

EpochPayoutSchema.statics.findUnclaimed = function() {
  return this.find({ claimed: false });
};

EpochPayoutSchema.statics.findByHost = function(hostAddress: string) {
  return this.find({ hostAddress }).sort({ createdAt: -1 });
};

EpochPayoutSchema.statics.updateMany = function(filter: any, update: any) {
  return this.updateMany(filter, update);
};

export const EpochPayout = mongoose.model<IEpochPayout>('EpochPayout', EpochPayoutSchema);
export type EpochPayoutAttributes = IEpochPayout;