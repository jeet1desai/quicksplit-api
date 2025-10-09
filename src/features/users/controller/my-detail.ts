import { NotFoundError, CustomError } from '@shared/globals/helpers/error-handler';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { userService } from '@shared/services/db/user.services';

export class MyDetail {
  public async read(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { password, ...userWithoutPassword } = user;

      return res.status(HTTP_STATUS.OK).json({
        code: HTTP_STATUS.OK,
        status: 'success',
        user: userWithoutPassword,
        message: 'User details retrieved successfully'
      });
    } catch (error) {
      const code = error instanceof CustomError ? error.code : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'An error occurred while signing in';
      return res.status(code).json({ code, status: 'error', message });
    }
  }
}
