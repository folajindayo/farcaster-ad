/**
 * Host Onboarding Service
 * Handles host registration and onboarding flow
 * Extracted from hostManager for better separation of concerns
 */

import { HostProfile, Receipt } from '../../models';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { logger, PerformanceLogger } from '../../utils/logger';
import { validateAddress, HostValidator } from '../../utils/validation';
import farcasterAuth from '../farcasterAuth';
import { HOST, SLOT_TYPES } from '../../config/constants';
import { CacheInvalidation } from '../../utils/cache';
import { HostOnboardingData, HostUpdateData } from './types';

/**
 * Host Onboarding Service
 * Handles registration, updates, and configuration
 */
export class HostOnboardingService {
  /**
   * Complete host onboarding process
   * Validates Farcaster profile, creates host record, and sets up initial configuration
   */
  static async onboardHost(data: HostOnboardingData): Promise<any> {
    const perf = new PerformanceLogger('onboardHost', { fid: data.fid });

    try {
      // Validate input
      this.validateOnboardingData(data);

      // Verify Farcaster profile
      const farcasterProfile = await farcasterAuth.verifyFarcasterAuth('', '', data.fid);
      if (!farcasterProfile) {
        throw new NotFoundError('Farcaster profile');
      }

      // Check if host already exists
      let host = await HostProfile.findOne({
        where: { fid: data.fid },
      });

      if (host) {
        logger.info('Host already exists, updating profile', { fid: data.fid });
        host = await this.updateExistingHost(host.id, data);
        perf.end({ action: 'updated' });
        return host;
      }

      // Create new host profile
      host = await this.createNewHost(data, farcasterProfile);

      // Create welcome bonus
      await this.createWelcomeBonus(host);

      // Process referral if provided
      if (data.referralCode) {
        await this.processReferral(host.id, data.referralCode);
      }

      logger.info('Host onboarded successfully', {
        hostId: host.id,
        fid: data.fid,
        username: data.username,
      });

      perf.end({ action: 'created' });
      return host;
    } catch (error) {
      logger.error('Host onboarding failed', error, { fid: data.fid });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Update existing host profile
   */
  static async updateHostProfile(
    hostId: number,
    updates: HostUpdateData
  ): Promise<any> {
    const perf = new PerformanceLogger('updateHostProfile', { hostId });

    try {
      const host = await HostProfile.findById(hostId);
      if (!host) {
        throw new NotFoundError('Host', String(hostId));
      }

      // Validate updates
      if (updates.walletAddress) {
        updates.walletAddress = validateAddress(updates.walletAddress);
      }

      // Update slots if provided
      if (updates.selectedSlots) {
        const updatedSlots = host.slots.map((slot: any) => ({
          ...slot,
          enabled: updates.selectedSlots!.includes(slot.type),
        }));
        delete (updates as any).selectedSlots;
        (updates as any).slots = updatedSlots;
      }

      await host.save(updates);

      // Invalidate cache
      CacheInvalidation.host(String(hostId));

      logger.info('Host profile updated', { hostId });
      perf.end();

      return host;
    } catch (error) {
      logger.error('Failed to update host profile', error, { hostId });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Toggle host opt-in status
   */
  static async toggleOptIn(hostId: number, optIn: boolean): Promise<any> {
    const perf = new PerformanceLogger('toggleOptIn', { hostId, optIn });

    try {
      const host = await HostProfile.findById(hostId);
      if (!host) {
        throw new NotFoundError('Host', String(hostId));
      }

      await host.save({
        isOptedIn: optIn,
        status: optIn ? 'active' : 'paused',
        ...(optIn ? { optInDate: new Date() } : { optOutDate: new Date() }),
      });

      // Remove active ad placements if opting out
      if (!optIn) {
        const { AdPlacement } = await import('../../models');
        await AdPlacement.updateMany(
          { hostId, status: 'active' },
          { status: 'inactive' }
        );
      }

      // Invalidate cache
      CacheInvalidation.host(String(hostId));

      logger.info(`Host ${optIn ? 'opted in' : 'opted out'}`, { hostId });
      perf.end();

      return host;
    } catch (error) {
      logger.error('Failed to toggle opt-in', error, { hostId });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Update slot configuration
   */
  static async updateSlotConfig(
    hostId: number,
    slotType: string,
    config: Partial<any>
  ): Promise<any> {
    const perf = new PerformanceLogger('updateSlotConfig', { hostId, slotType });

    try {
      const host = await HostProfile.findById(hostId);
      if (!host) {
        throw new NotFoundError('Host', String(hostId));
      }

      const updatedSlots = host.slots.map((slot: any) => {
        if (slot.type === slotType) {
          return { ...slot, ...config };
        }
        return slot;
      });

      await host.save({ slots: updatedSlots });

      // Invalidate cache
      CacheInvalidation.host(String(hostId));

      logger.info('Slot config updated', { hostId, slotType });
      perf.end();

      return host;
    } catch (error) {
      logger.error('Failed to update slot config', error, { hostId, slotType });
      perf.error(error);
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  private static validateOnboardingData(data: HostOnboardingData): void {
    HostValidator.fid(data.fid);
    HostValidator.username(data.username);
    validateAddress(data.walletAddress);
    HostValidator.followerCount(data.followerCount);

    if (!data.selectedSlots || data.selectedSlots.length === 0) {
      throw new ConflictError('At least one slot must be selected');
    }
  }

  private static async updateExistingHost(hostId: number, data: HostOnboardingData): Promise<any> {
    return this.updateHostProfile(hostId, {
      walletAddress: data.walletAddress,
      selectedSlots: data.selectedSlots,
      preferences: data.preferences,
    });
  }

  private static async createNewHost(data: HostOnboardingData, farcasterProfile: any): Promise<any> {
    const slots = this.createSlotConfigurations(data.selectedSlots);
    const referralCode = this.generateReferralCode(data.username);

    return HostProfile.create({
      fid: data.fid,
      username: data.username,
      displayName: data.displayName,
      walletAddress: data.walletAddress.toLowerCase(),
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      followerCount: data.followerCount,
      followingCount: 0,
      isVerified: farcasterProfile.verified || false,
      isOptedIn: true,
      optInDate: new Date(),
      status: 'active',
      slots,
      preferences: data.preferences || {},
      referralCode,
      onboardingStep: 5, // Completed
      onboardingCompleted: true,
    });
  }

  private static createSlotConfigurations(selectedSlots: string[]) {
    return [SLOT_TYPES.BANNER, SLOT_TYPES.PINNED_CAST, SLOT_TYPES.FRAME].map((type) => ({
      type: type as 'banner' | 'pinned_cast' | 'frame',
      enabled: selectedSlots.includes(type),
      minCPM: HOST.DEFAULT_MIN_CPM,
      maxAdsPerDay:
        type === SLOT_TYPES.BANNER
          ? HOST.DEFAULT_MAX_ADS_PER_DAY_BANNER
          : HOST.DEFAULT_MAX_ADS_PER_DAY_OTHER,
    }));
  }

  private static generateReferralCode(username: string): string {
    const random = Math.random()
      .toString(36)
      .substring(2, 2 + HOST.REFERRAL_CODE_LENGTH)
      .toUpperCase();
    return `${username.substring(0, 3).toUpperCase()}${random}`;
  }

  private static async createWelcomeBonus(host: any): Promise<void> {
    await Receipt.create({
      campaignId: 0, // System campaign
      hostAddress: host.walletAddress,
      timestamp: new Date(),
      impressions: HOST.WELCOME_BONUS_IMPRESSIONS,
      clicks: 0,
      dwellMs: 0,
      processed: false,
      signature: 'WELCOME_BONUS',
    });

    logger.info('Welcome bonus created', { hostId: host.id });
  }

  private static async processReferral(newHostId: number, referralCode: string): Promise<void> {
    try {
      const referrer = await HostProfile.findOne({
        where: { referralCode },
      });

      if (!referrer) {
        logger.warn('Invalid referral code', { referralCode });
        return;
      }

      // Update new host
      await HostProfile.save(
        { referredBy: referrer.walletAddress },
        { where: { id: newHostId } }
      );

      // Create referral bonus for referrer
      await Receipt.create({
        campaignId: 0,
        hostAddress: referrer.walletAddress,
        timestamp: new Date(),
        impressions: HOST.REFERRAL_BONUS_IMPRESSIONS,
        clicks: 0,
        dwellMs: 0,
        processed: false,
        signature: 'REFERRAL_BONUS',
      });

      logger.info('Referral processed', {
        newHostId,
        referrerId: referrer.id,
        referralCode,
      });
    } catch (error) {
      logger.error('Failed to process referral', error, { referralCode });
      // Don't throw - referral failure shouldn't break onboarding
    }
  }
}



