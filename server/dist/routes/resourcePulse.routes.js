"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resourcePulse_controller_js_1 = require("../controllers/resourcePulse.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Strict RBAC: Accessible only by institutional owners, managers, and system administrators
router.use(auth_middleware_js_1.authenticate);
router.use((0, auth_middleware_js_1.requireRole)(['owner', 'manager', 'admin']));
// Get ResourcePulse Intelligence Metrics with Date Range Filters
router.get('/metrics', resourcePulse_controller_js_1.getResourcePulseMetrics);
// Export ResourcePulse CSV Report
router.get('/export', resourcePulse_controller_js_1.exportResourcePulseCSV);
exports.default = router;
