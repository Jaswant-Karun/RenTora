"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const user_model_js_1 = require("../models/user.model.js");
const authenticate = async (req, res, next) => {
    try {
        let token;
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
        const decoded = (0, jwt_js_1.verifyToken)(token);
        const user = await user_model_js_1.User.findById(decoded.userId);
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
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please sign in again.',
            error: error.message,
        });
    }
};
exports.authenticate = authenticate;
