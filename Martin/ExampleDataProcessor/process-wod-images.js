const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { ImageProcessor } = require('./utils/image-processor');
const { IMAGE_CONFIG } = require('./config/image-config');

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  model: 'google/gemini-2.5-flash',
  inputDir: IMAGE_CONFIG.paths.inputDir,
  outputDir: IMAGE_CONFIG.paths.outputDir,
  imageExtensions: IMAGE_CONFIG.formats,
  resizeEnabled: IMAGE_CONFIG.resize.enabled
};

/**
 * Discover all image files in the input directory
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to look for
 * @returns {Promise<string[]>} Array of image file paths
 */
async function discoverImages(dir, extensions) {
  try {
    console.log(`🔍 Scanning directory: ${dir}`);
    const files = await fs.readdir(dir);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return extensions.includes(ext);
    });
    
    console.log(`✅ Found ${imageFiles.length} image files`);
    return imageFiles.map(file => path.join(dir, file));
  } catch (error) {
    console.error('❌ Failed to discover images:', error.message);
    throw error;
  }
}

/**
 * Encode image file to base64 string
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} Base64 encoded image
 */
async function encodeImageToBase64(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error(`❌ Failed to read image ${imagePath}:`, error.message);
    throw error;
  }
}

/**
 * Process image with Gemini 2.5 via OpenRouter API
 * @param {string} imagePath - Path to the image file
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} Parsed WOD data
 */
async function processImageWithGemini(imagePath, base64Image) {
  try {
    // Initialize OpenRouter client
    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: CONFIG.openRouterApiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/your-repo',
        'X-Title': 'WOD Image Processor'
      }
    });

    console.log(`📤 Sending ${path.basename(imagePath)} to Gemini 2.5...`);

    // Create the API request
    const response = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this whiteboard image and extract the Workout of the Day (WOD) data. 
              This is a CrossFit-style workout. Please provide the data in a structured JSON format.
              Focus on extracting:
              - Exercise names and details
              - Repetitions, sets, weights
              - Workout type (AMRAP, For Time, EMOM, etc.)
              - Time caps or duration
              - Any scaling options or notes
              
              Determine the most appropriate JSON schema based on what you read from the whiteboard.
              Return ONLY the JSON object, no additional text before or after.
              Keep in mind that the instructor is danish and will be mixing danish and english. And uses a lot of abbreviations.
              Do your best to interpret the content and abbreviations accurately and in context of being a crossfit class WOD.
              Only use english for the JSON keys and values.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ]
    });

    // Extract the response content
    const content = response.choices[0].message.content;
    
    // Parse the JSON response (handle markdown code block wrapper)
    let wodData;
    try {
      // Remove markdown code block wrapper if present
      let jsonContent = content;
      if (content.startsWith('```json') && content.endsWith('```')) {
        jsonContent = content.slice(7, -3).trim(); // Remove ```json and ```
      }
      wodData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error(`❌ Failed to parse JSON response for ${path.basename(imagePath)}:`, parseError.message);
      console.error('Raw response:', content);
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
    }

    console.log(`✅ Successfully processed ${path.basename(imagePath)}`);
    return wodData;

  } catch (error) {
    // Enhanced error handling for 429 and other API errors
    if (error.status === 429 || error.code === 429) {
      console.error(`❌ Single image test failed: 429 Provider returned error`);
      console.error(`   Image: ${path.basename(imagePath)}`);
      console.error(`   Error details: ${error.message}`);
      
      // Try to extract more details from the error object
      if (error.response) {
        console.error(`   Response status: ${error.response.status}`);
        console.error(`   Response headers:`, JSON.stringify(error.response.headers, null, 2));
        if (error.response.data) {
          console.error(`   Response body:`, JSON.stringify(error.response.data, null, 2));
        }
      }
      
      // Check for rate limiting headers
      if (error.response && error.response.headers) {
        const headers = error.response.headers;
        const rateLimitHeaders = [
          'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset',
          'retry-after', 'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests'
        ];
        
        console.error(`   Rate limit information:`);
        rateLimitHeaders.forEach(header => {
          if (headers[header]) {
            console.error(`     ${header}: ${headers[header]}`);
          }
        });
      }
      
      // Provide actionable advice
      console.error(`   💡 Possible solutions:`);
      console.error(`     - Wait a few minutes and try again (rate limit exceeded)`);
      console.error(`     - Check your OpenRouter plan limits`);
      console.error(`     - Reduce the number of concurrent requests`);
      console.error(`     - Contact OpenRouter support if issue persists`);
    } else {
      console.error(`❌ Failed to process ${path.basename(imagePath)}:`, error.message);
    }
    throw error;
  }
}

