"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incident_controller_js_1 = require("../controllers/incident.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// Public authenticated reporting & listing
router.post('/', incident_controller_js_1.reportIncident);
router.get('/', incident_controller_js_1.getIncidents);
router.get('/:id', incident_controller_js_1.getIncidentById);
// Manager / Custodian / Admin Review
router.patch('/:id/review', (0, auth_middleware_js_1.requireRole)(['manager', 'admin', 'owner']), incident_controller_js_1.reviewIncident);
exports.default = router;
