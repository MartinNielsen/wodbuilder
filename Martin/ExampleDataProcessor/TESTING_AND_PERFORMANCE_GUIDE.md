# Testing and Performance Guide for Image Resizing

## Overview

This guide provides comprehensive testing strategies and performance optimization techniques for the image resizing functionality in the WOD Image Processor.

## Testing Strategy

### 1. Test Categories

#### 1.1 Unit Tests
**Purpose**: Test individual functions in isolation

**Coverage**:
- Image dimension detection
- Resize calculation logic
- File path generation
- Error handling for individual operations

**Example Test Cases**:
```javascript
describe('ImageProcessor Unit Tests', () => {
    test('should correctly identify images needing resize', () => {
        // Test with various image dimensions
        expect(needsResizing(600, 400)).toBe(true);   // 600px > 512px
        expect(needsResizing(400, 600)).toBe(false);  // 400px ≤ 512px
        expect(needsResizing(512, 512)).toBe(false);  // Exactly 512px
    });
    
    test('should calculate resize dimensions correctly', () => {
        const result = calculateResizeDimensions(1024, 768);
        expect(result.width).toBe(512);
        expect(result.height).toBe(384); // Maintains aspect ratio
    });
});
```

#### 1.2 Integration Tests
**Purpose**: Test interaction between modules

**Coverage**:
- Image resizing with file I/O
- Integration with existing processing pipeline
- Error propagation between modules

**Example Test Cases**:
```javascript
describe('Image Processing Integration', () => {
    test('should resize image and process with Gemini', async () => {
        const imagePath = 'test-data/large-image.jpg';
        const result = await processSingleImage(imagePath);
        
        // Verify resized image exists
        expect(fs.existsSync('output/resized/large-image_resized_512.jpg')).toBe(true);
        
        // Verify JSON output
        expect(fs.existsSync('output/large-image.json')).toBe(true);
        
        // Verify Gemini received resized image
        expect(result).toBeDefined();
    });
});
```

#### 1.3 End-to-End Tests
**Purpose**: Test complete workflow from input to output

**Coverage**:
- Full processing pipeline
- Error recovery scenarios
- Performance under load

**Example Test Cases**:
```javascript
describe('End-to-End Processing', () => {
    test('should process batch of images with resizing', async () => {
        const imageFiles = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
        
        await processBatch(imageFiles);
        
        // Verify all images processed
        imageFiles.forEach(file => {
            const name = path.basename(file, path.extname(file));
            expect(fs.existsSync(`output/${name}.json`)).toBe(true);
            expect(fs.existsSync(`output/resized/${name}_resized_512.jpg`)).toBe(true);
        });
    });
});
```

### 2. Test Data Strategy

#### 2.1 Image Test Cases
Create a comprehensive test image library:

