const path = require('path');

/**
 * Image processing configuration
 * All settings can be overridden via environment variables
 */
const IMAGE_CONFIG = {
    // Resizing settings
    resize: {
        enabled: process.env.ENABLE_IMAGE_RESIZING !== 'false',
        maxWidth: parseInt(process.env.MAX_IMAGE_WIDTH || '512', 10),
        quality: parseInt(process.env.IMAGE_QUALITY || '85', 10),
        suffix: process.env.IMAGE_SUFFIX || '_resized_512',
        format: process.env.IMAGE_FORMAT || 'jpeg'
    },
    
    // Directory paths
    paths: {
        inputDir: process.env.INPUT_DIR || path.join(__dirname, '..', 'ExampleData'),
        outputDir: process.env.OUTPUT_DIR || path.join(__dirname, '..', 'output'),
        resizedDir: process.env.RESIZED_OUTPUT_DIR || path.join(__dirname, '..', 'output', 'resized')
    },
    
    // Supported image formats
    formats: ['.jpg', '.jpeg', '.png', '.gif'],
    
    // Performance settings
    performance: {
        maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '3', 10),
        memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD || '500', 10) * 1024 * 1024, // 500MB
        cacheEnabled: process.env.ENABLE_CACHE !== 'false'
    }
};

module.exports = { IMAGE_CONFIG };