// User Types
export interface User {
  id: string;
  farcasterId: string;
  walletAddress: string;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bannerUrl?: string;
  isHost: boolean;
  isAdvertiser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Host Types
export interface Host {
  id: string;
  userId: string;
  isActive: boolean;
  preferences: HostPreferences;
  totalEarnings: string; // USDC amount
  pendingEarnings: string; // USDC amount
  createdAt: Date;
  updatedAt: Date;
}

export interface HostPreferences {
  categories: string[];
  minPrice: string; // USDC amount
  maxCampaigns: number;
  autoApprove: boolean;
}

// Advertiser Types
export interface Advertiser {
  id: string;
  userId: string;
  companyName: string;
  totalSpent: string; // USDC amount
  activeCampaigns: number;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Types
export interface Campaign {
  id: string;
  advertiserId: string;
  title: string;
  description: string;
  budget: string; // USDC amount
  spent: string; // USDC amount
  status: CampaignStatus;
  type: CampaignType;
  targeting: CampaignTargeting;
  creative: CampaignCreative;
  schedule: CampaignSchedule;
  metrics: CampaignMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export enum CampaignStatus {
  DRAFT = 'draft',
  FUNDED = 'funded',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum CampaignType {
  BANNER = 'banner',
  PINNED_CAST = 'pinned_cast'
}

export interface CampaignTargeting {
  categories: string[];
  minFollowers?: number;
  maxFollowers?: number;
  regions?: string[];
}

export interface CampaignCreative {
  bannerImage?: string;
  pinnedCastText?: string;
  pinnedCastMedia?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  maxImpressions?: number;
  cpm?: string; // Cost per mille
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  engagements: number;
  spend: string; // USDC amount
  ctr: number; // Click-through rate
  cpm: number; // Cost per mille
}

// Ad Placement Types
export interface AdPlacement {
  id: string;
  campaignId: string;
  hostId: string;
  status: PlacementStatus;
  approvedAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  metrics: PlacementMetrics;
  createdAt: Date;
  updatedAt: Date;
}

export enum PlacementStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface PlacementMetrics {
  impressions: number;
  clicks: number;
  engagements: number;
  earnings: string; // USDC amount
}

// Payout Types
export interface Payout {
  id: string;
  hostId: string;
  amount: string; // USDC amount
  status: PayoutStatus;
  merkleProof?: string;
  claimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PayoutStatus {
  PENDING = 'pending',
  AVAILABLE = 'available',
  CLAIMED = 'claimed'
}

export interface PayoutCycle {
  id: string;
  merkleRoot: string;
  totalAmount: string; // USDC amount
  hostCount: number;
  status: PayoutCycleStatus;
  createdAt: Date;
  completedAt?: Date;
}

export enum PayoutCycleStatus {
  GENERATING = 'generating',
  READY = 'ready',
  COMPLETED = 'completed'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Blockchain Types
export interface ContractConfig {
  address: string;
  abi: any[];
  chainId: number;
}

export interface MerkleProof {
  leaf: string;
  proof: string[];
  index: number;
}

// Event Types
export interface ImpressionEvent {
  placementId: string;
  hostId: string;
  campaignId: string;
  timestamp: Date;
  userAgent: string;
  ipAddress: string;
  referrer?: string;
}

export interface ClickEvent {
  placementId: string;
  hostId: string;
  campaignId: string;
  timestamp: Date;
  userAgent: string;
  ipAddress: string;
  targetUrl: string;
}
