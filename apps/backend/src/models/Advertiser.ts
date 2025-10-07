import mongoose, { Document, Schema } from 'mongoose';

export interface IAdvertiser extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  companyName: string;
  totalSpent: number;
  activeCampaigns: number;
  createdAt: Date;
  updatedAt: Date;
}

const AdvertiserSchema = new Schema<IAdvertiser>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    maxlength: 255
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  activeCampaigns: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'advertisers'
});

// Indexes for performance
AdvertiserSchema.index({ userId: 1 });

export const Advertiser = mongoose.model<IAdvertiser>('Advertiser', AdvertiserSchema);
