import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema<any>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    inviteCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const InviteModel = mongoose.model<any>('Invite', inviteSchema);
