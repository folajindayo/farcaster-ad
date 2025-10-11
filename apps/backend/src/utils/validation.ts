/**
 * Input Validation Utilities
 * Provides type-safe validation with proper error messages
 * Can be extended to use Zod or Joi for more complex validation
 */

import { VALIDATION, CAMPAIGN, HOST, FILE_UPLOAD } from '../config/constants';
import { ValidationError } from './errors';

/**
 * Validation result type
 */
export interface ValidationResult<T = any> {
  isValid: boolean;
  value?: T;
  errors?: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string, fieldName: string = 'address'): string {
  if (!address || typeof address !== 'string') {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (!VALIDATION.ADDRESS_REGEX.test(address)) {
    throw new ValidationError(`${fieldName} must be a valid Ethereum address`);
  }

  return address.toLowerCase();
}

/**
 * Validate positive number
 */
export function validatePositiveNumber(
  value: any,
  fieldName: string,
  min?: number,
  max?: number
): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }

  if (num <= 0) {
    throw new ValidationError(`${fieldName} must be positive`);
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }

  return num;
}

/**
 * Validate integer
 */
export function validateInteger(
  value: any,
  fieldName: string,
  min?: number,
  max?: number
): number {
  const num = parseInt(String(value), 10);

  if (isNaN(num) || !Number.isInteger(num)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }

  return num;
}

/**
 * Validate string length
 */
export function validateString(
  value: any,
  fieldName: string,
  minLength?: number,
  maxLength?: number,
  required: boolean = true
): string {
  if (required && (!value || typeof value !== 'string')) {
    throw new ValidationError(`${fieldName} is required`);
  }

  if (!value && !required) {
    return '';
  }

  const str = String(value).trim();

  if (required && str.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }

  if (minLength !== undefined && str.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
  }

  if (maxLength !== undefined && str.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`);
  }

  // Basic XSS prevention
  if (/<script|javascript:|onerror=/i.test(str)) {
    throw new ValidationError(`${fieldName} contains invalid characters`);
  }

  return str;
}

/**
 * Validate email
 */
export function validateEmail(email: string, fieldName: string = 'email'): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const str = validateString(email, fieldName);

  if (!emailRegex.test(str)) {
    throw new ValidationError(`${fieldName} must be a valid email address`);
  }

  return str.toLowerCase();
}

/**
 * Validate URL
 */
export function validateUrl(url: string, fieldName: string = 'url', required: boolean = true): string {
  const str = validateString(url, fieldName, undefined, undefined, required);
  
  if (!str && !required) {
    return '';
  }

  try {
    const parsed = new URL(str);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
    return str;
  } catch {
    throw new ValidationError(`${fieldName} must be a valid URL`);
  }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: any,
  fieldName: string,
  allowedValues: readonly T[]
): T {
  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return value as T;
}

/**
 * Validate array
 */
export function validateArray<T>(
  value: any,
  fieldName: string,
  itemValidator?: (item: any, index: number) => T,
  minLength?: number,
  maxLength?: number
): T[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`);
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(`${fieldName} must have at least ${minLength} items`);
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(`${fieldName} must have at most ${maxLength} items`);
  }

  if (itemValidator) {
    return value.map((item, index) => itemValidator(item, index));
  }

  return value as T[];
}

/**
 * Validate date
 */
export function validateDate(
  value: any,
  fieldName: string,
  minDate?: Date,
  maxDate?: Date
): Date {
  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }

  if (minDate && date < minDate) {
    throw new ValidationError(`${fieldName} must be after ${minDate.toISOString()}`);
  }

  if (maxDate && date > maxDate) {
    throw new ValidationError(`${fieldName} must be before ${maxDate.toISOString()}`);
  }

  return date;
}

/**
 * Validate boolean
 */
export function validateBoolean(value: any, fieldName: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (value === 'true' || value === '1' || value === 1) {
    return true;
  }

  if (value === 'false' || value === '0' || value === 0) {
    return false;
  }

  throw new ValidationError(`${fieldName} must be a boolean`);
}

/**
 * Campaign-specific validators
 */
export const CampaignValidator = {
  budget(value: any): number {
    return validatePositiveNumber(
      value,
      'budget',
      CAMPAIGN.MIN_BUDGET,
      CAMPAIGN.MAX_BUDGET
    );
  },

  cpm(value: any): number {
    return validatePositiveNumber(
      value,
      'CPM',
      CAMPAIGN.MIN_CPM,
      CAMPAIGN.MAX_CPM
    );
  },

  duration(value: any): number {
    return validateInteger(
      value,
      'duration',
      CAMPAIGN.MIN_DURATION_DAYS,
      CAMPAIGN.MAX_DURATION_DAYS
    );
  },

  title(value: any): string {
    return validateString(
      value,
      'title',
      VALIDATION.CAMPAIGN_TITLE_MIN_LENGTH,
      VALIDATION.CAMPAIGN_TITLE_MAX_LENGTH
    );
  },

  description(value: any): string {
    return validateString(
      value,
      'description',
      undefined,
      VALIDATION.CAMPAIGN_DESC_MAX_LENGTH,
      false
    );
  },
};

/**
 * Host-specific validators
 */
export const HostValidator = {
  username(value: any): string {
    return validateString(
      value,
      'username',
      VALIDATION.USERNAME_MIN_LENGTH,
      VALIDATION.USERNAME_MAX_LENGTH
    );
  },

  followerCount(value: any): number {
    return validateInteger(value, 'followerCount', 0);
  },

  fid(value: any): number {
    return validateInteger(value, 'fid', 1);
  },

  minCPM(value: any): number {
    return validatePositiveNumber(value, 'minCPM', 0.01, CAMPAIGN.MAX_CPM);
  },

  reputationScore(value: any): number {
    return validateInteger(
      value,
      'reputationScore',
      HOST.MIN_REPUTATION_SCORE,
      HOST.MAX_REPUTATION_SCORE
    );
  },
};

/**
 * File upload validators
 */
export const FileValidator = {
  size(size: number): void {
    if (size > FILE_UPLOAD.MAX_SIZE_BYTES) {
      throw new ValidationError(
        `File size must be less than ${FILE_UPLOAD.MAX_SIZE_BYTES / 1024 / 1024}MB`
      );
    }
  },

  mimeType(mimeType: string): void {
    if (!FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new ValidationError(
        `File type must be one of: ${FILE_UPLOAD.ALLOWED_IMAGE_TYPES.join(', ')}`
      );
    }
  },

  extension(filename: string): void {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    if (!FILE_UPLOAD.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ValidationError(
        `File extension must be one of: ${FILE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`
      );
    }
  },
};

/**
 * Pagination validators
 */
export const PaginationValidator = {
  page(value: any): number {
    return validateInteger(value, 'page', 1);
  },

  limit(value: any, max: number = 100): number {
    return validateInteger(value, 'limit', 1, max);
  },
};

/**
 * Batch validation helper
 */
export function validateObject<T extends Record<string, any>>(
  data: any,
  schema: {
    [K in keyof T]: (value: any) => T[K];
  }
): T {
  const errors: ValidationErrorDetail[] = [];
  const result: Partial<T> = {};

  for (const [key, validator] of Object.entries(schema)) {
    try {
      result[key as keyof T] = validator(data[key]);
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push({
          field: key,
          message: error.message,
          value: data[key],
        });
      } else {
        throw error;
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  return result as T;
}

/**
 * Optional field wrapper
 */
export function optional<T>(validator: (value: any) => T): (value: any) => T | undefined {
  return (value: any) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    return validator(value);
  };
}

/**
 * Sanitize input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validate and sanitize object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item) :
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}



