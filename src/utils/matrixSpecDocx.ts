import {
  AlignmentType, Document, Packer, PageOrientation, Paragraph, Table, TableCell, TableRow,
  TextRun, WidthType,
} from 'docx';
import type { CauItem, ChuDeItem, ExamConfig, LuatConfig } from '../types/exam';
import { getUnifiedMatrixSpecData } from './cv7991Engine';

const levels = ['Biet', 'Hieu', 'VanDung'] as const;
const levelLabels = ['Biết', 'Hiểu', 'Vận dụng'];
const typeLabels = { NLC: 'Nhiều lựa chọn', DS: 'Đúng/Sai', TLN: 'Trả lời ngắn', TL: 'Tự luận' };
const score = (value: number) => value.toFixed(2).replace('.', ',');
const tableWidth = 15300;

function cell(text: string, width: number, options: { header?: boolean; span?: number; alignLeft?: boolean } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: options.span,
    shading: options.header ? { fill: 'E2E8F0' } : undefined,
    children: text.split('\n').map((line) => new Paragraph({
      alignment: options.alignLeft ? AlignmentType.LEFT : AlignmentType.CENTER,
      spacing: { after: 45 },
      children: [new TextRun({ text: line, bold: options.header, size: 19 })],
    })),
  });
}

export async function exportMatrixSpecDocx(
  config: ExamConfig, topics: ChuDeItem[], positions: CauItem[], luat: LuatConfig,
) {
  const data = getUnifiedMatrixSpecData(topics, positions, luat);
  const types = data.showTln ? ['NLC', 'DS', 'TLN', 'TL'] as const : ['NLC', 'DS', 'TL'] as const;
  const essayCount = new Set(positions.filter((c) => c.dang === 'TL').map((c) => c.cauSo)).size;
  const essayText = luat.tlUnit === 'y' ? `${essayCount} câu (${data.typeGrandTotals.TL.count} ý)` : `${essayCount} câu`;
  const dsCount = new Set(positions.filter((c) => c.dang === 'DS').map((c) => c.cauSo)).size;

  const buildTable = (specification: boolean) => {
    const fixedWidths = specification ? [1700, 2350, 5400] : [2200, 2900];
    const headings = specification ? ['Chương', 'Nội dung', 'Yêu cầu cần đạt'] : ['Chương', 'Nội dung'];
    const tailWidths = specification ? [] : [730, 730, 730, 875];
    const tailLabels = specification ? [] : [...levelLabels, 'Tỉ lệ điểm'];
    const qWidth = Math.floor((tableWidth - [...fixedWidths, ...tailWidths].reduce((sum, width) => sum + width, 0)) / (types.length * 3));
    const header = { header: true };
    const headers = [
      new TableRow({ tableHeader: true, children: [
        ...headings.map((label, index) => cell(label, fixedWidths[index], header)),
        ...types.map((type) => cell(typeLabels[type], qWidth * 3, { ...header, span: 3 })),
        ...tailLabels.map((label, index) => cell(label, tailWidths[index], header)),
      ] }),
      new TableRow({ tableHeader: true, children: [
        ...fixedWidths.map((width) => cell('', width, header)),
        ...types.flatMap(() => levelLabels.map((label) => cell(label, qWidth, header))),
        ...tailWidths.map((width) => cell('', width, header)),
      ] }),
    ];
    const content = data.rows.map((row) => new TableRow({ children: [
      cell(row.chuDeTen, fixedWidths[0], { alignLeft: true }),
      cell(row.noiDungTen, fixedWidths[1], { alignLeft: true }),
      ...(specification ? [cell(levels.flatMap((level, index) => {
        const outcomes = row.yccdByLevel[level];
        return outcomes.length ? [levelLabels[index] + ':', ...outcomes.map((outcome) => '• ' + outcome.noiDung)] : [];
      }).join('\n'), fixedWidths[2], { alignLeft: true })] : []),
      ...types.flatMap((type) => levels.map((level) => {
        const value = row.matrixCells[type][level];
        return cell(value.count ? `${value.count}\n${value.questionNumbersStr}\n${score(value.score)} đ` : '0', qWidth);
      })),
      ...(specification ? [] : [
        ...levels.map((level, index) => cell(score(types.reduce((sum, type) => sum + row.matrixCells[type][level].score, 0)), tailWidths[index])),
        cell(score(row.rowPercentScore) + '%', tailWidths[3]),
      ]),
    ] }));
    return new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [...fixedWidths, ...types.flatMap(() => [qWidth, qWidth, qWidth]), ...tailWidths],
      rows: [...headers, ...content],
    });
  };
  const title = (text: string, pageBreakBefore = false) =>
    new Paragraph({ pageBreakBefore, spacing: { after: 180 }, children: [new TextRun({ text, bold: true, size: 32 })] });
  const paragraph = (text: string) => new Paragraph({ text, spacing: { after: 120 } });
  const context = `${config.subject} ${config.grade} • ${config.examTitle} • ${config.textbook} • ${config.durationMinutes} phút`;
  const totals = `${data.typeGrandTotals.NLC.count} câu nhiều lựa chọn • ${dsCount} câu Đúng/Sai (${data.typeGrandTotals.DS.count} ý) • ${data.typeGrandTotals.TLN.count} trả lời ngắn • Tự luận ${essayText} • ${data.grandTotalCount} đơn vị đánh giá.`;
  const points = `Tổng ${score(data.grandTotalScore)} điểm • ${levels.map((level, i) => levelLabels[i] + ' ' + score(data.levelGrandTotals[level].score)).join(' • ')}`;
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 } } } },
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE, width: 11906, height: 16838 }, margin: { top: 750, bottom: 750, left: 750, right: 750 } } },
      children: [
        title('A. MA TRẬN ĐỀ KIỂM TRA'), paragraph(context), paragraph(totals), paragraph(points), buildTable(false),
        title('B. BẢN ĐẶC TẢ ĐỀ KIỂM TRA', true), paragraph(context), paragraph(totals), paragraph(points), buildTable(true),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: `Ma_tran_va_dac_ta_Lop_${config.grade}.docx` });
  try {
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
