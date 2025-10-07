import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: number;
  hostAddress: string;
  timestamp: Date;
  impressions: number;
  clicks: number;
  dwellMs?: number;
  viewerFingerprint?: string;
  signature?: string;
  processed: boolean;
  epochId?: string;
  createdAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>({
  campaignId: {
    type: Number,
    required: true
  },
  hostAddress: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  impressions: {
    type: Number,
    required: true,
    default: 0
  },
  clicks: {
    type: Number,
    required: true,
    default: 0
  },
  dwellMs: Number,
  viewerFingerprint: String,
  signature: String,
  processed: {
    type: Boolean,
    default: false
  },
  epochId: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'receipts'
});

// Indexes
ReceiptSchema.index({ campaignId: 1, hostAddress: 1 });
ReceiptSchema.index({ timestamp: 1 });
ReceiptSchema.index({ processed: 1 });
ReceiptSchema.index({ epochId: 1 });

// Static methods
ReceiptSchema.statics.findByCampaign = function(campaignId: number) {
  return this.find({ campaignId }).sort({ timestamp: -1 });
};

ReceiptSchema.statics.findByHost = function(hostAddress: string) {
  return this.find({ hostAddress }).sort({ timestamp: -1 });
};

ReceiptSchema.statics.findUnprocessed = function() {
  return this.find({ processed: false }).sort({ timestamp: 1 });
};

ReceiptSchema.statics.findByEpoch = function(epochId: string) {
  return this.find({ epochId }).sort({ timestamp: 1 });
};

ReceiptSchema.statics.updateMany = function(filter: any, update: any) {
  return this.updateMany(filter, update);
};

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
export type ReceiptAttributes = IReceipt;