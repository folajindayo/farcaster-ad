/**
 * Host Earnings Service
 * Handles earnings calculations and analytics
 * Extracted from hostManager for better separation of concerns
 */

import { HostProfile, EpochPayout, Receipt, AdPlacement } from '../../models';
import { NotFoundError } from '../../utils/errors';
import { logger, PerformanceLogger } from '../../utils/logger';
import { PAYOUT } from '../../config/constants';
import { cache, CacheKeys } from '../../utils/cache';
import {
  HostEarningsData,
  HostPerformanceData,
  SlotEarnings,
  PayoutSummary,
  HourlyStats,
  TopCampaign,
  SlotPerformance,
} from './types';

/**
 * Host Earnings Service
 * Handles all earnings-related operations with proper caching
 */
export class HostEarningsService {
  /**
   * Get comprehensive earnings data for a host
   * Optimized with parallel queries and caching
   */
  static async getHostEarnings(hostId: number): Promise<HostEarningsData> {
    const perf = new PerformanceLogger('getHostEarnings', { hostId });

    try {
      // Check cache first
      const cached = cache.get<HostEarningsData>(CacheKeys.hostEarnings(String(hostId)));
      if (cached) {
        perf.end({ source: 'cache' });
        return cached;
      }

      const host = await HostProfile.findById(hostId);
      if (!host) {
        throw new NotFoundError('Host', String(hostId));
      }

      const now = new Date();
      const { todayStart, weekStart, monthStart } = this.getTimeRanges(now);

      // Parallel queries for better performance
      const [
        allPayouts,
        recentPayouts,
        todayReceipts,
        weekReceipts,
        monthReceipts,
        placements,
      ] = await Promise.all([
        this.getAllPayouts(host.walletAddress),
        this.getRecentPayouts(host.walletAddress, 10),
        this.getReceipts(host.walletAddress, todayStart),
        this.getReceipts(host.walletAddress, weekStart),
        this.getReceipts(host.walletAddress, monthStart),
        this.getHostPlacements(hostId),
      ]);

      // Calculate earnings
      const earnings = this.calculateEarnings(allPayouts);
      const periodEarnings = this.calculatePeriodEarnings(
        todayReceipts,
        weekReceipts,
        monthReceipts
      );
      const earningsBySlot = this.calculateSlotEarnings(placements);
      const nextPayoutIn = this.calculateNextPayoutTime(now);

      const result: HostEarningsData = {
        totalEarnings: earnings.total,
        pendingEarnings: earnings.pending,
        claimedEarnings: earnings.claimed,
        todayEarnings: periodEarnings.today,
        thisWeekEarnings: periodEarnings.week,
        thisMonthEarnings: periodEarnings.month,
        lastPayoutAmount: recentPayouts[0]?.amount || '0',
        lastPayoutDate: recentPayouts[0]?.claimedAt || null,
        nextPayoutIn,
        earningsBySlot,
        recentPayouts: this.formatPayouts(recentPayouts),
        performanceMetrics: {
          averageCPM: host.metrics?.averageCPM || 0,
          averageCTR: host.metrics?.averageCTR || 0,
          totalImpressions: host.metrics?.totalImpressions || 0,
          totalClicks: host.metrics?.totalClicks || 0,
          fillRate: this.calculateFillRate(placements, host.slots.length),
        },
      };

      // Cache for 30 seconds
      cache.set(CacheKeys.hostEarnings(String(hostId)), result, 30);

      perf.end({ source: 'database' });
      return result;
    } catch (error) {
      perf.error(error);
      throw error;
    }
  }

