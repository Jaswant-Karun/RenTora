"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_js_1 = __importDefault(require("./auth.routes.js"));
const resource_routes_js_1 = __importDefault(require("./resource.routes.js"));
const booking_routes_js_1 = __importDefault(require("./booking.routes.js"));
const dashboard_routes_js_1 = __importDefault(require("./dashboard.routes.js"));
const notification_routes_js_1 = __importDefault(require("./notification.routes.js"));
const owner_routes_js_1 = __importDefault(require("./owner.routes.js"));
const manager_routes_js_1 = __importDefault(require("./manager.routes.js"));
const incident_routes_js_1 = __importDefault(require("./incident.routes.js"));
const auditLog_routes_js_1 = __importDefault(require("./auditLog.routes.js"));
const ai_routes_js_1 = __importDefault(require("./ai.routes.js"));
const admin_routes_js_1 = __importDefault(require("./admin.routes.js"));
const fairShare_routes_js_1 = __importDefault(require("./fairShare.routes.js"));
const trustPass_routes_js_1 = __importDefault(require("./trustPass.routes.js"));
const conditionGuard_routes_js_1 = __importDefault(require("./conditionGuard.routes.js"));
const upload_routes_js_1 = __importDefault(require("./upload.routes.js"));
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
// API Endpoints
router.use('/auth', auth_routes_js_1.default);
router.use('/resources', resource_routes_js_1.default);
router.use('/bookings', booking_routes_js_1.default);
router.use('/dashboard', dashboard_routes_js_1.default);
router.use('/notifications', notification_routes_js_1.default);
router.use('/owner', owner_routes_js_1.default);
router.use('/manager', manager_routes_js_1.default);
router.use('/incidents', incident_routes_js_1.default);
router.use('/audit-logs', auditLog_routes_js_1.default);
router.use('/ai', ai_routes_js_1.default);
router.use('/admin', admin_routes_js_1.default);
router.use('/fairshare', fairShare_routes_js_1.default);
router.use('/trustpass', trustPass_routes_js_1.default);
router.use('/condition-guard', conditionGuard_routes_js_1.default);
router.use('/upload', upload_routes_js_1.default);
exports.default = router;
