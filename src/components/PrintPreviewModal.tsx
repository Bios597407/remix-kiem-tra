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
}) => {
  const toast = useToast();
  const [activeDocType, setActiveDocType] = useState<PrintDocType>(docType);

  if (!isOpen) return null;

  const activeLuat = luat || config.luat || DEFAULT_LUAT;

  const handlePrint = () => {
    window.print();
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
          <div className="max-w-[210mm] mx-auto bg-white p-10 shadow-lg rounded-sm print-sheet text-slate-900 space-y-6">
            {/* View 1: ĐỀ KIỂM TRA */}
            {(activeDocType === 'exam' || activeDocType === 'full') && (
              <div className="space-y-6">
                <OfficialExamHeader config={config} activeCode="101" />

                <div className="space-y-4 font-serif text-sm leading-relaxed">
                  {questions.map((q, idx) => (
                    <div key={q.id || idx} className="space-y-1">
                      <p className="font-bold">
                        Câu {idx + 1} ({q.score || 0.25} điểm): <MathRenderer text={q.question} />
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pl-4 text-xs font-mono">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx}>
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

            {/* View 2: BẢNG ĐÁP ÁN */}
            {(activeDocType === 'answers' || activeDocType === 'full') && (
              <div className={`space-y-4 ${activeDocType === 'full' ? 'pt-8 border-t-2 border-slate-300 page-break-before' : ''}`}>
                <div className="text-center font-bold text-sm uppercase">
                  BẢNG ĐÁP ÁN CHÍNH THỨC – {config.examTitle}
                </div>
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="p-2 border border-slate-300 text-center w-12">STT</th>
                      <th className="p-2 border border-slate-300">Nội dung câu</th>
                      <th className="p-2 border border-slate-300 w-24 text-center">Đáp án</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border border-slate-300">{q.question.slice(0, 80)}...</td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-emerald-700">{String(q.correctAnswer)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
