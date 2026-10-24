import {
  QuestionItem,
  ExamConfig,
  ExamMatrix,
  ExamSpecificationRow,
  ShuffledExamCode,
  StudyGuideData,
  ChuDeItem,
  CauItem,
  LuatConfig,
} from '../types/exam';
import { getUnifiedMatrixSpecData, UnifiedTableData, MatrixCellData } from './cv7991Engine';

const WORD_HEADER_STYLE = `
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    body {
      font-family: 'Times New Roman', 'DejaVu Serif', serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000;
      margin: 0;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 5pt 6pt;
      font-size: 11pt;
    }
    .header-table, .header-table th, .header-table td {
      border: none !important;
      padding: 3pt 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .page-break { page-break-before: always; break-before: page; }
    .question-block { margin-bottom: 10pt; }
    .option-table, .option-table td {
      border: none !important;
      padding: 2pt 5pt;
    }
  </style>
`;

/**
 * Format LaTeX math formulas to readable Unicode text in Word documents
 */
export function formatLatexToWordUnicode(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\$(.*?)\$\$/gs, (_, math) => ` ${cleanMathString(math)} `)
    .replace(/\$(.*?)\$/g, (_, math) => ` ${cleanMathString(math)} `)
    .replace(/\n/g, '<br>');
}

function cleanMathString(math: string): string {
  return math
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[(.*?)\]\{([^}]+)\}/g, '$1√($2)')
    .replace(/\\lim_\{([^}]+)\}/g, 'lim ($1)')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\le|\\leq/g, '≤')
    .replace(/\\ge|\\geq/g, '≥')
    .replace(/\\ne|\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\equiv/g, '≡')
    .replace(/\\infty/g, '∞')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    .replace(/\\subset/g, '⊂')
    .replace(/\\supset/g, '⊃')
    .replace(/\\cup/g, '∪')
    .replace(/\\cap/g, '∩')
    .replace(/\\emptyset/g, '∅')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, '∑')
    .replace(/\\left\(|\\right\)/g, '')
    .replace(/\\left\[|\\right\]/g, '')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\circ/g, '°')
    .replace(/_([0-9a-zA-Z])/g, '_$1')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^([0-9])/g, '^$1')
    .replace(/\\/g, '');
}

/**
 * 1. Xuất ĐỀ THI RIÊNG BIỆT (.doc)
 */
export function exportExamOnlyWordDoc(config: ExamConfig, currentCode: ShuffledExamCode): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title} - ĐỀ THI</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  ${renderExamHeader(school, currentCode.code, title, subject, gradeStr, config)}
  ${renderExamQuestionsToWord(currentCode.questions)}
  <div class="text-center bold italic" style="margin-top: 25pt; margin-bottom: 15pt;">
    --- HẾT ---<br>
    <span style="font-size: 10pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `De_Thi_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

/**
 * 2. Xuất ĐÁP ÁN & HƯỚNG DẪN CHẤM RIÊNG BIỆT (.doc)
 */
export function exportAnswerKeyOnlyWordDoc(config: ExamConfig, currentCode: ShuffledExamCode): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title} - ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <div class="text-center bold uppercase" style="font-size: 14pt; margin-bottom: 4pt;">
    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM CHI TIẾT
  </div>
  <div class="text-center bold uppercase" style="font-size: 12pt; margin-bottom: 2pt;">
    ${title} – MÃ ĐỀ: ${currentCode.code}
  </div>
  <div class="text-center italic" style="margin-bottom: 15pt;">
    ${school} | Môn: ${subject} – ${gradeStr} (Thang điểm: ${config.totalScore || 10})
  </div>

  <div class="bold" style="margin-bottom: 5pt; font-size: 12pt;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</div>
  ${renderQuickAnswerTable(currentCode)}

  <div class="bold" style="margin-top: 18pt; margin-bottom: 5pt; font-size: 12pt;">II. LỜI GIẢI VÀ BIỂU ĐIỂM CHI TIẾT</div>
  ${renderDetailedSolutionsToWord(currentCode.questions)}
</body>
</html>
  `;

  downloadBlob(htmlContent, `Dap_An_HDCham_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

/**
 * 3. Xuất TRỌN BỘ HỒ SƠ ĐỀ KIỂM TRA (.doc)
 */
export function exportToWordDoc(
  config: ExamConfig,
  currentCode: ShuffledExamCode,
  matrix: ExamMatrix,
  specs: ExamSpecificationRow[],
  studyGuide?: StudyGuideData
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- MỤC 1: ĐỀ THI -->
  ${renderExamHeader(school, currentCode.code, title, subject, gradeStr, config)}
  ${renderExamQuestionsToWord(currentCode.questions)}
  <div class="text-center bold italic" style="margin-top: 20pt; margin-bottom: 20pt;">
    --- HẾT ---<br>
    <span style="font-size: 10pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>

  <!-- MỤC 2: ĐÁP ÁN & HƯỚNG DẪN CHẤM -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 4pt;">
    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM – MÃ ĐỀ ${currentCode.code}
  </div>
  <div class="text-center italic" style="margin-bottom: 12pt;">
    Môn: ${subject} – ${gradeStr} (Thang điểm: ${config.totalScore || 10})
  </div>
  <div class="bold" style="margin-bottom: 5pt;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</div>
  ${renderQuickAnswerTable(currentCode)}
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">II. HƯỚNG DẪN CHẤM CHI TIẾT</div>
  ${renderDetailedSolutionsToWord(currentCode.questions)}

  <!-- MỤC 3: MA TRẬN & BẢN ĐẶC TẢ -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    MA TRẬN ĐỀ KIỂM TRA
  </div>
  ${renderMatrixTable(matrix, config)}

  <div class="text-center bold uppercase" style="font-size: 13pt; margin-top: 20pt; margin-bottom: 8pt;">
    BẢN ĐẶC TẢ ĐỀ KIỂM TRA
  </div>
  ${renderSpecTable(specs, matrix, config)}

  ${studyGuide ? `
  <!-- MỤC 4: ĐỀ CƯƠNG ÔN TẬP BỔ TRỢ -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    ĐỀ CƯƠNG ÔN TẬP VÀ CẨM NANG TRỌNG TÂM
  </div>
  ${renderStudyGuideContent(studyGuide)}
  ` : ''}
</body>
</html>
  `;

  downloadBlob(htmlContent, `Tron_Bo_Ho_So_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

/**
 * 4. Xuất MA TRẬN & BẢN ĐẶC TẢ RIÊNG BIỆT (.doc)
 */
export function exportMatrixAndSpecsOnlyWordDoc(
  config: ExamConfig,
  matrix: ExamMatrix,
  specs: ExamSpecificationRow[]
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>MA TRẬN VÀ BẢN ĐẶC TẢ - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">${school}</span><br>
        <span class="bold">TỔ CHUYÊN MÔN</span><br>
        <span>----------------</span>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
        <span class="bold">Độc lập – Tự do – Hạnh phúc</span><br>
        <span>-----------------------</span>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin-top: 10pt; margin-bottom: 15pt;">
    <div class="bold uppercase" style="font-size: 13pt;">MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ</div>
    <div class="bold uppercase">${title}</div>
    <div class="bold">MÔN: ${subject.toUpperCase()} – ${gradeStr.toUpperCase()}</div>
    <div class="italic">Chương trình GDPT 2018 – Bộ sách: ${config.textbook}</div>
    <div class="italic">Thời gian làm bài: ${config.durationMinutes} phút | Thang điểm: ${config.totalScore || 10} điểm</div>
  </div>

  <div class="bold uppercase" style="font-size: 12pt; margin-bottom: 6pt; color: #003366;">
    A. KHUNG MA TRẬN ĐỀ KIỂM TRA
  </div>
  ${renderMatrixTable(matrix, config)}

  <div class="page-break"></div>
  <div class="bold uppercase" style="font-size: 12pt; margin-top: 10pt; margin-bottom: 6pt; color: #003366;">
    B. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
  </div>
  ${renderSpecTable(specs, matrix, config)}

  <div style="margin-top: 30pt;">
    <table class="header-table" style="width: 100%;">
      <tr>
        <td style="width: 33%; text-align: center; vertical-align: top;">
          <span class="bold">NGƯỜI LẬP MA TRẬN</span><br>
          <span class="italic">(Ký và ghi rõ họ tên)</span>
        </td>
        <td style="width: 33%; text-align: center; vertical-align: top;">
          <span class="bold">TỔ TRƯỞNG CHUYÊN MÔN</span><br>
          <span class="italic">(Ký và ghi rõ họ tên)</span>
        </td>
        <td style="width: 34%; text-align: center; vertical-align: top;">
          <span class="bold">DUYỆT CỦA BAN GIÁM HIỆU</span><br>
          <span class="italic">(Ký tên và đóng dấu)</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Ma_Tran_Ban_Dac_Ta_${subject.replace(/\s+/g, '_')}_Lop${config.grade}.doc`);
}

/**
 * Xuất MA TRẬN & BẢN ĐẶC TẢ CHUẨN PHỤ LỤC CV 7991 (.doc) từ bảng "cau" và UnifiedTableData
 */
export function exportMatrixAndSpecsCv7991WordDoc(
  config: ExamConfig,
  chuDeList: ChuDeItem[],
  cauList: CauItem[],
  luat: LuatConfig
): void {
  const unifiedData = getUnifiedMatrixSpecData(chuDeList, cauList, luat);
  const title = config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>MA TRẬN VÀ BẢN ĐẶC TẢ CV 7991 - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">${school}</span><br>
        <span class="bold">TỔ CHUYÊN MÔN</span><br>
        <span>----------------</span>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
        <span class="bold">Độc lập – Tự do – Hạnh phúc</span><br>
        <span>-----------------------</span>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin-top: 10pt; margin-bottom: 15pt;">
    <div class="bold uppercase" style="font-size: 13pt;">KHUNG MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA (MẪU THAM KHẢO CV 7991)</div>
    <div class="bold uppercase">${title}</div>
    <div class="bold">MÔN: ${subject.toUpperCase()} – ${gradeStr.toUpperCase()}</div>
    <div class="italic">Chương trình GDPT 2018 – Bộ sách: ${config.textbook}</div>
    <div class="italic">Thời gian làm bài: ${config.durationMinutes} phút | Thang điểm: 10,0 điểm</div>
  </div>

  <div class="bold uppercase" style="font-size: 12pt; margin-bottom: 6pt; color: #003366;">
    A. KHUNG MA TRẬN ĐỀ KIỂM TRA
  </div>
  ${renderCv7991MatrixWord(unifiedData, config)}

  <div class="page-break"></div>
  <div class="bold uppercase" style="font-size: 12pt; margin-top: 10pt; margin-bottom: 6pt; color: #003366;">
    B. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
  </div>
  ${renderCv7991SpecWord(unifiedData, config)}

  <div style="margin-top: 30pt;">
    <table class="header-table" style="width: 100%;">
      <tr>
        <td style="width: 33%; text-align: center; vertical-align: top;">
          <span class="bold">NGƯỜI LẬP MA TRẬN</span><br>
          <span class="italic">(Ký và ghi rõ họ tên)</span>
        </td>
        <td style="width: 33%; text-align: center; vertical-align: top;">
          <span class="bold">TỔ TRƯỞNG CHUYÊN MÔN</span><br>
          <span class="italic">(Ký và ghi rõ họ tên)</span>
        </td>
        <td style="width: 34%; text-align: center; vertical-align: top;">
          <span class="bold">DUYỆT CỦA BAN GIÁM HIỆU</span><br>
          <span class="italic">(Ký tên và đóng dấu)</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Ma_Tran_Ban_Dac_Ta_CV7991_${subject.replace(/\s+/g, '_')}_Lop${config.grade}.doc`);
}

/**
 * Xuất TRỌN BỘ HỒ SƠ CHUẨN CV 7991 (Đề thi + Đáp án + HD Chấm + Ma trận + Bản đặc tả)
 */
