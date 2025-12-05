# Environment Setup Guide

## Prerequisites

### 1. Node.js Installation

#### Option A: Using Node.js Official Installer
1. Visit [nodejs.org](https://nodejs.org/)
2. Download and install **Node.js 18.0.0 or higher**
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Option B: Using Homebrew (macOS)
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

#### Option C: Using nvm (Recommended for Development)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install Node.js
nvm install 20
nvm use 20

# Verify installation
node --version
npm --version
```

### 2. Project Setup

#### Clone or Navigate to Project
```bash
# Navigate to the project directory
cd /Users/mdn/Projects/wodbuilder/Martin/ExampleDataProcessor
```

#### Install Dependencies
```bash
# Install npm packages
npm install

# Verify installation
ls node_modules/
```

Expected output should include:
- `openai/`
- `dotenv/`
- Other dependency folders

### 3. Environment Configuration

#### Create .env File
```bash
# Copy the example environment file
cp .env.example .env
```

#### Get OpenRouter API Key
1. Visit [openrouter.ai](https://openrouter.ai/)
2. Sign up for an account (free tier available)
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key

#### Configure .env File
```bash
# Edit the .env file
nano .env
```

Add your API key:
```env
OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

Save and exit:
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

#### Set File Permissions (Optional Security)
```bash
# Make .env file readable only by owner
chmod 600 .env

# Verify permissions
ls -la .env
```

Expected output: `-rw-------  1 user  group  size date .env`

### 4. Directory Structure Verification

Ensure your project structure matches:
```
Martin/ExampleDataProcessor/
├── ExampleData/
│   ├── [40 JPG images]
│   └── exercises.json
├── node_modules/
│   ├── openai/
│   ├── dotenv/
│   └── [... other dependencies]
├── output/              # Will be created automatically
├── process-wod-images.js
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── README.md
└── [Documentation files]
```

### 5. Test Environment

#### Verify Node.js Modules
```javascript
// Test script: test-env.js
const { OpenAI } = require('openai');
require('dotenv').config();

console.log('✅ dotenv loaded successfully');
console.log('✅ openai module loaded successfully');

if (process.env.OPENROUTER_API_KEY) {
  console.log('✅ API key found in environment');
} else {
  console.log('❌ API key not found');
}

// Test OpenAI client creation
try {
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: 'test-key'
  });
  console.log('✅ OpenAI client created successfully');
} catch (error) {
  console.log('❌ OpenAI client creation failed:', error.message);
}
```

Run the test:
```bash
node test-env.js
```

Expected output:
```
✅ dotenv loaded successfully
✅ openai module loaded successfully
✅ API key found in environment
✅ OpenAI client created successfully
```

### 6. First Run Test

#### Create Test Script
```javascript
// test-single-image.js
const fs = require('fs').promises;
const path = require('path');

async function testSingleImage() {
  try {
    // Check if ExampleData directory exists
    const exampleDataPath = path.join(__dirname, 'ExampleData');
    await fs.access(exampleDataPath);
    console.log('✅ ExampleData directory accessible');
    
    // Check for image files
    const files = await fs.readdir(exampleDataPath);
    const imageFiles = files.filter(file => 
      file.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
    );
    
    console.log(`✅ Found ${imageFiles.length} image files`);
    
    if (imageFiles.length > 0) {
      console.log(`✅ Sample image: ${imageFiles[0]}`);
    }
    
    // Check output directory creation
    const outputPath = path.join(__dirname, 'output');
    try {
      await fs.access(outputPath);
      console.log('✅ Output directory exists');
    } catch {
      await fs.mkdir(outputPath);
      console.log('✅ Output directory created');
    }
    
    console.log('✅ Environment setup complete!');
    
  } catch (error) {
    console.error('❌ Environment test failed:', error.message);
    process.exit(1);
  }
}

testSingleImage();
```

Run the test:
```bash
node test-single-image.js
```

### 7. Troubleshooting

#### Common Issues

**Issue**: `node: command not found`
**Solution**: Install Node.js using the methods above

**Issue**: `npm install` fails
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: `OPENROUTER_API_KEY` not found
**Solution**:
1. Verify `.env` file exists
2. Check API key is correctly formatted
3. Ensure no extra spaces or quotes
4. Restart your terminal

**Issue**: Permission denied errors
**Solution**:
```bash
# Fix file permissions
chmod 755 process-wod-images.js
chmod 600 .env
```

**Issue**: Module not found errors
**Solution**:
```bash
# Reinstall dependencies
npm install --force
```

### 8. Next Steps

Once environment setup is complete:

1. **Run the main script**:
   ```bash
   node process-wod-images.js
   ```

2. **Monitor progress**:
   - Watch console output for processing status
   - Check `output/` directory for generated JSON files

3. **Verify results**:
   - Open sample JSON files to verify structure
   - Check for any error messages

### 9. Production Deployment

For production use:

1. **Use environment variables** instead of `.env` file
2. **Set up monitoring** for API usage and errors
3. **Implement logging** for production debugging
4. **Consider rate limiting** for large batches
5. **Set up backups** for processed data

### 10. Security Best Practices

- **Never commit `.env`** to version control
- **Use strong API keys** and rotate regularly
- **Limit file permissions** on sensitive files
- **Monitor API usage** for unusual activity
- **Use HTTPS** for all API communications