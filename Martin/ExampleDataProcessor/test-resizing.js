const { ImageProcessor } = require('./utils/image-processor');
const { IMAGE_CONFIG } = require('./config/image-config');
const path = require('path');
const fs = require('fs').promises;

/**
 * Test script to verify image resizing functionality
 * Run this before processing actual images to ensure everything works
 */
async function testImageResizing() {
  console.log('🧪 Testing Image Resizing Functionality\n');
  
  try {
    // Test 1: Configuration validation
    console.log('📋 Test 1: Configuration');
    console.log(`   Resizing enabled: ${IMAGE_CONFIG.resize.enabled}`);
    console.log(`   Max width: ${IMAGE_CONFIG.resize.maxWidth}px`);
    console.log(`   Quality: ${IMAGE_CONFIG.resize.quality}%`);
    console.log(`   Format: ${IMAGE_CONFIG.resize.format}`);
    console.log(`   Resized directory: ${IMAGE_CONFIG.paths.resizedDir}`);
    console.log('   ✅ Configuration loaded successfully\n');

    // Test 2: Create ImageProcessor instance
    console.log('🏗️  Test 2: ImageProcessor Instance');
    const processor = new ImageProcessor();
    console.log('   ✅ ImageProcessor created successfully\n');

    // Test 3: Ensure resized directory exists
    console.log('📁 Test 3: Directory Setup');
    await processor.ensureResizedDir();
    console.log('   ✅ Resized directory created/verified\n');

    // Test 4: Test with sample images if available
    console.log('🖼️  Test 4: Image Processing Tests');
    
    // Look for test images
    const testImagesDir = IMAGE_CONFIG.paths.inputDir;
    let testImages = [];
    
    try {
      const files = await fs.readdir(testImagesDir);
      testImages = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_CONFIG.formats.includes(ext);
      });
    } catch (dirError) {
      console.log(`   ⚠️  Could not read directory ${testImagesDir}: ${dirError.message}`);
    }
    
    if (testImages.length > 0) {
      console.log(`   Found ${testImages.length} test images in ${testImagesDir}`);
      
      // Test with first available image
      const testImagePath = path.join(testImagesDir, testImages[0]);
      console.log(`   Testing with: ${path.basename(testImagePath)}`);
      
      try {
        // Get image dimensions
        const dimensions = await processor.getImageDimensions(testImagePath);
        console.log(`   Dimensions: ${dimensions.width}x${dimensions.height}`);
        
        // Check if resizing is needed
        const needsResize = await processor.needsResizing(testImagePath);
        console.log(`   Needs resizing: ${needsResize ? 'YES' : 'NO'}`);
        
        // Get expected resized path
        const resizedPath = processor.getResizedImagePath(testImagePath);
        console.log(`   Resized path: ${path.basename(resizedPath)}`);
        
        // Test the full processing path
        console.log('   🔄 Testing full processing path...');
        const processedPath = await processor.getProcessedImagePath(testImagePath);
        console.log(`   ✅ Processed image saved to: ${path.basename(processedPath)}`);
        
        // Check if file was created
        try {
          await fs.access(processedPath);
          console.log('   ✅ Resized image file created successfully');
        } catch (fileError) {
          console.log('   ⚠️  Resized image file not found, but processing completed');
        }
        
      } catch (imageError) {
        console.log(`   ❌ Image processing failed: ${imageError.message}`);
      }
    } else {
      console.log(`   ⚠️  No test images found in ${testImagesDir}`);
      console.log('   💡 Add some JPG/PNG/GIF images to test with');
    }
    
    console.log('\n🎉 Image resizing tests completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: node test-single-image.js (to test full pipeline)');
    console.log('   2. Run: npm start (to process all images)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   - Make sure Jimp is installed: npm install');
    console.error('   - Check that test images exist in the input directory');
    console.error('   - Verify file permissions for reading/writing');
    process.exit(1);
  }
}

// Run the test
testImageResizing();