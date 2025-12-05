# WOD Image Processor

A Node.js script that processes workout whiteboard images using OpenRouter's Gemini 2.5 vision model to extract and structure Workout of the Day (WOD) data.

## 🖼️ Image Resizing Feature

**NEW**: The processor now automatically resizes images to optimize for LLM processing!

### Key Features:
- **Smart Resizing**: Images are resized to a maximum width of 512px while preserving aspect ratio
- **Quality Optimization**: Maintains 85% JPEG quality for optimal OCR results
- **File Management**: Resized images are saved in `output/resized/` directory with clear naming
- **Performance**: Reduces API payload size while maintaining processing accuracy
- **Fallback Support**: Gracefully handles resizing failures and uses original images

### Resizing Details:
- **Original**: `workout.jpg` (e.g., 2048x1536)
- **Resized**: `workout_resized_512.jpg` (512x384)
- **JSON Output**: `workout.json` (unchanged format)

## Overview

This script:
1. Reads image files from `Martin/ExampleData` (supports JPG, JPEG, PNG, GIF)
2. **NEW**: Resizes large images to max 512px width for optimal processing
3. Sends resized images to Gemini 2.5 via OpenRouter API
4. Extracts WOD data from whiteboard text
5. Saves structured JSON output to `output/` directory
6. **NEW**: Saves resized images to `output/resized/` directory

## Architecture

### Components

1. **Image Discovery Module**
    - Recursively finds all image files in `ExampleData/`
    - Filters by supported formats (JPG, JPEG, PNG, GIF)
    - Returns array of image file paths

2. **Image Resizing Module** *(NEW)*
    - Checks if images need resizing (width > 512px)
    - Resizes while preserving aspect ratio
    - Converts all images to JPEG format for consistency
    - Saves resized images to `output/resized/` directory
    - Provides graceful fallback if resizing fails

3. **Image Processing Module**
    - Reads image files from disk (original or resized)
    - Converts images to base64 format (required for vision API)
    - Handles image encoding and size validation

4. **OpenRouter API Client**
    - Configures OpenRouter API with Gemini 2.5 model
    - Sends vision requests with resized images
    - Handles API responses and errors
    - Uses `google/gemini-2.0-flash-exp:free` model

5. **WOD Data Extractor**
    - Processes Gemini responses
    - Parses JSON output from AI
    - Validates extracted data structure
    - Allows Gemini to determine optimal schema

6. **Output Manager**
    - Creates `output/` and `output/resized/` directories
    - Saves JSON files with matching image names
    - Handles file naming and extension mapping

### Data Flow

```
[Image Files] → [Discovery] → [Resize Check] → [Resize if Needed]
     ↓              ↓             ↓              ↓
[File Paths] → [Process Image] → [Base64 Data] → [API Client]
     ↓              ↓             ↓              ↓
[Gemini 2.5] ← [API Request] ← [Encoded Image] ← [Resized Image]
     ↓              ↓             ↓              ↓
[JSON Data] → [Response Parsing] → [Validation] → [Output Manager]
     ↓
[JSON Files in output/]
[Resized Images in output/resized/]
```

## Technical Specifications

### Dependencies

- **openai**: OpenRouter API client (compatible with OpenAI SDK)
- **jimp**: Image processing library (NEW)
- **dotenv**: Environment variable loading from .env file
- **fs/promises**: File system operations
- **path**: Path manipulation utilities

### Configuration

- **API Key**: Loaded from `.env` file as `OPENROUTER_API_KEY`
- **Model**: `google/gemini-2.0-flash-exp:free`
- **Input Directory**: `Martin/ExampleDataProcessor/ExampleData/`
- **Output Directory**: `Martin/ExampleDataProcessor/output/`
- **Resized Directory**: `Martin/ExampleDataProcessor/output/resized/` (NEW)
- **Max Width**: 512px (NEW)
- **Image Quality**: 85% (NEW)

### Error Handling

- **API Errors**: Throws exception and stops execution
- **File Errors**: Throws exception for missing files or directories
- **JSON Errors**: Validates AI response format before saving

### WOD Data Schema

The script instructs Gemini 2.5 to determine the optimal JSON schema based on the whiteboard content. Expected fields may include:
- Exercise names and descriptions
- Repetitions, sets, weights
- Workout type (AMRAP, For Time, EMOM, etc.)
- Time caps or duration
- Scaling options
- Date information

## Usage

### Quick Start

1. **Install dependencies** (including new Jimp library):
   ```bash
   npm install
   ```

2. **Set up environment variables** in `.env`:
   ```bash
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Test image resizing** (recommended first):
   ```bash
   npm run test:resize
   ```

4. **Test with single image**:
   ```bash
   npm test
   ```

5. **Process all images**:
   ```bash
   npm start
   ```

### Configuration Options

You can customize the image resizing behavior using environment variables:

```bash
# Enable/disable image resizing (default: true)
ENABLE_IMAGE_RESIZING=true

# Maximum width for resized images (default: 512)
MAX_IMAGE_WIDTH=512

# JPEG quality percentage (default: 85)
IMAGE_QUALITY=85

# Custom output directory for resized images
RESIZED_OUTPUT_DIR=output/resized
```

### Output Structure

After processing, you'll find:

```
output/
├── workout1.json              # WOD data (original naming)
├── workout2.json              # WOD data (original naming)
└── resized/                   # NEW: Resized images
    ├── workout1_resized_512.jpg
    └── workout2_resized_512.jpg
```

### Monitoring Progress

The script provides detailed logging:

```
🚀 Starting WOD Image Processor...
✅ API key found
🖼️  Image resizing: ENABLED (max width: 512px)
📁 Resized images will be saved to: output/resized

📊 Processing 5 images...

🖼️  Processing image 1/5
🖼️  Processing: workout1.jpg
🔄 Resizing enabled, checking if workout1.jpg needs resizing...
📏 Resizing: 2048x1536 → 512x384
✅ Resized: workout1.jpg → workout1_resized_512.jpg
📊 Size reduction: 65.2% (2.1MB → 732KB)
📤 Sending workout1.jpg to Gemini 2.5...
✅ Successfully processed workout1.jpg
💾 Saved: workout1.json
✅ Completed processing: workout1.jpg
```

## Troubleshooting

### Common Issues

1. **"Jimp not found" error**:
   ```bash
   npm install jimp
   ```

2. **Resizing fails for some images**:
   - The script will gracefully fall back to using original images
   - Check image file formats and permissions
   - Enable debug logging with `DEBUG=true` environment variable

3. **Large file size reduction not as expected**:
   - Adjust `IMAGE_QUALITY` setting (lower = smaller files)
   - Consider reducing `MAX_IMAGE_WIDTH` for very large images

4. **API rate limiting**:
   - The script processes images sequentially to avoid this
   - Consider adding delays between requests if needed
   - Monitor API usage in your OpenRouter dashboard

### Performance Tips

- **For faster processing**: Disable resizing with `ENABLE_IMAGE_RESIZING=false`
- **For smaller files**: Reduce `IMAGE_QUALITY` to 75-80%
- **For better quality**: Increase `IMAGE_QUALITY` to 90-95%
- **For very large images**: Consider reducing `MAX_IMAGE_WIDTH` to 400-450px

## Future Enhancements

- Batch processing with progress tracking
- Confidence scoring for OCR results
- Exercise name normalization using exercises.json
- Vector embedding generation for semantic search
- Integration with Qdrant database
- **NEW**: Concurrent image processing with memory management
- **NEW**: Advanced caching to avoid reprocessing
- **NEW**: Visual quality comparison tools