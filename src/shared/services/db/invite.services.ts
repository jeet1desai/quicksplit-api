import { InviteModel } from '@features/onboard/model/invite.model';

class InviteServices {
  public async createInvite(data: any): Promise<any> {
    return (await InviteModel.create(data)) as any;
  }

  public async getInviteByUser(userId: string): Promise<any> {
    return (await InviteModel.findOne({ user: userId })) as any;
  }
}

export const inviteService: InviteServices = new InviteServices();
