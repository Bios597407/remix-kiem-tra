import { QuestionItem, ExamConfig, ExamMatrix } from '../types/exam';

export interface PoolCellCoverage {
  chapter: string;
  topic: string;
  level: string; // 'Biết' | 'Hiểu' | 'Vận dụng'
  format: 'mcq' | 'true_false' | 'short' | 'essay';
  availableCount: number;
  requiredCount: number;
  isCovered: boolean;
}

export interface QuestionPoolAuditReport {
  totalQuestionsInPool: number;
  coveredCells: number;
  totalRequiredCells: number;
  coveragePercentage: number;
  cells: PoolCellCoverage[];
  hasDeficit: boolean;
  deficitCount: number;
}

/**
 * Chuẩn hóa mức độ nhận thức về 3 mức chuẩn của Công văn 7991 & Thông tư 22
 */
export function normalizeLevelCV7991(levelStr: string): 'Biết' | 'Hiểu' | 'Vận dụng' {
  const lower = (levelStr || '').toLowerCase();
  if (lower.includes('nhận biết') || lower.includes('biết') || lower.includes('mức 1')) {
    return 'Biết';
  }
  if (lower.includes('thông hiểu') || lower.includes('hiểu') || lower.includes('mức 2')) {
    return 'Hiểu';
  }
  return 'Vận dụng';
}

/**
 * Chuẩn hóa dạng thức câu hỏi
 */
export function normalizeFormatCV7991(item: QuestionItem): 'mcq' | 'true_false' | 'short' | 'essay' {
  if (item.part === 'part1' || item.type === 'mcq_single') return 'mcq';
  if (item.part === 'part2' || item.type === 'true_false_group') return 'true_false';
  if (item.part === 'part3' || item.type === 'short_answer') return 'short';
  return 'essay';
}

/**
 * BƯỚC 1: Quét và phân loại cơ sở dữ liệu câu hỏi hiện có (Question Pool Indexing)
 * và đối soát độ phủ (Coverage Audit) so với ma trận đề kiểm tra
 */
export function auditQuestionPoolCoverage(
  pool: QuestionItem[],
  matrix: ExamMatrix,
  config: ExamConfig
): QuestionPoolAuditReport {
  const cells: PoolCellCoverage[] = [];

  // Group pool items by composite key
  const poolCounts: Record<string, number> = {};
  pool.forEach((q) => {
    const lvl = normalizeLevelCV7991(q.level);
    const fmt = normalizeFormatCV7991(q);
    const top = (q.topic || config.topicTitle || 'Chủ đề chung').trim().toLowerCase();
    const key = `${top}___${lvl}___${fmt}`;
    poolCounts[key] = (poolCounts[key] || 0) + 1;
  });

  let coveredCount = 0;
  let totalRequiredCount = 0;
  let deficitCount = 0;

  // Scan through matrix rows
  matrix.rows.forEach((row) => {
    const topicNorm = (row.topic || config.topicTitle || 'Chủ đề chung').trim().toLowerCase();
    const chapterName = row.chapter || 'Chương I';
    const topicName = row.topic || 'Chủ đề 1';

    // Levels to check
    const levels: Array<'Biết' | 'Hiểu' | 'Vận dụng'> = ['Biết', 'Hiểu', 'Vận dụng'];

    levels.forEach((lvl) => {
      // 1. MCQ Single
      const p1Val = getMatrixVal(row.part1?.[lvl]);
      if (p1Val > 0) {
        totalRequiredCount++;
        const key = `${topicNorm}___${lvl}___mcq`;
        const avail = poolCounts[key] || 0;
        const isOk = avail >= p1Val;
        if (isOk) coveredCount++;
        else deficitCount += p1Val - avail;

        cells.push({
          chapter: chapterName,
          topic: topicName,
          level: lvl,
          format: 'mcq',
          availableCount: avail,
          requiredCount: p1Val,
          isCovered: isOk,
        });
      }

      // 2. True / False
      const p2Val = getMatrixVal(row.part2?.[lvl]);
      if (p2Val > 0) {
        totalRequiredCount++;
        const key = `${topicNorm}___${lvl}___true_false`;
        const avail = poolCounts[key] || 0;
        const isOk = avail >= p2Val;
        if (isOk) coveredCount++;
        else deficitCount += p2Val - avail;

        cells.push({
          chapter: chapterName,
          topic: topicName,
          level: lvl,
          format: 'true_false',
          availableCount: avail,
          requiredCount: p2Val,
          isCovered: isOk,
        });
      }

      // 3. Short Answer
      const p3Val = getMatrixVal(row.part3?.[lvl]);
      if (p3Val > 0) {
        totalRequiredCount++;
        const key = `${topicNorm}___${lvl}___short`;
        const avail = poolCounts[key] || 0;
        const isOk = avail >= p3Val;
        if (isOk) coveredCount++;
        else deficitCount += p3Val - avail;

        cells.push({
          chapter: chapterName,
          topic: topicName,
          level: lvl,
          format: 'short',
          availableCount: avail,
          requiredCount: p3Val,
          isCovered: isOk,
        });
      }

      // 4. Essay
      const p4Val = getMatrixVal(row.part4?.[lvl]);
      if (p4Val > 0) {
        totalRequiredCount++;
        const key = `${topicNorm}___${lvl}___essay`;
        const avail = poolCounts[key] || 0;
        const isOk = avail >= p4Val;
        if (isOk) coveredCount++;
        else deficitCount += p4Val - avail;

        cells.push({
          chapter: chapterName,
          topic: topicName,
          level: lvl,
          format: 'essay',
          availableCount: avail,
          requiredCount: p4Val,
          isCovered: isOk,
        });
      }
    });
  });

  const pct =
    totalRequiredCount > 0 ? Math.round((coveredCount / totalRequiredCount) * 100) : 100;

  return {
    totalQuestionsInPool: pool.length,
    coveredCells: coveredCount,
    totalRequiredCells: totalRequiredCount,
    coveragePercentage: pct,
    cells,
    hasDeficit: deficitCount > 0,
    deficitCount,
  };
}

function getMatrixVal(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val.count !== undefined) return Number(val.count) || 0;
  return 0;
}
