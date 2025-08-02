# PDF Parse Error Fix

## Problem

The application was experiencing a production error:

```
Error: ENOENT: no such file or directory, open './test/data/05-versions-space.pdf'
```

This error occurred because the `pdf-parse` library (v1.1.1) has a debug mode that tries to read a test file during module initialization. The test file path is hardcoded and doesn't exist in production environments.

## Root Cause

In `node_modules/pdf-parse/index.js`, there's a condition:

```javascript
let isDebugMode = !module.parent;
```

In ESM environments or when dynamically imported, `module.parent` can be `null`, causing `isDebugMode` to be `true`, which triggers the test file reading:

```javascript
if (isDebugMode) {
  let PDF_FILE = "./test/data/05-versions-space.pdf";
  let dataBuffer = Fs.readFileSync(PDF_FILE); // <- This fails with ENOENT
  // ...
}
```

## Solution Applied

### 1. Dynamic Import with Error Handling

Updated `server/services/pdfExtractor.ts` and `server/services/fileService.ts` to use dynamic imports with proper error handling:

```typescript
// @ts-ignore - Dynamic import to avoid pdf-parse test file issues
const pdfParse = await import("pdf-parse");
const data = await pdfParse.default(pdfBuffer);
```

### 2. Fallback Text Extraction

Added a fallback text extraction method in case pdf-parse fails:

```typescript
// Fallback to buffer analysis if pdf-parse fails
extractedText = extractTextFromBuffer(pdfBuffer);
```

### 3. Test File Provisioning

Ensured the test file exists by:

- Adding a `postinstall` script in `package.json` that automatically copies the test file
- Creating deployment scripts (`deploy.sh` and `deploy.ps1`) that handle the file copy
- Manually copied the file for immediate fix

### 4. Production Build Compatibility

- Modified imports to use `@ts-ignore` comments to bypass TypeScript module resolution issues
- Used dynamic imports to avoid compile-time dependency resolution

## Files Modified

1. **server/services/pdfExtractor.ts**

   - Changed from static import to dynamic import
   - Added fallback text extraction method
   - Enhanced error handling and logging

2. **server/services/fileService.ts**

   - Changed from static import to dynamic import
   - Fixed TypeScript namespace issues

3. **server/routes.ts**

   - Added `@ts-ignore` comment for consistency

4. **package.json**
   - Added `postinstall` script to automatically handle test file setup
   - Added `build:server` script for server-only builds

## Testing

The fix was verified with:

```bash
# Test the PDF import
npx tsx test-simple.ts

# Test the PDF extraction service
npx tsx test-extractor.ts

# Test production build
npm run build:server
```

All tests pass successfully, confirming the ENOENT error is resolved.

## Deployment

For production deployment, use one of:

1. **Automatic (recommended)**: The `postinstall` script handles this automatically
2. **Manual**: Run the deployment script: `./deploy.ps1` or `./deploy.sh`
3. **PM2**: The fix works with PM2 process management

## Alternative Solutions Considered

1. **Replace pdf-parse**: Could use `pdf-poppler` or `pdf2pic` (already in dependencies)
2. **Fork pdf-parse**: Create a fixed version without the debug mode
3. **Patch-package**: Use a patch to modify the node_modules file
4. **Environment variable**: Set a flag to disable debug mode (not available in this version)

The current solution was chosen because it:

- Maintains existing functionality
- Provides fallback options
- Works in all deployment scenarios
- Requires minimal code changes

## Future Recommendations

1. Consider migrating to a more stable PDF parsing library like `pdf-poppler`
2. Monitor for updates to `pdf-parse` that fix this issue
3. Implement comprehensive PDF parsing tests in CI/CD pipeline
