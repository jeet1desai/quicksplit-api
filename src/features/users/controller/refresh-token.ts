import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';

import { NotAuthorizedError, ServerError } from '@shared/globals/helpers/error-handler';
import { SignUp } from '@features/users/controller/signup';
import { tokenService } from '@shared/services/db/token.services';
import { config } from '@root/config';

export class RefreshToken {
  public async update(req: Request, res: Response) {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new NotAuthorizedError('No refresh token provided');
    }

    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET!) as any;
      if (!decoded.jti) {
        throw new NotAuthorizedError('Invalid refresh token');
      }

      const tokenDoc = await tokenService.findByUserId(decoded);
      if (!tokenDoc) {
        throw new NotAuthorizedError('Invalid refresh token');
      }

      const { accessToken, refreshToken: newRefreshToken, refreshTokenId } = await SignUp.prototype.generateTokens(decoded.userId);

      await tokenService.updateTokenId(tokenDoc._id);
      await SignUp.prototype.storeRefreshToken(refreshTokenId, decoded.userId, req.ip, req.headers['user-agent'] || '');

      res.cookie('refresh_token', newRefreshToken, SignUp.prototype.getTokenCookieOptions());
      res.cookie('access_token', accessToken, SignUp.prototype.getTokenCookieOptions());

      return res.status(200).json({ code: HTTP_STATUS.CREATED, status: 'success', data: { accessToken, refreshToken: newRefreshToken } });
    } catch (error) {
      throw new ServerError('Internal server error');
    }
  }
}
