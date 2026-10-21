import { QuestionItem, QuestionType } from '../types/exam';

/**
 * Smart Exam Parser: Tự động phân tích và bóc tách đề thi từ văn bản thô / File Word cũ
 */
export function parseRawExamText(rawText: string, defaultTopic = 'Chủ đề nhập từ đề cũ'): QuestionItem[] {
  if (!rawText || rawText.trim().length === 0) return [];

  // Normalize line endings
  const cleanText = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check if there is an answer table at the bottom, e.g. "1-A, 2-B" or "1.A 2.B" or "BẢNG ĐÁP ÁN"
  const globalAnswers = parseGlobalAnswerTable(cleanText);

  // Split into question blocks using regex for "Câu 1:", "Câu 1.", "Bài 1:", "Question 1:"
  const questionRegex = /(?:^|\n)\s*(?:Câu|Bài|Question)\s+(\d+)[\s.:]+([\s\S]+?)(?=(?:\n\s*(?:Câu|Bài|Question)\s+\d+[\s.:]+)|$)/gi;

  const parsedQuestions: QuestionItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionRegex.exec(cleanText)) !== null) {
    const qNum = parseInt(match[1], 10);
    const content = match[2].trim();

    const qItem = parseSingleQuestionBlock(qNum, content, defaultTopic);

    // If answer not found inline, check global table
    if ((qItem.correctAnswer === 'A' || !qItem.correctAnswer) && globalAnswers[qNum]) {
      qItem.correctAnswer = globalAnswers[qNum];
    }

    parsedQuestions.push(qItem);
  }

  // Fallback: If no "Câu X:" detected, split by double newlines and treat each as a question
  if (parsedQuestions.length === 0) {
    const paragraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim().length > 15);
    paragraphs.forEach((p, idx) => {
      parsedQuestions.push(parseSingleQuestionBlock(idx + 1, p.trim(), defaultTopic));
    });
  }

  return parsedQuestions;
}

