import mongoose, { Document, Schema } from 'mongoose';

export interface IHost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  farcasterId: number;
  username: string;
  displayName?: string;
  followerCount: number;
  status: 'active' | 'inactive' | 'paused';
  acceptingCampaigns: boolean;
  
  // Ad preferences
  adTypes: ('banner' | 'pinned_cast')[];
  categories: string[];
  minimumCPM: number;
  
  // Original profile data (for reverting after campaign ends)
  originalBanner?: string;
  
  // Earnings
  totalEarnings: number;
  pendingEarnings: number;
  
  // Mini App permissions
  miniAppPermissionsGranted: boolean;
  lastPermissionUpdate?: Date;
  
  // Legacy
  isActive: boolean;
  preferences: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
}

const HostSchema = new Schema<IHost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farcasterId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String
  },
  followerCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'paused'],
    default: 'active'
  },
  acceptingCampaigns: {
    type: Boolean,
    default: true
  },
  
  // Ad preferences
  adTypes: {
    type: [String],
    enum: ['banner', 'pinned_cast'],
    default: ['banner', 'pinned_cast']
  },
  categories: {
    type: [String],
    default: []
  },
  minimumCPM: {
    type: Number,
    default: 0
  },
  
  // Original profile data
  originalBanner: {
    type: String
  },
  
  // Earnings
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  pendingEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Mini App permissions
  miniAppPermissionsGranted: {
    type: Boolean,
    default: false
  },
  lastPermissionUpdate: {
    type: Date
  },
  
  // Legacy fields (keep for backward compatibility)
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'hosts'
});

// Indexes for performance
HostSchema.index({ userId: 1 });
HostSchema.index({ farcasterId: 1 });
HostSchema.index({ status: 1, acceptingCampaigns: 1 });
HostSchema.index({ followerCount: 1 });
HostSchema.index({ categories: 1 });

export const Host = mongoose.model<IHost>('Host', HostSchema);
