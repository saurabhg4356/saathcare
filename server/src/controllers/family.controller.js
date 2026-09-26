import { FamilyService } from '../services/family.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { SocketEmitter } from '../sockets/socketEmitter.js';

export class FamilyController {
  static async createGroup(req, res, next) {
    try {
      const group = await FamilyService.createFamilyGroup(req.user._id, req.body);
      return res.status(201).json(
        ApiResponse.success(group, 'Family group created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getMyGroups(req, res, next) {
    try {
      const groups = await FamilyService.getUserFamilyGroups(req.user._id);
      return res.status(200).json(
        ApiResponse.success(groups, 'Family groups retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getGroupDetails(req, res, next) {
    try {
      const group = await FamilyService.getFamilyGroupDetails(req.params.familyGroupId);
      return res.status(200).json(
        ApiResponse.success(group, 'Family group details retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  static async createInvite(req, res, next) {
    try {
      const invite = await FamilyService.createInvite(
        req.params.familyGroupId,
        req.user,
        req.body.email
      );
      return res.status(201).json(
        ApiResponse.success(invite, 'Invitation sent successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getPendingInvites(req, res, next) {
    try {
      const invites = await FamilyService.getPendingInvites(req.params.familyGroupId);
      return res.status(200).json(
        ApiResponse.success(invites, 'Pending invitations retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getInvitePreview(req, res, next) {
    try {
      const invite = await FamilyService.getInviteByToken(req.params.token);
      return res.status(200).json(
        ApiResponse.success(invite, 'Invitation preview retrieved')
      );
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvite(req, res, next) {
    try {
      const result = await FamilyService.acceptInvite(req.params.token, req.user._id);

      // Real-time broadcast to family room that new member has joined
      SocketEmitter.emitMemberJoined(result.familyGroup._id, req.user);

      return res.status(200).json(
        ApiResponse.success(result, 'Successfully joined the family group')
      );
    } catch (error) {
      next(error);
    }
  }

  static async updateCareInfo(req, res, next) {
    try {
      const group = await FamilyService.updateCareInfo(req.params.familyGroupId, req.body);
      return res.status(200).json(
        ApiResponse.success(group, 'Care recipient information updated successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}
