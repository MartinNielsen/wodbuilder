# WOD Image Processor

A Node.js script that processes workout whiteboard images using OpenRouter's Gemini 2.5 vision model to extract and structure Workout of the Day (WOD) data.

## Overview

This script:
1. Reads JPG images from `Martin/ExampleData`
2. Sends each image to Gemini 2.5 via OpenRouter API
3. Extracts WOD data from whiteboard text
4. Saves structured JSON output to `output/` directory

## Architecture

### Components

1. **Image Discovery Module**
   - Recursively finds all `.jpg` files in `ExampleData/`
   - Filters out non-image files
   - Returns array of image file paths

2. **Image Processing Module**
   - Reads image files from disk
   - Converts images to base64 format (required for vision API)
   - Handles image encoding and size validation

3. **OpenRouter API Client**
   - Configures OpenRouter API with Gemini 2.5 model
   - Sends vision requests with images
   - Handles API responses and errors
   - Uses `google/gemini-2.0-flash-exp:free` model

4. **WOD Data Extractor**
   - Processes Gemini responses
   - Parses JSON output from AI
   - Validates extracted data structure
   - Allows Gemini to determine optimal schema

5. **Output Manager**
   - Creates `output/` directory if it doesn't exist
   - Saves JSON files with matching image names
   - Handles file naming and extension mapping

### Data Flow

```
[Image Files] → [Discovery] → [Processing] → [API Client] → [Gemini 2.5]
     ↓              ↓             ↓              ↓              ↓
[File Paths] → [Base64 Data] → [API Request] → [AI Response] → [JSON Data]
     ↓              ↓             ↓              ↓              ↓
[Output Manager] ← [Error Handling] ← [Response Parsing] ← [API Response]
     ↓
[JSON Files in output/]
```

## Technical Specifications

### Dependencies

- **openai**: OpenRouter API client (compatible with OpenAI SDK)
- **dotenv**: Environment variable loading from .env file
- **fs/promises**: File system operations
- **path**: Path manipulation utilities

### Configuration

- **API Key**: Loaded from `.env` file as `OPENROUTER_API_KEY`
- **Model**: `google/gemini-2.0-flash-exp:free`
- **Input Directory**: `Martin/ExampleDataProcessor/ExampleData/`
- **Output Directory**: `Martin/ExampleDataProcessor/output/`

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

1. Set up environment variables in `.env`
2. Run the script: `node process-wod-images.js`
3. Check `output/` directory for generated JSON files

## Future Enhancements

- Batch processing with progress tracking
- Confidence scoring for OCR results
- Exercise name normalization using exercises.json
- Vector embedding generation for semantic search
- Integration with Qdrant database