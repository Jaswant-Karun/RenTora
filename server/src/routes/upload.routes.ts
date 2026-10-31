import { Router, Response } from 'express';
import { uploadEvidence } from '../middleware/upload.middleware.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.post(
  '/evidence',
  authenticate,
  (req: AuthenticatedRequest, res: Response): void => {
    uploadEvidence.array('photos', 5)(req, res, (err: any) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || 'File upload failed. Ensure images are JPG/PNG/WEBP under 5MB.',
        });
        return;
      }

      const files = req.files as Express.Multer.File[];
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
  }
);

export default router;
