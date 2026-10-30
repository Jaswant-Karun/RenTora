import jwt from 'jsonwebtoken';
import { UserRole } from '../models/user.model.js';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export const signToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'rentora_dev_jwt_secret_token_key_778899_xyz';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'rentora_dev_jwt_secret_token_key_778899_xyz';
  return jwt.verify(token, secret) as TokenPayload;
};
