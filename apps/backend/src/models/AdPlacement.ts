import mongoose, { Document, Schema } from 'mongoose';

export interface IAdPlacement extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  status:
    | 'pending'
    | 'approved'
    | 'active'
    | 'paused'
    | 'completed'
    | 'cancelled';
  approvedAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  metrics: Record<string, unknown>;
  // Add missing properties
  impressions: number;
  clicks: number;
  likes: number;
  recasts: number;
  replies: number;
  targeting: any;
  creative: any;
  advertiserId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdPlacementSchema = new Schema<IAdPlacement>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'Host',
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'active',
        'paused',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },
    approvedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Add missing properties to schema
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    recasts: {
      type: Number,
      default: 0,
    },
    replies: {
      type: Number,
      default: 0,
    },
    targeting: {
      type: Schema.Types.Mixed,
      default: {},
    },
    creative: {
      type: Schema.Types.Mixed,
      default: {},
    },
    advertiserId: {
      type: Schema.Types.ObjectId,
      ref: 'Advertiser',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'ad_placements',
  }
);

// Indexes for performance
AdPlacementSchema.index({ campaignId: 1 });
AdPlacementSchema.index({ hostId: 1 });
AdPlacementSchema.index({ status: 1 });

export const AdPlacement = mongoose.model<IAdPlacement>(
  'AdPlacement',
  AdPlacementSchema
);
