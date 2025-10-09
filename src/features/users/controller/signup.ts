import { Request, Response } from 'express';
import Logger from 'bunyan';
import HTTP_STATUS from 'http-status-codes';

import { joiValidation } from '@shared/globals/decorators/joi-validation';
import { userService } from '@shared/services/db/user.services';
import { CustomError, ServerError } from '@shared/globals/helpers/error-handler';
import { signupSchema } from '@features/users/schema/signup.schema';
import { tokenService } from '@shared/services/db/token.services';
import { config } from '@root/config';
import { generateTokens, getTokenCookieOptions } from '@shared/globals/helpers/token';

const log: Logger = config.createLogger('SignUpController');

export class SignUp {
  @joiValidation(signupSchema)
  public async create(req: Request, res: Response) {
    const { name, countryCode, phoneNumber, password } = req.body;
    let user = null;

    try {
      user = await userService.getUserByPhone(countryCode + phoneNumber);

      if (user) {
        user.password = password;
        user.name = name;
        await user.save();
      } else {
        user = await userService.createUser({ name, countryCode, phoneNumber, password });
      }

      const { accessToken, refreshToken, refreshTokenId } = await generateTokens(user._id);
      await tokenService.createToken(refreshTokenId, user._id, req.ip, req.headers['user-agent'] || '', refreshToken);

      res.cookie('refresh_token', refreshToken, getTokenCookieOptions());
      res.cookie('access_token', accessToken, getTokenCookieOptions());

      return res.status(201).json({ code: HTTP_STATUS.CREATED, status: 'success', user: user, message: 'User registered successfully' });
    } catch (error) {
      log.error('Signup error:', error);
      const code = error instanceof CustomError ? error.code : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'An error occurred while signing in';
      return res.status(code).json({ code, status: 'error', message });
    }
  }
}
