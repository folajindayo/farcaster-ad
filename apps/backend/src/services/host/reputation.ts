/**
 * Host Reputation Service
 * Manages host reputation, fraud detection, and suspension logic
 * Extracted from hostManager for better separation of concerns
 */

import { HostProfile } from '../../models';
import { NotFoundError } from '../../utils/errors';
import { logger, PerformanceLogger } from '../../utils/logger';
import { HOST } from '../../config/constants';
import { CacheInvalidation } from '../../utils/cache';
import { ReputationUpdateData } from './types';

/**
 * Host Reputation Service
 * Handles reputation scoring and fraud management
 */
export class HostReputationService {
  /**
   * Update host reputation based on performance and incidents
   * Uses weighted scoring algorithm for fair assessment
   */
  static async updateHostReputation(
    hostId: number,
    updates: ReputationUpdateData
  ): Promise<void> {
    const perf = new PerformanceLogger('updateHostReputation', { hostId });

    try {
      const host = await HostProfile.findById(hostId);
      if (!host) {
        throw new NotFoundError('Host', String(hostId));
      }

      const reputation = { ...host.reputation };

      // Handle fraud incident
      if (updates.fraudIncident) {
        reputation.fraudFlags = (reputation.fraudFlags || 0) + 1;
        reputation.score = Math.max(0, reputation.score - HOST.REPUTATION_FRAUD_PENALTY);
        
        logger.warn('Fraud flag added to host', {
          hostId,
          fraudFlags: reputation.fraudFlags,
          newScore: reputation.score,
        });
      }

      // Update quality score
      if (updates.qualityScore !== undefined) {
        reputation.qualityScore = this.clampScore(updates.qualityScore);
      }

      // Update response rate
      if (updates.responseRate !== undefined) {
        reputation.responseRate = this.clampScore(updates.responseRate);
      }

      // Recalculate overall score using weighted formula
      reputation.score = this.calculateOverallScore(reputation);

      // Save updated reputation
      await host.save({ reputation });

      // Suspend host if score too low
      if (reputation.score < HOST.SUSPENSION_THRESHOLD) {
        await this.suspendHost(host, 'Low reputation score');
      }

      // Invalidate cache
      CacheInvalidation.host(String(hostId));

      logger.info('Host reputation updated', {
        hostId,
        score: reputation.score,
        fraudFlags: reputation.fraudFlags,
      });

      perf.end();
    } catch (error) {
      logger.error('Failed to update host reputation', error, { hostId });
      perf.error(error);
      throw error;
    }
  }

  /**
   * Check if host can serve ads (not suspended, has good reputation)
   */
  static async canHostServeAds(hostId: number): Promise<boolean> {
    try {
      const host = await HostProfile.findById(hostId);
      if (!host) {
        return false;
      }

      return (
        host.status === 'active' &&
        host.isOptedIn &&
        (host.reputation?.score || 0) >= HOST.SUSPENSION_THRESHOLD
      );
    } catch (error) {
      logger.error('Failed to check host status', error, { hostId });
      return false;
    }
  }

  /**
   * Get reputation health report for host
   */
  static async getReputationReport(hostId: number): Promise<any> {
    const host = await HostProfile.findById(hostId);
    if (!host) {
      throw new NotFoundError('Host', String(hostId));
    }

    const reputation = host.reputation || {};
    const score = reputation.score || HOST.MAX_REPUTATION_SCORE;
    const fraudFlags = reputation.fraudFlags || 0;

    return {
      score,
      fraudFlags,
      qualityScore: reputation.qualityScore || HOST.MAX_REPUTATION_SCORE,
      responseRate: reputation.responseRate || HOST.MAX_REPUTATION_SCORE,
      status: this.getReputationStatus(score, fraudFlags),
      canServeAds: await this.canHostServeAds(hostId),
      recommendations: this.getRecommendations(score, fraudFlags),
    };
  }

  /**
   * Bulk update reputation for multiple hosts
   */
  static async bulkUpdateReputation(
    updates: Array<{ hostId: number; updates: ReputationUpdateData }>
  ): Promise<void> {
    const perf = new PerformanceLogger('bulkUpdateReputation', {
      count: updates.length,
    });

    try {
      // Process in parallel with error handling per host
      const promises = updates.map((update) =>
        this.updateHostReputation(update.hostId, update.updates).catch((error) => {
          logger.error('Failed to update reputation in bulk', error, {
            hostId: update.hostId,
          });
          // Continue with other hosts
        })
      );

      await Promise.all(promises);

      logger.info('Bulk reputation update completed', {
        total: updates.length,
      });

      perf.end();
    } catch (error) {
      logger.error('Bulk reputation update failed', error);
      perf.error(error);
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Clamp score between 0 and 100
   */
  private static clampScore(score: number): number {
    return Math.max(HOST.MIN_REPUTATION_SCORE, Math.min(HOST.MAX_REPUTATION_SCORE, score));
  }

  /**
   * Calculate overall reputation score using weighted formula
   * Formula: (qualityScore * 0.5) + (responseRate * 0.3) + (fraudPenalty * 0.2)
   */
  private static calculateOverallScore(reputation: any): number {
    const qualityScore = reputation.qualityScore || HOST.MAX_REPUTATION_SCORE;
    const responseRate = reputation.responseRate || HOST.MAX_REPUTATION_SCORE;
    const fraudFlags = reputation.fraudFlags || 0;

    const fraudPenalty = Math.max(
      0,
      HOST.MAX_REPUTATION_SCORE - fraudFlags * HOST.REPUTATION_FRAUD_PENALTY
    );

    const score =
      qualityScore * HOST.REPUTATION_WEIGHTS.QUALITY +
      responseRate * HOST.REPUTATION_WEIGHTS.RESPONSE_RATE +
      fraudPenalty * HOST.REPUTATION_WEIGHTS.FRAUD_PENALTY;

    return Math.round(this.clampScore(score));
  }

  /**
   * Suspend host with reason
   */
  private static async suspendHost(host: any, reason: string): Promise<void> {
    await host.save({ status: 'suspended' });

    logger.warn('Host suspended', {
      hostId: host.id,
      reason,
      reputationScore: host.reputation?.score,
    });

    // TODO: Send notification to host about suspension
  }

  /**
   * Get human-readable reputation status
   */
  private static getReputationStatus(
    score: number,
    fraudFlags: number
  ): 'excellent' | 'good' | 'fair' | 'poor' | 'suspended' {
    if (score < HOST.SUSPENSION_THRESHOLD) return 'suspended';
    if (fraudFlags > 3) return 'poor';
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Get recommendations to improve reputation
   */
  private static getRecommendations(score: number, fraudFlags: number): string[] {
    const recommendations: string[] = [];

    if (score < 50) {
      recommendations.push('Improve ad quality and engagement rates');
    }

    if (score < 70) {
      recommendations.push('Maintain consistent performance metrics');
    }

    if (fraudFlags > 0) {
      recommendations.push('Avoid suspicious activity patterns');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep up the excellent performance!');
    }

    return recommendations;
  }
}



