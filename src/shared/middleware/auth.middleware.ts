import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { NotAuthorizedError } from '@shared/globals/helpers/error-handler';
import { config } from '@root/config';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw new NotAuthorizedError('No token provided');
    }

    const decoded = jwt.verify(refreshToken, config.JWT_SECRET!) as { userId: string };
    if (!decoded.userId) {
      throw new NotAuthorizedError('Invalid token');
    }

    req.user = { userId: decoded.userId };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new NotAuthorizedError('Token has expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new NotAuthorizedError('Invalid token'));
    }
    next(error);
  }
};
