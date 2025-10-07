import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import HTTP_STATUS from 'http-status-codes';

import { joiValidation } from '@shared/globals/decorators/joi-validation';
import { userService } from '@shared/services/db/user.services';
import { ServerError } from '@shared/globals/helpers/error-handler';
import { signupSchema } from '@features/users/schema/signup.schema';
import { tokenService } from '@shared/services/db/token.services';
import { config } from '@root/config';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response) {
    const { countryCode, phoneNumber, password } = req.body;
    let user = null;

    try {
      user = await userService.getUserByPhone(countryCode, phoneNumber);
      if (user) {
        user.password = password;
        await user.save();
      } else {
        user = await userService.createUser({ countryCode, phoneNumber, password });
      }

      const { accessToken, refreshToken, refreshTokenId } = await this.generateTokens(user._id);
      await this.storeRefreshToken(refreshTokenId, user._id, req.ip, req.headers['user-agent'] || '');

      res.cookie('refresh_token', refreshToken, this.getTokenCookieOptions());
      res.cookie('access_token', accessToken, this.getTokenCookieOptions());

      return res.status(201).json({ code: HTTP_STATUS.CREATED, status: 'success', user: user, message: 'User registered successfully' });
    } catch (error) {
      console.error('Signup error:', error);
      throw new ServerError('Failed to create user');
    }
  }

  public async generateTokens(userId: Types.ObjectId | string) {
    if (!config.JWT_SECRET) {
      throw new ServerError('JWT secrets are not configured');
    }

    const refreshTokenId = new Types.ObjectId();
    const accessToken = jwt.sign({ userId }, config.JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const refreshToken = jwt.sign({ userId, jti: refreshTokenId.toString() }, config.JWT_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRY });

    return { accessToken, refreshToken, refreshTokenId };
  }

  public async storeRefreshToken(tokenId: Types.ObjectId, userId: Types.ObjectId | string, ip: any, userAgent: string) {
    await tokenService.createToken(tokenId, userId, ip, userAgent);
  }

  public getTokenCookieOptions(): any {
    const isSecure = String(config.COOKIE_SECURE).toLowerCase() === 'true';

    return {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? 'strict' : 'lax',
      domain: config.COOKIE_DOMAIN || undefined,
      path: '/api/v1/auth/refresh-token',
      maxAge: REFRESH_TOKEN_COOKIE_EXPIRY
    };
  }
}
