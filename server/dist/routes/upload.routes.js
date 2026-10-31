"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_middleware_js_1 = require("../middleware/upload.middleware.js");
const auth_middleware_js_1 = require("../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
router.post('/evidence', auth_middleware_js_1.authenticate, (req, res) => {
    upload_middleware_js_1.uploadEvidence.array('photos', 5)(req, res, (err) => {
        if (err) {
            res.status(400).json({
                success: false,
                message: err.message || 'File upload failed. Ensure images are JPG/PNG/WEBP under 5MB.',
            });
            return;
        }
        const files = req.files;
        if (!files || files.length === 0) {
            res.status(400).json({
                success: false,
                message: 'Missing evidence: No photographic files were uploaded.',
            });
            return;
        }
        // Generate paths
        const fileUrls = files.map((f) => `/uploads/condition-evidence/${f.filename}`);
        res.status(200).json({
            success: true,
            message: `Successfully validated and stored ${files.length} evidence image(s).`,
            data: {
                urls: fileUrls,
                count: files.length,
                files: files.map((f) => ({
                    filename: f.filename,
                    size: f.size,
                    mimetype: f.mimetype,
                    url: `/uploads/condition-evidence/${f.filename}`,
                })),
            },
        });
    });
});
exports.default = router;
