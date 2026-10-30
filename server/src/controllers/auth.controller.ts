import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    const user = await User.create(validatedData);

    const token = signToken({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution,
          department: user.department,
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
          avatar: user.avatar,
        },
      },
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
        name: 'Jaswant Karun (Lead Admin)',
        institution: 'RENTORA Central Network',
      },
    ],
  });
};
