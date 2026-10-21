import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { ExamConfig, ShuffledExamCode } from '../types/exam';
import { exportAnswerSheetWordDoc } from '../utils/exporter';

interface AnswerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  currentCode: ShuffledExamCode;
}

export const AnswerSheet: React.FC<AnswerSheetProps> = ({
  isOpen,
  onClose,
  config,
  currentCode,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const subject = config.customSubject || config.subject || 'Môn học';
  const gradeStr = config.gradeLevel === 'primary' ? `Khối ${config.grade}` : `Lớp ${config.grade}`;

  const p1Count = config.sectionCounts.part1 || 12;
  const p2Count = config.sectionCounts.part2 || 4;
  const p3Count = config.sectionCounts.part3 || 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[96vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between border-b bg-slate-100 px-6 py-3 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Phiếu Trả Lời Trắc Nghiệm Chuẩn Bộ GD&ĐT (Định dạng 2025)
              </h3>
              <p className="text-xs text-slate-500">
                Được thiết kế chuẩn khổ A4, đồng bộ theo đúng số lượng câu của đề thi hiện tại
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportAnswerSheetWordDoc(config, currentCode)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 shadow-xs cursor-pointer"
              title="Tải mẫu phiếu trả lời trắc nghiệm dưới dạng Microsoft Word"
            >
              <Download className="h-4 w-4" />
              <span>Xuất Word (.doc)</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In Phiếu Trả Lời A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Answer Sheet Container (Standard A4 Page) */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-white text-black font-sans leading-tight print-sheet">
          <div className="border-2 border-black p-4 rounded-xs">
            {/* Header */}
            <div className="flex justify-between items-start text-xs border-b border-black pb-2">
              <div className="text-center w-5/12">
                <div className="font-bold uppercase tracking-wider">{config.schoolName || 'SỞ GIÁO DỤC VÀ ĐÀO TẠO'}</div>
                <div className="font-bold uppercase mt-0.5">HỘI ĐỒNG COI THI: .......................................</div>
                <div className="mt-1">Phòng thi số: .............. Điểm thi: ........................</div>
              </div>
              <div className="text-center w-7/12">
                <div className="font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="font-bold underline">Độc lập - Tự do - Hạnh phúc</div>
                <div className="text-[10px] italic mt-1 font-serif">KỲ THI KHẢO SÁT CHẤT LƯỢNG / ĐỊNH KỲ</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-2">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wide">
                PHIẾU TRẢ LỜI TRẮC NGHIỆM
              </h1>
              <div className="text-xs font-bold">
                BÀI THI: {subject.toUpperCase()} – {gradeStr.toUpperCase()}
              </div>
              <div className="text-[11px] italic text-slate-700">
                (Áp dụng cấu trúc định dạng đề thi từ năm 2025 của Bộ Giáo dục và Đào tạo)
              </div>
            </div>

            {/* Student Info & Bubble Grid for SBD & Test Code */}
            <div className="grid grid-cols-12 gap-2 border border-black p-2 text-xs mb-3">
              {/* Left Info (7 cols) */}
              <div className="col-span-7 space-y-1.5 pr-2 border-r border-black">
                <div>
                  <strong>1. Họ, chữ đệm và tên thí sinh:</strong>
                  <div className="border-b border-dotted border-black h-5"></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>2. Ngày sinh:</strong> ..... / ..... / .........
                  </div>
                  <div>
                    <strong>3. Lớp:</strong> .................................
                  </div>
                </div>
                <div>
                  <strong>4. Trường:</strong> ............................................................................
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="border border-black p-1 text-center h-16">
                    <div className="font-bold text-[10px]">CHỮ KÝ CỦA GIÁM THỊ 1</div>
                  </div>
                  <div className="border border-black p-1 text-center h-16">
                    <div className="font-bold text-[10px]">CHỮ KÝ CỦA GIÁM THỊ 2</div>
                  </div>
                </div>
              </div>

              {/* Right: SBD & Test Code (5 cols) */}
              <div className="col-span-5 grid grid-cols-2 gap-2 text-center text-[10px]">
                {/* SBD */}
                <div className="border border-black p-1">
                  <div className="font-bold">5. SỐ BÁO DANH</div>
                  <div className="grid grid-cols-6 border border-black my-1 font-bold text-xs h-6">
                    <div></div><div></div><div></div><div></div><div></div><div></div>
                  </div>
                  <div className="space-y-0.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <div key={num} className="grid grid-cols-6 gap-0.5">
                        {[0, 1, 2, 3, 4, 5].map((col) => (
                          <span
                            key={col}
                            className="inline-block w-3.5 h-3.5 rounded-full border border-black text-[9px] leading-3.5 mx-auto"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mã Đề */}
                <div className="border border-black p-1">
                  <div className="font-bold">6. MÃ ĐỀ THI</div>
                  <div className="grid grid-cols-3 border border-black my-1 font-bold text-xs h-6">
                    <div>{currentCode.code[0] || ''}</div>
                    <div>{currentCode.code[1] || ''}</div>
                    <div>{currentCode.code[2] || ''}</div>
                  </div>
                  <div className="space-y-0.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <div key={num} className="grid grid-cols-3 gap-1">
                        {[0, 1, 2].map((col) => {
                          const isPrefilled = currentCode.code[col] === String(num);
                          return (
                            <span
                              key={col}
                              className={`inline-block w-3.5 h-3.5 rounded-full border border-black text-[9px] leading-3.5 mx-auto ${
                                isPrefilled ? 'bg-black text-white' : ''
                              }`}
                            >
                              {num}
                            </span>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Guide box */}
            <div className="bg-slate-100 border border-black p-1.5 text-[10px] mb-3 flex items-center justify-between">
              <div>
                <strong>LƯU Ý:</strong> Giữ phiếu phẳng, không gấp mép. Dùng bút chì đen tô kín ô tròn tương ứng với đáp án lựa chọn.
              </div>
              <div className="flex items-center space-x-2 shrink-0 font-bold">
                <span>Đúng: [●]</span>
                <span>Sai: [○] [×] [✓]</span>
              </div>
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-12 gap-3 text-xs">
              {/* PHẦN I: Trắc nghiệm 4 lựa chọn (6 cols) */}
              <div className="col-span-12 sm:col-span-6 border border-black p-2">
                <div className="font-bold text-[11px] uppercase bg-black text-white text-center py-0.5 mb-1.5">
                  PHẦN I: Câu trắc nghiệm nhiều phương án ({p1Count} câu)
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  {Array.from({ length: Math.max(p1Count, 12) }).map((_, idx) => {
                    const qNum = idx + 1;
                    const inTest = qNum <= p1Count;
                    return (
                      <div
                        key={qNum}
                        className={`flex items-center justify-between border-b border-slate-200 py-0.5 text-[11px] ${
                          !inTest ? 'opacity-30' : ''
                        }`}
                      >
                        <span className="font-bold w-6">{qNum}</span>
                        <div className="flex space-x-1">
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <span
                              key={opt}
                              className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[9px] font-bold"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PHẦN II: Đúng/Sai & PHẦN III: Trả lời ngắn (6 cols) */}
              <div className="col-span-12 sm:col-span-6 space-y-3">
                {/* PHẦN II */}
                <div className="border border-black p-2">
                  <div className="font-bold text-[11px] uppercase bg-black text-white text-center py-0.5 mb-1.5">
                    PHẦN II: Câu trắc nghiệm Đúng/Sai ({p2Count} câu)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {Array.from({ length: Math.max(p2Count, 4) }).map((_, cIdx) => {
                      const cNum = cIdx + 1;
                      const inTest = cNum <= p2Count;
                      return (
                        <div key={cNum} className={`border border-slate-300 p-1 rounded-xs ${!inTest ? 'opacity-30' : ''}`}>
                          <div className="font-bold text-center border-b pb-0.5 mb-0.5">Câu {cNum}</div>
                          {['a', 'b', 'c', 'd'].map((sub) => (
                            <div key={sub} className="flex items-center justify-between py-0.5">
                              <span className="font-bold">{sub})</span>
                              <div className="flex space-x-1.5">
                                <span className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">
                                  Đ
                                </span>
                                <span className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">
                                  S
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PHẦN III */}
                <div className="border border-black p-2">
                  <div className="font-bold text-[11px] uppercase bg-black text-white text-center py-0.5 mb-1.5">
                    PHẦN III: Câu trắc nghiệm trả lời ngắn ({p3Count} câu)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    {Array.from({ length: Math.max(p3Count, 6) }).map((_, sIdx) => {
                      const sNum = sIdx + 1;
                      const inTest = sNum <= p3Count;
                      return (
                        <div key={sNum} className={`border border-slate-300 p-1 text-center ${!inTest ? 'opacity-30' : ''}`}>
                          <div className="font-bold border-b pb-0.5 mb-1">Câu {sNum}</div>
                          <div className="grid grid-cols-4 border border-black h-5 mb-1">
                            <div></div><div></div><div></div><div></div>
                          </div>
                          <div className="text-[8px] text-slate-500">Tô số hoặc dấu</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Signature at bottom */}
            <div className="mt-4 pt-2 border-t border-black grid grid-cols-2 text-center text-xs">
              <div>
                <strong>Chữ ký thí sinh</strong><br />
                <span className="text-[10px] italic">(Ký và ghi rõ họ tên)</span>
                <div className="h-10"></div>
              </div>
              <div>
                <strong>Điểm thi bằng số và chữ</strong><br />
                <div className="border border-black w-32 h-10 mx-auto mt-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerSheet;
