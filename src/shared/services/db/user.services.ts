import { UserModel } from '@features/users/model/user.model';
import { phoneFormat } from '@shared/globals/helpers/phone-format';
import { databaseConnection } from '@root/setupDB';
import Logger from 'bunyan';
import { config } from '@root/config';

const log: Logger = config.createLogger('UserService');

class UserServices {
  public async createUser(data: any): Promise<any> {
    try {
      return await UserModel.create(data);
    } catch (error) {
      log.error('Error creating user:', error);
      throw error;
    }
  }

  public async getUserByPhone(countryCode: string, phoneNumber: string): Promise<any> {
    try {
      return await UserModel.findOne({ countryCode: countryCode, phoneNumber: phoneNumber }).setOptions({ maxTimeMS: 5000 });
    } catch (error) {
      log.error(`Error finding user by phone ${countryCode} ${phoneNumber}:`, error);
      throw error;
    }
  }

  public async getUserById(userId: string): Promise<any> {
    try {
      return await UserModel.findById(userId).setOptions({ maxTimeMS: 5000 }).lean().exec();
    } catch (error) {
      log.error(`Error finding user by ID ${userId}:`, error);
      throw error;
    }
  }

  public async getUserOrCreate(phoneNumber: string): Promise<any> {
    try {
      const phone = phoneFormat(phoneNumber);
      if (!phone || !phone.countryCode || !phone.nationalNumber) {
        throw new Error('Invalid phone number format');
      }

      const countryCode = phone.countryCode.toString();
      const nationalNumber = phone.nationalNumber.toString();

      const user = await this.getUserByPhone(countryCode, nationalNumber);
      if (user) {
        return user;
      }

      return await this.createUser({ countryCode, phoneNumber: nationalNumber, createdAt: new Date(), updatedAt: new Date() });
    } catch (error) {
      log.error('Error in getUserOrCreate:', error);
      throw error;
    }
  }
}

export const userService: UserServices = new UserServices();
