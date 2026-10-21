import React from 'react';
import { ExamMatrix, ExamSpecificationRow, ExamConfig } from '../types/exam';

interface PrimarySpecificationTableProps {
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  config: ExamConfig;
  className?: string;
}

export const PrimarySpecificationTable: React.FC<PrimarySpecificationTableProps> = ({
  matrix,
  specs,
  config,
  className = '',
}) => {
  // If specs are provided, transform or display them for Primary
  // Otherwise derive cleanly from matrix rows
  const rows = matrix.rows || [];

  return (
    <div className={`overflow-x-auto ${className}`}>
      {/* Title block */}
      <div className="text-center font-serif mb-4 leading-tight">
        <h4 className="font-bold text-xs uppercase tracking-wide">
          BẢN ĐẶC TẢ KĨ THUẬT ĐỀ KIỂM TRA ĐỊNH KỲ CẤP TIỂU HỌC
        </h4>
        <p className="text-[11px] italic text-slate-700">
          (Chuẩn yêu cầu cần đạt Chương trình GDPT 2018 & Thông tư 27/2020/TT-BGDĐT)
        </p>
        <p className="text-[11px] font-semibold text-slate-800 mt-1">
          Môn: {config.customSubject || config.subject} – Lớp {config.grade} – {config.examTitle}
        </p>
      </div>

      <table className="w-full text-xs border-collapse border border-black font-serif leading-snug">
        <thead className="bg-slate-100 font-bold text-center">
          <tr>
            <th className="border border-black p-2 w-10">TT</th>
            <th className="border border-black p-2 w-1/4 text-left">
              Mạch kiến thức, kĩ năng
            </th>
            <th className="border border-black p-2 w-20">Mức độ</th>
            <th className="border border-black p-2 text-left">
              Yêu cầu cần đạt chi tiết
            </th>
            <th className="border border-black p-2 w-24">Hình thức câu</th>
            <th className="border border-black p-2 w-16">Số câu</th>
            <th className="border border-black p-2 w-24">Câu số trong đề</th>
            <th className="border border-black p-2 w-16">Điểm</th>
          </tr>
        </thead>

        <tbody>
          {rows.flatMap((r, rIdx) => {
            const topicName = r.topic || `Chủ đề ${rIdx + 1}`;
            // Extract entries for Mức 1, Mức 2, Mức 3
            const levelsDef = [
              {
                name: 'Mức 1',
                bg: 'bg-sky-50 text-sky-900',
                defaultReq: `Đọc được, viết được, nhận biết được hình vẽ, biểu tượng hoặc tính nhẩm trực tiếp các đại lượng thuộc ${topicName}.`,
                part1Count: (r.part1?.['Mức 1'] as any)?.count || (r.part1?.['Biết'] as any)?.count || 0,
                part4Count: (r.part4?.['Mức 1'] as any)?.count || (r.part4?.['Biết'] as any)?.count || 0,
              },
              {
                name: 'Mức 2',
                bg: 'bg-emerald-50 text-emerald-900',
                defaultReq: `Thực hiện được phép tính có nhớ, tóm tắt bài toán, so sánh hoặc điền dấu thích hợp thuộc ${topicName}.`,
                part1Count: (r.part1?.['Mức 2'] as any)?.count || (r.part1?.['Hiểu'] as any)?.count || 0,
                part4Count: (r.part4?.['Mức 2'] as any)?.count || (r.part4?.['Hiểu'] as any)?.count || 0,
              },
              {
                name: 'Mức 3',
                bg: 'bg-purple-50 text-purple-900',
                defaultReq: `Giải bài toán có lời văn, vận dụng giải quyết tình huống thực tế liên quan đến ${topicName}.`,
                part1Count: (r.part1?.['Mức 3'] as any)?.count || (r.part1?.['Vận dụng'] as any)?.count || 0,
                part4Count: (r.part4?.['Mức 3'] as any)?.count || (r.part4?.['Vận dụng'] as any)?.count || 0,
              },
            ];

            return levelsDef.map((lvl, lIdx) => {
              const totalCount = lvl.part1Count + lvl.part4Count;
              const hasItems = totalCount > 0;
              const formatDesc =
                lvl.part1Count > 0 && lvl.part4Count > 0
                  ? 'TNKQ & Tự luận'
                  : lvl.part1Count > 0
                  ? 'Trắc nghiệm (TNKQ)'
                  : lvl.part4Count > 0
                  ? 'Tự luận (TL)'
                  : '-';

              const scoreEst = Number((lvl.part1Count * 0.5 + lvl.part4Count * 1.0).toFixed(1));

              return (
                <tr key={`${rIdx}_${lIdx}`} className="hover:bg-slate-50">
                  {lIdx === 0 && (
                    <>
                      <td rowSpan={3} className="border border-black p-2 text-center font-bold align-top">
                        {rIdx + 1}
                      </td>
                      <td rowSpan={3} className="border border-black p-2 font-bold align-top text-slate-900">
                        {topicName}
                        {r.subTopic && (
                          <span className="block text-[10px] text-slate-500 font-normal italic mt-0.5">
                            {r.subTopic}
                          </span>
                        )}
                      </td>
                    </>
                  )}

                  <td className="border border-black p-1.5 text-center font-bold">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${lvl.bg}`}>
                      {lvl.name}
                    </span>
                  </td>

                  <td className="border border-black p-2 text-slate-800 text-[11px]">
                    {lvl.defaultReq}
                  </td>

                  <td className="border border-black p-1.5 text-center text-[11px]">
                    {formatDesc}
                  </td>

                  <td className="border border-black p-1.5 text-center font-bold">
                    {hasItems ? totalCount : '-'}
                  </td>

                  <td className="border border-black p-1.5 text-center font-mono text-[11px]">
                    {hasItems
                      ? `Câu ${rIdx * 3 + lIdx + 1}`
                      : '-'}
                  </td>

                  <td className="border border-black p-1.5 text-center font-bold text-blue-900">
                    {hasItems && scoreEst > 0 ? `${scoreEst}đ` : '-'}
                  </td>
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PrimarySpecificationTable;
