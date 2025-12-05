const { processSingleImage, discoverImages, CONFIG } = require('./process-wod-images');
const { ImageProcessor } = require('./utils/image-processor');
const { IMAGE_CONFIG } = require('./config/image-config');
const path = require('path');

/**
 * Test script to process a single image first
 */
async function testSingleImage() {
  try {
    console.log('🧪 Testing single image processing...\n');

    // Show configuration
    console.log('📋 Configuration:');
    console.log(`   Resizing: ${CONFIG.resizeEnabled ? 'ENABLED' : 'DISABLED'}`);
    if (CONFIG.resizeEnabled) {
      console.log(`   Max Width: ${IMAGE_CONFIG.resize.maxWidth}px`);
      console.log(`   Quality: ${IMAGE_CONFIG.resize.quality}%`);
      console.log(`   Resized Dir: ${IMAGE_CONFIG.paths.resizedDir}`);
    }
    console.log(`   Input Dir: ${CONFIG.inputDir}`);
    console.log(`   Output Dir: ${CONFIG.outputDir}\n`);

    // Discover available images
    const imageFiles = await discoverImages(CONFIG.inputDir, CONFIG.imageExtensions);
    
    if (imageFiles.length === 0) {
      console.error('❌ No images found to test with');
      process.exit(1);
    }

    // Use the first image for testing
    const testImage = imageFiles[0];
    console.log(`📸 Testing with image: ${path.basename(testImage)}`);
    console.log(`📍 Full path: ${testImage}\n`);

    // Test image processor if resizing is enabled
    if (CONFIG.resizeEnabled) {
      console.log('🔍 Testing image processor...');
      const imageProcessor = new ImageProcessor();
      
      try {
        const dimensions = await imageProcessor.getImageDimensions(testImage);
        console.log(`📏 Image dimensions: ${dimensions.width}x${dimensions.height}`);
        
        const needsResize = await imageProcessor.needsResizing(testImage);
        console.log(`🔄 Needs resizing: ${needsResize ? 'YES' : 'NO'}\n`);
      } catch (processorError) {
        console.warn(`⚠️  Image processor test failed: ${processorError.message}\n`);
      }
    }

    // Process the single image
    console.log('🔄 Starting single image test...\n');
    await processSingleImage(testImage);

    console.log('\n✅ Single image test completed successfully!');
    console.log('💡 If this worked, you can run the full batch with: npm start');

  } catch (error) {
    console.error('\n❌ Single image test failed:', error.message);
    console.error('💡 Common issues:');
    console.error('   - Missing OPENROUTER_API_KEY in .env file');
    console.error('   - No internet connection for API calls');
    console.error('   - Invalid API key or rate limiting');
    console.error('   - Image processing errors (if resizing enabled)');
    
    // Enhanced error details for 429 errors
    if (error.status === 429 || error.code === 429) {
      console.error('   - Rate limit exceeded (429 error)');
      console.error('   💡 Try waiting a few minutes before retrying');
      console.error('   💡 Check your OpenRouter plan limits');
      console.error('   💡 Consider reducing request frequency');
    }
    
    process.exit(1);
  }
}

// Run the test
testSingleImage();