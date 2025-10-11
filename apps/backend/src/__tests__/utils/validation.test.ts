/**
 * Validation Utilities Tests
 * Unit tests for validation functions
 */

import {
  validateAddress,
  validatePositiveNumber,
  validateInteger,
  validateString,
  validateEmail,
  validateUrl,
  validateEnum,
  validateArray,
  validateDate,
  validateBoolean,
  validateObject,
  optional,
  sanitizeInput,
  CampaignValidator,
  HostValidator,
} from '../../utils/validation';
import { ValidationError } from '../../utils/errors';

describe('Validation Utils', () => {
  describe('validateAddress', () => {
    it('should validate correct Ethereum address', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(() => validateAddress(address)).not.toThrow();
    });

    it('should lowercase the address', () => {
      const address = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB';
      const result = validateAddress(address);
      expect(result).toBe(address.toLowerCase());
    });

    it('should throw error for invalid address', () => {
      expect(() => validateAddress('invalid')).toThrow(ValidationError);
      expect(() => validateAddress('0x123')).toThrow(ValidationError);
      expect(() => validateAddress('')).toThrow(ValidationError);
    });
  });

  describe('validatePositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(validatePositiveNumber(10, 'test')).toBe(10);
      expect(validatePositiveNumber('5.5', 'test')).toBe(5.5);
    });

    it('should validate with min/max bounds', () => {
      expect(validatePositiveNumber(50, 'test', 10, 100)).toBe(50);
    });

    it('should throw error for non-positive numbers', () => {
      expect(() => validatePositiveNumber(0, 'test')).toThrow(ValidationError);
      expect(() => validatePositiveNumber(-5, 'test')).toThrow(ValidationError);
    });

    it('should throw error for out of bounds', () => {
      expect(() => validatePositiveNumber(5, 'test', 10, 100)).toThrow(ValidationError);
      expect(() => validatePositiveNumber(150, 'test', 10, 100)).toThrow(ValidationError);
    });

    it('should throw error for invalid input', () => {
      expect(() => validatePositiveNumber('abc', 'test')).toThrow(ValidationError);
    });
  });

  describe('validateInteger', () => {
    it('should validate integers', () => {
      expect(validateInteger(10, 'test')).toBe(10);
      expect(validateInteger('5', 'test')).toBe(5);
    });

    it('should throw error for non-integers', () => {
      expect(() => validateInteger(5.5, 'test')).toThrow(ValidationError);
      expect(() => validateInteger('abc', 'test')).toThrow(ValidationError);
    });
  });

  describe('validateString', () => {
    it('should validate strings', () => {
      expect(validateString('hello', 'test')).toBe('hello');
      expect(validateString('  hello  ', 'test')).toBe('hello');
    });

    it('should validate length constraints', () => {
      expect(validateString('hello', 'test', 3, 10)).toBe('hello');
    });

    it('should throw error for empty required string', () => {
      expect(() => validateString('', 'test')).toThrow(ValidationError);
      expect(() => validateString('  ', 'test')).toThrow(ValidationError);
    });

    it('should allow empty optional string', () => {
      expect(validateString('', 'test', undefined, undefined, false)).toBe('');
    });

    it('should throw error for length violations', () => {
      expect(() => validateString('hi', 'test', 5)).toThrow(ValidationError);
      expect(() => validateString('very long string', 'test', undefined, 5)).toThrow(ValidationError);
    });

    it('should detect XSS attempts', () => {
      expect(() => validateString('<script>alert("xss")</script>', 'test')).toThrow(ValidationError);
      expect(() => validateString('javascript:alert(1)', 'test')).toThrow(ValidationError);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com', 'email')).toBe('test@example.com');
      expect(validateEmail('user.name+tag@domain.co.uk', 'email')).toBe('user.name+tag@domain.co.uk');
    });

    it('should lowercase emails', () => {
      expect(validateEmail('Test@Example.COM', 'email')).toBe('test@example.com');
    });

    it('should throw error for invalid emails', () => {
      expect(() => validateEmail('notanemail', 'email')).toThrow(ValidationError);
      expect(() => validateEmail('@example.com', 'email')).toThrow(ValidationError);
      expect(() => validateEmail('test@', 'email')).toThrow(ValidationError);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com', 'url')).toBe('https://example.com');
      expect(validateUrl('http://localhost:3000', 'url')).toBe('http://localhost:3000');
    });

    it('should throw error for invalid URLs', () => {
      expect(() => validateUrl('notaurl', 'url')).toThrow(ValidationError);
      expect(() => validateUrl('ftp://example.com', 'url')).toThrow(ValidationError);
    });

    it('should allow empty optional URL', () => {
      expect(validateUrl('', 'url', false)).toBe('');
    });
  });

  describe('validateEnum', () => {
    const allowedValues = ['active', 'inactive', 'pending'] as const;

    it('should validate enum values', () => {
      expect(validateEnum('active', 'status', allowedValues)).toBe('active');
    });

    it('should throw error for invalid enum value', () => {
      expect(() => validateEnum('invalid', 'status', allowedValues)).toThrow(ValidationError);
    });
  });

  describe('validateArray', () => {
    it('should validate arrays', () => {
      const result = validateArray([1, 2, 3], 'test');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should validate with length constraints', () => {
      expect(validateArray([1, 2, 3], 'test', undefined, 2, 5)).toEqual([1, 2, 3]);
    });

    it('should throw error for non-arrays', () => {
      expect(() => validateArray('not an array', 'test')).toThrow(ValidationError);
    });

    it('should throw error for length violations', () => {
      expect(() => validateArray([1], 'test', undefined, 2)).toThrow(ValidationError);
      expect(() => validateArray([1, 2, 3, 4], 'test', undefined, undefined, 3)).toThrow(ValidationError);
    });

    it('should validate array items', () => {
      const validator = (item: any) => {
        if (typeof item !== 'number') throw new Error('Must be number');
        return item * 2;
      };

      expect(validateArray([1, 2, 3], 'test', validator)).toEqual([2, 4, 6]);
    });
  });

  describe('validateDate', () => {
    it('should validate dates', () => {
      const date = new Date('2025-01-01');
      expect(validateDate(date, 'test')).toEqual(date);
      expect(validateDate('2025-01-01', 'test')).toEqual(date);
    });

    it('should validate with date bounds', () => {
      const date = new Date('2025-06-01');
      const minDate = new Date('2025-01-01');
      const maxDate = new Date('2025-12-31');

      expect(validateDate(date, 'test', minDate, maxDate)).toEqual(date);
    });

    it('should throw error for invalid dates', () => {
      expect(() => validateDate('invalid', 'test')).toThrow(ValidationError);
    });

    it('should throw error for out of bounds dates', () => {
      const date = new Date('2025-01-01');
      const minDate = new Date('2025-06-01');

      expect(() => validateDate(date, 'test', minDate)).toThrow(ValidationError);
    });
  });

  describe('validateBoolean', () => {
    it('should validate booleans', () => {
      expect(validateBoolean(true, 'test')).toBe(true);
      expect(validateBoolean(false, 'test')).toBe(false);
    });

    it('should convert truthy values', () => {
      expect(validateBoolean('true', 'test')).toBe(true);
      expect(validateBoolean('1', 'test')).toBe(true);
      expect(validateBoolean(1, 'test')).toBe(true);
    });

    it('should convert falsy values', () => {
      expect(validateBoolean('false', 'test')).toBe(false);
      expect(validateBoolean('0', 'test')).toBe(false);
      expect(validateBoolean(0, 'test')).toBe(false);
    });

    it('should throw error for invalid booleans', () => {
      expect(() => validateBoolean('invalid', 'test')).toThrow(ValidationError);
    });
  });

  describe('validateObject', () => {
    it('should validate object with schema', () => {
      const schema = {
        name: (val: any) => validateString(val, 'name'),
        age: (val: any) => validateInteger(val, 'age'),
      };

      const result = validateObject({ name: 'John', age: 30 }, schema);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should collect all validation errors', () => {
      const schema = {
        name: (val: any) => validateString(val, 'name', 5),
        age: (val: any) => validateInteger(val, 'age', 0, 120),
      };

      expect(() =>
        validateObject({ name: 'Jo', age: 150 }, schema)
      ).toThrow(ValidationError);
    });
  });

  describe('optional', () => {
    it('should return undefined for empty values', () => {
      const validator = optional((val: any) => validateString(val, 'test'));

      expect(validator(null)).toBeUndefined();
      expect(validator(undefined)).toBeUndefined();
      expect(validator('')).toBeUndefined();
    });

    it('should validate non-empty values', () => {
      const validator = optional((val: any) => validateString(val, 'test'));

      expect(validator('hello')).toBe('hello');
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeInput('onclick=alert(1)')).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });
  });

  describe('CampaignValidator', () => {
    it('should validate campaign budget', () => {
      expect(CampaignValidator.budget(100)).toBe(100);
      expect(() => CampaignValidator.budget(5)).toThrow(ValidationError);
      expect(() => CampaignValidator.budget(2000000)).toThrow(ValidationError);
    });

    it('should validate campaign CPM', () => {
      expect(CampaignValidator.cpm(5)).toBe(5);
      expect(() => CampaignValidator.cpm(0.05)).toThrow(ValidationError);
      expect(() => CampaignValidator.cpm(200)).toThrow(ValidationError);
    });

    it('should validate campaign duration', () => {
      expect(CampaignValidator.duration(30)).toBe(30);
      expect(() => CampaignValidator.duration(0)).toThrow(ValidationError);
      expect(() => CampaignValidator.duration(400)).toThrow(ValidationError);
    });

    it('should validate campaign title', () => {
      expect(CampaignValidator.title('My Campaign')).toBe('My Campaign');
      expect(() => CampaignValidator.title('A')).toThrow(ValidationError);
    });
  });

  describe('HostValidator', () => {
    it('should validate username', () => {
      expect(HostValidator.username('john_doe')).toBe('john_doe');
      expect(() => HostValidator.username('ab')).toThrow(ValidationError);
    });

    it('should validate fid', () => {
      expect(HostValidator.fid(12345)).toBe(12345);
      expect(() => HostValidator.fid(0)).toThrow(ValidationError);
      expect(() => HostValidator.fid(-1)).toThrow(ValidationError);
    });

    it('should validate follower count', () => {
      expect(HostValidator.followerCount(1000)).toBe(1000);
      expect(HostValidator.followerCount(0)).toBe(0);
      expect(() => HostValidator.followerCount(-1)).toThrow(ValidationError);
    });
  });
});



