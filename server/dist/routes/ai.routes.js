"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_js_1 = require("../controllers/ai.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public / Health / Status
router.get('/status', ai_controller_js_1.getAiStatusController);
// FEATURE 1: SMART RESOURCE MATCHING (supports user profile context when available)
router.post('/match-resources', auth_middleware_js_1.optionalAuth, ai_controller_js_1.matchResourcesController);
// FEATURE 2: RESOURCE UTILIZATION ANALYTICS
router.get('/utilization-analytics', auth_middleware_js_1.optionalAuth, ai_controller_js_1.getUtilizationAnalyticsController);
// FEATURE 3: SCHEDULING CONFLICT DETECTION
router.post('/detect-conflicts', auth_middleware_js_1.optionalAuth, ai_controller_js_1.detectConflictsController);
// FEATURE 4: INCIDENT SUMMARY ASSISTANT (requires authenticated session)
router.post('/summarize-incident', auth_middleware_js_1.authenticate, ai_controller_js_1.summarizeIncidentController);
exports.default = router;
