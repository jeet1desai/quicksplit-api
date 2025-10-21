import { GroupModel } from '@features/whatsapp/model/group.model';

class GroupServices {
  public async getGroupById(groupId: string): Promise<any> {
    return await GroupModel.findOne({ groupId });
  }
}

export const groupService: GroupServices = new GroupServices();
