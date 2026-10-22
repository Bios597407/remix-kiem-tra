import JSZip from 'jszip';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
  convertMillimetersToTwip,
  BorderStyle,
  VerticalAlign,
  Packer,
} from 'docx';
import {
  ExamConfig,
  QuestionItem,
  ShuffledExamCode,
  MasterComparisonMatrix,
} from '../types/exam';
import {
  buildStandardExamDocx,
  downloadStandardFormDocx,
  formatLatexToUnicode,
} from './docxExporter';
import { generateMasterComparisonMatrix } from './examShuffler';

const FONT_FAMILY = 'Times New Roman';
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const MATRIX_TABLE_BORDERS = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
  insideHorizontal: THIN_BORDER,
  insideVertical: THIN_BORDER,
};

/**
 * Builds a dedicated Word Document for the Master Answer Key Comparison Matrix
 */
export function buildComparisonMatrixDocx(
  config: ExamConfig,
  matrix: MasterComparisonMatrix
): Document {
  const school = (config.schoolName || 'TRƯỜNG THCS & THPT').toUpperCase();
  const department = (config.departmentName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO').toUpperCase();
  const rawSubject = (config.customSubject || config.subject || 'Khoa học tự nhiên').toUpperCase();
  const gradeStr = `LỚP ${config.grade || '12'}`;
  const examTitle = (config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ').toUpperCase();
  const academicYear = config.academicYear || '2026 - 2027';

  const contentW_dxa = convertMillimetersToTwip(169.4); // 210 - 20.3*2

  const colSttW = convertMillimetersToTwip(14);
  const colPartW = convertMillimetersToTwip(22);
  const colPreviewW = convertMillimetersToTwip(48);
  const colBaseAnsW = convertMillimetersToTwip(20);
  const remainingW = contentW_dxa - (colSttW + colPartW + colPreviewW + colBaseAnsW);
  const variantCodes = matrix.codes.filter((_, idx) => idx > 0);
  const colVarW = variantCodes.length > 0 ? Math.floor(remainingW / variantCodes.length) : convertMillimetersToTwip(25);

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: colSttW, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: 'E2E8F0' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'STT (Gốc)', font: FONT_FAMILY, size: 20, bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: colPartW, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: 'E2E8F0' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Phần', font: FONT_FAMILY, size: 20, bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: colPreviewW, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: 'E2E8F0' },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: 'Tóm tắt câu hỏi', font: FONT_FAMILY, size: 20, bold: true })],
          }),
        ],
      }),
      new TableCell({
        width: { size: colBaseAnsW, type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { fill: 'DBEAFE' },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Mã ${matrix.codes[0]} (Gốc)`, font: FONT_FAMILY, size: 20, bold: true, color: '1E3A8A' }),
            ],
          }),
        ],
      }),
      ...variantCodes.map((code) =>
        new TableCell({
          width: { size: colVarW, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'FEF3C7' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: `Mã ${code}`, font: FONT_FAMILY, size: 20, bold: true, color: '92400E' }),
              ],
            }),
          ],
        })
      ),
    ],
  });

  const dataRows: TableRow[] = matrix.rows.map((row) => {
    let partLabel = 'Phần I';
    if (row.part === 'part2') partLabel = 'Phần II';
    else if (row.part === 'part3') partLabel = 'Phần III';
    else if (row.part === 'part4') partLabel = 'Phần IV';

    return new TableRow({
      children: [
        new TableCell({
          width: { size: colSttW, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `Câu ${row.baseStt}`, font: FONT_FAMILY, size: 20, bold: true })],
            }),
          ],
        }),
        new TableCell({
          width: { size: colPartW, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: partLabel, font: FONT_FAMILY, size: 19 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: colPreviewW, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              spacing: { before: 20, after: 20 },
              children: [new TextRun({ text: formatLatexToUnicode(row.questionPreview), font: FONT_FAMILY, size: 19 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: colBaseAnsW, type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: 'F0F7FF' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: row.baseAnswer, font: FONT_FAMILY, size: 20, bold: true, color: '1E40AF' }),
              ],
            }),
          ],
        }),
        ...variantCodes.map((code) => {
          const varInfo = row.variants[code];
          const displayTxt = varInfo ? `(C.${varInfo.stt}) ${varInfo.answer}` : '-';
          return new TableCell({
            width: { size: colVarW, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: displayTxt,
                    font: FONT_FAMILY,
                    size: 19,
                    bold: true,
                    color: '92400E',
                  }),
                ],
              }),
            ],
          });
        }),
      ],
    });
  });

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_FAMILY, size: 22, color: '000000' },
          paragraph: { spacing: { line: 260 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
            },
            margin: {
              top: convertMillimetersToTwip(19.1),
              bottom: convertMillimetersToTwip(19.1),
              left: convertMillimetersToTwip(20.3),
              right: convertMillimetersToTwip(20.3),
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${department} - ${school}`, font: FONT_FAMILY, size: 22, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'BẢNG MA TRẬN ĐỐI CHIẾU ĐÁP ÁN TOÀN BỘ CÁC MÃ ĐỀ',
                font: FONT_FAMILY,
                size: 26,
                bold: true,
                color: '003366',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `${examTitle} - MÔN: ${rawSubject} (${gradeStr}) - NĂM HỌC ${academicYear}`,
                font: FONT_FAMILY,
                size: 22,
                italics: true,
              }),
            ],
          }),
          new Table({
            width: { size: contentW_dxa, type: WidthType.DXA },
            borders: MATRIX_TABLE_BORDERS,
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });
}

