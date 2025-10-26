import sharp from "sharp";
import fs from "fs";
import path from "path";

// Image processing configurations
const IMAGE_CONFIGS = {
  product: {
    card: { width: 300, height: 200, ratio: "3:2" },
    detail: { width: 400, height: 400, ratio: "1:1" },
  },
  menu: {
    card: { width: 300, height: 200, ratio: "3:2" },
    detail: { width: 600, height: 400, ratio: "3:2" },
  },
  category: {
    card: { width: 200, height: 150, ratio: "4:3" },
  },
  subcategory: {
    card: { width: 200, height: 150, ratio: "4:3" },
  },
};

//Process and resize image for different use cases

export const processImage = async (originalPath, type, filename) => {
  try {
    const config = IMAGE_CONFIGS[type];
    if (!config) {
      throw new Error(`Unsupported image type: ${type}`);
    }

    const results = {};
    const baseDir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const nameWithoutExt = path.basename(filename, ext);

    // Process each size variant
    for (const [variant, sizeConfig] of Object.entries(config)) {
      const outputFilename = `${nameWithoutExt}_${variant}${ext}`;
      const outputPath = path.join(baseDir, outputFilename);

      // Get original image dimensions
      const metadata = await sharp(originalPath).metadata();
      const originalWidth = metadata.width;
      const originalHeight = metadata.height;

      // Calculate scale factor to fit within target dimensions
      const scaleX = sizeConfig.width / originalWidth;
      const scaleY = sizeConfig.height / originalHeight;
      const scale = Math.min(scaleX, scaleY);

      const newWidth = Math.round(originalWidth * scale);
      const newHeight = Math.round(originalHeight * scale);

      // Resize to calculated dimensions - no fit parameter, no background
      await sharp(originalPath)
        .resize(newWidth, newHeight)
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      results[variant] = {
        filename: outputFilename,
        path: outputPath,
        url: `/uploads/${outputFilename}`,
        width: sizeConfig.width,
        height: sizeConfig.height,
        ratio: sizeConfig.ratio,
      };
    }

    return results;
  } catch (error) {
    throw error;
  }
};

//Get image URLs for frontend
export const getImageUrls = (type, baseFilename) => {
  const config = IMAGE_CONFIGS[type];
  if (!config) {
    return null;
  }

  const results = {};
  const ext = path.extname(baseFilename);
  const nameWithoutExt = path.basename(baseFilename, ext);

  for (const [variant, sizeConfig] of Object.entries(config)) {
    const filename = `${nameWithoutExt}_${variant}${ext}`;
    results[variant] = {
      url: `/uploads/${filename}`,
      width: sizeConfig.width,
      height: sizeConfig.height,
      ratio: sizeConfig.ratio,
    };
  }

  return results;
};

//Clean up old image variants when updating

export const cleanupOldImages = async (type, baseFilename, uploadsDir) => {
  try {
    const config = IMAGE_CONFIGS[type];
    if (!config) {
      return;
    }

    const ext = path.extname(baseFilename);
    const nameWithoutExt = path.basename(baseFilename, ext);

    for (const variant of Object.keys(config)) {
      const filename = `${nameWithoutExt}_${variant}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    throw error;
  }
};
