import { describe, it, expect } from 'vitest';
import { normalizeEmail, isValidEmail, isValidPassword } from './validation';

describe('frontend validation helpers', () => {
  it('normalizes email by trimming whitespace and lowercasing', () => {
    expect(normalizeEmail('  User@Example.COM ')).toBe('user@example.com');
  });

  it('returns empty string for invalid email input', () => {
    expect(normalizeEmail(undefined as any)).toBe('');
    expect(normalizeEmail(null as any)).toBe('');
  });

  it('validates a correct email address', () => {
    expect(isValidEmail('hello@domain.test')).toBe(true);
  });

  it('rejects malformed email addresses', () => {
    expect(isValidEmail('hello')).toBe(false);
    expect(isValidEmail('hello@domain')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('accepts strong passwords with at least 8 characters', () => {
    expect(isValidPassword('password123')).toBe(true);
  });

  it('rejects short or invalid passwords', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword(null as any)).toBe(false);
  });
});
