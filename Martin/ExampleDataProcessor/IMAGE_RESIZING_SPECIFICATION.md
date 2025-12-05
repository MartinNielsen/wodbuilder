# Image Resizing Feature Specification

## Overview

This document specifies the implementation of image resizing functionality to ensure all loaded JPG images are resized to a maximum width of 512px before being sent to the LLM for processing.

## Requirements

### Functional Requirements

1. **Image Resizing**: All input images must be resized to a maximum width of 512px
2. **Aspect Ratio Preservation**: Images must maintain their original aspect ratio
3. **Resized Image Storage**: Resized images must be saved in the output folder
4. **Naming Convention**: Resized images should be named based on the original image
5. **LLM Processing**: The resized image (not original) should be sent to the LLM
6. **Quality Preservation**: Maintain sufficient image quality for OCR processing

### Non-Functional Requirements

1. **Performance**: Resizing should not significantly impact overall processing time
2. **Memory Usage**: Efficient memory management during image processing
3. **Compatibility**: Support for JPG, JPEG, PNG, and GIF formats
4. **Error Handling**: Graceful handling of invalid or corrupted images

## Technical Design

### 1. Library Selection

**Jimp (JavaScript Image Manipulation Program)**
- Pure JavaScript implementation
- No native dependencies (easier installation)
- Supports multiple image formats
- Active maintenance and good documentation
- Suitable for server-side image processing

### 2. Resizing Algorithm

```javascript
// Resize logic
const maxWidth = 512;
const maxHeight = Infinity; // No height constraint, preserve aspect ratio

// Calculate new dimensions
if (originalWidth > maxWidth) {
    const scaleFactor = maxWidth / originalWidth;
    newWidth = maxWidth;
    newHeight = Math.round(originalHeight * scaleFactor);
} else {
    // Image already within size constraints
    newWidth = originalWidth;
    newHeight = originalHeight;
}
```

### 3. File Naming Strategy

**Option 1: Suffix-based naming**
- Original: `image.jpg`
- Resized: `image_resized_512.jpg`
- JSON: `image.json`

**Option 2: Subdirectory approach**
- Original: `ExampleData/image.jpg`
- Resized: `output/resized/image.jpg`
- JSON: `output/image.json`

**Recommended: Option 1** - Simpler file management and clearer naming

### 4. Integration Points

#### Current Workflow
```
Image File → encodeImageToBase64() → processImageWithGemini() → saveWodData()
```

#### Modified Workflow
```
Image File → resizeImageIfNeeded() → encodeImageToBase64() → processImageWithGemini() → saveWodData()
```

### 5. Module Structure

#### 5.1 resizeImageIfNeeded()
```javascript
/**
 * Resize image to max 512px width if needed
 * @param {string} imagePath - Path to original image
 * @returns {Promise<string>} Path to resized image (original or resized)
 */
async function resizeImageIfNeeded(imagePath) {
    // Check if image needs resizing
    // If yes: resize and save to output directory
    // If no: return original path
}
```

#### 5.2 createResizedImage()
```javascript
/**
 * Create resized version of image
 * @param {string} imagePath - Path to original image
 * @param {string} outputPath - Path to save resized image
 * @returns {Promise<void>}
 */
async function createResizedImage(imagePath, outputPath) {
    // Load image with Jimp
    // Resize to max 512px width
    // Save resized image
}
```

#### 5.3 getImageDimensions()
```javascript
/**
 * Get image dimensions without loading full image
 * @param {string} imagePath - Path to image file
 * @returns {Promise<{width: number, height: number}>}
 */
async function getImageDimensions(imagePath) {
    // Use Jimp to get image metadata
    // Return width and height
}
```

### 6. Error Handling

#### 6.1 Image Loading Errors
- Invalid file format
- Corrupted image files
- Permission issues

#### 6.2 Resizing Errors
- Memory allocation failures
- Unsupported image dimensions
- Disk space issues

#### 6.3 Fallback Strategy
- If resizing fails, attempt to process original image
- Log error details for debugging
- Continue processing other images

### 7. Performance Considerations

#### 7.1 Memory Management
- Process one image at a time
- Clear Jimp image objects from memory
- Use streaming where possible

#### 7.2 Caching Strategy
- Skip resizing if resized version already exists
- Check file modification times
- Use hash-based caching for better reliability

#### 7.3 Batch Processing
- Process images sequentially to avoid memory issues
- Consider configurable concurrency for future enhancements

### 8. Quality Settings

#### 8.1 JPEG Quality
- Target quality: 85-90% for good OCR results
- Balance between file size and image quality
- Configurable quality setting

#### 8.2 Format Preservation
- Maintain original image format when possible
- Convert to JPEG for non-JPEG formats (better compression)
- Handle transparency in PNG/GIF appropriately

### 9. Configuration

```javascript
const RESIZE_CONFIG = {
    maxWidth: 512,
    quality: 85,
    format: 'jpeg', // Convert all to JPEG
    outputDir: path.join(__dirname, 'output', 'resized'),
    suffix: '_resized_512'
};
```

### 10. Testing Strategy

#### 10.1 Unit Tests
- Test resizeImageIfNeeded() with various image sizes
- Test file naming conventions
- Test error handling scenarios

#### 10.2 Integration Tests
- Test full processing pipeline with resizing
- Verify resized images are used for LLM processing
- Test performance impact

#### 10.3 Performance Tests
- Measure processing time with and without resizing
- Memory usage during image processing
- Disk space usage for resized images

### 11. Implementation Steps

1. **Add Jimp dependency** to package.json
2. **Create image resizing module** with core functions
3. **Integrate resizing** into existing processing pipeline
4. **Update file naming** logic
5. **Add error handling** and logging
6. **Create tests** for new functionality
7. **Update documentation** and usage guides

### 12. Backward Compatibility

- Original images remain unchanged
- Existing JSON output format preserved
- Optional feature (can be disabled via configuration)
- Graceful degradation if resizing fails

### 13. Monitoring and Logging

#### 13.1 Success Metrics
- Number of images resized
- Average resizing time
- File size reduction percentage
- OCR success rate improvement

#### 13.2 Error Metrics
- Resizing failure rate
- Common error types
- Performance bottlenecks

### 14. Security Considerations

- Validate image file types
- Limit maximum input image size
- Prevent directory traversal attacks
- Sanitize file names

### 15. Future Enhancements

- **Smart resizing**: Different sizes based on image content
- **Compression optimization**: Advanced compression algorithms
- **Batch operations**: Process multiple images concurrently
- **Cloud integration**: Store resized images in cloud storage
- **CDN support**: Serve resized images via CDN

## Conclusion

This specification provides a comprehensive plan for implementing image resizing functionality that maintains image quality while optimizing for LLM processing. The use of Jimp ensures compatibility and ease of installation, while the modular design allows for future enhancements and customization.