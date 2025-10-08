import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';

import { CustomError, NotAuthorizedError, ServerError } from '@shared/globals/helpers/error-handler';
import { SignUp } from '@features/users/controller/signup';
import { tokenService } from '@shared/services/db/token.services';
import { config } from '@root/config';
import { generateTokens, getTokenCookieOptions } from '@shared/globals/helpers/token';

export class RefreshToken {
  public async update(req: Request, res: Response) {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      throw new NotAuthorizedError('No refresh token provided');
    }

    try {
      const decoded = jwt.verify(refresh_token, config.JWT_SECRET!) as any;
      if (!decoded.jti) {
        throw new NotAuthorizedError('Invalid refresh token');
      }

      const tokenDoc = await tokenService.findByDecoded(decoded);
      if (!tokenDoc) {
        throw new NotAuthorizedError('Invalid refresh token');
      }

      const { accessToken, refreshToken: newRefreshToken, refreshTokenId } = await generateTokens(decoded.userId);

      await tokenService.updateTokenId(tokenDoc._id);
      await tokenService.createToken(refreshTokenId, decoded.userId, req.ip, req.headers['user-agent'] || '', newRefreshToken);

      res.cookie('refresh_token', newRefreshToken, getTokenCookieOptions());
      res.cookie('access_token', accessToken, getTokenCookieOptions());

      return res.status(200).json({ code: HTTP_STATUS.CREATED, status: 'success', data: { accessToken, refreshToken: newRefreshToken } });
    } catch (error) {
      const code = error instanceof CustomError ? error.code : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'An error occurred while signing in';
      return res.status(code).json({ code, status: 'error', message });
    }
  }
}
