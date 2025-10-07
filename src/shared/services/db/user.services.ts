import { UserModel } from '@features/users/model/user.model';
import { phoneFormat } from '@shared/globals/helpers/phone-format';

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

  public async getUserOrCreate(phoneNumber: string): Promise<any> {
    const phone = phoneFormat(phoneNumber);
    const user = await this.getUserByPhone(phone?.countryCode?.toString() || '', phone?.nationalNumber?.toString() || '');
    if (user) {
      return user;
    }
    return this.createUser({ countryCode: phone?.countryCode?.toString() || '', phoneNumber: phone?.nationalNumber?.toString() || '' });
  }
}

export const userService: UserServices = new UserServices();
