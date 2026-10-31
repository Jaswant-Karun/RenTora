"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fairShare_controller_js_1 = require("../controllers/fairShare.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// All FairShare operations require an authenticated user
router.use(auth_middleware_js_1.authenticate);
// 1. Transparent Pre-Evaluation Endpoint (Available to all authenticated borrowers)
router.post('/evaluate', fairShare_controller_js_1.evaluateFairShare);
// 2. FairShare Decision History (Borrowers view their own; Managers view institution)
router.get('/history', fairShare_controller_js_1.getFairShareHistory);
// 3. Current Policy Configuration
router.get('/policy', fairShare_controller_js_1.getFairSharePolicy);
// 4. Update Policy (Managers and Admins only)
router.put('/policy', (0, auth_middleware_js_1.requireRole)(['manager', 'admin']), fairShare_controller_js_1.updateFairSharePolicy);
// 5. Manager Override with Mandatory Reason (Managers and Admins only)
router.post('/override/:id', (0, auth_middleware_js_1.requireRole)(['manager', 'admin']), fairShare_controller_js_1.managerOverrideAllocation);
// 6. Ordered Resource Waiting List
router.get('/waitlist/:resourceId', fairShare_controller_js_1.getResourceWaitlist);
exports.default = router;
