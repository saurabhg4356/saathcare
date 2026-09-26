import mongoose from 'mongoose';

export const NOTIFICATION_TYPE = {
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_MISSED: 'TASK_MISSED',
  EXPENSE_ADDED: 'EXPENSE_ADDED',
  FAMILY_INVITE: 'FAMILY_INVITE',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET'
};

export const OUTBOX_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

const notificationOutboxSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      required: [true, 'Notification type is required'],
      index: true
    },
    recipient: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true
    },
    familyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      default: null,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    payload: {
      subject: { type: String, required: true },
      text: { type: String, default: '' },
      html: { type: String, default: '' },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    status: {
      type: String,
      enum: Object.values(OUTBOX_STATUS),
      default: OUTBOX_STATUS.PENDING,
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    lastError: {
      type: String,
      default: null
    },
    availableAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    processedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for high performance outbox worker sweep
notificationOutboxSchema.index({ status: 1, availableAt: 1 });

export const NotificationOutbox = mongoose.model('NotificationOutbox', notificationOutboxSchema);
