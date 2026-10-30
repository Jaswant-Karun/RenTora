"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const user_model_js_1 = require("../models/user.model.js");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_js_1.verifyToken)(token);
        const user = await user_model_js_1.User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User belonging to this token no longer exists.',
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
            message: 'Invalid or expired authentication token.',
            error: error.message,
        });
    }
};
exports.authenticate = authenticate;
