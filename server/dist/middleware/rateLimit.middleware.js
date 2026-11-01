"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalApiLimiter = exports.authRateLimiter = exports.createRateLimiter = void 0;
/**
 * In-memory sliding window rate limiter for security auditing & DDoS protection.
 */
const createRateLimiter = (options) => {
    const ipStore = new Map();
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of ipStore.entries()) {
            if (now > record.resetTime) {
                ipStore.delete(ip);
            }
        }
    }, 5 * 60 * 1000).unref();
    return (req, res, next) => {
        // In dev or test environments, allow higher thresholds if needed
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.socket.remoteAddress ||
            '127.0.0.1';
        const now = Date.now();
        const existing = ipStore.get(clientIp);
        if (!existing || now > existing.resetTime) {
            ipStore.set(clientIp, {
                count: 1,
                resetTime: now + options.windowMs,
            });
            res.setHeader('RateLimit-Limit', options.max);
            res.setHeader('RateLimit-Remaining', options.max - 1);
            res.setHeader('RateLimit-Reset', Math.ceil((now + options.windowMs) / 1000));
            next();
            return;
        }
        existing.count += 1;
        const remaining = Math.max(0, options.max - existing.count);
        const retryAfterSec = Math.ceil((existing.resetTime - now) / 1000);
        res.setHeader('RateLimit-Limit', options.max);
        res.setHeader('RateLimit-Remaining', remaining);
        res.setHeader('RateLimit-Reset', Math.ceil(existing.resetTime / 1000));
        if (existing.count > options.max) {
            res.setHeader('Retry-After', retryAfterSec);
            res.status(429).json({
                success: false,
                error: 'TOO_MANY_REQUESTS',
                message: options.message,
                retryAfterSeconds: retryAfterSec,
            });
            return;
        }
        next();
    };
};
exports.createRateLimiter = createRateLimiter;
/**
 * Strict authentication limiter to protect against credential brute force & stuffing attacks.
 * Limit: 15 attempts per 15-minute window per IP.
 */
exports.authRateLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Too many authentication attempts from this IP address. Please wait 15 minutes before retrying.',
});
/**
 * General API limiter to prevent API scraping and denial-of-service attempts.
 * Limit: 500 requests per 15-minute window per IP.
 */
exports.generalApiLimiter = (0, exports.createRateLimiter)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Campus API rate limit exceeded. Please throttle your requests.',
});
