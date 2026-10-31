"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ecoShare_controller_js_1 = require("../controllers/ecoShare.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// GET /api/ecoshare/insights - Retrieve institutional sustainability metrics and estimates
router.get('/insights', auth_middleware_js_1.optionalAuth, ecoShare_controller_js_1.EcoShareController.getInsights);
// GET /api/ecoshare/assumptions - Retrieve current assumption parameters
router.get('/assumptions', auth_middleware_js_1.optionalAuth, ecoShare_controller_js_1.EcoShareController.getAssumptions);
// PUT /api/ecoshare/assumptions - Update assumptions (Manager / Admin only)
router.put('/assumptions', auth_middleware_js_1.authenticate, (0, auth_middleware_js_1.requireRole)(['manager', 'admin']), ecoShare_controller_js_1.EcoShareController.updateAssumptions);
// GET /api/ecoshare/export - Download full sustainability impact report as CSV
router.get('/export', auth_middleware_js_1.optionalAuth, ecoShare_controller_js_1.EcoShareController.exportReport);
exports.default = router;
