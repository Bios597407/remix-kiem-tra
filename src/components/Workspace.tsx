import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  HelpCircle,
  Grid,
  ListTree,
  Printer,
  FileDown,
  Copy,
  RotateCw,
  Sparkles,
  Layers,
  Share2,
  Upload,
  AlertTriangle,
  BookOpen,
  Shuffle,
  FolderArchive,
  Table as TableIcon,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  QuestionItem,
  ExamConfig,
  ChuDeItem,
  CauItem,
  LuatConfig,
  NangLucItem,
  ShuffledExamCode,
  StudyGuideData,
  ShuffleOptions,
} from '../types/exam';
import MathRenderer from '../utils/mathRenderer';
import { buildStudyGuide, generateAIStudyGuide } from '../utils/studyGuideBuilder';
import { useToast } from './Toast';
import OfficialExamHeader from './OfficialExamHeader';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';
import InteractiveMatrixDashboard from './InteractiveMatrixDashboard';
import {
  exportFullDossierCv7991WordDoc,
  exportMatrixAndSpecsCv7991WordDoc,
  exportStandardExamWordDoc,
} from '../utils/exporter';
import { downloadStandardExamDocx } from '../utils/docxExporter';
import { downloadAllExamCodesZip } from '../utils/multiCodeExporter';
import { generateShuffledCodes } from '../utils/examShuffler';
import { AzotaExportModal } from './AzotaExportModal';
import { ShuffleModal } from './ShuffleModal';
import { MasterComparisonMatrixView } from './MasterComparisonMatrixView';

