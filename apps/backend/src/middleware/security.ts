/**
 * Security Middleware
 * Provides rate limiting, input sanitization, and security headers
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiter } from '../utils/cache';
import { RateLimitError, ValidationError } from '../utils/errors';
import { sanitizeObject } from '../utils/validation';
import { logger } from '../utils/logger';
import { RATE_LIMIT } from '../config/constants';

/**
 * Global rate limiter
 */
const globalRateLimiter = new RateLimiter(
  RATE_LIMIT.WINDOW_MS,
  RATE_LIMIT.MAX_REQUESTS
);

/**
 * Rate limiting middleware
 */
export function rateLimit(options?: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) {
  const limiter = options
    ? new RateLimiter(
        options.windowMs || RATE_LIMIT.WINDOW_MS,
        options.maxRequests || RATE_LIMIT.MAX_REQUESTS
      )
    : globalRateLimiter;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options?.keyGenerator
      ? options.keyGenerator(req)
      : req.ip || req.socket.remoteAddress || 'unknown';

    const allowed = limiter.isAllowed(key);

    if (!allowed) {
      const remaining = limiter.getRemaining(key);
      
      logger.warn('Rate limit exceeded', {
        ip: key,
        path: req.path,
        method: req.method,
      });

      res.setHeader('X-RateLimit-Limit', options?.maxRequests || RATE_LIMIT.MAX_REQUESTS);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Date.now() + (options?.windowMs || RATE_LIMIT.WINDOW_MS));

      throw new RateLimitError();
    }

    // Set rate limit headers
    const remaining = limiter.getRemaining(key);
    res.setHeader('X-RateLimit-Limit', options?.maxRequests || RATE_LIMIT.MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', remaining);

    next();
  };
}

/**
 * Rate limiter for specific routes
 */
export const rateLimiters = {
  // Strict limits for file uploads
  fileUpload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: RATE_LIMIT.MAX_FILE_UPLOADS_PER_HOUR,
    keyGenerator: (req) => `upload:${req.ip || 'unknown'}`,
  }),

  // Strict limits for campaign creation
  campaignCreate: rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: RATE_LIMIT.MAX_CAMPAIGN_CREATES_PER_DAY,
    keyGenerator: (req) => `campaign:${req.user?.id || req.ip || 'unknown'}`,
  }),

  // Authentication attempts
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (req) => `auth:${req.ip || 'unknown'}`,
  }),

  // API endpoints
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),
};

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from inputs
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as any);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  // Remove powered-by header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * CORS configuration
 */
export function corsConfig(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}

/**
 * Request validation middleware
 */
export function validateContentType(allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType) {
        throw new ValidationError('Content-Type header is required');
      }

      const isAllowed = allowedTypes.some((type) => contentType.includes(type));

      if (!isAllowed) {
        throw new ValidationError(
          `Content-Type must be one of: ${allowedTypes.join(', ')}`
        );
      }
    }

    next();
  };
}

/**
 * Request size limiter
 */
export function limitRequestSize(maxSizeBytes: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSizeBytes) {
        req.pause();
        throw new ValidationError(
          `Request size exceeds ${maxSizeBytes / 1024 / 1024}MB limit`
        );
      }
    });

    next();
  };
}

/**
 * SQL injection prevention (for query strings)
 */
export function preventSqlInjection(req: Request, res: Response, next: NextFunction) {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  ];

  const checkForSql = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return sqlPatterns.some((pattern) => pattern.test(obj));
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(checkForSql);
    }

    return false;
  };

  if (checkForSql(req.query) || checkForSql(req.body) || checkForSql(req.params)) {
    logger.warn('SQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    throw new ValidationError('Invalid input detected');
  }

  next();
}

/**
 * NoSQL injection prevention
 */
export function preventNoSqlInjection(req: Request, res: Response, next: NextFunction) {
  const checkForNoSql = (obj: any, depth: number = 0): boolean => {
    if (depth > 5) return false; // Prevent deep recursion

    if (typeof obj === 'object' && obj !== null) {
      // Check for dangerous operators
      const dangerousOps = ['$where', '$regex', '$ne', '$gt', '$lt'];
      if (dangerousOps.some((op) => op in obj)) {
        return true;
      }

      // Recursively check nested objects
      return Object.values(obj).some((val) => checkForNoSql(val, depth + 1));
    }

    return false;
  };

  if (checkForNoSql(req.query) || checkForNoSql(req.body) || checkForNoSql(req.params)) {
    logger.warn('NoSQL injection attempt detected', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    throw new ValidationError('Invalid input detected');
  }

  next();
}

/**
 * API Key validation middleware
 */
export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new ValidationError('API key is required');
  }

  // In production, validate against database
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      path: req.path,
    });

    throw new ValidationError('Invalid API key');
  }

  next();
}

/**
 * Request timeout middleware
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          path: req.path,
          method: req.method,
          timeout: timeoutMs,
        });

        res.status(408).json({
          success: false,
          error: {
            message: 'Request timeout',
            code: 'REQUEST_TIMEOUT',
          },
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * Combined security middleware
 */
export function applySecurity(app: any) {
  // Apply in order
  app.use(securityHeaders);
  app.use(corsConfig);
  app.use(sanitizeInput);
  app.use(preventSqlInjection);
  app.use(preventNoSqlInjection);
  app.use(requestTimeout());
  app.use(rateLimit());

  logger.info('Security middleware applied');
}

/**
 * Health check bypass (skip security for health endpoints)
 */
export function skipSecurityForHealth(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health' || req.path === '/healthz') {
    return next('route'); // Skip to next route
  }
  next();
}



