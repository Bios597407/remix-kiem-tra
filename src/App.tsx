import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, Grid, FileDown, Sparkles } from 'lucide-react';
import Header from './components/Header';
import ConfigPanel from './components/ConfigPanel';
import Workspace from './components/Workspace';
import GenerationStepper from './components/GenerationStepper';
import ApiKeyModal from './components/ApiKeyModal';
import QuestionBankModal from './components/QuestionBankModal';
import ExamHistoryModal from './components/ExamHistoryModal';
import PrintPreviewModal from './components/PrintPreviewModal';
import StandardExamExporterModal from './components/StandardExamExporterModal';
import { useToast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

import {
  ExamConfig,
  QuestionItem,
  GradeLevel,
  ChuDeItem,
  LuatConfig,
  NangLucItem,
  CauItem,
  GradeTabState,
} from './types/exam';

import { generateExamQuestions } from './services/aiGenerator';
import { generateCauAllocation } from './utils/cv7991Engine';
import { runCv7991Audit } from './utils/cv7991Audit';
import { initializeAndClearModelCache } from './utils/geminiModels';
import { downloadStandaloneSingleFileHtml } from './utils/singleFileBundle';
import { releaseCachedFile } from './utils/memoryManager';

const STORAGE_KEY_API_KEY = 'exam_ai_gemini_key_v2';

function getSystemAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${year} - ${year + 1}` : `${year - 1} - ${year}`;
}

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
  presetName: '3-4-3',
  showTlnColumnsIfZero: false,
  groupYccdMode: 'by_level',
  showQuestionColInSpec: false,
};

const DEFAULT_CONFIG: ExamConfig = {
  schoolName: 'TRƯỜNG THPT VÕ TRƯỜNG TOẢN',
  examTitle: 'ĐỀ KIỂM TRA ĐỊNH KÌ GIỮA HỌC KỲ I',
  examType: 'Kiểm tra định kì',
  gradeLevel: 'THPT',
  grade: '12',
  subject: 'Toán học',
  customSubject: '',
  textbook: 'Kết nối tri thức với cuộc sống',
  durationMinutes: 90,
  totalScore: 10,
  academicYear: getSystemAcademicYear(),
  departmentName: 'PHÒNG GIÁO DỤC & ĐÀO TẠO TPHCM',
  officialExamType: 'Đề chính thức',
  showOfficialBadge: true,
  pageCountText: '2',
  durationNote: '(không kể thời gian phát đề)',
  luat: DEFAULT_LUAT,
  nangLuc: [],
  uploadedDocs: [],
  sectionCounts: {
    part1: 12,
    part2: 4,
    part3: 0,
    part4: 3,
  },
};

export default function App() {
  // Global Model Cache Cleaning
  useEffect(() => {
    initializeAndClearModelCache();
  }, []);

  // Multi-Grade Parallel Tabs State (Isolated State per Tab)
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('THPT');
  const [activeGrade, setActiveGrade] = useState<string>('12');
  const [activeTabs, setActiveTabs] = useState<string[]>(['12']);

  // Grade Tab States Map
  const [tabStates, setTabStates] = useState<Record<string, GradeTabState>>({
    '12': {
      grade: '12',
      subject: 'Toán học',
      textbook: 'Kết nối tri thức với cuộc sống',
      examTitle: 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I',
      durationMinutes: 90,
      chuDeList: [], // Initial state: ALL TABLES ARE EMPTY!
      luat: DEFAULT_LUAT,
      nangLucList: [],
      cauList: [],
      uploadedDocs: [],
      generatedQuestions: [],
    },
  });

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  // Get active tab state
  const currentTabState = tabStates[activeGrade] || {
    grade: activeGrade,
    subject: 'Toán học',
    textbook: 'Kết nối tri thức với cuộc sống',
    examTitle: 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I',
    durationMinutes: 90,
    chuDeList: [],
    luat: DEFAULT_LUAT,
    nangLucList: [],
    cauList: [],
    uploadedDocs: [],
    generatedQuestions: [],
  };

  // Construct active ExamConfig
  const config: ExamConfig = useMemo(() => {
    return {
      ...DEFAULT_CONFIG,
      gradeLevel,
      grade: activeGrade,
      subject: currentTabState.subject,
      textbook: currentTabState.textbook,
      examTitle: currentTabState.examTitle,
      durationMinutes: currentTabState.durationMinutes,
      topicTitle: currentTabState.topicTitle,
      chapter: currentTabState.chapter,
      knowledgeScope: currentTabState.knowledgeScope,
      learningOutcomes: currentTabState.learningOutcomes,
      readingPassage: currentTabState.readingPassage,
      luat: currentTabState.luat,
      nangLuc: currentTabState.nangLucList,
      uploadedDocs: currentTabState.uploadedDocs,
      sectionCounts: {
        part1: currentTabState.luat.nlcCount,
        part2: currentTabState.luat.dsCount,
        part3: currentTabState.luat.tlnCount,
        part4: currentTabState.luat.tlCount,
      },
    };
  }, [gradeLevel, activeGrade, currentTabState]);

  // Handle Tab Switch
  const handleSelectTab = (grade: string) => {
    setActiveGrade(grade);
    if (!tabStates[grade]) {
      setTabStates((prev) => ({
        ...prev,
        [grade]: {
          grade,
          subject: 'Toán học',
          textbook: 'Kết nối tri thức với cuộc sống',
          examTitle: 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I',
          durationMinutes: 90,
          chuDeList: [],
          luat: DEFAULT_LUAT,
          nangLucList: [],
          cauList: [],
          uploadedDocs: [],
          generatedQuestions: [],
        },
      }));
    }
  };

  const handleAddTab = (grade: string) => {
    if (!activeTabs.includes(grade)) {
      setActiveTabs([...activeTabs, grade]);
      handleSelectTab(grade);
    }
  };

  const handleRemoveTab = (grade: string) => {
    if (activeTabs.length <= 1) return;
    const filtered = activeTabs.filter((g) => g !== grade);
    setActiveTabs(filtered);
    if (activeGrade === grade) {
      setActiveGrade(filtered[0]);
    }
  };

  const handleSelectGradeLevel = (level: GradeLevel) => {
    setGradeLevel(level);
    const newGrades = level === 'THPT' ? ['12', '11', '10'] : ['9', '8', '7'];
    setActiveTabs([newGrades[0]]);
    setActiveGrade(newGrades[0]);
  };

  // Update current tab state
  const updateCurrentTabState = (updater: (prev: GradeTabState) => GradeTabState) => {
    setTabStates((prev) => ({
      ...prev,
      [activeGrade]: updater(prev[activeGrade] || currentTabState),
    }));
  };

  // Auto-generate or update "cau" allocation when chuDeList or luat changes
  useEffect(() => {
    if (currentTabState.chuDeList && currentTabState.chuDeList.length > 0) {
      const alloc = generateCauAllocation(currentTabState.chuDeList, currentTabState.luat);
      updateCurrentTabState((prev) => ({
        ...prev,
        cauList: alloc.cauList,
        unsolvableReason: alloc.unsolvableReason,
      }));
    }
  }, [currentTabState.chuDeList, currentTabState.luat]);

  // Audit Report for current active tab
  const auditReport = useMemo(() => {
    return runCv7991Audit(currentTabState.chuDeList, currentTabState.cauList, currentTabState.luat, {
      grade: activeGrade,
      subject: currentTabState.subject,
    });
  }, [currentTabState.chuDeList, currentTabState.cauList, currentTabState.luat, activeGrade, currentTabState.subject]);

  // Generation progress state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');

  // Modals state
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showStandardExporterModal, setShowStandardExporterModal] = useState(false);
  const [printDocType, setPrintDocType] = useState<'exam' | 'answers' | 'matrix' | 'spec' | 'study_guide' | 'full'>('exam');
  const [workspaceTab, setWorkspaceTab] = useState<'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide'>('matrix');

  const toast = useToast();

  // Clear all files & old exams (1 Click Reset)
  const handleClearAllContent = () => {
    releaseCachedFile();
    updateCurrentTabState((prev) => ({
      ...prev,
      chuDeList: [],
      cauList: [],
      uploadedDocs: [],
      generatedQuestions: [],
      unsolvableReason: undefined,
    }));
    toast.success('✨ Đã xóa sạch toàn bộ tài liệu, ma trận và kết quả kiểm tra cũ!');
  };

  // Generate Questions with Gemini AI
  const handleGenerateQuestions = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgressStep(1);
    setProgressMsg('Đang khởi tạo tiến trình sinh đề thi AI...');

    try {
      const generated = await generateExamQuestions(
        config,
        apiKey,
        (step, msg) => {
          setProgressStep(step);
          setProgressMsg(msg);
        },
        false,
        currentTabState.cauList,
        currentTabState.chuDeList,
        currentTabState.luat
      );

      updateCurrentTabState((prev) => ({
        ...prev,
        generatedQuestions: generated,
      }));

      setWorkspaceTab('exam');
      toast.success(`🎉 Đã sinh thành công ${generated.length} câu hỏi theo đúng Ma trận và Bản đặc tả!`);
    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error(`Lỗi sinh đề: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressStep(0);
      setProgressMsg('');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <Header
          config={config}
          hasApiKey={!!apiKey}
          onOpenApiKey={() => setShowApiKeyModal(true)}
          onOpenQuestionBank={() => setShowBankModal(true)}
          onOpenHistory={() => setShowHistoryModal(true)}
          onResetDefaults={handleClearAllContent}
          onDownloadStandalone={() => downloadStandaloneSingleFileHtml()}
          onOpenStandardExporter={() => setShowStandardExporterModal(true)}
          onClearOldContent={handleClearAllContent}
          savedBankCount={0}
          historyCount={0}
          onConfigChange={(newCfg) => {
            updateCurrentTabState((prev) => ({
              ...prev,
              subject: newCfg.subject,
            }));
          }}
        />

        <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
          {/* Top Section: App Configuration & Workflow arranged Horizontally */}
          <section id="config-section" className="w-full">
            <ConfigPanel
              config={config}
              onChangeConfig={(newCfg) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  subject: newCfg.subject,
                  textbook: newCfg.textbook,
                  examTitle: newCfg.examTitle,
                  durationMinutes: newCfg.durationMinutes,
                  schoolName: newCfg.schoolName,
                  academicYear: newCfg.academicYear,
                  topicTitle: newCfg.topicTitle !== undefined ? newCfg.topicTitle : prev.topicTitle,
                  chapter: newCfg.chapter !== undefined ? newCfg.chapter : prev.chapter,
                  knowledgeScope: newCfg.knowledgeScope !== undefined ? newCfg.knowledgeScope : prev.knowledgeScope,
                  learningOutcomes: newCfg.learningOutcomes !== undefined ? newCfg.learningOutcomes : prev.learningOutcomes,
                  readingPassage: newCfg.readingPassage !== undefined ? newCfg.readingPassage : prev.readingPassage,
                  uploadedDocs: newCfg.uploadedDocs !== undefined ? newCfg.uploadedDocs : prev.uploadedDocs,
                }));
              }}
              chuDeList={currentTabState.chuDeList}
              onChangeChuDeList={(newChuDe) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  chuDeList: newChuDe,
                }));
              }}
              luat={currentTabState.luat}
              onChangeLuat={(newLuat) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  luat: newLuat,
                }));
              }}
              nangLucList={currentTabState.nangLucList}
              onChangeNangLuc={(newNangLuc) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  nangLucList: newNangLuc,
                }));
              }}
              activeGrade={activeGrade}
              availableGrades={gradeLevel === 'THPT' ? ['12', '11', '10'] : ['9', '8', '7']}
              activeTabs={activeTabs}
              onSelectGradeLevel={handleSelectGradeLevel}
              onSelectTab={handleSelectTab}
              onAddTab={handleAddTab}
              onRemoveTab={handleRemoveTab}
              onGenerate={handleGenerateQuestions}
              onBuildMatrixOnly={() => setWorkspaceTab('matrix')}
              isGenerating={isGenerating}
              apiKey={apiKey}
              onClearOldContent={handleClearAllContent}
            />
          </section>

          {/* Stepper Progress */}
          {isGenerating && (
            <GenerationStepper currentStep={progressStep} message={progressMsg} />
          )}

          {/* Bottom Section: Full-Width Workspace underneath */}
          <section id="workspace-section" className="w-full">
            <Workspace
              config={config}
              chuDeList={currentTabState.chuDeList}
              cauList={currentTabState.cauList}
              luat={currentTabState.luat}
              nangLucList={currentTabState.nangLucList}
              questions={currentTabState.generatedQuestions}
              activeTab={workspaceTab}
              onTabChange={setWorkspaceTab}
              onUpdateCauList={(updated) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  cauList: updated,
                }));
              }}
              onPrint={(type) => {
                setPrintDocType(type);
                setShowPrintModal(true);
              }}
              onOpenStandardExporter={() => setShowStandardExporterModal(true)}
              auditPassed={auditReport.passed}
            />
          </section>
        </main>

        {/* Api Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKey={apiKey}
          onSaveApiKey={(k) => {
            setApiKey(k);
            localStorage.setItem(STORAGE_KEY_API_KEY, k);
            toast.success('Đã lưu Gemini API Key!');
          }}
        />

        {/* Print Modal */}
        {showPrintModal && (
          <PrintPreviewModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            docType={printDocType}
            config={config}
            questions={currentTabState.generatedQuestions}
            chuDeList={currentTabState.chuDeList}
            cauList={currentTabState.cauList}
            luat={currentTabState.luat}
          />
        )}

        {/* Standard Exporter Modal */}
        <StandardExamExporterModal
          isOpen={showStandardExporterModal}
          onClose={() => setShowStandardExporterModal(false)}
          config={config}
          questions={currentTabState.generatedQuestions}
          onChangeConfig={(updated) => {
            updateCurrentTabState((prev) => ({
              ...prev,
              pageSize: updated.pageSize,
              balanceAnswersOption: updated.balanceAnswersOption,
            }));
          }}
        />

        {/* Mobile Fixed Bottom Dock for 1-Tap Touch Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 text-white backdrop-blur-md border-t border-slate-800 px-3 py-2 flex justify-around items-center md:hidden shadow-2xl no-print">
          <button
            onClick={() => {
              const el = document.getElementById('config-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white transition active:scale-95"
          >
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>1. Cấu hình & AI</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('workspace-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-white transition active:scale-95"
          >
            <Grid className="w-5 h-5 text-blue-400" />
            <span>2. Ma trận & Đề thi</span>
          </button>

          <button
            onClick={() => setShowStandardExporterModal(true)}
            className="flex flex-col items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200 transition active:scale-95 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 rounded-xl border border-amber-500/40"
          >
            <FileDown className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>3. Xuất đề CV 7991</span>
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