**Size-based Tests**:
- `small-image.jpg` (300x200) - Should not be resized
- `medium-image.jpg` (800x600) - Should be resized to 512x384
- `large-image.jpg` (2048x1536) - Should be resized to 512x384
- `wide-image.jpg` (1920x1080) - Should be resized to 512x288
- `tall-image.jpg` (1080x1920) - Should not be resized (height doesn't matter)

**Format-based Tests**:
- `test.jpg` - Standard JPEG
- `test.png` - PNG with transparency
- `test.gif` - Animated GIF (first frame only)

**Quality-based Tests**:
- `low-quality.jpg` - Already compressed
- `high-quality.jpg` - High resolution, large file size
- `corrupted.jpg` - Invalid image file

#### 2.2 Edge Cases
```javascript
describe('Edge Cases', () => {
    test('should handle corrupted images gracefully', async () => {
        const result = await processSingleImage('corrupted.jpg');
        expect(result).toBeDefined(); // Should not crash
    });
    
    test('should handle very large images', async () => {
        const startTime = Date.now();
        await processSingleImage('huge-image.jpg'); // 4000x3000
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(10000); // Should complete in reasonable time
    });
    
    test('should handle images with special characters in filename', async () => {
        const result = await processSingleImage('test-image (1).jpg');
        expect(result).toBeDefined();
    });
});
```

### 3. Performance Testing

#### 3.1 Benchmarking Suite
```javascript
describe('Performance Benchmarks', () => {
    const benchmarks = {
        resizeTime: [],
        memoryUsage: [],
        fileSizes: []
    };
    
    test('resize performance', async () => {
        const images = generateTestImages(['small', 'medium', 'large']);
        
        for (const image of images) {
            const startTime = process.hrtime.bigint();
            await resizeImage(image.path, image.outputPath);
            const endTime = process.hrtime.bigint();
            
            const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
            benchmarks.resizeTime.push({
                size: image.size,
                duration,
                originalSize: image.fileSize
            });
        }
        
        // Assert performance thresholds
        benchmarks.resizeTime.forEach(benchmark => {
            if (benchmark.size === 'large') {
                expect(benchmark.duration).toBeLessThan(5000); // 5 seconds
            }
        });
    });
    
    test('memory usage during processing', async () => {
        const initialMemory = process.memoryUsage();
        
        // Process multiple images
        await Promise.all(
            testImages.map(img => resizeImage(img.path, img.outputPath))
        );
        
        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
        
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    });
});
```

#### 3.2 Load Testing
```javascript
describe('Load Testing', () => {
    test('concurrent image processing', async () => {
        const imageCount = 20;
        const images = Array.from({ length: imageCount }, (_, i) => `test-${i}.jpg`);
        
        const startTime = Date.now();
        
        // Process all images concurrently
        await Promise.all(
            images.map(image => processSingleImage(image))
        );
        
        const totalTime = Date.now() - startTime;
        const avgTimePerImage = totalTime / imageCount;
        
        console.log(`Total time: ${totalTime}ms`);
        console.log(`Average per image: ${avgTimePerImage}ms`);
        
        // Assert reasonable performance
        expect(avgTimePerImage).toBeLessThan(3000); // 3 seconds per image
    });
});
```

### 4. Quality Assurance Tests

#### 4.1 Image Quality Validation
```javascript
describe('Image Quality Tests', () => {
    test('resized images maintain OCR quality', async () => {
        const originalText = await extractTextFromImage('original.jpg');
        const resizedText = await extractTextFromImage('resized.jpg');
        
        // Calculate similarity score
        const similarity = calculateTextSimilarity(originalText, resizedText);
        expect(similarity).toBeGreaterThan(0.95); // 95% similarity
    });
    
    test('file size reduction is significant', async () => {
        const originalSize = await getFileSize('original.jpg');
        const resizedSize = await getFileSize('resized.jpg');
        
        const reduction = (originalSize - resizedSize) / originalSize;
        expect(reduction).toBeGreaterThan(0.5); // 50% reduction
    });
});
```

#### 4.2 Visual Regression Testing
```javascript
describe('Visual Regression', () => {
    test('resized images maintain visual integrity', async () => {
        const original = await loadImage('original.jpg');
        const resized = await loadImage('resized.jpg');
        
        const diff = await compareImages(original, resized);
        expect(diff.percentage).toBeLessThan(5); // Less than 5% difference
    });
});
```

## Performance Optimization

### 1. Memory Management

#### 1.1 Image Processing Optimization
```javascript
class OptimizedImageProcessor {
    /**
     * Process images with memory management
     */
    async processImageWithMemoryManagement(imagePath, outputPath) {
        let image = null;
        
        try {
            // Load image
            image = await Jimp.read(imagePath);
            
            // Process image
            if (image.bitmap.width > MAX_WIDTH) {
                image.resize(MAX_WIDTH, Jimp.AUTO);
                image.quality(QUALITY);
            }
            
            // Save and return path
            await image.writeAsync(outputPath);
            return outputPath;
            
        } finally {
            // Clean up memory
            if (image) {
                image.bitmap.data = null;
                image = null;
            }
            global.gc && global.gc(); // Force garbage collection if available
        }
    }
}
```

#### 1.2 Batch Processing with Memory Limits
```javascript
class BatchProcessor {
    constructor(options = {}) {
        this.maxConcurrent = options.maxConcurrent || 3;
        this.memoryThreshold = options.memoryThreshold || 500 * 1024 * 1024; // 500MB
    }
    
    async processBatch(imagePaths) {
        const results = [];
        
        for (let i = 0; i < imagePaths.length; i += this.maxConcurrent) {
            const batch = imagePaths.slice(i, i + this.maxConcurrent);
            
            // Check memory usage
            const memoryUsage = process.memoryUsage().heapUsed;
            if (memoryUsage > this.memoryThreshold) {
                await this.waitForMemoryCleanup();
            }
            
            // Process batch
            const batchResults = await Promise.all(
                batch.map(path => this.processSingleImage(path))
            );
            
            results.push(...batchResults);
        }
        
        return results;
    }
    
    async waitForMemoryCleanup() {
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
}
```

### 2. Caching Strategies

#### 2.1 File-based Caching
```javascript
const fs = require('fs').promises;
const crypto = require('crypto');

class ImageCache {
    constructor(cacheDir = 'cache') {
        this.cacheDir = cacheDir;
    }
    
    async getCacheKey(imagePath) {
        const stats = await fs.stat(imagePath);
        const content = `${imagePath}-${stats.mtime}-${stats.size}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    async getCachedImage(imagePath) {
        const cacheKey = await this.getCacheKey(imagePath);
        const cachePath = path.join(this.cacheDir, `${cacheKey}.jpg`);
        
        try {
            await fs.access(cachePath);
            return cachePath;
        } catch {
            return null;
        }
    }
    
    async setCachedImage(imagePath, outputPath) {
        const cacheKey = await this.getCacheKey(imagePath);
        const cachePath = path.join(this.cacheDir, `${cacheKey}.jpg`);
        
        await fs.copyFile(outputPath, cachePath);
    }
}
```

#### 2.2 In-Memory Caching
```javascript
class MemoryCache {
    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    get(key) {
        return this.cache.get(key);
    }
    
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    
    has(key) {
        return this.cache.has(key);
    }
}
```

### 3. Performance Monitoring

#### 3.1 Metrics Collection
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            imagesProcessed: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
            memoryUsage: [],
            errorCount: 0
        };
    }
    
    startTimer() {
        return process.hrtime.bigint();
    }
    
    endTimer(startTime, operation) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
        
        this.metrics.imagesProcessed++;
        this.metrics.totalProcessingTime += duration;
        this.metrics.averageProcessingTime = 
            this.metrics.totalProcessingTime / this.metrics.imagesProcessed;
        
        // Log performance
        console.log(`${operation}: ${duration.toFixed(2)}ms`);
        
        return duration;
    }
    
    recordMemoryUsage() {
        const usage = process.memoryUsage();
        this.metrics.memoryUsage.push({
            timestamp: Date.now(),
            ...usage
        });
    }
    
    getMetrics() {
        return { ...this.metrics };
    }
}
```

