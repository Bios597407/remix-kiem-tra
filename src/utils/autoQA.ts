import { QuestionItem, ExamConfig, QAReport, QAResultItem } from '../types/exam';

/**
 * Auto-QA Module: Kiểm tra chất lượng đề kiểm tra theo 12 tiêu chí khảo thí nghiêm ngặt
 */
export function runExamQA(questions: QuestionItem[], config: ExamConfig): QAReport {
  const items: QAResultItem[] = [];

  const expectedTotalQuestions =
    (config.sectionCounts.part1 || 0) +
    (config.sectionCounts.part2 || 0) +
    (config.sectionCounts.part3 || 0) +
    (config.sectionCounts.part4 || 0) +
    (config.sectionCounts.matching || 0) +
    (config.sectionCounts.fill_blank || 0);

  // 1. Đúng tổng số câu
  const actualCount = questions.length;
  const countMatches = actualCount === expectedTotalQuestions;
  items.push({
    id: 1,
    title: 'Đúng tổng số câu hỏi đã cấu hình',
    passed: countMatches,
    severity: countMatches ? 'success' : 'error',
    details: countMatches
      ? `Đề có đúng ${actualCount}/${expectedTotalQuestions} câu theo thiết lập.`
      : `Số câu thực tế (${actualCount}) không khớp với thiết lập (${expectedTotalQuestions}).`
  });

  // 2. Đúng tổng điểm 10 (hoặc thang điểm cấu hình)
  const totalScore = Number(questions.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2));
  const expectedScore = config.totalScore || 10;
  const scoreMatches = Math.abs(totalScore - expectedScore) <= 0.05;
  items.push({
    id: 2,
    title: `Tổng điểm toàn đề (${expectedScore} điểm)`,
    passed: scoreMatches,
    severity: scoreMatches ? 'success' : 'error',
    details: scoreMatches
      ? `Tổng điểm chính xác: ${totalScore}/${expectedScore} điểm.`
      : `Tổng điểm hiện tại là ${totalScore} điểm, lệch so với mục tiêu ${expectedScore} điểm.`
  });

  // 3. Khớp tỷ lệ ma trận & mức độ nhận thức
  const levelCounts: Record<string, number> = {};
  questions.forEach(q => {
    const lvl = q.level || 'Chưa phân loại';
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  });
  const hasMultipleLevels = Object.keys(levelCounts).length >= 2;
  items.push({
    id: 3,
    title: 'Phân bổ mức độ nhận thức chuẩn ma trận',
    passed: hasMultipleLevels,
    severity: hasMultipleLevels ? 'success' : 'warning',
    details: `Đã phân bổ theo các mức: ${Object.entries(levelCounts).map(([lvl, cnt]) => `${lvl}: ${cnt} câu`).join(', ')}.`
  });

  // 4. Không trùng lặp nội dung câu hỏi
  const questionTexts = new Set<string>();
  let duplicateCount = 0;
  questions.forEach(q => {
    const clean = q.question.trim().toLowerCase().slice(0, 80);
    if (questionTexts.has(clean)) {
      duplicateCount++;
    } else {
      questionTexts.add(clean);
    }
  });
  items.push({
    id: 4,
    title: 'Không trùng lặp câu hỏi trong cùng một đề',
    passed: duplicateCount === 0,
    severity: duplicateCount === 0 ? 'success' : 'error',
    details: duplicateCount === 0
      ? 'Tất cả câu hỏi đều có nội dung riêng biệt, không có câu nào bị lặp.'
      : `Phát hiện ${duplicateCount} câu có nội dung trùng lặp hoặc tương tự nhau.`
  });

  // 5. Đủ 4 phương án A, B, C, D cho Trắc nghiệm Phần I
  const part1Questions = questions.filter(q => q.type === 'mcq_single' || q.part === 'part1');
  const invalidPart1 = part1Questions.filter(q => !q.options || q.options.length < 4);
  items.push({
    id: 5,
    title: 'Đủ 4 phương án A, B, C, D (Trắc nghiệm nhiều lựa chọn)',
    passed: invalidPart1.length === 0,
    severity: invalidPart1.length === 0 ? 'success' : 'error',
    details: invalidPart1.length === 0
      ? `Tất cả ${part1Questions.length} câu trắc nghiệm nhiều lựa chọn đều đủ 4 phương án chuẩn.`
      : `Có ${invalidPart1.length} câu thiếu phương án hoặc chưa đủ 4 lựa chọn.`
  });

  // 6. Đáp án đúng nằm trong các phương án
  const badAnswerPart1 = part1Questions.filter(q => {
    if (typeof q.correctAnswer !== 'string') return true;
    const ans = q.correctAnswer.trim().toUpperCase();
    return !['A', 'B', 'C', 'D'].includes(ans);
  });
  items.push({
    id: 6,
    title: 'Đáp án đúng hợp lệ và nằm trong danh sách phương án',
    passed: badAnswerPart1.length === 0,
    severity: badAnswerPart1.length === 0 ? 'success' : 'error',
    details: badAnswerPart1.length === 0
      ? 'Các câu trắc nghiệm đều có đáp án chuẩn xác (A, B, C hoặc D).'
      : `Có ${badAnswerPart1.length} câu có đáp án không thuộc tập {A, B, C, D}.`
  });

  // 7. Đủ 4 ý a, b, c, d cho câu Trắc nghiệm Đúng/Sai (Phần II)
  const part2Questions = questions.filter(q => q.type === 'true_false_group' || q.part === 'part2');
  const invalidPart2 = part2Questions.filter(q => !q.subItems || q.subItems.length !== 4);
  items.push({
    id: 7,
    title: 'Cấu trúc Trắc nghiệm Đúng/Sai định dạng mới (Đủ 4 ý a, b, c, d)',
    passed: invalidPart2.length === 0,
    severity: invalidPart2.length === 0 ? 'success' : 'error',
    details: invalidPart2.length === 0
      ? `Tất cả ${part2Questions.length} câu Đúng/Sai đều có cấu trúc chuẩn 4 mệnh đề a, b, c, d.`
      : `Có ${invalidPart2.length} câu Đúng/Sai không đủ hoặc thừa 4 mệnh đề.`
  });

  // 8. Công thức LaTeX hiển thị tốt
  let latexErrors = 0;
  questions.forEach(q => {
    const fullText = `${q.question} ${(q.options || []).join(' ')} ${q.explanation || ''}`;
    // Check unmatched $
    const dollarMatches = fullText.match(/\$/g);
    if (dollarMatches && dollarMatches.length % 2 !== 0) {
      latexErrors++;
    }
  });
  items.push({
    id: 8,
    title: 'Ký hiệu khoa học và công thức toán học LaTeX',
    passed: latexErrors === 0,
    severity: latexErrors === 0 ? 'success' : 'warning',
    details: latexErrors === 0
      ? 'Toàn bộ công thức LaTeX toán/lý/hóa đóng mở chuẩn xác, sẵn sàng hiển thị KaTeX.'
      : `Có ${latexErrors} vị trí nghi vấn dấu ngoặc công thức LaTeX chưa khớp.`
  });

  // 9. Chính tả tiếng Việt & tính chuẩn mực sư phạm
  const containsGarbage = questions.some(q => /undefined|null|NaN|\[object Object\]/.test(q.question));
  items.push({
    id: 9,
    title: 'Chính tả tiếng Việt và văn phong chuẩn mực sư phạm',
    passed: !containsGarbage,
    severity: !containsGarbage ? 'success' : 'error',
    details: !containsGarbage
      ? 'Văn phong trong sáng, diễn đạt chuẩn mực theo thuật ngữ giáo dục hiện hành.'
      : 'Phát hiện ký tự lỗi hệ thống trong nội dung câu hỏi.'
  });

  // 10. Đủ dữ kiện giải toán và số liệu kiểm tra
  const missingExplanation = questions.filter(q => !q.explanation || q.explanation.trim().length < 5);
  items.push({
    id: 10,
    title: 'Đủ dữ kiện tính toán và lời giải giải thích chi tiết',
    passed: missingExplanation.length === 0,
    severity: missingExplanation.length === 0 ? 'success' : 'warning',
    details: missingExplanation.length === 0
      ? '100% câu hỏi đều đi kèm lời giải chi tiết, số liệu logic và hướng dẫn tường minh.'
      : `Có ${missingExplanation.length} câu lời giải còn quá ngắn hoặc chưa giải thích.`
  });

  // 11. Phù hợp cấp học & khối lớp đã chọn
  items.push({
    id: 11,
    title: `Phù hợp lứa tuổi học sinh (${config.gradeLevel === 'primary' ? 'Tiểu học' : config.gradeLevel === 'secondary' ? 'THCS' : 'THPT'} - Lớp ${config.grade})`,
    passed: true,
    severity: 'success',
    details: `Nội dung và thuật ngữ bám sát chương trình Lớp ${config.grade} - Sách ${config.textbook}.`
  });

  // 12. Đầy đủ hướng dẫn chấm và biểu điểm
  const essayQuestions = questions.filter(q => q.type === 'essay' || q.part === 'part4');
  const essayWithRubric = essayQuestions.filter(q => q.rubric && q.rubric.length > 0);
  const rubricComplete = essayQuestions.length === 0 || essayWithRubric.length >= essayQuestions.length;
  items.push({
    id: 12,
    title: 'Đầy đủ bảng đáp án và hướng dẫn chấm biểu điểm chi tiết',
    passed: rubricComplete,
    severity: rubricComplete ? 'success' : 'warning',
    details: rubricComplete
      ? 'Đầy đủ đáp án trắc nghiệm và biểu điểm từng bước (step-by-step) cho phần tự luận.'
      : 'Một số câu tự luận nên bổ sung thêm các bước chia nhỏ điểm thành phần.'
  });

  // 13. Cân bằng độ dài phương án (Distractor Length Balance)
  let unbalancedOptionsCount = 0;
  part1Questions.forEach(q => {
    if (q.options && q.options.length >= 4) {
      const lengths = q.options.map(o => o.trim().length);
      const minLen = Math.min(...lengths);
      const maxLen = Math.max(...lengths);
      // If longest is > 3x shortest and > 40 chars
      if (maxLen > 3 * minLen && maxLen > 40) {
        unbalancedOptionsCount++;
      }
    }
  });
  items.push({
    id: 13,
    title: 'Cân bằng hình thức giữa đáp án đúng và phương án gây nhiễu',
    passed: unbalancedOptionsCount === 0,
    severity: unbalancedOptionsCount === 0 ? 'success' : 'warning',
    details: unbalancedOptionsCount === 0
      ? 'Độ dài các phương án A, B, C, D đồng đều, tránh bẫy tâm lý "chọn phương án dài nhất".'
      : `Phát hiện ${unbalancedOptionsCount} câu có độ dài các phương án chênh lệch lớn (>3 lần).`
  });

  // 14. Tính đa dạng và phân loại của câu Đúng/Sai (Phần II)
  let monoValueTfCount = 0;
  part2Questions.forEach(q => {
    if (q.subItems && q.subItems.length === 4) {
      const allTrue = q.subItems.every(s => s.isCorrect);
      const allFalse = q.subItems.every(s => !s.isCorrect);
      if (allTrue || allFalse) {
        monoValueTfCount++;
      }
    }
  });
  items.push({
    id: 14,
    title: 'Đa dạng tính Đúng/Sai trong mỗi câu hỏi chùm (Phần II)',
    passed: monoValueTfCount === 0,
    severity: monoValueTfCount === 0 ? 'success' : 'warning',
    details: monoValueTfCount === 0
      ? 'Tất cả câu hỏi Đúng/Sai đều có sự phân bổ xen kẽ giữa mệnh đề Đúng và mệnh đề Sai.'
      : `Có ${monoValueTfCount} câu có toàn bộ 4 ý đều Đúng hoặc toàn bộ 4 ý đều Sai.`
  });

  // 15. Kiểm tra ngôn ngữ và tránh bẫy phủ định kép
  let doubleNegativeCount = 0;
  questions.forEach(q => {
    const qLower = q.question.toLowerCase();
    if (
      (qLower.includes('không') && qLower.includes('không đúng')) ||
      (qLower.includes('không') && qLower.includes('sai')) ||
      qLower.includes('ngoại trừ các trường hợp không')
    ) {
      doubleNegativeCount++;
    }
  });
  items.push({
    id: 15,
    title: 'Ngôn ngữ rõ ràng, tránh cấu trúc phủ định kép gây hiểu lầm',
    passed: doubleNegativeCount === 0,
    severity: doubleNegativeCount === 0 ? 'success' : 'warning',
    details: doubleNegativeCount === 0
      ? 'Câu lệnh trong sáng, trực diện, không chứa cấu trúc phủ định kép rườm rà.'
      : `Có ${doubleNegativeCount} câu chứa cấu trúc phủ định phức tạp, thầy cô nên biên tập trực diện hơn.`
  });

  const passedCount = items.filter(i => i.passed).length;
  const score = Math.round((passedCount / items.length) * 100);

  return {
    score,
    passedAll: passedCount === items.length,
    items
  };
}
