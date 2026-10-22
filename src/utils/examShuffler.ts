import {
  QuestionItem,
  ShuffledExamCode,
  ShuffleOptions,
  MasterComparisonMatrix,
  MasterComparisonRow,
  ExamCodeMappingItem,
} from '../types/exam';

export const DEFAULT_SHUFFLE_OPTIONS: ShuffleOptions = {
  variantCount: 4,
  namingPreset: '101',
  shufflePart1Questions: true,
  shufflePart1Options: true,
  shufflePart2Questions: true,
  shufflePart2SubItems: false,
  shufflePart3Questions: true,
  shufflePart4Questions: false,
  lockPassageClusters: true,
  preserveAnchoredOptions: true,
};

/**
 * Generate code names based on chosen naming preset and grade
 */
export function generateVariantCodeList(
  count: number,
  preset: ShuffleOptions['namingPreset'],
  grade?: string,
  customList?: string[]
): string[] {
  if (preset === 'custom' && customList && customList.length > 0) {
    const list = customList.map((s) => s.trim()).filter(Boolean);
    while (list.length < count) {
      list.push(`Mã ${list.length + 1}`);
    }
    return list.slice(0, count);
  }

  if (preset === 'even_odd') {
    const evenOdd = ['Đề Chẵn', 'Đề Lẻ', 'Đề Chẵn 2', 'Đề Lẻ 2', 'Đề 1', 'Đề 2', 'Đề 3', 'Đề 4'];
    return evenOdd.slice(0, count);
  }

  if (preset === 'alpha') {
    const alphas = ['Mã A', 'Mã B', 'Mã C', 'Mã D', 'Mã E', 'Mã F', 'Mã G', 'Mã H'];
    return alphas.slice(0, count);
  }

  if (preset === 'random3') {
    // Non-overlapping distinct 3-digit codes commonly used in high-stakes testing
    const randomPool = ['132', '209', '357', '481', '524', '618', '743', '869', '915', '248'];
    return randomPool.slice(0, count);
  }

  if (preset === 'grade_prefix') {
    // Grade 12 -> 121, 122, 123...; Grade 11 -> 111, 112...; Grade 10 -> 101, 102...
    const gNum = parseInt(grade || '12', 10);
    const prefix = !isNaN(gNum) && gNum >= 6 && gNum <= 12 ? gNum * 10 : 100;
    return Array.from({ length: count }, (_, i) => String(prefix + (i + 1)));
  }

  // Default: '101' -> 101, 102, 103, 104...
  return Array.from({ length: count }, (_, i) => String(101 + i));
}

/**
 * Smart exam shuffler for generating distinct test codes (e.g. 101, 102, 103, 104)
 * Strict adherence to Ministry of Education & Training (CV 7991) guidelines:
 * 1. Shuffles only within the respective Part/Section to preserve matrix balance.
 * 2. Locks reading comprehension passages together with their respective questions.
 * 3. Shuffles options A, B, C, D safely; detects anchors ("Tất cả", "Cả A và B") to prevent semantic breakage.
 * 4. Automatically recomputes exact answer keys, sub-statement states, and produces mapping metadata.
 */
export function generateShuffledCodes(
  baseQuestions: QuestionItem[],
  options: Partial<ShuffleOptions> = {},
  grade?: string
): ShuffledExamCode[] {
  if (!baseQuestions || baseQuestions.length === 0) return [];

  const opts: ShuffleOptions = { ...DEFAULT_SHUFFLE_OPTIONS, ...options };
  const codes = generateVariantCodeList(opts.variantCount, opts.namingPreset, grade, opts.customCodeList);

  return codes.map((code, codeIdx) => {
    if (codeIdx === 0) {
      // Code 0: The Base Exam (Master code 101)
      const baseQuickAnswers = generateQuickAnswers(baseQuestions);
      const baseMapping: ExamCodeMappingItem[] = baseQuestions.map((q, idx) => ({
        newIndex: idx + 1,
        baseIndex: idx + 1,
        questionId: q.id || `q_${idx}`,
        part: q.part,
        newCorrectAnswer: formatAnswerToString(q),
        baseCorrectAnswer: formatAnswerToString(q),
      }));

      return {
        code,
        title: `Mã ${code} (Gốc)`,
        isBase: true,
        questions: baseQuestions,
        quickAnswers: baseQuickAnswers,
        mappingFromBase: baseMapping,
      };
    }

    // Seeded deterministic shuffle
    const seed = (codeIdx + 1) * 7919;
    const shuffledQuestions = shuffleQuestionsSafely(baseQuestions, seed, opts);
    const quickAnswers = generateQuickAnswers(shuffledQuestions, baseQuestions);
    const mappingFromBase = buildMappingFromBase(baseQuestions, shuffledQuestions);

    return {
      code,
      title: `Mã ${code}`,
      isBase: false,
      questions: shuffledQuestions,
      quickAnswers,
      mappingFromBase,
    };
  });
}

