import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthTokenPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set. Set it in server/.env before starting the app.');
}
if (!JWT_REFRESH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('JWT_REFRESH_SECRET is not set. Set it in server/.env in production.');
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}