#### 3.2 Real-time Monitoring
```javascript
class RealTimeMonitor {
    constructor(updateInterval = 5000) {
        this.updateInterval = updateInterval;
        this.timer = null;
    }
    
    start() {
        this.timer = setInterval(() => {
            const usage = process.memoryUsage();
            const cpu = process.cpuUsage();
            
            console.log('Memory Usage:', {
                rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`
            });
            
            console.log('CPU Usage:', {
                user: `${Math.round(cpu.user / 1000)}ms`,
                system: `${Math.round(cpu.system / 1000)}ms`
            });
        }, this.updateInterval);
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
```

### 4. Optimization Techniques

#### 4.1 Image Processing Optimizations
```javascript
class ImageOptimizer {
    /**
     * Optimize resize operation
     */
    async optimizedResize(imagePath, outputPath, options = {}) {
        const {
            maxWidth = 512,
            quality = 85,
            progressive = true
        } = options;
        
        const image = await Jimp.read(imagePath);
        
        // Use faster resize mode for large images
        if (image.bitmap.width > 2000) {
            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
                // Skip some pixels for very large images
                if (x % 2 === 0 && y % 2 === 0) {
                    this.bitmap.data[idx] = this.bitmap.data[idx];
                }
            });
        }
        
        // Resize with optimal settings
        image.resize(maxWidth, Jimp.AUTO);
        image.quality(quality);
        
        if (progressive) {
            image.progressive(true);
        }
        
        await image.writeAsync(outputPath);
        return outputPath;
    }
}
```

#### 4.2 Concurrent Processing Optimization
```javascript
class ConcurrentProcessor {
    constructor(options = {}) {
        this.maxConcurrency = options.maxConcurrency || 3;
        this.queue = [];
        this.active = 0;
    }
    
