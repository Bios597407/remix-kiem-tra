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

export interface OfficialMatrixTableProps {
  chuDeList?: ChuDeItem[];
  cauList?: CauItem[];
  luat?: LuatConfig;
  className?: string;
  activeCompetencies?: NangLucItem[];
  matrix?: any;
  config?: any;
}

export const OfficialMatrixTable: React.FC<OfficialMatrixTableProps> = ({
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

  const formatScore = (num: number) => {
    return num % 1 === 0 ? `${num},0` : num.toFixed(1).replace('.', ',');
  };

  const formatPercent = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return '0%';
    if (Number.isInteger(num)) return `${num}%`;
    return `${Number(num.toFixed(2)).toString().replace('.', ',')}%`;
  };

  if (!chuDeList || chuDeList.length === 0 || chuDeList.every((c) => c.noiDung.length === 0)) {
    return (
      <div className={`p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg space-y-3 ${className}`}>
        <p className="text-sm font-semibold text-slate-700">Chưa có dữ liệu Ma trận Đề kiểm tra</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Vui lòng tải lên tài liệu học tập ở Bước 1 hoặc chọn cấu trúc tham số để hệ thống tự động sinh Ma trận đề thi.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 font-sans text-xs ${className}`}>
      {/* Title */}
      <div className="text-center font-extrabold text-base uppercase text-slate-900 tracking-wide">
        MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-black bg-white shadow-sm">
        <table className="w-full text-center border-collapse border border-black text-slate-900 text-[11px] leading-snug">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-black">
              <th rowSpan={4} className="border border-black p-1.5 w-10 text-center">TT</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[120px] text-left">Chủ đề/Chương</th>
              <th rowSpan={4} className="border border-black p-1.5 min-w-[140px] text-left">Nội dung/đơn vị kiến thức</th>
              <th
                colSpan={showTln ? 12 : 9}
                className="border border-black p-1.5 uppercase font-bold bg-slate-200"
              >
                Mức độ đánh giá
              </th>
              <th colSpan={3} rowSpan={3} className="border border-black p-1.5 bg-slate-200 font-bold">
                Tổng
              </th>
              <th rowSpan={4} className="border border-black p-1.5 w-16 font-bold">
                Tỉ lệ % điểm
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

              <th className="border border-black p-1 w-9 bg-slate-200">Biết</th>
              <th className="border border-black p-1 w-9 bg-slate-200">Hiểu</th>
              <th className="border border-black p-1 w-9 bg-slate-200">V.Dụng</th>
            </tr>
          </thead>

          <tbody>
            {matrixData.rows.map((r, rIdx) => {
              const bietRowSum =
                r.matrixCells.NLC.Biet.count +
                r.matrixCells.DS.Biet.count +
                r.matrixCells.TLN.Biet.count +
                r.matrixCells.TL.Biet.count;

              const hieuRowSum =
                r.matrixCells.NLC.Hieu.count +
                r.matrixCells.DS.Hieu.count +
                r.matrixCells.TLN.Hieu.count +
                r.matrixCells.TL.Hieu.count;

              const vdRowSum =
                r.matrixCells.NLC.VanDung.count +
                r.matrixCells.DS.VanDung.count +
                r.matrixCells.TLN.VanDung.count +
                r.matrixCells.TL.VanDung.count;

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

                  {/* ROW TOTALS GROUP */}
                  <td className="border border-black p-1 font-bold bg-slate-50">{bietRowSum || ''}</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">{hieuRowSum || ''}</td>
                  <td className="border border-black p-1 font-bold bg-slate-50">{vdRowSum || ''}</td>

                  <td className="border border-black p-1 font-bold text-center">
                    {formatPercent(r.rowPercentScore)}
                  </td>
                </tr>
              );
            })}

            {/* DÒNG TỔNG SỐ CÂU */}
            <tr className="bg-slate-50 font-bold border-t-2 border-black">
              <td colSpan={3} className="border border-black p-1.5 text-center uppercase">
                Tổng số câu (ý)
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

              <td className="border border-black p-1 bg-slate-200">{matrixData.levelGrandTotals.Biet.count}</td>
              <td className="border border-black p-1 bg-slate-200">{matrixData.levelGrandTotals.Hieu.count}</td>
              <td className="border border-black p-1 bg-slate-200">{matrixData.levelGrandTotals.VanDung.count}</td>

              <td className="border border-black p-1 bg-slate-300 font-black">{matrixData.grandTotalCount} câu/ý</td>
            </tr>

            {/* DÒNG TỔNG SỐ ĐIỂM */}
            <tr className="bg-slate-50 font-bold">
              <td colSpan={3} className="border border-black p-1.5 text-center uppercase">
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

              <td className="border border-black p-1 bg-slate-200">{formatScore(matrixData.levelGrandTotals.Biet.score)} điểm</td>
              <td className="border border-black p-1 bg-slate-200">{formatScore(matrixData.levelGrandTotals.Hieu.score)} điểm</td>
              <td className="border border-black p-1 bg-slate-200">{formatScore(matrixData.levelGrandTotals.VanDung.score)} điểm</td>

              <td className="border border-black p-1 bg-slate-300 font-black text-blue-900">
                {formatScore(matrixData.grandTotalScore)} điểm
              </td>
            </tr>

            {/* DÒNG TỈ LỆ % */}
            <tr className="bg-slate-100 font-bold">
              <td colSpan={3} className="border border-black p-1.5 text-center uppercase">
                Tỉ lệ % điểm
              </td>

              <td colSpan={3} className="border border-black p-1">
                {formatPercent(matrixData.typeGrandTotals.NLC.percent)}
              </td>

              <td colSpan={3} className="border border-black p-1">
                {formatPercent(matrixData.typeGrandTotals.DS.percent)}
              </td>

              {showTln && (
                <td colSpan={3} className="border border-black p-1">
                  {formatPercent(matrixData.typeGrandTotals.TLN.percent)}
                </td>
              )}

              <td colSpan={3} className="border border-black p-1">
                {formatPercent(matrixData.typeGrandTotals.TL.percent)}
              </td>

              <td className="border border-black p-1 bg-slate-200">{formatPercent(matrixData.levelGrandTotals.Biet.percent)}</td>
              <td className="border border-black p-1 bg-slate-200">{formatPercent(matrixData.levelGrandTotals.Hieu.percent)}</td>
              <td className="border border-black p-1 bg-slate-200">{formatPercent(matrixData.levelGrandTotals.VanDung.percent)}</td>

              <td className="border border-black p-1 bg-slate-300 font-black text-emerald-900">
                {formatPercent(matrixData.grandTotalPercent)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card Accordion View */}
      <div className="block md:hidden space-y-3">
        {matrixData.rows.map((r, rIdx) => {
          const bietRowSum =
            r.matrixCells.NLC.Biet.count +
            r.matrixCells.DS.Biet.count +
            r.matrixCells.TLN.Biet.count +
            r.matrixCells.TL.Biet.count;

          const hieuRowSum =
            r.matrixCells.NLC.Hieu.count +
            r.matrixCells.DS.Hieu.count +
            r.matrixCells.TLN.Hieu.count +
            r.matrixCells.TL.Hieu.count;

          const vdRowSum =
            r.matrixCells.NLC.VanDung.count +
            r.matrixCells.DS.VanDung.count +
            r.matrixCells.TLN.VanDung.count +
            r.matrixCells.TL.VanDung.count;

          return (
            <div key={rIdx} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 text-[11px] font-black flex items-center justify-center shrink-0">
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
                <span className="text-xs font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md shrink-0">
                  {formatPercent(r.rowPercentScore)}
                </span>
              </div>

              {/* Levels summary grid */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] text-center pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Biết</span>
                  <span className="font-extrabold text-slate-800">{bietRowSum || 0} câu</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">Hiểu</span>
                  <span className="font-extrabold text-slate-800">{hieuRowSum || 0} câu</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                  <span className="block text-[10px] text-slate-500 font-bold uppercase">V.Dụng</span>
                  <span className="font-extrabold text-slate-800">{vdRowSum || 0} câu</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Grand Totals Summary Card */}
        <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Tổng Đề Kiểm Tra</span>
            <span className="font-black text-sm text-emerald-400">{formatPercent(matrixData.grandTotalPercent)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-slate-800/80 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold block">Tổng số câu/ý</span>
              <span className="font-black text-white text-sm">{matrixData.grandTotalCount}</span>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 font-bold block">Tổng số điểm</span>
              <span className="font-black text-amber-300 text-sm">{formatScore(matrixData.grandTotalScore)} điểm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialMatrixTable;
