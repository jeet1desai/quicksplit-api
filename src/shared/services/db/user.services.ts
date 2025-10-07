import { UserModel } from '@features/users/model/user.model';

class UserServices {
  public async createUser(data: any): Promise<any> {
    return (await UserModel.create(data)) as any;
  }

  public async getUserByPhone(countryCode: string, phoneNumber: string): Promise<any> {
    return (await UserModel.findOne({ countryCode: countryCode, phoneNumber: phoneNumber }).exec()) as any;
  }

  public async getUserById(userId: string): Promise<any> {
    return (await UserModel.findById(userId).exec()) as any;
  }
}

export const userService: UserServices = new UserServices();
