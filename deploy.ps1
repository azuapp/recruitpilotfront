# Production deployment script for RecruitPilot (Windows PowerShell)
# This script ensures that the pdf-parse test file is available to prevent ENOENT errors

Write-Host "🚀 Starting RecruitPilot deployment..." -ForegroundColor Green

# Create necessary directories
Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
if (!(Test-Path "test\data")) { New-Item -ItemType Directory -Path "test\data" -Force | Out-Null }
if (!(Test-Path "uploads")) { New-Item -ItemType Directory -Path "uploads" -Force | Out-Null }
if (!(Test-Path "dist")) { New-Item -ItemType Directory -Path "dist" -Force | Out-Null }

# Copy pdf-parse test file to prevent ENOENT errors
Write-Host "📄 Setting up pdf-parse test file..." -ForegroundColor Yellow
$sourcePdf = "node_modules\pdf-parse\test\data\05-versions-space.pdf"
$targetPdf = "test\data\05-versions-space.pdf"

if (Test-Path $sourcePdf) {
    Copy-Item $sourcePdf $targetPdf -Force
    Write-Host "✅ Test PDF file copied successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Test PDF file not found in node_modules, creating placeholder..." -ForegroundColor Yellow
    
    # Create a minimal PDF as fallback
    $minimalPdf = @"
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
"@
    
    [System.Text.Encoding]::UTF8.GetBytes($minimalPdf) | Set-Content -Path $targetPdf -Encoding Byte
    Write-Host "✅ Placeholder PDF created" -ForegroundColor Green
}

# Build the server (skip client build if it fails)
Write-Host "🔨 Building server..." -ForegroundColor Yellow
try {
    & npm run build
    Write-Host "✅ Full build completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Full build failed, building server only..." -ForegroundColor Yellow
    & npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
    Write-Host "✅ Server build completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the application with: npm start" -ForegroundColor White
Write-Host "2. Or use PM2: pm2 start dist/index.js --name recruitpilot" -ForegroundColor White
Write-Host ""
Write-Host "📝 Note: The pdf-parse ENOENT error has been resolved by ensuring" -ForegroundColor Gray
Write-Host "   the required test file exists in the project directory." -ForegroundColor Gray
