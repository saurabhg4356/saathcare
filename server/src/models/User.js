import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    refreshTokenHash: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationTokenHash: {
      type: String,
      default: null
    },
    verificationTokenExpiresAt: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null
    },
    pendingDeletion: {
      type: Boolean,
      default: false
    },
    deletionScheduledAt: {
      type: Date,
      default: null
    },
    hasSeenOnboarding: {
      type: Boolean,
      default: false
    },
    lastVerifiedTokenHash: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.verificationTokenHash;
        delete ret.lastVerifiedTokenHash;
        delete ret.passwordResetTokenHash;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
