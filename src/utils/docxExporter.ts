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
import { QuestionItem, ExamConfig } from '../types/exam';

/**
 * Clean LaTeX / Markdown math into clean readable Unicode text for Word
 */
export function formatLatexToUnicode(text: string): string {
  if (!text) return '';

  let cleaned = text
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1');

  // Fractions: \frac{a}{b} -> (a)/(b) or a/b
  cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

  // Square roots: \sqrt{x} -> √(x)
  cleaned = cleaned.replace(/\\sqrt\[(.*?)\]\{([^}]+)\}/g, '$1√($2)');
  cleaned = cleaned.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');

  // Superscripts
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
    'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ'
  };
  cleaned = cleaned.replace(/\^\{([0-9+\-nxy]+)\}/g, (_, p) =>
    p.split('').map((c: string) => superscripts[c] || c).join('')
  );
  cleaned = cleaned.replace(/\^([0-9nxy])/g, (_, p) => superscripts[p] || p);

  // Subscripts
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'h': 'ₕ',
    'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'p': 'ₚ', 's': 'ₛ', 't': 'ₜ'
  };
  cleaned = cleaned.replace(/_\{([0-9a-z+\-]+)\}/g, (_, p) =>
    p.split('').map((c: string) => subscripts[c] || c).join('')
  );
  cleaned = cleaned.replace(/_([0-9a-z])/g, (_, p) => subscripts[p] || p);

  // Math symbols
  cleaned = cleaned
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\le|\\leq/g, '≤')
    .replace(/\\ge|\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\sim/g, '~')
    .replace(/\\infty/g, '∞')
    .replace(/\\degree|\\circ/g, '°')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\\Leftrightarrow/g, '⇔')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta|\\delta/g, 'Δ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\theta/g, 'θ');

  // Strip dollar signs
  cleaned = cleaned.replace(/\$\$(.*?)\$\$/gs, ' $1 ').replace(/\$(.*?)\$/g, ' $1 ');

  // Strip markdown bold / italic markers
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');

  // Collapse duplicate spaces
  cleaned = cleaned.replace(/[ \t]+/g, ' ').trim();

  return cleaned;
}

/**
 * Estimate visual display width in centimeters at Times New Roman 12pt
 */
export function estimateTextWidthCm(text: string): number {
  if (!text) return 0;
  let width = 0;
  for (const ch of text) {
    if ('MW@#%&Q'.includes(ch)) {
      width += 0.28;
    } else if ('mwOODBCGUK'.includes(ch)) {
      width += 0.23;
    } else if ('ijlIt .,:;!|()[]{}'.includes(ch)) {
      width += 0.10;
    } else {
      width += 0.19; // standard lowercase, digits, etc.
    }
  }
  return width;
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'auto' };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

const THIN_BORDER = { style: BorderStyle.SINGLE, size: 4, color: '808080' };
const GRID_BORDERS = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
  insideHorizontal: THIN_BORDER,
  insideVertical: THIN_BORDER,
};

const FONT_FAMILY = 'Times New Roman';
const FONT_SIZE_12PT = 24; // 12pt in half-points

/**
 * Format score number to Vietnamese standard string (e.g. 4,0 or 0,25)
 */
function fmtScore(num: number): string {
  if (num % 1 === 0) return `${num},0`;
  return num.toFixed(2).replace('.', ',');
}

export interface DocxExportOptions {
  mode?: 'full' | 'examOnly';
  examCode?: string;
}

/**
 * Generate a genuine .docx Document adhering 100% to the official template layout
 */
