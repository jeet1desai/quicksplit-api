import { InviteModel } from '@features/onboard/model/invite.model';
import { userService } from './user.services';

class InviteServices {
  public async createInvite(data: any): Promise<any> {
    return (await InviteModel.create(data)) as any;
  }

  public async verifyInviteCode(id: string, code: string): Promise<any> {
    const user = await userService.getUserById(id);
    if (!user) {
      return { ok: false, message: 'User not found' };
    }

    const invite = await this.getInviteByUser(id);
    if (!invite || !invite.inviteCode) {
      return { ok: false, message: 'Invite not found' };
    }

    const now = new Date();
    if (invite.expiresAt < now) {
      return { ok: false, reason: 'EXPIRED' };
    }

    if ((code || '').trim().toUpperCase() !== invite.inviteCode) {
      return { ok: false, reason: 'MISMATCH' };
    }

    invite.isVerified = true;
    invite.usedAt = now;
    await invite.save();
    return { ok: true, user, invite };
  }

  public async getInviteByUser(userId: string): Promise<any> {
    return (await InviteModel.findOne({ user: userId })) as any;
  }
}

export const inviteService: InviteServices = new InviteServices();
