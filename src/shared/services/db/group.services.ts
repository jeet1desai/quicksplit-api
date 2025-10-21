import { GroupModel } from '@features/whatsapp/model/group.model';
import { config } from '@root/config';

class GroupServices {
  public async createGroup(name: string, createdBy: string, description: string = '') {
    const code = await this.generateUniqueGroupCode(name);

    const group = new GroupModel({
      code,
      name,
      description,
      createdBy,
      members: [
        {
          user: createdBy,
          phoneNumber: createdBy,
          role: 'admin',
          isActive: true
        }
      ]
    });

    await group.save();

    const inviteLink = this.generateInviteLink(code);

    return {
      group,
      inviteLink
    };
  }

  public async generateUniqueGroupCode(name: string): Promise<string> {
    const prefix = name
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .substring(0, 3)
      .padEnd(3, 'X');

    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const code = `${prefix}${random}`;

    const exists = await GroupModel.findOne({ code });
    if (exists) {
      return this.generateUniqueGroupCode(name);
    }

    return code;
  }

  private generateInviteLink(code: string): string {
    return `https://wa.me/${config.META_PHONE_NUMBER}?text=join:${code}`;
  }
}

export const groupService: GroupServices = new GroupServices();
