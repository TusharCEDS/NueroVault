// app/api/extract-text/route.ts
import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import and disable worker
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // Disable worker (causes issues in Next.js)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    // Load PDF without worker
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    // Extract text from each page (limit to 50 pages for performance)
    const maxPages = Math.min(pdf.numPages, 50);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      } catch (pageError) {
        console.error(`Error extracting page ${pageNum}:`, pageError);
      }
    }
    
    // Clean up
    await pdf.cleanup();
    
    // Clean extracted text
    fullText = fullText
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n]/g, ' ');
    
    if (fullText.length > 100) {
      return fullText;
    }
    
    return `PDF document with ${pdf.numPages} pages - content extraction incomplete`;
  } catch (error) {
    console.error('PDF.js extraction error:', error);
    // Fallback: simple extraction
    const text = buffer.toString('latin1');
    const matches = text.match(/\(([^)]+)\)/g);
    if (matches && matches.length > 10) {
      const extracted = matches
        .slice(0, 200)
        .map(m => m.slice(1, -1))
        .join(' ')
        .replace(/\\[0-9]{3}/g, ' ')
        .trim();
      if (extracted.length > 100) {
        return extracted;
      }
    }
    return 'PDF document - automated text extraction unavailable';
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';

    // PDF Files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('Extracting PDF with PDF.js...');
      extractedText = await extractPdfText(buffer);
      console.log('Extracted length:', extractedText.length);
      console.log('Preview:', extractedText.substring(0, 200));
    }
    
    // Word Documents (.docx)
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || `Word document: ${fileName}`;
      } catch {
        extractedText = `Word document: ${fileName}`;
      }
    }
    
    // Text Files
    else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      extractedText = buffer.toString('utf-8');
    }
    
    // Excel Files
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      try {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheets = workbook.SheetNames.map(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          return XLSX.utils.sheet_to_csv(sheet);
        });
        extractedText = `Excel: ${fileName}. Data: ${sheets.join(' ')}`;
      } catch {
        extractedText = `Excel file: ${fileName}`;
      }
    }
    
    // CSV Files
    else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      extractedText = `CSV: ${fileName}. ${buffer.toString('utf-8')}`;
    }
    
    // Images
    else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
      extractedText = `Image: ${fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}`;
    }
    
    // JSON Files
    else if (fileType === 'application/json' || fileName.endsWith('.json')) {
      try {
        const json = JSON.parse(buffer.toString('utf-8'));
        extractedText = `JSON: ${fileName}. ${JSON.stringify(json)}`;
      } catch {
        extractedText = `JSON file: ${fileName}`;
      }
    }
    
    // Code Files
    else if (fileName.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|md)$/i)) {
      extractedText = `${fileName}: ${buffer.toString('utf-8')}`;
    }
    
    // Default
    else {
      extractedText = fileName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    }

    // Clean and limit
    extractedText = extractedText
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 5000);

    if (!extractedText || extractedText.length < 3) {
      extractedText = fileName;
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileType: fileType || 'unknown',
    });

  } catch (error: any) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text', details: error.message },
      { status: 500 }
    );
  }
}