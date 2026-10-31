"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditLog_controller_js_1 = require("../controllers/auditLog.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.use(auth_middleware_js_1.authenticate);
// Read-only endpoint
router.get('/', auditLog_controller_js_1.getAuditLogs);
// Explicitly reject any modification attempts with policy violation responses
const rejectMutation = (_req, res) => {
    res.status(405).json({
        success: false,
        error: 'AUDIT_POLICY_VIOLATION',
        message: 'Institutional audit records are write-once, read-only immutable ledgers and cannot be altered or deleted via public APIs.',
    });
};
router.post('/', rejectMutation);
router.put('/*', rejectMutation);
router.patch('/*', rejectMutation);
router.delete('/*', rejectMutation);
exports.default = router;
