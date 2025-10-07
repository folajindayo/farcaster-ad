import mongoose, { Document, Schema } from 'mongoose';

export interface IClickEvent extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  hostId: mongoose.Types.ObjectId;
  placementId: mongoose.Types.ObjectId;
  farcasterId: string;
  slot: 'banner' | 'pinned_cast' | 'frame';
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  isBot: boolean;
  conversionData?: {
    externalUrl?: string;
    conversionValue?: number;
  };
  createdAt: Date;
}

const ClickEventSchema = new Schema<IClickEvent>({
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  hostId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  placementId: {
    type: Schema.Types.ObjectId,
    ref: 'AdPlacement',
    required: true
  },
  farcasterId: {
    type: String,
    required: true
  },
  slot: {
    type: String,
    enum: ['banner', 'pinned_cast', 'frame'],
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  userAgent: String,
  ipAddress: String,
  isBot: {
    type: Boolean,
    default: false
  },
  conversionData: {
    externalUrl: String,
    conversionValue: Number
  }
}, {
  timestamps: true,
  collection: 'click_events'
});

// Indexes for performance
ClickEventSchema.index({ campaignId: 1, timestamp: 1 });
ClickEventSchema.index({ hostId: 1, timestamp: 1 });
ClickEventSchema.index({ farcasterId: 1, timestamp: 1 });

export const ClickEvent = mongoose.model<IClickEvent>('ClickEvent', ClickEventSchema);