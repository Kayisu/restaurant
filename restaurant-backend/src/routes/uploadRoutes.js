import express from 'express';
import { uploadSingleImage, handleUploadError } from '../middlewares/uploadMiddleware.js';
import { uploadImage, getImageInfo } from '../controllers/uploadController.js';
import { verifyToken } from '../middlewares/authentication.js';

const router = express.Router();

// Upload single image
router.post('/image', 
  verifyToken, // Require authentication
  uploadSingleImage,
  handleUploadError,
  uploadImage
);

// Get image info
router.get('/image/:filename', 
  verifyToken, // Require authentication
  getImageInfo
);

export default router;
