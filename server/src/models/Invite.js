import mongoose from 'mongoose';
import { INVITE_STATUS } from '../constants/inviteStatus.js';

const inviteSchema = new mongoose.Schema(
  {
    familyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      required: [true, 'Family group ID is required'],
      index: true
    },
    email: {
      type: String,
      required: [true, 'Invitee email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    token: {
      type: String,
      required: [true, 'Invite token is required'],
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(INVITE_STATUS),
      default: INVITE_STATUS.PENDING
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'InvitedBy user ID is required']
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days validity
    },
    acceptedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index to quickly find active invites for email in a group
inviteSchema.index({ familyGroupId: 1, email: 1, status: 1 });

// Helper to check if invite is still valid
inviteSchema.methods.isValid = function () {
  return this.status === INVITE_STATUS.PENDING && new Date() < this.expiresAt;
};

export const Invite = mongoose.model('Invite', inviteSchema);
