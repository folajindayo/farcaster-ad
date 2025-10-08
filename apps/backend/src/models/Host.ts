import mongoose, { Document, Schema } from 'mongoose';

export interface IHost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  preferences: Record<string, unknown>;
  totalEarnings: number;
  pendingEarnings: number;
  
  // Mini App Integration
  miniAppPermissionsGranted: boolean;
  miniAppGrantedAt?: Date;
  allowedAdTypes: ('pinned_cast' | 'banner')[];
  maxAdsPerDay: number;
  minCpm: number; // Minimum CPM they'll accept (in dollars)
  
  createdAt: Date;
  updatedAt: Date;
}

const HostSchema = new Schema<IHost>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    type: Schema.Types.Mixed,
    default: {}
  },
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
  // Mini App Integration
  miniAppPermissionsGranted: {
    type: Boolean,
    default: false
  },
  miniAppGrantedAt: {
    type: Date
  },
  allowedAdTypes: {
    type: [String],
    enum: ['pinned_cast', 'banner'],
    default: ['pinned_cast', 'banner']
  },
  maxAdsPerDay: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  minCpm: {
    type: Number,
    default: 1.0, // $1 minimum CPM
    min: 0.1
  }
}, {
  timestamps: true,
  collection: 'hosts'
});

// Indexes for performance
HostSchema.index({ userId: 1 });

export const Host = mongoose.model<IHost>('Host', HostSchema);
