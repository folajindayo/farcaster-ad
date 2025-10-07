import { farcasterClient, validateFarcasterSignature } from '../config/farcaster';
import { User } from '../models';
import { Request, Response, NextFunction } from 'express';

// Generate a nonce for Farcaster authentication
export const generateNonce = () => {
  return Math.floor(Math.random() * 1000000).toString();
};

// Verify Farcaster authentication and create or update user
export const verifyFarcasterAuth = async (message: string, signature: string, fid: number) => {
  try {
    // Validate the signature
    const isValid = await validateFarcasterSignature(message, signature, fid);
    
    if (!isValid) {
      throw new Error('Invalid Farcaster signature');
    }

    // For now, create a mock user profile - implement proper Farcaster user lookup
    const userProfile = {
      username: `user_${fid}`,
      displayName: `User ${fid}`,
      pfp: '',
      verifications: []
    };

    // Find or create user in our database
    let user = await User.findOne({ farcasterId: fid.toString() });
    
    if (!user) {
      // Create new user
      user = await User.create({
        farcasterId: fid.toString(),
        walletAddress: userProfile.verifications?.[0] || '',
        username: userProfile.username || `user_${fid}`,
        displayName: userProfile.displayName || `User ${fid}`,
        pfpUrl: userProfile.pfp || '',
        role: 'host', // Default role is host
        isOptedIn: false, // Not opted in by default
      });
    } else {
      // Update existing user
      user.username = userProfile.username || user.username;
      user.displayName = userProfile.displayName || user.displayName;
      user.pfpUrl = userProfile.pfp || user.pfpUrl;
      if (userProfile.verifications?.[0] && !user.walletAddress) {
        user.walletAddress = userProfile.verifications[0];
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
