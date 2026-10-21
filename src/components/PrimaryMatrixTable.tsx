import React from 'react';
import { ExamMatrix, ExamConfig } from '../types/exam';

interface PrimaryMatrixTableProps {
  matrix: ExamMatrix;
  config: ExamConfig;
  className?: string;
}

export const PrimaryMatrixTable: React.FC<PrimaryMatrixTableProps> = ({
  matrix,
  config,
  className = '',
}) => {
  const rows = matrix.rows || [];
  const totalScoreGoal = config.totalScore || 10;

  // Primary school levels: Mức 1, Mức 2, Mức 3
  // Each row has part1 (TNKQ), part2/part3/part4 (Tự luận / Trả lời ngắn)
  const parseCount = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'object' && typeof val.count === 'number') return val.count;
    return 0;
  };

  // Helper to extract TN (MCQ) and TL (Essay/Short Answer) for a given row and level
  const getRowLevelData = (row: any, lvlKeyword: string) => {
    const findPartVal = (part: any) => {
      if (!part) return 0;
      const key = Object.keys(part).find((k) =>
        k.toLowerCase().includes(lvlKeyword.toLowerCase())
      );
      return key ? parseCount(part[key]) : 0;
    };

    const tnCount = findPartVal(row.part1);
    const tlCount =
      findPartVal(row.part2) + findPartVal(row.part3) + findPartVal(row.part4);

    // Primary score calculation: TN = 0.5đ/câu hoặc 1.0đ/câu; TL = 1.0đ hoặc 1.5đ/câu
    // We compute proportional score
    return { tnCount, tlCount };
  };

  // Grand totals accumulator
  const totals = {
    m1: { tn: 0, tl: 0, score: 0 },
    m2: { tn: 0, tl: 0, score: 0 },
    m3: { tn: 0, tl: 0, score: 0 },
    grandTN: 0,
    grandTL: 0,
    grandScore: 0,
  };

  const calculatedRows = rows.map((r, idx) => {
    const m1 = getRowLevelData(r, '1');
    const m2 = getRowLevelData(r, '2');
    const m3 = getRowLevelData(r, '3');

    // Fallback if levels are labeled 'Biết', 'Hiểu', 'Vận dụng'
    const m1Data =
      m1.tnCount + m1.tlCount > 0 ? m1 : getRowLevelData(r, 'biết');
    const m2Data =
      m2.tnCount + m2.tlCount > 0 ? m2 : getRowLevelData(r, 'hiểu');
    const m3Data =
      m3.tnCount + m3.tlCount > 0 ? m3 : getRowLevelData(r, 'vận dụng');

    // Primary scoring heuristic: TN ~ 0.5đ, TL ~ 1.0đ - 1.5đ
    const m1Score = Number((m1Data.tnCount * 0.5 + m1Data.tlCount * 1.0).toFixed(1));
    const m2Score = Number((m2Data.tnCount * 0.5 + m2Data.tlCount * 1.0).toFixed(1));
    const m3Score = Number((m3Data.tnCount * 0.5 + m3Data.tlCount * 1.5).toFixed(1));

    const rowTotalTN = m1Data.tnCount + m2Data.tnCount + m3Data.tnCount;
    const rowTotalTL = m1Data.tlCount + m2Data.tlCount + m3Data.tlCount;
    const rowTotalScore = Number((m1Score + m2Score + m3Score).toFixed(1));
    const rowPercent = Math.round((rowTotalScore / totalScoreGoal) * 100);

    totals.m1.tn += m1Data.tnCount;
    totals.m1.tl += m1Data.tlCount;
    totals.m1.score += m1Score;

    totals.m2.tn += m2Data.tnCount;
    totals.m2.tl += m2Data.tlCount;
    totals.m2.score += m2Score;

    totals.m3.tn += m3Data.tnCount;
    totals.m3.tl += m3Data.tlCount;
    totals.m3.score += m3Score;

    totals.grandTN += rowTotalTN;
    totals.grandTL += rowTotalTL;
    totals.grandScore += rowTotalScore;

    return {
      stt: idx + 1,
      topic: r.topic || `Mạch kiến thức ${idx + 1}`,
      subTopic: r.subTopic || '',
      m1: { ...m1Data, score: m1Score },
      m2: { ...m2Data, score: m2Score },
      m3: { ...m3Data, score: m3Score },
      rowTotalTN,
      rowTotalTL,
      rowTotalScore,
      rowPercent,
    };
  });

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Title block */}
      <div className="text-center font-serif mb-4 leading-tight">
        <h4 className="font-bold text-xs uppercase tracking-wide">
          BẢNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ CẤP TIỂU HỌC
        </h4>
        <p className="text-[11px] italic text-slate-700">
          (Theo Thông tư số 27/2020/TT-BGDĐT ngày 04/9/2020 của Bộ Giáo dục và Đào tạo)
        </p>
        <p className="text-[11px] font-semibold text-slate-800 mt-1">
          Môn: {config.customSubject || config.subject} – Lớp {config.grade} – {config.examTitle}
        </p>
      </div>

      <table className="w-full text-xs border-collapse border border-black text-center font-serif leading-snug">
        <thead>
          {/* Header Row 1 */}
          <tr className="bg-slate-100 font-bold">
            <th rowSpan={2} className="border border-black p-1.5 w-10">
              TT
            </th>
            <th rowSpan={2} className="border border-black p-1.5 min-w-[200px] text-left">
              Mạch kiến thức, kĩ năng
            </th>
            <th colSpan={3} className="border border-black p-1.5 bg-sky-50 text-sky-950">
              Mức 1 (Nhận biết)
            </th>
            <th colSpan={3} className="border border-black p-1.5 bg-emerald-50 text-emerald-950">
              Mức 2 (Thông hiểu)
            </th>
            <th colSpan={3} className="border border-black p-1.5 bg-purple-50 text-purple-950">
              Mức 3 (Vận dụng)
            </th>
            <th colSpan={3} className="border border-black p-1.5 bg-slate-200 text-slate-900">
              Tổng cộng
            </th>
            <th rowSpan={2} className="border border-black p-1.5 w-16">
              Tỉ lệ %
            </th>
          </tr>

          {/* Header Row 2 */}
          <tr className="bg-slate-100 font-bold text-[10.5px]">
            {/* Mức 1 */}
            <th className="border border-black p-1 w-12">TN</th>
            <th className="border border-black p-1 w-12">TL</th>
            <th className="border border-black p-1 w-12 bg-sky-100/60">Điểm</th>

            {/* Mức 2 */}
            <th className="border border-black p-1 w-12">TN</th>
            <th className="border border-black p-1 w-12">TL</th>
            <th className="border border-black p-1 w-12 bg-emerald-100/60">Điểm</th>

            {/* Mức 3 */}
            <th className="border border-black p-1 w-12">TN</th>
            <th className="border border-black p-1 w-12">TL</th>
            <th className="border border-black p-1 w-12 bg-purple-100/60">Điểm</th>

            {/* Tổng cộng */}
            <th className="border border-black p-1 w-12">Số TN</th>
            <th className="border border-black p-1 w-12">Số TL</th>
            <th className="border border-black p-1 w-12 bg-slate-300/70">Tổng</th>
          </tr>
        </thead>

        <tbody>
          {calculatedRows.map((row) => (
            <tr key={row.stt} className="hover:bg-slate-50">
              <td className="border border-black p-1.5 font-bold text-center">{row.stt}</td>
              <td className="border border-black p-1.5 text-left font-medium text-slate-900">
                {row.topic}
                {row.subTopic && (
                  <span className="block text-[10px] text-slate-500 italic font-normal">
                    {row.subTopic}
                  </span>
                )}
              </td>

              {/* Mức 1 */}
              <td className="border border-black p-1">{row.m1.tnCount || '-'}</td>
              <td className="border border-black p-1">{row.m1.tlCount || '-'}</td>
              <td className="border border-black p-1 font-bold bg-sky-50/40 text-sky-900">
                {row.m1.score > 0 ? `${row.m1.score.toFixed(1)}` : '-'}
              </td>

              {/* Mức 2 */}
              <td className="border border-black p-1">{row.m2.tnCount || '-'}</td>
              <td className="border border-black p-1">{row.m2.tlCount || '-'}</td>
              <td className="border border-black p-1 font-bold bg-emerald-50/40 text-emerald-900">
                {row.m2.score > 0 ? `${row.m2.score.toFixed(1)}` : '-'}
              </td>

              {/* Mức 3 */}
              <td className="border border-black p-1">{row.m3.tnCount || '-'}</td>
              <td className="border border-black p-1">{row.m3.tlCount || '-'}</td>
              <td className="border border-black p-1 font-bold bg-purple-50/40 text-purple-900">
                {row.m3.score > 0 ? `${row.m3.score.toFixed(1)}` : '-'}
              </td>

              {/* Tổng hàng */}
              <td className="border border-black p-1 font-bold">{row.rowTotalTN || '-'}</td>
              <td className="border border-black p-1 font-bold">{row.rowTotalTL || '-'}</td>
              <td className="border border-black p-1 font-black bg-slate-100 text-indigo-950">
                {row.rowTotalScore.toFixed(1)}
              </td>
              <td className="border border-black p-1 font-bold">{row.rowPercent}%</td>
            </tr>
          ))}

          {/* Dòng Tổng cộng */}
          <tr className="bg-slate-100 font-black border-t-2 border-black text-slate-900">
            <td colSpan={2} className="border border-black p-2 uppercase text-left pl-3">
              Tổng cộng toàn đề
            </td>

            {/* Tổng Mức 1 */}
            <td className="border border-black p-1 text-sky-900">{totals.m1.tn}</td>
            <td className="border border-black p-1 text-sky-900">{totals.m1.tl}</td>
            <td className="border border-black p-1 bg-sky-100 text-sky-950">
              {totals.m1.score.toFixed(1)}đ
            </td>

            {/* Tổng Mức 2 */}
            <td className="border border-black p-1 text-emerald-900">{totals.m2.tn}</td>
            <td className="border border-black p-1 text-emerald-900">{totals.m2.tl}</td>
            <td className="border border-black p-1 bg-emerald-100 text-emerald-950">
              {totals.m2.score.toFixed(1)}đ
            </td>

            {/* Tổng Mức 3 */}
            <td className="border border-black p-1 text-purple-900">{totals.m3.tn}</td>
            <td className="border border-black p-1 text-purple-900">{totals.m3.tl}</td>
            <td className="border border-black p-1 bg-purple-100 text-purple-950">
              {totals.m3.score.toFixed(1)}đ
            </td>

            {/* Tổng chung */}
            <td className="border border-black p-1 text-indigo-950">{totals.grandTN} TN</td>
            <td className="border border-black p-1 text-indigo-950">{totals.grandTL} TL</td>
            <td className="border border-black p-1 bg-slate-300 text-indigo-950 text-sm">
              {totals.grandScore.toFixed(1)}đ
            </td>
            <td className="border border-black p-1 text-emerald-800">100%</td>
          </tr>

          {/* Dòng Tỉ lệ % Mức độ */}
          <tr className="bg-slate-50 font-bold text-[11px]">
            <td colSpan={2} className="border border-black p-1.5 uppercase text-left pl-3">
              Tỉ lệ % theo mức độ
            </td>
            <td colSpan={3} className="border border-black p-1 text-sky-900 font-extrabold bg-sky-50/70">
              {Math.round((totals.m1.score / totalScoreGoal) * 100)}%
            </td>
            <td colSpan={3} className="border border-black p-1 text-emerald-900 font-extrabold bg-emerald-50/70">
              {Math.round((totals.m2.score / totalScoreGoal) * 100)}%
            </td>
            <td colSpan={3} className="border border-black p-1 text-purple-900 font-extrabold bg-purple-50/70">
              {Math.round((totals.m3.score / totalScoreGoal) * 100)}%
            </td>
            <td colSpan={3} className="border border-black p-1 bg-slate-200 font-black">
              100%
            </td>
            <td className="border border-black p-1 font-bold">100%</td>
          </tr>
        </tbody>
      </table>

      {/* Note under primary matrix */}
      <div className="mt-3 text-[11px] text-slate-600 space-y-1 font-sans">
        <p>
          <strong>Ghi chú quy chuẩn Thông tư 27/2020/TT-BGDĐT:</strong>
        </p>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>
            <strong>Mức 1:</strong> Nhận biết, nhắc lại hoặc mô tả được kiến thức, kĩ năng đã học trong các tình huống quen thuộc.
          </li>
          <li>
            <strong>Mức 2:</strong> Kết nối, sắp xếp được một số kiến thức, kĩ năng đã học để giải quyết vấn đề tương tự.
          </li>
          <li>
            <strong>Mức 3:</strong> Vận dụng các kiến thức, kĩ năng đã học để giải quyết vấn đề mới hoặc đưa ra những phản hồi hợp lý trong học tập, cuộc sống.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PrimaryMatrixTable;
