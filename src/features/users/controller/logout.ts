import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { ServerError } from '@shared/globals/helpers/error-handler';
import { tokenService } from '@shared/services/db/token.services';
import { config } from '@root/config';

export class Logout {
  public async delete(req: Request, res: Response): Promise<void> {
    const { refresh_token } = req.cookies;

    if (refresh_token) {
      try {
        const decoded = jwt.verify(refresh_token, config.JWT_SECRET!) as any;
        if (decoded.jti) {
          await tokenService.updateTokenId(decoded.jti);
          await tokenService.removeTokens(decoded.userId);
        }
      } catch (error) {
        throw new ServerError('Internal server error');
      }
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.status(204).send();
  }
}
