import mongoose from 'mongoose';
import { FamilyGroup } from '../models/FamilyGroup.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Strict authorization guard ensuring caller belongs to the requested family group
 */
export async function familyMembershipMiddleware(req, res, next) {
  try {
    if (!req.user || !req.user._id) {
      return next(ApiError.unauthorized('Authentication required to access family data'));
    }

    const familyGroupId = req.params.familyGroupId || req.body.familyGroupId;

    if (!familyGroupId) {
      return next(ApiError.badRequest('Family group ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(familyGroupId)) {
      return next(ApiError.badRequest('Invalid family group ID format'));
    }

    const group = await FamilyGroup.findOne({
      _id: familyGroupId,
      members: req.user._id
    });

    if (!group) {
      return next(ApiError.forbidden('Access denied: You do not belong to this family group'));
    }

    // Attach group to request for downstream controllers
    req.familyGroup = group;
    next();
  } catch (error) {
    next(error);
  }
}
