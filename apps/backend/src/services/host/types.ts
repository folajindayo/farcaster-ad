/**
 * Host Service Type Definitions
 * Centralized type definitions for host-related operations
 */

import { HostStatus } from '../../config/constants';

/**
 * Host onboarding data
 */
export interface HostOnboardingData {
  fid: number;
  username: string;
  displayName: string;
  walletAddress: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  selectedSlots: string[];
  preferences?: HostPreferences;
  referralCode?: string;
}

/**
 * Host preferences
 */
export interface HostPreferences {
  minCPM?: number;
  categories?: string[];
  excludedCategories?: string[];
  maxAdsPerDay?: number;
  autoApprove?: boolean;
  notificationSettings?: {
    email?: boolean;
    push?: boolean;
    newCampaign?: boolean;
    payout?: boolean;
  };
}

/**
 * Host earnings data
 */
export interface HostEarningsData {
  totalEarnings: string;
  pendingEarnings: string;
  claimedEarnings: string;
  todayEarnings: string;
  thisWeekEarnings: string;
  thisMonthEarnings: string;
  lastPayoutAmount: string;
  lastPayoutDate: Date | null;
  nextPayoutIn: number; // minutes until next payout
  earningsBySlot: SlotEarnings[];
  recentPayouts: PayoutSummary[];
  performanceMetrics: PerformanceMetrics;
}

/**
 * Slot earnings
 */
export interface SlotEarnings {
  slot: string;
  earnings: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

/**
 * Payout summary
 */
export interface PayoutSummary {
  amount: string;
  date: Date;
  txHash?: string;
  status: 'claimed' | 'pending';
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  averageCPM: number;
  averageCTR: number;
  totalImpressions: number;
  totalClicks: number;
  fillRate: number;
}

/**
 * Host performance data
 */
export interface HostPerformanceData {
  hourlyStats: HourlyStats[];
  topCampaigns: TopCampaign[];
  slotPerformance: SlotPerformance[];
}

/**
 * Hourly statistics
 */
export interface HourlyStats {
  hour: number;
  impressions: number;
  clicks: number;
  earnings: string;
}

/**
 * Top campaign data
 */
export interface TopCampaign {
  campaignId: string;
  title: string;
  impressions: number;
  earnings: string;
}

/**
 * Slot performance
 */
export interface SlotPerformance {
  slot: string;
  fillRate: number;
  ctr: number;
  earnings: string;
  impressions: number;
  clicks: number;
}

/**
 * Host filtering options
 */
export interface HostFilterOptions {
  minFollowers?: number;
  maxFollowers?: number;
  categories?: string[];
  regions?: string[];
  slotType?: string;
  minCPM?: number;
  maxCPM?: number;
  status?: HostStatus;
  verified?: boolean;
  minReputationScore?: number;
}

/**
 * Host update data
 */
export interface HostUpdateData {
  walletAddress?: string;
  selectedSlots?: string[];
  preferences?: Partial<HostPreferences>;
  bio?: string;
  avatarUrl?: string;
  status?: HostStatus;
}

/**
 * Reputation update data
 */
export interface ReputationUpdateData {
  fraudIncident?: boolean;
  qualityScore?: number;
  responseRate?: number;
}

/**
 * Batch metrics update
 */
export interface BatchMetricsUpdate {
  walletAddress: string;
  impressions: number;
  clicks: number;
  earnings: number;
}



