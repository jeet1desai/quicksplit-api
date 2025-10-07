import { GroupModel } from '@features/whatsapp/model/group.model';
import { metaApiService } from '../whatsapp/meta.services';
import { userService } from './user.services';

class GroupServices {
  public async getGroupOrCreate(groupId: string, metadata: any): Promise<any> {
    let group = await GroupModel.findOne({ groupId });
    if (group) return group;

    const groupInfo = await metaApiService.getGroupInfo(groupId);
    const members = await metaApiService.getGroupMembers(groupId);

    const users = members.data.map((member: any) => {
      const user = userService.getUserOrCreate(member.phone_number || '');
      return { user: user, role: member.admin ? 'admin' : 'member' };
    });

    group = new GroupModel({ groupId, name: groupInfo.name || 'Unknown Group', description: groupInfo.description || '', members: users });
    return await group.save();
  }

  public async getGroupById(groupId: string): Promise<any> {
    return await GroupModel.findOne({ groupId });
  }
}

export const groupService: GroupServices = new GroupServices();
