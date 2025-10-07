import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'advertiser' | 'host' | 'operator';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  farcasterId: string;
  walletAddress: string;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bannerUrl?: string;
  role: UserRole;
  // Advertiser specific fields
  totalSpent?: number;
  activeCampaigns?: number;
  // Host specific fields
  isOptedIn?: boolean;
  totalEarnings?: number;
  claimableBalance?: number;
  // Operator specific fields
  isOperator?: boolean;
  // Add missing properties
  isHost?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  farcasterId: {
    type: String,
    required: true,
    unique: true,
    maxlength: 255
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    maxlength: 42
  },
  username: {
    type: String,
    required: true,
    maxlength: 255
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 255
  },
  pfpUrl: {
    type: String,
    maxlength: 1000
  },
  bannerUrl: {
    type: String,
    maxlength: 1000
  },
  role: {
    type: String,
    enum: ['advertiser', 'host', 'operator'],
    default: 'advertiser'
  },
  // Advertiser fields
  totalSpent: {
    type: Number,
    default: 0
  },
  activeCampaigns: {
    type: Number,
    default: 0
  },
  // Host fields
  isOptedIn: {
    type: Boolean,
    default: false
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  claimableBalance: {
    type: Number,
    default: 0
  },
  // Operator fields
  isOperator: {
    type: Boolean,
    default: false
  },
  // Add missing properties to schema
  isHost: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Indexes for performance
UserSchema.index({ farcasterId: 1 });
UserSchema.index({ walletAddress: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
