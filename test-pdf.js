const fs = require('fs');

async function testPdfParse() {
  try {
    console.log('Testing pdf-parse import...');
    const pdfParse = await import('pdf-parse');
    console.log('pdf-parse imported successfully');
    console.log('pdfParse.default:', typeof pdfParse.default);
    console.log('pdfParse:', typeof pdfParse);
    
    const parser = pdfParse.default || pdfParse;
    console.log('Using parser:', typeof parser);
    
    // Test with actual file
    const filePath = 'uploads/cv-1753578693685-324020982.pdf';
    if (fs.existsSync(filePath)) {
      console.log('File exists, reading...');
      const pdfBuffer = fs.readFileSync(filePath);
      console.log('Buffer size:', pdfBuffer.length);
      
      const result = await parser(pdfBuffer);
      console.log('SUCCESS! Text length:', result.text.length);
      console.log('First 200 chars:', result.text.substring(0, 200));
    } else {
      console.log('File not found:', filePath);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPdfParse();
