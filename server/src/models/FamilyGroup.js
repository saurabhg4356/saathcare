import mongoose from 'mongoose';

const familyGroupSchema = new mongoose.Schema(
  {
    careRecipientName: {
      type: String,
      required: [true, 'Care recipient name is required'],
      trim: true,
      maxlength: [100, 'Care recipient name cannot exceed 100 characters']
    },
    groupName: {
      type: String,
      trim: true,
      default: function () {
        return `${this.careRecipientName}'s Care Team`;
      },
      maxlength: [120, 'Group name cannot exceed 120 characters']
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'CreatedBy user ID is required']
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ]
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

// Index members array for high-performance family membership verification
familyGroupSchema.index({ members: 1 });
familyGroupSchema.index({ createdBy: 1 });

export const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);