export function exportFullDossierCv7991WordDoc(
  config: ExamConfig,
  chuDeList: ChuDeItem[],
  cauList: CauItem[],
  luat: LuatConfig,
  questions: QuestionItem[],
  studyGuide?: StudyGuideData
): void {
  const unifiedData = getUnifiedMatrixSpecData(chuDeList, cauList, luat);
  const title = config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>TRỌN BỘ HỒ SƠ CV 7991 - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- MỤC 1: ĐỀ THI -->
  ${renderExamHeader(school, '101', title, subject, gradeStr, config)}
  ${renderExamQuestionsToWord(questions)}
  <div class="text-center bold italic" style="margin-top: 20pt; margin-bottom: 20pt;">
    --- HẾT ---<br>
    <span style="font-size: 10pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>

  <!-- MỤC 2: ĐÁP ÁN & HƯỚNG DẪN CHẤM -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 4pt;">
    ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM – MÃ ĐỀ 101
  </div>
  <div class="text-center italic" style="margin-bottom: 12pt;">
    Môn: ${subject} – ${gradeStr} (Thang điểm: 10,0 điểm)
  </div>
  <div class="bold" style="margin-bottom: 5pt;">I. BẢNG ĐÁP ÁN TRẮC NGHIỆM</div>
  ${renderQuickAnswerTableFromQuestions(questions)}
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">II. HƯỚNG DẪN CHẤM CHI TIẾT TỰ LUẬN</div>
  ${renderDetailedSolutionsToWord(questions)}

  <!-- MỤC 3: MA TRẬN & BẢN ĐẶC TẢ CHUẨN PHỤ LỤC CV 7991 -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    KHUNG MA TRẬN ĐỀ KIỂM TRA (MẪU THAM KHẢO CV 7991)
  </div>
  ${renderCv7991MatrixWord(unifiedData, config)}

  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-top: 10pt; margin-bottom: 8pt;">
    BẢN ĐẶC TẢ ĐỀ KIỂM TRA (MẪU THAM KHẢO CV 7991)
  </div>
  ${renderCv7991SpecWord(unifiedData, config)}

  ${studyGuide ? `
  <!-- MỤC 4: ĐỀ CƯƠNG ÔN TẬP -->
  <div class="page-break"></div>
  <div class="text-center bold uppercase" style="font-size: 13pt; margin-bottom: 8pt;">
    ĐỀ CƯƠNG ÔN TẬP VÀ CẨM NANG TRỌNG TÂM
  </div>
  ${renderStudyGuideContent(studyGuide)}
  ` : ''}
</body>
</html>
  `;

  downloadBlob(htmlContent, `Tron_Bo_Ho_So_CV7991_${subject.replace(/\\s+/g, '_')}_Lop${config.grade}.doc`);
}

/**
 * Xuất ĐỀ KIỂM TRA CHUẨN A4 TIMES NEW ROMAN 14PT
 * Form chuẩn bắt buộc theo mẫu De_Kiem_Tra_GK1_KHTN9_2026_2027_A4_TNR14.docx
 * Áp dụng cho Tiểu học (1-5), THCS (6-9), THPT (10-12) mọi môn học.
 */
export function exportStandardExamWordDoc(
  config: ExamConfig,
  questions: QuestionItem[],
  examCode: string = '101'
): void {
  const title = (config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ').toUpperCase();
  const school = config.schoolName ? config.schoolName.toUpperCase() : '';
  const department = config.departmentName ? config.departmentName.toUpperCase() : '';
  const subject = (config.customSubject || config.subject || 'Môn học').toUpperCase();
  const gradeStr = config.gradeLevel === 'primary' ? `LỚP ${config.grade}` : `LỚP ${config.grade}`;
  const academicYear = config.academicYear || '2026 - 2027';
  const duration = config.durationMinutes || 45;

  const p1Questions = questions.filter(q => q.part === 'part1' || q.type === 'mcq_single');
  const p2Questions = questions.filter(q => q.part === 'part2' || q.type === 'true_false_group');
  const p3Questions = questions.filter(q => q.part === 'part3' || q.type === 'short_answer');
  const p4Questions = questions.filter(q => q.part === 'part4' || q.type === 'essay');

  const p1Score = p1Questions.reduce((s, q) => s + (q.score || 0.25), 0);
  const p2Score = p2Questions.reduce((s, q) => s + (q.score || 1.0), 0);
  const p3Score = p3Questions.reduce((s, q) => s + (q.score || 0.5), 0);
  const p4Score = p4Questions.reduce((s, q) => s + (q.score || 1.0), 0);

  const fmtScore = (n: number) => (n % 1 === 0 ? `${n},0` : n.toFixed(2).replace('.', ','));

  let questionCounter = 1;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title} - ${subject} ${gradeStr}</title>
  <style>
    @page SectionStandard {
      size: 21.0cm 29.7cm;
      margin: 2.0cm 2.0cm 2.0cm 2.5cm;
      mso-page-orientation: portrait;
      mso-header-margin: 36.0pt;
      mso-footer-margin: 36.0pt;
    }
    div.SectionStandard {
      page: SectionStandard;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000000;
      margin: 0;
      padding: 0;
    }
    p, div, span, td, th {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.35;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
    }
    .header-table, .header-table td, .header-table th {
      border: none !important;
      padding: 2pt 0;
      vertical-align: top;
    }
    .option-table, .option-table td {
      border: none !important;
      padding: 2pt 0;
      vertical-align: top;
    }
    .grid-table, .grid-table th, .grid-table td {
      border: 1px solid #000000 !important;
      padding: 4pt 6pt;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .page-break { page-break-before: always; break-before: page; mso-break-type: section-break; }
    .question-item { margin-top: 8pt; margin-bottom: 8pt; }
  </style>
</head>
<body>
<div class="SectionStandard">
  <!-- PHẦN ĐẦU TRANG (2 KHỐI NẰM NGANG) -->
  <table class="header-table" style="width: 100%;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        ${department ? `<div class="bold">${department}</div>` : ''}
        <div class="bold">${school || 'TRƯỜNG THCS & THPT'}</div>
        <div style="margin-top: 4pt;">MÃ ĐỀ THI: <b>${examCode}</b></div>
        <div style="letter-spacing: 2px;">----------------</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <div class="bold">${title}</div>
        <div class="bold">NĂM HỌC: ${academicYear}</div>
        <div class="bold">MÔN: ${subject} – ${gradeStr}</div>
        <div class="italic" style="font-size: 13pt;">Thời gian làm bài: ${duration} phút (không kể thời gian phát đề)</div>
      </td>
    </tr>
  </table>

  <!-- THÔNG TIN HỌC SINH -->
  <div style="margin-top: 8pt; margin-bottom: 12pt; border-bottom: 1px solid #000; padding-bottom: 6pt;">
    Họ và tên học sinh: ................................................................ Lớp: .................... Số báo danh: ....................
  </div>

  <!-- PHẦN 1: ĐỀ KIỂM TRA -->
  <div class="text-center bold uppercase" style="font-size: 14pt; margin-bottom: 10pt;">
    PHẦN 1: ĐỀ KIỂM TRA
  </div>

  ${p1Questions.length > 0 ? `
  <!-- PHẦN I. TRẮC NGHIỆM NHIỀU LỰA CHỌN -->
  <div class="bold" style="margin-top: 10pt; margin-bottom: 4pt;">
    I. PHẦN TRẮC NGHIỆM NHIỀU LỰA CHỌN (${fmtScore(p1Score)} điểm)
  </div>
  <div class="italic" style="font-size: 13pt; margin-bottom: 8pt;">
    Thí sinh trả lời từ câu ${questionCounter} đến câu ${questionCounter + p1Questions.length - 1}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
  </div>

  ${p1Questions.map((q) => {
    const currentNum = questionCounter++;
    const opts = q.options || ['A', 'B', 'C', 'D'];
    const maxOptLen = Math.max(...opts.map(o => (o || '').length));

    let optionsHtml = '';
    if (opts.length === 4 && maxOptLen <= 14) {
      // 4 phương án trên 1 dòng
      optionsHtml = `
      <table class="option-table" style="width: 100%; margin-top: 3pt;">
        <tr>
          <td style="width: 25%;"><b>A.</b> ${formatLatexToWordUnicode(opts[0])}</td>
          <td style="width: 25%;"><b>B.</b> ${formatLatexToWordUnicode(opts[1])}</td>
          <td style="width: 25%;"><b>C.</b> ${formatLatexToWordUnicode(opts[2])}</td>
          <td style="width: 25%;"><b>D.</b> ${formatLatexToWordUnicode(opts[3])}</td>
        </tr>
      </table>`;
    } else if (opts.length === 4 && maxOptLen <= 48) {
      // 2 cột chuẩn: Dòng 1 (A và B tại vị trí 7.5cm), Dòng 2 (C và D tại vị trí 7.5cm)
      optionsHtml = `
      <table class="option-table" style="width: 100%; margin-top: 3pt;">
        <tr>
          <td style="width: 46%; padding-right: 6pt;"><b>A.</b> ${formatLatexToWordUnicode(opts[0])}</td>
          <td style="width: 54%; padding-left: 10pt;"><b>B.</b> ${formatLatexToWordUnicode(opts[1])}</td>
        </tr>
        <tr>
          <td style="width: 46%; padding-right: 6pt;"><b>C.</b> ${formatLatexToWordUnicode(opts[2])}</td>
          <td style="width: 54%; padding-left: 10pt;"><b>D.</b> ${formatLatexToWordUnicode(opts[3])}</td>
        </tr>
      </table>`;
    } else {
      // Dài: 4 dòng riêng biệt
      optionsHtml = `
      <div style="margin-left: 10pt; margin-top: 3pt;">
        ${opts.map((opt, idx) => `<div><b>${String.fromCharCode(65 + idx)}.</b> ${formatLatexToWordUnicode(opt)}</div>`).join('')}
      </div>`;
    }

    return `
    <div class="question-item">
      <div><b>Câu ${currentNum}.</b> ${formatLatexToWordUnicode(q.question)}</div>
      ${optionsHtml}
    </div>`;
  }).join('')}
  ` : ''}

  ${p2Questions.length > 0 ? `
  <!-- PHẦN II. TRẮC NGHIỆM ĐÚNG - SAI -->
  <div class="bold" style="margin-top: 14pt; margin-bottom: 4pt;">
    II. PHẦN TRẮC NGHIỆM ĐÚNG - SAI (${fmtScore(p2Score)} điểm)
  </div>
  <div class="italic" style="font-size: 13pt; margin-bottom: 8pt;">
    Thí sinh trả lời từ câu ${questionCounter} đến câu ${questionCounter + p2Questions.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
  </div>

  ${p2Questions.map((q) => {
    const currentNum = questionCounter++;
    const subItems = q.subItems && q.subItems.length === 4 ? q.subItems : [
      { id: 'a', label: 'a', statement: 'Nhận định 1', isCorrect: true },
      { id: 'b', label: 'b', statement: 'Nhận định 2', isCorrect: false },
      { id: 'c', label: 'c', statement: 'Nhận định 3', isCorrect: true },
      { id: 'd', label: 'd', statement: 'Nhận định 4', isCorrect: false },
    ];

    return `
    <div class="question-item">
      <div><b>Câu ${currentNum}.</b> ${formatLatexToWordUnicode(q.question)}</div>
      <div style="margin-left: 15pt; margin-top: 4pt;">
        ${subItems.map((s, sIdx) => {
          const lbl = String.fromCharCode(97 + sIdx);
          return `<div><b>${lbl})</b> ${formatLatexToWordUnicode(s.statement)}</div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('')}
  ` : ''}

  ${p3Questions.length > 0 ? `
  <!-- PHẦN III. TRẢ LỜI NGẮN -->
  <div class="bold" style="margin-top: 14pt; margin-bottom: 4pt;">
    III. PHẦN TRẮC NGHIỆM TRẢ LỜI NGẮN (${fmtScore(p3Score)} điểm)
  </div>
  <div class="italic" style="font-size: 13pt; margin-bottom: 8pt;">
    Thí sinh trả lời từ câu ${questionCounter} đến câu ${questionCounter + p3Questions.length - 1}. Thí sinh viết câu trả lời ngắn vào phiếu làm bài.
  </div>

  ${p3Questions.map((q) => {
    const currentNum = questionCounter++;
    return `
    <div class="question-item">
      <div><b>Câu ${currentNum}.</b> ${formatLatexToWordUnicode(q.question)}</div>
    </div>`;
  }).join('')}
  ` : ''}

  ${p4Questions.length > 0 ? `
  <!-- PHẦN IV. TỰ LUẬN -->
  <div class="bold" style="margin-top: 14pt; margin-bottom: 4pt;">
    ${p1Questions.length > 0 || p2Questions.length > 0 ? 'IV. PHẦN TỰ LUẬN' : 'PHẦN TỰ LUẬN'} (${fmtScore(p4Score)} điểm)
  </div>
  <div class="italic" style="font-size: 13pt; margin-bottom: 8pt;">
    Thí sinh trình bày chi tiết lời giải các câu hỏi sau vào giấy làm bài.
  </div>

  ${p4Questions.map((q) => {
    const currentNum = questionCounter++;
    const qScoreStr = q.score ? `(${fmtScore(q.score)} điểm)` : '';
    return `
    <div class="question-item">
      <div><b>Câu ${currentNum} ${qScoreStr}:</b> ${formatLatexToWordUnicode(q.question)}</div>
    </div>`;
  }).join('')}
  ` : ''}

  <div class="text-center bold italic" style="margin-top: 25pt; margin-bottom: 20pt;">
    ------------------- HẾT -------------------<br>
    <span style="font-size: 11pt; font-weight: normal;">(Cán bộ coi thi không giải thích gì thêm)</span>
  </div>

  <!-- PHẦN 2: ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM (NGẮT TRANG) -->
  <div class="page-break"></div>

  <table class="header-table" style="width: 100%;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        ${department ? `<div class="bold">${department}</div>` : ''}
        <div class="bold">${school || 'TRƯỜNG THCS & THPT'}</div>
        <div style="margin-top: 4pt;">MÃ ĐỀ THI: <b>${examCode}</b></div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <div class="bold">HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM</div>
        <div class="bold">MÔN: ${subject} – ${gradeStr}</div>
        <div class="italic">Thang điểm: 10,0 điểm</div>
      </td>
    </tr>
  </table>

  <div class="text-center bold uppercase" style="font-size: 14pt; margin-top: 12pt; margin-bottom: 10pt;">
    PHẦN 2: ĐÁP ÁN VÀ HƯỚNG DẪN CHẤM
  </div>

  ${p1Questions.length > 0 ? `
  <div class="bold" style="margin-top: 10pt; margin-bottom: 5pt;">
    1. ĐÁP ÁN PHẦN I - TRẮC NGHIỆM NHIỀU LỰA CHỌN (Mỗi câu đúng: 0,25 điểm)
  </div>
  <table class="grid-table" style="text-align: center; width: 100%;">
    <tr style="background-color: #f2f2f2; font-weight: bold;">
      ${p1Questions.map((_, idx) => `<th>Câu ${idx + 1}</th>`).join('')}
    </tr>
    <tr>
      ${p1Questions.map((q) => `<td style="font-weight: bold; font-size: 15pt; color: #003366;">${String(q.correctAnswer || 'A')}</td>`).join('')}
    </tr>
  </table>
  ` : ''}

  ${p2Questions.length > 0 ? `
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">
    2. ĐÁP ÁN PHẦN II - TRẮC NGHIỆM ĐÚNG - SAI
  </div>
  <table class="grid-table" style="width: 100%;">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
        <th style="width: 12%;">Câu</th>
        <th style="width: 12%;">Lệnh hỏi</th>
        <th style="width: 16%;">Đáp án (Đ/S)</th>
        <th style="text-align: left;">Hướng dẫn giải tóm tắt</th>
      </tr>
    </thead>
    <tbody>
      ${p2Questions.map((q, qIdx) => {
        const qNum = p1Questions.length + qIdx + 1;
        const subItems = q.subItems && q.subItems.length === 4 ? q.subItems : [
          { id: 'a', label: 'a', statement: '', isCorrect: true, explanation: '' },
          { id: 'b', label: 'b', statement: '', isCorrect: false, explanation: '' },
          { id: 'c', label: 'c', statement: '', isCorrect: true, explanation: '' },
          { id: 'd', label: 'd', statement: '', isCorrect: false, explanation: '' },
        ];
        return subItems.map((sub, sIdx) => `
        <tr>
          ${sIdx === 0 ? `<td rowspan="4" style="text-align: center; font-weight: bold; vertical-align: middle;">Câu ${qNum}</td>` : ''}
          <td style="text-align: center; font-weight: bold;">${String.fromCharCode(97 + sIdx)})</td>
          <td style="text-align: center; font-weight: bold; color: ${sub.isCorrect ? '#006600' : '#cc0000'};">${sub.isCorrect ? 'ĐÚNG' : 'SAI'}</td>
          <td style="font-size: 13pt;">${formatLatexToWordUnicode(sub.explanation || q.explanation || 'Áp dụng quy tắc và dữ kiện đề bài.')}</td>
        </tr>`).join('');
      }).join('')}
    </tbody>
  </table>

  <!-- BẢNG QUY TẮC TÍNH ĐIỂM ĐÚNG SAI CHUẨN BỘ -->
  <div style="font-size: 12pt; font-style: italic; margin-top: 4pt; margin-bottom: 12pt;">
    * <b>Quy tắc tính điểm chuẩn Phần II:</b><br>
    - Thí sinh chỉ lựa chọn chính xác 01 ý trong 01 câu được <b>0,10 điểm</b>.<br>
    - Thí sinh chỉ lựa chọn chính xác 02 ý trong 01 câu được <b>0,25 điểm</b>.<br>
    - Thí sinh chỉ lựa chọn chính xác 03 ý trong 01 câu được <b>0,50 điểm</b>.<br>
    - Thí sinh lựa chọn chính xác cả 04 ý trong 01 câu được <b>1,00 điểm</b>.
  </div>
  ` : ''}

  ${p3Questions.length > 0 ? `
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">
    3. ĐÁP ÁN PHẦN III - TRẮC NGHIỆM TRẢ LỜI NGẮN (Mỗi câu: 0,5 điểm)
  </div>
  <table class="grid-table" style="width: 100%;">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
        <th style="width: 12%;">Câu</th>
        <th style="width: 25%;">Đáp án chính xác</th>
        <th style="text-align: left;">Hướng dẫn phương pháp</th>
      </tr>
    </thead>
    <tbody>
      ${p3Questions.map((q, idx) => `
      <tr>
        <td style="text-align: center; font-weight: bold;">Câu ${p1Questions.length + p2Questions.length + idx + 1}</td>
        <td style="text-align: center; font-weight: bold; color: #006600;">${String(q.correctAnswer)}</td>
        <td style="font-size: 13pt;">${formatLatexToWordUnicode(q.explanation || 'Tính toán theo công thức cốt lõi.')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : ''}

  ${p4Questions.length > 0 ? `
  <div class="bold" style="margin-top: 15pt; margin-bottom: 5pt;">
    ${p1Questions.length > 0 || p2Questions.length > 0 ? '4. HƯỚNG DẪN CHẤM PHẦN IV - TỰ LUẬN' : 'HƯỚNG DẪN CHẤM PHẦN TỰ LUẬN'}
  </div>
  <table class="grid-table" style="width: 100%;">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
        <th style="width: 10%;">Câu</th>
        <th style="text-align: left;">Nội dung đáp án & Yêu cầu cần đạt</th>
        <th style="width: 15%;">Điểm</th>
      </tr>
    </thead>
    <tbody>
      ${p4Questions.map((q, idx) => {
        const qNum = p1Questions.length + p2Questions.length + p3Questions.length + idx + 1;
        const totalQScore = q.score || 1.0;

        if (q.rubric && q.rubric.length > 0) {
          return q.rubric.map((r, rIdx) => `
          <tr>
            ${rIdx === 0 ? `<td rowspan="${q.rubric!.length}" style="text-align: center; font-weight: bold; vertical-align: top;">Câu ${qNum}<br><span style="font-weight: normal; font-size: 12pt;">(${fmtScore(totalQScore)}đ)</span></td>` : ''}
            <td style="font-size: 13pt;"><b>Bước ${r.step}:</b> ${formatLatexToWordUnicode(r.detail)}</td>
            <td style="text-align: center; font-weight: bold;">${fmtScore(r.point)}đ</td>
          </tr>`).join('');
        }

        return `
        <tr>
          <td style="text-align: center; font-weight: bold; vertical-align: top;">Câu ${qNum}</td>
          <td style="font-size: 13pt;">
            <div>${formatLatexToWordUnicode(q.explanation || 'Trình bày đầy đủ các bước lập luận, biến đổi và kết luận chính xác.')}</div>
          </td>
          <td style="text-align: center; font-weight: bold;">${fmtScore(totalQScore)}đ</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : ''}
</div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `De_Kiem_Tra_${subject.replace(/\\s+/g, '_')}_Lop${config.grade}_A4_TNR14.doc`);
}

function renderQuickAnswerTableFromQuestions(questions: QuestionItem[]): string {
  const objective = questions.filter(q => q.part !== 'part4' && q.type !== 'essay');
  return `
  <table>
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        <th style="width: 20%; text-align: center;">Phần thi</th>
        <th style="text-align: left;">Đáp án chuẩn</th>
        <th style="width: 15%; text-align: center;">Điểm</th>
      </tr>
    </thead>
    <tbody>
      ${objective
        .map((q, idx) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: center;">${q.part === 'part1' ? 'Phần I' : q.part === 'part2' ? 'Phần II' : 'Phần III'}</td>
          <td style="font-weight: bold; color: #006600;">${String(q.correctAnswer)}</td>
          <td style="text-align: center; font-weight: bold;">${q.score || 0.25}đ</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `;
}

function renderCv7991MatrixWord(tableData: UnifiedTableData, config: ExamConfig): string {
  const showTln = tableData.showTln;
  const rows = tableData.rows;

  return `
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;" border="1">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th rowspan="3" style="width: 4%;">TT</th>
        <th rowspan="3" style="width: 14%; text-align: left;">Chủ đề/Chương</th>
        <th rowspan="3" style="width: 18%; text-align: left;">Nội dung/đơn vị kiến thức</th>
        <th colspan="${showTln ? 12 : 9}">Mức độ đánh giá</th>
        <th colspan="3" rowspan="2">Tổng số câu</th>
        <th rowspan="3" style="width: 7%;">Tỉ lệ % điểm</th>
      </tr>
      <tr style="background-color: #f8fafc; font-weight: bold;">
        <th colspan="3">Nhiều lựa chọn</th>
        <th colspan="3">Đúng - Sai</th>
        ${showTln ? '<th colspan="3">Trả lời ngắn</th>' : ''}
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f1f5f9; font-size: 8.5pt; font-weight: bold;">
        <th>Biết</th><th>Hiểu</th><th>VD</th>
        <th>Biết</th><th>Hiểu</th><th>VD</th>
        ${showTln ? '<th>Biết</th><th>Hiểu</th><th>VD</th>' : ''}
        <th>Biết</th><th>Hiểu</th><th>VD</th>
        <th>Biết</th><th>Hiểu</th><th>VD</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r) => {
        const nlc = r.matrixCells.NLC;
        const ds = r.matrixCells.DS;
        const tln = r.matrixCells.TLN;
        const tl = r.matrixCells.TL;

        const totBiet = nlc.Biet.count + ds.Biet.count + (showTln ? tln.Biet.count : 0) + tl.Biet.count;
        const totHieu = nlc.Hieu.count + ds.Hieu.count + (showTln ? tln.Hieu.count : 0) + tl.Hieu.count;
        const totVd = nlc.VanDung.count + ds.VanDung.count + (showTln ? tln.VanDung.count : 0) + tl.VanDung.count;

        return `
        <tr>
          <td style="font-weight: bold;">${r.stt}</td>
          ${r.isFirstInChuDe ? `<td rowspan="${r.rowspanChuDe || 1}" style="text-align: left; vertical-align: top; font-weight: bold;">${r.chuDeTen}</td>` : ''}
          <td style="text-align: left; padding: 3pt;">${r.noiDungTen}</td>
          <td>${nlc.Biet.displayStr || '-'}</td>
          <td>${nlc.Hieu.displayStr || '-'}</td>
          <td>${nlc.VanDung.displayStr || '-'}</td>
          <td>${ds.Biet.displayStr || '-'}</td>
          <td>${ds.Hieu.displayStr || '-'}</td>
          <td>${ds.VanDung.displayStr || '-'}</td>
          ${showTln ? `<td>${tln.Biet.displayStr || '-'}</td><td>${tln.Hieu.displayStr || '-'}</td><td>${tln.VanDung.displayStr || '-'}</td>` : ''}
          <td>${tl.Biet.displayStr || '-'}</td>
          <td>${tl.Hieu.displayStr || '-'}</td>
          <td>${tl.VanDung.displayStr || '-'}</td>
          <td style="font-weight: bold;">${totBiet || '-'}</td>
          <td style="font-weight: bold;">${totHieu || '-'}</td>
          <td style="font-weight: bold;">${totVd || '-'}</td>
          <td style="font-weight: bold;">${r.rowPercentScore.toFixed(1)}%</td>
        </tr>
        `;
      }).join('')}
      <tr style="background-color: #f1f5f9; font-weight: bold;">
        <td colspan="3" style="text-align: center;">TỔNG SỐ CÂU / Ý</td>
        <td>${tableData.typeLevelTotals.NLC.Biet.count || '-'}</td>
        <td>${tableData.typeLevelTotals.NLC.Hieu.count || '-'}</td>
        <td>${tableData.typeLevelTotals.NLC.VanDung.count || '-'}</td>
        <td>${tableData.typeLevelTotals.DS.Biet.count || '-'}</td>
        <td>${tableData.typeLevelTotals.DS.Hieu.count || '-'}</td>
        <td>${tableData.typeLevelTotals.DS.VanDung.count || '-'}</td>
        ${showTln ? `<td>${tableData.typeLevelTotals.TLN.Biet.count || '-'}</td><td>${tableData.typeLevelTotals.TLN.Hieu.count || '-'}</td><td>${tableData.typeLevelTotals.TLN.VanDung.count || '-'}</td>` : ''}
        <td>${tableData.typeLevelTotals.TL.Biet.count || '-'}</td>
        <td>${tableData.typeLevelTotals.TL.Hieu.count || '-'}</td>
        <td>${tableData.typeLevelTotals.TL.VanDung.count || '-'}</td>
        <td>${tableData.levelGrandTotals.Biet.count}</td>
        <td>${tableData.levelGrandTotals.Hieu.count}</td>
        <td>${tableData.levelGrandTotals.VanDung.count}</td>
        <td>${tableData.grandTotalPercent.toFixed(1)}%</td>
      </tr>
      <tr style="background-color: #e2e8f0; font-weight: bold;">
        <td colspan="3" style="text-align: center;">TỔNG ĐIỂM TỪNG MỨC</td>
        <td colspan="3">${tableData.typeGrandTotals.NLC.score.toFixed(2)}đ</td>
        <td colspan="3">${tableData.typeGrandTotals.DS.score.toFixed(2)}đ</td>
        ${showTln ? `<td colspan="3">${tableData.typeGrandTotals.TLN.score.toFixed(2)}đ</td>` : ''}
        <td colspan="3">${tableData.typeGrandTotals.TL.score.toFixed(2)}đ</td>
        <td>${tableData.levelGrandTotals.Biet.score.toFixed(1)}đ</td>
        <td>${tableData.levelGrandTotals.Hieu.score.toFixed(1)}đ</td>
        <td>${tableData.levelGrandTotals.VanDung.score.toFixed(1)}đ</td>
        <td>${tableData.grandTotalScore.toFixed(1)}đ</td>
      </tr>
      <tr style="background-color: #cbd5e1; font-weight: bold;">
        <td colspan="3" style="text-align: center;">TỈ LỆ % ĐIỂM TỪNG MỨC</td>
        <td colspan="3">${tableData.typeGrandTotals.NLC.percent.toFixed(1)}%</td>
        <td colspan="3">${tableData.typeGrandTotals.DS.percent.toFixed(1)}%</td>
        ${showTln ? `<td colspan="3">${tableData.typeGrandTotals.TLN.percent.toFixed(1)}%</td>` : ''}
        <td colspan="3">${tableData.typeGrandTotals.TL.percent.toFixed(1)}%</td>
        <td>${tableData.levelGrandTotals.Biet.percent.toFixed(1)}%</td>
        <td>${tableData.levelGrandTotals.Hieu.percent.toFixed(1)}%</td>
        <td>${tableData.levelGrandTotals.VanDung.percent.toFixed(1)}%</td>
        <td>100%</td>
      </tr>
    </tbody>
  </table>
  `;
}

function renderCv7991SpecWord(tableData: UnifiedTableData, config: ExamConfig): string {
  const showTln = tableData.showTln;
  const rows = tableData.rows;

  return `
  <table style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: center;" border="1">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th rowspan="4" style="width: 4%;">TT</th>
        <th rowspan="4" style="width: 14%; text-align: left;">Chủ đề/Chương</th>
        <th rowspan="4" style="width: 15%; text-align: left;">Nội dung/đơn vị kiến thức</th>
        <th rowspan="4" style="width: 27%; text-align: left;">Yêu cầu cần đạt</th>
        <th colspan="${showTln ? 12 : 9}" style="background-color: #e2e8f0; text-transform: uppercase;">Số câu hỏi ở các mức độ đánh giá</th>
      </tr>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th colspan="${showTln ? 9 : 6}">TNKQ</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f8fafc; font-weight: bold; font-size: 8.5pt;">
        <th colspan="3">Nhiều lựa chọn</th>
        <th colspan="3">Đúng – Sai</th>
        ${showTln ? '<th colspan="3">Trả lời ngắn</th>' : ''}
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f2f2f2; font-weight: bold; font-size: 8pt;">
        <th style="width: 4.5%;">Biết</th>
        <th style="width: 4.5%;">Hiểu</th>
        <th style="width: 4.5%;">V.Dụng</th>

        <th style="width: 4.5%;">Biết</th>
        <th style="width: 4.5%;">Hiểu</th>
        <th style="width: 4.5%;">V.Dụng</th>

        ${showTln ? `
          <th style="width: 4.5%;">Biết</th>
          <th style="width: 4.5%;">Hiểu</th>
          <th style="width: 4.5%;">V.Dụng</th>
        ` : ''}

        <th style="width: 4.5%;">Biết</th>
        <th style="width: 4.5%;">Hiểu</th>
        <th style="width: 4.5%;">V.Dụng</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r) => {
        // Format YCCĐ string by cognitive levels exactly matching UI
        const bietYccdList = r.yccdList.filter((y) => y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung');
        const hieuYccdList = r.yccdList.filter((y) => y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung');
        const vdYccdList = r.yccdList.filter((y) => y.mucToiDa === 'VanDung');

        const hasBietQ =
          r.matrixCells.NLC.Biet.count > 0 ||
          r.matrixCells.DS.Biet.count > 0 ||
          r.matrixCells.TLN.Biet.count > 0 ||
          r.matrixCells.TL.Biet.count > 0;

        const hasHieuQ =
          r.matrixCells.NLC.Hieu.count > 0 ||
          r.matrixCells.DS.Hieu.count > 0 ||
          r.matrixCells.TLN.Hieu.count > 0 ||
          r.matrixCells.TL.Hieu.count > 0;

        const hasVdQ =
          r.matrixCells.NLC.VanDung.count > 0 ||
          r.matrixCells.DS.VanDung.count > 0 ||
          r.matrixCells.TLN.VanDung.count > 0 ||
          r.matrixCells.TL.VanDung.count > 0;

        // Clean pedagogical YCCĐ text without developer codes [ND1.x] or (Biet)
        let yccdHtml = '';
        if (r.yccdList.length === 0) {
          yccdHtml = '<i style="color: #b45309;">Chưa có YCCĐ</i>';
        } else {
          const blocks: string[] = [];
          if (hasBietQ && bietYccdList.length > 0) {
            const items = bietYccdList.map((y) => `&nbsp;&nbsp;• ${y.noiDung}${y.nangLuc ? ` <b>(${y.nangLuc})</b>` : ''}`).join('<br>');
            blocks.push(`<b>• - Biết:</b><br>${items}`);
          }
          if (hasHieuQ && hieuYccdList.length > 0) {
            const items = hieuYccdList.map((y) => `&nbsp;&nbsp;• ${y.noiDung}${y.nangLuc ? ` <b>(${y.nangLuc})</b>` : ''}`).join('<br>');
            blocks.push(`<b>• - Hiểu:</b><br>${items}`);
          }
          if (hasVdQ && vdYccdList.length > 0) {
            const items = vdYccdList.map((y) => `&nbsp;&nbsp;• ${y.noiDung}${y.nangLuc ? ` <b>(${y.nangLuc})</b>` : ''}`).join('<br>');
            blocks.push(`<b>• - Vận dụng:</b><br>${items}`);
          }
          // Fallback if no questions are mapped yet to levels
          if (blocks.length === 0) {
            if (bietYccdList.length > 0) blocks.push(`<b>• - Biết:</b><br>` + bietYccdList.map(y => `&nbsp;&nbsp;• ${y.noiDung}`).join('<br>'));
            if (hieuYccdList.length > 0) blocks.push(`<b>• - Hiểu:</b><br>` + hieuYccdList.map(y => `&nbsp;&nbsp;• ${y.noiDung}`).join('<br>'));
            if (vdYccdList.length > 0) blocks.push(`<b>• - Vận dụng:</b><br>` + vdYccdList.map(y => `&nbsp;&nbsp;• ${y.noiDung}`).join('<br>'));
          }
          yccdHtml = blocks.join('<br><br>');
        }

        const nlc = r.matrixCells.NLC;
        const ds = r.matrixCells.DS;
        const tln = r.matrixCells.TLN;
        const tl = r.matrixCells.TL;

        const renderCellWord = (cell: MatrixCellData) => {
          if (!cell || cell.count === 0) return '-';
          if (cell.questionNumbersStr) {
            return `<b>${cell.count}</b><br><span style="font-size: 8pt; color: #1e3a8a;">(${cell.questionNumbersStr})</span>`;
          }
          return `<b>${cell.count}</b>`;
        };

        return `
        <tr>
          <td style="font-weight: bold; vertical-align: top; padding: 4pt;">${r.stt}</td>
          ${r.isFirstInChuDe ? `<td rowspan="${r.rowspanChuDe || 1}" style="text-align: left; vertical-align: top; font-weight: bold; padding: 4pt;">${r.chuDeTen}</td>` : ''}
          <td style="text-align: left; vertical-align: top; padding: 4pt; font-weight: bold;">${r.noiDungTen}</td>
          <td style="text-align: left; vertical-align: top; padding: 4pt; font-size: 8.5pt; line-height: 1.4;">${yccdHtml}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(nlc.Biet)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(nlc.Hieu)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(nlc.VanDung)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(ds.Biet)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(ds.Hieu)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(ds.VanDung)}</td>
          ${showTln ? `
            <td style="vertical-align: top; padding: 4pt;">${renderCellWord(tln.Biet)}</td>
            <td style="vertical-align: top; padding: 4pt;">${renderCellWord(tln.Hieu)}</td>
            <td style="vertical-align: top; padding: 4pt;">${renderCellWord(tln.VanDung)}</td>
          ` : ''}
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(tl.Biet)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(tl.Hieu)}</td>
          <td style="vertical-align: top; padding: 4pt;">${renderCellWord(tl.VanDung)}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  `;
}

/**
 * 5. Xuất ĐỀ CƯƠNG ÔN TẬP RIÊNG BIỆT (.doc)
 */
export function exportStudyGuideWordDoc(config: ExamConfig, studyGuide: StudyGuideData): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA';
  const school = config.schoolName || '';
  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>ĐỀ CƯƠNG ÔN TẬP - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">${school}</span><br>
        <span class="bold">TỔ CHUYÊN MÔN</span><br>
        <span>----------------</span>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <span class="bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
        <span class="bold">Độc lập – Tự do – Hạnh phúc</span><br>
        <span>-----------------------</span>
      </td>
    </tr>
  </table>

  <div class="text-center" style="margin-top: 10pt; margin-bottom: 15pt;">
    <div class="bold uppercase" style="font-size: 14pt;">ĐỀ CƯƠNG ÔN TẬP & CẨM NANG KIẾN THỨC CỐT LÕI</div>
    <div class="bold uppercase">${title}</div>
    <div class="bold">MÔN: ${subject.toUpperCase()} – ${gradeStr.toUpperCase()}</div>
    <div class="italic">Chương trình GDPT 2018 – Bộ sách: ${config.textbook}</div>
    <div class="italic">Tài liệu ôn thi phát cho học sinh học kỳ</div>
  </div>

  ${renderStudyGuideContent(studyGuide)}
</body>
</html>
  `;

  downloadBlob(htmlContent, `De_Cuong_On_Tap_${subject.replace(/\s+/g, '_')}_Lop${config.grade}.doc`);
}

/**
 * Robust Printing Engine that handles iframe sandboxes cleanly
 */
export function printDocument(htmlContent: string, documentTitle: string = 'In_Tai_Lieu'): void {
  // Try 1: Hidden iframe inside the current document
  try {
    const existingIframe = document.getElementById('ai-print-frame');
    if (existingIframe) {
      existingIframe.remove();
    }
    const iframe = document.createElement('iframe');
    iframe.id = 'ai-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print blocked by browser sandbox, triggering fallback:', e);
          fallbackPrint(htmlContent, documentTitle);
        }
      }, 400);
      return;
    }
  } catch (err) {
    console.warn('Iframe print failed, falling back:', err);
  }

  fallbackPrint(htmlContent, documentTitle);
}

function fallbackPrint(htmlContent: string, documentTitle: string) {
  // Try opening in a new tab with auto-print
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      return;
    }
  } catch (_) {}

  // If window.open is blocked, trigger download as HTML file
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ban_In_${documentTitle.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Universal HTML generator for print views
 */
export function wrapHtmlForPrint(title: string, bodyHtml: string, config?: ExamConfig): string {
  const fontSize = config?.layoutFontSize === 'small' ? '10pt' : config?.layoutFontSize === 'large' ? '12pt' : '11pt';
  const lineHeight = config?.layoutLineHeight === 'compact' ? '1.2' : config?.layoutLineHeight === 'relaxed' ? '1.8' : '1.35';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: ${fontSize};
      line-height: ${lineHeight};
      color: #000;
      background: #fff;
      margin: 0;
      padding: 15mm;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12pt;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 5pt 6pt;
      font-size: 10.5pt;
    }
    .header-table, .header-table th, .header-table td {
      border: none !important;
      padding: 2pt 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .italic { font-style: italic; }
    .uppercase { text-transform: uppercase; }
    .page-break { page-break-before: always; break-before: page; }
    .question-block { margin-bottom: 9pt; }
    .option-table, .option-table td {
      border: none !important;
      padding: 2pt 4pt;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #2563eb;
      color: white;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      margin: -15mm -15mm 15mm -15mm;
      z-index: 1000;
    }
    .no-print-bar button {
      background: white;
      color: #1e40af;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      margin-left: 8px;
    }
    @media print {
      .no-print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>Bản in A4: ${title}</strong> (Nhấn "In trang" hoặc dùng phím Ctrl + P)</div>
    <div>
      <button onclick="window.print()">🖨️ In trang</button>
      <button onclick="window.close()">Đóng</button>
    </div>
  </div>
  ${bodyHtml}
  <script>
    window.addEventListener('load', function() {
      // Auto trigger print after render
      setTimeout(function() {
        try { window.print(); } catch(e){}
      }, 500);
    });
  </script>
</body>
</html>
  `;
}

function downloadBlob(content: string, filename: string): void {
  const blob = new Blob(['\ufeff', content], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

function renderExamHeader(school: string, code: string, title: string, subject: string, gradeStr: string, config: ExamConfig): string {
  const department = (config.departmentName || 'SỞ GIÁO DỤC & ĐÀO TẠO TPHCM').toUpperCase();
  const schoolName = (config.schoolName || 'TRƯỜNG THPT VÕ TRƯỜNG TOẢN').toUpperCase();
  const officialType = config.officialExamType || 'Đề chính thức';
  const pageCount = config.pageCountText || '2';
  const durationNote = config.durationNote || '(không kể thời gian phát đề)';
  const rawSubject = config.customSubject || config.subject || 'CÔNG NGHỆ ĐIỆN – ĐIỆN TỬ';
  const gradeSuffix = config.grade ? ` ${config.grade}` : '';
  const subjectDisplay = rawSubject.toUpperCase();
  const academicYear = config.academicYear || '2025 - 2026';
  const examTitle = (config.examTitle || 'ĐỀ KIỂM TRA CUỐI HỌC KÌ 1').toUpperCase();

  return `
  <table class="header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 6pt; font-family: 'Times New Roman', serif;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 11pt; line-height: 1.25;">${department}</div>
        <div class="bold uppercase" style="font-size: 11pt; line-height: 1.25;">${schoolName}</div>
        <div class="italic bold" style="font-size: 11pt; margin-top: 3pt;">${officialType}</div>
        <div class="italic" style="font-size: 10.5pt; margin-top: 2pt;">(Đề có _${pageCount}_ trang)</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 11.5pt; line-height: 1.25;">${examTitle} NĂM HỌC ${academicYear}</div>
        <div class="bold uppercase" style="font-size: 11.5pt; line-height: 1.25; margin-top: 3pt;">MÔN: ${subjectDisplay}${gradeSuffix}</div>
        <div class="italic" style="font-size: 11pt; margin-top: 3pt;">Thời gian làm bài: ${config.durationMinutes || 45} PHÚT</div>
        <div class="italic" style="font-size: 10.5pt;">${durationNote}</div>
      </td>
    </tr>
  </table>

  <div style="border-bottom: 1.5pt solid #000; padding-bottom: 4pt; margin-top: 8pt; margin-bottom: 12pt; font-size: 11pt; font-family: 'Times New Roman', serif;">
    <table class="header-table" style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="text-align: left; vertical-align: bottom;">
          <strong>Họ và tên:</strong> ................................................................ <strong>LỚP:</strong> ........... <strong>MS:</strong> .................... <strong>Số báo danh:</strong> ..............
        </td>
        <td style="text-align: right; vertical-align: bottom; font-weight: bold; font-size: 12pt; white-space: nowrap; padding-left: 10pt;">
          Mã đề ${code}
        </td>
      </tr>
    </table>
  </div>
  `;
}

function renderQuickAnswerTable(currentCode: ShuffledExamCode): string {
  return `
  <table>
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        <th style="width: 20%; text-align: center;">Phần thi</th>
        <th style="text-align: left;">Đáp án chuẩn</th>
      </tr>
    </thead>
    <tbody>
      ${currentCode.quickAnswers
        .map(
          (qa) => `
        <tr>
          <td style="text-align: center; font-weight: bold;">${qa.stt}</td>
          <td style="text-align: center;">${qa.part === 'part1' ? 'Phần I' : qa.part === 'part2' ? 'Phần II' : qa.part === 'part3' ? 'Phần III' : 'Phần IV'}</td>
          <td style="font-weight: bold; color: #006600;">${qa.answer}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  `;
}

function renderMatrixTable(matrix: ExamMatrix, config?: ExamConfig): string {
  const isPrimary = config?.gradeLevel === 'primary' || (config?.grade && Number(config.grade) <= 5);

  if (isPrimary) {
    const rows = matrix.rows || [];
    return `
    <div style="text-align: center; font-weight: bold; font-size: 11.5pt; text-transform: uppercase; margin-bottom: 4pt;">
      MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ TIỂU HỌC (THÔNG TƯ 27/2020/TT-BGDĐT)
    </div>
    <div style="text-align: center; font-style: italic; font-size: 10pt; margin-bottom: 8pt;">
      Môn: ${config?.customSubject || config?.subject || 'Toán học'} – Lớp ${config?.grade || '4'}
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;" border="1">
      <thead>
        <tr style="background-color: #f2f2f2; font-weight: bold;">
          <th rowspan="2" style="width: 5%;">TT</th>
          <th rowspan="2" style="width: 30%; text-align: left;">Mạch kiến thức, kĩ năng</th>
          <th colspan="3" style="background-color: #e0f2fe;">Mức 1 (Nhận biết)</th>
          <th colspan="3" style="background-color: #dcfce7;">Mức 2 (Thông hiểu)</th>
          <th colspan="3" style="background-color: #f3e8ff;">Mức 3 (Vận dụng)</th>
          <th colspan="3" style="background-color: #e2e8f0;">Tổng cộng</th>
          <th rowspan="2" style="width: 8%;">Tỉ lệ %</th>
        </tr>
        <tr style="background-color: #f8fafc; font-size: 8.5pt; font-weight: bold;">
          <th>TN</th><th>TL</th><th>Điểm</th>
          <th>TN</th><th>TL</th><th>Điểm</th>
          <th>TN</th><th>TL</th><th>Điểm</th>
          <th>Số TN</th><th>Số TL</th><th>Điểm</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, idx) => {
          const parseC = (v: any) => (typeof v === 'object' ? Number(v?.count) || 0 : Number(v) || 0);
          const p1 = r.part1 || {};
          const p4 = r.part4 || {};
          const m1TN = parseC(p1['Mức 1'] || p1['Biết']);
          const m1TL = parseC(p4['Mức 1'] || p4['Biết']);
          const m1Pt = (m1TN * 0.5 + m1TL * 1.0).toFixed(1);

          const m2TN = parseC(p1['Mức 2'] || p1['Hiểu']);
          const m2TL = parseC(p4['Mức 2'] || p4['Hiểu']);
          const m2Pt = (m2TN * 0.5 + m2TL * 1.0).toFixed(1);

          const m3TN = parseC(p1['Mức 3'] || p1['Vận dụng']);
          const m3TL = parseC(p4['Mức 3'] || p4['Vận dụng']);
          const m3Pt = (m3TN * 0.5 + m3TL * 1.5).toFixed(1);

          const totTN = m1TN + m2TN + m3TN;
          const totTL = m1TL + m2TL + m3TL;
          const totPt = (Number(m1Pt) + Number(m2Pt) + Number(m3Pt)).toFixed(1);
          const pct = Math.round((Number(totPt) / (config?.totalScore || 10)) * 100);

          return `
            <tr>
              <td style="font-weight: bold;">${idx + 1}</td>
              <td style="text-align: left; padding: 3pt;">${r.topic}</td>
              <td>${m1TN || '-'}</td><td>${m1TL || '-'}</td><td style="font-weight: bold; background-color: #f0f9ff;">${m1Pt}</td>
              <td>${m2TN || '-'}</td><td>${m2TL || '-'}</td><td style="font-weight: bold; background-color: #f0fdf4;">${m2Pt}</td>
              <td>${m3TN || '-'}</td><td>${m3TL || '-'}</td><td style="font-weight: bold; background-color: #faf5ff;">${m3Pt}</td>
              <td style="font-weight: bold;">${totTN || '-'}</td>
              <td style="font-weight: bold;">${totTL || '-'}</td>
              <td style="font-weight: bold; background-color: #f1f5f9;">${totPt}</td>
              <td style="font-weight: bold;">${pct}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    `;
  }

  const parseVal = (val: any) => {
    if (val === undefined || val === null) return { count: 0, codeStr: '' };
    if (typeof val === 'number') return { count: val, codeStr: '' };
    if (typeof val === 'object') return { count: Number(val.count) || 0, codeStr: val.codeStr || '' };
    return { count: 0, codeStr: '' };
  };

  const rows = matrix.rows || [];
  const grandScore = matrix.grandTotal?.score || 10;

  let p1B = 0, p1H = 0, p1V = 0;
  let p2B = 0, p2H = 0, p2V = 0;
  let p3B = 0, p3H = 0, p3V = 0;
  let p4B = 0, p4H = 0, p4V = 0;

  rows.forEach((r) => {
    p1B += parseVal(r.part1?.['Biết'] || r.part1?.['Nhận biết']).count;
    p1H += parseVal(r.part1?.['Hiểu'] || r.part1?.['Thông hiểu']).count;
    p1V += parseVal(r.part1?.['Vận dụng'] || r.part1?.['VD']).count;

    p2B += parseVal(r.part2?.['Biết'] || r.part2?.['Nhận biết']).count;
    p2H += parseVal(r.part2?.['Hiểu'] || r.part2?.['Thông hiểu']).count;
    p2V += parseVal(r.part2?.['Vận dụng'] || r.part2?.['VD']).count;

    p3B += parseVal(r.part3?.['Biết'] || r.part3?.['Nhận biết']).count;
    p3H += parseVal(r.part3?.['Hiểu'] || r.part3?.['Thông hiểu']).count;
    p3V += parseVal(r.part3?.['Vận dụng'] || r.part3?.['VD']).count;

    p4B += parseVal(r.part4?.['Biết'] || r.part4?.['Nhận biết']).count;
    p4H += parseVal(r.part4?.['Hiểu'] || r.part4?.['Thông hiểu']).count;
    p4V += parseVal(r.part4?.['Vận dụng'] || r.part4?.['VD']).count;
  });

  const sumB = p1B + p2B + p3B + p4B;
  const sumH = p1H + p2H + p3H + p4H;
  const sumV = p1V + p2V + p3V + p4V;
  const grandCount = sumB + sumH + sumV;

  const countP1 = p1B + p1H + p1V;
  const countP2 = p2B + p2H + p2V;
  const countP3 = p3B + p3H + p3V;
  const countP4 = p4B + p4H + p4V;

  const score1 = countP1 * 0.25;
  const score2 = countP2 * 0.25;
  const score3 = countP3 * 0.5;
  const score4 = Math.max(0, grandScore - score1 - score2 - score3);

  const renderCellHTML = (val: any) => {
    const { count, codeStr } = parseVal(val);
    if (count <= 0) return '';
    if (codeStr) return `<b>${count}</b><br><span style="font-size: 8pt; color: #444444;">(${codeStr})</span>`;
    return `<b>${count}</b>`;
  };

  const fmt = (n: number) => (n % 1 === 0 ? `${n},0` : n.toFixed(1).replace('.', ','));

  return `
  <div style="text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 6pt;">
    1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;" border="1">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th rowspan="3" style="width: 3%;">TT</th>
        <th rowspan="3" style="width: 14%;">Chủ đề/Chương</th>
        <th rowspan="3" style="width: 22%;">Nội dung/đơn vị kiến thức</th>
        <th colspan="12" style="text-transform: uppercase;">Mức độ đánh giá</th>
        <th colspan="3" rowspan="2" style="background-color: #e6e6e6;">Tổng</th>
        <th rowspan="3" style="width: 6%; background-color: #e6f2ff;">Tỉ lệ % điểm</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-weight: bold;">
        <th colspan="9">TNKQ</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-size: 9pt;">
        <th colspan="3">Nhiều lựa chọn</th>
        <th colspan="3">“Đúng – Sai”²</th>
        <th colspan="3">Trả lời ngắn³</th>
        <th colspan="3">Tự luận</th>
        <th style="background-color: #e6e6e6;">Biết</th>
        <th style="background-color: #e6e6e6;">Hiểu</th>
        <th style="background-color: #e6e6e6;">Vận dụng</th>
      </tr>
      <tr style="background-color: #f2f2f2; font-size: 8.5pt; font-weight: bold;">
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th colspan="4" style="background-color: #e6e6e6;"></th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((row, idx) => {
        const getV = (part: any, lvl: string) => {
          const keys = Object.keys(part || {});
          const mk = keys.find(k => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
          return part?.[mk];
        };

        const v1B = getV(row.part1, 'Biết');
        const v1H = getV(row.part1, 'Hiểu');
        const v1V = getV(row.part1, 'Vận dụng') || getV(row.part1, 'VD');

        const v2B = getV(row.part2, 'Biết');
        const v2H = getV(row.part2, 'Hiểu');
        const v2V = getV(row.part2, 'Vận dụng') || getV(row.part2, 'VD');

        const v3B = getV(row.part3, 'Biết');
        const v3H = getV(row.part3, 'Hiểu');
        const v3V = getV(row.part3, 'Vận dụng') || getV(row.part3, 'VD');

        const v4B = getV(row.part4, 'Biết');
        const v4H = getV(row.part4, 'Hiểu');
        const v4V = getV(row.part4, 'Vận dụng') || getV(row.part4, 'VD');

        const rSumB = parseVal(v1B).count + parseVal(v2B).count + parseVal(v3B).count + parseVal(v4B).count;
        const rSumH = parseVal(v1H).count + parseVal(v2H).count + parseVal(v3H).count + parseVal(v4H).count;
        const rSumV = parseVal(v1V).count + parseVal(v2V).count + parseVal(v3V).count + parseVal(v4V).count;

        const chap = row.chapter || `Chủ đề ${Math.ceil((idx + 1) / 2)}`;

        return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold;">${chap}</td>
          <td style="text-align: left;">${row.topic}</td>

          <td>${renderCellHTML(v1B)}</td>
          <td>${renderCellHTML(v1H)}</td>
          <td>${renderCellHTML(v1V)}</td>

          <td>${renderCellHTML(v2B)}</td>
          <td>${renderCellHTML(v2H)}</td>
          <td>${renderCellHTML(v2V)}</td>

          <td>${renderCellHTML(v3B)}</td>
          <td>${renderCellHTML(v3H)}</td>
          <td>${renderCellHTML(v3V)}</td>

          <td>${renderCellHTML(v4B)}</td>
          <td>${renderCellHTML(v4H)}</td>
          <td>${renderCellHTML(v4V)}</td>

          <td style="background-color: #f5f5f5; font-weight: bold;">${rSumB > 0 ? rSumB : ''}</td>
          <td style="background-color: #f5f5f5; font-weight: bold;">${rSumH > 0 ? rSumH : ''}</td>
          <td style="background-color: #f5f5f5; font-weight: bold;">${rSumV > 0 ? rSumV : ''}</td>

          <td style="background-color: #e6f2ff; font-weight: bold;">${row.percent ? `${row.percent}%` : ''}</td>
        </tr>
        `;
      }).join('')}

      <!-- Dòng 1: Tổng số câu -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="3" style="text-align: center; text-transform: uppercase;">Tổng số câu</td>
        <td colspan="3">${countP1 || ''}</td>
        <td colspan="3">${countP2 || ''}</td>
        <td colspan="3">${countP3 || ''}</td>
        <td colspan="3">${countP4 || ''}</td>
        <td style="background-color: #e6e6e6;">${sumB || ''}</td>
        <td style="background-color: #e6e6e6;">${sumH || ''}</td>
        <td style="background-color: #e6e6e6;">${sumV || ''}</td>
        <td style="background-color: #cce5ff;"></td>
      </tr>

      <!-- Dòng 2: Tổng số điểm -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="3" style="text-align: center; text-transform: uppercase;">Tổng số điểm</td>
        <td colspan="3">${fmt(score1) || '3,0'}⁵</td>
        <td colspan="3">${fmt(score2) || '2,0'}</td>
        <td colspan="3">${fmt(score3) || '2,0'}</td>
        <td colspan="3">${fmt(score4) || '3,0'}</td>
        <td style="background-color: #e6e6e6;">4,0</td>
        <td style="background-color: #e6e6e6;">3,0</td>
        <td style="background-color: #e6e6e6;">3,0</td>
        <td style="background-color: #cce5ff;">${grandScore},0</td>
      </tr>

      <!-- Dòng 3: Tỉ lệ % -->
      <tr style="background-color: #e6f2ff; font-weight: bold;">
        <td colspan="3" style="text-align: center; text-transform: uppercase;">Tỉ lệ %</td>
        <td colspan="3">30</td>
        <td colspan="3">20</td>
        <td colspan="3">20</td>
        <td colspan="3">30</td>
        <td style="background-color: #b3d7ff;">40</td>
        <td style="background-color: #b3d7ff;">30</td>
        <td style="background-color: #b3d7ff;">30</td>
        <td style="background-color: #80bfff; font-size: 10pt;">100%</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size: 8.5pt; font-style: italic; margin-top: 6pt; line-height: 1.4; color: #333;">
    <div><sup>2</sup> Mỗi câu hỏi bao gồm 4 ý nhỏ, mỗi ý học sinh phải chọn đúng hoặc sai. Một số tài liệu xếp loại câu hỏi này vào loại <i>Nhiều lựa chọn phức hợp</i> hoặc <i>Nhiều lựa chọn có nhiều phương án đúng</i>.</div>
    <div><sup>3</sup> Đối với môn học không sử dụng dạng này thì chuyển toàn bộ số điểm cho dạng <i>“Đúng – Sai”</i>.</div>
    <div><sup>4</sup> Có ở trong một số ô của ma trận, thể hiện số câu hỏi hoặc câu hỏi số bao nhiêu.</div>
    <div><sup>5</sup> Lựa chọn sao cho được khoảng 3,0 điểm, tương ứng với tỉ lệ khoảng 30%; tương tự như thế đối với các dạng khác.</div>
  </div>
  `;
}

function renderSpecTable(specs: ExamSpecificationRow[], matrix?: ExamMatrix, config?: ExamConfig): string {
  const isPrimary = config?.gradeLevel === 'primary' || (config?.grade && Number(config.grade) <= 5);

  if (isPrimary) {
    const rows = matrix?.rows || [];
    return `
    <div style="text-align: center; font-weight: bold; font-size: 11.5pt; text-transform: uppercase; margin-bottom: 4pt;">
      BẢN ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA ĐỊNH KỲ TIỂU HỌC (THÔNG TƯ 27/2020)
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt; text-align: left;" border="1">
      <thead>
        <tr style="background-color: #f2f2f2; font-weight: bold; text-align: center;">
          <th style="width: 4%;">TT</th>
          <th style="width: 25%;">Mạch kiến thức, kĩ năng</th>
          <th style="width: 12%;">Mức độ</th>
          <th>Yêu cầu cần đạt chi tiết</th>
          <th style="width: 10%;">Hình thức</th>
          <th style="width: 7%;">Số câu</th>
          <th style="width: 8%;">Điểm</th>
        </tr>
      </thead>
      <tbody>
        ${rows.flatMap((r, rIdx) => {
          const topic = r.topic || `Chủ đề ${rIdx + 1}`;
          const items = [
            { lvl: 'Mức 1', req: `Đọc được, viết được, nhận biết hoặc tính nhẩm trực tiếp thuộc ${topic}.`, count: ((r.part1?.['Mức 1'] as any)?.count || 0) + ((r.part4?.['Mức 1'] as any)?.count || 0), pt: '1.0' },
            { lvl: 'Mức 2', req: `Thực hiện phép tính có nhớ, tóm tắt bài toán, so sánh hoặc điền dấu thuộc ${topic}.`, count: ((r.part1?.['Mức 2'] as any)?.count || 0) + ((r.part4?.['Mức 2'] as any)?.count || 0), pt: '1.0' },
            { lvl: 'Mức 3', req: `Giải bài toán có lời văn, vận dụng vào giải quyết tình huống thực tế thuộc ${topic}.`, count: ((r.part1?.['Mức 3'] as any)?.count || 0) + ((r.part4?.['Mức 3'] as any)?.count || 0), pt: '1.5' },
          ];

          return items.map((it, idx) => `
            <tr>
              ${idx === 0 ? `<td rowspan="3" style="text-align: center; font-weight: bold;">${rIdx + 1}</td><td rowspan="3" style="font-weight: bold;">${topic}</td>` : ''}
              <td style="text-align: center; font-weight: bold;">${it.lvl}</td>
              <td style="font-size: 8.5pt;">${it.req}</td>
              <td style="text-align: center;">${it.count > 0 ? 'TNKQ / TL' : '-'}</td>
              <td style="text-align: center; font-weight: bold;">${it.count || '-'}</td>
              <td style="text-align: center; font-weight: bold;">${it.count > 0 ? `${it.pt}đ` : '-'}</td>
            </tr>
          `);
        }).join('')}
      </tbody>
    </table>
    `;
  }

  const rows = matrix?.rows || [];

  const parseVal = (val: any) => {
    if (val === undefined || val === null) return { count: 0, codeStr: '' };
    if (typeof val === 'number') return { count: val, codeStr: '' };
    if (typeof val === 'object') return { count: Number(val.count) || 0, codeStr: val.codeStr || '' };
    return { count: 0, codeStr: '' };
  };

  const renderSpecCellHTML = (val: any) => {
    const { count, codeStr } = parseVal(val);
    if (count <= 0) return '';
    return `(${count})<br><span style="font-size: 7.5pt; color: #444;">(${codeStr || 'NL?'})</span>`;
  };

  const grandScore = matrix?.grandTotal?.score || 10;
  let countP1 = 0, countP2 = 0, countP3 = 0, countP4 = 0;

  rows.forEach((r) => {
    countP1 += parseVal(r.part1?.['Biết'] || r.part1?.['Nhận biết']).count + parseVal(r.part1?.['Hiểu'] || r.part1?.['Thông hiểu']).count + parseVal(r.part1?.['Vận dụng'] || r.part1?.['VD']).count;
    countP2 += parseVal(r.part2?.['Biết'] || r.part2?.['Nhận biết']).count + parseVal(r.part2?.['Hiểu'] || r.part2?.['Thông hiểu']).count + parseVal(r.part2?.['Vận dụng'] || r.part2?.['VD']).count;
    countP3 += parseVal(r.part3?.['Biết'] || r.part3?.['Nhận biết']).count + parseVal(r.part3?.['Hiểu'] || r.part3?.['Thông hiểu']).count + parseVal(r.part3?.['Vận dụng'] || r.part3?.['VD']).count;
    countP4 += parseVal(r.part4?.['Biết'] || r.part4?.['Nhận biết']).count + parseVal(r.part4?.['Hiểu'] || r.part4?.['Thông hiểu']).count + parseVal(r.part4?.['Vận dụng'] || r.part4?.['VD']).count;
  });

  const score1 = countP1 * 0.25;
  const score2 = countP2 * 0.25;
  const score3 = countP3 * 0.5;
  const score4 = Math.max(0, grandScore - score1 - score2 - score3);
  const fmt = (n: number) => (n % 1 === 0 ? `${n},0` : n.toFixed(1).replace('.', ','));

  return `
  <div style="text-align: center; font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-bottom: 6pt; margin-top: 15pt;">
    2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; text-align: center;" border="1">
    <thead>
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th rowspan="3" style="width: 3%;">TT</th>
        <th rowspan="3" style="width: 12%;">Chủ đề/Chương</th>
        <th rowspan="3" style="width: 15%;">Nội dung/đơn vị kiến thức</th>
        <th rowspan="3" style="width: 30%;">Yêu cầu cần đạt</th>
        <th colspan="12" style="text-transform: uppercase;">Số câu hỏi ở các mức độ đánh giá</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-weight: bold;">
        <th colspan="9">TNKQ</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f9f9f9; font-size: 9pt;">
        <th colspan="3">Nhiều lựa chọn</th>
        <th colspan="3">“Đúng – Sai”</th>
        <th colspan="3">Trả lời ngắn</th>
        <th colspan="3">Tự luận</th>
      </tr>
      <tr style="background-color: #f2f2f2; font-size: 8.5pt; font-weight: bold;">
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
        <th>Biết</th><th>Hiểu</th><th>Vận dụng</th>
      </tr>
    </thead>
    <tbody>
      ${rows.length > 0 ? rows.map((row, idx) => {
        const getV = (part: any, lvl: string) => {
          const keys = Object.keys(part || {});
          const mk = keys.find(k => k.toLowerCase().includes(lvl.toLowerCase())) || lvl;
          return part?.[mk];
        };

        const v1B = getV(row.part1, 'Biết');
        const v1H = getV(row.part1, 'Hiểu');
        const v1V = getV(row.part1, 'Vận dụng') || getV(row.part1, 'VD');

        const v2B = getV(row.part2, 'Biết');
        const v2H = getV(row.part2, 'Hiểu');
        const v2V = getV(row.part2, 'Vận dụng') || getV(row.part2, 'VD');

        const v3B = getV(row.part3, 'Biết');
        const v3H = getV(row.part3, 'Hiểu');
        const v3V = getV(row.part3, 'Vận dụng') || getV(row.part3, 'VD');

        const v4B = getV(row.part4, 'Biết');
        const v4H = getV(row.part4, 'Hiểu');
        const v4V = getV(row.part4, 'Vận dụng') || getV(row.part4, 'VD');

        const chap = row.chapter || `Chủ đề ${Math.ceil((idx + 1) / 2)}`;

        return `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: left; font-weight: bold;">${chap}</td>
          <td style="text-align: left;">${row.topic}</td>
          <td style="text-align: left; font-size: 9pt; line-height: 1.35;">
            <div><b>- Biết:</b> Nhận biết và nêu được các kiến thức cốt lõi về ${row.topic}.</div>
            <div><b>- Hiểu:</b> Giải thích, mô tả bản chất và tính toán đại lượng đặc trưng của ${row.topic}.</div>
            <div><b>- VD:</b> Vận dụng định lý, quy tắc để giải quyết tình huống thực tế về ${row.topic}.</div>
          </td>

          <td>${renderSpecCellHTML(v1B)}</td>
          <td>${renderSpecCellHTML(v1H)}</td>
          <td>${renderSpecCellHTML(v1V)}</td>

          <td>${renderSpecCellHTML(v2B)}</td>
          <td>${renderSpecCellHTML(v2H)}</td>
          <td>${renderSpecCellHTML(v2V)}</td>

          <td>${renderSpecCellHTML(v3B)}</td>
          <td>${renderSpecCellHTML(v3H)}</td>
          <td>${renderSpecCellHTML(v3V)}</td>

          <td>${renderSpecCellHTML(v4B)}</td>
          <td>${renderSpecCellHTML(v4H)}</td>
          <td>${renderSpecCellHTML(v4V)}</td>
        </tr>
        `;
      }).join('') : specs.map((s, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>Chủ đề ${idx + 1}</td>
          <td>${s.topic}</td>
          <td style="text-align: left;">${s.competency}</td>
          <td colspan="12" style="text-align: center;">${s.questionCount} câu (${s.level})</td>
        </tr>
      `).join('')}

      <!-- Dòng 1: Tổng số câu -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="4" style="text-align: center; text-transform: uppercase;">Tổng số câu</td>
        <td colspan="3">${countP1 || 12}</td>
        <td colspan="3">${countP2 || 4}</td>
        <td colspan="3">${countP3 || 4}</td>
        <td colspan="3">${countP4 || 2}</td>
      </tr>

      <!-- Dòng 2: Tổng số điểm -->
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <td colspan="4" style="text-align: center; text-transform: uppercase;">Tổng số điểm</td>
        <td colspan="3">${fmt(score1) || '3,0'}</td>
        <td colspan="3">${fmt(score2) || '2,0'}</td>
        <td colspan="3">${fmt(score3) || '2,0'}</td>
        <td colspan="3">${fmt(score4) || '3,0'}</td>
      </tr>

      <!-- Dòng 3: Tỉ lệ % -->
      <tr style="background-color: #e6f2ff; font-weight: bold;">
        <td colspan="4" style="text-align: center; text-transform: uppercase;">Tỉ lệ %</td>
        <td colspan="3">${Math.round((score1 / grandScore) * 100) || 30}</td>
        <td colspan="3">${Math.round((score2 / grandScore) * 100) || 20}</td>
        <td colspan="3">${Math.round((score3 / grandScore) * 100) || 20}</td>
        <td colspan="3">${Math.round((score4 / grandScore) * 100) || 30}</td>
      </tr>
    </tbody>
  </table>
  <div style="font-size: 8.5pt; font-style: italic; margin-top: 6pt; color: #333;">
    <sup>6</sup> Kí hiệu năng lực thành tố cần đánh giá (hoặc mã câu hỏi tương ứng trong đề thi).
  </div>
  `;
}

function renderStudyGuideContent(studyGuide: StudyGuideData): string {
  return `
    <div class="bold" style="font-size: 12pt; margin-top: 10pt; margin-bottom: 6pt; color: #003366;">
      1. Bảng Khái Niệm & Từ Khóa Cốt Lõi
    </div>
    <table>
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="width: 30%;">Thuật ngữ / Khái niệm</th>
          <th>Định nghĩa & Bản chất</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.coreConcepts
          .map(
            (c) => `
          <tr>
            <td style="font-weight: bold; color: #003366;">${c.term}</td>
            <td>${formatLatexToWordUnicode(c.definition)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    ${studyGuide.keyFormulas && studyGuide.keyFormulas.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #003366;">
      2. Bảng Công Thức Vàng & Quy Tắc Giải Nhanh
    </div>
    <table>
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="width: 25%;">Tên công thức / Quy tắc</th>
          <th style="width: 35%;">Biểu thức / Phương trình</th>
          <th>Ghi chú & Mẹo vận dụng</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.keyFormulas
          .map(
            (f) => `
          <tr>
            <td style="font-weight: bold;">${f.name}</td>
            <td style="font-weight: bold; color: #990000; text-align: center;">${formatLatexToWordUnicode(f.formula)}</td>
            <td>${f.note}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    ` : ''}

    ${studyGuide.trapList && studyGuide.trapList.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #b45309;">
      3. CẨM NANG BẪY SAI KINHDIỂN & BÍ QUYẾT PHÒNG TRÁNH (Quan trọng phát cho học sinh)
    </div>
    <table>
      <thead>
        <tr style="background-color: #fff7ed;">
          <th style="width: 25%; color: #9a3412;">Dạng Bẫy Tư Duy</th>
          <th style="width: 45%; color: #9a3412;">Mô tả bẫy hay mắc & Minh họa câu hỏi</th>
          <th style="color: #9a3412;">Bí quyết phòng tránh & Kiểm tra nhanh</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.trapList
          .map(
            (trap) => `
          <tr>
            <td style="font-weight: bold; color: #c2410c;">${trap.trapType}</td>
            <td>
              <div>${formatLatexToWordUnicode(trap.description)}</div>
              ${trap.exampleQuestion ? `<div style="font-style: italic; color: #555; margin-top: 3pt; font-size: 9.5pt;">VD: "${formatLatexToWordUnicode(trap.exampleQuestion)}"</div>` : ''}
            </td>
            <td style="font-weight: bold; color: #15803d;">${formatLatexToWordUnicode(trap.avoidanceTip)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    ` : ''}

    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #b45309;">
      4. Các Lỗi Sai Thường Gặp Khác Khi Làm Bài
    </div>
    <ul style="margin-top: 4pt; margin-bottom: 12pt; line-height: 1.5;">
      ${studyGuide.commonMistakes.map((m) => `<li>${formatLatexToWordUnicode(m)}</li>`).join('')}
    </ul>

    ${studyGuide.timeStrategy && studyGuide.timeStrategy.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #047857;">
      5. Phân Bổ Thời Gian & Chiến Thuật Làm Bài Theo Dạng Đề GDPT 2018
    </div>
    <table>
      <thead>
        <tr style="background-color: #ecfdf5;">
          <th style="width: 35%; color: #065f46;">Phần thi / Cấu trúc</th>
          <th style="width: 25%; color: #065f46;">Thời gian đề xuất</th>
          <th style="color: #065f46;">Chiến thuật làm bài tối ưu điểm</th>
        </tr>
      </thead>
      <tbody>
        ${studyGuide.timeStrategy
          .map(
            (ts) => `
          <tr>
            <td style="font-weight: bold;">${ts.partTitle}</td>
            <td style="font-weight: bold; color: #047857; text-align: center;">${ts.timeAlloc}</td>
            <td>${ts.strategy}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    ` : ''}

    ${studyGuide.readinessChecklist && studyGuide.readinessChecklist.length > 0 ? `
    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #1e3a8a;">
      6. Checklist Tự Kiểm Tra Kiến Thức Trước Khi Bước Vào Phòng Thi
    </div>
    <ul style="margin-top: 4pt; margin-bottom: 12pt; line-height: 1.5;">
      ${studyGuide.readinessChecklist.map((chk) => `<li>[  ] ${formatLatexToWordUnicode(chk)}</li>`).join('')}
    </ul>
    ` : ''}

    <div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 6pt; color: #047857;">
      7. Lời Dặn Của Giáo Viên & Mẹo Ôn Tập Cốt Lõi
    </div>
    <ul style="margin-top: 4pt; margin-bottom: 12pt; line-height: 1.5;">
      ${studyGuide.reviewTips.map((t) => `<li>${formatLatexToWordUnicode(t)}</li>`).join('')}
    </ul>
  `;
}

function renderExamQuestionsToWord(questions: QuestionItem[]): string {
  let html = '';
  let currentPart = '';
  let qNumber = 1;

  questions.forEach((q) => {
    if (q.part !== currentPart) {
      currentPart = q.part;
      let partHeader = '';
      if (q.part === 'part1') {
        partHeader = 'PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh chọn 1 đáp án đúng nhất)';
      } else if (q.part === 'part2') {
        partHeader = 'PHẦN II. Câu trắc nghiệm Đúng/Sai (Mỗi câu gồm 4 ý a, b, c, d; thí sinh chọn Đúng hoặc Sai)';
      } else if (q.part === 'part3') {
        partHeader = 'PHẦN III. Câu trắc nghiệm trả lời ngắn (Thí sinh điền kết quả vào phiếu trả lời)';
      } else {
        partHeader = 'PHẦN IV. Câu hỏi Tự luận';
      }

      html += `<div class="bold" style="font-size: 12pt; margin-top: 15pt; margin-bottom: 8pt; text-decoration: underline;">${partHeader}</div>`;
    }

    if (q.passage) {
      html += `
        <div style="background-color: #f9f9f9; padding: 6pt; border-left: 3px solid #333; margin-bottom: 8pt; font-style: italic;">
          <strong>Đọc đoạn trích/ngữ liệu sau để trả lời câu hỏi:</strong><br>
          ${q.passage.replace(/\n/g, '<br>')}
        </div>
      `;
    }

    html += `<div class="question-block">`;
    html += `<div><strong>Câu ${qNumber++} (${q.score || 0} điểm):</strong> ${formatLatexToWordUnicode(q.question)}</div>`;

    if ((q.type === 'mcq_single' || q.part === 'part1') && q.options && q.options.length === 4) {
      html += `
        <table class="option-table" style="width: 100%; margin-top: 4pt;">
          <tr>
            <td style="width: 50%;"><strong>A.</strong> ${formatLatexToWordUnicode(q.options[0])}</td>
            <td style="width: 50%;"><strong>B.</strong> ${formatLatexToWordUnicode(q.options[1])}</td>
          </tr>
          <tr>
            <td style="width: 50%;"><strong>C.</strong> ${formatLatexToWordUnicode(q.options[2])}</td>
            <td style="width: 50%;"><strong>D.</strong> ${formatLatexToWordUnicode(q.options[3])}</td>
          </tr>
        </table>
      `;
    }

    if ((q.type === 'true_false_group' || q.part === 'part2') && q.subItems) {
      html += `<div style="margin-left: 15pt; margin-top: 4pt;">`;
      q.subItems.forEach((sub) => {
        html += `<div><strong>${sub.label})</strong> ${formatLatexToWordUnicode(sub.statement)}</div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  return html;
}

function renderDetailedSolutionsToWord(questions: QuestionItem[]): string {
  let html = '';
  questions.forEach((q, idx) => {
    html += `
      <div style="margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 1px dashed #ccc;">
        <div><strong>Câu ${idx + 1} (${q.score || 0} điểm) [${q.level}]:</strong> ${formatLatexToWordUnicode(q.question)}</div>
        <div style="color: #006600; font-weight: bold; margin-top: 3pt;">
          Đáp án đúng: ${typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer)}
        </div>
        ${q.subItems ? `
          <ul style="margin: 3pt 0 3pt 15pt;">
            ${q.subItems.map((s) => `<li>Ý ${s.label}: <strong>${s.isCorrect ? 'ĐÚNG' : 'SAI'}</strong> ${s.explanation ? `(${formatLatexToWordUnicode(s.explanation)})` : ''}</li>`).join('')}
          </ul>
        ` : ''}
        <div style="margin-top: 3pt;"><strong>Hướng dẫn giải chi tiết:</strong> ${formatLatexToWordUnicode(q.explanation || 'Áp dụng định lý và tính toán theo chuẩn kiến thức.')}</div>
        ${q.rubric && q.rubric.length > 0 ? `
          <div style="margin-top: 4pt;">
            <strong>Biểu điểm thành phần:</strong>
            <table style="width: 100%; margin-top: 3pt;">
              <tr style="background-color: #f2f2f2;"><th>Bước</th><th>Nội dung yêu cầu</th><th>Điểm</th></tr>
              ${q.rubric.map((r) => `<tr><td style="text-align: center;">${r.step}</td><td>${formatLatexToWordUnicode(r.detail)}</td><td style="text-align: center; font-weight: bold;">${r.point}đ</td></tr>`).join('')}
            </table>
          </div>
        ` : ''}
      </div>
    `;
  });
  return html;
}

/**
 * 6. Xuất BẢNG TỔNG HỢP ĐÁP ÁN ĐA MÃ ĐỀ (.doc)
 */
export function exportMasterAnswerKeyWordDoc(
  config: ExamConfig,
  shuffledCodes: ShuffledExamCode[]
): void {
  const title = config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ';
  const school = (config.schoolName || 'TRƯỜNG THPT').toUpperCase();
  const department = (config.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase();
  const subject = (config.customSubject || config.subject || 'Môn học').toUpperCase();
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade}` : `Lớp ${config.grade}`;
  const academicYear = config.academicYear || '2025 - 2026';

  const baseCode = shuffledCodes[0] || { code: '101', questions: [], quickAnswers: [] };
  const baseQuestions = baseCode.questions || [];

  const part1Base = baseQuestions.filter(q => q.part === 'part1' || q.type === 'mcq_single');
  const part2Base = baseQuestions.filter(q => q.part === 'part2' || q.type === 'true_false_group');
  const part3Base = baseQuestions.filter(q => q.part === 'part3' || q.type === 'short_answer');

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>BẢNG TỔNG HỢP ĐÁP ÁN ĐA MÃ ĐỀ - ${title}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- Header -->
  <table class="header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-family: 'Times New Roman', serif;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 11pt;">${department}</div>
        <div class="bold uppercase" style="font-size: 11pt;">${school}</div>
        <div class="italic bold" style="font-size: 10.5pt; margin-top: 3pt;">HỘI ĐỒNG KHẢO THÍ</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top; padding: 2pt;">
        <div class="bold uppercase" style="font-size: 12pt;">BẢNG TỔNG HỢP ĐÁP ÁN CÁC MÃ ĐỀ</div>
        <div class="bold uppercase" style="font-size: 11pt; margin-top: 2pt;">${title} – NĂM HỌC ${academicYear}</div>
        <div class="italic" style="font-size: 11pt; margin-top: 2pt;">MÔN: ${subject} – ${gradeStr.toUpperCase()}</div>
      </td>
    </tr>
  </table>

  <div style="border-bottom: 1.5pt solid #000; margin-bottom: 14pt;"></div>

  <!-- PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN -->
  ${part1Base.length > 0 ? `
  <div class="bold uppercase" style="font-size: 11.5pt; margin-bottom: 4pt; color: #1e3a8a;">
    PHẦN I. ĐÁP ÁN TRẮC NGHIỆM NHIỀU LỰA CHỌN (Mỗi câu đúng được 0.25 điểm)
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        ${shuffledCodes.map(c => `<th style="text-align: center; width: ${Math.floor(90 / shuffledCodes.length)}%;">Mã đề ${c.code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${part1Base.map((_, idx) => {
        const qNum = idx + 1;
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; background-color: #fafafa;">Câu ${qNum}</td>
            ${shuffledCodes.map(c => {
              const q = (c.questions.filter(item => item.part === 'part1' || item.type === 'mcq_single'))[idx];
              const ans = q ? String(q.correctAnswer) : '-';
              return `<td style="text-align: center; font-weight: bold; color: #006600; font-size: 11pt;">${ans}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI 4 Ý -->
  ${part2Base.length > 0 ? `
  <div class="page-break"></div>
  <div class="bold uppercase" style="font-size: 11.5pt; margin-top: 10pt; margin-bottom: 4pt; color: #1e3a8a;">
    PHẦN II. ĐÁP ÁN TRẮC NGHIỆM ĐÚNG / SAI (Quy tắc bậc thang: 1 ý đúng = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; 4 ý = 1.0đ)
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        <th style="width: 8%; text-align: center;">Lệnh</th>
        ${shuffledCodes.map(c => `<th style="text-align: center; width: ${Math.floor(82 / shuffledCodes.length)}%;">Mã đề ${c.code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${part2Base.flatMap((_, qIdx) => {
        const qNum = qIdx + 1;
        return ['a', 'b', 'c', 'd'].map((label, subIdx) => `
          <tr ${subIdx === 0 ? 'style="border-top: 1.5pt solid #000;"' : ''}>
            ${subIdx === 0 ? `<td rowspan="4" style="text-align: center; font-weight: bold; background-color: #f7f7f7; vertical-align: middle;">Câu ${qNum}</td>` : ''}
            <td style="text-align: center; font-weight: bold;">${label})</td>
            ${shuffledCodes.map(c => {
              const q = (c.questions.filter(item => item.part === 'part2' || item.type === 'true_false_group'))[qIdx];
              const sub = q?.subItems?.[subIdx];
              const isCorrect = sub ? sub.isCorrect : false;
              return `<td style="text-align: center; font-weight: bold; color: ${isCorrect ? '#006600' : '#cc0000'};">${isCorrect ? 'Đ' : 'S'}</td>`;
            }).join('')}
          </tr>
        `);
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- PHẦN III: TRẢ LỜI NGẮN -->
  ${part3Base.length > 0 ? `
  <div class="bold uppercase" style="font-size: 11.5pt; margin-top: 10pt; margin-bottom: 4pt; color: #1e3a8a;">
    PHẦN III. ĐÁP ÁN TRẮC NGHIỆM TRẢ LỜI NGẮN (Mỗi câu đúng được 0.5 điểm)
  </div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 14pt;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="width: 10%; text-align: center;">Câu</th>
        ${shuffledCodes.map(c => `<th style="text-align: center; width: ${Math.floor(90 / shuffledCodes.length)}%;">Mã đề ${c.code}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${part3Base.map((_, idx) => {
        const qNum = idx + 1;
        return `
          <tr>
            <td style="text-align: center; font-weight: bold; background-color: #fafafa;">Câu ${qNum}</td>
            ${shuffledCodes.map(c => {
              const q = (c.questions.filter(item => item.part === 'part3' || item.type === 'short_answer'))[idx];
              const ans = q ? String(q.correctAnswer) : '-';
              return `<td style="text-align: center; font-weight: bold; color: #0044cc; font-size: 11pt;">${ans}</td>`;
            }).join('')}
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="text-center italic" style="margin-top: 25pt;">
    --- HẾT BẢNG TỔNG HỢP ĐÁP ÁN ---
  </div>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Bang_Tong_Hop_Dap_An_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_DaMaDe.doc`);
}

/**
 * 7. Xuất PHIẾU TRẢ LỜI TRẮC NGHIỆM CHUẨN A4 (.doc)
 */
export function exportAnswerSheetWordDoc(
  config: ExamConfig,
  currentCode: ShuffledExamCode
): void {
  const school = (config.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase();
  const subject = (config.customSubject || config.subject || 'Môn học').toUpperCase();
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade}` : `Lớp ${config.grade}`;
  const p1Count = config.sectionCounts.part1 || 12;
  const p2Count = config.sectionCounts.part2 || 4;
  const p3Count = config.sectionCounts.part3 || 6;

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>PHIẾU TRẢ LỜI TRẮC NGHIỆM - ${subject}</title>
  ${WORD_HEADER_STYLE}
</head>
<body>
  <!-- Header -->
  <table class="header-table" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif;">
    <tr>
      <td style="width: 45%; text-align: center; vertical-align: top;">
        <div class="bold uppercase" style="font-size: 10.5pt;">${school}</div>
        <div class="bold uppercase" style="font-size: 10.5pt; margin-top: 2pt;">HỘI ĐỒNG COI THI: .........................</div>
        <div style="font-size: 10pt; margin-top: 2pt;">Phòng thi số: ....... Điểm thi: .............</div>
      </td>
      <td style="width: 55%; text-align: center; vertical-align: top;">
        <div class="bold uppercase" style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="bold underline" style="font-size: 10.5pt;">Độc lập - Tự do - Hạnh phúc</div>
      </td>
    </tr>
  </table>

  <!-- Title -->
  <div class="text-center" style="margin-top: 10pt; margin-bottom: 10pt;">
    <div class="bold uppercase" style="font-size: 15pt; letter-spacing: 1px;">PHIẾU TRẢ LỜI TRẮC NGHIỆM</div>
    <div class="bold uppercase" style="font-size: 11pt; margin-top: 2pt;">BÀI THI: ${subject} – ${gradeStr.toUpperCase()}</div>
    <div class="italic" style="font-size: 9.5pt;">(Mẫu tham khảo theo hướng dẫn của Bộ Giáo dục và Đào tạo)</div>
  </div>

  <!-- Student Info Box -->
  <table style="width: 100%; border: 1.5pt solid #000; margin-bottom: 8pt;">
    <tr>
      <td style="width: 60%; vertical-align: top; padding: 6pt; border-right: 1pt solid #000;">
        <div style="margin-bottom: 6pt;"><strong>1. Họ, chữ đệm và tên thí sinh:</strong> ............................................................................</div>
        <div style="margin-bottom: 6pt;"><strong>2. Ngày sinh:</strong> ..... / ..... / ......... &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>3. Lớp:</strong> ....................</div>
        <div style="margin-bottom: 8pt;"><strong>4. Trường:</strong> ..........................................................................................................</div>
        <table class="header-table" style="width: 100%; margin-top: 4pt;">
          <tr>
            <td style="text-align: center; width: 50%; border: 1pt solid #000; padding: 4pt; height: 40pt; vertical-align: top;">
              <span style="font-size: 8.5pt; font-weight: bold;">CHỮ KÝ GIÁM THỊ 1</span>
            </td>
            <td style="text-align: center; width: 50%; border: 1pt solid #000; padding: 4pt; height: 40pt; vertical-align: top;">
              <span style="font-size: 8.5pt; font-weight: bold;">CHỮ KÝ GIÁM THỊ 2</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="width: 40%; vertical-align: top; padding: 6pt; text-align: center;">
        <div style="font-weight: bold; font-size: 9.5pt; margin-bottom: 4pt;">5. SỐ BÁO DANH &nbsp;&nbsp;&nbsp;&nbsp; 6. MÃ ĐỀ THI: [ ${currentCode.code} ]</div>
        <div style="font-size: 9pt; color: #444; border: 1px dashed #666; padding: 8pt;">
          [KHUNG TÔ BỌNG CHÌ ĐIỆN TỬ SBD & MÃ ĐỀ]<br>
          <span style="font-size: 8pt;">(Học sinh dùng bút chì 2B tô tròn kín ô số tương ứng)</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- Sections Tables -->
  <table class="header-table" style="width: 100%; margin-top: 8pt;">
    <tr>
      <!-- Column Left: Part I -->
      <td style="width: 50%; vertical-align: top; padding-right: 6pt;">
        <div style="background-color: #000; color: #fff; font-weight: bold; text-align: center; padding: 3pt; font-size: 10pt;">
          PHẦN I. CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (${p1Count} câu)
        </div>
        <table style="width: 100%; margin-top: 4pt; font-size: 9pt;">
          ${Array.from({ length: Math.max(p1Count, 12) }).map((_, idx) => {
            const qNum = idx + 1;
            return `
              <tr>
                <td style="width: 25%; font-weight: bold; text-align: center;">Câu ${qNum}</td>
                <td style="text-align: center;">[A] &nbsp;&nbsp; [B] &nbsp;&nbsp; [C] &nbsp;&nbsp; [D]</td>
              </tr>
            `;
          }).join('')}
        </table>
      </td>

      <!-- Column Right: Part II & III -->
      <td style="width: 50%; vertical-align: top; padding-left: 6pt;">
        <div style="background-color: #000; color: #fff; font-weight: bold; text-align: center; padding: 3pt; font-size: 10pt;">
          PHẦN II. CÂU ĐÚNG / SAI (${p2Count} câu x 4 ý)
        </div>
        <table style="width: 100%; margin-top: 4pt; font-size: 9pt;">
          ${Array.from({ length: Math.max(p2Count, 4) }).map((_, idx) => {
            const qNum = idx + 1;
            return `
              <tr style="background-color: #f2f2f2;">
                <td colspan="2" style="font-weight: bold; text-align: center;">Câu ${qNum}</td>
              </tr>
              <tr><td style="width: 30%; text-align: center;">Ý a)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
              <tr><td style="width: 30%; text-align: center;">Ý b)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
              <tr><td style="width: 30%; text-align: center;">Ý c)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
              <tr><td style="width: 30%; text-align: center;">Ý d)</td><td style="text-align: center;">[Đ] &nbsp;&nbsp; [S]</td></tr>
            `;
          }).join('')}
        </table>

        ${p3Count > 0 ? `
        <div style="background-color: #000; color: #fff; font-weight: bold; text-align: center; padding: 3pt; font-size: 10pt; margin-top: 8pt;">
          PHẦN III. TRẢ LỜI NGẮN (${p3Count} câu)
        </div>
        <table style="width: 100%; margin-top: 4pt; font-size: 9pt;">
          ${Array.from({ length: p3Count }).map((_, idx) => {
            const qNum = idx + 1;
            return `
              <tr>
                <td style="width: 25%; font-weight: bold; text-align: center;">Câu ${qNum}</td>
                <td style="text-align: center; font-style: italic; color: #666;">[ _ _ _ _ _ ] (Tô ô số kết quả)</td>
              </tr>
            `;
          }).join('')}
        </table>
        ` : ''}
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  downloadBlob(htmlContent, `Phieu_Tra_Loi_Trac_Nghiem_${subject.replace(/\s+/g, '_')}_Lop${config.grade}_Ma${currentCode.code}.doc`);
}

