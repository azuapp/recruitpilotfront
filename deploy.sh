#!/bin/bash

# Production deployment script for RecruitPilot
# This script ensures that the pdf-parse test file is available to prevent ENOENT errors

echo "🚀 Starting RecruitPilot deployment..."

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p test/data
mkdir -p uploads
mkdir -p dist

# Copy pdf-parse test file to prevent ENOENT errors
echo "📄 Setting up pdf-parse test file..."
if [ -f "node_modules/pdf-parse/test/data/05-versions-space.pdf" ]; then
    cp "node_modules/pdf-parse/test/data/05-versions-space.pdf" "test/data/05-versions-space.pdf"
    echo "✅ Test PDF file copied successfully"
else
    echo "⚠️  Test PDF file not found in node_modules, creating placeholder..."
    # Create a minimal PDF as fallback
    cat > "test/data/05-versions-space.pdf" << 'EOF'
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td(Test)Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000106 00000 n 
0000000199 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref 287
%%EOF
EOF
    echo "✅ Placeholder PDF created"
fi

# Build the application
echo "🔨 Building application..."
npm run build

echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the application with: npm start"
echo "2. Or use PM2: pm2 start dist/index.js --name recruitpilot"
echo ""
echo "📝 Note: The pdf-parse ENOENT error has been resolved by ensuring"
echo "   the required test file exists in the project directory."
