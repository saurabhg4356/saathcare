import { FamilyGroup } from '../models/FamilyGroup.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { ExpenseLedger } from '../models/ExpenseLedger.js';
import { ApiResponse } from '../utils/apiResponse.js';

let cachedStats = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes in-memory cache

export async function getPublicStats(req, res, next) {
  try {
    const now = Date.now();
    if (cachedStats && now - lastCacheTime < CACHE_TTL_MS) {
      return res.status(200).json(
        ApiResponse.success({ ...cachedStats, cached: true }, 'Public statistics retrieved from cache')
      );
    }

    const [activeFamilies, totalCaregivers, completedDuties, totalExpenseAgg] = await Promise.all([
      FamilyGroup.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Task.countDocuments({ status: 'COMPLETED' }),
      ExpenseLedger.aggregate([
        { $match: { isReversal: false } },
        { $group: { _id: null, totalPaise: { $sum: '$amountPaise' } } }
      ])
    ]);

    const totalExpensesPaise = totalExpenseAgg[0]?.totalPaise || 0;

    cachedStats = {
      activeFamilies,
      totalCaregivers,
      completedDuties,
      totalExpensesPaise,
      lastUpdated: new Date()
    };
    lastCacheTime = now;

    return res.status(200).json(
      ApiResponse.success({ ...cachedStats, cached: false }, 'Public statistics calculated successfully')
    );
  } catch (error) {
    next(error);
  }
}
