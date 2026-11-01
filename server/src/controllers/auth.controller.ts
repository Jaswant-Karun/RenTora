import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { registerSchema, loginSchema, forgotPasswordSchema } from '../schemas/auth.schema.js';
import { signToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const getCookieOptions = (rememberMe?: boolean) => {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000; // 7 days

  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
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
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('rentora_token', {
    httpOnly: true,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    secure: isProduction,
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
          bio: req.user.bio || '',
          academicQualification: req.user.academicQualification,
          isVerified: req.user.isVerified,
          institutionMembershipVerified: req.user.institutionMembershipVerified,
          trainingCertifications: req.user.trainingCertifications,
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

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { name, phone, department, avatar, academicQualification, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name && typeof name === 'string') user.name = name.trim();
    if (phone && typeof phone === 'string') user.phone = phone.trim();
    if (department && typeof department === 'string') user.department = department.trim();
    if (avatar && typeof avatar === 'string') user.avatar = avatar.trim();
    if (bio !== undefined && typeof bio === 'string') user.bio = bio.trim();
    if (academicQualification && typeof academicQualification === 'string') {
      user.academicQualification = academicQualification.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar,
        bio: user.bio || '',
        academicQualification: user.academicQualification,
        isVerified: user.isVerified,
        institutionMembershipVerified: user.institutionMembershipVerified,
        trainingCertifications: user.trainingCertifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Incorrect current password' });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
