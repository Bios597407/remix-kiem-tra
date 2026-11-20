import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
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
import { essayReleaseError } from './utils/essayAssessment';
import { generateCauAllocation } from './utils/cv7991Engine';
import { buildManualAssessmentPlan } from './utils/manualAssessmentPlan';
import { runCv7991Audit } from './utils/cv7991Audit';
import { initializeAndClearModelCache } from './utils/geminiModels';
import { downloadStandaloneSingleFileHtml } from './utils/singleFileBundle';
import { releaseCachedFile } from './utils/memoryManager';
import {
  SAMPLE_CHUDE_LIST,
  SAMPLE_CAU_LIST,
  SAMPLE_QUESTIONS_CV7991,
} from './data/sampleExamCv7991';
import { generateShuffledCodes } from './utils/examShuffler';

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
  departmentName: 'SỞ GIÁO DỤC & ĐÀO TẠO TPHCM',
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

const createDefaultTabState = (grade: string): GradeTabState => {
  const isDefaultDemo = grade === '12';
  const initialQuestions = isDefaultDemo ? SAMPLE_QUESTIONS_CV7991 : [];
  const initialCodes = isDefaultDemo
    ? generateShuffledCodes(SAMPLE_QUESTIONS_CV7991, { variantCount: 4, namingPreset: '101' }, '12')
    : [];

  return {
    grade,
    subject: 'Toán học',
    textbook: 'Kết nối tri thức với cuộc sống',
    examTitle: 'ĐỀ KIỂM TRA GIỮA HỌC KỲ I',
    durationMinutes: 90,
    chuDeList: isDefaultDemo ? SAMPLE_CHUDE_LIST : [],
    luat: DEFAULT_LUAT,
    nangLucList: [],
    cauList: isDefaultDemo ? SAMPLE_CAU_LIST : [],
    uploadedDocs: [],
    examRevision: 0,
    examOrigin: isDefaultDemo ? { grade, subject: 'Toán học' } : undefined,
    generatedQuestions: initialQuestions,
    shuffledCodes: initialCodes,
    activeExamCode: '101',
  };
};

