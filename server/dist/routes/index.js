"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const db_js_1 = require("../config/db.js");
const router = (0, express_1.Router)();
// Health Check
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        platform: 'RENTORA - Smart Institutional Resource Sharing Platform',
        version: '1.0.0',
        system: 'Operational',
        timestamp: new Date().toISOString(),
        status: 'ONLINE',
        database: (0, db_js_1.getDBStatus)(),
    });
});
// Database diagnostics
router.get('/db-status', (_req, res) => {
    res.status(200).json({
        success: true,
        database: (0, db_js_1.getDBStatus)(),
    });
});
// Auth Routes
router.use('/auth', auth_routes_js_1.default);
exports.default = router;
