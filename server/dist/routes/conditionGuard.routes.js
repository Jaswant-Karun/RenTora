"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conditionGuard_controller_js_1 = require("../controllers/conditionGuard.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// 1. Before Check-in: Record pre-use condition & baseline
router.post('/before-checkin', conditionGuard_controller_js_1.recordBeforeCheckIn);
// 2. After Check-out: Record post-use condition & compute differences
router.post('/after-checkout', conditionGuard_controller_js_1.recordAfterCheckOut);
// 3. Side-by-side Before/After Comparison
router.get('/comparison/:bookingId', conditionGuard_controller_js_1.getComparison);
// 4. List Condition Reports
router.get('/reports', conditionGuard_controller_js_1.getConditionReports);
exports.default = router;
