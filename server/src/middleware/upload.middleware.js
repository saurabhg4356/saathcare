import multer from 'multer';
import path from 'path';
import { ApiError } from '../utils/apiError.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Validate extension AND MIME type (never trust extension alone)
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        'Invalid file type. Only JPEG, PNG images and PDF documents up to 5MB are permitted.'
      ),
      false
    );
  }

  cb(null, true);
};

export const receiptUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
}).single('receipt');
