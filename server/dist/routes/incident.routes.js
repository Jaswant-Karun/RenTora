"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incident_controller_js_1 = require("../controllers/incident.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// Lifecycle 1 & 2: Report Incident & List
router.post('/', incident_controller_js_1.reportIncident);
router.get('/', incident_controller_js_1.getIncidents);
// Lifecycle 3 & 4: Get Incident Details & Condition Comparison
router.get('/:id', incident_controller_js_1.getIncidentById);
router.get('/:id/comparison', incident_controller_js_1.getIncidentConditionComparison);
// Lifecycle 5: Add Investigation Notes
router.post('/:id/investigate', incident_controller_js_1.addInvestigationNote);
// Lifecycle 6: Record Decision (Authorized Human Review Enforced)
router.post('/:id/decision', (0, auth_middleware_js_1.requireRole)(['manager', 'admin', 'owner']), incident_controller_js_1.recordDecision);
// Lifecycle 7 & 8: Record Resolution & Full History
router.post('/:id/resolve', (0, auth_middleware_js_1.requireRole)(['manager', 'admin', 'owner']), incident_controller_js_1.resolveIncident);
// Backward Compatibility
router.patch('/:id/review', (0, auth_middleware_js_1.requireRole)(['manager', 'admin', 'owner']), incident_controller_js_1.resolveIncident);
exports.default = router;
