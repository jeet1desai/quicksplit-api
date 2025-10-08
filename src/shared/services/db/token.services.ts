import { Types } from 'mongoose';

import { TokenModel } from '@features/users/model/token.model';

const REFRESH_TOKEN_COOKIE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

class TokenServices {
  public async updateTokenId(id: any): Promise<any> {
    return (await TokenModel.findByIdAndUpdate(id, { blacklisted: true }).exec()) as any;
  }

  public async findByDecoded(decoded: any): Promise<any> {
    return (await TokenModel.findOne({ _id: decoded.jti, userId: decoded.userId, type: 'refresh', blacklisted: false }).exec()) as any;
  }

  public async findByUserId(userId: any): Promise<any> {
    return (await TokenModel.findOne({ userId: userId, blacklisted: false }).exec()) as any;
  }

  public async createToken(tokenId: Types.ObjectId, userId: Types.ObjectId | string, ip: any, userAgent: string, refreshToken: string): Promise<any> {
    return await TokenModel.create({
      _id: tokenId,
      userId,
      token: refreshToken,
      type: 'refresh',
      expires: new Date(Date.now() + REFRESH_TOKEN_COOKIE_EXPIRY),
      createdByIp: ip,
      userAgent
    });
  }

  public async removeTokens(userId: Types.ObjectId | string): Promise<any> {
    return (await TokenModel.deleteMany({ userId }).exec()) as any;
  }
}

export const tokenService: TokenServices = new TokenServices();
