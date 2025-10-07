import mongoose, { Document, Schema } from 'mongoose';

export interface SlotConfiguration {
  type: 'banner' | 'pinned_cast' | 'frame';
  enabled: boolean;
  minCPM?: number;
  maxAdsPerDay?: number;
  blockedCategories?: string[];
  preferredCategories?: string[];
}

export interface HostPreferences {
  autoApproveAds: boolean;
  minPayoutThreshold: number;
  payoutFrequency: 'hourly' | 'daily' | 'weekly';
  allowAdultContent: boolean;
  allowPoliticalAds: boolean;
  allowCryptoAds: boolean;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    onPayout: boolean;
    onNewAd: boolean;
    onLowBalance: boolean;
  };
}

export interface HostMetrics {
  totalEarnings: number;
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  averageCPM: number;
  bestPerformingSlot: string;
  lastPayoutAmount: number;
  lastPayoutDate: Date;
  pendingEarnings: number;
}

export interface IHostProfile extends Document {
  _id: mongoose.Types.ObjectId;
  fid: number; // Farcaster ID
  username: string;
  displayName: string;
  walletAddress: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  slots: SlotConfiguration[];
  preferences: HostPreferences;
  metrics: HostMetrics;
  profileCategories?: string[];
  audienceDemographics?: any;
  reputation: {
    score: number;
    totalRatings: number;
    averageRating: number;
    lastUpdated: Date;
    fraudFlags?: string[];
    qualityScore?: number;
    responseRate?: number;
  };
  onboardingStep: number;
  onboardingCompleted: boolean;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  kycCompletedAt?: Date;
  referredBy?: string;
  referralCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SlotConfigurationSchema = new Schema({
  type: {
    type: String,
    enum: ['banner', 'pinned_cast', 'frame'],
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  minCPM: Number,
  maxAdsPerDay: Number,
  blockedCategories: [String],
  preferredCategories: [String]
});

const HostPreferencesSchema = new Schema({
  autoApproveAds: {
    type: Boolean,
    default: true
  },
  minPayoutThreshold: {
    type: Number,
    default: 0.01
  },
  payoutFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'hourly'
  },
  allowAdultContent: {
    type: Boolean,
    default: false
  },
  allowPoliticalAds: {
    type: Boolean,
    default: true
  },
  allowCryptoAds: {
    type: Boolean,
    default: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    onPayout: { type: Boolean, default: true },
    onNewAd: { type: Boolean, default: true },
    onLowBalance: { type: Boolean, default: true }
  }
});

const HostMetricsSchema = new Schema({
  totalEarnings: { type: Number, default: 0 },
  totalImpressions: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  averageCTR: { type: Number, default: 0 },
  averageCPM: { type: Number, default: 0 },
  bestPerformingSlot: { type: String, default: '' },
  lastPayoutAmount: { type: Number, default: 0 },
  lastPayoutDate: Date,
  pendingEarnings: { type: Number, default: 0 }
});

const HostProfileSchema = new Schema<IHostProfile>({
  fid: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  walletAddress: {
    type: String,
    required: true
  },
  bio: String,
  avatarUrl: String,
  followerCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  slots: [SlotConfigurationSchema],
  preferences: {
    type: HostPreferencesSchema,
    default: () => ({})
  },
  metrics: {
    type: HostMetricsSchema,
    default: () => ({})
  },
  profileCategories: [String],
  audienceDemographics: Schema.Types.Mixed,
  reputation: {
    score: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    fraudFlags: [String],
    qualityScore: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 }
  },
  onboardingStep: {
    type: Number,
    default: 0
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  kycStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  kycCompletedAt: Date,
  referredBy: String,
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  notes: String
}, {
  timestamps: true,
  collection: 'hostprofiles'
});

// Indexes
HostProfileSchema.index({ fid: 1 });
HostProfileSchema.index({ walletAddress: 1 });
HostProfileSchema.index({ username: 1 });
HostProfileSchema.index({ 'reputation.score': -1 });
HostProfileSchema.index({ 'metrics.totalEarnings': -1 });

// Instance methods
HostProfileSchema.methods.isSlotEnabled = function(slotType: string): boolean {
  const slot = this.slots.find((s: SlotConfiguration) => s.type === slotType);
  return slot ? slot.enabled : false;
};

HostProfileSchema.methods.getActiveSlots = function(): SlotConfiguration[] {
  return this.slots.filter((s: SlotConfiguration) => s.enabled);
};

HostProfileSchema.methods.canDisplayAd = function(category: string): boolean {
  const activeSlots = this.getActiveSlots();
  if (activeSlots.length === 0) return false;

  // Check if category is blocked
  for (const slot of activeSlots) {
    if (slot.blockedCategories?.includes(category)) {
      return false;
    }
  }
  return true;
};

HostProfileSchema.methods.updateMetrics = function(impressions: number, clicks: number, earnings: number) {
  this.metrics.totalImpressions += impressions;
  this.metrics.totalClicks += clicks;
  this.metrics.totalEarnings += earnings;
  this.metrics.averageCTR = this.metrics.totalClicks / this.metrics.totalImpressions;
  this.metrics.averageCPM = (this.metrics.totalEarnings / this.metrics.totalImpressions) * 1000;
  return this.save();
};

// Add missing instance methods
HostProfileSchema.methods.getActiveSlots = function() {
  return this.slots.filter((s: SlotConfiguration) => s.enabled);
};

HostProfileSchema.methods.placements = function() {
  return []; // Mock implementation
};

// Static methods
HostProfileSchema.statics.findActiveHosts = function(filters: any) {
  const query: any = {
    onboardingCompleted: true,
    'slots.enabled': true
  };

  if (filters.minFollowers) {
    query.followerCount = { $gte: filters.minFollowers };
  }
  if (filters.maxFollowers) {
    query.followerCount = { ...query.followerCount, $lte: filters.maxFollowers };
  }
  if (filters.categories) {
    query.profileCategories = { $in: filters.categories };
  }
  if (filters.slotType) {
    query['slots.type'] = filters.slotType;
    query['slots.enabled'] = true;
  }

  return this.find(query).sort({ 'reputation.score': -1 });
};

// Add missing static methods
HostProfileSchema.statics.findByPk = function(id: string) {
  return this.findById(id);
};

HostProfileSchema.statics.update = function(filter: any, update: any) {
  return this.updateMany(filter, update);
};

export const HostProfile = mongoose.model<IHostProfile>('HostProfile', HostProfileSchema);
export type HostProfileAttributes = IHostProfile;