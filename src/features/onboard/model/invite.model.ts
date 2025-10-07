import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema<any>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    inviteCode: { type: String, required: true },
    expiresAt: { type: Date, default: Date.now() + 24 * 60 * 60 * 1000 },
    isVerified: { type: Boolean, default: false },
    usedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InviteModel = mongoose.model<any>('Invite', inviteSchema);
