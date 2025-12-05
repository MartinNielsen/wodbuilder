# Implementation Plan for WOD Image Processor

## 1. Package.json Configuration

```json
{
  "name": "wod-image-processor",
  "version": "1.0.0",
  "description": "Process workout whiteboard images using OpenRouter Gemini 2.5",
  "main": "process-wod-images.js",
  "scripts": {
    "start": "node process-wod-images.js",
    "test": "node test-single.js"
  },
  "keywords": ["wod", "crossfit", "ocr", "gemini", "openrouter"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "openai": "^4.28.0",
    "dotenv": "^16.4.5"
  }
}
```

## 2. Environment Configuration (.env)

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## 3. Main Script Architecture

### 3.1 Module Structure

```javascript
// process-wod-images.js
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  model: 'google/gemini-2.5-flash', // or 'google/gemini-2.0-flash-exp:free' for free alternative
  inputDir: path.join(__dirname, 'ExampleData'),
  outputDir: path.join(__dirname, 'output'),
  imageExtensions: ['.jpg', '.jpeg', '.png', '.gif']
};

// Core Functions
async function discoverImages(dir) {
  // Recursively find all image files
}

async function encodeImageToBase64(imagePath) {
  // Convert image to base64
}

async function processImageWithGemini(imagePath, base64Image) {
  // Send to OpenRouter API
  // Parse response
}

async function saveWodData(imagePath, wodData) {
  // Save JSON to output directory
}

async function main() {
  // Orchestrates the entire process
}
```

### 3.2 API Request Structure

```javascript
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: CONFIG.openRouterApiKey,
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/your-repo',
    'X-Title': 'WOD Image Processor'
  }
});

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
          Return ONLY the JSON object, no additional text before or after.`
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
```

### 3.3 Error Handling Strategy

```javascript
try {
  const result = await processImageWithGemini(imagePath, base64Image);
  await saveWodData(imagePath, result);
  console.log(`✅ Processed: ${path.basename(imagePath)}`);
} catch (error) {
  console.error(`❌ Failed to process ${path.basename(imagePath)}:`, error.message);
  throw error; // Stop execution on first error
}
```

## 4. File Naming Convention

- **Input**: `559670021_10236818678059602_2493712820672261834_n.jpg`
- **Output**: `559670021_10236818678059602_2493712820672261834_n.json`

## 5. Directory Structure

```
Martin/ExampleDataProcessor/
├── ExampleData/
│   ├── [40 JPG images]
│   └── exercises.json
├── output/
│   ├── [Generated JSON files]
├── process-wod-images.js
├── package.json
├── .env
└── README.md
```

## 6. Implementation Steps

1. **Create package.json** with dependencies
2. **Create .env** file with API key placeholder
3. **Implement image discovery** function
4. **Implement base64 encoding** function
5. **Configure OpenRouter API** client
6. **Create Gemini processing** function
7. **Implement output directory** creation
8. **Create JSON saving** function
9. **Add error handling** and logging
10. **Create main execution** flow
11. **Test with single image** first
12. **Process all images** sequentially

## 7. Testing Strategy

### 7.1 Single Image Test
```javascript
// test-single.js
const { processSingleImage } = require('./process-wod-images');

async function testSingle() {
  const testImage = 'ExampleData/559670021_10236818678059602_2493712820672261834_n.jpg';
  try {
    await processSingleImage(testImage);
    console.log('✅ Single image test passed');
  } catch (error) {
    console.error('❌ Single image test failed:', error);
  }
}
```

### 7.2 Validation Checks
- API key exists
- Input directory exists
- Output directory is created
- JSON response is valid
- Files are saved correctly

## 8. Performance Considerations

- **Sequential Processing**: Process one image at a time to avoid API rate limits
- **Memory Management**: Process images individually, don't load all into memory
- **API Rate Limits**: OpenRouter has rate limits, sequential processing helps avoid hitting them
- **Image Size**: Consider resizing large images to reduce API payload size

## 9. Future Enhancements

- **Progress Tracking**: Add progress bars for long processing jobs
- **Batch Processing**: Process multiple images concurrently (with rate limiting)
- **Caching**: Skip already processed images
- **Confidence Scoring**: Evaluate OCR quality and retry if low confidence
- **Exercise Normalization**: Use exercises.json to normalize exercise names
- **Vector Embeddings**: Generate embeddings for semantic search
- **Qdrant Integration**: Store results in vector database
- **Model Flexibility**: Support both paid and free model options with configuration

## 10. Security Considerations

- **API Key Protection**: Never commit .env file to version control
- **Input Validation**: Validate image files before processing
- **Output Sanitization**: Ensure JSON output is properly formatted
- **Error Handling**: Don't expose sensitive information in error messages