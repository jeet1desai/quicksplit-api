import { Request, Response } from 'express';
import crypto from 'crypto';
import HTTP_STATUS from 'http-status-codes';

import { CustomError, NotFoundError, ServerError } from '@shared/globals/helpers/error-handler';
import { userService } from '@shared/services/db/user.services';
import { inviteService } from '@shared/services/db/invite.services';

const INVITE_CODE_LENGTH = 7; // like N7V2Y2E
const INVITE_TTL_MINUTES = 60 * 24; // 24 hours

export class IssueInvite {
  public async create(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const invite = await inviteService.getInviteByUser(userId);
      if (invite) {
        return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', invite: invite, message: 'Invite already exists' });
      }

      const code = this.generateReadableCode();
      const expiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60 * 1000);

      await inviteService.createInvite({ user: user._id, inviteCode: code, expiresAt });

      return res.status(HTTP_STATUS.OK).json({ code: HTTP_STATUS.OK, status: 'success', invite: invite, message: 'Invite created successfully' });
    } catch (error) {
      const code = error instanceof CustomError ? error.code : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'An error occurred while signing in';
      return res.status(code).json({ code, status: 'error', message });
    }
  }

  private generateReadableCode(length = INVITE_CODE_LENGTH) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijklmnopqrstuvwxyz'; // no O/0, I/1
    let code = '';
    for (let i = 0; i < length; i++) {
      const idx = crypto.randomInt(0, alphabet.length);
      code += alphabet[idx];
    }
    return code;
  }
}
