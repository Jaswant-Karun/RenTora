"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    console.error('[RENTORA Server Error]:', err);
    // Handle Zod Validation Error
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Handle Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        res.status(409).json({
            success: false,
            message: `A record with that ${field} already exists.`,
        });
        return;
    }
    // Handle CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        res.status(400).json({
            success: false,
            message: `Invalid ID format for ${err.path}.`,
        });
        return;
    }
    // General server error
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';
    const safeMessage = statusCode === 500 && isProduction
        ? 'An unexpected error occurred. Please contact institutional technical support.'
        : err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message: safeMessage,
    });
};
exports.errorHandler = errorHandler;
