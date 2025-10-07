import mongoose, { Document, Schema } from 'mongoose';

export interface IEpoch extends Document {
  _id: mongoose.Types.ObjectId;
  id: string; // campaignId_epoch format
  campaignId: number;
  epoch: number;
  merkleRoot?: string;
  allocatedAmount?: string;
  claimedAmount?: string;
  finalizedAt?: Date;
  finalizedBy?: string;
  finalizedTxHash?: string;
  status: 'pending' | 'finalized' | 'settled';
  createdAt: Date;
  updatedAt: Date;
}

const EpochSchema = new Schema<IEpoch>({
  id: {
    type: String,
    required: true,
    unique: true,
    comment: 'Format: campaignId_epoch'
  },
  campaignId: {
    type: Number,
    required: true
  },
  epoch: {
    type: Number,
    required: true
  },
  merkleRoot: {
    type: String
  },
  allocatedAmount: {
    type: String,
    default: '0'
  },
  claimedAmount: {
    type: String,
    default: '0'
  },
  finalizedAt: Date,
  finalizedBy: String,
  finalizedTxHash: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'finalized', 'settled'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'epochs'
});

// Indexes
EpochSchema.index({ campaignId: 1, epoch: 1 });
EpochSchema.index({ status: 1 });
EpochSchema.index({ finalizedAt: 1 });

// Static methods
EpochSchema.statics.findByCampaign = function(campaignId: number) {
  return this.find({ campaignId }).sort({ epoch: 1 });
};

EpochSchema.statics.findPendingEpochs = function() {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

EpochSchema.statics.findByPk = function(id: string) {
  return this.findById(id);
};

EpochSchema.statics.findByIdAndUpdate = function(id: string, update: any, options?: any) {
  return this.findByIdAndUpdate(id, update, { new: true, ...options });
};

EpochSchema.statics.updateMany = function(filter: any, update: any) {
  return this.updateMany(filter, update);
};

export const Epoch = mongoose.model<IEpoch>('Epoch', EpochSchema);
export type EpochAttributes = IEpoch;