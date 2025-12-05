const { processSingleImage, discoverImages, CONFIG } = require('./process-wod-images');
const path = require('path');

/**
 * Test script to process a single image first
 */
async function testSingleImage() {
  try {
    console.log('🧪 Testing single image processing...\n');

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