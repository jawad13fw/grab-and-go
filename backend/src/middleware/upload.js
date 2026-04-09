import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { config } from '../config/config.js';

// Ensure upload directory exists
const uploadDir = config.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext : '.jpg';
    cb(null, `${nanoid(12)}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = config.ALLOWED_MIME_TYPES || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'), false);
  }
};

const maxSize = (config.MAX_FILE_SIZE_MB || 2) * 1024 * 1024;

export const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter,
});
