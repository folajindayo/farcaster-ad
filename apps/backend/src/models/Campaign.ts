import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled';
export type AdSlot = 'banner' | 'pinned_cast' | 'frame';

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  advertiserId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  budget: number; // USDC
  spent: number; // USDC
  status: CampaignStatus;
  type: AdSlot;
  // Campaign-level data
  creativeAssets: {
    imageUrl?: string;
    frameUrl?: string;
    castText?: string;
    externalUrl?: string;
  };
  targetMetric: 'impressions' | 'duration';
  targetValue: number; // impressions count or duration in days
  startDate: Date;
  endDate: Date;
  approvalFlag: boolean;
  // Ad Performance data
  totalImpressions: number;
  totalClicks: number;
  ctr: number; // click-through rate
  engagementActions: {
    recasts: number;
    likes: number;
    replies: number;
  };
  conversionProxy?: string; // external URL for conversion tracking
  // Host distribution
  hostDistribution: Array<{
    hostId: mongoose.Types.ObjectId;
    impressions: number;
    clicks: number;
    earningsShare: number;
  }>;
  // Add missing properties
  name: string;
  creative: any;
  schedule: any;
  targeting: any;
  metrics: any;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>({
  advertiserId: {
    type: Schema.Types.ObjectId,
    ref: 'Advertiser',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 255
  },
  description: {
    type: String,
    maxlength: 2000
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['banner', 'pinned_cast', 'frame'],
    required: true
  },
  creativeAssets: {
    imageUrl: String,
    frameUrl: String,
    castText: String,
    externalUrl: String
  },
  targetMetric: {
    type: String,
    enum: ['impressions', 'duration'],
    required: true
  },
  targetValue: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  approvalFlag: {
    type: Boolean,
    default: false
  },
  // Ad Performance data
  totalImpressions: {
    type: Number,
    default: 0
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  ctr: {
    type: Number,
    default: 0
  },
  engagementActions: {
    recasts: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 }
  },
  conversionProxy: String,
  // Host distribution
  hostDistribution: [{
    hostId: { type: Schema.Types.ObjectId, ref: 'User' },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    earningsShare: { type: Number, default: 0 }
  }],
  // Add missing properties to schema
  name: {
    type: String,
    required: true
  },
  creative: {
    type: Schema.Types.Mixed,
    default: {}
  },
  schedule: {
    type: Schema.Types.Mixed,
    default: {}
  },
  targeting: {
    type: Schema.Types.Mixed,
    default: {}
  },
  metrics: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'campaigns'
});

// Indexes for performance
CampaignSchema.index({ advertiserId: 1 });
CampaignSchema.index({ status: 1 });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
