"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trustPass_controller_js_1 = require("../controllers/trustPass.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// All TrustPass routes require authentication
router.use(auth_middleware_js_1.authenticate);
// 1. Generate or fetch TrustPass token (Borrower, Owner, Manager)
router.get('/token/:bookingId', trustPass_controller_js_1.getTrustPassToken);
// 2. Scan or Verify token on backend (Owners, Managers, Admins)
router.post('/verify', (0, auth_middleware_js_1.requireRole)(['owner', 'manager', 'admin']), trustPass_controller_js_1.verifyTrustPass);
// 3. Confirm Handover Check-In (Owners, Managers, Admins)
router.post('/check-in', (0, auth_middleware_js_1.requireRole)(['owner', 'manager', 'admin']), trustPass_controller_js_1.checkInTrustPass);
// 4. Confirm Return Check-Out (Owners, Managers, Admins)
router.post('/check-out', (0, auth_middleware_js_1.requireRole)(['owner', 'manager', 'admin']), trustPass_controller_js_1.checkOutTrustPass);
// 5. Complete Transaction Lifecycle History
router.get('/history/:bookingId', trustPass_controller_js_1.getTrustPassHistory);
exports.default = router;
