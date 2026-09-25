import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { hashToken } from '../utils/crypto.js';

export class AuthService {
  /**
   * Generates Access and Refresh Token pair
   * @param {object} user 
   * @returns {{ accessToken: string, refreshToken: string }}
   */
  static generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
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
   * Registers a new user
   */
  static async registerUser({ name, email, password }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    const user = new User({ name, email, password });
    const { accessToken, refreshToken } = this.generateTokens(user);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Authenticates user credentials and issues tokens
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

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
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
    return user.toJSON();
  }
}
