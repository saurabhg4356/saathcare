import mongoose from 'mongoose';

const distributedLockSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    holderId: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index automatically purges stale locks
    }
  },
  {
    timestamps: true
  }
);

export const DistributedLock = mongoose.model('DistributedLock', distributedLockSchema);
