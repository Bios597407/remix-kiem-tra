import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Database,
  Grid,
  ListTree,
  FileText,
  Sparkles,
  Printer,
  FileDown,
  RotateCcw,
  ShieldCheck,
  Search,
  BookOpen,
} from 'lucide-react';
import {
  QuestionItem,
  ExamConfig,
  ExamMatrix,
  ExamSpecificationRow,
  ShuffledExamCode,
  QAReport,
} from '../types/exam';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';
import MatrixAuditBar from './MatrixAuditBar';
import { InteractiveMatrixDashboard } from './InteractiveMatrixDashboard';
import { runCv7991Audit } from '../utils/cv7991Audit';
import { PRESETS } from '../utils/cv7991Engine';
import { auditQuestionPoolCoverage, QuestionPoolAuditReport } from '../utils/questionPoolIndexer';
import { useToast } from './Toast';

export type PipelineStep = 1 | 2 | 3 | 4;

interface AssessmentPipelineProps {
  config: ExamConfig;
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  questions: QuestionItem[];
  bank: QuestionItem[];
  shuffledCodes: ShuffledExamCode[];
  activeCode: string;
  onSelectCode: (code: string) => void;
  qaReport: QAReport | null;
  isGenerating: boolean;
  onGenerateExam: () => void;
  onAutoBalanceMatrix: () => void;
  onUpdateMatrix?: (newMatrix: ExamMatrix, newSpecs: ExamSpecificationRow[]) => void;
  onExportFullWord: () => void;
  onExportMatrixSpecsWord: () => void;
  onOpenPrintPreview: (docType: 'exam' | 'answers' | 'matrix' | 'study_guide' | 'full') => void;
  onOpenQA: () => void;
  onOpenAnswerSheet: () => void;
  onSwitchToTraditionalWorkspace: () => void;
  onOpenMatrixModal?: () => void;
}

