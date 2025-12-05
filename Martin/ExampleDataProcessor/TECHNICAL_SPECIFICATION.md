# Technical Specification: WOD Image Processor

## 1. System Requirements

### 1.1 Node.js Version
- **Minimum**: Node.js 18.0.0
- **Recommended**: Node.js 20.0.0 or higher
- **Reason**: Async/await support, fs/promises module, modern JavaScript features

### 1.2 Dependencies

#### Runtime Dependencies
```json
{
  "openai": "^4.28.0",
  "dotenv": "^16.4.5"
}
```

#### Development Dependencies (Optional)
```json
{
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

### 1.3 External API Requirements
- **OpenRouter API Key**: Required for accessing Gemini 2.5
- **Model**: `google/gemini-2.5-flash` (paid) or `google/gemini-2.0-flash-exp:free` (free alternative)
- **Rate Limits**: Subject to OpenRouter API limits
- **Network**: Internet connection required for API calls

## 2. File System Structure

### 2.1 Directory Layout
```
Martin/ExampleDataProcessor/
├── ExampleData/                    # Input directory
│   ├── [40 JPG images]            # Workout whiteboard images
│   └── exercises.json             # Exercise database (reference)
├── output/                        # Output directory (created at runtime)
│   └── [Generated JSON files]     # Processed WOD data
├── process-wod-images.js          # Main script
├── package.json                   # Project configuration
├── .env                          # Environment variables
├── .env.example                   # Template file
├── README.md                     # Documentation
├── IMPLEMENTATION_PLAN.md         # Implementation details
├── ARCHITECTURE_DIAGRAM.md        # Architecture diagrams
└── TECHNICAL_SPECIFICATION.md     # This file
```

### 2.2 File Naming Convention
- **Input**: `559670021_10236818678059602_2493712820672261834_n.jpg`
- **Output**: `559670021_10236818678059602_2493712820672261834_n.json`
- **Pattern**: Same basename, different extension

## 3. API Integration

### 3.1 OpenRouter Configuration
```javascript
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://github.com/your-repo',
    'X-Title': 'WOD Image Processor'
  }
});
```

### 3.2 Request Structure
```javascript
const request = {
  model: 'google/gemini-2.5-flash', // or 'google/gemini-2.0-flash-exp:free' for free alternative
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
};
```

### 3.3 Response Format
```javascript
const response = {
  id: 'chatcmpl-xxx',
  choices: [
    {
      message: {
        content: '{"workout":{"date":"2024-01-15","type":"AMRAP","duration":20,"exercises":[{"name":"Thruster","reps":15,"weight":"45/35 lbs"},{"name":"Pull-up","reps":12,"weight":"bodyweight"}]}}',
        role: 'assistant'
      }
    }
  ],
  usage: {
    prompt_tokens: 1000,
    completion_tokens: 500,
    total_tokens: 1500
  }
};
```

## 4. Data Processing Pipeline

### 4.1 Image Processing Flow
1. **File Discovery**: Recursively scan `ExampleData/` for image files
2. **File Filtering**: Accept `.jpg`, `.jpeg`, `.png`, `.gif` extensions
3. **Image Reading**: Read file from disk using `fs.promises.readFile()`
4. **Base64 Encoding**: Convert binary data to base64 string
5. **Size Validation**: Check file size (optional optimization)
6. **API Request**: Send to OpenRouter with Gemini 2.5
7. **Response Parsing**: Extract JSON from AI response
8. **Validation**: Verify JSON structure and content
9. **File Saving**: Write to `output/` directory with matching name

### 4.2 Error Handling Strategy
```javascript
try {
  // Process image
  const result = await processImage(imagePath);
  await saveResult(imagePath, result);
  console.log(`✅ ${path.basename(imagePath)}`);
} catch (error) {
  console.error(`❌ ${path.basename(imagePath)}: ${error.message}`);
  throw error; // Stop execution on first error
}
```

### 4.3 Validation Rules
- **API Key**: Must exist in environment variables
- **Input Directory**: Must exist and contain images
- **Output Directory**: Created if it doesn't exist
- **JSON Response**: Must be valid JSON format
- **File Permissions**: Must have read/write access

## 5. Performance Considerations

### 5.1 Memory Management
- **Sequential Processing**: Process one image at a time
- **Stream Processing**: Don't load all images into memory
- **Base64 Optimization**: Consider image compression for large files
- **Garbage Collection**: Allow Node.js to clean up between images

### 5.2 API Rate Limiting
- **Sequential Requests**: One API call at a time
- **Retry Logic**: Optional retry for failed requests (not implemented)
- **Rate Limit Awareness**: Monitor OpenRouter API limits
- **Caching**: Not implemented (first version)

### 5.3 Processing Time Estimates
- **Image Upload**: ~2-5 seconds per image
- **AI Processing**: ~5-15 seconds per image
- **Total Time**: ~7-20 seconds per image
- **Batch Time**: ~47-80 minutes for 40 images

## 6. Security Considerations

### 6.1 API Key Security
- **Environment Variables**: Store in `.env` file
- **Git Ignore**: Never commit `.env` to version control
- **Access Control**: Limit file permissions
- **Rotation**: Support for API key rotation

### 6.2 Input Validation
- **File Type**: Validate image file extensions
- **File Size**: Optional size limits
- **Path Traversal**: Use `path.resolve()` for security
- **Content Validation**: Verify JSON response format

### 6.3 Error Handling
- **Information Disclosure**: Don't expose sensitive data in errors
- **Logging**: Secure error logging without credentials
- **Graceful Degradation**: Handle API failures appropriately

## 7. Testing Strategy

### 7.1 Unit Tests
- **Image Discovery**: Test file scanning functionality
- **Base64 Encoding**: Verify image conversion
- **API Client**: Mock OpenRouter responses
- **JSON Parsing**: Test response validation

### 7.2 Integration Tests
- **Single Image Test**: Process one image end-to-end
- **Error Scenarios**: Test API failures
- **File Operations**: Test directory creation and file saving

### 7.3 Performance Tests
- **Memory Usage**: Monitor during processing
- **API Response Time**: Track OpenRouter latency
- **Concurrent Processing**: Future scalability testing

## 8. Deployment Considerations

### 8.1 Environment Setup
1. Install Node.js 18+ 
2. Clone repository
3. Install dependencies: `npm install`
4. Configure `.env` file with API key
5. Run script: `npm start`

### 8.2 Monitoring
- **Console Output**: Real-time processing status
- **Error Logging**: Capture and analyze failures
- **Performance Metrics**: Track processing times
- **API Usage**: Monitor OpenRouter consumption

### 8.3 Maintenance
- **API Key Rotation**: Update `.env` file as needed
- **Dependency Updates**: Regular npm package updates
- **Error Analysis**: Review and fix processing failures
- **Performance Optimization**: Monitor and improve as needed

## 9. Future Enhancements

### 9.1 Short-term Improvements
- **Progress Tracking**: Add progress bars
- **Batch Processing**: Concurrent image processing
- **Caching**: Skip already processed images
- **Confidence Scoring**: Evaluate OCR quality
- **Model Flexibility**: Support both paid and free model options with configuration

### 9.2 Long-term Features
- **Exercise Normalization**: Use `exercises.json` for standardization
- **Vector Embeddings**: Generate semantic embeddings
- **Qdrant Integration**: Store in vector database
- **Web Interface**: GUI for monitoring and control
- **Cloud Deployment**: Deploy to cloud platforms

## 10. Compliance and Standards

### 10.1 Code Standards
- **ESLint**: JavaScript linting
- **Prettier**: Code formatting
- **JSDoc**: Code documentation
- **Naming Conventions**: Consistent variable naming

### 10.2 Documentation Standards
- **README**: Clear setup and usage instructions
- **API Documentation**: OpenRouter integration details
- **Code Comments**: Inline explanations for complex logic
- **Architecture Diagrams**: Visual system representation

### 10.3 Data Privacy
- **No Data Storage**: Images not stored after processing
- **API Compliance**: Follow OpenRouter data policies
- **Local Processing**: All processing happens locally
- **No External Logging**: No data sent to third parties