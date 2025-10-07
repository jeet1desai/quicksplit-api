import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  type: string;
  expires: Date;
  blacklisted: boolean;
  createdByIp: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const tokenSchema = new Schema<IToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['refresh', 'resetPassword', 'verifyEmail'],
      required: true
    },
    expires: {
      type: Date,
      required: true,
      index: { expires: '1s' } // Auto-delete expired tokens after 1 second past expiry
    },
    blacklisted: {
      type: Boolean,
      default: false
    },
    createdByIp: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

tokenSchema.index({ userId: 1, type: 1 });

export const TokenModel = mongoose.model<IToken>('Token', tokenSchema);
