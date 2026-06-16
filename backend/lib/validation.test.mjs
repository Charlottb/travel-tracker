import { describe, it, expect } from 'vitest';
import { normalizeEmail, isValidEmail, isValidPassword } from './validation.js';

describe('backend validation helpers', () => {
  it('normalizes email by trimming whitespace and lowercasing', () => {
    expect(normalizeEmail('  Test@Example.COM ')).toBe('test@example.com');
  });

  it('returns empty string for invalid email input', () => {
    expect(normalizeEmail(null)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });

  it('validates a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('rejects invalid email strings', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
    expect(isValidEmail('user@com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('accepts passwords with at least 8 characters', () => {
    expect(isValidPassword('strongpwd')).toBe(true);
  });

  it('rejects too short or invalid passwords', () => {
    expect(isValidPassword('short')).toBe(false);
    expect(isValidPassword(null)).toBe(false);
  });
});
