import { CronJob } from 'cron';
import HourlyPayoutService from './hourlyPayout';
import { Epoch } from '../models';

/**
 * Keeper Bot Service (PRD Section 4.5)
 * 
 * Responsibilities:
 * 1. Run hourly cron job to process payouts
 * 2. Calculate host earnings
 * 3. Generate Merkle trees
 * 4. Submit Merkle roots to smart contract
 * 5. Execute batch distributions
 * 6. Take platform fee (5% default)
 */

interface KeeperConfig {
  enabled: boolean;
  cronPattern?: string; // Default: '0 * * * *' (every hour at minute 0)
  autoSubmit?: boolean; // Auto-submit Merkle roots to contract
  autoDistribute?: boolean; // Auto-execute batch distributions
}

export class KeeperService {
  private cronJob?: CronJob;
  private isProcessing: boolean = false;
  private config: KeeperConfig;

  constructor(config: KeeperConfig) {
    this.config = {
      enabled: config.enabled,
      cronPattern: config.cronPattern || '0 * * * *', // Every hour at minute 0
      autoSubmit: config.autoSubmit ?? false,
      autoDistribute: config.autoDistribute ?? false
    };
  }

  /**
   * Start the keeper service with cron schedule
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('⚠️ Keeper service disabled');
      return;
    }

    this.cronJob = new CronJob(
      this.config.cronPattern!,
      () => this.runHourlyProcess(),
      null,
      true,
      'UTC'
    );

    console.log(`✅ Keeper service started`);
    console.log(`   - Cron pattern: ${this.config.cronPattern}`);
    console.log(`   - Auto-submit: ${this.config.autoSubmit}`);
    console.log(`   - Auto-distribute: ${this.config.autoDistribute}`);
  }

  /**
   * Stop the keeper service
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⚠️ Keeper service stopped');
    }
  }

  /**
   * Run the hourly payout process
   * This is the main function called by the cron job
   */
  private async runHourlyProcess(): Promise<void> {
    if (this.isProcessing) {
      console.log('⚠️ Keeper already processing, skipping run');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      console.log('🕐 ============================================');
      console.log('🕐 HOURLY KEEPER PROCESS STARTED');
      console.log('🕐 ============================================');
      console.log(`Time: ${new Date().toISOString()}`);

      // Step 1: Process hourly payouts (calculate earnings, generate Merkle trees)
      await HourlyPayoutService.processHourlyPayouts();

      // Step 2: Auto-submit Merkle roots if enabled
      if (this.config.autoSubmit) {
        await this.submitPendingEpochs();
      }

      // Step 3: Auto-distribute if enabled
      if (this.config.autoDistribute) {
        await this.distributePendingEpochs();
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('🕐 ============================================');
      console.log(`✅ HOURLY KEEPER PROCESS COMPLETED (${duration}s)`);
      console.log('🕐 ============================================');
    } catch (error) {
      console.error('❌ Keeper process error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Submit pending Merkle roots to smart contract
   */
  private async submitPendingEpochs(): Promise<void> {
    try {
      console.log('📤 Submitting pending Merkle roots...');

      const pendingEpochs = await Epoch.find({
        status: 'ready'
      }).limit(10); // Process up to 10 epochs per run

      if (pendingEpochs.length === 0) {
        console.log('No pending epochs to submit');
        return;
      }

      for (const epoch of pendingEpochs) {
        try {
          await HourlyPayoutService.submitMerkleRoot(epoch._id.toString());
          console.log(`✅ Submitted Merkle root for epoch ${epoch._id}`);
        } catch (error) {
          console.error(`❌ Failed to submit epoch ${epoch._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error submitting pending epochs:', error);
    }
  }

  /**
   * Execute batch distributions for submitted epochs
   */
  private async distributePendingEpochs(): Promise<void> {
    try {
      console.log('💸 Executing batch distributions...');

      const submittedEpochs = await Epoch.find({
        status: 'submitted'
      }).limit(10); // Process up to 10 epochs per run

      if (submittedEpochs.length === 0) {
        console.log('No submitted epochs to distribute');
        return;
      }

      for (const epoch of submittedEpochs) {
        try {
          await HourlyPayoutService.executeBatchDistribution(epoch._id.toString());
          console.log(`✅ Distributed payouts for epoch ${epoch._id}`);
        } catch (error) {
          console.error(`❌ Failed to distribute epoch ${epoch._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error distributing pending epochs:', error);
    }
  }

  /**
   * Manually trigger hourly process (for testing/debugging)
   */
  async runManual(): Promise<void> {
    console.log('🔧 Manual keeper process triggered');
    await this.runHourlyProcess();
  }

  /**
   * Get keeper status
   */
  getStatus(): any {
    return {
      enabled: this.config.enabled,
      running: this.cronJob?.running || false,
      processing: this.isProcessing,
      cronPattern: this.config.cronPattern,
      autoSubmit: this.config.autoSubmit,
      autoDistribute: this.config.autoDistribute,
      nextRun: this.cronJob?.nextDate()?.toISO() || null
    };
  }
}

// Singleton instance
let keeperInstance: KeeperService | null = null;

/**
 * Initialize keeper service
 */
export function initKeeper(config: KeeperConfig): KeeperService {
  if (!keeperInstance) {
    keeperInstance = new KeeperService(config);
    if (config.enabled) {
      keeperInstance.start();
    }
  }
  return keeperInstance;
}

/**
 * Get keeper instance
 */
export function getKeeper(): KeeperService | null {
  return keeperInstance;
}

export default KeeperService;