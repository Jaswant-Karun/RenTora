"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = void 0;
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required prior to role verification.',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] role(s). Your role is [${req.user.role}].`,
            });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
