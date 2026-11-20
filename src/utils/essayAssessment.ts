import { CauItem, QuestionItem } from '../types/exam';

export function groupedEssayPositions(plan: CauItem[] = []): CauItem[][] {
  const essays = plan.filter((position) => position.dang === 'TL');
  if (!essays.some((position) => position.y)) return [];
  const groups = new Map<number, CauItem[]>();
  for (const position of essays) {
    const number = position.cauSo ?? 0;
    const group = groups.get(number) ?? [];
    group.push(position);
    groups.set(number, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group.sort((a, b) => (a.y ?? '').localeCompare(b.y ?? '')));
}

const cents = (point: number) => Math.round(point * 100);

export function balanceRubric(question: QuestionItem): void {
  if (!question.rubric?.length) return;
  const total = cents(question.score);
  const count = question.rubric.length;
  const each = Math.floor(total / count);
  const remainder = total % count;
  question.rubric = question.rubric.map((step, index) => ({
    ...step,
    point: (each + (index >= count - remainder ? 1 : 0)) / 100,
  }));
}

export function applyEssayPlan(questions: QuestionItem[], groups: CauItem[][]): void {
  const essays = questions.filter((question) => question.part === 'part4');
  if (essays.length !== groups.length) {
    throw new Error(`Tự luận chưa đúng cấu trúc: cần ${groups.length} câu theo đặc tả, nhận được ${essays.length}.`);
  }
  for (const [index, question] of essays.entries()) {
    const group = groups[index];
    const parts = Array.isArray(question.essayParts) ? question.essayParts : [];
    const number = group[0].cauSo;
    if (parts.length !== group.length || group.some((position) => parts.filter((part) =>
      part?.positionId === position.id && typeof part.question === 'string' && part.question.trim()
      && typeof part.answer === 'string' && part.answer.trim()
    ).length !== 1)) {
      throw new Error(`Tự luận Câu ${number} chưa đúng cấu trúc: cần đủ đề và hướng dẫn chấm cho ý ${group.map((p) => p.y).join('/')}. Vui lòng tạo lại.`);
    }
    const byId = new Map(parts.map((part) => [part.positionId, part]));
    question.essayParts = group.map((position) => byId.get(position.id)!);
    question.question = [
      question.question.trim(),
      ...group.map((position) => `${position.y}) ${byId.get(position.id)!.question.trim()}`),
    ].filter(Boolean).join('\n');
    question.score = group.reduce((sum, position) => sum + cents(position.diem), 0) / 100;
    question.rubric = group.map((position) => ({
      step: position.y!,
      point: position.diem,
      detail: `${position.y}) ${byId.get(position.id)!.answer.trim()}`,
    }));
  }
}

export function essayReleaseError(questions: QuestionItem[], plan?: CauItem[]): string | undefined {
  const groups = groupedEssayPositions(plan);
  const essays = questions.filter((q) => q.part === 'part4' || q.type === 'essay');
  if (groups.length && essays.length !== groups.length) {
    return `Tự luận chưa đủ ${groups.length} câu theo đặc tả.`;
  }
  const remainingGroups = new Map(groups.map((group) => [group[0].id, group]));
  for (const [index, question] of essays.entries()) {
    const prefix = `Tự luận Câu ${index + 1}`;
    const rubric = question.rubric ?? [];
    const positionId = question.essayParts?.[0]?.positionId ?? '';
    const group = remainingGroups.get(positionId);
    const labels = [...question.question.matchAll(/^([a-d])\) \S/gm)].map((match) => match[1]).join('');
    if (groups.length && (!group || rubric.length !== group.length || group.some((p, i) =>
      rubric[i].step !== p.y || cents(rubric[i].point) !== cents(p.diem)
      || !rubric[i].detail.startsWith(`${p.y}) `)
    ) || labels !== group.map((p) => p.y).join(''))) {
      return `${prefix} chưa đúng ý hoặc điểm đã chốt trong đặc tả.`;
    }
    if (group) remainingGroups.delete(positionId);
    if (rubric.length && (rubric.some((step) => !Number.isFinite(step.point) || step.point < 0)
      || rubric.reduce((sum, step) => sum + cents(step.point), 0) !== cents(question.score))) {
      return `${prefix} có tổng điểm hướng dẫn chấm khác điểm ghi trên đề.`;
    }
  }
  return undefined;
}
