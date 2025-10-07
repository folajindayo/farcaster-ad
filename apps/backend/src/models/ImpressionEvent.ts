import mongoose, { Document, Schema } from 'mongoose';

export interface IImpressionEvent extends Document {
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
  createdAt: Date;
}

const ImpressionEventSchema = new Schema<IImpressionEvent>({
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
  }
}, {
  timestamps: true,
  collection: 'impression_events'
});

// Indexes for performance
ImpressionEventSchema.index({ campaignId: 1, timestamp: 1 });
ImpressionEventSchema.index({ hostId: 1, timestamp: 1 });
ImpressionEventSchema.index({ farcasterId: 1, timestamp: 1 });

export const ImpressionEvent = mongoose.model<IImpressionEvent>('ImpressionEvent', ImpressionEventSchema);