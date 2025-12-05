const Jimp = require('jimp');
const fs = require('fs').promises;
const path = require('path');
const { IMAGE_CONFIG } = require('../config/image-config');

/**
 * Image processing utility class
 * Handles image resizing, format conversion, and file management
 */
class ImageProcessor {
    /**
     * Check if image needs resizing based on width
     * @param {string} imagePath - Path to the image file
     * @returns {Promise<boolean>} True if image needs resizing
     */
    async needsResizing(imagePath) {
        try {
            const image = await Jimp.read(imagePath);
            return image.bitmap.width > IMAGE_CONFIG.resize.maxWidth;
        } catch (error) {
            console.error(`❌ Failed to read image ${imagePath}:`, error.message);
            return false;
        }
    }

    /**
     * Resize image to max width while preserving aspect ratio
     * @param {string} imagePath - Path to the original image
     * @param {string} outputPath - Path to save the resized image
     * @returns {Promise<void>}
     */
    async resizeImage(imagePath, outputPath) {
        let image = null;
        
        try {
            console.log(`🖼️  Processing: ${path.basename(imagePath)}`);
            
            // Load image
            image = await Jimp.read(imagePath);
            
            // Check if resizing is needed
            if (image.bitmap.width <= IMAGE_CONFIG.resize.maxWidth) {
                console.log(`ℹ️  ${path.basename(imagePath)} already within size limits, copying...`);
                // Copy original file since no resizing needed
                await fs.copyFile(imagePath, outputPath);
                return;
            }
            
            // Calculate new dimensions maintaining aspect ratio
            const originalWidth = image.bitmap.width;
            const originalHeight = image.bitmap.height;
            const scaleFactor = IMAGE_CONFIG.resize.maxWidth / originalWidth;
            const newHeight = Math.round(originalHeight * scaleFactor);
            
            console.log(`📏 Resizing: ${originalWidth}x${originalHeight} → ${IMAGE_CONFIG.resize.maxWidth}x${newHeight}`);
            
            // Resize with aspect ratio preservation
            image.resize(IMAGE_CONFIG.resize.maxWidth, Jimp.AUTO);
            
            // Set quality for JPEG output
            if (IMAGE_CONFIG.resize.format === 'jpeg') {
                image.quality(IMAGE_CONFIG.resize.quality);
            }
            
            // Save resized image
            await image.writeAsync(outputPath);
            console.log(`✅ Resized: ${path.basename(imagePath)} → ${path.basename(outputPath)}`);
            
        } catch (error) {
            console.error(`❌ Failed to resize ${imagePath}:`, error.message);
            throw error;
        } finally {
            // Clean up memory
            if (image) {
                try {
                    image.bitmap.data = null;
                    image = null;
                } catch (cleanupError) {
                    console.warn(`⚠️  Failed to clean up image memory:`, cleanupError.message);
                }
            }
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
        }
    }

    /**
     * Generate resized image path based on original
     * @param {string} originalPath - Path to original image
     * @returns {string} Path for resized image
     */
    getResizedImagePath(originalPath) {
        const dir = IMAGE_CONFIG.paths.resizedDir;
        const name = path.basename(originalPath, path.extname(originalPath));
        const ext = '.jpg'; // Always convert to JPEG for consistency
        return path.join(dir, `${name}${IMAGE_CONFIG.resize.suffix}${ext}`);
    }

    /**
     * Ensure resized directory exists
     * @returns {Promise<void>}
     */
    async ensureResizedDir() {
        try {
            await fs.mkdir(IMAGE_CONFIG.paths.resizedDir, { recursive: true });
            console.log(`📁 Resized images directory: ${IMAGE_CONFIG.paths.resizedDir}`);
        } catch (error) {
            console.error(`❌ Failed to create resized directory:`, error.message);
            throw error;
        }
    }

    /**
     * Get the path to process (resized if available, otherwise original)
     * @param {string} imagePath - Original image path
     * @returns {Promise<string>} Path to the image to process
     */
    async getProcessedImagePath(imagePath) {
        if (!IMAGE_CONFIG.resize.enabled) {
            console.log(`⏭️  Resizing disabled, using original: ${path.basename(imagePath)}`);
            return imagePath;
        }
        
        try {
            // Ensure resized directory exists
            await this.ensureResizedDir();
            
            const resizedPath = this.getResizedImagePath(imagePath);
            
            // Check if we need to resize
            const needsResize = await this.needsResizing(imagePath);
            
            if (needsResize) {
                console.log(`🔄 Resizing required for ${path.basename(imagePath)}`);
                await this.resizeImage(imagePath, resizedPath);
            } else {
                console.log(`ℹ️  ${path.basename(imagePath)} already within size limits`);
                // Copy to resized directory for consistency
                await fs.copyFile(imagePath, resizedPath);
            }
            
            return resizedPath;
            
        } catch (resizeError) {
            console.warn(`⚠️  Resizing failed for ${path.basename(imagePath)}, using original:`, resizeError.message);
            console.warn(`💡 This won't affect processing, but may use more API bandwidth`);
            
            // Fallback: copy original to resized directory
            try {
                await this.ensureResizedDir();
                const resizedPath = this.getResizedImagePath(imagePath);
                await fs.copyFile(imagePath, resizedPath);
                return resizedPath;
            } catch (fallbackError) {
                console.error(`❌ Fallback also failed, using original path:`, fallbackError.message);
                return imagePath;
            }
        }
    }

    /**
     * Get image dimensions without loading full image into memory
     * @param {string} imagePath - Path to image file
     * @returns {Promise<{width: number, height: number}>} Image dimensions
     */
    async getImageDimensions(imagePath) {
        try {
            const image = await Jimp.read(imagePath);
            return {
                width: image.bitmap.width,
                height: image.bitmap.height
            };
        } catch (error) {
            console.error(`❌ Failed to get dimensions for ${imagePath}:`, error.message);
            throw error;
        }
    }

    /**
     * Calculate file size reduction after resizing
     * @param {string} originalPath - Path to original image
     * @param {string} resizedPath - Path to resized image
     * @returns {Promise<{original: number, resized: number, reduction: number}>}
     */
    async calculateSizeReduction(originalPath, resizedPath) {
        try {
            const originalStats = await fs.stat(originalPath);
            const resizedStats = await fs.stat(resizedPath);
            
            const originalSize = originalStats.size;
            const resizedSize = resizedStats.size;
            const reduction = ((originalSize - resizedSize) / originalSize) * 100;
            
            return {
                original: originalSize,
                resized: resizedSize,
                reduction: reduction
            };
        } catch (error) {
            console.error(`❌ Failed to calculate size reduction:`, error.message);
            return { original: 0, resized: 0, reduction: 0 };
        }
    }
}

module.exports = { ImageProcessor };