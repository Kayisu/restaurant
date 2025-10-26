import path from 'path';
import { fileURLToPath } from 'url';
import { processImage, getImageUrls } from '../utils/imageProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload single image with processing
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { type } = req.body; // product, menu, category, subcategory
    const originalPath = req.file.path;
    const filename = req.file.filename;

    // Auto-detect type if not provided
    let detectedType = type;
    if (!detectedType) {
      // Check if this is a product upload by looking at the request path or referer
      const referer = req.get('referer') || '';
      const path = req.path || '';
      
      if (referer.includes('/catalog') || path.includes('/catalog')) {
        detectedType = 'product';
    
      } else if (referer.includes('/menu') || path.includes('/menu')) {
        detectedType = 'menu';
     
      } else {
        detectedType = 'product'; // Default to product
    
      }
    }

    // Process image if type is specified
    let processedImages = null;
    if (detectedType && ['product', 'menu', 'category', 'subcategory'].includes(detectedType)) {
      try {
        processedImages = await processImage(originalPath, detectedType, filename);

      } catch (processError) {
     
        // Continue with original image if processing fails
      }
    }

    // Generate URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const originalUrl = `${baseUrl}/uploads/${filename}`;
    
    const responseData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      imageUrl: originalUrl,
      type: detectedType || 'original'
    };

    // Add processed image URLs if available
    if (processedImages) {
      responseData.processedImages = {};
      for (const [variant, imageData] of Object.entries(processedImages)) {
        responseData.processedImages[variant] = {
          url: `${baseUrl}${imageData.url}`,
          width: imageData.width,
          height: imageData.height,
          ratio: imageData.ratio
        };
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: responseData
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};

// Get image info (optional - for debugging)
export const getImageInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }

    // Check if file exists
    const fs = await import('fs');
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    try {
      const stats = fs.statSync(filePath);
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
      
      res.status(200).json({
        success: true,
        data: {
          filename: filename,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          imageUrl: imageUrl
        }
      });
    } catch (fileError) {
      res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to get image info',
    });
  }
};
