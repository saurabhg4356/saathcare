import mongoose from 'mongoose';
import { TASK_STATUS, VALID_STATUS_TRANSITIONS } from '../constants/taskStatus.js';

const taskSchema = new mongoose.Schema(
  {
    familyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      required: [true, 'Family group ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignee is required'],
      index: true
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date/time is required'],
      index: true
    },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.PENDING,
      index: true
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user ID is required']
    },
    rotationRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RotationRule',
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

// Compound indexes for performant task listing and missed-task background sweeps
taskSchema.index({ familyGroupId: 1, status: 1, dueAt: 1 });
taskSchema.index({ status: 1, dueAt: 1 });

// Pre-save validation guarding against invalid status state transitions
taskSchema.pre('save', function (next) {
  if (this.isModified('status') && !this.isNew) {
    const previousStatus = this._originalStatus || this.status;
    const allowed = VALID_STATUS_TRANSITIONS[previousStatus] || [];
    if (!allowed.includes(this.status)) {
      return next(new Error(`Invalid status transition from ${previousStatus} to ${this.status}`));
    }
  }
  next();
});

// Cache original status on document init
taskSchema.post('init', function () {
  this._originalStatus = this.status;
});

export const Task = mongoose.model('Task', taskSchema);
