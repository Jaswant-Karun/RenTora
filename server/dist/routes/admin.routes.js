"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_js_1 = require("../controllers/admin.controller.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Strict RBAC Permission Guard: Exclusively accessible to system Administrators
router.use(auth_middleware_js_1.authenticate);
router.use((0, auth_middleware_js_1.requireRole)(['admin']));
// Overview Metrics
router.get('/overview', admin_controller_js_1.getAdminOverview);
// User Management
router.get('/users', admin_controller_js_1.getAdminUsers);
router.patch('/users/:id/role', admin_controller_js_1.updateAdminUserRole);
router.delete('/users/:id', admin_controller_js_1.deleteAdminUser);
// Resource Management
router.get('/resources', admin_controller_js_1.getAdminResources);
router.patch('/resources/:id', admin_controller_js_1.updateAdminResource);
router.delete('/resources/:id', admin_controller_js_1.deleteAdminResource);
// Institution Management
router.get('/institutions', admin_controller_js_1.getAdminInstitutions);
router.post('/institutions', admin_controller_js_1.createAdminInstitution);
// System Settings
router.get('/settings', admin_controller_js_1.getAdminSettings);
router.put('/settings', admin_controller_js_1.updateAdminSettings);
exports.default = router;
