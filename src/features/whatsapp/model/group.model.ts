import mongoose from 'mongoose';

import { NotFoundError } from '@shared/globals/helpers/error-handler';

const groupSchema = new mongoose.Schema<any>(
  {
    groupId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

groupSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

groupSchema.methods.addMember = async function (userId: string, role = 'member') {
  const existingMember = this.members.find((member: any) => member.user.toString() === userId.toString());

  if (existingMember) {
    existingMember.role = role;
    existingMember.isActive = true;
  } else {
    this.members.push({ user: userId, role, joinedAt: new Date(), isActive: true });
  }

  return this.save();
};

groupSchema.methods.removeMember = async function (userId: string) {
  const member = this.members.find((member: any) => member.user.toString() === userId.toString());
  if (member) {
    member.isActive = false;
    return this.save();
  }
  throw new NotFoundError('Member not found in group');
};

groupSchema.methods.getActiveMembers = function () {
  return this.members.filter((member: any) => member.isActive);
};

export const GroupModel = mongoose.model<any>('Group', groupSchema);
