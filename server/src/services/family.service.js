import { FamilyGroup } from '../models/FamilyGroup.js';
import { Invite } from '../models/Invite.js';
import { User } from '../models/User.js';
import { INVITE_STATUS } from '../constants/inviteStatus.js';
import { ApiError } from '../utils/apiError.js';
import { generateSecureToken } from '../utils/crypto.js';
import { EmailService } from './email.service.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../models/NotificationOutbox.js';
import { env } from '../config/env.js';

export class FamilyService {
  /**
   * Creates a new family group with the creator as initial member
   */
  static async createFamilyGroup(userId, { careRecipientName, groupName }) {
    const familyGroup = new FamilyGroup({
      careRecipientName,
      groupName: groupName || `${careRecipientName}'s Care Team`,
      createdBy: userId,
      members: [userId]
    });

    await familyGroup.save();
    return FamilyGroup.findById(familyGroup._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
  }

  /**
   * Retrieves all family groups the user is a member of
   */
  static async getUserFamilyGroups(userId) {
    return FamilyGroup.find({ members: userId })
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
  }

  /**
   * Retrieves a single family group by ID
   */
  static async getFamilyGroupDetails(familyGroupId) {
    const group = await FamilyGroup.findById(familyGroupId)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      throw ApiError.notFound('Family group not found');
    }
    return group;
  }

  /**
   * Issues an invitation to an email address
   */
  static async createInvite(familyGroupId, inviterUser, email) {
    const group = await FamilyGroup.findById(familyGroupId);
    if (!group) {
      throw ApiError.notFound('Family group not found');
    }

    // Check if target user already exists and is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser && group.members.some(m => m.toString() === existingUser._id.toString())) {
      throw ApiError.badRequest('This user is already a member of this family group');
    }

    // Check for existing pending invite
    const existingInvite = await Invite.findOne({
      familyGroupId,
      email,
      status: INVITE_STATUS.PENDING,
      expiresAt: { $gt: new Date() }
    });

    if (existingInvite) {
      // Re-send / queue existing valid invite
      const inviteUrl = `${env.CLIENT_URL}/accept-invite/${existingInvite.token}`;
      const template = EmailService.getFamilyInviteTemplate({
        inviterName: inviterUser.name,
        careRecipientName: group.careRecipientName,
        inviteUrl
      });
      await NotificationService.enqueue({
        type: NOTIFICATION_TYPE.FAMILY_INVITE,
        recipient: email,
        familyGroupId,
        payload: template
      });
      return existingInvite;
    }

    // Generate secure 64-character token
    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = new Invite({
      familyGroupId,
      email,
      token,
      status: INVITE_STATUS.PENDING,
      invitedBy: inviterUser._id,
      expiresAt
    });

    await invite.save();

    // Queue notification via Outbox (non-blocking)
    const inviteUrl = `${env.CLIENT_URL}/accept-invite/${token}`;
    const template = EmailService.getFamilyInviteTemplate({
      inviterName: inviterUser.name,
      careRecipientName: group.careRecipientName,
      inviteUrl
    });
    await NotificationService.enqueue({
      type: NOTIFICATION_TYPE.FAMILY_INVITE,
      recipient: email,
      familyGroupId,
      payload: template
    });

    return invite;
  }

  /**
   * Lists pending invitations for a family group
   */
  static async getPendingInvites(familyGroupId) {
    return Invite.find({
      familyGroupId,
      status: INVITE_STATUS.PENDING,
      expiresAt: { $gt: new Date() }
    })
      .populate('invitedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Public preview of invite metadata before acceptance
   */
  static async getInviteByToken(token) {
    const invite = await Invite.findOne({ token })
      .populate('familyGroupId', 'careRecipientName groupName')
      .populate('invitedBy', 'name email');

    if (!invite || !invite.isValid()) {
      throw ApiError.badRequest('This invitation link is invalid or has expired');
    }

    return invite;
  }

  /**
   * Accepts invitation and joins the family group
   */
  static async acceptInvite(token, userId) {
    const invite = await Invite.findOne({ token });
    if (!invite || !invite.isValid()) {
      throw ApiError.badRequest('This invitation is either invalid, already accepted, or expired');
    }

    // Mark invite accepted
    invite.status = INVITE_STATUS.ACCEPTED;
    invite.acceptedAt = new Date();
    await invite.save();

    // Add user to family group members (idempotent $addToSet)
    const updatedGroup = await FamilyGroup.findByIdAndUpdate(
      invite.familyGroupId,
      { $addToSet: { members: userId } },
      { new: true }
    )
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    return {
      familyGroup: updatedGroup,
      invite
    };
  }

  /**
   * Updates care recipient sensitive details (emergency contacts, primary doctor)
   */
  static async updateCareInfo(familyGroupId, careInfoData) {
    const group = await FamilyGroup.findByIdAndUpdate(
      familyGroupId,
      { $set: { careInfo: careInfoData } },
      { new: true, runValidators: true }
    )
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      throw ApiError.notFound('Family group not found');
    }
    return group;
  }
}