  /**
   * Get current hour earnings (real-time estimate)
   */
  static async getCurrentHourEarnings(hostAddress: string): Promise<any> {
    const perf = new PerformanceLogger('getCurrentHourEarnings', { hostAddress });

    try {
      const { hourStart, hourEnd } = this.getCurrentHourRange();

      const receipts = await Receipt.find({
        hostAddress: hostAddress.toLowerCase(),
        timestamp: { $gte: hourStart, $lt: hourEnd },
        processed: false,
      }).lean();

      const totalImpressions = receipts.reduce((sum, r) => sum + (r.impressions || 0), 0);
      const totalClicks = receipts.reduce((sum, r) => sum + (r.clicks || 0), 0);

      // Estimate earnings
      const estimatedEarnings = this.estimateEarnings(totalImpressions);

      const result = {
        hourStart,
        hourEnd,
        impressions: totalImpressions,
        clicks: totalClicks,
        estimatedEarnings: estimatedEarnings.toFixed(6),
        receiptsCount: receipts.length,
        estimatedCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      };

      perf.end();
      return result;
    } catch (error) {
      perf.error(error);
      throw error;
    }
  }

  /**
   * Get lifetime earnings summary
   */
  static async getLifetimeEarnings(hostAddress: string): Promise<any> {
    const payouts = await EpochPayout.find({
      hostAddress: hostAddress.toLowerCase(),
    }).lean();

    const totalEarnings = payouts.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const claimedEarnings = payouts
      .filter((p) => p.claimed)
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const pendingEarnings = totalEarnings - claimedEarnings;

    return {
      totalEarnings: totalEarnings.toFixed(6),
      claimedEarnings: claimedEarnings.toFixed(6),
      pendingEarnings: pendingEarnings.toFixed(6),
      totalPayouts: payouts.length,
      claimedPayouts: payouts.filter((p) => p.claimed).length,
    };
  }

