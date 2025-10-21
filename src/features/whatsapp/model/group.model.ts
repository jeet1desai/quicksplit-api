import mongoose, { Schema, Model } from 'mongoose';

const groupSchema = new Schema<any>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      new Schema<any>(
        {
          user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
          },
          role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
          },
          joinedAt: {
            type: Date,
            default: Date.now
          },
          isActive: {
            type: Boolean,
            default: true
          }
        },
        { _id: false }
      )
    ],
    isActive: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    }
  },
  {
    timestamps: true
  }
);

groupSchema.index({ 'members.user': 1 });

groupSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const GroupModel: Model<any> = mongoose.model<any>('Group', groupSchema);
