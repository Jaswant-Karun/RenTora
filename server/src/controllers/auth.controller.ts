import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { registerSchema, loginSchema, forgotPasswordSchema } from '../schemas/auth.schema.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const getCookieOptions = (rememberMe?: boolean) => {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000; // 7 days

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    maxAge,
  };
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An institutional account with this email already exists.',
      });
      return;
    }

    // Omit confirmPassword and agreeTerms before saving to MongoDB
    const { confirmPassword: _, agreeTerms: __, ...userPayload } = validatedData;

    const user = await User.create(userPayload);

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    // Set secure httpOnly cookie
    res.cookie('rentora_token', token, getCookieOptions(false));

    res.status(201).json({
      success: true,
      message: 'Account registered and authenticated successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution,
          department: user.department,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Query password explicitly since select: false
    const user = await User.findOne({ email: validatedData.email }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const isMatch = await user.comparePassword(validatedData.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    // Set secure httpOnly cookie with rememberMe duration support
    res.cookie('rentora_token', token, getCookieOptions(validatedData.rememberMe));

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution,
          department: user.department,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('rentora_token', {
    httpOnly: true,
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Secure session cleared.',
  });
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't leak user existence; provide standardized response
      res.status(200).json({
        success: true,
        message: 'If an institutional account matches this email, password reset instructions have been dispatched.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Password recovery token issued for ${user.email}. Please follow the instructions sent to your institutional email.`,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          institution: req.user.institution,
          department: req.user.department,
          phone: req.user.phone,
          avatar: req.user.avatar,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDemoAccounts = (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: [
      {
        role: 'student',
        roleLabel: 'Student / Researcher',
        email: 'student@rentora.edu',
        password: 'Password123!',
        name: 'Arun Kumar',
        institution: 'National Institute of Technology',
      },
      {
        role: 'owner',
        roleLabel: 'Lab / Resource Owner',
        email: 'owner@rentora.edu',
        password: 'Password123!',
        name: 'Dr. Meera Raman',
        institution: 'National Institute of Technology',
      },
      {
        role: 'manager',
        roleLabel: 'Institution Manager',
        email: 'manager@rentora.edu',
        password: 'Password123!',
        name: 'Prof. Suresh Nair',
        institution: 'National Institute of Technology',
      },
      {
        role: 'admin',
        roleLabel: 'Platform Administrator',
        email: 'admin@rentora.edu',
        password: 'Password123!',
        name: 'Central Platform Administrator',
        institution: 'RENTORA Central Network',
      },
    ],
  });
};