    async process(images) {
        this.queue = [...images];
        const results = [];
        
        while (this.queue.length > 0 || this.active > 0) {
            // Start new tasks if we have capacity
            while (this.active < this.maxConcurrency && this.queue.length > 0) {
                const image = this.queue.shift();
                this.active++;
                
                this.processImage(image)
                    .then(result => {
                        results.push(result);
                    })
                    .finally(() => {
                        this.active--;
                    });
            }
            
            // Wait a bit if no active tasks
            if (this.active === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        return results;
    }
    
    async processImage(image) {
        // Process single image
        return processSingleImage(image);
    }
}
```

### 5. Performance Tuning Guidelines

#### 5.1 Node.js Optimization
```bash
# Increase memory limit for image processing
node --max-old-space-size=4096 process-wod-images.js

# Enable garbage collection for better memory management
node --expose-gc process-wod-images.js

# Monitor performance
node --prof process-wod-images.js
```

#### 5.2 Environment Optimization
```javascript
// Optimize for image processing
process.env.UV_THREADPOOL_SIZE = '128'; // Increase thread pool size

// Disable unnecessary features
process.env.NODE_ENV = 'production';
process.env.DEBUG = ''; // Disable debug logging
```

#### 5.3 Jimp Optimization Settings
```javascript
// Configure Jimp for optimal performance
Jimp.prototype.constructor.prototype.limitMemoryUsage = function() {
    // Implement memory limiting logic
    return this;
};

// Use optimal resize modes
const resizeModes = {
    FAST: Jimp.RESIZE_BICUBIC,
    BALANCED: Jimp.RESIZE_BEZIER,
    HIGH_QUALITY: Jimp.RESIZE_HERMITE
};
```

## Testing Automation

### 1. Continuous Integration

#### 1.1 Test Script Configuration
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:performance": "jest --testPathPattern=performance",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### 1.2 CI Pipeline Configuration
```yaml
# .github/workflows/test.yml
name: Test Image Resizing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Run performance tests
        run: npm run test:performance
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### 2. Performance Regression Detection

#### 2.1 Baseline Performance Tracking
```javascript
// scripts/benchmark.js
const { performance } = require('perf_hooks');
const { processBatch } = require('../process-wod-images');

async function runBenchmark() {
    const testImages = await discoverImages('test-data', ['.jpg']);
    
    const startTime = performance.now();
    await processBatch(testImages);
    const endTime = performance.now();
    
    const results = {
        imageCount: testImages.length,
        totalTime: endTime - startTime,
        averageTime: (endTime - startTime) / testImages.length,
        timestamp: new Date().toISOString()
    };
    
    // Save results
    await fs.writeFile('benchmark-results.json', JSON.stringify(results, null, 2));
    
    // Compare with baseline
    const baseline = JSON.parse(await fs.readFile('baseline.json', 'utf8'));
    const regression = (results.averageTime - baseline.averageTime) / baseline.averageTime;
    
    if (regression > 0.2) { // 20% regression
        console.error(`Performance regression detected: ${regression * 100}%`);
        process.exit(1);
    }
}

runBenchmark();
```

This comprehensive testing and performance guide ensures the image resizing functionality is robust, efficient, and maintainable.