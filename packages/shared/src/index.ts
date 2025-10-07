import { MerkleTree } from 'merkletreejs';
import { keccak256, encodePacked } from 'viem';

// Merkle Tree Utilities
export class PayoutMerkleTree {
  private tree: MerkleTree;
  private leaves: string[];

  constructor(payouts: Array<{ hostId: string; amount: string }>) {
    this.leaves = payouts.map(({ hostId, amount }) =>
      keccak256(encodePacked(['address', 'uint256'], [hostId as `0x${string}`, BigInt(amount)]))
    );
    this.tree = new MerkleTree(this.leaves);
  }

  getRoot(): string {
    return this.tree.getRoot().toString('hex');
  }

  getProof(hostId: string, amount: string): string[] {
    const leaf = keccak256(encodePacked(['address', 'uint256'], [hostId as `0x${string}`, BigInt(amount)]));
    const index = this.leaves.indexOf(leaf);
    if (index === -1) {
      throw new Error('Payout not found for host');
    }
    return this.tree.getProof(leaf).map(proof => proof.data.toString('hex'));
  }

  verifyProof(hostId: string, amount: string, proof: string[]): boolean {
    const leaf = keccak256(encodePacked(['address', 'uint256'], [hostId as `0x${string}`, BigInt(amount)]));
    return this.tree.verify(proof.map(p => Buffer.from(p, 'hex')), leaf, this.tree.getRoot());
  }
}

// Utility Functions
export function formatUSDC(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(6);
}

export function parseUSDC(amount: string): bigint {
  return BigInt(Math.floor(parseFloat(amount) * 1e6));
}

export function calculatePlatformFee(amount: string, feePercentage: number = 5): string {
  const fee = (parseFloat(amount) * feePercentage) / 100;
  return fee.toFixed(6);
}

export function calculateHostEarnings(amount: string, feePercentage: number = 5): string {
  const fee = parseFloat(calculatePlatformFee(amount, feePercentage));
  const earnings = parseFloat(amount) - fee;
  return earnings.toFixed(6);
}

// Validation Functions
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidUSDCAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000; // Max 1M USDC
}

export function isValidCampaignDuration(days: number): boolean {
  return days >= 1 && days <= 365; // 1 day to 1 year
}

// Time Utilities
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isExpired(date: Date): boolean {
  return new Date() > date;
}

// Campaign Status Helpers
export function canStartCampaign(campaign: any): boolean {
  return campaign.status === 'funded' && 
         campaign.budget && 
         parseFloat(campaign.budget) > 0;
}

export function canPauseCampaign(campaign: any): boolean {
  return campaign.status === 'active';
}

export function canResumeCampaign(campaign: any): boolean {
  return campaign.status === 'paused';
}

export function canCompleteCampaign(campaign: any): boolean {
  return campaign.status === 'active' && 
         (campaign.schedule?.endDate ? isExpired(new Date(campaign.schedule.endDate)) : false);
}

// Fraud Detection
export function detectFraudulentImpressions(impressions: any[]): boolean {
  // Simple fraud detection based on patterns
  const now = Date.now();
  const recentImpressions = impressions.filter(imp => 
    now - new Date(imp.timestamp).getTime() < 60000 // Last minute
  );
  
  // If more than 100 impressions in the last minute, flag as suspicious
  return recentImpressions.length > 100;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateCPM(spend: string, impressions: number): number {
  if (impressions === 0) return 0;
  return (parseFloat(spend) / impressions) * 1000;
}

// Database Helpers
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// Error Handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 500, 'INTERNAL_ERROR');
  }
  
  return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
}
