import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { config } from '../config/config.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 2MB.',
        });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Upload failed',
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Use field name "image".',
      });
    }
    const relativePath = `/uploads/${req.file.filename}`;
    const url = `${config.API_BASE_URL}${relativePath}`;
    return res.json({ success: true, url });
  });
});

export default router;
