import React from 'react';
import { ChuDeItem, CauItem, LuatConfig, NangLucItem } from '../types/exam';
import { getUnifiedMatrixSpecData } from '../utils/cv7991Engine';

const DEFAULT_LUAT: LuatConfig = {
  nlcCount: 12,
  nlcPrice: 0.25,
  dsCount: 4,
  dsSubItems: 4,
  dsPricePerSub: 0.25,
  tlnCount: 0,
  tlnPrice: 0.5,
  tlCount: 3,
  tlUnit: 'cau',
  tlPrice: 1.0,
  bietTarget: 4.0,
  hieuTarget: 3.0,
  vanDungTarget: 3.0,
  tolerance: 0,
};

export interface OfficialSpecificationTableProps {
  chuDeList?: ChuDeItem[];
  cauList?: CauItem[];
  luat?: LuatConfig;
  className?: string;
  activeCompetencies?: NangLucItem[];
  matrix?: any;
  specs?: any;
  config?: any;
}

export const OfficialSpecificationTable: React.FC<OfficialSpecificationTableProps> = ({
  chuDeList = [],
  cauList = [],
  luat,
  className = '',
  activeCompetencies,
  config,
}) => {
  const activeLuat = luat || config?.luat || DEFAULT_LUAT;

  const matrixData = getUnifiedMatrixSpecData(chuDeList, cauList, activeLuat, {
    activeCompetencies,
  });

  const showTln = matrixData.showTln;
  const showQuestionCol = !!activeLuat.showQuestionColInSpec;

  const formatScore = (num: number) => {
    return num % 1 === 0 ? `${num},0` : num.toFixed(1).replace('.', ',');
  };

  if (!chuDeList || chuDeList.length === 0 || chuDeList.every((c) => c.noiDung.length === 0)) {
    return (
      <div className={`p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg space-y-3 ${className}`}>
        <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu Bản đặc tả Đề kiểm tra</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Vui lòng tải lên tài liệu học tập ở Bước 1 để hệ thống trích xuất Yêu cầu cần đạt và dựng Bản đặc tả tự động.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 font-sans text-xs ${className}`}>
      {/* Title */}
      <div className="text-center font-extrabold text-base uppercase text-slate-900 tracking-wide">
        BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-black bg-white shadow-sm">
        <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-black">
              <th rowSpan={4} className="border border-black p-1.5 w-10 text-center">TT</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[120px] text-left">Chủ đề/Chương</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[140px] text-left">Nội dung/đơn vị kiến thức</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[240px] text-left">Yêu cầu cần đạt</th>

              {showQuestionCol && (
                <th rowSpan={4} className="border border-black p-1.5 w-20 text-center">
                  Câu
                </th>
              )}

              <th
                colSpan={showTln ? 12 : 9}
                className="border border-black p-1.5 uppercase font-bold bg-slate-200"
              >
                Số câu hỏi ở các mức độ đánh giá
              </th>
            </tr>

            <tr className="bg-slate-100 font-bold border-b border-black">
              <th colSpan={showTln ? 9 : 6} className="border border-black p-1">TNKQ</th>
              <th colSpan={3} className="border border-black p-1">Tự luận</th>
            </tr>

            <tr className="bg-slate-50 font-bold text-[10.5px] border-b border-black">
              <th colSpan={3} className="border border-black p-1">Nhiều lựa chọn</th>
              <th colSpan={3} className="border border-black p-1">Đúng – Sai</th>
              {showTln && <th colSpan={3} className="border border-black p-1">Trả lời ngắn</th>}
              <th colSpan={3} className="border border-black p-1">Tự luận</th>
            </tr>

            <tr className="bg-slate-100 font-bold text-[10px] border-b border-black">
              <th className="border border-black p-1 w-9">Biết</th>
              <th className="border border-black p-1 w-9">Hiểu</th>
              <th className="border border-black p-1 w-9">V.Dụng</th>

              <th className="border border-black p-1 w-9">Biết</th>
              <th className="border border-black p-1 w-9">Hiểu</th>
              <th className="border border-black p-1 w-9">V.Dụng</th>

              {showTln && (
                <>
                  <th className="border border-black p-1 w-9">Biết</th>
                  <th className="border border-black p-1 w-9">Hiểu</th>
                  <th className="border border-black p-1 w-9">V.Dụng</th>
                </>
              )}

              <th className="border border-black p-1 w-9">Biết</th>
              <th className="border border-black p-1 w-9">Hiểu</th>
              <th className="border border-black p-1 w-9">V.Dụng</th>
            </tr>
          </thead>

          <tbody>
            {matrixData.rows.map((r, rIdx) => {
              // Format YCCĐ string by cognitive levels
              const bietYccdList = r.yccdList.filter((y) => y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung');
              const hieuYccdList = r.yccdList.filter((y) => y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung');
              const vdYccdList = r.yccdList.filter((y) => y.mucToiDa === 'VanDung');

              // Check if cell has question counts at level
              const hasBietQ =
                r.matrixCells.NLC.Biet.count > 0 ||
                r.matrixCells.DS.Biet.count > 0 ||
                r.matrixCells.TLN.Biet.count > 0 ||
                r.matrixCells.TL.Biet.count > 0;

              const hasHieuQ =
                r.matrixCells.NLC.Hieu.count > 0 ||
                r.matrixCells.DS.Hieu.count > 0 ||
                r.matrixCells.TLN.Hieu.count > 0 ||
                r.matrixCells.TL.Hieu.count > 0;

              const hasVdQ =
                r.matrixCells.NLC.VanDung.count > 0 ||
                r.matrixCells.DS.VanDung.count > 0 ||
                r.matrixCells.TLN.VanDung.count > 0 ||
                r.matrixCells.TL.VanDung.count > 0;

              // Build question list for optional "Câu" column
              const allQuestionCodesInRow: string[] = [];
              (['NLC', 'DS', 'TLN', 'TL'] as const).forEach((t) => {
                (['Biet', 'Hieu', 'VanDung'] as const).forEach((m) => {
                  if (r.matrixCells[t][m].questionNumbersStr) {
                    allQuestionCodesInRow.push(r.matrixCells[t][m].questionNumbersStr);
                  }
                });
              });

              return (
                <tr key={rIdx} className="hover:bg-slate-50 transition">
                  <td className="border border-black p-1.5 font-bold text-center">{r.stt}</td>

                  {r.isFirstInChuDe && (
                    <td
                      rowSpan={r.rowspanChuDe}
                      className="border border-black p-1.5 text-left font-bold align-top bg-white"
                    >
                      {r.chuDeTen}
                    </td>
                  )}

                  <td className="border border-black p-1.5 text-left font-normal">{r.noiDungTen}</td>

                  {/* YCCĐ Cell */}
                  <td className="border border-black p-2 text-left space-y-1.5 text-[10.5px] leading-relaxed">
                    {r.yccdList.length === 0 ? (
                      <span className="text-amber-700 italic font-semibold">THIẾU YCCĐ – cần bổ sung</span>
                    ) : (
                      <>
                        {hasBietQ && bietYccdList.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-900">• - Biết:</span>
                            <ul className="list-disc list-inside pl-1 space-y-0.5">
                              {bietYccdList.map((y, yIdx) => (
                                <li key={yIdx}>
                                  {y.noiDung}{' '}
                                  {y.nangLuc ? <span className="font-mono text-blue-800 font-semibold">({y.nangLuc})</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {hasHieuQ && hieuYccdList.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-900">• - Hiểu:</span>
                            <ul className="list-disc list-inside pl-1 space-y-0.5">
                              {hieuYccdList.map((y, yIdx) => (
                                <li key={yIdx}>
                                  {y.noiDung}{' '}
                                  {y.nangLuc ? <span className="font-mono text-blue-800 font-semibold">({y.nangLuc})</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {hasVdQ && vdYccdList.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-900">• - Vận dụng:</span>
                            <ul className="list-disc list-inside pl-1 space-y-0.5">
                              {vdYccdList.map((y, yIdx) => (
                                <li key={yIdx}>
                                  {y.noiDung}{' '}
                                  {y.nangLuc ? <span className="font-mono text-blue-800 font-semibold">({y.nangLuc})</span> : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {showQuestionCol && (
                    <td className="border border-black p-1 text-center font-mono text-[10px]">
                      {allQuestionCodesInRow.join('; ')}
                    </td>
                  )}

                  {/* NLC */}
                  <td className="border border-black p-1">{r.matrixCells.NLC.Biet.displayStr}</td>
                  <td className="border border-black p-1">{r.matrixCells.NLC.Hieu.displayStr}</td>
                  <td className="border border-black p-1">{r.matrixCells.NLC.VanDung.displayStr}</td>

                  {/* DS */}
                  <td className="border border-black p-1">{r.matrixCells.DS.Biet.displayStr}</td>
                  <td className="border border-black p-1">{r.matrixCells.DS.Hieu.displayStr}</td>
                  <td className="border border-black p-1">{r.matrixCells.DS.VanDung.displayStr}</td>

                  {/* TLN (if active) */}
                  {showTln && (
                    <>
                      <td className="border border-black p-1">{r.matrixCells.TLN.Biet.displayStr}</td>
                      <td className="border border-black p-1">{r.matrixCells.TLN.Hieu.displayStr}</td>
                      <td className="border border-black p-1">{r.matrixCells.TLN.VanDung.displayStr}</td>
                    </>
                  )}

                  {/* TL */}
                  <td className="border border-black p-1">{r.matrixCells.TL.Biet.displayStr}</td>
                  <td className="border border-black p-1">{r.matrixCells.TL.Hieu.displayStr}</td>
                  <td className="border border-black p-1">{r.matrixCells.TL.VanDung.displayStr}</td>
                </tr>
              );
            })}

            {/* TỔNG ĐẶC TẢ - HÀNG CUỐI */}
            <tr className="bg-slate-100 font-bold border-t-2 border-black">
              <td
                colSpan={showQuestionCol ? 5 : 4}
                className="border border-black p-1.5 text-center uppercase"
              >
                Tổng số câu / ý hỏi
              </td>

              <td colSpan={3} className="border border-black p-1">
                {matrixData.typeGrandTotals.NLC.count > 0 ? `${matrixData.typeGrandTotals.NLC.count} câu` : ''}
              </td>

              <td colSpan={3} className="border border-black p-1">
                {matrixData.typeGrandTotals.DS.count > 0 ? `${matrixData.typeGrandTotals.DS.count} ý` : ''}
              </td>

              {showTln && (
                <td colSpan={3} className="border border-black p-1">
                  {matrixData.typeGrandTotals.TLN.count > 0 ? `${matrixData.typeGrandTotals.TLN.count} câu` : ''}
                </td>
              )}

              <td colSpan={3} className="border border-black p-1">
                {matrixData.typeGrandTotals.TL.count > 0 ? `${matrixData.typeGrandTotals.TL.count} câu` : ''}
              </td>
            </tr>

            <tr className="bg-slate-100 font-bold">
              <td
                colSpan={showQuestionCol ? 5 : 4}
                className="border border-black p-1.5 text-center uppercase"
              >
                Tổng số điểm
              </td>

              <td colSpan={3} className="border border-black p-1">
                {formatScore(matrixData.typeGrandTotals.NLC.score)} điểm
              </td>

              <td colSpan={3} className="border border-black p-1">
                {formatScore(matrixData.typeGrandTotals.DS.score)} điểm
              </td>

              {showTln && (
                <td colSpan={3} className="border border-black p-1">
                  {formatScore(matrixData.typeGrandTotals.TLN.score)} điểm
                </td>
              )}

              <td colSpan={3} className="border border-black p-1">
                {formatScore(matrixData.typeGrandTotals.TL.score)} điểm
              </td>
            </tr>

            <tr className="bg-slate-100 font-bold">
              <td
                colSpan={showQuestionCol ? 5 : 4}
                className="border border-black p-1.5 text-center uppercase"
              >
                Tỉ lệ % điểm
              </td>

              <td colSpan={3} className="border border-black p-1">
                {matrixData.typeGrandTotals.NLC.percent.toFixed(0)}%
              </td>

              <td colSpan={3} className="border border-black p-1">
                {matrixData.typeGrandTotals.DS.percent.toFixed(0)}%
              </td>

              {showTln && (
                <td colSpan={3} className="border border-black p-1">
                  {matrixData.typeGrandTotals.TLN.percent.toFixed(0)}%
                </td>
              )}

              <td colSpan={3} className="border border-black p-1">
                {matrixData.typeGrandTotals.TL.percent.toFixed(0)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card Accordion View */}
      <div className="block md:hidden space-y-3">
        {matrixData.rows.map((r, rIdx) => (
          <div key={rIdx} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-900 text-[11px] font-black flex items-center justify-center shrink-0">
                  {r.stt}
                </span>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">
                    {r.chuDeTen}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {r.noiDungTen}
                  </h4>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-700">
              <span className="font-bold text-[11px] text-slate-900 uppercase block">Yêu cầu cần đạt:</span>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                {r.yccdList.length === 0 ? (
                  <span className="text-slate-400 italic">Chưa nhập YCCĐ</span>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {r.yccdList.map((y, yIdx) => (
                      <li key={yIdx}>
                        {y.noiDung}{' '}
                        {y.nangLuc ? <span className="font-mono text-blue-800 font-semibold">({y.nangLuc})</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfficialSpecificationTable;
