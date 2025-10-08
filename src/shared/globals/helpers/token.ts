import { config } from '@root/config';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { ServerError } from './error-handler';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export async function generateTokens(userId: Types.ObjectId | string) {
  if (!config.JWT_SECRET) {
    throw new ServerError('JWT secrets are not configured');
  }

  const refreshTokenId = new Types.ObjectId();
  const accessToken = jwt.sign({ userId }, config.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId, jti: refreshTokenId.toString() }, config.JWT_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken, refreshTokenId };
}

export function getTokenCookieOptions(): any {
  const isSecure = String(config.COOKIE_SECURE).toLowerCase() === 'true';

  return {
    httpOnly: true,
    secure: true,
    sameSite: isSecure ? 'strict' : 'lax',
    domain: config.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: REFRESH_TOKEN_COOKIE_EXPIRY
  };
}
