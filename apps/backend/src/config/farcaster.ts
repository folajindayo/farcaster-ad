import dotenv from 'dotenv';
import { createClient } from '@farcaster/auth-client';

dotenv.config();

// Farcaster API configuration
const FARCASTER_API_KEY = process.env.FARCASTER_API_KEY || 'wc_secret_a3f6c0a47a4a8f37bbb24d525cb286b9e2effe68b66592ef0e43f057_16fbe470';
const FARCASTER_APP_BASE_URL = process.env.FARCASTER_APP_BASE_URL || 'https://farcaster-ad-rental.vercel.app';

// Create Farcaster auth client with minimal configuration
export const farcasterClient = createClient({
  relay: FARCASTER_APP_BASE_URL,
  ethereum: {
    getAddress: async () => '0x0000000000000000000000000000000000000000',
    signMessage: async () => '0x0000000000000000000000000000000000000000',
  },
} as any);

// Farcaster configuration
export const farcasterConfig = {
  apiKey: FARCASTER_API_KEY,
  appUrl: FARCASTER_APP_BASE_URL,
  miniAppName: 'Farcaster Ad Rental',
  miniAppDescription: 'Rent ad space on Farcaster profiles and earn USDC',
  miniAppIcon: `${FARCASTER_APP_BASE_URL}/logo.png`,
};

// Slot types available for ad placement
export const adSlotTypes = {
  BANNER: 'banner',
  PINNED_CAST: 'pinned_cast',
  FRAME: 'frame',
};

// Hourly payout configuration
export const payoutConfig = {
  intervalMinutes: 60, // Hourly payouts
  minPayoutAmount: 0.01, // Minimum USDC amount to trigger a payout
  operatorFeePercent: 10, // 10% fee for the operator
};

// Farcaster utils
export const validateFarcasterSignature = async (message: string, signature: string, fid: number) => {
  try {
    // For now, return true as a placeholder - implement proper signature verification
    console.log('Validating Farcaster signature:', { message, signature, fid });
    return true;
  } catch (error) {
    console.error('Error validating Farcaster signature:', error);
    return false;
  }
};

export default {
  farcasterClient,
  farcasterConfig,
  adSlotTypes,
  payoutConfig,
  validateFarcasterSignature,
};
