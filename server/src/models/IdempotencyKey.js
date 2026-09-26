import mongoose from 'mongoose';

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Idempotency key is required'],
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    requestPath: {
      type: String,
      required: true
    },
    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    responseStatus: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400 // 24 Hours TTL index: MongoDB automatically cleans expired keys
    }
  },
  {
    timestamps: false
  }
);

export const IdempotencyKey = mongoose.model('IdempotencyKey', idempotencyKeySchema);
