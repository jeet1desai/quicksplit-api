import mongoose from 'mongoose';
import { compare, hash } from 'bcryptjs';

const SALT_ROUND = 10;

const userSchema = new mongoose.Schema<any>(
  {
    name: { type: String },
    countryCode: { type: String },
    phoneNumber: { type: String, required: true, unique: true, index: true },
    email: { type: String, index: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastActive: { type: Date, default: Date.now },
    preferences: {
      language: { type: String, default: 'en' },
      currency: { type: String, default: '₹' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      notifications: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

userSchema.pre('save', async function (this: any, next: () => void) {
  const hashedPassword: string = await hash(this.password as string, SALT_ROUND);
  this.password = hashedPassword;
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  const hashedPassword: string = (this as unknown as any).password!;
  return compare(password, hashedPassword);
};

userSchema.methods.hashPassword = async function (password: string): Promise<string> {
  return hash(password, SALT_ROUND);
};

export const UserModel = mongoose.model<any>('User', userSchema);
