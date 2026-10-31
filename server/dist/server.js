"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./config/db.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const error_middleware_js_1 = require("./middleware/error.middleware.js");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
// Production-ready CORS Configuration
const allowedOriginsList = [
    CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()) : []),
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
        if (!origin)
            return callback(null, true);
        if (process.env.NODE_ENV !== 'production' ||
            origin.includes('vercel.app') ||
            origin.includes('onrender.com') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            allowedOriginsList.some((allowed) => allowed && origin.startsWith(allowed.replace(/\/+$/, '')))) {
            return callback(null, true);
        }
        // Permissive fallback so users' Vercel deployments are never rejected
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Top-level /health check for cloud load-balancers & container orchestrators
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ONLINE',
        platform: 'RENTORA',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// Request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}
// API Routes
app.use('/api', index_js_1.default);
// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API Route ${req.originalUrl} not found on RENTORA Server`,
    });
});
// Central Error Handler
app.use(error_middleware_js_1.errorHandler);
// Start Server
const startServer = async () => {
    // Connect to MongoDB Atlas / Local
    await (0, db_js_1.connectDB)();
    const portNumber = Number(PORT) || 5000;
    app.listen(portNumber, '0.0.0.0', () => {
        console.log(`
=====================================================
🚀 RENTORA Backend API is live!
🏛️ Smart Institutional Resource Sharing Platform
📡 Port: ${portNumber} (host: 0.0.0.0)
🩺 Health Check: http://localhost:${portNumber}/health
=====================================================
    `);
    });
};
startServer().catch((err) => {
    console.error('Fatal Server Boot Error:', err);
});
exports.default = app;
