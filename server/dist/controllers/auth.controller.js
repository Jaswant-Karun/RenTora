"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDemoAccounts = exports.getMe = exports.forgotPassword = exports.logout = exports.login = exports.register = void 0;
const user_model_js_1 = require("../models/user.model.js");
const auth_schema_js_1 = require("../schemas/auth.schema.js");
const jwt_js_1 = require("../utils/jwt.js");
const getCookieOptions = (rememberMe) => {
    const maxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000 // 30 days
        : 7 * 24 * 60 * 60 * 1000; // 7 days
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
        maxAge,
    };
};
const register = async (req, res, next) => {
    try {
        const validatedData = auth_schema_js_1.registerSchema.parse(req.body);
        const existingUser = await user_model_js_1.User.findOne({ email: validatedData.email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'An institutional account with this email already exists.',
            });
            return;
        }
        // Omit confirmPassword and agreeTerms before saving to MongoDB
        const { confirmPassword: _, agreeTerms: __, ...userPayload } = validatedData;
        const user = await user_model_js_1.User.create(userPayload);
        const token = (0, jwt_js_1.signToken)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const validatedData = auth_schema_js_1.loginSchema.parse(req.body);
        // Query password explicitly since select: false
        const user = await user_model_js_1.User.findOne({ email: validatedData.email }).select('+password');
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
        const token = (0, jwt_js_1.signToken)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const logout = async (_req, res) => {
    res.clearCookie('rentora_token', {
        httpOnly: true,
        sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
        secure: process.env.NODE_ENV === 'production',
    });
    res.status(200).json({
        success: true,
        message: 'Logged out successfully. Secure session cleared.',
    });
};
exports.logout = logout;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = auth_schema_js_1.forgotPasswordSchema.parse(req.body);
        const user = await user_model_js_1.User.findOne({ email });
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
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const getMe = async (req, res, next) => {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
const getDemoAccounts = (_req, res) => {
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
exports.getDemoAccounts = getDemoAccounts;
