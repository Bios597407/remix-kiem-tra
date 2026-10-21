import React, { useState, useMemo } from 'react';
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
import { AzotaExportModal } from './AzotaExportModal';

interface WorkspaceProps {
  config: ExamConfig;
  chuDeList: ChuDeItem[];
  cauList: CauItem[];
  luat: LuatConfig;
  nangLucList: NangLucItem[];
  questions: QuestionItem[];
  activeTab: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide';
  onTabChange: (tab: 'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide') => void;
  onUpdateCauList?: (updated: CauItem[]) => void;
  onPrint: (type: 'exam' | 'answers' | 'matrix' | 'study_guide' | 'full') => void;
  onOpenStandardExporter?: () => void;
  onConfigChange?: (updated: ExamConfig) => void;
  auditPassed: boolean;
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
}) => {
  const toast = useToast();
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showAzotaModal, setShowAzotaModal] = useState(false);
  const [aiStudyGuide, setAiStudyGuide] = useState<StudyGuideData | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const handleExportDocx = async (mode: 'full' | 'examOnly') => {
    if (!questions || questions.length === 0) {
      toast.error('Chưa có câu hỏi đề thi! Vui lòng bấm Tạo Đề Thi Với AI trước.');
      return;
    }
    try {
      setIsExportingDocx(true);
      toast.info(mode === 'full' ? '⏳ Đang khởi tạo file Word (.docx) Đầy đủ theo mẫu...' : '⏳ Đang khởi tạo file Word (.docx) Đề thi học sinh...');
      await downloadStandardExamDocx(config, questions, { mode, examCode: '101' });
      toast.success(mode === 'full' ? '🎉 Đã tải file Word (.docx) Đầy đủ (Đề + Đáp án & Hướng dẫn chấm)!' : '🎉 Đã tải file Word (.docx) Đề thi học sinh!');
    } catch (err: unknown) {
      console.error('Docx export failed:', err);
      toast.error(`Lỗi xuất file Word: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExportingDocx(false);
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

  const totalScore = Number(questions.reduce((sum, q) => sum + (q.score || 0), 0).toFixed(2));

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
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'matrix', label: 'MA TRẬN ĐỀ', icon: Grid },
              { id: 'spec', label: 'BẢN ĐẶC TẢ', icon: ListTree },
              { id: 'exam', label: 'ĐỀ KIỂM TRA', icon: FileText, count: questions.length },
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
                  className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-black transition rounded-lg ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-700'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Nút Xuất đề (theo form chuẩn) */}
            {onOpenStandardExporter && (
              <button
                onClick={onOpenStandardExporter}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition shadow-md bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white cursor-pointer ring-2 ring-amber-300 animate-pulse"
                title="Xuất đề (theo form chuẩn) - Mở giao diện xem trước, in và tải file .docx chuẩn 100%"
              >
                <FileDown className="h-4 w-4 text-white" />
                <span>Xuất đề (theo form chuẩn)</span>
              </button>
            )}
            {/* Xuất Word (.docx) Đầy đủ theo mẫu chuẩn */}
            <button
              onClick={() => handleExportDocx('full')}
              disabled={isExportingDocx}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                !isExportingDocx
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Xuất file Word (.docx) thực sự chuẩn mẫu (A4, 12pt, 2 khối đầu đề, Đề + Đáp án & HD chấm)"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span>{isExportingDocx ? 'Đang tạo...' : 'Word (.docx) Đầy Đủ'}</span>
            </button>

            {/* Xuất Word (.docx) chỉ phần Đề kiểm tra cho học sinh */}
            <button
              onClick={() => handleExportDocx('examOnly')}
              disabled={isExportingDocx}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                !isExportingDocx
                  ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              title="Chỉ xuất phần Đề kiểm tra cho học sinh dạng file Word (.docx) chuẩn mẫu"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Word (.docx) Đề Cho HS</span>
            </button>

            {/* Xuất Word Ma trận & Đặc tả */}
            <button
              onClick={() => {
                exportMatrixAndSpecsCv7991WordDoc(config, chuDeList, cauList, luat);
                toast.success('📥 Đang tải file Word Ma trận & Bản đặc tả...');
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              title="Xuất Ma trận & Bản đặc tả sang Word (.doc)"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Word Ma Trận & Đặc Tả</span>
            </button>

            {/* Xuất Azota / K12 */}
            <button
              onClick={() => {
                setShowAzotaModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
              title="Xuất dạng Azota / K12Online"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Azota / K12</span>
            </button>

            {/* In & Export PDF */}
            <button
              onClick={() => onPrint(activeTab as any)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              title="In ấn hoặc xuất PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In & PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content 1: MA TRẬN & ĐẶC TẢ INTERACTIVE DASHBOARD */}
      {(activeTab === 'matrix' || activeTab === 'spec') && (
        <InteractiveMatrixDashboard
          chuDeList={chuDeList}
          cauList={cauList}
          luat={luat}
          activeCompetencies={nangLucList}
          grade={config.grade}
          subject={config.subject}
          onUpdateCauList={onUpdateCauList}
        />
      )}

      {/* Tab 2: ĐỀ KIỂM TRA CHUẨN A4 */}
      {activeTab === 'exam' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <OfficialExamHeader config={config} activeCode="101" />

          {questions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-semibold text-xs">Chưa sinh câu hỏi cho đề thi này.</p>
              <p className="text-[11px] text-slate-400">Nhấn "TẠO ĐỀ THI VỚI AI" ở bảng cấu hình bên trái để tiến hành sinh câu hỏi.</p>
            </div>
          ) : (
            <div className="space-y-6 font-exam text-slate-900" style={getDisplayScaleStyle(config.appUiScale)}>
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="space-y-2 p-3 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                  <div className="font-bold">
                    Câu {idx + 1} ({q.score || 0.25} điểm): <MathRenderer text={q.question} />
                  </div>
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 text-xs font-mono">
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
          )}
        </div>
      )}

      {/* Tab 3: BẢNG ĐÁP ÁN */}
      {activeTab === 'answers' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm uppercase">Bảng Đáp Án Chi Tiết</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300">
                  <th className="p-2 border border-slate-300 text-center w-12">STT</th>
                  <th className="p-2 border border-slate-300">Nội dung câu hỏi</th>
                  <th className="p-2 border border-slate-300 w-24 text-center">Đáp án</th>
                  <th className="p-2 border border-slate-300 w-20 text-center">Điểm</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={q.id || idx} className="hover:bg-slate-50 border-b border-slate-200">
                    <td className="p-2 text-center font-bold">{idx + 1}</td>
                    <td className="p-2 font-mono"><MathRenderer text={q.question} /></td>
                    <td className="p-2 text-center font-bold text-emerald-700">{String(q.correctAnswer)}</td>
                    <td className="p-2 text-center font-bold text-blue-700">{q.score}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: HƯỚNG DẪN CHẤM */}
      {activeTab === 'rubric' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm uppercase">Hướng Dẫn Chấm Tự Luận Step-by-Step</h3>
          <div className="space-y-3">
            {questions
              .filter((q) => q.part === 'part4' || q.type === 'essay')
              .map((q, idx) => (
                <div key={q.id || idx} className="p-4 border rounded-xl bg-slate-50 space-y-2">
                  <p className="font-bold">Câu Tự Luận {idx + 1} ({q.score} điểm): <MathRenderer text={q.question} /></p>
                  <p className="text-slate-700 bg-white p-2 rounded border"><MathRenderer text={q.explanation} /></p>
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
                  <li key={i}><strong>{c.term}:</strong> {c.definition}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xuất Azota & K12Online */}
      {showAzotaModal && (
        <AzotaExportModal
          isOpen={showAzotaModal}
          onClose={() => setShowAzotaModal(false)}
          questions={questions}
          config={config}
        />
      )}
    </div>
  );
};

export default Workspace;