function parseSingleQuestionBlock(qNum: number, text: string, topic: string): QuestionItem {
  // 1. Detect Cognitive Level
  let level = 'Thông hiểu';
  if (/\[#(?:NB|M1)\]|\[Nhận biết\]|\[Mức 1\]/i.test(text)) level = 'Nhận biết';
  else if (/\[#(?:TH|M2)\]|\[Thông hiểu\]|\[Mức 2\]/i.test(text)) level = 'Thông hiểu';
  else if (/\[#(?:VDC|M4)\]|\[Vận dụng cao\]/i.test(text)) level = 'Vận dụng cao';
  else if (/\[#(?:VD|M3)\]|\[Vận dụng\]|\[Mức 3\]/i.test(text)) level = 'Vận dụng';

  // Clean tag from question
  let cleanedText = text
    .replace(/\[#(?:NB|TH|VD|VDC|M1|M2|M3|M4)\]/gi, '')
    .replace(/\[(Nhận biết|Thông hiểu|Vận dụng|Vận dụng cao|Tự luận)\]/gi, '')
    .trim();

  // 2. Extract Explanation / Solution if present
  let explanation = '';
  const explMatch = cleanedText.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết)[:\s]+([\s\S]+)$/i);
  if (explMatch) {
    explanation = explMatch[1].trim();
    cleanedText = cleanedText.replace(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết)[:\s]+[\s\S]+$/i, '').trim();
  }

  // 3. Check for Part II True/False with 4 items a, b, c, d
  const subItemsRegex = new RegExp('(?:\\n|^)\\s*([a-d])[.:)]\\s*(.+?)(?=(?:\\n\\s*[a-d][.:)]|$)', 'gi');
  const subItemsMatch = cleanedText.match(subItemsRegex);
  if (subItemsMatch && subItemsMatch.length >= 3) {
    const subItems: Array<{ id: string; label: 'a' | 'b' | 'c' | 'd'; statement: string; isCorrect: boolean }> = [];
    const labels: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];

    // Separate main prompt
    const mainQuestion = cleanedText.split(new RegExp('(?:\\n|^)\\s*[a-d][.:)]', 'i'))[0].trim();

    subItemsMatch.forEach((itemText, i) => {
      const label = labels[i] || 'a';
      const isTrue = /\[(Đúng|Đ)\]|\bĐúng\b/i.test(itemText);
      const stmt = itemText.replace(new RegExp('^\\s*[a-d][.:)]\\s*', 'i'), '').replace(/\[(Đúng|Sai|Đ|S)\]/gi, '').trim();

      subItems.push({
        id: label,
        label,
        statement: stmt,
        isCorrect: isTrue,
      });
    });

    return {
      id: `imported_q${qNum}_${Date.now()}`,
      part: 'part2',
      type: 'true_false_group',
      level,
      topic,
      question: mainQuestion || `Khảo sát mệnh đề sau:`,
      subItems,
      correctAnswer: subItems.map((s) => `${s.label}:${s.isCorrect ? 'Đ' : 'S'}`).join(' | '),
      explanation: explanation || 'Phân tích tính đúng sai của từng mệnh đề.',
      score: 1.0,
    };
  }

  // 4. Check for 4 Options A, B, C, D
  const optionRegex = new RegExp('(?:\\n|^)\\s*([*]?)\\s*([A-D])[.:)]\\s*(.+?)(?=(?:\\n\\s*[*]?\\s*[A-D][.:)]|\\n\\s*(?:Đáp án|Lời giải)|$)', 'gi');
  const rawOptions: Array<{ letter: string; text: string; isCorrect: boolean }> = [];
  let optMatch: RegExpExecArray | null;

  while ((optMatch = optionRegex.exec(cleanedText)) !== null) {
    rawOptions.push({
      letter: optMatch[2].toUpperCase(),
      text: optMatch[3].trim(),
      isCorrect: optMatch[1] === '*',
    });
  }

  if (rawOptions.length === 4) {
    const mainQuestion = cleanedText.split(new RegExp('(?:\\n|^)\\s*[*]?\\s*[A-D][.:)]', 'i'))[0].trim();
    let correctAnswer = 'A';

    // Find if marked with asterisk
    const starOpt = rawOptions.find((o) => o.isCorrect);
    if (starOpt) {
      correctAnswer = starOpt.letter;
    } else {
      // Check if explanation says "Chọn A" or "Đáp án: A"
      const ansMatch = text.match(/(?:Chọn|Đáp án[:\s]*)([A-D])\b/i);
      if (ansMatch) {
        correctAnswer = ansMatch[1].toUpperCase();
      }
    }

    return {
      id: `imported_q${qNum}_${Date.now()}`,
      part: 'part1',
      type: 'mcq_single',
      level,
      topic,
      question: mainQuestion,
      options: rawOptions.map((o) => o.text),
      correctAnswer,
      explanation: explanation || `Chọn đáp án đúng là ${correctAnswer}.`,
      score: 0.25,
    };
  }

  // 5. Short answer or Essay
  const isShort = cleanedText.length < 180 && !cleanedText.includes('Chứng minh') && !cleanedText.includes('Trình bày');
  if (isShort) {
    let ans = '';
    const ansMatch = text.match(/(?:Đáp án|Kết quả)[:\s]+([^\n]+)/i);
    if (ansMatch) ans = ansMatch[1].trim();

    return {
      id: `imported_q${qNum}_${Date.now()}`,
      part: 'part3',
      type: 'short_answer',
      level,
      topic,
      question: cleanedText,
      correctAnswer: ans || 'Kết quả tính toán',
      explanation: explanation || 'Thực hiện các bước tính toán theo yêu cầu đề bài.',
      score: 0.5,
    };
  }

  // Essay
  return {
    id: `imported_q${qNum}_${Date.now()}`,
    part: 'part4',
    type: 'essay',
    level,
    topic,
    question: cleanedText,
    correctAnswer: 'Xem hướng dẫn chấm chi tiết.',
    explanation: explanation || 'Trình bày lời giải chi tiết và đối chiếu điều kiện.',
    rubric: [
      { step: 'Bước 1', point: 0.5, detail: 'Nêu điều kiện và công thức' },
      { step: 'Bước 2', point: 1.0, detail: 'Biến đổi đại số tường minh' },
      { step: 'Bước 3', point: 0.5, detail: 'Kết luận chính xác' },
    ],
    score: 2.0,
  };
}

function parseGlobalAnswerTable(fullText: string): Record<number, string> {
  const result: Record<number, string> = {};
  // Match forms like "1.A 2.B 3.C" or "1-A, 2-B" or "1A 2B 3C"
  const pattern = /(?:^|\s|[,;|])(\d+)\s*[-.:]?\s*([A-D])(?=\s|[,;|]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(fullText)) !== null) {
    const qNum = parseInt(m[1], 10);
    const ans = m[2].toUpperCase();
    if (qNum > 0 && qNum <= 100) {
      result[qNum] = ans;
    }
  }
  return result;
}
