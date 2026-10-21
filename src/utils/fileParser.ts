import mammoth from 'mammoth';

/**
 * Utility to extract text from files in browser (TXT, DOCX via mammoth, PDF via pdf.js)
 */
declare global {
  interface Window {
    pdfjsLib?: {
      GlobalWorkerOptions: { workerSrc: string };
      getDocument: (src: { data: Uint8Array }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNo: number) => Promise<{
            getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
          }>;
        }>;
      };
    };
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // 1. Plain text, markdown, csv
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || file.type.startsWith('text/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => reject(new Error('Không thể đọc file văn bản.'));
      // Requirement: FileReader.readAsText(file, 'UTF-8')
      reader.readAsText(file, 'UTF-8');
    });
  }

  // 2. Word documents (.docx)
  if (fileName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Requirement: mammoth.extractRawText({ arrayBuffer })
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (err) {
      console.error('Mammoth extraction failed:', err);
      return `[Lỗi đọc file Word ${file.name}]`;
    }
  }

  // 2b. Word documents (.doc legacy Word 97-2003)
  if (fileName.endsWith('.doc')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Try mammoth in case it was a .docx saved with .doc extension
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value && result.value.trim().length > 20) {
          return result.value;
        }
      } catch {
        // Not a zipped docx
      }

      // Read text using FileReader UTF-8 / ASCII filter fallback
      const reader = new FileReader();
      const content = await new Promise<string>((resolve) => {
        reader.onload = (e) => {
          const raw = (e.target?.result as string) || '';
          // Filter binary control characters, keep Vietnamese and readable text
          const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ');
          resolve(cleaned);
        };
        reader.onerror = () => resolve('');
        reader.readAsText(file, 'UTF-8');
      });

      if (content.trim().length > 30) {
        return content;
      }
      return `[Tài liệu đính kèm Word: ${file.name}. Nội dung sẽ được gửi cho AI phân tích trực tiếp]`;
    } catch (err) {
      console.warn('Legacy .doc reading error:', err);
      return `[Tài liệu Word ${file.name}]`;
    }
  }

  // 3. PDF documents (.pdf) - client side text extraction attempt
  if (fileName.endsWith('.pdf')) {
    if (window.pdfjsLib) {
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        const pageTexts: string[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageString = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .filter(Boolean)
            .join(' ');
          pageTexts.push(`[Trang ${pageNum}]: ${pageString}`);
        }

        return pageTexts.join('\n\n');
      } catch (err) {
        console.warn('PDF.js text extraction failed, will rely on AI image/pdf processing if available.', err);
      }
    }
  }

  // Fallback: Just return a placeholder if we can't extract text (e.g. images)
  // These will be handled by sending base64 to Gemini in the analyze step.
  if (file.type.startsWith('image/') || fileName.endsWith('.pdf')) {
    return `[Tài liệu đính kèm: ${file.name} - ${Math.round(file.size / 1024)} KB. Vui lòng sử dụng tính năng "Phân tích tài liệu với AI" để trích xuất nội dung]`;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      resolve(content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''));
    };
    reader.onerror = () => resolve(`[Đã nhận file ${file.name}]`);
    reader.readAsText(file, 'UTF-8');
  });
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      let mimeType = file.type;
      if (!mimeType) {
        const lower = file.name.toLowerCase();
        if (lower.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (lower.endsWith('.doc')) mimeType = 'application/msword';
        else if (lower.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (lower.endsWith('.png')) mimeType = 'image/png';
        else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (lower.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'application/octet-stream';
      }
      resolve({ base64, mimeType });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