export function buildStandardExamDocx(
  config: ExamConfig,
  questions: QuestionItem[],
  options: DocxExportOptions = {}
): Document {
  const mode = options.mode || 'full';
  const examCode = options.examCode || '101';

  const department = (config.departmentName || '').trim();
  const school = (config.schoolName || 'TRƯỜNG THCS & THPT').trim();
  const examTitle = (config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I').trim();
  const academicYear = (config.academicYear || '2026 - 2027').trim();
  const rawSubject = (config.customSubject || config.subject || 'Khoa học tự nhiên').trim();
  const subjectUpper = rawSubject.toUpperCase();
  const gradeStr = config.gradeLevel === 'primary' ? `LỚP ${config.grade}` : `LỚP ${config.grade}`;
  const duration = config.durationMinutes || 45;

  // Separate question parts
  const p1Questions = questions.filter(q => q.part === 'part1' || q.type === 'mcq_single');
  const p2Questions = questions.filter(q => q.part === 'part2' || q.type === 'true_false_group');
  const p3Questions = questions.filter(q => q.part === 'part3' || q.type === 'short_answer');
  const p4Questions = questions.filter(q => q.part === 'part4' || q.type === 'essay');

  const p1Score = p1Questions.reduce((s, q) => s + (q.score || 0.25), 0);
  const p2Score = p2Questions.reduce((s, q) => s + (q.score || 1.0), 0);
  const p3Score = p3Questions.reduce((s, q) => s + (q.score || 0.5), 0);
  const p4Score = p4Questions.reduce((s, q) => s + (q.score || 1.0), 0);

  // Determine section numbering (I, II, III, IV) based on actual present sections
  const hasP1 = p1Questions.length > 0;
  const hasP2 = p2Questions.length > 0;
  const hasP3 = p3Questions.length > 0;
  const hasP4 = p4Questions.length > 0;

  let sectionRomanIndex = 1;
  const toRoman = (n: number) => {
    const r = ['I', 'II', 'III', 'IV', 'V'];
    return r[n - 1] || `${n}`;
  };

  const p1Roman = hasP1 ? toRoman(sectionRomanIndex++) : '';
  const p2Roman = hasP2 ? toRoman(sectionRomanIndex++) : '';
  const p3Roman = hasP3 ? toRoman(sectionRomanIndex++) : '';
  const p4Roman = hasP4 ? toRoman(sectionRomanIndex++) : '';

  const children: (Paragraph | Table)[] = [];

  // ==========================================
  // KHỐI ĐẦU TRANG (2 KHỐI NẰM NGANG CÂN ĐỐI)
  // ==========================================
  const leftCellParagraphs: Paragraph[] = [];
  if (department) {
    leftCellParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: department.toUpperCase(),
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
          }),
        ],
      })
    );
  }
  leftCellParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: school.toUpperCase(),
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `MÃ ĐỀ: ${examCode}`,
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
        }),
      ],
    })
  );

  const rightCellParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: examTitle.toUpperCase(),
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `NĂM HỌC ${academicYear}`,
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `Môn: ${subjectUpper} - ${gradeStr}`,
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Thời gian làm bài: ${duration} phút (Không kể phát đề)`,
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          italics: true,
        }),
      ],
    }),
  ];

  const headerTable = new Table({
    width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: convertMillimetersToTwip(72), type: WidthType.DXA },
            margins: { top: 0, bottom: 40, left: 0, right: 100 },
            verticalAlign: VerticalAlign.TOP,
            children: leftCellParagraphs,
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(93), type: WidthType.DXA },
            margins: { top: 0, bottom: 40, left: 100, right: 0 },
            verticalAlign: VerticalAlign.TOP,
            children: rightCellParagraphs,
          }),
        ],
      }),
    ],
  });

  children.push(headerTable);

  // Line divider
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 80 },
      children: [
        new TextRun({
          text: '---------------------------------------------------------------------------------------------------',
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          color: '000000',
        }),
      ],
    })
  );

  // Student info line
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'Họ và tên học sinh: ......................................................................... Lớp: ................ Số báo danh: ................',
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
        }),
      ],
    })
  );

  // PHẦN 1: ĐỀ KIỂM TRA
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 140 },
      keepNext: true,
      children: [
        new TextRun({
          text: 'PHẦN 1: ĐỀ KIỂM TRA',
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
        }),
      ],
    })
  );

  let questionCounter = 1;

  // ==========================================
  // PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN
  // ==========================================
  if (hasP1) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${p1Roman}. PHẦN TRẮC NGHIỆM NHIỀU LỰA CHỌN (${fmtScore(p1Score)} điểm)`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: `Thí sinh chọn một phương án trả lời đúng duy nhất trong mỗi câu hỏi từ Câu ${questionCounter} đến Câu ${questionCounter + p1Questions.length - 1}.`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            italics: true,
          }),
        ],
      })
    );

    for (const q of p1Questions) {
      const qNum = questionCounter++;
      const cleanedQuestion = formatLatexToUnicode(q.question);

      // Question passage if present
      if (q.passage) {
        children.push(
          new Paragraph({
            spacing: { before: 80, after: 40 },
            children: [
              new TextRun({
                text: 'Đọc đoạn ngữ liệu sau để trả lời câu hỏi: ',
                font: FONT_FAMILY,
                size: FONT_SIZE_12PT,
                bold: true,
                italics: true,
              }),
              new TextRun({
                text: formatLatexToUnicode(q.passage),
                font: FONT_FAMILY,
                size: FONT_SIZE_12PT,
                italics: true,
              }),
            ],
          })
        );
      }

      // Question stem
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: `Câu ${qNum}. `,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
            new TextRun({
              text: cleanedQuestion,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
            }),
          ],
        })
      );

      // Render options with 3-tier adaptive rule
      const rawOpts = q.options && q.options.length >= 4 ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'];
      const opts = rawOpts.map(o => formatLatexToUnicode(o));

      const wA = estimateTextWidthCm(opts[0]);
      const wB = estimateTextWidthCm(opts[1]);
      const wC = estimateTextWidthCm(opts[2]);
      const wD = estimateTextWidthCm(opts[3]);
      const maxW = Math.max(wA, wB, wC, wD);
      const totalW = wA + wB + wC + wD;

      // Rule 1: 4 options on 1 line if all are very short (e.g. max <= 3.3cm and total <= 11cm)
      if (maxW <= 3.3 && totalW <= 11.0) {
        const colW = convertMillimetersToTwip(165 / 4); // 41.25 mm
        const optTable = new Table({
          width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: colW, type: WidthType.DXA },
                  margins: { top: 0, bottom: 40, left: 0, right: 40 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'A. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[0], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: colW, type: WidthType.DXA },
                  margins: { top: 0, bottom: 40, left: 0, right: 40 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'B. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[1], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: colW, type: WidthType.DXA },
                  margins: { top: 0, bottom: 40, left: 0, right: 40 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'C. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[2], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: colW, type: WidthType.DXA },
                  margins: { top: 0, bottom: 40, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'D. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[3], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        children.push(optTable);
      }
      // Rule 2: 2 options per line (A-B, C-D), B and D starting exactly at 7.5 cm
      else if (Math.max(wA, wC) + 0.6 <= 7.2 && Math.max(wB, wD) + 0.6 <= 8.8) {
        // Col 1 width = 7.5cm (4252 dxa), Col 2 width = 9.0cm (5103 dxa)
        const col1W = convertMillimetersToTwip(75);
        const col2W = convertMillimetersToTwip(90);

        const optTable = new Table({
          width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
          borders: NO_BORDERS,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: col1W, type: WidthType.DXA },
                  margins: { top: 0, bottom: 20, left: 0, right: 80 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'A. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[0], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: col2W, type: WidthType.DXA },
                  margins: { top: 0, bottom: 20, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'B. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[1], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: col1W, type: WidthType.DXA },
                  margins: { top: 0, bottom: 40, left: 0, right: 80 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'C. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[2], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: col2W, type: WidthType.DXA },
                  margins: { top: 0, bottom: 40, left: 0, right: 0 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: 'D. ', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                        new TextRun({ text: opts[3], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
        children.push(optTable);
      }
      // Rule 3: Long options -> 4 separate paragraphs with hanging indent
      else {
        const labels = ['A. ', 'B. ', 'C. ', 'D. '];
        for (let i = 0; i < 4; i++) {
          children.push(
            new Paragraph({
              indent: { left: 450, hanging: 450 },
              spacing: { after: 30 },
              children: [
                new TextRun({ text: labels[i], font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true }),
                new TextRun({ text: opts[i], font: FONT_FAMILY, size: FONT_SIZE_12PT }),
              ],
            })
          );
        }
      }
    }
  }

  // ==========================================
  // PHẦN II: TRẮC NGHIỆM ĐÚNG - SAI
  // ==========================================
  if (hasP2) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 40 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${p2Roman}. PHẦN TRẮC NGHIỆM ĐÚNG / SAI (${fmtScore(p2Score)} điểm)`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: `Thí sinh trả lời từ Câu ${questionCounter} đến Câu ${questionCounter + p2Questions.length - 1}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            italics: true,
          }),
        ],
      })
    );

    for (const q of p2Questions) {
      const qNum = questionCounter++;
      const cleanedQuestion = formatLatexToUnicode(q.question);

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: `Câu ${qNum}. `,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
            new TextRun({
              text: cleanedQuestion,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
            }),
          ],
        })
      );

      const subItems = q.subItems && q.subItems.length >= 4 ? q.subItems.slice(0, 4) : [
        { id: 'a', label: 'a', statement: 'Nhận định 1', isCorrect: true },
        { id: 'b', label: 'b', statement: 'Nhận định 2', isCorrect: false },
        { id: 'c', label: 'c', statement: 'Nhận định 3', isCorrect: true },
        { id: 'd', label: 'd', statement: 'Nhận định 4', isCorrect: false },
      ];

      for (let sIdx = 0; sIdx < 4; sIdx++) {
        const sub = subItems[sIdx];
        const label = `${String.fromCharCode(97 + sIdx)}) `;
        const statement = formatLatexToUnicode(sub.statement);

        children.push(
          new Paragraph({
            indent: { left: 450, hanging: 450 },
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: label,
                font: FONT_FAMILY,
                size: FONT_SIZE_12PT,
                bold: true,
              }),
              new TextRun({
                text: statement,
                font: FONT_FAMILY,
                size: FONT_SIZE_12PT,
              }),
            ],
          })
        );
      }
    }
  }

  // ==========================================
  // PHẦN III: TRẮC NGHIỆM TRẢ LỜI NGẮN (nếu có)
  // ==========================================
  if (hasP3) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 40 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${p3Roman}. PHẦN TRẮC NGHIỆM TRẢ LỜI NGẮN (${fmtScore(p3Score)} điểm)`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: `Thí sinh trả lời từ Câu ${questionCounter} đến Câu ${questionCounter + p3Questions.length - 1}. Thí sinh viết câu trả lời ngắn vào phiếu làm bài.`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            italics: true,
          }),
        ],
      })
    );

    for (const q of p3Questions) {
      const qNum = questionCounter++;
      const cleanedQuestion = formatLatexToUnicode(q.question);

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `Câu ${qNum}. `,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
            new TextRun({
              text: cleanedQuestion,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
            }),
          ],
        })
      );
    }
  }

  // ==========================================
  // PHẦN IV / III: TỰ LUẬN
  // ==========================================
  if (hasP4) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 40 },
        keepNext: true,
        children: [
          new TextRun({
            text: `${p4Roman}. PHẦN TỰ LUẬN (${fmtScore(p4Score)} điểm)`,
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'Thí sinh trình bày chi tiết lời giải các câu hỏi sau vào giấy làm bài.',
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            italics: true,
          }),
        ],
      })
    );

    for (const q of p4Questions) {
      const qNum = questionCounter++;
      const qScore = q.score || 1.0;
      const cleanedQuestion = formatLatexToUnicode(q.question);

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `Câu ${qNum} (${fmtScore(qScore)} điểm). `,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
            new TextRun({
              text: cleanedQuestion,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
            }),
          ],
        })
      );
    }
  }

  // End of exam
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 40 },
      children: [
        new TextRun({
          text: '------------------- HẾT -------------------',
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          bold: true,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: '(Cán bộ coi thi không giải thích gì thêm)',
          font: FONT_FAMILY,
          size: FONT_SIZE_12PT,
          italics: true,
          color: '000000',
        }),
      ],
    })
  );

  // ==========================================
  // PHẦN 2: ĐÁP ÁN - HƯỚNG DẪN CHẤM (NẾU CHẾ ĐỘ FULL)
  // ==========================================
  if (mode === 'full') {
    // Ngắt trang thực sự
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );

    // Tiêu đề Phần 2
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80, after: 140 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'PHẦN 2: ĐÁP ÁN - HƯỚNG DẪN CHẤM',
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            bold: true,
          }),
        ],
      })
    );

    // 1. Đáp án phần trắc nghiệm nhiều lựa chọn
    if (hasP1) {
      const unitP1 = p1Questions[0]?.score || 0.25;
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: `${p1Roman}. ĐÁP ÁN PHẦN TRẮC NGHIỆM NHIỀU LỰA CHỌN (${fmtScore(p1Score)} điểm)`,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80 },
          keepNext: true,
          children: [
            new TextRun({
              text: `Mỗi câu trả lời đúng được ${fmtScore(unitP1)} điểm. Tổng cộng ${p1Questions.length} câu = ${fmtScore(p1Score)} điểm.`,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              italics: true,
            }),
          ],
        })
      );

      // Grid table of answers (in chunks of 8 or 10 columns as in template)
      const chunkSize = 8;
      const chunks: QuestionItem[][] = [];
      for (let i = 0; i < p1Questions.length; i += chunkSize) {
        chunks.push(p1Questions.slice(i, i + chunkSize));
      }

      const tableRows: TableRow[] = [];
      let currentIdx = 1;

      for (const chunk of chunks) {
        const numCols = chunk.length;
        // Label col + question cols
        const labelW = convertMillimetersToTwip(25);
        const eachColW = convertMillimetersToTwip((165 - 25) / Math.max(numCols, 8));

        // Row 1: Câu
        const qNumCells: TableCell[] = [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            shading: { fill: 'F2F2F2' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Câu', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })],
              }),
            ],
          }),
        ];

        // Row 2: Đáp án
        const ansCells: TableCell[] = [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            shading: { fill: 'FAFAFA' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Đáp án', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' })],
              }),
            ],
          }),
        ];

        for (let j = 0; j < chunk.length; j++) {
          const q = chunk[j];
          const qNumberStr = `${currentIdx + j}`;
          const ansStr = String(q.correctAnswer || 'A').toUpperCase().trim();

          qNumCells.push(
            new TableCell({
              width: { size: eachColW, type: WidthType.DXA },
              shading: { fill: 'F2F2F2' },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: qNumberStr, font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' })],
                }),
              ],
            })
          );

          ansCells.push(
            new TableCell({
              width: { size: eachColW, type: WidthType.DXA },
              shading: { fill: 'FFFFFF' },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: ansStr, font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' })],
                }),
              ],
            })
          );
        }

        // Pad remaining columns if less than 8
        for (let p = chunk.length; p < 8; p++) {
          qNumCells.push(new TableCell({ width: { size: eachColW, type: WidthType.DXA }, children: [new Paragraph('')] }));
          ansCells.push(new TableCell({ width: { size: eachColW, type: WidthType.DXA }, children: [new Paragraph('')] }));
        }

        tableRows.push(
          new TableRow({ children: qNumCells }),
          new TableRow({ children: ansCells })
        );

        currentIdx += chunk.length;
      }

      children.push(
        new Table({
          width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
          borders: GRID_BORDERS,
          rows: tableRows,
        })
      );
    }

    // 2. Đáp án phần trắc nghiệm Đúng / Sai
    if (hasP2) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: `${p2Roman}. ĐÁP ÁN PHẦN TRẮC NGHIỆM ĐÚNG / SAI (${fmtScore(p2Score)} điểm)`,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 20 },
          keepNext: true,
          children: [
            new TextRun({
              text: 'Quy tắc tính điểm theo quy định Bộ GD&ĐT cho mỗi câu lớn (1,0 điểm/câu):',
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 10 },
          children: [new TextRun({ text: '- Trả lời đúng 01 ý: được 0,10 điểm.', font: FONT_FAMILY, size: FONT_SIZE_12PT, italics: true })],
        }),
        new Paragraph({
          spacing: { after: 10 },
          children: [new TextRun({ text: '- Trả lời đúng 02 ý: được 0,25 điểm.', font: FONT_FAMILY, size: FONT_SIZE_12PT, italics: true })],
        }),
        new Paragraph({
          spacing: { after: 10 },
          children: [new TextRun({ text: '- Trả lời đúng 03 ý: được 0,50 điểm.', font: FONT_FAMILY, size: FONT_SIZE_12PT, italics: true })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: '- Trả lời đúng cả 04 ý: được 1,00 điểm.', font: FONT_FAMILY, size: FONT_SIZE_12PT, italics: true })],
        })
      );

      // Table for True/False answers
      const tfHeaderRow = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: convertMillimetersToTwip(28), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Câu hỏi', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(18), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Lệnh hỏi', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(24), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Đáp án', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })],
              }),
            ],
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(95), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Hướng dẫn giải thích ngắn gọn', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })],
              }),
            ],
          }),
        ],
      });

      const tfRows: TableRow[] = [tfHeaderRow];
      let tfQCounter = p1Questions.length + 1;

      for (const q of p2Questions) {
        const qNum = tfQCounter++;
        const subItems = q.subItems && q.subItems.length >= 4 ? q.subItems.slice(0, 4) : [
          { id: 'a', label: 'a', statement: '', isCorrect: true, explanation: '' },
          { id: 'b', label: 'b', statement: '', isCorrect: false, explanation: '' },
          { id: 'c', label: 'c', statement: '', isCorrect: true, explanation: '' },
          { id: 'd', label: 'd', statement: '', isCorrect: false, explanation: '' },
        ];

        for (let sIdx = 0; sIdx < 4; sIdx++) {
          const sub = subItems[sIdx];
          const isCorrect = sub.isCorrect;
          const ansText = isCorrect ? 'ĐÚNG' : 'SAI';
          const expText = formatLatexToUnicode(sub.explanation || q.explanation || 'Áp dụng định luật và tính chất theo chuẩn kiến thức.');

          const cells: TableCell[] = [];

          // Column 1: Rowspan 4 for the question label
          if (sIdx === 0) {
            cells.push(
              new TableCell({
                rowSpan: 4,
                width: { size: convertMillimetersToTwip(28), type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: `Câu ${qNum}`, font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: '(1,0 điểm)', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' }),
                    ],
                  }),
                ],
              })
            );
          }

          // Column 2: Lệnh hỏi (a, b, c, d)
          cells.push(
            new TableCell({
              width: { size: convertMillimetersToTwip(18), type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: `${String.fromCharCode(97 + sIdx)})`, font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' }),
                  ],
                }),
              ],
            })
          );

          // Column 3: Đáp án (ĐÚNG / SAI)
          cells.push(
            new TableCell({
              width: { size: convertMillimetersToTwip(24), type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: ansText, font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' }),
                  ],
                }),
              ],
            })
          );

          // Column 4: Hướng dẫn giải thích ngắn gọn
          cells.push(
            new TableCell({
              width: { size: convertMillimetersToTwip(95), type: WidthType.DXA },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 30, bottom: 30, left: 60, right: 60 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: expText, font: FONT_FAMILY, size: FONT_SIZE_12PT }),
                  ],
                }),
              ],
            })
          );

          tfRows.push(new TableRow({ children: cells, cantSplit: true }));
        }
      }

      children.push(
        new Table({
          width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
          borders: GRID_BORDERS,
          rows: tfRows,
        })
      );
    }

    // 3. Đáp án phần trắc nghiệm trả lời ngắn (nếu có)
    if (hasP3) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 40 },
          keepNext: true,
          children: [
            new TextRun({
              text: `${p3Roman}. ĐÁP ÁN PHẦN TRẮC NGHIỆM TRẢ LỜI NGẮN (${fmtScore(p3Score)} điểm)`,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
          ],
        })
      );

      const tlnHeaderRow = new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: convertMillimetersToTwip(25), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Câu', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })] })],
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(45), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Đáp án chính xác', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })] })],
          }),
          new TableCell({
            width: { size: convertMillimetersToTwip(95), type: WidthType.DXA },
            shading: { fill: 'E8F1FB' },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Hướng dẫn phương pháp', font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })] })],
          }),
        ],
      });

      const tlnRows: TableRow[] = [tlnHeaderRow];
      let tlnQCounter = p1Questions.length + p2Questions.length + 1;

      for (const q of p3Questions) {
        const qNum = tlnQCounter++;
        tlnRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                width: { size: convertMillimetersToTwip(25), type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Câu ${qNum}`, font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true })] })],
              }),
              new TableCell({
                width: { size: convertMillimetersToTwip(45), type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(q.correctAnswer), font: FONT_FAMILY, size: FONT_SIZE_12PT, bold: true, color: '000000' })] })],
              }),
              new TableCell({
                width: { size: convertMillimetersToTwip(95), type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 30, bottom: 30, left: 60, right: 60 },
                children: [new Paragraph({ children: [new TextRun({ text: formatLatexToUnicode(q.explanation || 'Tính toán theo công thức cốt lõi.'), font: FONT_FAMILY, size: FONT_SIZE_12PT })] })],
              }),
            ],
          })
        );
      }

      children.push(
        new Table({
          width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
          borders: GRID_BORDERS,
          rows: tlnRows,
        })
      );
    }

    // 4 / 3. Đáp án và thang điểm phần tự luận
    if (hasP4) {
      children.push(
        new Paragraph({
          spacing: { before: 140, after: 60 },
          keepNext: true,
          children: [
            new TextRun({
              text: `${p4Roman}. ĐÁP ÁN VÀ THANG ĐIỂM PHẦN TỰ LUẬN (${fmtScore(p4Score)} điểm)`,
              font: FONT_FAMILY,
              size: FONT_SIZE_12PT,
              bold: true,
            }),
          ],
        })
      );

      const essayRows: TableRow[] = [];
      let essayQCounter = p1Questions.length + p2Questions.length + p3Questions.length + 1;

      for (const q of p4Questions) {
        const qNum = essayQCounter++;
        const qScore = q.score || 1.0;

        // Câu X (1,0 điểm): header row
        essayRows.push(
          new TableRow({
            cantSplit: true,
            children: [
              new TableCell({
                columnSpan: 2,
                shading: { fill: 'F2F2F2' },
                margins: { top: 40, bottom: 40, left: 60, right: 60 },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Câu ${qNum} (${fmtScore(qScore)} điểm):`,
                        font: FONT_FAMILY,
                        size: FONT_SIZE_12PT,
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );

        if (q.rubric && q.rubric.length > 0) {
          for (const r of q.rubric) {
            essayRows.push(
              new TableRow({
                cantSplit: true,
                children: [
                  new TableCell({
                    width: { size: convertMillimetersToTwip(135), type: WidthType.DXA },
                    margins: { top: 30, bottom: 30, left: 60, right: 60 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `• ${formatLatexToUnicode(r.detail)}`,
                            font: FONT_FAMILY,
                            size: FONT_SIZE_12PT,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: convertMillimetersToTwip(30), type: WidthType.DXA },
                    verticalAlign: VerticalAlign.CENTER,
                    margins: { top: 30, bottom: 30, left: 20, right: 20 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `${fmtScore(r.point)} điểm`,
                            font: FONT_FAMILY,
                            size: FONT_SIZE_12PT,
                            bold: true,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              })
            );
          }
        } else {
          // If no rubric steps, render explanation and total score
          essayRows.push(
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: convertMillimetersToTwip(135), type: WidthType.DXA },
                  margins: { top: 30, bottom: 30, left: 60, right: 60 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `• ${formatLatexToUnicode(q.explanation || 'Trình bày đầy đủ các bước giải và kết luận chính xác.')}`,
                          font: FONT_FAMILY,
                          size: FONT_SIZE_12PT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: convertMillimetersToTwip(30), type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  margins: { top: 30, bottom: 30, left: 20, right: 20 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: `${fmtScore(qScore)} điểm`,
                          font: FONT_FAMILY,
                          size: FONT_SIZE_12PT,
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            })
          );
        }
      }

      children.push(
        new Table({
          width: { size: convertMillimetersToTwip(165), type: WidthType.DXA },
          borders: GRID_BORDERS,
          rows: essayRows,
        })
      );
    }
  }

  // Create Document adhering strictly to page setup and global default styles
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE_12PT,
            color: '000000',
          },
          paragraph: {
            spacing: {
              line: 276,
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210), // A4 21.0 cm
              height: convertMillimetersToTwip(297), // A4 29.7 cm
            },
            margin: {
              top: convertMillimetersToTwip(20), // 2.0 cm
              bottom: convertMillimetersToTwip(20), // 2.0 cm
              left: convertMillimetersToTwip(25), // 2.5 cm
              right: convertMillimetersToTwip(20), // 2.0 cm
            },
          },
        },
        children,
      },
    ],
  });

  return doc;
}

/**
 * Trigger download of the genuine .docx file in the browser
 */
export async function downloadStandardExamDocx(
  config: ExamConfig,
  questions: QuestionItem[],
  options: DocxExportOptions = {}
): Promise<void> {
  const doc = buildStandardExamDocx(config, questions, options);
  const blob = await Packer.toBlob(doc);

  const rawSubject = (config.customSubject || config.subject || 'MonHoc').trim();
  const subjectSlug = rawSubject.replace(/\s+/g, '_');
  const gradeSlug = config.grade;
  const examCode = options.examCode || '101';
  const prefix = options.mode === 'examOnly' ? 'De_Thi' : 'Tron_Bo_De_Kiem_Tra';
  const filename = `${prefix}_${subjectSlug}_Lop${gradeSlug}_Ma${examCode}.docx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