/**
 * Safely shuffle questions complying with CV 7991
 */
function shuffleQuestionsSafely(
  questions: QuestionItem[],
  seed: number,
  opts: ShuffleOptions
): QuestionItem[] {
  // Separate into parts according to CV 7991
  const part1 = questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
  const part2 = questions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
  const part3 = questions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
  const part4 = questions.filter((q) => q.part === 'part4' || q.type === 'essay');
  const others = questions.filter(
    (q) =>
      !['part1', 'part2', 'part3', 'part4'].includes(q.part) &&
      !['mcq_single', 'true_false_group', 'short_answer', 'essay'].includes(q.type)
  );

  // 1. Part 1 (Nhiều lựa chọn)
  let processedPart1 = [...part1];
  if (opts.shufflePart1Questions) {
    if (opts.lockPassageClusters) {
      processedPart1 = shuffleWithPassageClusters(processedPart1, seed);
    } else {
      processedPart1 = pseudoShuffle(processedPart1, seed);
    }
  }

  // Shuffle options A, B, C, D of Part 1
  if (opts.shufflePart1Options) {
    processedPart1 = processedPart1.map((q, idx) => {
      if (!q.options || q.options.length !== 4) return q;

      // Check if options contain relative references
      if (opts.preserveAnchoredOptions) {
        const hasRelativeOption = q.options.some((opt) =>
          /(tất cả|cả [a-d]|không có|đáp án khác|cả hai|hai ý trên|các đáp án trên)/i.test(opt)
        );
        if (hasRelativeOption) return q;
      }

      // Identify original correct option index (0: A, 1: B, 2: C, 3: D)
      const originalAnswerLetter = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim().toUpperCase() : 'A';
      const originalAnswerIdx = ['A', 'B', 'C', 'D'].indexOf(originalAnswerLetter);
      const correctContent = originalAnswerIdx >= 0 ? q.options[originalAnswerIdx] : q.options[0];

      // Seeded permutation
      const optionIndices = [0, 1, 2, 3];
      const permutedIndices = getPermutation(optionIndices, (seed * 11 + idx * 17) % 24);

      const newOptions = permutedIndices.map((i) => q.options![i]);
      const newCorrectIdx = newOptions.indexOf(correctContent);
      const newCorrectLetter = ['A', 'B', 'C', 'D'][newCorrectIdx >= 0 ? newCorrectIdx : 0];

      return {
        ...q,
        options: newOptions,
        correctAnswer: newCorrectLetter,
      };
    });
  }

  // 2. Part 2 (Đúng - Sai)
  let processedPart2 = [...part2];
  if (opts.shufflePart2Questions) {
    processedPart2 = pseudoShuffle(processedPart2, seed + 101);
  }
  if (opts.shufflePart2SubItems) {
    processedPart2 = processedPart2.map((q, idx) => {
      if (!q.subItems || q.subItems.length !== 4) return q;
      const perm = getPermutation([0, 1, 2, 3], (seed + idx * 5) % 24);
      const labels: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
      const newSubItems = perm.map((pi, li) => ({
        ...q.subItems![pi],
        label: labels[li],
      }));
      return {
        ...q,
        subItems: newSubItems,
      };
    });
  }

  // 3. Part 3 (Trả lời ngắn)
  let processedPart3 = [...part3];
  if (opts.shufflePart3Questions) {
    processedPart3 = pseudoShuffle(processedPart3, seed + 202);
  }

  // 4. Part 4 (Tự luận)
  let processedPart4 = [...part4];
  if (opts.shufflePart4Questions) {
    processedPart4 = pseudoShuffle(processedPart4, seed + 303);
  }

  return [...processedPart1, ...processedPart2, ...processedPart3, ...processedPart4, ...others];
}

/**
 * Cluster questions sharing the exact same passage text so they stay adjacent
 */
function shuffleWithPassageClusters(questions: QuestionItem[], seed: number): QuestionItem[] {
  const clusters: QuestionItem[][] = [];
  const visited = new Set<string>();

  questions.forEach((q) => {
    if (visited.has(q.id)) return;

    if (q.passage && q.passage.trim().length > 0) {
      const group = questions.filter((item) => item.passage === q.passage);
      group.forEach((item) => visited.add(item.id));
      clusters.push(group);
    } else {
      visited.add(q.id);
      clusters.push([q]);
    }
  });

  const shuffledClusters = pseudoShuffle(clusters, seed);
  return shuffledClusters.flat();
}

/**
 * Deterministic PRNG-based Fisher-Yates shuffle
 */
function pseudoShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(seed + i * 19.37)) * (i + 1)) % (i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Return a deterministic permutation of 4 elements from index 0..23
 */
function getPermutation(arr: number[], permIndex: number): number[] {
  const result = [...arr];
  let k = Math.abs(permIndex) % 24;
  for (let i = 2; i <= 4; i++) {
    const pos = k % i;
    k = Math.floor(k / i);
    const item = result.splice(pos, 1)[0];
    result.push(item);
  }
  return result;
}

/**
 * Formats question answer to clean readable string
 */
export function formatAnswerToString(q: QuestionItem): string {
  if (q.type === 'mcq_single' || q.part === 'part1') {
    return String(q.correctAnswer || 'A').trim().toUpperCase();
  }
  if (q.type === 'true_false_group' || q.part === 'part2') {
    if (q.subItems && q.subItems.length > 0) {
      return q.subItems.map((sub) => `${sub.label}: ${sub.isCorrect ? 'Đ' : 'S'}`).join(' | ');
    }
    return 'Xem HD chấm';
  }
  if (q.type === 'short_answer' || q.part === 'part3') {
    return String(q.correctAnswer || '').trim();
  }
  return 'Tự luận (Xem HD chấm)';
}

/**
 * Generate quick answer list for grading
 */
function generateQuickAnswers(
  questions: QuestionItem[],
  baseQuestions?: QuestionItem[]
): Array<{ stt: number; part: string; answer: string; originalStt: number; questionId?: string }> {
  return questions.map((q, idx) => {
    let originalStt = idx + 1;
    if (baseQuestions) {
      const foundIdx = baseQuestions.findIndex((bq) => bq.id === q.id);
      if (foundIdx !== -1) {
        originalStt = foundIdx + 1;
      }
    }

    return {
      stt: idx + 1,
      part: q.part,
      answer: formatAnswerToString(q),
      originalStt,
      questionId: q.id,
    };
  });
}

/**
 * Build mapping from base exam to current variant
 */
function buildMappingFromBase(
  baseQuestions: QuestionItem[],
  variantQuestions: QuestionItem[]
): ExamCodeMappingItem[] {
  return variantQuestions.map((vq, vIdx) => {
    const baseIdx = baseQuestions.findIndex((bq) => bq.id === vq.id);
    const bq = baseIdx >= 0 ? baseQuestions[baseIdx] : vq;

    return {
      newIndex: vIdx + 1,
      baseIndex: baseIdx >= 0 ? baseIdx + 1 : vIdx + 1,
      questionId: vq.id,
      part: vq.part,
      newCorrectAnswer: formatAnswerToString(vq),
      baseCorrectAnswer: formatAnswerToString(bq),
    };
  });
}

/**
 * Generate Master Comparison Matrix across all generated codes
 * Enables teachers to see side-by-side:
 * Câu số (Base 101) | Nội dung tóm tắt | Mã 101 | Mã 102 | Mã 103 | Mã 104
 */
export function generateMasterComparisonMatrix(
  shuffledCodes: ShuffledExamCode[]
): MasterComparisonMatrix {
  if (!shuffledCodes || shuffledCodes.length === 0) {
    return { codes: [], rows: [] };
  }

  const baseCode = shuffledCodes[0];
  const codes = shuffledCodes.map((c) => c.code);

  const rows: MasterComparisonRow[] = baseCode.questions.map((baseQ, baseIdx) => {
    const baseStt = baseIdx + 1;
    const baseAnswer = formatAnswerToString(baseQ);

    const variants: Record<string, { stt: number; answer: string }> = {};

    shuffledCodes.forEach((variant) => {
      const foundIdx = variant.questions.findIndex((q) => q.id === baseQ.id);
      if (foundIdx >= 0) {
        const vq = variant.questions[foundIdx];
        variants[variant.code] = {
          stt: foundIdx + 1,
          answer: formatAnswerToString(vq),
        };
      } else {
        variants[variant.code] = {
          stt: baseStt,
          answer: baseAnswer,
        };
      }
    });

    let partTitle = 'Phần I: Trắc nghiệm Nhiều Lựa Chọn';
    if (baseQ.part === 'part2' || baseQ.type === 'true_false_group') {
      partTitle = 'Phần II: Trắc nghiệm Đúng/Sai';
    } else if (baseQ.part === 'part3' || baseQ.type === 'short_answer') {
      partTitle = 'Phần III: Trắc nghiệm Trả Lời Ngắn';
    } else if (baseQ.part === 'part4' || baseQ.type === 'essay') {
      partTitle = 'Phần IV: Tự Luận';
    }

    // Clean preview
    const cleanPreview = baseQ.question
      ? baseQ.question.replace(/\$+/g, '').replace(/\s+/g, ' ').slice(0, 75) + (baseQ.question.length > 75 ? '...' : '')
      : `Câu ${baseStt}`;

    return {
      baseStt,
      questionId: baseQ.id,
      part: baseQ.part,
      partTitle,
      questionPreview: cleanPreview,
      score: baseQ.score || 0.25,
      baseAnswer,
      variants,
    };
  });

  return { codes, rows };
}
