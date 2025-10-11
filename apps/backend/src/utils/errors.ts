/**
 * Custom Error Classes
 * Provides structured error handling throughout the application
 * Follows best practices from distributed systems design
 */

import { HTTP_STATUS, ERROR_CODES, type ErrorCode } from '../config/constants';

/**
 * Base Application Error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: ErrorCode = ERROR_CODES.SYSTEM_INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Validation Error - 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_INVALID_INPUT,
      true,
      details
    );
  }
}

/**
 * Authentication Error - 401 Unauthorized
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: ErrorCode = ERROR_CODES.AUTH_INVALID_TOKEN) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code, true);
  }
}

/**
 * Authorization Error - 403 Forbidden
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
      true
    );
  }
}

/**
 * Not Found Error - 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RESOURCE_NOT_FOUND, true);
  }
}

/**
 * Conflict Error - 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(
      message,
      HTTP_STATUS.CONFLICT,
      ERROR_CODES.RESOURCE_CONFLICT,
      true,
      details
    );
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(
      message,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.FRAUD_RATE_LIMIT_EXCEEDED,
      true
    );
  }
}

/**
 * Database Error - 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', originalError?: Error) {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.SYSTEM_DATABASE_ERROR,
      true,
      originalError ? { originalError: originalError.message } : undefined
    );
  }
}

/**
 * Blockchain Error - 500 Internal Server Error
 */
export class BlockchainError extends AppError {
  constructor(message: string = 'Blockchain operation failed', details?: any) {
    super(
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.SYSTEM_BLOCKCHAIN_ERROR,
      true,
      details
    );
  }
}

/**
 * External Service Error - 503 Service Unavailable
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service '${service}' is unavailable`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      ERROR_CODES.SYSTEM_EXTERNAL_SERVICE_ERROR,
      true,
      { service }
    );
  }
}

/**
 * Campaign Error
 */
export class CampaignError extends AppError {
  constructor(message: string, code: ErrorCode, statusCode: number = HTTP_STATUS.BAD_REQUEST) {
    super(message, statusCode, code, true);
  }
}

/**
 * Host Error
 */
export class HostError extends AppError {
  constructor(message: string, code: ErrorCode, statusCode: number = HTTP_STATUS.BAD_REQUEST) {
    super(message, statusCode, code, true);
  }
}

/**
 * Payout Error
 */
export class PayoutError extends AppError {
  constructor(message: string, code: ErrorCode, statusCode: number = HTTP_STATUS.BAD_REQUEST) {
    super(message, statusCode, code, true);
  }
}

/**
 * Fraud Error
 */
export class FraudError extends AppError {
  constructor(message: string = 'Suspicious activity detected') {
    super(
      message,
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.FRAUD_SUSPICIOUS_ACTIVITY,
      true
    );
  }
}

/**
 * Error Handler Utility
 */
export function handleError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // MongoDB/Mongoose errors
  if (error && typeof error === 'object' && 'name' in error) {
    const err = error as any;
    
    if (err.name === 'ValidationError') {
      return new ValidationError('Database validation failed', err.errors);
    }
    
    if (err.name === 'CastError') {
      return new ValidationError('Invalid data format', { field: err.path, value: err.value });
    }
    
    if (err.code === 11000) { // Duplicate key error
      return new ConflictError('Resource already exists', err.keyValue);
    }

    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      return new DatabaseError('Database operation failed', err);
    }
  }

  // Standard Error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.SYSTEM_INTERNAL_ERROR,
      false
    );
  }

  // Unknown error
  return new AppError(
    'An unknown error occurred',
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.SYSTEM_INTERNAL_ERROR,
    false
  );
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error Response Formatter
 */
export function formatErrorResponse(error: AppError) {
  const response: any = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
    },
  };

  // Include details in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    if (error.details) {
      response.error.details = error.details;
    }
  }

  return response;
}

/**
 * Express Error Middleware
 */
export function errorMiddleware(err: any, req: any, res: any, next: any) {
  const error = handleError(err);
  
  // Log error (should use proper logger)
  console.error(`[${error.timestamp.toISOString()}] ${error.name}:`, {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ...(error.details && { details: error.details }),
    stack: error.stack,
  });

  res.status(error.statusCode).json(formatErrorResponse(error));
}

/**
 * Validation Helper
 */
export function assert(condition: boolean, message: string, code?: ErrorCode): asserts condition {
  if (!condition) {
    throw new ValidationError(message, code);
  }
}

/**
 * Not Found Helper
 */
export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
  id?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, id);
  }
}