function updateExamInputs(previous: GradeTabState, next: GradeTabState): GradeTabState {
  const keys = (tab: GradeTabState) => [
    tab.grade, tab.subject, tab.textbook, tab.durationMinutes, tab.topicTitle, tab.chapter,
    tab.knowledgeScope, tab.learningOutcomes, tab.readingPassage, tab.uploadedDocs,
    tab.chuDeList, tab.nangLucList, tab.luat,
  ];
  if (JSON.stringify(keys(previous)) === JSON.stringify(keys(next))) return next;

  const hadExam = previous.generatedQuestions.length > 0;
  const scopeChanged = previous.subject !== next.subject || previous.textbook !== next.textbook;
  const allocationsChanged = (before: LuatConfig, after: LuatConfig) =>
    before.nlcCount !== after.nlcCount || before.nlcPrice !== after.nlcPrice
    || before.dsCount !== after.dsCount || before.dsSubItems !== after.dsSubItems
    || before.dsPricePerSub !== after.dsPricePerSub || before.tlnCount !== after.tlnCount
    || before.tlnPrice !== after.tlnPrice || before.tlCount !== after.tlCount
    || before.tlUnit !== after.tlUnit || before.tlPrice !== after.tlPrice
    || before.bietTarget !== after.bietTarget || before.hieuTarget !== after.hieuTarget
    || before.vanDungTarget !== after.vanDungTarget || before.tolerance !== after.tolerance;
  const clearMatrix = (scopeChanged || (previous.manualPlan && allocationsChanged(previous.luat, next.luat)))
    && previous.chuDeList === next.chuDeList;
  return {
    ...next,
    ...(clearMatrix ? { chuDeList: [], cauList: [], unsolvableReason: undefined } : {}),
    examRevision: previous.examRevision + 1,
    examOrigin: undefined,
    examNeedsRegeneration: previous.examNeedsRegeneration || hadExam,
    generatedQuestions: [],
    shuffledCodes: [],
    activeExamCode: '101',
  };
}

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
  const [tabStates, setTabStates] = useState<Record<string, GradeTabState>>(() => ({
    '12': createDefaultTabState('12'),
  }));
  const latestTabs = useRef(tabStates);
  const latestGrade = useRef(activeGrade);
  useLayoutEffect(() => {
    latestTabs.current = tabStates;
    latestGrade.current = activeGrade;
  }, [tabStates, activeGrade]);

  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  });

  // Get active tab state with guaranteed safe fallbacks
  const currentTabState = tabStates[activeGrade] || createDefaultTabState(activeGrade);

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
      appUiScale: currentTabState.appUiScale || 'standard',
      topicTitle: currentTabState.topicTitle,
      chapter: currentTabState.chapter,
      knowledgeScope: currentTabState.knowledgeScope,
      learningOutcomes: currentTabState.learningOutcomes,
      readingPassage: currentTabState.readingPassage,
      luat: currentTabState.luat || DEFAULT_LUAT,
      nangLuc: currentTabState.nangLucList || [],
      uploadedDocs: currentTabState.uploadedDocs || [],
      sectionCounts: {
        part1: currentTabState.luat?.nlcCount ?? 12,
        part2: currentTabState.luat?.dsCount ?? 4,
        part3: currentTabState.luat?.tlnCount ?? 0,
        part4: currentTabState.luat?.tlCount ?? 3,
      },
    };
  }, [gradeLevel, activeGrade, currentTabState]);

  // Sync Global Display Font Scale (16px / 18px / 20px) to Root HTML Element
  useEffect(() => {
    const scale = config.appUiScale || 'standard';
    document.documentElement.setAttribute('data-ui-scale', scale);
  }, [config.appUiScale]);

  // Handle Tab Switch
  const handleSelectTab = (grade: string) => {
    setTabStates((prev) => {
      if (!prev[grade]) {
        return {
          ...prev,
          [grade]: createDefaultTabState(grade),
        };
      }
      return prev;
    });
    setActiveGrade(grade);
  };

  const handleAddTab = (grade: string) => {
    if (!activeTabs.includes(grade)) {
      setTabStates((prev) => {
        if (!prev[grade]) {
          return {
            ...prev,
            [grade]: createDefaultTabState(grade),
          };
        }
        return prev;
      });
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
    const firstGrade = newGrades[0];
    setTabStates((prev) => {
      if (!prev[firstGrade]) {
        return {
          ...prev,
          [firstGrade]: createDefaultTabState(firstGrade),
        };
      }
      return prev;
    });
    setActiveTabs([firstGrade]);
    setActiveGrade(firstGrade);
  };

  // Update current tab state
  const updateCurrentTabState = (updater: (prev: GradeTabState) => GradeTabState) => {
    setTabStates((prev) => {
      const tab = prev[activeGrade] || createDefaultTabState(activeGrade);
      return { ...prev, [activeGrade]: updateExamInputs(tab, updater(tab)) };
    });
  };

  // Tính số lượng tài liệu đã nạp theo từng khối lớp để hiển thị trực tiếp lên Tab
  const docCountsByGrade = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(tabStates).forEach((g) => {
      counts[g] = tabStates[g]?.uploadedDocs?.length || 0;
    });
    return counts;
  }, [tabStates]);

  // Danh sách các tab khối khác đang có tài liệu nạp (để gợi ý sao chép / cảnh báo trực quan)
  const otherTabsWithDocs = useMemo(() => {
    return Object.keys(tabStates)
      .filter((g) => g !== activeGrade && (tabStates[g]?.uploadedDocs?.length || 0) > 0)
      .map((g) => ({
        grade: g,
        docs: tabStates[g].uploadedDocs || [],
      }));
  }, [tabStates, activeGrade]);

  // Xử lý nạp tài liệu: Tự động chuyển file đúng khối khi AI nhận diện khác khối hiện tại
  const handleProcessUploadedDocs = (
    docs: any[],
    inferredGrade?: string,
    inferredMeta?: any
  ) => {
    const finalGrade = inferredGrade || activeGrade;
    const isDifferentGrade = finalGrade !== activeGrade;

    setTabStates((prev) => {
      const next = { ...prev };
      // Nếu tự động chuyển sang khối lớp khác thì gỡ tài liệu khỏi khối lớp cũ để tránh lưu nhầm chỗ
      if (isDifferentGrade && next[activeGrade]) {
        const docIds = new Set(docs.map((d) => d.id));
        const sourceTab = next[activeGrade];
        next[activeGrade] = updateExamInputs(sourceTab, {
          ...sourceTab,
          uploadedDocs: sourceTab.uploadedDocs.filter((d) => !docIds.has(d.id)),
        });
      }

      const targetTab = next[finalGrade] || createDefaultTabState(finalGrade);
      const fileTitles = docs.map((d) => d.name.replace(/\.[^/.]+$/, '')).join('\n');
      const fullText = docs.map((d) => d.content).join('\n\n');

      next[finalGrade] = updateExamInputs(targetTab, {
        ...targetTab,
        grade: finalGrade,
        uploadedDocs: docs,
        chuDeList: [],
        cauList: [],
        manualPlan: false,

        unsolvableReason: undefined,
        subject: inferredMeta?.subject || targetTab.subject,
        textbook: inferredMeta?.textbook || targetTab.textbook,
        topicTitle: targetTab.topicTitle ? `${targetTab.topicTitle}\n${fileTitles}`.trim() : fileTitles,
        readingPassage: fullText || targetTab.readingPassage || '',
      });

      return next;
    });

    if (inferredMeta?.gradeLevel && inferredMeta.gradeLevel !== gradeLevel) {
      setGradeLevel(inferredMeta.gradeLevel);
    }

    if (!activeTabs.includes(finalGrade)) {
      setActiveTabs((prevTabs) => [...prevTabs, finalGrade]);
    }

    if (isDifferentGrade) {
      setActiveGrade(finalGrade);
      toast.success(
        `🎯 AI nhận diện tài liệu thuộc Khối Lớp ${finalGrade} (Môn: "${inferredMeta?.subject || 'Công nghệ'}"): Đã tự động chuyển tài liệu sang đúng Tab Khối Lớp ${finalGrade}!`
      );
    } else {
      toast.success(`Đã nạp ${docs.length} tài liệu vào Tab Khối Lớp ${finalGrade}!`);
    }
  };

  // Sao chép tài liệu từ một khối khác sang khối hiện tại chỉ với 1 cú click
  const handleCopyDocsFromGrade = (fromGrade: string) => {
    const sourceDocs = tabStates[fromGrade]?.uploadedDocs || [];
    if (sourceDocs.length === 0) return;

    updateCurrentTabState((prev) => ({
      ...prev,
      uploadedDocs: [...(prev.uploadedDocs || []), ...sourceDocs],
      chuDeList: [],
      cauList: [],
      unsolvableReason: undefined,
      readingPassage: prev.readingPassage
        ? `${prev.readingPassage}\n\n${sourceDocs.map((d) => d.content).join('\n\n')}`
        : sourceDocs.map((d) => d.content).join('\n\n'),
    }));

    toast.success(`Đã sao chép ${sourceDocs.length} tài liệu từ Khối ${fromGrade} sang Khối ${activeGrade}!`);
  };

  // Auto-generate or update "cau" allocation when chuDeList or luat changes
  useEffect(() => {
    if (!currentTabState.manualPlan && currentTabState.chuDeList.length > 0) {
      const alloc = generateCauAllocation(currentTabState.chuDeList, currentTabState.luat || DEFAULT_LUAT);
      updateCurrentTabState((prev) => ({
        ...prev,
        cauList: alloc.cauList || [],
        unsolvableReason: alloc.unsolvableReason,
      }));
    }
  }, [currentTabState.chuDeList, currentTabState.luat, currentTabState.manualPlan, activeGrade]);

  // Audit Report for current active tab
  const auditReport = useMemo(() => {
    return runCv7991Audit(
      currentTabState?.chuDeList || [],
      currentTabState?.cauList || [],
      currentTabState?.luat || DEFAULT_LUAT,
      {
        grade: activeGrade || '',
        subject: currentTabState?.subject || '',
        examOrigin: currentTabState.examOrigin ?? null,
      }
    );
  }, [currentTabState?.chuDeList, currentTabState?.cauList, currentTabState?.luat, activeGrade, currentTabState?.subject, currentTabState.examOrigin]);

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
  const [workspaceTab, setWorkspaceTab] = useState<'exam' | 'answers' | 'rubric' | 'matrix' | 'spec' | 'study_guide' | 'comparison'>('matrix');

  const toast = useToast();

  // Clear all files & old exams (1 Click Reset)
  const handleClearAllContent = () => {
    releaseCachedFile();
    setTabStates((prev) => ({
      ...prev,
      [activeGrade]: {
        ...prev[activeGrade],
        chuDeList: [],
        cauList: [],
        uploadedDocs: [],
        generatedQuestions: [],
        shuffledCodes: [],
        activeExamCode: '101',
        unsolvableReason: undefined,
        examRevision: prev[activeGrade].examRevision + 1,
        examOrigin: undefined,
        manualPlan: false,

        examNeedsRegeneration: false,
      },
    }));
    toast.success('✨ Đã xóa sạch toàn bộ tài liệu, ma trận và kết quả kiểm tra cũ!');
  };

  // Load Sample Exam (Grade 12 CV 7991 with 4 pre-shuffled codes)
  const handleLoadSampleExam = () => {
    if (activeGrade !== '12' || currentTabState.subject !== 'Toán học') return;
    setTabStates((prev) => ({
      ...prev,
      '12': { ...createDefaultTabState('12'), examRevision: prev['12'].examRevision + 1 },
    }));
    setWorkspaceTab('exam');
    toast.success('🎉 Đã nạp thành công Bộ đề mẫu chuẩn CV 7991 (gồm 4 mã đề 101, 102, 103, 104 & Bảng đối chiếu)!');
  };

  const planErrors = auditReport.checks.filter((check) =>
    !check.passed && check.id !== 'K12' && (check.type === 'ERROR' || check.id === 'K5'));
  const canApprovePlan = currentTabState.cauList.length > 0 && planErrors.length === 0;
  const matrixApproved = currentTabState.approvedMatrixRevision === currentTabState.examRevision;
  const specApproved = currentTabState.approvedSpecRevision === currentTabState.examRevision;

  const handleBuildMatrix = () => {
    setWorkspaceTab('matrix');
    if (currentTabState.chuDeList.length && !currentTabState.manualPlan) return;
    try {
      const luat = currentTabState.luat;
      const plan = buildManualAssessmentPlan(config, luat);
      const allocation = plan.positions ? { cauList: plan.positions, unsolvableReason: undefined }
        : generateCauAllocation(plan.topics, luat);
      if (!allocation.cauList.length) throw new Error(allocation.unsolvableReason || 'Chưa phân bổ được câu hỏi.');
      updateCurrentTabState((prev) => ({
        ...prev,
        examRevision: prev.examRevision + 1,
        examOrigin: undefined,
        examNeedsRegeneration: prev.examNeedsRegeneration || prev.generatedQuestions.length > 0,
        generatedQuestions: [],
        shuffledCodes: [],
        activeExamCode: '101',
        chuDeList: plan.topics,
        cauList: allocation.cauList,
        unsolvableReason: allocation.unsolvableReason,
        manualPlan: true,
      }));
      toast.success(plan.positions
        ? 'Đã dựng ma trận theo vị trí câu/ý đã nhập.'
        : 'Đã dựng ma trận dự thảo với trọng số bằng nhau. Kiểm tra phân bổ trước khi duyệt.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Chưa dựng được ma trận.');
    }
  };

  const approveMatrix = () => {
    if (!canApprovePlan) return;
    updateCurrentTabState((tab) => ({ ...tab, approvedMatrixRevision: tab.examRevision }));
  };

  const approveSpec = () => {
    if (!matrixApproved || !canApprovePlan) return;
    updateCurrentTabState((tab) => ({ ...tab, approvedSpecRevision: tab.examRevision }));
  };

  // Generate Questions with Gemini AI
  const handleGenerateQuestions = async () => {
    if (isGenerating) return;
    if (!matrixApproved || !specApproved || !canApprovePlan) {
      toast.error('Duyệt ma trận A và đặc tả B theo cấu hình hiện tại trước khi tạo đề.');
      return;
    }

    const revision = currentTabState.examRevision;
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

      const autoCodes = generateShuffledCodes(
        generated,
        { variantCount: 4, namingPreset: '101' },
        activeGrade
      );

      if (latestTabs.current[activeGrade]?.examRevision !== revision) {
        toast.info('Cấu hình đã thay đổi trong lúc tạo đề. Hãy tạo lại đề theo cấu hình mới.');
        return;
      }
      setTabStates((prev) => {
        const tab = prev[activeGrade];
        if (!tab || tab.examRevision !== revision) return prev;
        return {
          ...prev,
          [activeGrade]: {
            ...tab,
            examOrigin: { grade: config.grade, subject: config.subject },
            examNeedsRegeneration: false,
            generatedQuestions: generated,
            shuffledCodes: autoCodes,
            activeExamCode: '101',
          },
        };
      });

      if (latestGrade.current === activeGrade) setWorkspaceTab('exam');
      toast.success(`🎉 Đã sinh thành công ${generated.length} câu hỏi và tự động tạo 4 mã đề (101, 102, 103, 104) chuẩn CV 7991!`);
    } catch (err: any) {
      console.error('Generate error:', err);
      toast.error(`Lỗi sinh đề: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setProgressStep(0);
      setProgressMsg('');
    }
  };

  const essayError = currentTabState.generatedQuestions.length
    ? essayReleaseError(currentTabState.generatedQuestions, currentTabState.cauList)
      || currentTabState.shuffledCodes?.map((code) => essayReleaseError(code.questions, currentTabState.cauList)).find(Boolean)
    : undefined;
  const releaseBlocked = !!essayError || currentTabState.generatedQuestions.length === 0
    || currentTabState.examOrigin?.grade !== config.grade
    || currentTabState.examOrigin?.subject !== config.subject;
  const releaseMessage = essayError ?? (currentTabState.examNeedsRegeneration
    ? 'Cấu hình đã thay đổi. Hãy tạo lại đề trước khi xuất.'
    : 'Chưa có câu hỏi. Hãy tạo đề trước khi xuất.');
  const openStandardExporter = () => {
    if (releaseBlocked) {
      toast.error(releaseMessage);
      return;
    }
    setShowStandardExporterModal(true);
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
          onOpenStandardExporter={openStandardExporter}
          onClearOldContent={handleClearAllContent}
          savedBankCount={0}
          historyCount={0}
          onConfigChange={(newCfg) => {
            updateCurrentTabState((prev) => ({
              ...prev,
              subject: newCfg.subject !== undefined ? newCfg.subject : prev.subject,
              appUiScale: newCfg.appUiScale !== undefined ? newCfg.appUiScale : prev.appUiScale,
            }));
          }}
        />

        <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6">
          {/* Top Section: App Configuration & Workflow arranged Horizontally */}
          <section id="config-section" className="w-full">
            <ConfigPanel
              config={config}
              onChangeConfig={(newCfg, resetMatrix) => {
                if (newCfg.gradeLevel && newCfg.gradeLevel !== gradeLevel) {
                  setGradeLevel(newCfg.gradeLevel);
                }
                updateCurrentTabState((prev) => ({
                  ...prev,
                  subject: newCfg.subject,
                  textbook: newCfg.textbook,
                  examTitle: newCfg.examTitle,
                  durationMinutes: newCfg.durationMinutes,
                  schoolName: newCfg.schoolName,
                  academicYear: newCfg.academicYear,
                  appUiScale: newCfg.appUiScale !== undefined ? newCfg.appUiScale : prev.appUiScale,
                  topicTitle: newCfg.topicTitle !== undefined ? newCfg.topicTitle : prev.topicTitle,
                  chapter: newCfg.chapter !== undefined ? newCfg.chapter : prev.chapter,
                  knowledgeScope: newCfg.knowledgeScope !== undefined ? newCfg.knowledgeScope : prev.knowledgeScope,
                  learningOutcomes: newCfg.learningOutcomes !== undefined ? newCfg.learningOutcomes : prev.learningOutcomes,
                  readingPassage: newCfg.readingPassage !== undefined ? newCfg.readingPassage : prev.readingPassage,
                  uploadedDocs: newCfg.uploadedDocs !== undefined ? newCfg.uploadedDocs : prev.uploadedDocs,
                  ...(resetMatrix ? { chuDeList: [], cauList: [], unsolvableReason: undefined } : {}),
                }));
              }}
              chuDeList={currentTabState.chuDeList}
              onChangeChuDeList={(newChuDe) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  chuDeList: newChuDe,
                  manualPlan: false,

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
              docCountsByGrade={docCountsByGrade}
              onProcessUploadedDocs={handleProcessUploadedDocs}
              otherTabsWithDocs={otherTabsWithDocs}
              onCopyDocsFromGrade={handleCopyDocsFromGrade}
              onSelectGradeLevel={handleSelectGradeLevel}
              onSelectTab={handleSelectTab}
              onAddTab={handleAddTab}
              onRemoveTab={handleRemoveTab}
              onGenerate={handleGenerateQuestions}
              onBuildMatrixOnly={handleBuildMatrix}
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
              releaseMessage={releaseBlocked ? releaseMessage : undefined}
              examOrigin={currentTabState.examOrigin}
              chuDeList={currentTabState.chuDeList || []}
              cauList={currentTabState.cauList || []}
              luat={currentTabState.luat || DEFAULT_LUAT}
              nangLucList={currentTabState.nangLucList || []}
              questions={currentTabState.generatedQuestions || []}
              activeTab={workspaceTab}
              onTabChange={setWorkspaceTab}
              onUpdateCauList={(updated) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  cauList: updated,
                  examRevision: prev.examRevision + 1,
                  examOrigin: undefined,
                  examNeedsRegeneration: prev.examNeedsRegeneration || prev.generatedQuestions.length > 0,
                  generatedQuestions: [],
                  shuffledCodes: [],
                  activeExamCode: '101',
                }));
              }}
              onPrint={(type, examCode) => {
                if (releaseBlocked && type !== 'matrix' && type !== 'spec') {
                  toast.error(releaseMessage);
                  return;
                }
                setPrintDocType(type);
                if (examCode) {
                  updateCurrentTabState((prev) => ({
                    ...prev,
                    activeExamCode: examCode,
                  }));
                }
                setShowPrintModal(true);
              }}
              onOpenStandardExporter={openStandardExporter}
              onConfigChange={(updated) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  appUiScale: updated.appUiScale !== undefined ? updated.appUiScale : prev.appUiScale,
                }));
              }}
              planReview={{
                matrixApproved,
                specApproved,
                canApprove: canApprovePlan,
                errors: planErrors.map((check) => check.id),
                approveMatrix,
                approveSpec,
              }}
              shuffledCodes={currentTabState.shuffledCodes || []}
              onUpdateShuffledCodes={(codes) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  shuffledCodes: codes,
                }));
              }}
              activeExamCode={currentTabState.activeExamCode || '101'}
              onSelectExamCode={(code) => {
                updateCurrentTabState((prev) => ({
                  ...prev,
                  activeExamCode: code,
                }));
              }}
              onLoadSampleExam={activeGrade === '12' && config.subject === 'Toán học'
                ? handleLoadSampleExam : undefined}
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
            isOpen={showPrintModal && (!releaseBlocked || printDocType === 'matrix' || printDocType === 'spec')}
            onClose={() => setShowPrintModal(false)}
            docType={printDocType}
            config={config}
            questions={
              (currentTabState.shuffledCodes &&
                currentTabState.shuffledCodes.find((c) => c.code === currentTabState.activeExamCode)?.questions) ||
              currentTabState.generatedQuestions
            }
            chuDeList={currentTabState.chuDeList}
            cauList={currentTabState.cauList}
            luat={currentTabState.luat}
            examCode={currentTabState.activeExamCode || '101'}
            releaseMessage={releaseBlocked ? releaseMessage : undefined}
          />
        )}

        {/* Standard Exporter Modal */}
        {showStandardExporterModal && !releaseBlocked && <StandardExamExporterModal
          isOpen
          onClose={() => setShowStandardExporterModal(false)}
          config={config}
          questions={currentTabState.generatedQuestions}
          shuffledCodes={currentTabState.shuffledCodes || []}
          initialExamCode={currentTabState.activeExamCode || '101'}
          onChangeConfig={(updated) => {
            updateCurrentTabState((prev) => ({
              ...prev,
              pageSize: updated.pageSize,
              appUiScale: updated.appUiScale !== undefined ? updated.appUiScale : prev.appUiScale,
            }));
          }}
        />}

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
            onClick={openStandardExporter}
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
