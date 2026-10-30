"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDemoAccounts = exports.getMe = exports.login = exports.register = void 0;
const user_model_js_1 = require("../models/user.model.js");
const auth_schema_js_1 = require("../schemas/auth.schema.js");
const jwt_js_1 = require("../utils/jwt.js");
const register = async (req, res, next) => {
    try {
        const validatedData = auth_schema_js_1.registerSchema.parse(req.body);
        const existingUser = await user_model_js_1.User.findOne({ email: validatedData.email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
            return;
        }
        const user = await user_model_js_1.User.create(validatedData);
        const token = (0, jwt_js_1.signToken)({
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
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
