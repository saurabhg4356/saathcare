import { AuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { env } from '../config/env.js';

function setRefreshCookie(res, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    secure: env.COOKIE.SECURE,
    sameSite: env.COOKIE.SAME_SITE,
    maxAge: env.JWT.REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  };
  if (env.COOKIE.DOMAIN) {
    cookieOptions.domain = env.COOKIE.DOMAIN;
  }
  res.cookie('refreshToken', refreshToken, cookieOptions);
}

export class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.registerUser(req.body);
      setRefreshCookie(res, result.refreshToken);
      return res.status(201).json(
        ApiResponse.success(
          { user: result.user, accessToken: result.accessToken },
          'Account registered successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.loginUser(req.body);
      setRefreshCookie(res, result.refreshToken);
      return res.status(200).json(
        ApiResponse.success(
          { user: result.user, accessToken: result.accessToken },
          'Logged in successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await AuthService.refreshTokens(refreshToken);
      setRefreshCookie(res, result.refreshToken);
      return res.status(200).json(
        ApiResponse.success(
          { accessToken: result.accessToken, user: result.user },
          'Tokens refreshed successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      await AuthService.logoutUser(userId);
      res.clearCookie('refreshToken', { path: '/' });
      return res.status(200).json(
        ApiResponse.success(null, 'Logged out successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user._id);
      return res.status(200).json(
        ApiResponse.success(user, 'User profile retrieved')
      );
    } catch (error) {
      next(error);
    }
  }
}
