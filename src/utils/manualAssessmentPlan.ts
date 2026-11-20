import { inferMucToiDaFromVerb } from '../services/lessonAnalyzer';
import type { CauItem, ChuDeItem, CognitiveLevel, LuatConfig, QuestionType } from '../types/exam';

const levels: Record<string, CognitiveLevel> = {
  'biết': 'Biet', 'nhận biết': 'Biet', 'hiểu': 'Hieu',
  'thông hiểu': 'Hieu', 'vận dụng': 'VanDung',
};

const lines = (text?: string) => (text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const normalize = (text: string) => text.normalize('NFC').toLocaleLowerCase('vi-VN');

export function buildManualAssessmentPlan(
  input: { topicTitle?: string; chapter?: string; learningOutcomes?: string },
  luat: LuatConfig,
): { topics: ChuDeItem[]; positions?: CauItem[] } {
  const titles = lines(input.topicTitle);
  const chapters = lines(input.chapter);
  if (!titles.length || !lines(input.learningOutcomes).length) {
    throw new Error('Nhập tên bài và yêu cầu cần đạt trước khi dựng ma trận.');
  }
  if (new Set(titles.map(normalize)).size !== titles.length) {
    throw new Error('Mỗi bài cần một tên riêng trong danh sách bài.');
  }
  if (chapters.length > 1 && chapters.length !== titles.length) {
    throw new Error('Nhập một chương chung hoặc một dòng chương cho mỗi bài.');
  }

  const topics: ChuDeItem[] = [];
  const units = titles.map((ten, index) => {
    const chapter = chapters[index] || chapters[0] || 'Phạm vi kiểm tra';
    let topic = topics.find((item) => item.ten === chapter);
    if (!topic) {
      topic = { id: `CD${topics.length + 1}`, ten: chapter, noiDung: [] };
      topics.push(topic);
    }
    const unit = { id: `ND${index + 1}`, ten, trongSo: 1, yccd: [] as ChuDeItem['noiDung'][number]['yccd'] };
    topic.noiDung.push(unit);
    return { topic, unit };
  });

  let selected = titles.length === 1 ? units[0] : undefined;
  let level: CognitiveLevel | undefined;
  const positions: CauItem[] = [];
  let outcomesWithoutPosition = 0;
  const ids = new Set<string>();
  const sections: QuestionType[] = luat.tlnCount > 0 ? ['NLC', 'DS', 'TLN', 'TL'] : ['NLC', 'DS', 'TL'];

  for (const raw of lines(input.learningOutcomes)) {
    const header = /^\[(.+)\]$/.exec(raw);
    if (header) {
      selected = units.find(({ unit }) => normalize(unit.ten) === normalize(header[1].trim()));
      if (!selected) throw new Error(`Không tìm thấy bài “${header[1]}” trong danh sách tên bài.`);
      level = undefined;
      continue;
    }

    const content = raw.replace(/^[-–•]\s*/, '');
    const heading = /^(Biết|Nhận biết|Hiểu|Thông hiểu|Vận dụng):$/i.exec(content);
    if (heading) {
      level = levels[normalize(heading[1])];
      continue;
    }
    const prefix = /^\((Biết|Nhận biết|Hiểu|Thông hiểu|Vận dụng)\)\s*/i.exec(content);
    const declaredLevel = prefix ? levels[normalize(prefix[1])] : level;
    const description = prefix ? content.slice(prefix[0].length).trim() : content;
    if (!selected || !description) {
      throw new Error('Ghi yêu cầu dưới tên bài [Tên bài] và mục Biết:, Hiểu: hoặc Vận dụng:.');
    }

    const { topic, unit } = selected;
    const suffix = /\s*\((I{1,3}|IV)\.(\d+)([a-d])?\)\.?$/i.exec(description);
    if (suffix && !declaredLevel) throw new Error('Ghi rõ mức độ cho mỗi yêu cầu đã gắn vị trí câu/ý.');
    const muc = declaredLevel || inferMucToiDaFromVerb('', description);
    const ma = `${unit.id}.${unit.yccd.length + 1}`;
    const noiDung = suffix ? description.slice(0, suffix.index).trim() : description;
    if (!noiDung) throw new Error('Thiếu nội dung yêu cầu cần đạt.');
    unit.yccd.push({ ma, noiDung, mucToiDa: muc });
    if (!suffix) {
      outcomesWithoutPosition++;
      continue;
    }
    const dang = sections[['I', 'II', 'III', 'IV'].indexOf(suffix[1].toUpperCase())];
    const cauSo = Number(suffix[2]);
    const y = suffix[3]?.toLowerCase() as CauItem['y'];
    const needsItem = dang === 'DS' || (dang === 'TL' && luat.tlUnit === 'y');
    if (!dang || !Number.isSafeInteger(cauSo) || cauSo < 1 || needsItem !== !!y) {
      throw new Error(`Vị trí ${suffix[0].trim()} không khớp cấu trúc câu/ý đang chọn.`);
    }
    const id = `${dang}${cauSo}${y ? `_${y}` : ''}`;
    if (ids.has(id)) throw new Error(`Vị trí ${suffix[0].trim()} xuất hiện nhiều lần.`);
    ids.add(id);
    const diem = { NLC: luat.nlcPrice, DS: luat.dsPricePerSub, TLN: luat.tlnPrice, TL: luat.tlPrice }[dang];
    positions.push({ id, noiDungId: unit.id, chuDeId: topic.id, dang, muc, cauSo, y, diem, maYCCD: [ma], nguon: 'Yêu cầu cần đạt do giáo viên nhập' });
  }

  const empty = units.find(({ unit }) => !unit.yccd.length);
  if (empty) throw new Error(`Bài “${empty.unit.ten}” chưa có yêu cầu cần đạt.`);
  if (!positions.length) return { topics };
  if (outcomesWithoutPosition) throw new Error('Khi nhập theo vị trí đã chốt, mỗi yêu cầu cần một vị trí câu/ý.');

  const checkExpected = (expected: string[], types: QuestionType[]) => {
    const actual = positions.filter((position) => types.includes(position.dang));
    if (actual.length !== expected.length || expected.some((id) => !ids.has(id))) {
      throw new Error(`Vị trí ${types.join(', ')} không khớp số lượng hoặc thứ tự câu/ý trong cấu hình.`);
    }
  };
  const numbered = (type: QuestionType, count: number) =>
    Array.from({ length: count }, (_, i) => `${type}${i + 1}`);
  checkExpected(numbered('NLC', luat.nlcCount), ['NLC']);
  checkExpected(numbered('DS', luat.dsCount).flatMap((id) =>
    Array.from('abcd'.slice(0, luat.dsSubItems), (y) => `${id}_${y}`)), ['DS']);
  checkExpected(numbered('TLN', luat.tlnCount), ['TLN']);
  if (luat.tlUnit === 'cau') {
    checkExpected(numbered('TL', luat.tlCount), ['TL']);
  } else {
    const essays = positions.filter((position) => position.dang === 'TL');
    const groups = new Map<number, string[]>();
    for (const item of essays) {
      const number = item.cauSo!;
      groups.set(number, [...(groups.get(number) || []), item.y!]);
    }
    if (essays.length !== luat.tlCount || [...groups.keys()].some((number) => number > groups.size)
      || [...groups.values()].some((items) => items.sort().join('') !== 'abcd'.slice(0, items.length))) {
      throw new Error('Các ý tự luận phải đủ số lượng và liên tục theo từng câu (a, b, …).');
    }
  }
  positions.sort((a, b) => sections.indexOf(a.dang) - sections.indexOf(b.dang)
    || a.cauSo! - b.cauSo! || (a.y || '').localeCompare(b.y || ''));
  return { topics, positions };
}