/**
 * Save WOD data to JSON file
 * @param {string} imagePath - Original image path
 * @param {Object} wodData - Processed WOD data
 * @returns {Promise<void>}
 */
async function saveWodData(imagePath, wodData) {
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(CONFIG.outputDir, { recursive: true });

    // Generate output filename (same as image but with .json extension)
    const imageName = path.basename(imagePath, path.extname(imagePath));
    const outputFileName = `${imageName}.json`;
    const outputPath = path.join(CONFIG.outputDir, outputFileName);

    // Save the JSON file
    await fs.writeFile(outputPath, JSON.stringify(wodData, null, 2), 'utf8');
    console.log(`💾 Saved: ${outputFileName}`);
  } catch (error) {
    console.error(`❌ Failed to save ${path.basename(imagePath)}:`, error.message);
    throw error;
  }
}

/**
 * Process a single image file with optional resizing
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<void>}
 */
async function processSingleImage(imagePath) {
  let imageToProcess = imagePath;
  
  try {
    console.log(`\n🖼️  Processing image: ${path.basename(imagePath)}`);
    
    // Resize image if enabled and needed
    if (CONFIG.resizeEnabled) {
      const imageProcessor = new ImageProcessor();
      
      console.log(`🔄 Resizing enabled, checking if ${path.basename(imagePath)} needs resizing...`);
      
      // Get the path to the processed image (resized or original)
      imageToProcess = await imageProcessor.getProcessedImagePath(imagePath);
      
      // Log size reduction if applicable
      if (imageToProcess !== imagePath) {
        try {
          const sizeInfo = await imageProcessor.calculateSizeReduction(imagePath, imageToProcess);
          if (sizeInfo.reduction > 0) {
            console.log(`📊 Size reduction: ${sizeInfo.reduction.toFixed(1)}% (${(sizeInfo.original/1024).toFixed(1)}KB → ${(sizeInfo.resized/1024).toFixed(1)}KB)`);
          }
        } catch (sizeError) {
          console.log(`📊 Could not calculate size reduction: ${sizeError.message}`);
        }
      }
    } else {
      console.log(`⏭️  Resizing disabled, using original image`);
    }
    
    // Encode image to base64
    const base64Image = await encodeImageToBase64(imageToProcess);
    
    // Process with Gemini 2.5
    const wodData = await processImageWithGemini(imagePath, base64Image);
    
    // Save the result
    await saveWodData(imagePath, wodData);
    
    console.log(`✅ Completed processing: ${path.basename(imagePath)}`);
    
  } catch (error) {
    console.error(`❌ Processing failed for ${path.basename(imagePath)}:`, error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting WOD Image Processor...\n');

    // Validate API key
    if (!CONFIG.openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required. Please set it in your .env file.');
    }
    console.log('✅ API key found');

    // Show resizing configuration
    if (CONFIG.resizeEnabled) {
      console.log(`🖼️  Image resizing: ENABLED (max width: ${IMAGE_CONFIG.resize.maxWidth}px)`);
      console.log(`📁 Resized images will be saved to: ${IMAGE_CONFIG.paths.resizedDir}`);
    } else {
      console.log(`🖼️  Image resizing: DISABLED`);
    }

    // Discover images
    const imageFiles = await discoverImages(CONFIG.inputDir, CONFIG.imageExtensions);
    
    if (imageFiles.length === 0) {
      throw new Error(`No image files found in ${CONFIG.inputDir}`);
    }

    console.log(`\n📊 Processing ${imageFiles.length} images...\n`);

    // Process each image sequentially
    for (let i = 0; i < imageFiles.length; i++) {
      const imagePath = imageFiles[i];
      console.log(`\n🖼️  Processing image ${i + 1}/${imageFiles.length}`);
      
      await processSingleImage(imagePath);
    }

    console.log(`\n🎉 Completed processing ${imageFiles.length} images!`);
    console.log(`📁 Output files saved to: ${CONFIG.outputDir}`);
    if (CONFIG.resizeEnabled) {
      console.log(`📁 Resized images saved to: ${IMAGE_CONFIG.paths.resizedDir}`);
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    
    // Enhanced error details for 429 errors
    if (error.status === 429 || error.code === 429) {
      console.error('💡 This appears to be a rate limiting issue (429 error)');
      console.error('💡 Try these solutions:');
      console.error('   - Wait 5-10 minutes before retrying');
      console.error('   - Process images in smaller batches');
      console.error('   - Check your OpenRouter account limits');
      console.error('   - Consider upgrading your plan if needed');
    }
    
    console.error('❌ Stopping execution due to error.');
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  processSingleImage,
  discoverImages,
  encodeImageToBase64,
  processImageWithGemini,
  saveWodData,
  CONFIG
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}