import React, { useState } from 'react';
import {
  Printer,
  Download,
  FileDown,
  X,
  FileText,
  CheckCircle,
  Grid,
  ListTree,
  BookOpen,
  Layers,
  Copy,
} from 'lucide-react';
import {
  QuestionItem,
  ExamConfig,
  ChuDeItem,
  CauItem,
  LuatConfig,
} from '../types/exam';
import MathRenderer from '../utils/mathRenderer';
import { downloadStandardFormDocx } from '../utils/docxExporter';
import { useToast } from './Toast';
import OfficialExamHeader from './OfficialExamHeader';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';

export type PrintDocType = 'exam' | 'answers' | 'matrix' | 'spec' | 'study_guide' | 'full';

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

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType?: PrintDocType;
  config: ExamConfig;
  questions: QuestionItem[];
  chuDeList?: ChuDeItem[];
  cauList?: CauItem[];
  luat?: LuatConfig;
  examCode?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  docType = 'exam',
  config,
  questions,
  chuDeList = [],
  cauList = [],
  luat,
  examCode = '101',
}) => {
  const toast = useToast();
  const [activeDocType, setActiveDocType] = useState<PrintDocType>(docType);

  if (!isOpen) return null;

  const activeLuat = luat || config.luat || DEFAULT_LUAT;

  const handlePrint = () => {
    window.print();
  };

  const getDisplayScaleStyle = (scale?: 'compact' | 'standard' | 'relaxed') => {
    switch (scale) {
      case 'compact':
        return { fontSize: '16px', lineHeight: 1.35 };
      case 'relaxed':
        return { fontSize: '20px', lineHeight: 1.65 };
      case 'standard':
      default:
        return { fontSize: '18px', lineHeight: 1.5 };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-sm uppercase tracking-wide text-slate-100">
              XEM TRƯỚC VÀ IN ẤN TÀI LIỆU CHUẨN A4
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Switcher Toolbar */}
        <div className="no-print bg-slate-100 border-b border-slate-200 p-2 flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'exam', label: 'Đề kiểm tra', icon: FileText },
              { id: 'answers', label: 'Đáp án & Lời giải', icon: CheckCircle },
              { id: 'matrix', label: 'Ma trận', icon: Grid },
              { id: 'spec', label: 'Bản đặc tả', icon: ListTree },
              { id: 'full', label: 'Trọn bộ Hồ sơ', icon: Layers },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeDocType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDocType(item.id as PrintDocType)}
                  className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => downloadStandardFormDocx(config, questions, { mode: 'full', examCode: '101' })}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Tải ngay file Word (.docx) theo đúng Form Trình Bày Chuẩn 100%"
          >
            <Download className="w-3.5 h-3.5 text-amber-300" />
            <span>Xuất đề (theo form chuẩn)</span>
          </button>
        </div>

        {/* Printable Paper Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-100 font-sans">
          <div className="max-w-[210mm] mx-auto bg-white p-10 shadow-lg rounded-sm print-sheet text-slate-900 space-y-6" style={getDisplayScaleStyle(config.appUiScale)}>
            {/* View 1: ĐỀ KIỂM TRA */}
            {(activeDocType === 'exam' || activeDocType === 'full') && (() => {
              const p1 = questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
              const p2 = questions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
              const p3 = questions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
              const p4 = questions.filter((q) => q.part === 'part4' || q.type === 'essay');
              const fmtScore = (num: number) => (num % 1 === 0 ? `${num},0` : num.toFixed(2).replace('.', ','));

              return (
                <div className="space-y-6">
                  <OfficialExamHeader config={config} activeCode={examCode || '101'} />

                  <div className="space-y-6 font-serif text-sm leading-relaxed">
                    {/* Phần I */}
                    {p1.length > 0 && (
                      <div className="space-y-3">
                        <div className="font-bold text-sm uppercase border-b pb-1 text-slate-800">
                          PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN ({fmtScore(p1.reduce((s, q) => s + (q.score || 0.25), 0))} điểm)
                        </div>
                        <p className="text-xs italic text-slate-600">
                          Thí sinh chọn một phương án trả lời đúng duy nhất trong mỗi câu hỏi từ Câu 1 đến Câu {p1.length}.
                        </p>
                        <div className="space-y-3">
                          {p1.map((q, idx) => (
                            <div key={q.id || idx} className="space-y-1">
                              <p className="font-bold">
                                Câu {idx + 1} ({q.score || 0.25} điểm): <MathRenderer text={q.question} />
                              </p>
                              {q.passage && (
                                <div className="p-2 bg-amber-50 rounded border-l-2 border-amber-400 text-xs italic">
                                  <MathRenderer text={q.passage} />
                                </div>
                              )}
                              {q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 pl-4 text-xs font-mono">
                                  {q.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="p-1 rounded bg-slate-50 border border-slate-200">
                                      <MathRenderer text={opt} />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phần II */}
                    {p2.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="font-bold text-sm uppercase border-b pb-1 text-slate-800">
                          PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI ({fmtScore(p2.reduce((s, q) => s + (q.score || 1.0), 0))} điểm)
                        </div>
                        <p className="text-xs italic text-slate-600">
                          Thí sinh trả lời từ Câu 1 đến Câu {p2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
                        </p>
                        <div className="space-y-3">
                          {p2.map((q, idx) => (
                            <div key={q.id || idx} className="space-y-1.5">
                              <p className="font-bold">
                                Câu {idx + 1} ({q.score || 1.0} điểm): <MathRenderer text={q.question} />
                              </p>
                              {q.subItems && q.subItems.length > 0 && (
                                <div className="pl-4 space-y-1 text-xs">
                                  {q.subItems.map((sub, sIdx) => (
                                    <div key={sIdx} className="flex items-start space-x-2">
                                      <span className="font-bold">{sub.label})</span>
                                      <span><MathRenderer text={sub.statement} /></span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phần III */}
                    {p3.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="font-bold text-sm uppercase border-b pb-1 text-slate-800">
                          PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ({fmtScore(p3.reduce((s, q) => s + (q.score || 0.5), 0))} điểm)
                        </div>
                        <p className="text-xs italic text-slate-600">
                          Thí sinh trả lời từ Câu 1 đến Câu {p3.length}. Viết câu trả lời ngắn vào phiếu làm bài.
                        </p>
                        <div className="space-y-3">
                          {p3.map((q, idx) => (
                            <div key={q.id || idx} className="space-y-1">
                              <p className="font-bold">
                                Câu {idx + 1} ({q.score || 0.5} điểm): <MathRenderer text={q.question} />
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phần IV */}
                    {p4.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        <div className="font-bold text-sm uppercase border-b pb-1 text-slate-800">
                          PHẦN IV. TỰ LUẬN ({fmtScore(p4.reduce((s, q) => s + (q.score || 1.0), 0))} điểm)
                        </div>
                        <p className="text-xs italic text-slate-600">
                          Thí sinh trình bày chi tiết lời giải từ Câu 1 đến Câu {p4.length} vào giấy làm bài.
                        </p>
                        <div className="space-y-3">
                          {p4.map((q, idx) => (
                            <div key={q.id || idx} className="space-y-1">
                              <p className="font-bold">
                                Câu {idx + 1} ({q.score || 1.0} điểm): <MathRenderer text={q.question} />
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* View 2: BẢNG ĐÁP ÁN */}
            {(activeDocType === 'answers' || activeDocType === 'full') && (() => {
              const p1 = questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
              const p2 = questions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
              const p3 = questions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
              const p4 = questions.filter((q) => q.part === 'part4' || q.type === 'essay');

              return (
                <div className={`space-y-4 ${activeDocType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break-before' : ''}`}>
                  <div className="text-center font-bold text-sm uppercase">
                    BẢNG ĐÁP ÁN CHÍNH THỨC – {config.examTitle} (MÃ ĐỀ {examCode || '101'})
                  </div>

                  {p1.length > 0 && (
                    <div className="space-y-2">
                      <div className="font-bold text-xs uppercase text-slate-700">Phần I: Trắc nghiệm 4 lựa chọn (Từ Câu 1 đến Câu {p1.length})</div>
                      <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <th className="p-2 border border-slate-300 text-center w-16">STT</th>
                            <th className="p-2 border border-slate-300">Nội dung câu</th>
                            <th className="p-2 border border-slate-300 w-24 text-center">Đáp án</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p1.map((q, idx) => (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="p-2 border border-slate-300 text-center font-bold">Câu {idx + 1}</td>
                              <td className="p-2 border border-slate-300">{q.question.slice(0, 80)}...</td>
                              <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">{String(q.correctAnswer)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {p2.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <div className="font-bold text-xs uppercase text-slate-700">Phần II: Đúng / Sai (Từ Câu 1 đến Câu {p2.length})</div>
                      <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <th className="p-2 border border-slate-300 text-center w-16">STT</th>
                            <th className="p-2 border border-slate-300">Nội dung nhận định</th>
                            <th className="p-2 border border-slate-300 w-36 text-center">Đáp án (a, b, c, d)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p2.map((q, idx) => {
                            const subs = q.subItems && q.subItems.length > 0 ? q.subItems : [];
                            const ansStr = subs.map((s) => `${s.label}: ${s.isCorrect ? 'Đ' : 'S'}`).join(' | ');
                            return (
                              <tr key={idx} className="border-b border-slate-200">
                                <td className="p-2 border border-slate-300 text-center font-bold">Câu {idx + 1}</td>
                                <td className="p-2 border border-slate-300">{q.question.slice(0, 80)}...</td>
                                <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{ansStr}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {p3.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <div className="font-bold text-xs uppercase text-slate-700">Phần III: Trả lời ngắn (Từ Câu 1 đến Câu {p3.length})</div>
                      <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <th className="p-2 border border-slate-300 text-center w-16">STT</th>
                            <th className="p-2 border border-slate-300">Nội dung câu</th>
                            <th className="p-2 border border-slate-300 w-28 text-center">Đáp án</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p3.map((q, idx) => (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="p-2 border border-slate-300 text-center font-bold">Câu {idx + 1}</td>
                              <td className="p-2 border border-slate-300">{q.question.slice(0, 80)}...</td>
                              <td className="p-2 border border-slate-300 text-center font-bold text-purple-700">{String(q.correctAnswer)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {p4.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <div className="font-bold text-xs uppercase text-slate-700">Phần IV: Tự luận (Từ Câu 1 đến Câu {p4.length})</div>
                      <table className="w-full text-xs text-left border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <th className="p-2 border border-slate-300 text-center w-16">STT</th>
                            <th className="p-2 border border-slate-300">Nội dung câu & Hướng dẫn chấm</th>
                            <th className="p-2 border border-slate-300 w-24 text-center">Thang điểm</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p4.map((q, idx) => (
                            <tr key={idx} className="border-b border-slate-200">
                              <td className="p-2 border border-slate-300 text-center font-bold">Câu {idx + 1}</td>
                              <td className="p-2 border border-slate-300">
                                <p className="font-semibold">{q.question}</p>
                                <p className="text-slate-500 mt-1 italic">{q.explanation}</p>
                              </td>
                              <td className="p-2 border border-slate-300 text-center font-bold text-blue-700">{q.score}đ</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* View 3: MA TRẬN */}
            {(activeDocType === 'matrix' || activeDocType === 'full') && (
              <div className={`space-y-4 ${activeDocType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break-before' : ''}`}>
                <OfficialMatrixTable
                  chuDeList={chuDeList}
                  cauList={cauList}
                  luat={activeLuat}
                  activeCompetencies={config.nangLuc}
                />
              </div>
            )}

            {/* View 4: BẢN ĐẶC TẢ */}
            {(activeDocType === 'spec' || activeDocType === 'full') && (
              <div className={`space-y-4 ${activeDocType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break-before' : ''}`}>
                <OfficialSpecificationTable
                  chuDeList={chuDeList}
                  cauList={cauList}
                  luat={activeLuat}
                  activeCompetencies={config.nangLuc}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;
