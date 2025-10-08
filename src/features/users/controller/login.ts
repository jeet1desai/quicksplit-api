import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { joiValidation } from '@shared/globals/decorators/joi-validation';
import { userService } from '@shared/services/db/user.services';
import { NotFoundError, ServerError } from '@shared/globals/helpers/error-handler';
import { SignUp } from '@features/users/controller/signup';
import { signinSchema } from '@features/users/schema/signin.schema';
import { generateTokens, getTokenCookieOptions } from '@shared/globals/helpers/token';
import { tokenService } from '@shared/services/db/token.services';

export class Login {
  @joiValidation(signinSchema)
  public async read(req: Request, res: Response) {
    const { countryCode, phoneNumber, password } = req.body;

    try {
      const user = await userService.getUserByPhone(countryCode, phoneNumber);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new NotFoundError('Invalid credentials');
      }

      const { accessToken, refreshToken, refreshTokenId } = await generateTokens(user._id);
      await tokenService.createToken(refreshTokenId, user._id, req.ip, req.headers['user-agent'] || '', refreshToken);

      res.cookie('refresh_token', refreshToken, getTokenCookieOptions());
      res.cookie('access_token', accessToken, getTokenCookieOptions());

      return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', user: user, message: 'User registered successfully' });
    } catch (error) {
      console.error('Login error:', error);
      throw new ServerError('Failed to login');
    }
  }
}
