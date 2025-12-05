# WOD Image Processor - Usage Guide

## Quick Start

### 1. Install Dependencies
```bash
cd Martin/ExampleDataProcessor
npm install
```

### 2. Configure API Key
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file and add your OpenRouter API key
nano .env
```

Add your API key:
```env
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

### 3. Test with Single Image
```bash
npm run test
```

### 4. Process All Images
```bash
npm start
```

## What the Script Does

1. **Discovers Images**: Scans `ExampleData/` directory for JPG files
2. **Processes Each Image**: Sends to Gemini 2.5 via OpenRouter API
3. **Extracts WOD Data**: AI reads whiteboard text and structures the data
4. **Saves JSON**: Creates JSON files in `output/` directory with matching names

## Expected Output

For each image like `559670021_10236818678059602_2493712820672261834_n.jpg`, 
the script creates: `output/559670021_10236818678059602_2493712820672261834_n.json`

## Example JSON Output

The AI determines the optimal schema based on the whiteboard content. 
Example structure:

```json
{
  "workout": {
    "date": "2024-01-15",
    "type": "AMRAP",
    "duration": 20,
    "rounds": null,
    "exercises": [
      {
        "name": "Thruster",
        "reps": 15,
        "weight": "45/35 lbs",
        "equipment": "barbell",
        "muscles": ["quadriceps", "shoulders", "glutes"]
      },
      {
        "name": "Pull-up",
        "reps": 12,
        "weight": "bodyweight",
        "equipment": "pull-up bar",
        "muscles": ["biceps", "back", "shoulders"]
      }
    ],
    "notes": "Scale: Reduce weight or use resistance bands for pull-ups"
  }
}
```

## Command Reference

### npm Commands
- `npm install` - Install dependencies
- `npm start` - Process all images
- `npm run test` - Test with single image

### Direct Node Commands
- `node process-wod-images.js` - Run main script
- `node test-single-image.js` - Run single image test

## Troubleshooting

### Common Errors

**Error**: `OPENROUTER_API_KEY environment variable is required`
**Solution**: Set your API key in `.env` file

**Error**: `No image files found`
**Solution**: Ensure `ExampleData/` directory exists with JPG files

**Error**: `Failed to parse JSON response`
**Solution**: The AI may have returned invalid JSON. Check the console output for the raw response.

**Error**: `API call failed`
**Solution**: Check internet connection and API key validity

### Debug Mode

For detailed debugging, add console.log statements or use:
```bash
node --inspect process-wod-images.js
```

## Performance Notes

- **Processing Time**: ~7-20 seconds per image
- **Total Time**: ~47-80 minutes for 40 images
- **Memory Usage**: Low (sequential processing)
- **API Rate Limits**: Respects OpenRouter limits

## File Structure

```
Martin/ExampleDataProcessor/
├── ExampleData/              # Input images (40 JPG files)
├── output/                   # Generated JSON files
├── node_modules/             # Dependencies
├── process-wod-images.js     # Main script
├── test-single-image.js      # Test script
├── package.json              # Project config
├── .env                      # API key (not committed)
├── .env.example              # Template
├── .gitignore               # Ignore rules
└── [Documentation files]     # README, guides, etc.
```

## Security Notes

- **API Key Protection**: Store in `.env` file, never commit to git
- **File Permissions**: Use `chmod 600 .env` for security
- **No Data Storage**: Images not stored after processing
- **Local Processing**: All processing happens locally

## Next Steps

After successful processing:

1. **Review Output**: Check `output/` directory for JSON files
2. **Validate Data**: Verify the extracted WOD data is correct
3. **Integration**: Use the JSON data in your applications
4. **Enhancements**: Consider adding exercise normalization or vector embeddings

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your OpenRouter API key
3. Ensure internet connectivity
4. Check console output for detailed error messages
5. Review the documentation files in this directory

## Future Enhancements

Potential improvements for future versions:

- Progress tracking with progress bars
- Concurrent processing with rate limiting
- Caching to skip already processed images
- Confidence scoring for OCR quality
- Exercise name normalization using exercises.json
- Vector embedding generation for semantic search
- Qdrant database integration
- Web interface for monitoring