import crypto from 'crypto';

const REFRESH_TOKEN_BYTES = 48;

export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function getRefreshTokenExpiry(days = 30): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}