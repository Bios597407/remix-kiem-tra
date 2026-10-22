import React, { useState } from 'react';
import {
  Shuffle,
  X,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Layers,
  Sliders,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { ShuffleOptions } from '../types/exam';
import { DEFAULT_SHUFFLE_OPTIONS, generateVariantCodeList } from '../utils/examShuffler';

interface ShuffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ShuffleOptions) => void;
  grade?: string;
  questionCount: number;
}

export const ShuffleModal: React.FC<ShuffleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  grade = '12',
  questionCount,
}) => {
  if (!isOpen) return null;

  const [variantCount, setVariantCount] = useState<number>(4);
  const [namingPreset, setNamingPreset] = useState<ShuffleOptions['namingPreset']>('101');
  const [customCodesInput, setCustomCodesInput] = useState<string>('');

  const [shuffleP1Q, setShuffleP1Q] = useState<boolean>(true);
  const [shuffleP1Opt, setShuffleP1Opt] = useState<boolean>(true);
  const [shuffleP2Q, setShuffleP2Q] = useState<boolean>(true);
  const [shuffleP2Sub, setShuffleP2Sub] = useState<boolean>(false);
  const [shuffleP3Q, setShuffleP3Q] = useState<boolean>(true);
  const [shuffleP4Q, setShuffleP4Q] = useState<boolean>(false);
  const [lockPassages, setLockPassages] = useState<boolean>(true);
  const [preserveAnchored, setPreserveAnchored] = useState<boolean>(true);

  // Parse custom codes if in custom mode
  const parsedCustomList = customCodesInput
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Generate preview of code names
  const previewCodes = generateVariantCodeList(
    variantCount,
    namingPreset,
    grade,
    parsedCustomList
  );

  const handleApply = () => {
    const opts: ShuffleOptions = {
      variantCount,
      namingPreset,
      customCodeList: parsedCustomList.length > 0 ? parsedCustomList : undefined,
      shufflePart1Questions: shuffleP1Q,
      shufflePart1Options: shuffleP1Opt,
      shufflePart2Questions: shuffleP2Q,
      shufflePart2SubItems: shuffleP2Sub,
      shufflePart3Questions: shuffleP3Q,
      shufflePart4Questions: shuffleP4Q,
      lockPassageClusters: lockPassages,
      preserveAnchoredOptions: preserveAnchored,
    };
    onConfirm(opts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Shuffle className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                Trộn Nhiều Mã Đề Kiểm Tra (Chuẩn CV 7991)
              </h3>
              <p className="text-xs text-blue-100">
                Xáo trộn thông minh client-side, 0 token AI, tự động khớp đáp án và bảng đối chiếu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {/* Section 1: Number of Variants */}
          <div className="space-y-2">
            <label className="font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Hash className="h-4 w-4 text-blue-600" />
              <span>1. Số lượng mã đề cần tạo:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { count: 2, label: '2 Mã Đề', desc: 'Thi 2 đề Chẵn / Lẻ' },
                { count: 4, label: '4 Mã Đề', desc: 'Chuẩn 1 phòng (24 hs)' },
                { count: 6, label: '6 Mã Đề', desc: 'Phòng thi mở rộng' },
                { count: 8, label: '8 Mã Đề', desc: 'Khảo sát quy mô lớn' },
              ].map((item) => {
                const isSelected = variantCount === item.count;
                return (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setVariantCount(item.count)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-sm flex items-center justify-between">
                      <span>{item.label}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Code Naming Scheme */}
          <div className="space-y-2">
            <label className="font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>2. Quy tắc đặt tên mã đề:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  id: '101',
                  title: '101, 102, 103...',
                  sub: 'Số 3 chữ số tuần tự chuẩn',
                },
                {
                  id: 'grade_prefix',
                  title: `Theo Khối (${grade}1, ${grade}2...)`,
                  sub: `Khối ${grade}: ${grade}1, ${grade}2...`,
                },
                {
                  id: 'random3',
                  title: 'Ngẫu nhiên 3 chữ số',
                  sub: '132, 209, 357, 481...',
                },
                {
                  id: 'even_odd',
                  title: 'Đề Chẵn - Đề Lẻ',
                  sub: 'Đề Chẵn, Đề Lẻ, Đề 1...',
                },
                {
                  id: 'alpha',
                  title: 'Chữ cái (Mã A, B, C...)',
                  sub: 'Mã A, Mã B, Mã C...',
                },
                {
                  id: 'custom',
                  title: 'Tự nhập danh sách',
                  sub: 'Phân cách bằng dấu phẩy',
                },
              ].map((scheme) => {
                const isSelected = namingPreset === scheme.id;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => setNamingPreset(scheme.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">{scheme.title}</div>
                    <div className="text-[11px] text-slate-500">{scheme.sub}</div>
                  </button>
                );
              })}
            </div>

            {namingPreset === 'custom' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customCodesInput}
                  onChange={(e) => setCustomCodesInput(e.target.value)}
                  placeholder="Ví dụ: 101, 204, 305, 408"
                  className="w-full px-3 py-2 text-xs border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500 italic">
                  Nhập danh sách mã đề, phân tách bằng dấu phẩy hoặc dấu chấm phẩy.
                </span>
              </div>
            )}

            {/* Live Preview of Code Names */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Xem trước danh sách mã đề sẽ tạo ({previewCodes.length} mã):
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {previewCodes.map((code, idx) => (
                  <span
                    key={code}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                      idx === 0
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {idx === 0 ? `⭐ Mã ${code} (Gốc)` : `Mã ${code}`}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: CV 7991 Compliance Rules & Toggles */}
          <div className="space-y-3">
            <label className="font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>3. Quy chuẩn bảo toàn đề & xáo trộn CV 7991:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-start space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleP1Q}
                  onChange={(e) => setShuffleP1Q(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Đảo thứ tự câu hỏi Phần I</span>
                  <p className="text-[11px] text-slate-500">Hoán vị câu hỏi trắc nghiệm nhiều lựa chọn</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleP1Opt}
                  onChange={(e) => setShuffleP1Opt(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Đảo 4 phương án A, B, C, D (Phần I)</span>
                  <p className="text-[11px] text-slate-500">Hoán vị vị trí các đáp án và tự động cập nhật key</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveAnchored}
                  onChange={(e) => setPreserveAnchored(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Khóa phương án neo ngữ nghĩa</span>
                  <p className="text-[11px] text-slate-500">
                    Giữ nguyên A-B-C-D nếu có câu chứa "Cả A và B", "Tất cả đều đúng"
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lockPassages}
                  onChange={(e) => setLockPassages(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Khóa chùm ngữ liệu đọc hiểu</span>
                  <p className="text-[11px] text-slate-500">
                    Giữ các câu hỏi cùng bài đọc/biểu đồ đi liền nhau, không tách rời
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleP2Q}
                  onChange={(e) => setShuffleP2Q(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Đảo thứ tự câu hỏi Phần II (Đúng/Sai)</span>
                  <p className="text-[11px] text-slate-500">Hoán vị các câu hỏi lớn Đúng/Sai</p>
                </div>
              </label>

              <label className="flex items-start space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleP3Q}
                  onChange={(e) => setShuffleP3Q(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-800">Đảo thứ tự câu hỏi Phần III (Trả lời ngắn)</span>
                  <p className="text-[11px] text-slate-500">Hoán vị câu hỏi trả lời ngắn độc lập</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Đang có {questionCount} câu hỏi sẵn sàng được trộn.</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition active:scale-95"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Bắt Đầu Trộn {variantCount} Mã Đề</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShuffleModal;
