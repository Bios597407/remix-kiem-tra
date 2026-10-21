import { QuestionItem, SubStatement, RubricStep } from '../types/exam';

/**
 * Ensures a value is a string. If it's an object/array, stringifies it.
 */
export function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => `- ${safeString(v)}`).join('\n');
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

/**
 * Normalizes a list of questions from raw AI output to strict QuestionItem format.
 * Prevents "Objects are not valid as a React child" and "cannot read map of undefined".
 */
export function normalizeExamQuestions(rawQuestions: any[]): QuestionItem[] {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions.map((q, index) => {
    // 0. Handle Vietnamese Field Aliases (Common when AI is prompted in Vietnamese)
    const questionText = safeString(q.question || q.content || q.cauHoi || q.cau_hoi || q.text || q.prompt || '');
    const optionsRaw = q.options || q.choices || q.luaChon || q.lua_chon || q.answers || q.optionsList || [];
    const answerRaw = q.correctAnswer || q.answer || q.dapAn || q.dap_an || q.key || '';
    const explanationText = safeString(q.explanation || q.giaithich || q.giai_thich || q.huongdan || q.guide || '');
    const levelVal = safeString(q.level || q.mucDo || q.muc_do || q.complexity || 'Nhận biết');
    const topicVal = safeString(q.topic || q.chuDe || q.chu_de || q.knowledge || '');
    const partVal = q.part || q.phan || 'part1';
    const typeVal = q.type || q.loai || 'mcq_single';

    const id = q.id || `q_norm_${Date.now()}_${index}`;
    
    // Normalize Options (ensure array of strings)
    let normalizedOptions: string[] = [];
    if (Array.isArray(optionsRaw)) {
      normalizedOptions = optionsRaw.map(safeString);
    } else if (typeof optionsRaw === 'object' && optionsRaw !== null) {
      // Handle {A: "...", B: "..."}
      normalizedOptions = Object.entries(optionsRaw)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, val]) => `${key}. ${safeString(val)}`);
    }

    // Normalize SubItems (for True/False groups)
    const rawSubItems = q.subItems || q.cacY || q.cac_y || q.statements || [];
    let normalizedSubItems: SubStatement[] = [];
    if (Array.isArray(rawSubItems)) {
      normalizedSubItems = rawSubItems.map((s: any, sIdx: number) => ({
        id: s.id || `sub_${sIdx}`,
        label: (s.label || s.kyHieu || ['a', 'b', 'c', 'd'][sIdx] || 'a') as any,
        statement: safeString(s.statement || s.noiDung || s.text || ''),
        isCorrect: s.isCorrect !== undefined ? !!s.isCorrect : (String(s.answer || s.dapAn).toLowerCase().includes('đ') || String(s.answer || s.dapAn).toLowerCase().includes('t')),
        explanation: safeString(s.explanation || s.giaiThich || '')
      }));
    }

    // Normalize Rubric (for Essays)
    const rawRubric = q.rubric || q.huongDanCham || q.bieuDiem || [];
    let normalizedRubric: RubricStep[] = [];
    if (Array.isArray(rawRubric)) {
      normalizedRubric = rawRubric.map((r: any, rIdx: number) => ({
        step: safeString(r.step || r.buoc || `Bước ${rIdx + 1}`),
        point: Number(r.point || r.diem) || 0,
        detail: safeString(r.detail || r.noiDung || r.text || '')
      }));
    }

    return {
      ...q,
      id,
      part: (['part1', 'part2', 'part3', 'part4'].includes(partVal) ? partVal : 'part1') as any,
      type: typeVal,
      level: levelVal,
      topic: topicVal,
      question: questionText,
      options: normalizedOptions,
      subItems: normalizedSubItems.length > 0 ? normalizedSubItems : undefined,
      correctAnswer: typeof answerRaw === 'object' ? safeString(answerRaw) : safeString(answerRaw),
      explanation: explanationText,
      rubric: normalizedRubric.length > 0 ? normalizedRubric : undefined,
      score: Number(q.score || q.diem) || 0.25,
      distractorAnalysis: typeof q.distractorAnalysis === 'object' ? q.distractorAnalysis : undefined
    };
  });
}