  /**
   * Get host performance analytics
   */
  static async getHostPerformance(
    hostId: number,
    days: number = 7
  ): Promise<HostPerformanceData> {
    const perf = new PerformanceLogger('getHostPerformance', { hostId, days });

    try {
      // Check cache
      const cached = cache.get<HostPerformanceData>(
        CacheKeys.hostPerformance(String(hostId), days)
      );
      if (cached) {
        perf.end({ source: 'cache' });
        return cached;
      }

      const host = await HostProfile.findById(hostId);
      if (!host) {
        throw new NotFoundError('Host', String(hostId));
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Parallel queries
      const [receipts, placements] = await Promise.all([
        Receipt.find({
          hostAddress: host.walletAddress,
          timestamp: { $gte: startDate },
        })
          .sort({ timestamp: 1 })
          .lean(),
        AdPlacement.find({ hostId })
          .populate('campaignId', 'title')
          .sort({ 'metrics.impressions': -1 })
          .limit(5)
          .lean(),
      ]);

      const result: HostPerformanceData = {
        hourlyStats: this.aggregateHourlyStats(receipts),
        topCampaigns: this.formatTopCampaigns(placements),
        slotPerformance: this.calculateSlotPerformance(host.slots, placements),
      };

      // Cache for 5 minutes
      cache.set(CacheKeys.hostPerformance(String(hostId), days), result, 300);

      perf.end({ source: 'database' });
      return result;
    } catch (error) {
      perf.error(error);
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  private static getTimeRanges(now: Date) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    return { todayStart, weekStart, monthStart };
  }

  private static getCurrentHourRange() {
    const now = new Date();
    const hourStart = new Date(now);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart.getTime() + PAYOUT.INTERVAL_MS);

    return { hourStart, hourEnd };
  }

  private static async getAllPayouts(walletAddress: string) {
    return EpochPayout.find({
      hostAddress: walletAddress.toLowerCase(),
    }).lean();
  }

  private static async getRecentPayouts(walletAddress: string, limit: number) {
    return EpochPayout.find({
      hostAddress: walletAddress.toLowerCase(),
      claimed: true,
    })
      .sort({ claimedAt: -1 })
      .limit(limit)
      .lean();
  }

  private static async getReceipts(walletAddress: string, fromDate: Date) {
    return Receipt.find({
      hostAddress: walletAddress.toLowerCase(),
      timestamp: { $gte: fromDate },
    }).lean();
  }

  private static async getHostPlacements(hostId: number) {
    return AdPlacement.find({ hostId }).populate('campaignId', 'title').lean();
  }

  private static calculateEarnings(payouts: any[]) {
    const total = payouts.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const claimed = payouts
      .filter((p) => p.claimed)
      .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
    const pending = total - claimed;

    return {
      total: total.toFixed(6),
      claimed: claimed.toFixed(6),
      pending: pending.toFixed(6),
    };
  }

  private static calculatePeriodEarnings(
    todayReceipts: any[],
    weekReceipts: any[],
    monthReceipts: any[]
  ) {
    return {
      today: (todayReceipts.length * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(6),
      week: (weekReceipts.length * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(6),
      month: (monthReceipts.length * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(6),
    };
  }

  private static calculateSlotEarnings(placements: any[]): SlotEarnings[] {
    const slotStats: Record<string, any> = {};

    placements.forEach((p: any) => {
      if (!slotStats[p.slotType]) {
        slotStats[p.slotType] = {
          slot: p.slotType,
          earnings: 0,
          impressions: 0,
          clicks: 0,
        };
      }
      slotStats[p.slotType].impressions += p.metrics?.impressions || 0;
      slotStats[p.slotType].clicks += p.metrics?.clicks || 0;
    });

    return Object.values(slotStats).map((stat: any) => ({
      ...stat,
      earnings: (stat.impressions * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(2),
      ctr: stat.impressions > 0 ? (stat.clicks / stat.impressions) * 100 : 0,
    }));
  }

  private static calculateNextPayoutTime(now: Date): number {
    const nextHour = new Date(Math.ceil(now.getTime() / PAYOUT.INTERVAL_MS) * PAYOUT.INTERVAL_MS);
    return Math.floor((nextHour.getTime() - now.getTime()) / 60000);
  }

  private static formatPayouts(payouts: any[]): PayoutSummary[] {
    return payouts.map((p) => ({
      amount: p.amount,
      date: p.claimedAt,
      txHash: p.claimedTxHash,
      status: p.claimed ? 'claimed' : 'pending',
    }));
  }

  private static estimateEarnings(impressions: number): number {
    const estimatedCPM = 5.0; // Default CPM
    return (impressions / 1000) * estimatedCPM * PAYOUT.ESTIMATED_EARNINGS_MULTIPLIER;
  }

  private static calculateFillRate(placements: any[], totalSlots: number): number {
    const activeSlots = new Set(placements.filter((p: any) => p.status === 'active').map((p: any) => p.slotType)).size;
    return totalSlots > 0 ? (activeSlots / totalSlots) * 100 : 0;
  }

  private static aggregateHourlyStats(receipts: any[]): HourlyStats[] {
    const hourlyStats: Record<number, HourlyStats> = {};

    receipts.forEach((receipt: any) => {
      const hour = new Date(receipt.timestamp).getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          hour,
          impressions: 0,
          clicks: 0,
          earnings: '0',
        };
      }
      hourlyStats[hour].impressions += receipt.impressions || 0;
      hourlyStats[hour].clicks += receipt.clicks || 0;
    });

    return Object.values(hourlyStats).map((stat) => ({
      ...stat,
      earnings: (stat.impressions * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(2),
    }));
  }

  private static formatTopCampaigns(placements: any[]): TopCampaign[] {
    return placements.map((p: any) => ({
      campaignId: p.campaignId?._id?.toString() || '',
      title: p.campaignId?.title || 'Unknown',
      impressions: p.metrics?.impressions || 0,
      earnings: ((p.metrics?.impressions || 0) * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(2),
    }));
  }

  private static calculateSlotPerformance(slots: any[], placements: any[]): SlotPerformance[] {
    return slots.map((slot: any) => {
      const slotPlacements = placements.filter((p: any) => p.slotType === slot.type);
      const totalImpressions = slotPlacements.reduce(
        (sum: number, p: any) => sum + (p.metrics?.impressions || 0),
        0
      );
      const totalClicks = slotPlacements.reduce(
        (sum: number, p: any) => sum + (p.metrics?.clicks || 0),
        0
      );

      return {
        slot: slot.type,
        fillRate: slot.enabled ? Math.min(100, (slotPlacements.length / 10) * 100) : 0,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        earnings: (totalImpressions * PAYOUT.EARNINGS_PER_IMPRESSION).toFixed(2),
        impressions: totalImpressions,
        clicks: totalClicks,
      };
    });
  }
}



