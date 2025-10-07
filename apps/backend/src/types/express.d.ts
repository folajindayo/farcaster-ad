import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        farcasterId: string;
        role: string;
        hostId?: string;
      };
    }
  }
}

// Re-export for compatibility
export {};
