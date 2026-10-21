import { QuestionItem, ExamConfig } from '../types/exam';

/**
 * Xuất đề kiểm tra sang cú pháp chuẩn Azota
 * Azota nhận dạng qua:
 * - "Câu 1: [#NB] Nội dung câu hỏi..."
 * - Các phương án "A. ...", "*B. ..." (dấu * trước phương án đúng)
 * - "Lời giải: ..."
 */
export function exportToAzotaFormat(questions: QuestionItem[], config: ExamConfig): string {
  let output = `[<br>]\n`;
  output += `TRƯỜNG: ${config.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}\n`;
  output += `ĐỀ THI: ${config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ'}\n`;
  output += `MÔN: ${config.customSubject || config.subject} - LỚP: ${config.grade}\n`;
  output += `THỜI GIAN: ${config.durationMinutes} PHÚT\n`;
  output += `--------------------------------------------------\n\n`;

  let qNum = 1;

  questions.forEach((q) => {
    // Map cognitive level to Azota tag: [#NB], [#TH], [#VD], [#VDC]
    let tag = '[#NB]';
    if (q.level.includes('Thông hiểu') || q.level.includes('Hiểu') || q.level.includes('Mức 2')) {
      tag = '[#TH]';
    } else if (q.level.includes('Vận dụng cao')) {
      tag = '[#VDC]';
    } else if (q.level.includes('Vận dụng') || q.level.includes('Mức 3')) {
      tag = '[#VD]';
    }

    if (q.passage) {
      output += `[Ngữ liệu]: ${q.passage}\n\n`;
    }

    // Part I: MCQ Single
    if (q.type === 'mcq_single' || q.part === 'part1') {
      output += `Câu ${qNum++}: ${tag} ${q.question}\n`;
      if (q.options && q.options.length === 4) {
        const correctLetter = String(q.correctAnswer).trim().toUpperCase();
        ['A', 'B', 'C', 'D'].forEach((letter, idx) => {
          const isCorrect = correctLetter === letter;
          output += `${isCorrect ? '*' : ''}${letter}. ${q.options![idx]}\n`;
        });
      }
      output += `Lời giải: ${q.explanation || 'Áp dụng lý thuyết chuẩn GDPT 2018.'}\n\n`;
    }
    // Part II: True / False 4 sub-items
    else if (q.type === 'true_false_group' || q.part === 'part2') {
      output += `Câu ${qNum++}: ${tag} ${q.question}\n`;
      if (q.subItems) {
        q.subItems.forEach((sub) => {
          output += `${sub.label}) ${sub.statement} [${sub.isCorrect ? 'ĐÚNG' : 'SAI'}]\n`;
        });
      }
      output += `Lời giải: ${q.explanation || ''}\n\n`;
    }
    // Part III: Short Answer
    else if (q.type === 'short_answer' || q.part === 'part3') {
      output += `Câu ${qNum++}: ${tag} ${q.question}\n`;
      output += `Đáp án: ${q.correctAnswer}\n`;
      output += `Lời giải: ${q.explanation || ''}\n\n`;
    }
    // Part IV: Essay
    else {
      output += `Câu ${qNum++}: [Tự luận] ${tag} ${q.question}\n`;
      output += `Hướng dẫn chấm:\n${q.explanation || ''}\n`;
      if (q.rubric && q.rubric.length > 0) {
        q.rubric.forEach((r) => {
          output += `- ${r.step} (${r.point}đ): ${r.detail}\n`;
        });
      }
      output += `\n`;
    }
  });

  return output;
}

/**
 * Xuất sang định dạng bảng K12Online (Copy dán vào Excel / K12Online Question Importer)
 */
export function exportToK12OnlineTSV(questions: QuestionItem[]): string {
  const headers = [
    'STT',
    'Loại câu hỏi',
    'Mức độ nhận thức',
    'Nội dung câu hỏi',
    'Phương án A',
    'Phương án B',
    'Phương án C',
    'Phương án D',
    'Đáp án đúng',
    'Lời giải chi tiết',
  ];

  const rows = questions.map((q, idx) => {
    let qType = 'Nhiều lựa chọn (1 đáp án)';
    if (q.type === 'true_false_group') qType = 'Đúng/Sai';
    else if (q.type === 'short_answer') qType = 'Trả lời ngắn';
    else if (q.type === 'essay') qType = 'Tự luận';

    const optA = q.options?.[0] || '';
    const optB = q.options?.[1] || '';
    const optC = q.options?.[2] || '';
    const optD = q.options?.[3] || '';

    let ans = String(q.correctAnswer || '');
    if (q.type === 'true_false_group' && q.subItems) {
      ans = q.subItems.map((s) => `${s.label}:${s.isCorrect ? 'Đ' : 'S'}`).join(';');
    }

    // Escape tabs and line breaks for TSV
    const sanitize = (text: string) => text.replace(/\t/g, ' ').replace(/\n/g, '<br>');

    return [
      idx + 1,
      qType,
      q.level,
      sanitize(q.question),
      sanitize(optA),
      sanitize(optB),
      sanitize(optC),
      sanitize(optD),
      sanitize(ans),
      sanitize(q.explanation || ''),
    ].join('\t');
  });

  return [headers.join('\t'), ...rows].join('\n');
}

/**
 * Xuất dạng văn bản sạch cho Google Forms / Quizizz
 */
export function exportToGoogleFormsFormat(questions: QuestionItem[]): string {
  let output = '';
  questions.forEach((q, idx) => {
    output += `${idx + 1}. ${q.question}\n`;
    if (q.options && q.options.length === 4) {
      ['A', 'B', 'C', 'D'].forEach((l, i) => {
        output += `${l}. ${q.options![i]}\n`;
      });
      output += `Đáp án: ${q.correctAnswer}\n\n`;
    } else if (q.subItems) {
      q.subItems.forEach((s) => {
        output += `  ${s.label}) ${s.statement} -> ${s.isCorrect ? 'Đúng' : 'Sai'}\n`;
      });
      output += '\n';
    } else {
      output += `Đáp án: ${q.correctAnswer}\n\n`;
    }
  });
  return output;
}
