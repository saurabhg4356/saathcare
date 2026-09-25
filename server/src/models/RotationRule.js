import mongoose from 'mongoose';

const rotationRuleSchema = new mongoose.Schema(
  {
    familyGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      required: [true, 'Family group ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Rotation title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY'],
      default: 'WEEKLY'
    },
    memberOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    currentCycleIndex: {
      type: Number,
      default: 0,
      min: 0
    },
    nextRotationAt: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

export const RotationRule = mongoose.model('RotationRule', rotationRuleSchema);
