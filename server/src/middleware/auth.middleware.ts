import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.js';
import { User, IUser } from '../models/user.model.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Try extracting from secure httpOnly cookie
    if (req.cookies && req.cookies.rentora_token) {
      token = req.cookies.rentora_token;
    }

    // 2. Fallback to Authorization Bearer header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to access this resource.',
      });
      return;
    }

    const decoded = verifyToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'The user session is no longer active or the user has been removed.',
      });
      return;
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.',
      error: error.message,
    });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] role privileges. Your current role is '${req.user.role}'.`,
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;
    if (req.cookies && req.cookies.rentora_token) {
      token = req.cookies.rentora_token;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.tokenPayload = decoded;
      }
    }
  } catch (_e) {
    // Session token invalid or expired, continue as unauthenticated guest
  }
  next();
};
