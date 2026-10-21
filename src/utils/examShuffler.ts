import { QuestionItem, ShuffledExamCode } from '../types/exam';

/**
 * Smart exam shuffler for generating distinct test codes (e.g. 101, 102, 103, 104)
 * Rules:
 * 1. Only shuffles questions within the same Part/Section.
 * 2. Keeps reading comprehension passages locked together with their questions.
 * 3. Shuffles options A, B, C, D safely (avoids shuffling if contains "Tất cả đều đúng/sai").
 * 4. Automatically recomputes the answer key for each test code.
 */
export function generateShuffledCodes(
  baseQuestions: QuestionItem[],
  count: number = 2,
  customCodes?: string[]
): ShuffledExamCode[] {
  let codes: string[] = [];
  if (customCodes && customCodes.length > 0) {
    codes = customCodes.slice(0, count);
    // If count > customCodes length, fill remaining with auto numbers
    while (codes.length < count) {
      const nextNum = 101 + codes.length;
      codes.push(String(nextNum));
    }
  } else {
    const defaultCodes = ['101', '102', '103', '104', '105', '106', '107', '108'];
    codes = defaultCodes.slice(0, Math.min(count, defaultCodes.length));
    while (codes.length < count) {
      const nextNum = 101 + codes.length;
      codes.push(String(nextNum));
    }
  }

  return codes.map((code, codeIdx) => {
    if (codeIdx === 0) {
      // Code 1: Keep original order
      return {
        code,
        questions: baseQuestions,
        quickAnswers: generateQuickAnswers(baseQuestions),
      };
    }

    // Clone and shuffle
    const shuffledQuestions = shuffleQuestionsSafely(baseQuestions, codeIdx);

    return {
      code,
      questions: shuffledQuestions,
      quickAnswers: generateQuickAnswers(shuffledQuestions),
    };
  });
}

function shuffleQuestionsSafely(questions: QuestionItem[], seed: number): QuestionItem[] {
  // Separate by parts
  const part1 = questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
  const part2 = questions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
  const part3 = questions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
  const part4 = questions.filter((q) => q.part === 'part4' || q.type === 'essay');
  const others = questions.filter(
    (q) => !['part1', 'part2', 'part3', 'part4'].includes(q.part) && !['mcq_single', 'true_false_group', 'short_answer', 'essay'].includes(q.type)
  );

  // Group part1 items that share a passage so they stay together
  const shuffledPart1 = shuffleWithPassageClusters(part1, seed);
  const shuffledPart2 = pseudoShuffle(part2, seed + 1);
  const shuffledPart3 = pseudoShuffle(part3, seed + 2);
  // Keep part4 in order or gentle shuffle so numbering remains clean
  const shuffledPart4 = pseudoShuffle(part4, seed + 3);

  // Now, for each Part 1 question, shuffle options A, B, C, D
  const processedPart1 = shuffledPart1.map((q, idx) => {
    if (!q.options || q.options.length !== 4) return q;

    // Check if options contain "Tất cả đều đúng" or "Cả A và B" -> do not shuffle options
    const hasRelativeOption = q.options.some((opt) =>
      /(tất cả|cả [a-d]|không có|đáp án khác)/i.test(opt)
    );
    if (hasRelativeOption) return q;

    // Identify current correct option index (0: A, 1: B, 2: C, 3: D)
    const originalAnswerLetter = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toUpperCase() : 'A';
    const originalAnswerIdx = ['A', 'B', 'C', 'D'].indexOf(originalAnswerLetter);
    const correctContent = originalAnswerIdx >= 0 ? q.options[originalAnswerIdx] : q.options[0];

    // Seeded shuffle of options
    const optionIndices = [0, 1, 2, 3];
    const permutedIndices = getPermutation(optionIndices, (seed * 7 + idx * 13) % 24);

    const newOptions = permutedIndices.map((i) => q.options![i]);
    const newCorrectIdx = newOptions.indexOf(correctContent);
    const newCorrectLetter = ['A', 'B', 'C', 'D'][newCorrectIdx >= 0 ? newCorrectIdx : 0];

    return {
      ...q,
      options: newOptions,
      correctAnswer: newCorrectLetter,
    };
  });

  return [...processedPart1, ...shuffledPart2, ...shuffledPart3, ...shuffledPart4, ...others];
}

function shuffleWithPassageClusters(questions: QuestionItem[], seed: number): QuestionItem[] {
  // Group questions by passage
  const clusters: QuestionItem[][] = [];
  const visited = new Set<string>();

  questions.forEach((q) => {
    if (visited.has(q.id)) return;

    if (q.passage && q.passage.trim().length > 0) {
      // Find all questions sharing this passage
      const group = questions.filter((item) => item.passage === q.passage);
      group.forEach((item) => visited.add(item.id));
      clusters.push(group);
    } else {
      visited.add(q.id);
      clusters.push([q]);
    }
  });

  // Shuffle clusters
  const shuffledClusters = pseudoShuffle(clusters, seed);
  return shuffledClusters.flat();
}

function pseudoShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(seed + i)) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getPermutation(arr: number[], permIndex: number): number[] {
  const result = [...arr];
  let k = permIndex % 24;
  for (let i = 2; i <= 4; i++) {
    const pos = k % i;
    k = Math.floor(k / i);
    const item = result.splice(pos, 1)[0];
    result.push(item);
  }
  return result;
}

function generateQuickAnswers(questions: QuestionItem[]): Array<{ stt: number; part: string; answer: string }> {
  return questions.map((q, idx) => {
    let ansStr = '';
    if (q.type === 'mcq_single' || q.part === 'part1') {
      ansStr = String(q.correctAnswer || 'A');
    } else if (q.type === 'true_false_group' || q.part === 'part2') {
      if (q.subItems && q.subItems.length === 4) {
        ansStr = q.subItems.map((sub) => `${sub.label}: ${sub.isCorrect ? 'Đ' : 'S'}`).join(' | ');
      } else {
        ansStr = 'Xem HD chấm';
      }
    } else if (q.type === 'short_answer' || q.part === 'part3') {
      ansStr = String(q.correctAnswer || '');
    } else {
      ansStr = 'Xem HD chấm tự luận';
    }

    return {
      stt: idx + 1,
      part: q.part,
      answer: ansStr,
    };
  });
}