/**
 * Download Master Comparison Matrix Word (.docx)
 */
export async function downloadComparisonMatrixDocx(
  config: ExamConfig,
  shuffledCodes: ShuffledExamCode[]
): Promise<void> {
  const matrix = generateMasterComparisonMatrix(shuffledCodes);
  const doc = buildComparisonMatrixDocx(config, matrix);
  const blob = await Packer.toBlob(doc);

  const rawSubject = (config.customSubject || config.subject || 'MonHoc').trim().replace(/\s+/g, '_');
  const gradeSlug = config.grade || '12';
  const filename = `${rawSubject}_K12_Bang_Dap_An_Doi_Chieu_${shuffledCodes.map((c) => c.code).join('-')}.docx`;

  triggerBlobDownload(blob, filename);
}

/**
 * Downloads a ZIP package containing:
 * 1. Word .docx for every single exam variant
 * 2. Word .docx for the Master Comparison Matrix
 */
export async function downloadAllExamCodesZip(
  config: ExamConfig,
  shuffledCodes: ShuffledExamCode[],
  options: { mode: 'full' | 'examOnly' } = { mode: 'full' }
): Promise<void> {
  const zip = new JSZip();
  const rawSubject = (config.customSubject || config.subject || 'MonHoc').trim().replace(/\s+/g, '_');
  const gradeSlug = config.grade || '12';
  const examTitleSlug = (config.examTitle || 'De_Kiem_Tra').trim().replace(/\s+/g, '_');

  // 1. Generate .docx for each exam code
  for (const variant of shuffledCodes) {
    const doc = buildStandardExamDocx(config, variant.questions, {
      mode: options.mode,
      examCode: variant.code,
    });
    const blob = await Packer.toBlob(doc);
    const codeFileName = `De_Kiem_Tra_${rawSubject}_Khoi${gradeSlug}_MaDe_${variant.code}.docx`;
    zip.file(codeFileName, blob);
  }

  // 2. Generate Comparison Matrix Docx
  const matrix = generateMasterComparisonMatrix(shuffledCodes);
  const matrixDoc = buildComparisonMatrixDocx(config, matrix);
  const matrixBlob = await Packer.toBlob(matrixDoc);
  zip.file(`Bang_Ma_Tran_Dap_An_Doi_Chieu_${shuffledCodes.map((c) => c.code).join('-')}.docx`, matrixBlob);

  // 3. Generate README / Instructions
  const summaryContent = `========================================================================
HỆ THỐNG RA ĐỀ KIỂM TRA AI - BỘ GD&ĐT (CÔNG VĂN 7991)
BỘ ĐỀ THI ĐÃ TRỘN NHIỀU MÃ ĐỀ TỰ ĐỘNG
========================================================================
Môn thi: ${config.customSubject || config.subject}
Khối lớp: ${config.grade}
Kỳ thi: ${config.examTitle}
Năm học: ${config.academicYear}
Thời gian làm bài: ${config.durationMinutes} phút

DANH SÁCH MÃ ĐỀ: ${shuffledCodes.map((c) => c.code).join(', ')}

HƯỚNG DẪN THẦY / CÔ:
1. Mỗi file .docx trong gói này đã được định dạng chuẩn 100% mẫu quy định của Bộ GD&ĐT (Khổ A4, Times New Roman 12pt, 2 khối tiêu đề nằm ngang cân đối, bảng đáp án và hướng dẫn chấm step-by-step).
2. File "Bang_Ma_Tran_Dap_An_Doi_Chieu..." cung cấp bảng so sánh đối chiếu đáp án song song giữa các mã đề để chấm bài trắc nghiệm thủ công nhanh chóng và chính xác tuyệt đối.
========================================================================`;
  zip.file('Thong_Tin_Bo_De.txt', summaryContent);

  // Generate and trigger download of the ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipFileName = `Bo_De_${rawSubject}_Khoi${gradeSlug}_${shuffledCodes.length}_MaDe.zip`;
  triggerBlobDownload(zipBlob, zipFileName);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
