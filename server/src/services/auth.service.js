import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { hashToken } from '../utils/crypto.js';
import { NotificationService } from './notification.service.js';
import { NOTIFICATION_TYPE } from '../models/NotificationOutbox.js';
import { EmailService } from './email/index.js';

export class AuthService {
  /**
   * Generates Access and Refresh Token pair
   * @param {object} user 
   * @returns {{ accessToken: string, refreshToken: string }}
   */
  static generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name, isVerified: !!user.isVerified },
      env.JWT.ACCESS_SECRET,
      { expiresIn: env.JWT.ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      env.JWT.REFRESH_SECRET,
      { expiresIn: `${env.JWT.REFRESH_EXPIRY_DAYS}d` }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Registers a new user and queues verification email via outbox
   */
  static async registerUser({ name, email, password }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    // High entropy verification token (32 bytes hex)
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = new User({
      name,
      email,
      password,
      isVerified: false,
      verificationTokenHash,
      verificationTokenExpiresAt
    });

    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    // Queue verification email via Outbox (non-blocking)
    const verificationUrl = `${env.CLIENT_URL}/verify-email/${rawVerificationToken}`;
    const emailPayload = EmailService.getVerificationTemplate({
      name: user.name,
      verificationUrl
    });

    await NotificationService.enqueue({
      type: NOTIFICATION_TYPE.EMAIL_VERIFICATION,
      recipient: user.email,
      userId: user._id,
      payload: emailPayload
    });

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Authenticates user credentials and checks deletion status
   */
  static async loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    const userData = user.toJSON();
    // Expose pending deletion flags to client on login
    userData.pendingDeletion = !!user.pendingDeletion;
    userData.deletionScheduledAt = user.deletionScheduledAt;
    userData.isVerified = !!user.isVerified;

    return {
      user: userData,
      accessToken,
      refreshToken
    };
  }

  /**
   * Verifies email using single-use time-limited token
   */
  static async verifyEmail(token) {
    if (!token) {
      throw ApiError.badRequest('Verification token is required');
    }

    const candidateHash = hashToken(token);
    const user = await User.findOne({
      verificationTokenHash: candidateHash,
      verificationTokenExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw ApiError.badRequest('Verification link is invalid or has expired. Please request a new link.');
    }

    user.isVerified = true;
    user.verificationTokenHash = null;
    user.verificationTokenExpiresAt = null;
    await user.save();

    return {
      verified: true,
      user: user.toJSON()
    };
  }

  /**
   * Resends verification email (rate-limited, anti-enumeration protected)
   */
  static async resendVerification(email) {
    if (!email) {
      throw ApiError.badRequest('Email address is required');
    }

    const user = await User.findOne({ email });
    // Anti-enumeration defense: return generic success even if user not found or already verified
    if (!user || user.isVerified) {
      return {
        success: true,
        message: 'If an unverified account exists for this email, a new verification link has been sent.'
      };
    }

    // Invalidate old token and create fresh one
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationTokenHash = hashToken(rawVerificationToken);
    user.verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationUrl = `${env.CLIENT_URL}/verify-email/${rawVerificationToken}`;
    const emailPayload = EmailService.getVerificationTemplate({
      name: user.name,
      verificationUrl
    });

    await NotificationService.enqueue({
      type: NOTIFICATION_TYPE.EMAIL_VERIFICATION,
      recipient: user.email,
      userId: user._id,
      payload: emailPayload
    });

    return {
      success: true,
      message: 'If an unverified account exists for this email, a new verification link has been sent.'
    };
  }

  /**
   * Initiates forgot-password flow with anti-enumeration protection
   */
  static async forgotPassword(email) {
    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    const genericMessage = 'If an account with that email exists, a password reset link has been sent.';
    const user = await User.findOne({ email });
    if (!user) {
      return { success: true, message: genericMessage };
    }

    // High entropy 32-byte single-use token with 30m expiry
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetTokenHash = hashToken(rawResetToken);
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const resetUrl = `${env.CLIENT_URL}/reset-password/${rawResetToken}`;
    const emailPayload = EmailService.getPasswordResetTemplate({
      name: user.name,
      resetUrl
    });

    await NotificationService.enqueue({
      type: NOTIFICATION_TYPE.PASSWORD_RESET,
      recipient: user.email,
      userId: user._id,
      payload: emailPayload
    });

    return { success: true, message: genericMessage };
  }

  /**
   * Resets password using single-use hashed token and revokes active sessions
   */
  static async resetPassword(token, newPassword) {
    if (!token) {
      throw ApiError.badRequest('Reset token is required');
    }
    if (!newPassword || newPassword.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters');
    }

    const candidateHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: candidateHash,
      passwordResetExpiresAt: { $gt: new Date() }
    });

    if (!user) {
      throw ApiError.badRequest('This reset link has expired or was already used.');
    }

    // Update password (triggers bcrypt pre-save)
    user.password = newPassword;
    // Single-use: clear reset token fields
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    // Security: Invalidate all existing refresh tokens/sessions
    user.refreshTokenHash = null;

    await user.save();

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new credentials.'
    };
  }

  /**
   * Initiates account deletion request with 3-day grace period
   */
  static async requestAccountDeletion(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // 3-day grace period
    const gracePeriodMs = 3 * 24 * 60 * 60 * 1000;
    user.pendingDeletion = true;
    user.deletionScheduledAt = new Date(Date.now() + gracePeriodMs);
    // Invalidate active session tokens
    user.refreshTokenHash = null;

    await user.save();

    return {
      success: true,
      deletionScheduledAt: user.deletionScheduledAt,
      message: 'Account deletion requested. Your account is in a 3-day grace period. You may log in anytime to cancel deletion.'
    };
  }

  /**
   * Cancels account deletion request during the 3-day grace period
   */
  static async cancelAccountDeletion(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.pendingDeletion = false;
    user.deletionScheduledAt = null;
    await user.save();

    return {
      success: true,
      message: 'Account deletion request has been cancelled. Your account is fully active.'
    };
  }

  /**
   * Rotates refresh tokens and detects reuse
   */
  static async refreshTokens(currentRefreshToken) {
    if (!currentRefreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    let payload;
    try {
      payload = jwt.verify(currentRefreshToken, env.JWT.REFRESH_SECRET);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Verify token hash against stored hash to detect reuse / revoked tokens
    const currentHash = hashToken(currentRefreshToken);
    if (user.refreshTokenHash !== currentHash) {
      // Token reuse detected or token revoked! Invalidate all tokens for security
      user.refreshTokenHash = null;
      await user.save();
      throw ApiError.forbidden('Refresh token revoked or reused. Please log in again.');
    }

    // Issue rotated tokens
    const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: user.toJSON()
    };
  }

  /**
   * Invalidates active session
   */
  static async logoutUser(userId) {
    if (!userId) return;
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  /**
   * Retrieves user profile
   */
  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    const userData = user.toJSON();
    userData.pendingDeletion = !!user.pendingDeletion;
    userData.deletionScheduledAt = user.deletionScheduledAt;
    userData.isVerified = !!user.isVerified;
    return userData;
  }
}
