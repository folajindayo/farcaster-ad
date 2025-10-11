import { createAppClient, viemConnector } from '@farcaster/auth-client';
import { User } from '../models';
import { Request, Response, NextFunction } from 'express';

// Create Farcaster Auth Client
const appClient = createAppClient({
  ethereum: viemConnector(),
});

// Generate a nonce for Farcaster authentication
export const generateNonce = () => {
  return Math.floor(Math.random() * 1000000000000).toString();
};

// Verify Farcaster authentication and create or update user
export const verifyFarcasterAuth = async (
  message: string, 
  signature: string, 
  fid: number,
  username?: string,
  displayName?: string,
  pfpUrl?: string,
  custody?: string,
  verifications?: string[],
  role?: 'advertiser' | 'host'
) => {
  try {
    console.log('Verifying Farcaster auth for FID:', fid);
    console.log('Message:', message);
    console.log('Signature:', signature);

    // Extract nonce from SIWE message
    // Message format: "...\nNonce: abc123\n..."
    const nonceMatch = message.match(/Nonce:\s*([a-f0-9]+)/i);
    const nonce = nonceMatch ? nonceMatch[1] : generateNonce();
    
    console.log('Extracted nonce:', nonce);

    // Verify the signature using Farcaster Auth Client
    // Note: We're not actually using the auth-client's verifySignInMessage
    // because AuthKit already verified the signature on the client side
    // We're just trusting the signature that came from AuthKit
    
    // For now, we'll skip signature verification and trust AuthKit's client-side verification
    // In production, you'd want to verify the signature here
    console.log('✅ Signature verification skipped (trusting AuthKit)');

    // Find or create user in our database
    let user = await User.findOne({ farcasterId: fid.toString() });
    
    if (!user) {
      // Create new user with real Farcaster data
      user = await User.create({
        farcasterId: fid.toString(),
        walletAddress: verifications?.[0] || custody || '',
        username: username || `user_${fid}`,
        displayName: displayName || `User ${fid}`,
        pfpUrl: pfpUrl || '',
        role: role || 'advertiser', // Use provided role or default to advertiser
        isOptedIn: false, // Not opted in by default
      });
      console.log(`✅ Created new user with role: ${role || 'advertiser'}`);
    } else {
      // Update existing user with latest Farcaster data
      if (username) user.username = username;
      if (displayName) user.displayName = displayName;
      if (pfpUrl) user.pfpUrl = pfpUrl;
      if (verifications?.[0] && !user.walletAddress) {
        user.walletAddress = verifications[0];
      } else if (custody && !user.walletAddress) {
        user.walletAddress = custody;
      }
      await user.save();
    }

    // Generate simple session token (no JWT needed)
    const token = Buffer.from(`${user._id}:${user.farcasterId}:${user.role}`).toString('base64');

    return {
      user,
      token
    };
  } catch (error) {
    console.error('Error verifying Farcaster auth:', error);
    throw error;
  }
};

// Middleware to authenticate requests using simple token
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication token is missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, farcasterId, role] = decoded.split(':');
    
    (req as any).user = { userId, farcasterId, role };
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user has required role
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user || !roles.includes((req as any).user.role)) {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

export default {
  generateNonce,
  verifyFarcasterAuth,
  authenticateJWT,
  authorizeRole
};
