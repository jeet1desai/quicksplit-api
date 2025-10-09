import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { CustomError, NotFoundError } from '@shared/globals/helpers/error-handler';
import { userService } from '@shared/services/db/user.services';
import { inviteService } from '@shared/services/db/invite.services';
import { generateReadableCode } from '@shared/globals/helpers/verification-code';

const INVITE_TTL_MINUTES = 60 * 24; // 24 hours

export class IssueInvite {
  public async create(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new NotFoundError('User not authenticated');
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const invite = await inviteService.getInviteByUser(userId);
      if (invite) {
        return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', invite: invite, message: 'Invite already exists' });
      }

      const code = generateReadableCode();
      const newInvite = await inviteService.createInvite({ user: user._id, inviteCode: code });
      return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', invite: newInvite, message: 'Invite created successfully' });
    } catch (error) {
      const code = error instanceof CustomError ? error.code : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'An error occurred while signing in';
      return res.status(code).json({ code, status: 'error', message });
    }
  }

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

      const invite = await inviteService.getInviteByUser(userId);
      if (!invite) {
        throw new NotFoundError('Invite not found');
      }

      return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', invite: invite, message: 'Invite retrieved successfully' });
    } catch (error) {
      const code = error instanceof CustomError ? error.code : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'An error occurred while signing in';
      return res.status(code).json({ code, status: 'error', message });
    }
  }
}