interface WorkspaceProps {
  config: ExamConfig;
  chuDeList: ChuDeItem[];
  cauList: CauItem[];
  luat: LuatConfig;
  nangLucList: NangLucItem[];
  questions: QuestionItem[];
  activeTab: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide' | 'comparison';
  onTabChange: (tab: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide' | 'comparison') => void;
  onUpdateCauList?: (updated: CauItem[]) => void;
  onPrint: (type: 'exam' | 'answers' | 'matrix' | 'study_guide' | 'full', examCode?: string) => void;
  onOpenStandardExporter?: () => void;
  onConfigChange?: (updated: ExamConfig) => void;
  auditPassed: boolean;
  shuffledCodes?: ShuffledExamCode[];
  onUpdateShuffledCodes?: (codes: ShuffledExamCode[]) => void;
  activeExamCode?: string;
  onSelectExamCode?: (code: string) => void;
  onLoadSampleExam?: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  config,
  chuDeList,
  cauList,
  luat,
  nangLucList,
  questions,
  activeTab,
  onTabChange,
  onUpdateCauList,
  onPrint,
  onOpenStandardExporter,
  onConfigChange,
  auditPassed,
  shuffledCodes: externalShuffledCodes,
  onUpdateShuffledCodes,
  activeExamCode: externalActiveCode,
  onSelectExamCode,
  onLoadSampleExam,
}) => {
  const toast = useToast();
  const [showAzotaModal, setShowAzotaModal] = useState(false);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [aiStudyGuide, setAiStudyGuide] = useState<StudyGuideData | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Local state for shuffled codes if not controlled from above
  const [localShuffledCodes, setLocalShuffledCodes] = useState<ShuffledExamCode[]>([]);
  const shuffledCodes = externalShuffledCodes && externalShuffledCodes.length > 0 ? externalShuffledCodes : localShuffledCodes;

  // Active code selection (or 'matrix_comparison' to show master comparison matrix)
  const [selectedSubTab, setSelectedSubTab] = useState<string>('101');

  // Keep selectedSubTab in sync if external active code changes
  useEffect(() => {
    if (externalActiveCode) {
      setSelectedSubTab(externalActiveCode);
    }
  }, [externalActiveCode]);

  // Guaranteed list of codes (automatically generates 4 codes 101-104 if questions exist)
  const displayCodes = useMemo(() => {
    if (shuffledCodes && shuffledCodes.length > 0) return shuffledCodes;
    if (questions && questions.length > 0) {
      return generateShuffledCodes(questions, { variantCount: 4, namingPreset: '101' }, config.grade);
    }
    return [];
  }, [shuffledCodes, questions, config.grade]);

  // When new questions arrive and no codes yet, initialize 4 standard codes
  useEffect(() => {
    if (questions && questions.length > 0 && shuffledCodes.length === 0) {
      const initialCodes = generateShuffledCodes(questions, { variantCount: 4, namingPreset: '101' }, config.grade);
      if (onUpdateShuffledCodes) {
        onUpdateShuffledCodes(initialCodes);
      } else {
        setLocalShuffledCodes(initialCodes);
      }
    }
  }, [questions]);

  // Active variant questions
  const activeVariant = useMemo(() => {
    if (displayCodes.length === 0) {
      return { code: '101', questions, isBase: true };
    }
    const found = displayCodes.find((c) => c.code === selectedSubTab);
    return found || displayCodes[0];
  }, [displayCodes, selectedSubTab, questions]);

  const activeQuestions = activeVariant ? activeVariant.questions : questions;
  const activeCodeDisplay = activeVariant ? activeVariant.code : '101';

  // Handle Shuffling Execution
  const handleExecuteShuffle = (options: ShuffleOptions) => {
    if (!questions || questions.length === 0) {
      toast.error('Chưa có câu hỏi trong đề gốc để trộn! Vui lòng bấm Tạo Đề Thi Với AI trước.');
      return;
    }

    try {
      const generated = generateShuffledCodes(questions, options, config.grade);
      if (onUpdateShuffledCodes) {
        onUpdateShuffledCodes(generated);
      } else {
        setLocalShuffledCodes(generated);
      }
      setSelectedSubTab(generated[0]?.code || '101');
      if (onSelectExamCode && generated[0]?.code) {
        onSelectExamCode(generated[0].code);
      }
      onTabChange('exam');
      toast.success(
        `🎉 Đã trộn thành công ${generated.length} mã đề (${generated.map((c) => c.code).join(', ')}) theo chuẩn CV 7991!`
      );
    } catch (err: unknown) {
      console.error('Shuffle error:', err);
      toast.error('Lỗi khi trộn mã đề');
    }
  };

  const handleExportDocx = async (mode: 'full' | 'examOnly') => {
    if (!activeQuestions || activeQuestions.length === 0) {
      toast.error('Chưa có câu hỏi đề thi! Vui lòng bấm Tạo Đề Thi Với AI trước.');
      return;
    }
    try {
      setIsExportingDocx(true);
      const codeLabel = activeCodeDisplay;
      toast.info(
        mode === 'full'
          ? `⏳ Đang xuất file Word (.docx) Đầy đủ cho Mã đề ${codeLabel}...`
          : `⏳ Đang xuất file Word (.docx) Đề học sinh cho Mã đề ${codeLabel}...`
      );
      await downloadStandardExamDocx(config, activeQuestions, { mode, examCode: codeLabel });
      toast.success(
        mode === 'full'
          ? `🎉 Đã tải file Word (.docx) Đầy đủ cho Mã ${codeLabel}!`
          : `🎉 Đã tải file Word (.docx) Đề thi học sinh cho Mã ${codeLabel}!`
      );
    } catch (err: unknown) {
      console.error('Docx export failed:', err);
      toast.error(`Lỗi xuất file Word: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Download All Variants in a Single ZIP
  const handleDownloadAllZip = async () => {
    const targetCodes = displayCodes.length > 0 ? displayCodes : shuffledCodes;
    if (!targetCodes || targetCodes.length === 0) {
      toast.error('Chưa có danh sách mã đề!');
      return;
    }
    try {
      setIsExportingZip(true);
      toast.info(`⏳ Đang đóng gói trọn bộ ${targetCodes.length} mã đề kèm Bảng ma trận đối chiếu vào file ZIP...`);
      await downloadAllExamCodesZip(config, targetCodes, { mode: 'full' });
      toast.success(`🎉 Đã tải trọn bộ file ZIP chứa ${targetCodes.length} mã đề và Bảng đối chiếu!`);
    } catch (err: unknown) {
      console.error('Zip export error:', err);
      toast.error('Lỗi khi tải file ZIP trọn bộ mã đề');
    } finally {
      setIsExportingZip(false);
    }
  };

  const defaultStudyGuide = useMemo(() => buildStudyGuide(config, questions), [config, questions]);
  const studyGuide = aiStudyGuide || defaultStudyGuide;

  const handleSynthesizeAIStudyGuide = async () => {
    setIsGeneratingGuide(true);
    try {
      const guide = await generateAIStudyGuide(config, questions);
      setAiStudyGuide(guide);
      toast.success('🎉 Gemini AI đã tổng hợp thành công Cẩm Nang Ôn Tập!');
    } catch (err: unknown) {
      console.error('AI Study guide error', err);
      toast.error(`Không thể tổng hợp Cẩm nang: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const getDisplayScaleStyle = (scale?: 'compact' | 'standard' | 'relaxed') => {
    switch (scale) {
      case 'compact':
        return { fontSize: '14px', lineHeight: 1.35 };
      case 'relaxed':
        return { fontSize: '18px', lineHeight: 1.65 };
      case 'standard':
      default:
        return { fontSize: '16px', lineHeight: 1.5 };
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation Tabs */}
      <div className="no-print border-b border-slate-200 bg-white rounded-2xl p-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Main Module Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'matrix', label: 'MA TRẬN ĐỀ', icon: Grid },
              { id: 'spec', label: 'BẢN ĐẶC TẢ', icon: ListTree },
              {
                id: 'exam',
                label: 'ĐỀ KIỂM TRA',
                icon: FileText,
                count: questions.length,
                badge: displayCodes.length > 1 ? `${displayCodes.length} mã` : undefined,
              },
              {
                id: 'comparison',
                label: 'ĐỐI CHIẾU MÃ ĐỀ',
                icon: TableIcon,
                badge: displayCodes.length > 1 ? `${displayCodes.length} mã` : undefined,
              },
              { id: 'answers', label: 'BẢNG ĐÁP ÁN', icon: CheckCircle },
              { id: 'rubric', label: 'HƯỚNG DẪN CHẤM', icon: HelpCircle },
              { id: 'study_guide', label: 'ĐỀ CƯƠNG ÔN TẬP', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-black transition rounded-lg cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-amber-950 ml-0.5">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Nút Trộn Mã Đề (LỰA CHỌN A - CV 7991) */}
            <button
              onClick={() => setShowShuffleModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition shadow-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white cursor-pointer ring-1 ring-purple-400/40"
              title="Trộn đề thi thành nhiều mã đề (101, 102, 103, 104...) theo chuẩn Công văn 7991"
            >
              <Shuffle className="h-3.5 w-3.5 text-amber-300" />
              <span>Trộn Mã Đề</span>
              {displayCodes.length > 1 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
                  {displayCodes.length}
                </span>
              )}
            </button>

            {/* Nút Tải Trọn Bộ ZIP nếu đã có nhiều mã */}
            {displayCodes.length > 1 && (
              <button
                onClick={handleDownloadAllZip}
                disabled={isExportingZip}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                title={`Tải gói ZIP trọn bộ ${displayCodes.length} file Word mã đề + Bảng đối chiếu`}
              >
                <FolderArchive className="h-3.5 w-3.5 text-amber-300" />
                <span>{isExportingZip ? 'Đang nén ZIP...' : `📦 Tải Trọn Bộ ZIP (${displayCodes.length} Mã)`}</span>
              </button>
            )}

            {/* Nút Xuất đề (theo form chuẩn) */}
            {onOpenStandardExporter && (
              <button
                onClick={onOpenStandardExporter}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition shadow-md bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white cursor-pointer ring-2 ring-amber-300"
                title="Xuất đề (theo form chuẩn) - Mở giao diện xem trước, in và tải file .docx chuẩn 100%"
              >
                <FileDown className="h-4 w-4 text-white" />
                <span>Xuất Form Chuẩn</span>
              </button>
            )}

            {/* Xuất Word (.docx) Đầy đủ theo mã đang chọn */}
            <button
              onClick={() => handleExportDocx('full')}
              disabled={isExportingDocx}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                !isExportingDocx
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title={`Xuất file Word (.docx) Mã ${activeCodeDisplay} Đầy đủ`}
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>{isExportingDocx ? 'Đang tạo...' : `Word Mã ${activeCodeDisplay} Đầy Đủ`}</span>
            </button>

            {/* Xuất Word (.docx) Đề Cho Học Sinh */}
            <button
              onClick={() => handleExportDocx('examOnly')}
              disabled={isExportingDocx}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                !isExportingDocx
                  ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title={`Xuất file Word (.docx) Mã ${activeCodeDisplay} chỉ phần Đề cho HS`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Word Đề Cho HS</span>
            </button>

            {/* Xuất Word Ma trận & Đặc tả */}
            <button
              onClick={() => {
                exportMatrixAndSpecsCv7991WordDoc(config, chuDeList, cauList, luat);
                toast.success('📥 Đang tải file Word Ma trận & Bản đặc tả...');
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              title="Xuất Ma trận & Bản đặc tả sang Word (.doc)"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Ma Trận & Đặc Tả</span>
            </button>

            {/* Xuất Azota / K12 */}
            <button
              onClick={() => setShowAzotaModal(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
              title="Xuất dạng Azota / K12Online"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Azota</span>
            </button>

            {/* In & Export PDF */}
            <button
              onClick={() => onPrint(activeTab as any, activeCodeDisplay)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              title="In ấn hoặc xuất PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In & PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content 1: MA TRẬN ĐỀ KIỂM TRA (VỚI BẢNG CÂU & AUDIT) */}
      {activeTab === 'matrix' && (
        <InteractiveMatrixDashboard
          chuDeList={chuDeList}
          cauList={cauList}
          luat={luat}
          activeCompetencies={nangLucList}
          grade={config.grade}
          subject={config.subject}
          onUpdateCauList={onUpdateCauList}
          showSpecTab={false}
          defaultTab="matrix"
        />
      )}

      {/* Tab Content 2: BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KÌ (TRỰC TIẾP, KHÔNG TRÙNG NÚT) */}
      {activeTab === 'spec' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <OfficialSpecificationTable
            chuDeList={chuDeList}
            cauList={cauList}
            luat={luat}
            activeCompetencies={nangLucList}
            config={config}
          />
        </div>
      )}

      {/* Tab 2: ĐỀ KIỂM TRA (VỚI THANH CHỌN MÃ ĐỀ & BẢNG ĐỐI CHIẾU) */}
      {activeTab === 'exam' && (
        <div className="space-y-4">
          {/* Sub-Header: Variant Selection Bar - Always visible */}
          <div className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-2.5 shadow-md border border-slate-800 text-white flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5 pl-2">
                <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                <span>MÃ ĐỀ THI:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {displayCodes.map((item, idx) => {
                  const isSelected = selectedSubTab === item.code;
                  return (
                    <button
                      key={item.code}
                      onClick={() => {
                        setSelectedSubTab(item.code);
                        if (onSelectExamCode) onSelectExamCode(item.code);
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {idx === 0 ? (
                        <>
                          <span className="text-amber-300">⭐</span>
                          <span>Mã {item.code} (Gốc)</span>
                        </>
                      ) : (
                        <span>Mã {item.code}</span>
                      )}
                    </button>
                  );
                })}

                {/* Sub-tab: Bảng đối chiếu đáp án */}
                <button
                  onClick={() => setSelectedSubTab('matrix_comparison')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    selectedSubTab === 'matrix_comparison'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md ring-2 ring-amber-300'
                      : 'bg-white/10 text-amber-200 hover:bg-white/20'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>📑 Bảng Đối Chiếu Đáp Án</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pr-1">
              <button
                onClick={() => setShowShuffleModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-amber-400" />
                <span>⚙️ Cấu hình trộn lại</span>
              </button>
            </div>
          </div>

          {/* If Sub-Tab is Master Comparison Matrix */}
          {selectedSubTab === 'matrix_comparison' ? (
            <MasterComparisonMatrixView
              config={config}
              shuffledCodes={displayCodes}
              onSelectCode={(c) => setSelectedSubTab(c)}
            />
          ) : (
            /* Render Exam Sheet for Active Variant */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
              <OfficialExamHeader config={config} activeCode={activeCodeDisplay} />

              {activeQuestions.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-sm">Chưa có câu hỏi cho đề thi này.</p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Thầy/Cô có thể bấm "TẠO ĐỀ THI VỚI AI" ở bảng cấu hình hoặc nhấn nút dưới đây để nạp ngay bộ đề mẫu chuẩn CV 7991 (gồm 4 mã đề 101 - 104 & Bảng đối chiếu) để trải nghiệm:
                  </p>
                  {onLoadSampleExam && (
                    <button
                      onClick={onLoadSampleExam}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>✨ Nạp Bộ Đề Mẫu Chuẩn CV 7991 (Sẵn 4 Mã 101-104)</span>
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="space-y-6 font-exam text-slate-900"
                  style={getDisplayScaleStyle(config.appUiScale)}
                >
                  {/* Indicator for variant */}
                  {displayCodes.length > 1 && (
                    <div className="no-print p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
                      <div className="flex items-center space-x-2 font-bold">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-mono">
                          MÃ ĐỀ: {activeCodeDisplay}
                        </span>
                        <span>
                          {activeVariant?.isBase
                            ? 'Đây là Mã đề gốc 101'
                            : `Đã hoán vị an toàn theo chuẩn CV 7991 (khóa ngữ liệu & cập nhật key)`}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedSubTab('matrix_comparison')}
                        className="text-blue-700 hover:text-blue-900 underline font-bold cursor-pointer"
                      >
                        Xem bảng đối chiếu đáp án song song →
                      </button>
                    </div>
                  )}

                  {(() => {
                    const p1 = activeQuestions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
                    const p2 = activeQuestions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
                    const p3 = activeQuestions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
                    const p4 = activeQuestions.filter((q) => q.part === 'part4' || q.type === 'essay');
                    const others = activeQuestions.filter((q) => !p1.includes(q) && !p2.includes(q) && !p3.includes(q) && !p4.includes(q));

                    const p1Score = p1.reduce((s, q) => s + (q.score || 0.25), 0);
                    const p2Score = p2.reduce((s, q) => s + (q.score || 1.0), 0);
                    const p3Score = p3.reduce((s, q) => s + (q.score || 0.5), 0);
                    const p4Score = p4.reduce((s, q) => s + (q.score || 1.0), 0);
                    const fmtScore = (num: number) => (num % 1 === 0 ? `${num},0` : num.toFixed(2).replace('.', ','));

                    return (
                      <div className="space-y-8">
                        {/* PHẦN I */}
                        {p1.length > 0 && (
                          <div className="space-y-4">
                            <div className="border-b-2 border-slate-800 pb-1.5">
                              <h4 className="font-black text-sm uppercase tracking-wide text-slate-900">
                                PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN ({fmtScore(p1Score)} điểm)
                              </h4>
                              <p className="text-xs italic text-slate-600 mt-0.5">
                                Thí sinh chọn một phương án trả lời đúng duy nhất trong mỗi câu hỏi từ Câu 1 đến Câu {p1.length}.
                              </p>
                            </div>

                            <div className="space-y-4">
                              {p1.map((q, idx) => (
                                <div
                                  key={q.id || idx}
                                  className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                >
                                  <div className="font-bold flex items-start justify-between">
                                    <div>
                                      Câu {idx + 1} ({q.score || 0.25} điểm): <MathRenderer text={q.question} />
                                    </div>
                                  </div>

                                  {q.passage && (
                                    <div className="p-3 bg-amber-50/50 rounded-lg border-l-4 border-amber-400 text-xs italic text-slate-800">
                                      <MathRenderer text={q.passage} />
                                    </div>
                                  )}

                                  {q.options && q.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 text-xs font-mono">
                                      {q.options.map((opt, oIdx) => (
                                        <div
                                          key={oIdx}
                                          className="p-1.5 rounded bg-slate-50 border border-slate-200 flex items-center"
                                        >
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

                        {/* PHẦN II */}
                        {p2.length > 0 && (
                          <div className="space-y-4 pt-4 border-t-2 border-slate-300">
                            <div className="border-b-2 border-slate-800 pb-1.5">
                              <h4 className="font-black text-sm uppercase tracking-wide text-slate-900">
                                PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI ({fmtScore(p2Score)} điểm)
                              </h4>
                              <p className="text-xs italic text-slate-600 mt-0.5">
                                Thí sinh trả lời từ Câu 1 đến Câu {p2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
                              </p>
                            </div>

                            <div className="space-y-4">
                              {p2.map((q, idx) => (
                                <div
                                  key={q.id || idx}
                                  className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                >
                                  <div className="font-bold flex items-start justify-between">
                                    <div>
                                      Câu {idx + 1} ({q.score || 1.0} điểm): <MathRenderer text={q.question} />
                                    </div>
                                  </div>

                                  {q.passage && (
                                    <div className="p-3 bg-amber-50/50 rounded-lg border-l-4 border-amber-400 text-xs italic text-slate-800">
                                      <MathRenderer text={q.passage} />
                                    </div>
                                  )}

                                  {q.subItems && q.subItems.length > 0 && (
                                    <div className="pl-4 space-y-1.5 text-xs">
                                      {q.subItems.map((sub, sIdx) => (
                                        <div key={sIdx} className="flex items-start space-x-2">
                                          <span className="font-bold text-slate-900">{sub.label})</span>
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

                        {/* PHẦN III */}
                        {p3.length > 0 && (
                          <div className="space-y-4 pt-4 border-t-2 border-slate-300">
                            <div className="border-b-2 border-slate-800 pb-1.5">
                              <h4 className="font-black text-sm uppercase tracking-wide text-slate-900">
                                PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN ({fmtScore(p3Score)} điểm)
                              </h4>
                              <p className="text-xs italic text-slate-600 mt-0.5">
                                Thí sinh trả lời từ Câu 1 đến Câu {p3.length}. Thí sinh viết câu trả lời ngắn vào phiếu làm bài.
                              </p>
                            </div>

                            <div className="space-y-4">
                              {p3.map((q, idx) => (
                                <div
                                  key={q.id || idx}
                                  className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                >
                                  <div className="font-bold flex items-start justify-between">
                                    <div>
                                      Câu {idx + 1} ({q.score || 0.5} điểm): <MathRenderer text={q.question} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* PHẦN IV */}
                        {p4.length > 0 && (
                          <div className="space-y-4 pt-4 border-t-2 border-slate-300">
                            <div className="border-b-2 border-slate-800 pb-1.5">
                              <h4 className="font-black text-sm uppercase tracking-wide text-slate-900">
                                PHẦN IV. TỰ LUẬN ({fmtScore(p4Score)} điểm)
                              </h4>
                              <p className="text-xs italic text-slate-600 mt-0.5">
                                Thí sinh trình bày chi tiết lời giải từ Câu 1 đến Câu {p4.length} vào giấy làm bài.
                              </p>
                            </div>

                            <div className="space-y-4">
                              {p4.map((q, idx) => (
                                <div
                                  key={q.id || idx}
                                  className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                >
                                  <div className="font-bold flex items-start justify-between">
                                    <div>
                                      Câu {idx + 1} ({q.score || 1.0} điểm): <MathRenderer text={q.question} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Other questions if any */}
                        {others.length > 0 && (
                          <div className="space-y-4 pt-4 border-t-2 border-slate-300">
                            {others.map((q, idx) => (
                              <div
                                key={q.id || idx}
                                className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                              >
                                <div className="font-bold flex items-start justify-between">
                                  <div>
                                    Câu {idx + 1} ({q.score || 0.25} điểm): <MathRenderer text={q.question} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab: ĐỐI CHIẾU MÃ ĐỀ (Từ Navigation Tabs chính) */}
      {activeTab === 'comparison' && (
        <MasterComparisonMatrixView
          config={config}
          shuffledCodes={displayCodes}
          onSelectCode={(c) => {
            setSelectedSubTab(c);
            onTabChange('exam');
            if (onSelectExamCode) onSelectExamCode(c);
          }}
        />
      )}

      {/* Tab 3: BẢNG ĐÁP ÁN (HỖ TRỢ THEO TỪNG MÃ ĐỀ & BẢNG TỔNG HỢP) */}
      {activeTab === 'answers' && (
        <div className="space-y-4">
          {displayCodes.length > 1 && (
            <div className="no-print flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-700">Xem đáp án cho:</span>
                <div className="flex flex-wrap gap-1">
                  {displayCodes.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => setSelectedSubTab(item.code)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        selectedSubTab === item.code
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Mã {item.code}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedSubTab('matrix_comparison')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      selectedSubTab === 'matrix_comparison'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    📑 Bảng Ma Trận Đối Chiếu
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedSubTab === 'matrix_comparison' ? (
            <MasterComparisonMatrixView
              config={config}
              shuffledCodes={displayCodes}
              onSelectCode={(c) => setSelectedSubTab(c)}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 text-xs">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-800 text-sm uppercase">
                  Bảng Đáp Án Chi Tiết - MÃ ĐỀ {activeCodeDisplay}
                </h3>
                {activeVariant?.isBase ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                    Đề Gốc (101)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    Mã Đã Trộn (CV 7991)
                  </span>
                )}
              </div>

              {(() => {
                const p1 = activeQuestions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
                const p2 = activeQuestions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
                const p3 = activeQuestions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
                const p4 = activeQuestions.filter((q) => q.part === 'part4' || q.type === 'essay');

                const baseP1 = shuffledCodes[0]?.questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single') || [];
                const baseP2 = shuffledCodes[0]?.questions.filter((q) => q.part === 'part2' || q.type === 'true_false_group') || [];
                const baseP3 = shuffledCodes[0]?.questions.filter((q) => q.part === 'part3' || q.type === 'short_answer') || [];
                const baseP4 = shuffledCodes[0]?.questions.filter((q) => q.part === 'part4' || q.type === 'essay') || [];

                return (
                  <div className="space-y-6">
                    {/* Phần I answers table */}
                    {p1.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-bold text-xs uppercase text-slate-800 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Phần I: Câu trắc nghiệm nhiều phương án (Từ Câu 1 đến Câu {p1.length})</span>
                          <span className="text-blue-700">Mỗi câu đúng 0,25 điểm</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-300">
                                <th className="p-2 border border-slate-300 text-center w-14">STT</th>
                                {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                  <th className="p-2 border border-slate-300 text-center w-28">Vị trí gốc (101)</th>
                                )}
                                <th className="p-2 border border-slate-300">Nội dung câu hỏi tóm tắt</th>
                                <th className="p-2 border border-slate-300 w-24 text-center">Đáp án</th>
                                <th className="p-2 border border-slate-300 w-20 text-center">Điểm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p1.map((q, idx) => {
                                let baseStt = idx + 1;
                                if (!activeVariant?.isBase && baseP1.length > 0) {
                                  const fIdx = baseP1.findIndex((bq) => bq.id === q.id);
                                  if (fIdx >= 0) baseStt = fIdx + 1;
                                }

                                return (
                                  <tr key={q.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="p-2 text-center font-bold text-slate-800">Câu {idx + 1}</td>
                                    {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                      <td className="p-2 text-center text-slate-500 font-mono text-[11px]">
                                        Phần I - Câu {baseStt}
                                      </td>
                                    )}
                                    <td className="p-2 font-mono">
                                      <MathRenderer text={q.question} />
                                    </td>
                                    <td className="p-2 text-center font-black text-emerald-700 bg-emerald-50/30">
                                      {String(q.correctAnswer || 'A').toUpperCase()}
                                    </td>
                                    <td className="p-2 text-center font-bold text-blue-700">{q.score || 0.25}đ</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Phần II answers table */}
                    {p2.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="font-bold text-xs uppercase text-slate-800 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Phần II: Câu trắc nghiệm Đúng / Sai (Từ Câu 1 đến Câu {p2.length})</span>
                          <span className="text-amber-800 text-[11px]">Đúng 1 ý: 0,1đ | 2 ý: 0,25đ | 3 ý: 0,5đ | 4 ý: 1,0đ</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-300">
                                <th className="p-2 border border-slate-300 text-center w-14">STT</th>
                                {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                  <th className="p-2 border border-slate-300 text-center w-28">Vị trí gốc (101)</th>
                                )}
                                <th className="p-2 border border-slate-300">Nội dung câu hỏi</th>
                                <th className="p-2 border border-slate-300 w-44 text-center">Đáp án các lệnh (a, b, c, d)</th>
                                <th className="p-2 border border-slate-300 w-20 text-center">Điểm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p2.map((q, idx) => {
                                let baseStt = idx + 1;
                                if (!activeVariant?.isBase && baseP2.length > 0) {
                                  const fIdx = baseP2.findIndex((bq) => bq.id === q.id);
                                  if (fIdx >= 0) baseStt = fIdx + 1;
                                }

                                const subs = q.subItems && q.subItems.length > 0 ? q.subItems : [];
                                const displayAns = subs.map((s) => `${s.label}: ${s.isCorrect ? 'Đ' : 'S'}`).join(' | ');

                                return (
                                  <tr key={q.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="p-2 text-center font-bold text-slate-800">Câu {idx + 1}</td>
                                    {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                      <td className="p-2 text-center text-slate-500 font-mono text-[11px]">
                                        Phần II - Câu {baseStt}
                                      </td>
                                    )}
                                    <td className="p-2 font-mono">
                                      <MathRenderer text={q.question} />
                                    </td>
                                    <td className="p-2 text-center font-black text-blue-700 bg-blue-50/30">
                                      {displayAns}
                                    </td>
                                    <td className="p-2 text-center font-bold text-blue-700">{q.score || 1.0}đ</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Phần III answers table */}
                    {p3.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="font-bold text-xs uppercase text-slate-800 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Phần III: Câu trắc nghiệm trả lời ngắn (Từ Câu 1 đến Câu {p3.length})</span>
                          <span className="text-purple-700">Mỗi câu đúng {p3[0]?.score || 0.5} điểm</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-300">
                                <th className="p-2 border border-slate-300 text-center w-14">STT</th>
                                {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                  <th className="p-2 border border-slate-300 text-center w-28">Vị trí gốc (101)</th>
                                )}
                                <th className="p-2 border border-slate-300">Nội dung câu hỏi</th>
                                <th className="p-2 border border-slate-300 w-32 text-center">Đáp án chính xác</th>
                                <th className="p-2 border border-slate-300 w-20 text-center">Điểm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p3.map((q, idx) => {
                                let baseStt = idx + 1;
                                if (!activeVariant?.isBase && baseP3.length > 0) {
                                  const fIdx = baseP3.findIndex((bq) => bq.id === q.id);
                                  if (fIdx >= 0) baseStt = fIdx + 1;
                                }

                                return (
                                  <tr key={q.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="p-2 text-center font-bold text-slate-800">Câu {idx + 1}</td>
                                    {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                      <td className="p-2 text-center text-slate-500 font-mono text-[11px]">
                                        Phần III - Câu {baseStt}
                                      </td>
                                    )}
                                    <td className="p-2 font-mono">
                                      <MathRenderer text={q.question} />
                                    </td>
                                    <td className="p-2 text-center font-black text-purple-700 bg-purple-50/30">
                                      {String(q.correctAnswer || '')}
                                    </td>
                                    <td className="p-2 text-center font-bold text-blue-700">{q.score || 0.5}đ</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Phần IV answers table */}
                    {p4.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="font-bold text-xs uppercase text-slate-800 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span>Phần IV: Tự luận (Từ Câu 1 đến Câu {p4.length})</span>
                          <span className="text-slate-600">Xem hướng dẫn chấm chi tiết ở tab HƯỚNG DẪN CHẤM</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-50 font-bold border-b border-slate-300">
                                <th className="p-2 border border-slate-300 text-center w-14">STT</th>
                                {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                  <th className="p-2 border border-slate-300 text-center w-28">Vị trí gốc (101)</th>
                                )}
                                <th className="p-2 border border-slate-300">Nội dung câu hỏi & Hướng dẫn tóm tắt</th>
                                <th className="p-2 border border-slate-300 w-20 text-center">Điểm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {p4.map((q, idx) => {
                                let baseStt = idx + 1;
                                if (!activeVariant?.isBase && baseP4.length > 0) {
                                  const fIdx = baseP4.findIndex((bq) => bq.id === q.id);
                                  if (fIdx >= 0) baseStt = fIdx + 1;
                                }

                                return (
                                  <tr key={q.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                                    <td className="p-2 text-center font-bold text-slate-800">Câu {idx + 1}</td>
                                    {shuffledCodes.length > 1 && !activeVariant?.isBase && (
                                      <td className="p-2 text-center text-slate-500 font-mono text-[11px]">
                                        Phần IV - Câu {baseStt}
                                      </td>
                                    )}
                                    <td className="p-2 font-mono">
                                      <MathRenderer text={q.question} />
                                      {q.explanation && (
                                        <div className="text-slate-500 text-[11px] mt-1 italic">
                                          HD: <MathRenderer text={q.explanation} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-2 text-center font-bold text-blue-700">{q.score || 1.0}đ</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: HƯỚNG DẪN CHẤM */}
      {activeTab === 'rubric' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm uppercase">Hướng Dẫn Chấm Tự Luận Step-by-Step</h3>
          <div className="space-y-3">
            {activeQuestions
              .filter((q) => q.part === 'part4' || q.type === 'essay')
              .map((q, idx) => (
                <div key={q.id || idx} className="p-4 border rounded-xl bg-slate-50 space-y-2">
                  <p className="font-bold">
                    Câu Tự Luận {idx + 1} ({q.score} điểm): <MathRenderer text={q.question} />
                  </p>
                  <div className="text-slate-700 bg-white p-3 rounded border space-y-1">
                    <p className="font-semibold text-slate-800">Hướng dẫn chấm & Thang điểm:</p>
                    <MathRenderer text={q.explanation} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tab 5: ĐỀ CƯƠNG ÔN TẬP */}
      {activeTab === 'study_guide' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase">Đề Cương Ôn Tập & Cẩm Nang Tự Học</h3>
              <p className="text-slate-500">Tự động tổng hợp khái niệm cốt lõi và các bẫy sai kinh điển</p>
            </div>
            <button
              onClick={handleSynthesizeAIStudyGuide}
              disabled={isGeneratingGuide}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGeneratingGuide ? 'Đang tổng hợp...' : 'AI Tổng Hợp Cẩm Nang'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-indigo-900">Khái niệm & Công thức trọng tâm:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {studyGuide.coreConcepts.map((c, i) => (
                  <li key={i}>
                    <strong>{c.term}:</strong> {c.definition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cấu hình Trộn Nhiều Mã Đề (Lựa chọn A) */}
      {showShuffleModal && (
        <ShuffleModal
          isOpen={showShuffleModal}
          onClose={() => setShowShuffleModal(false)}
          onConfirm={handleExecuteShuffle}
          grade={config.grade}
          questionCount={questions.length}
        />
      )}

      {/* Modal Xuất Azota & K12Online */}
      {showAzotaModal && (
        <AzotaExportModal
          isOpen={showAzotaModal}
          onClose={() => setShowAzotaModal(false)}
          questions={activeQuestions}
          config={config}
        />
      )}
    </div>
  );
};

export default Workspace;