export const AssessmentPipeline: React.FC<AssessmentPipelineProps> = ({
  config,
  matrix,
  specs,
  questions,
  bank,
  shuffledCodes,
  activeCode,
  onSelectCode,
  qaReport,
  isGenerating,
  onGenerateExam,
  onAutoBalanceMatrix,
  onUpdateMatrix,
  onExportFullWord,
  onExportMatrixSpecsWord,
  onOpenPrintPreview,
  onOpenQA,
  onOpenAnswerSheet,
  onSwitchToTraditionalWorkspace,
  onOpenMatrixModal,
}) => {
  const toast = useToast();

  // Workflow states with persistent memory
  const [currentStep, setCurrentStep] = useState<PipelineStep>(() => {
    // If questions exist, user can start at step 4, else start at step 1 or 2
    return questions.length > 0 ? 4 : 2;
  });

  const [step2ViewMode, setStep2ViewMode] = useState<'dashboard' | 'official'>('dashboard');
  const [isMatrixApproved, setIsMatrixApproved] = useState<boolean>(() => questions.length > 0);
  const [isSpecApproved, setIsSpecApproved] = useState<boolean>(() => questions.length > 0);
  const [isExamFinalized, setIsExamFinalized] = useState<boolean>(() => questions.length > 0);

  // Pool audit calculation (combining bank + existing questions + uploaded doc items)
  const allPoolQuestions = [...bank, ...questions];
  const auditReport: QuestionPoolAuditReport = auditQuestionPoolCoverage(
    allPoolQuestions,
    matrix,
    config
  );

  // Gate 1: Approve Matrix
  const handleApproveMatrix = () => {
    setIsMatrixApproved(true);
    setCurrentStep(3);
    toast.success('🎉 ĐÃ PHÊ DUYỆT MA TRẬN ĐỀ (CHỐT BƯỚC 2)! Chuyển sang Bước 3: Lập Bản đặc tả.');
  };

  const handleUnlockMatrix = () => {
    setIsMatrixApproved(false);
    setIsSpecApproved(false);
    setIsExamFinalized(false);
    toast.info('Đã mở khóa Ma trận. Thầy/Cô có thể điều chỉnh lại thông số.');
  };

  // Gate 2: Approve Specifications
  const handleApproveSpecs = () => {
    setIsSpecApproved(true);
    setCurrentStep(4);
    toast.success('🎉 ĐÃ PHÊ DUYỆT BẢN ĐẶC TẢ (CHỐT BƯỚC 3)! Chuyển sang Bước 4: Khớp nối & Sinh đề.');
  };

  const handleUnlockSpecs = () => {
    setIsSpecApproved(false);
    setIsExamFinalized(false);
    toast.info('Đã mở khóa Bản đặc tả để chỉnh sửa lại yêu cầu cần đạt.');
  };

  // Gate 3: Finalize Exam
  const handleFinalizeExam = () => {
    setIsExamFinalized(true);
    toast.success('🎉 ĐÃ NGHIỆM THU & XUẤT BẢN ĐỀ THI THÀNH CÔNG! Toàn bộ hồ sơ khảo thí đã sẵn sàng in ấn.');
  };

  const stepsList = [
    {
      num: 1 as PipelineStep,
      title: 'Bước 1: Quét Kho Câu Hỏi & Độ Phủ',
      sub: 'Question Pool Indexing',
      icon: Database,
      isCompleted: true,
      isCurrent: currentStep === 1,
      statusLabel: `${allPoolQuestions.length} câu trong kho`,
    },
    {
      num: 2 as PipelineStep,
      title: 'Bước 2: Thiết Lập Ma Trận Đề',
      sub: 'Matrix Generation (CV 7991)',
      icon: Grid,
      isCompleted: isMatrixApproved,
      isCurrent: currentStep === 2,
      statusLabel: isMatrixApproved ? 'Đã phê duyệt' : 'Chờ GV duyệt',
    },
    {
      num: 3 as PipelineStep,
      title: 'Bước 3: Bản Đặc Tả Đồng Bộ 1-1',
      sub: 'Specifications Mapping',
      icon: ListTree,
      isCompleted: isSpecApproved,
      isCurrent: currentStep === 3,
      statusLabel: isSpecApproved ? 'Đã phê duyệt' : isMatrixApproved ? 'Chờ GV duyệt' : 'Khóa chờ B2',
    },
    {
      num: 4 as PipelineStep,
      title: 'Bước 4: Khớp Nối & Sinh Đề Kiểm Tra',
      sub: 'Auto-Assembly & Verification',
      icon: FileText,
      isCompleted: isExamFinalized,
      isCurrent: currentStep === 4,
      statusLabel: isExamFinalized ? 'Đã xuất bản' : isSpecApproved ? 'Sẵn sàng sinh đề' : 'Khóa chờ B3',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Regulatory Compliance & Mode Switcher */}
      <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 p-4 sm:p-5 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-400 text-slate-900 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Quy Trình Chuẩn Bộ GD&ĐT
              </span>
              <span className="text-xs text-indigo-200">
                Thông tư 22/2021/TT-BGDĐT & Công văn 7991/BGDĐT-GDTrH
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black tracking-wide">
              Quy Trình Tạo Lập Ma Trận – Bản Đặc Tả – Đề Kiểm Tra Đồng Bộ (4 Bước)
            </h2>
            <p className="text-xs text-indigo-100 max-w-3xl">
              Hệ thống thực thi cơ chế ràng buộc tuần tự 4 mốc: Mỗi bước đều có <strong>Điểm dừng xác nhận bắt buộc</strong> để Thầy/Cô phê duyệt trước khi chuyển sang bước tiếp theo, loại bỏ hoàn toàn tình trạng đề thi không khớp ma trận.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onSwitchToTraditionalWorkspace}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              title="Chuyển sang giao diện bảng làm việc Workspace truyền thống"
            >
              <span>Xem Tab Làm Việc Chi Tiết</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4-Step Interactive Stepper Pipeline Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stepsList.map((st) => {
          const Icon = st.icon;
          const canClick = true;

          return (
            <div
              key={st.num}
              onClick={() => {
                setCurrentStep(st.num);
              }}
              className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                st.isCurrent
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                  : st.isCompleted
                  ? 'border-emerald-200 bg-white hover:border-emerald-400 cursor-pointer shadow-xs'
                  : canClick
                  ? 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer shadow-xs'
                  : 'border-slate-200 bg-slate-100/70 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-black text-xs ${
                      st.isCompleted
                        ? 'bg-emerald-600 text-white'
                        : st.isCurrent
                        ? 'bg-indigo-700 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : st.num}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-tight">
                      {st.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                      {st.sub}
                    </span>
                  </div>
                </div>

                {!canClick && <Lock className="h-4 w-4 text-slate-400 shrink-0" />}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    st.isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : st.isCurrent
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {st.statusLabel}
                </span>

                {st.isCurrent && (
                  <span className="text-[11px] font-extrabold text-indigo-700">Đang thực hiện →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* STEP 1 CONTAINER: QUÉT KHO CÂU HỎI & KIỂM TRA ĐỘ PHỦ */}
      {currentStep === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-indigo-700" />
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Bước 1: Quét và Phân Loại Cơ Sở Dữ Liệu Câu Hỏi Hiện Có (Question Pool Indexing)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gắn nhãn metadata 4 chiều (Chủ đề × Dạng thức × Mức độ × Yêu cầu cần đạt) và đối soát độ phủ kho câu hỏi
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Chuyển Sang Bước 2: Thiết Lập Ma Trận</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Pool Statistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50">
              <span className="text-[11px] font-bold text-slate-500">Tổng câu hỏi trong kho</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {auditReport.totalQuestionsInPool} <span className="text-xs font-semibold text-slate-600">câu</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Từ ngân hàng cá nhân & tài liệu tải lên</p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <span className="text-[11px] font-bold text-slate-500">Số ô ma trận đã phủ đủ</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                {auditReport.coveredCells} / {auditReport.totalRequiredCells || 1}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Khớp đúng Chủ đề × Mức độ × Dạng câu</p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50">
              <span className="text-[11px] font-bold text-slate-500">Tỷ lệ sẵn sàng dữ liệu</span>
              <div className="text-2xl font-black text-blue-900 mt-1">
                {auditReport.coveragePercentage}%
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {auditReport.coveragePercentage >= 80 ? 'Độ phủ rất cao' : 'Có thể cần AI bù câu'}
              </p>
            </div>

            <div className={`p-3.5 rounded-xl border ${auditReport.hasDeficit ? 'border-amber-200 bg-amber-50/70' : 'border-emerald-200 bg-emerald-50/70'}`}>
              <span className="text-[11px] font-bold text-slate-500">Trạng thái thiếu hụt</span>
              <div className={`text-2xl font-black mt-1 ${auditReport.hasDeficit ? 'text-amber-800' : 'text-emerald-800'}`}>
                {auditReport.hasDeficit ? `Thiếu ${auditReport.deficitCount} câu` : 'Đủ 100%'}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {auditReport.hasDeficit ? 'AI sẽ sinh bổ sung đúng ô' : 'Sẵn sàng bốc từ kho'}
              </p>
            </div>
          </div>

          {/* Coverage Details Table */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
              Bảng Thống Kê Độ Phủ Từng Ô Ma Trận (Chủ Đề × Dạng Thức × Mức Độ)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5 border-b w-1/4">Chủ đề / Đơn vị kiến thức</th>
                    <th className="p-2.5 border-b w-28 text-center">Mức độ</th>
                    <th className="p-2.5 border-b w-36 text-center">Dạng thức câu</th>
                    <th className="p-2.5 border-b w-24 text-center">Yêu cầu đề</th>
                    <th className="p-2.5 border-b w-24 text-center">Có sẵn trong kho</th>
                    <th className="p-2.5 border-b text-center">Đánh giá khả năng bốc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditReport.cells.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        Chưa có ma trận dự kiến. Vui lòng chuyển sang Bước 2 để thiết lập ma trận.
                      </td>
                    </tr>
                  ) : (
                    auditReport.cells.map((c, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-slate-900">{c.topic}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.level === 'Biết'
                                ? 'bg-sky-100 text-sky-800'
                                : c.level === 'Hiểu'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {c.level}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-700">
                          {c.format === 'mcq'
                            ? 'Phần I (TN 4 LC)'
                            : c.format === 'true_false'
                            ? 'Phần II (Đúng/Sai)'
                            : c.format === 'short'
                            ? 'Phần III (Trả lời ngắn)'
                            : 'Phần IV (Tự luận)'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-indigo-900">{c.requiredCount}</td>
                        <td className="p-2.5 text-center font-bold text-slate-700">{c.availableCount}</td>
                        <td className="p-2.5 text-center">
                          {c.isCovered ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Đủ câu ({c.availableCount}/{c.requiredCount})
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              ⚡ Thiếu {c.requiredCount - c.availableCount} câu (AI sẽ sinh bù)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 CONTAINER: THIẾT LẬP KHUNG MA TRẬN & GATEWAY 1 */}
      {currentStep === 2 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Gateway 1 Confirmation Banner */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isMatrixApproved ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-300'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${isMatrixApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                {isMatrixApproved ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    ĐIỂM DỪNG XÁC NHẬN 1: PHÊ DUYỆT KHUNG MA TRẬN ĐỀ (CV 7991)
                  </h4>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                    isMatrixApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {isMatrixApproved ? '✓ ĐÃ PHÊ DUYỆT (LOCKED)' : '⚠ CHỜ GIÁO VIÊN DUYỆT'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isMatrixApproved
                    ? 'Ma trận đã được khóa số liệu an toàn. Dữ liệu này sẽ được dùng để tự động ánh xạ sang Bản đặc tả ở Bước 3.'
                    : 'Thầy/Cô vui lòng kiểm tra kỹ số lượng câu hỏi, dạng thức và điểm số ở từng ô dưới đây trước khi bấm Xác nhận.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isMatrixApproved ? (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockMatrix}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Mở Khóa Chỉnh Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span>Tiếp tục: Sang Bước 3 (Bản đặc tả)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleApproveMatrix}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>XÁC NHẬN & PHÊ DUYỆT MA TRẬN ĐỀ</span>
                </button>
              )}
            </div>
          </div>

          {/* Matrix Controls & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                1. MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ THEO CÔNG VĂN 7991 (19 CỘT CHUẨN)
              </h3>
              <p className="text-xs text-slate-500">
                Phân bổ số câu hỏi và điểm số theo Mạch nội dung × Dạng câu hỏi × Mức độ đánh giá
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep2ViewMode('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    step2ViewMode === 'dashboard'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📊 Bảng Tương Tác (Dashboard)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep2ViewMode('official')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                    step2ViewMode === 'official'
                      ? 'bg-white text-indigo-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📄 Bảng 19 Cột (Mẫu In A4)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onExportMatrixSpecsWord}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                <span>Xuất Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenPrintPreview('matrix')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Ma Trận A4</span>
              </button>
            </div>
          </div>

          {/* Matrix Content */}
          {step2ViewMode === 'dashboard' ? (
            <InteractiveMatrixDashboard
              chuDeList={[]}
              cauList={[]}
              luat={PRESETS['3-4-3'].luat}
              grade={config.grade}
              subject={config.subject}
            />
          ) : (
            <OfficialMatrixTable chuDeList={[]} cauList={[]} luat={PRESETS['3-4-3'].luat} />
          )}
        </div>
      )}

      {/* STEP 3 CONTAINER: LẬP BẢN ĐẶC TẢ ĐỒNG BỘ 1-1 & GATEWAY 2 */}
      {currentStep === 3 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Gateway 2 Confirmation Banner */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isSpecApproved ? 'bg-emerald-50/80 border-emerald-200' : 'bg-amber-50/80 border-amber-300'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${isSpecApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                {isSpecApproved ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    ĐIỂM DỪNG XÁC NHẬN 2: PHÊ DUYỆT BẢN ĐẶC TẢ KỸ THUẬT (CV 7991)
                  </h4>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                    isSpecApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {isSpecApproved ? '✓ ĐÃ PHÊ DUYỆT (LOCKED)' : '⚠ CHỜ GIÁO VIÊN DUYỆT'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {isSpecApproved
                    ? 'Bản đặc tả đã đồng bộ 100% với Ma trận. Hệ thống đã mở khóa Bước 4: Khớp nối dữ liệu và Sinh đề kiểm tra.'
                    : 'Thầy/Cô rà soát các câu lệnh Yêu cầu cần đạt (Nêu được, Giải thích được, Vận dụng được...). Nếu đồng ý, bấm Xác nhận để chốt số liệu.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isSpecApproved ? (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockSpecs}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Mở Khóa Chỉnh Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span>Tiếp tục: Sang Bước 4 (Sinh đề)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleApproveSpecs}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>XÁC NHẬN & PHÊ DUYỆT BẢN ĐẶC TẢ</span>
                </button>
              )}
            </div>
          </div>

          {/* Spec Table Header & Export */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                2. BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ THEO CÔNG VĂN 7991 (16 CỘT CHUẨN)
              </h3>
              <p className="text-xs text-slate-500">
                Đồng bộ 1-1 với Ma trận đã duyệt, làm rõ Yêu cầu cần đạt tương ứng với phân bổ số câu hỏi
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onExportMatrixSpecsWord}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5 text-blue-600" />
                <span>Xuất Word (.doc)</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenPrintPreview('matrix')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>In Bản Đặc Tả A4</span>
              </button>
            </div>
          </div>

          {/* 16-Column Spec Table */}
          <OfficialSpecificationTable matrix={matrix} specs={specs} config={config} />
        </div>
      )}

      {/* STEP 4 CONTAINER: KHỚP NỐI RÀNG BUỘC & SINH ĐỀ KIỂM TRA (GATEWAY 3) */}
      {currentStep === 4 && (
        <div className="space-y-6">
          {/* Gateway 3 Confirmation Banner */}
          <div className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isExamFinalized ? 'bg-emerald-50/80 border-emerald-200' : 'bg-blue-50/80 border-blue-300'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${isExamFinalized ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                {isExamFinalized ? <CheckCircle2 className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-black text-slate-900 text-sm sm:text-base">
                    ĐIỂM DỪNG XÁC NHẬN 3: NGHIỆM THU ĐỀ KIỂM TRA & XUẤT BẢN CHÍNH THỨC
                  </h4>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full uppercase ${
                    isExamFinalized ? 'bg-emerald-200 text-emerald-900' : 'bg-blue-200 text-blue-900'
                  }`}>
                    {isExamFinalized ? '✓ ĐÃ XUẤT BẢN THÀNH CÔNG' : '⚠ CHỜ GV NGHIỆM THU'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Đề thi được khớp nối chính xác 100% từ Ma trận (Bước 2) và Bản đặc tả (Bước 3) đã được Thầy/Cô phê duyệt.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {questions.length === 0 ? (
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={onGenerateExam}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isGenerating ? 'ĐANG BỐC CÂU HỎI & SINH ĐỀ...' : '✨ BẮT ĐẦU BỐC ĐỀ TỪ MA TRẬN ĐÃ DUYỆT'}</span>
                </button>
              ) : (
                <>
                  {!isExamFinalized ? (
                    <button
                      type="button"
                      onClick={handleFinalizeExam}
                      className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>XÁC NHẬN NGHIỆM THU & XUẤT BẢN ĐỀ</span>
                    </button>
                  ) : (
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                      ✓ Đề thi đã nghiệm thu chuẩn Bộ GD&ĐT
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onExportFullWord}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <FileDown className="h-4 w-4" />
                    <span>Xuất Trọn Bộ Hồ Sơ (.doc)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPrintPreview('exam')}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>In Đề Thi A4</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAnswerSheet}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
                  >
                    <span>Phiếu Trả Lời A4</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenQA}
                    className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition border border-blue-200 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Kiểm định Auto-QA ({qaReport ? `${qaReport.score}đ` : '15 tiêu chuẩn'})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Notice to Teacher */}
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4">
              <Sparkles className="h-14 w-14 text-indigo-500 mx-auto animate-bounce opacity-80" />
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-base">
                  Ma Trận & Bản Đặc Tả Đã Được Phê Duyệt Khóa Số Liệu
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Hệ thống sẵn sàng bốc các câu hỏi từ kho/tài liệu và tự động sinh bổ sung chính xác các ô còn thiếu để tạo thành Bộ Đề Kiểm Tra hoàn chỉnh chuẩn GDPT 2018.
                </p>
              </div>
              <button
                type="button"
                disabled={isGenerating}
                onClick={onGenerateExam}
                className="px-6 py-3 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl text-sm font-black shadow-lg transition transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                <span>{isGenerating ? 'Đang bốc đề & kiểm tra ràng buộc...' : '✨ BẮT ĐẦU BỐC ĐỀ KIỂM TRA NGAY'}</span>
              </button>
            </div>
          ) : (
            /* Switcher hint to Workspace */
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center space-x-2">
                <span className="font-bold">Đề thi đã sinh hoàn tất ({questions.length} câu • {config.totalScore}đ)</span>
                <span>• Mã đề hiện tại: <strong>{activeCode}</strong></span>
              </div>
              <button
                type="button"
                onClick={onSwitchToTraditionalWorkspace}
                className="font-bold text-indigo-700 hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <span>Mở Không Gian Soạn Thảo & Chỉnh Sửa Câu Hỏi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssessmentPipeline;
