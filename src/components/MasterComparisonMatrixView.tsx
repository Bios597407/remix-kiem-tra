import React, { useState, useMemo } from 'react';
import {
  Table as TableIcon,
  Download,
  Printer,
  Copy,
  Check,
  Filter,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ExamConfig,
  ShuffledExamCode,
  MasterComparisonMatrix,
  MasterComparisonRow,
} from '../types/exam';
import { generateMasterComparisonMatrix } from '../utils/examShuffler';
import { downloadComparisonMatrixDocx } from '../utils/multiCodeExporter';
import { useToast } from './Toast';
import MathRenderer from '../utils/mathRenderer';

interface MasterComparisonMatrixViewProps {
  config: ExamConfig;
  shuffledCodes: ShuffledExamCode[];
  onSelectCode?: (code: string) => void;
}

export const MasterComparisonMatrixView: React.FC<MasterComparisonMatrixViewProps> = ({
  config,
  shuffledCodes,
  onSelectCode,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState<boolean>(false);
  const [partFilter, setPartFilter] = useState<'all' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const matrix: MasterComparisonMatrix = useMemo(() => {
    return generateMasterComparisonMatrix(shuffledCodes);
  }, [shuffledCodes]);

  const filteredRows = useMemo(() => {
    if (partFilter === 'all') return matrix.rows;
    return matrix.rows.filter((r) => r.part === partFilter);
  }, [matrix.rows, partFilter]);

  const handleExportDocx = async () => {
    try {
      setIsExporting(true);
      toast.info('⏳ Đang tạo file Word (.docx) Bảng Ma Trận Đối Chiếu...');
      await downloadComparisonMatrixDocx(config, shuffledCodes);
      toast.success('🎉 Đã tải file Word (.docx) Bảng Đối Chiếu Đáp Án!');
    } catch (err: unknown) {
      console.error(err);
      toast.error('Lỗi xuất file Word bảng đối chiếu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyClipboard = () => {
    if (!matrix || matrix.rows.length === 0) return;

    const header = ['STT Gốc', 'Phần', 'Mã ' + matrix.codes[0] + ' (Gốc)', ...matrix.codes.slice(1).map((c) => `Mã ${c}`)].join('\t');
    const lines = filteredRows.map((r) => {
      const varCols = matrix.codes.slice(1).map((c) => {
        const v = r.variants[c];
        const vNum = v ? (v.sttInPart ?? v.stt) : 0;
        return v ? `(C.${vNum}) ${v.answer}` : '-';
      });
      const baseNum = r.baseSttInPart ?? r.baseStt;
      return [`Câu ${baseNum}`, r.part, r.baseAnswer, ...varCols].join('\t');
    });

    const fullText = [header, ...lines].join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success('📋 Đã sao chép Bảng ma trận đáp án vào Clipboard (dán được vào Excel)!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!shuffledCodes || shuffledCodes.length <= 1) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <TableIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
        <h4 className="font-bold text-slate-700">Chưa tạo nhiều mã đề</h4>
        <p className="text-xs text-slate-400 mt-1">
          Vui lòng bấm nút <strong>"🎲 Trộn Mã Đề"</strong> phía trên để hệ thống sinh 2, 4, 6 hoặc 8 mã đề cùng bảng đối chiếu này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
      {/* Top Action Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                <TableIcon className="h-5 w-5" />
              </span>
              <span>BẢNG MA TRẬN ĐỐI CHIẾU ĐÁP ÁN TOÀN BỘ MÃ ĐỀ</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
              {shuffledCodes.length} mã đề: {matrix.codes.join(', ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh vị trí câu (đánh số từ Câu 1 theo từng Phần) và đáp án tương ứng giữa các mã đề để chấm thi nhanh, chính xác tuyệt đối
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Parts */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-bold text-slate-600">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'part1', label: 'Phần I (NLC)' },
              { id: 'part2', label: 'Phần II (Đ/S)' },
              { id: 'part3', label: 'Phần III (TLN)' },
              { id: 'part4', label: 'Phần IV (TL)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPartFilter(p.id as any)}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                  partFilter === p.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Copy Table to Excel */}
          <button
            onClick={handleCopyClipboard}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Sao chép bảng này để dán trực tiếp vào Excel"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Dán sang Excel'}</span>
          </button>

          {/* Download Word Docx */}
          <button
            onClick={handleExportDocx}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            title="Tải bảng ma trận đối chiếu dạng Word .docx"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Đang tạo...' : 'Xuất Word (.docx)'}</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>In bảng</span>
          </button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white font-bold text-center border-b border-slate-300">
              <th className="p-2.5 border-r border-slate-700 w-16">STT (Phần)</th>
              <th className="p-2.5 border-r border-slate-700 w-24">Phần thi</th>
              <th className="p-2.5 border-r border-slate-700 text-left min-w-[200px]">Nội dung câu hỏi tóm tắt</th>
              <th className="p-2.5 border-r border-slate-700 w-28 bg-blue-900 text-amber-200">
                Mã {matrix.codes[0]} <span className="text-[10px] block font-normal text-blue-200">(Đề gốc)</span>
              </th>
              {matrix.codes.slice(1).map((code) => (
                <th key={code} className="p-2.5 border-r border-slate-700 w-32 bg-slate-900 text-emerald-300">
                  <div className="flex items-center justify-center gap-1">
                    <span>Mã {code}</span>
                    {onSelectCode && (
                      <button
                        onClick={() => onSelectCode(code)}
                        className="p-0.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer no-print"
                        title={`Xem chi tiết đề thi Mã ${code}`}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] block font-normal text-slate-300">(Vị trí câu & Đáp án)</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              let partBadgeBg = 'bg-blue-100 text-blue-800';
              let partShort = 'Phần I';
              if (row.part === 'part2') {
                partBadgeBg = 'bg-emerald-100 text-emerald-800';
                partShort = 'Phần II';
              } else if (row.part === 'part3') {
                partBadgeBg = 'bg-amber-100 text-amber-800';
                partShort = 'Phần III';
              } else if (row.part === 'part4') {
                partBadgeBg = 'bg-purple-100 text-purple-800';
                partShort = 'Phần IV';
              }

              const displayBaseStt = row.baseSttInPart ?? row.baseStt;

              return (
                <tr
                  key={row.questionId || idx}
                  className={`border-b border-slate-200 transition hover:bg-amber-50/50 ${
                    isEven ? 'bg-white' : 'bg-slate-50/60'
                  }`}
                >
                  {/* STT Gốc theo Phần */}
                  <td className="p-2.5 text-center font-black text-slate-700 border-r border-slate-200">
                    <span className="text-blue-900 font-bold">Câu {displayBaseStt}</span>
                  </td>

                  {/* Part Badge */}
                  <td className="p-2.5 text-center border-r border-slate-200">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${partBadgeBg}`}>
                      {partShort}
                    </span>
                  </td>

                  {/* Preview */}
                  <td className="p-2.5 text-slate-700 border-r border-slate-200 font-sans">
                    <MathRenderer text={row.questionPreview} />
                  </td>

                  {/* Base Exam Answer (Code 101) */}
                  <td className="p-2.5 text-center font-bold text-blue-700 bg-blue-50/40 border-r border-slate-200">
                    <span className="text-sm font-black px-2 py-0.5 bg-blue-100/80 rounded border border-blue-200">
                      {row.baseAnswer}
                    </span>
                  </td>

                  {/* Variant Columns */}
                  {matrix.codes.slice(1).map((code) => {
                    const varInfo = row.variants[code];
                    if (!varInfo) {
                      return (
                        <td key={code} className="p-2.5 text-center text-slate-400 border-r border-slate-200">
                          -
                        </td>
                      );
                    }

                    const displayVarStt = varInfo.sttInPart ?? varInfo.stt;
                    const isDifferentAnswer = varInfo.answer !== row.baseAnswer;
                    const isDifferentPosition = displayVarStt !== displayBaseStt;

                    return (
                      <td
                        key={code}
                        className="p-2.5 text-center border-r border-slate-200 bg-amber-50/20"
                      >
                        <div className="flex flex-col items-center justify-center space-y-0.5">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded border ${
                              isDifferentAnswer
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {varInfo.answer}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {isDifferentPosition ? (
                              <span className="text-amber-800 font-semibold">(Câu {displayVarStt})</span>
                            ) : (
                              <span className="text-slate-400">(Câu {displayVarStt})</span>
                            )}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend & Guide */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
            <span className="font-semibold">Mã gốc (101):</span>
            <span>Thứ tự và đáp án gốc</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
            <span className="font-semibold">Mã hoán vị:</span>
            <span>Hiển thị đáp án mới kèm số thứ tự (Câu X)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500 italic">
          * Đảm bảo tính khách quan và thuận tiện tối đa khi chấm thi bài trắc nghiệm.
        </div>
      </div>
    </div>
  );
};

export default MasterComparisonMatrixView;
