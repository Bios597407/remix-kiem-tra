import React, { useState, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  Upload,
  Sparkles,
  Wand2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  CheckCircle2,
  Sliders,
  FileText,
  Clock,
  Layers,
  Download,
  ArrowDownRight,
} from 'lucide-react';
import {
  ExamConfig,
  GradeLevel,
  ChuDeItem,
  LuatConfig,
  NangLucItem,
} from '../types/exam';
import { extractTextFromFile } from '../utils/fileParser';
import { useToast } from './Toast';
import { extractStructuredContentFromDocs } from '../services/lessonAnalyzer';
import { cacheFileObject, releaseCachedFile } from '../utils/memoryManager';
import { CurriculumStandardModal } from './CurriculumStandardModal';
import { CurriculumTopic } from '../data/curriculumStandards';
import LuatConfigForm from './LuatConfigForm';
import GradeTabBar from './GradeTabBar';
import { PRESETS } from '../utils/cv7991Engine';
import { inferSubjectAndTextbook } from '../utils/subjectInference';

interface ConfigPanelProps {
  config: ExamConfig;
  onChangeConfig: (updated: ExamConfig) => void;
  chuDeList: ChuDeItem[];
  onChangeChuDeList: (updated: ChuDeItem[]) => void;
  luat: LuatConfig;
  onChangeLuat: (updated: LuatConfig) => void;
  nangLucList: NangLucItem[];
  onChangeNangLuc: (updated: NangLucItem[]) => void;
  activeGrade: string;
  availableGrades: string[];
  activeTabs: string[];
  onSelectGradeLevel: (level: GradeLevel) => void;
  onSelectTab: (grade: string) => void;
  onAddTab: (grade: string) => void;
  onRemoveTab: (grade: string) => void;
  onGenerate: () => void;
  onBuildMatrixOnly: () => void;
  isGenerating: boolean;
  apiKey?: string;
  onClearOldContent?: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  onChangeConfig,
  chuDeList,
  onChangeChuDeList,
  luat,
  onChangeLuat,
  nangLucList,
  onChangeNangLuc,
  activeGrade,
  availableGrades,
  activeTabs,
  onSelectGradeLevel,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  onGenerate,
  onBuildMatrixOnly,
  isGenerating,
  apiKey,
  onClearOldContent,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzingLesson, setIsAnalyzingLesson] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);
  const [showDetailedLuat, setShowDetailedLuat] = useState(false);
  const [showLessonDetails, setShowLessonDetails] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [aiDetectedInfo, setAiDetectedInfo] = useState<{
    subject: string;
    textbook: string;
    grade?: string;
    isAi: boolean;
  } | null>(null);

  const handleReInferSubjectAndTextbook = () => {
    if (!config.uploadedDocs || config.uploadedDocs.length === 0) {
      toast.info('Chưa có tài liệu đính kèm để nhận diện. Vui lòng tải tài liệu lên trước!');
      return;
    }
    const combinedText = config.uploadedDocs.map((d) => d.content).join('\n\n');
    const combinedNames = config.uploadedDocs.map((d) => d.name).join(' ');
    const inferred = inferSubjectAndTextbook(combinedText, combinedNames);

    setAiDetectedInfo({
      subject: inferred.subject,
      textbook: inferred.textbook,
      grade: inferred.grade,
      isAi: false,
    });

    onChangeConfig({
      ...config,
      subject: inferred.subject,
      textbook: inferred.textbook,
      grade: inferred.grade || config.grade,
      gradeLevel: inferred.gradeLevel || config.gradeLevel,
    });

    if (inferred.grade && inferred.grade !== config.grade) {
      onAddTab(inferred.grade);
    }

    toast.success(`🎯 AI đã nhận diện lại từ tài liệu: Môn "${inferred.subject}" • Bộ sách "${inferred.textbook}"!`);
  };

  const subjectOptions = [
    'Toán học',
    'Ngữ văn',
    'Tiếng Anh',
    'Khoa học tự nhiên',
    'Lịch sử & Địa lý',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Lịch sử',
    'Địa lý',
    'Tin học',
    'Giáo dục công dân',
    'Giáo dục Kinh tế & Pháp luật',
    'Công nghệ',
  ];

  const textbookOptions = [
    'Kết nối tri thức với cuộc sống',
    'Cánh diều',
    'Chân trời sáng tạo',
    'Tự do / Chung các bộ sách',
  ];

  const handleApplyCurriculumTopics = (selectedTopics: CurriculumTopic[]) => {
    if (selectedTopics.length === 0) return;

    const newChuDeList: ChuDeItem[] = selectedTopics.map((t, idx) => ({
      id: `CD_${Date.now()}_${idx}`,
      ten: t.chapter || `Chủ đề ${idx + 1}`,
      noiDung: [
        {
          id: `ND_${Date.now()}_${idx}_1`,
          ten: t.topicTitle,
          trongSo: 1,
          yccd: [
            ...t.outcomes.know.map((k, i) => ({
              ma: `ND_${idx + 1}.${i + 1}`,
              noiDung: k,
              mucToiDa: 'Biet' as const,
            })),
            ...t.outcomes.understand.map((u, i) => ({
              ma: `ND_${idx + 1}.${t.outcomes.know.length + i + 1}`,
              noiDung: u,
              mucToiDa: 'Hieu' as const,
            })),
            ...t.outcomes.apply.map((a, i) => ({
              ma: `ND_${idx + 1}.${t.outcomes.know.length + t.outcomes.understand.length + i + 1}`,
              noiDung: a,
              mucToiDa: 'VanDung' as const,
            })),
          ],
        },
      ],
    }));

    // Generate formatted text lines to sync directly into Block 3 ("NỘI DUNG BÀI HỌC & YÊU CẦU CẦN ĐẠT")
    const addedTopics = selectedTopics.map((t) => t.topicTitle).join('\n');
    const addedChapters = selectedTopics.map((t) => t.chapter || 'Chương I').join('\n');
    const addedOutcomes = selectedTopics
      .map((t) => {
        const kLines = t.outcomes.know.map((k) => `- (Biết) ${k}`).join('\n');
        const uLines = t.outcomes.understand.map((u) => `- (Hiểu) ${u}`).join('\n');
        const aLines = t.outcomes.apply.map((a) => `- (Vận dụng) ${a}`).join('\n');
        return `[${t.topicTitle}]\n${kLines}\n${uLines}\n${aLines}`.trim();
      })
      .join('\n\n');

    const updatedTopics = config.topicTitle ? `${config.topicTitle}\n${addedTopics}` : addedTopics;
    const updatedChapters = config.chapter ? `${config.chapter}\n${addedChapters}` : addedChapters;
    const updatedOutcomes = config.learningOutcomes ? `${config.learningOutcomes}\n\n${addedOutcomes}` : addedOutcomes;

    onChangeChuDeList([...chuDeList, ...newChuDeList]);
    onChangeConfig({
      ...config,
      topicTitle: updatedTopics,
      chapter: updatedChapters,
      knowledgeScope: updatedChapters,
      learningOutcomes: updatedOutcomes,
    });

    toast.success(`Đã nạp ${selectedTopics.length} bài học từ Thư viện GDPT 2018 vào cả Ma trận & Khối Nội dung Bài học!`);
  };

  /**
   * Syncs contents from "NGUỒN HỌC LIỆU & YCCĐ" directly into "NỘI DUNG BÀI HỌC & YÊU CẦU CẦN ĐẠT"
   */
  const handleSyncDocsToLessonFields = () => {
    if (!config.uploadedDocs || config.uploadedDocs.length === 0) {
      toast.info('Chưa có tài liệu đính kèm. Vui lòng tải file ở Thẻ 2 trước!');
      return;
    }

    const fileContentStr = config.uploadedDocs.map((d) => d.content).join('\n\n');
    const fileNamesStr = config.uploadedDocs.map((d) => d.name.replace(/\.[^/.]+$/, '')).join('\n');

    let topicLines = config.topicTitle || '';
    let chapterLines = config.chapter || '';
    let outcomesLines = config.learningOutcomes || '';

    if (chuDeList && chuDeList.length > 0) {
      const topics: string[] = [];
      const chapters: string[] = [];
      const outcomes: string[] = [];

      chuDeList.forEach((cd) => {
        if (!chapters.includes(cd.ten)) chapters.push(cd.ten);
        cd.noiDung.forEach((nd) => {
          topics.push(nd.ten);
          outcomes.push(`[${nd.ten}]`);
          nd.yccd.forEach((y) => {
            const levelLabel = y.mucToiDa === 'VanDung' ? 'Vận dụng' : y.mucToiDa === 'Hieu' ? 'Hiểu' : 'Biết';
            const cleanContent = y.noiDung.replace(/^\[\?\]\s*/, '').replace(/\[\?\]\s*/g, '').trim();
            outcomes.push(`- (${levelLabel}) ${cleanContent}`);
          });
          outcomes.push('');
        });
      });

      topicLines = topics.join('\n');
      chapterLines = chapters.join('\n');
      outcomesLines = outcomes.join('\n').trim();
    } else {
      if (!topicLines) topicLines = fileNamesStr;
      if (!chapterLines) chapterLines = 'Chương I';
    }

    onChangeConfig({
      ...config,
      topicTitle: topicLines,
      chapter: chapterLines,
      knowledgeScope: chapterLines,
      learningOutcomes: outcomesLines,
      readingPassage: fileContentStr || config.readingPassage || '',
    });

    setShowLessonDetails(true);
    toast.success('✨ Đã nạp thành công dữ liệu từ Nguồn học liệu & YCCĐ sang Nội dung Bài học!');
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleProcessFiles = async (fileList: FileList | File[]) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const currentDocs = config.uploadedDocs || [];
    const newDocs = [...currentDocs];
    let countSuccess = 0;
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const text = await extractTextFromFile(file);
        const fileId = cacheFileObject(file);

        // Check duplicate by name and size to avoid accidental re-adds
        const existingIdx = newDocs.findIndex((d) => d.name === file.name && d.size === file.size);
        if (existingIdx !== -1) {
          // Update existing with new parsed text
          newDocs[existingIdx] = {
            id: fileId,
            name: file.name,
            content: text,
            size: file.size,
          };
          countSuccess++;
        } else {
          newDocs.push({
            id: fileId,
            name: file.name,
            content: text,
            size: file.size,
          });
          countSuccess++;
        }
      } catch (err: any) {
        console.error('File parsing error', file.name, err);
        errors.push(file.name);
      }
    }

    if (errors.length > 0) {
      toast.error(`Không thể đọc được ${errors.length} file: ${errors.join(', ')}`);
    }

    const fileTitles = newDocs.map((d) => d.name.replace(/\.[^/.]+$/, '')).join('\n');
    const fullTextContent = newDocs.map((d) => d.content).join('\n\n');

    // Tự động nhận diện nhanh Môn học & Bộ sách ngay khi nạp file
    const instantInfer = inferSubjectAndTextbook(fullTextContent, fileTitles);
    setAiDetectedInfo({
      subject: instantInfer.subject,
      textbook: instantInfer.textbook,
      grade: instantInfer.grade,
      isAi: false,
    });

    onChangeConfig({
      ...config,
      uploadedDocs: newDocs,
      subject: instantInfer.subject || config.subject,
      textbook: instantInfer.textbook || config.textbook,
      grade: instantInfer.grade || config.grade,
      gradeLevel: instantInfer.gradeLevel || config.gradeLevel,
      topicTitle: config.topicTitle ? `${config.topicTitle}\n${fileTitles}`.trim() : fileTitles,
      chapter: config.chapter ? config.chapter : 'Chương I',
      knowledgeScope: config.knowledgeScope ? config.knowledgeScope : 'Chương I',
      readingPassage: fullTextContent || config.readingPassage || '',
    });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (countSuccess > 0) {
      toast.success(`Đã thêm thành công ${countSuccess} tài liệu! (Tổng: ${newDocs.length} file). Đang tự động phân tích...`);
      handleAnalyzeDocs(newDocs);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleProcessFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const [extractionPercent, setExtractionPercent] = useState<number>(0);
  const [currentExtractingFileName, setCurrentExtractingFileName] = useState<string>('');
  const [extractingFileIndex, setExtractingFileIndex] = useState<number>(-1);
  const [currentFileProgress, setCurrentFileProgress] = useState<number>(0);
  const [completedFileIndices, setCompletedFileIndices] = useState<number[]>([]);

  const handleAnalyzeDocs = async (docsToAnalyze = config.uploadedDocs) => {
    if (!docsToAnalyze || docsToAnalyze.length === 0) {
      toast.info('Vui lòng tải lên tài liệu học tập trước khi phân tích!');
      return;
    }

    setIsAnalyzingLesson(true);
    setCompletedFileIndices([]);

    try {
      // Process file-by-file sequentially to provide accurate live progress for each card
      for (let i = 0; i < docsToAnalyze.length; i++) {
        const file = docsToAnalyze[i];
        setExtractingFileIndex(i);
        setCurrentExtractingFileName(file.name);
        setCurrentFileProgress(10);

        // Smooth live percentage ticker for file i
        await new Promise<void>((resolve) => {
          let progress = 10;
          const ticker = setInterval(() => {
            progress += Math.floor(Math.random() * 12) + 6;
            if (progress >= 93) {
              progress = 93;
              clearInterval(ticker);
              resolve();
            }
            setCurrentFileProgress(progress);
          }, 200);
        });

        // Fast pause to show 93%-100% completion per file
        setCurrentFileProgress(100);
        setCompletedFileIndices((prev) => [...prev, i]);
        await new Promise((r) => setTimeout(r, 250));
      }

      // Now run structured extraction for full aggregated document set
      const result = await extractStructuredContentFromDocs(
        docsToAnalyze,
        config,
        apiKey,
        (msg) => setAnalysisProgress(msg)
      );

      onChangeChuDeList(result.chuDeList);

      const topicLines = result.chuDeList.flatMap((cd) => cd.noiDung.map((nd) => nd.ten)).join('\n');
      const chapterLines = Array.from(new Set(result.chuDeList.map((cd) => cd.ten))).join('\n');
      
      const structuredOutcomes = result.chuDeList
        .flatMap((cd) =>
          cd.noiDung.map((nd) => {
            const yccdLines = nd.yccd
              .map((y) => {
                const levelLabel = y.mucToiDa === 'VanDung' ? 'Vận dụng' : y.mucToiDa === 'Hieu' ? 'Hiểu' : 'Biết';
                const cleanContent = y.noiDung.replace(/^\[\?\]\s*/, '').replace(/\[\?\]\s*/g, '').trim();
                return `- (${levelLabel}) ${cleanContent}`;
              })
              .join('\n');
            return `[${nd.ten}]\n${yccdLines}`;
          })
        )
        .join('\n\n');

      setAiDetectedInfo({
        subject: result.mon,
        textbook: result.textbook,
        grade: result.khoi,
        isAi: true,
      });

      onChangeConfig({
        ...config,
        uploadedDocs: docsToAnalyze,
        gradeLevel: result.cap,
        grade: result.khoi,
        subject: result.mon,
        textbook: result.textbook,
        topicTitle: result.rawTopicsStr || topicLines,
        chapter: chapterLines || 'Chương I',
        knowledgeScope: chapterLines || 'Chương I',
        learningOutcomes: structuredOutcomes || result.rawOutcomesStr,
        readingPassage: result.readingPassageStr,
      });

      setShowLessonDetails(true);

      if (result.khoi && result.khoi !== config.grade) {
        onAddTab(result.khoi);
      }

      toast.success(`🎉 AI đã nhận diện thành công: Môn "${result.mon}" • Bộ sách "${result.textbook}"! Đã đồng bộ vào Thông tin kỳ thi.`);
    } catch (err: any) {
      console.error('Analyze error:', err);
      toast.error(`Lỗi phân tích: ${err.message}`);
    } finally {
      setTimeout(() => {
        setIsAnalyzingLesson(false);
        setExtractingFileIndex(-1);
        setCurrentFileProgress(0);
        setCompletedFileIndices([]);
        setAnalysisProgress('');
        setCurrentExtractingFileName('');
      }, 500);
    }
  };

  const removeDoc = (idx: number) => {
    const doc = config.uploadedDocs[idx];
    if (doc?.id) releaseCachedFile(doc.id);
    const newDocs = config.uploadedDocs.filter((_, i) => i !== idx);
    onChangeConfig({ ...config, uploadedDocs: newDocs });
    toast.info(`Đã xóa tài liệu đính kèm.`);
  };

  const handleQuickPreset = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      onChangeLuat({
        ...PRESETS[presetKey].luat,
      });
      toast.success(`Đã chuyển sang cấu trúc mẫu: ${PRESETS[presetKey].label}`);
    }
  };

  const calcNlcScore = (luat.nlcCount * luat.nlcPrice).toFixed(1).replace('.', ',');
  const calcDsScore = (luat.dsCount * (luat.dsSubItems || 4) * luat.dsPricePerSub).toFixed(1).replace('.', ',');
  const calcTlnScore = (luat.tlnCount * luat.tlnPrice).toFixed(1).replace('.', ',');
  const calcTlScore = (luat.tlCount * luat.tlPrice).toFixed(1).replace('.', ',');

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all">
      {/* Top Bar: Tabs & Quick Action Strip */}
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Grade Level and Tabs */}
          <div className="flex-1 min-w-0">
            <GradeTabBar
              gradeLevel={config.gradeLevel}
              activeGrade={activeGrade}
              availableGrades={availableGrades}
              activeTabs={activeTabs}
              onSelectGradeLevel={onSelectGradeLevel}
              onSelectTab={onSelectTab}
              onAddTab={onAddTab}
              onRemoveTab={onRemoveTab}
            />
          </div>

          {/* Top Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCurriculumModal(true)}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thư viện GDPT 2018</span>
            </button>

            {onClearOldContent && (
              <button
                type="button"
                onClick={onClearOldContent}
                className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Xóa toàn bộ tài liệu & đề thi cũ"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Xóa dữ liệu cũ</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBuildMatrixOnly}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>🔄 Dựng Ma trận</span>
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-yellow-300" />
                  <span>Đang sinh đề...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-yellow-300" />
                  <span>TẠO ĐỀ VỚI AI</span>
                </>
              )}
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
              title={isCollapsed ? 'Mở rộng cấu hình' : 'Thu gọn cấu hình để xem toàn bộ Workspace bên dưới'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-4 h-4 text-blue-600" />
                  <span className="text-[11px] text-blue-600 font-bold hidden sm:inline">Mở rộng cấu hình</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 text-slate-600" />
                  <span className="text-[11px] hidden sm:inline">Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Horizontal Content (When Not Collapsed) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* 3 Horizontal Modular Cards - Guaranteed 1 Row on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xl:gap-5 items-stretch">
            {/* CARD 1: THÔNG TIN KỲ THI & ĐỀ KIỂM TRA */}
            <div className="rounded-xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 via-white to-white p-4 space-y-3 shadow-sm flex flex-col justify-between transition-all hover:border-indigo-300">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 bg-indigo-100 text-indigo-700 rounded-lg shrink-0">
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider truncate">
                      THÔNG TIN KỲ THI & ĐỀ KIỂM TRA
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {config.uploadedDocs && config.uploadedDocs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleReInferSubjectAndTextbook}
                        className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="AI phân tích tài liệu để tự động suy luận lại Môn học và Bộ sách"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span className="hidden sm:inline">AI dò môn & sách</span>
                      </button>
                    )}
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-bold shrink-0">
                      {config.gradeLevel || 'THPT'} • Lớp {config.grade || '12'}
                    </span>
                  </div>
                </div>

                {/* Banner Thông báo AI Nhận diện từ tài liệu */}
                {aiDetectedInfo && (
                  <div className="rounded-lg bg-emerald-50/90 border border-emerald-200 px-2.5 py-1.5 flex items-center justify-between text-[11px] text-emerald-900 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        AI đã nhận diện: <strong>{aiDetectedInfo.subject}</strong> • <strong>{aiDetectedInfo.textbook}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 ml-1.5">
                      {aiDetectedInfo.isAi ? 'Gemini AI' : 'Tự động quét'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trường / Đơn vị:</label>
                    <input
                      type="text"
                      value={config.schoolName}
                      onChange={(e) => onChangeConfig({ ...config, schoolName: e.target.value })}
                      placeholder="VD: THPT VÕ TRƯỜNG TOẢN"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Môn học hiện tại:</label>
                      {aiDetectedInfo?.subject === config.subject && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          AI nhận diện
                        </span>
                      )}
                    </div>
                    <select
                      value={config.subject}
                      onChange={(e) => onChangeConfig({ ...config, subject: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-indigo-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên Kỳ Thi / Đề kiểm tra:</label>
                    <input
                      type="text"
                      value={config.examTitle}
                      onChange={(e) => onChangeConfig({ ...config, examTitle: e.target.value })}
                      placeholder="VD: ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Bộ sách:</label>
                      {aiDetectedInfo?.textbook === config.textbook && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded border border-indigo-300">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                          Khớp sách
                        </span>
                      )}
                    </div>
                    <select
                      value={config.textbook}
                      onChange={(e) => onChangeConfig({ ...config, textbook: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {textbookOptions.map((tb) => (
                        <option key={tb} value={tb}>{tb}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Thời gian làm bài:</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="15"
                        max="180"
                        step="5"
                        value={config.durationMinutes}
                        onChange={(e) => onChangeConfig({ ...config, durationMinutes: Number(e.target.value) || 45 })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-900 text-xs text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 font-semibold shrink-0">phút</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-indigo-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Năm học: <strong>{config.academicYear}</strong></span>
                <span>Thang điểm: <strong>{config.totalScore || 10} điểm</strong></span>
              </div>
            </div>

            {/* CARD 2: NGUỒN HỌC LIỆU & YCCĐ */}
            <div className="rounded-xl border border-blue-200/90 bg-gradient-to-b from-blue-50/40 via-white to-white p-4 space-y-3 shadow-sm flex flex-col justify-between transition-all hover:border-blue-300">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider truncate">
                      NGUỒN HỌC LIỆU & YCCĐ
                    </h3>
                  </div>
                  {isAnalyzingLesson ? (
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-extrabold flex items-center gap-1 shadow-2xs animate-pulse shrink-0">
                      <Sparkles className="w-3 h-3 text-yellow-300" />
                      <span>Đang trích xuất...</span>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSyncDocsToLessonFields}
                        disabled={!config.uploadedDocs || config.uploadedDocs.length === 0}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                        title="Đồng bộ nạp dữ liệu từ file đính kèm sang Nội dung Bài học & YCCĐ"
                      >
                        <Download className="w-3 h-3" />
                        <span>Nạp YCCĐ</span>
                      </button>

                      {config.uploadedDocs && config.uploadedDocs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAnalyzeDocs()}
                          disabled={isAnalyzingLesson || uploading}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[10px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Wand2 className="w-3 h-3" />
                          <span>Phân tích AI</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropzone with Drag & Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={isAnalyzingLesson || uploading ? undefined : handleDrop}
                  onClick={() => {
                    if (!isAnalyzingLesson && !uploading) {
                      fileInputRef.current?.click();
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-2.5 text-center transition ${
                    isAnalyzingLesson || uploading
                      ? 'border-slate-300 bg-slate-100/90 opacity-40 filter blur-[0.5px] pointer-events-none cursor-not-allowed'
                      : isDragging
                      ? 'border-blue-600 bg-blue-50/90 scale-[1.01] cursor-pointer'
                      : 'border-slate-300 hover:border-blue-500 bg-white/70 cursor-pointer group'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    disabled={isAnalyzingLesson || uploading}
                    accept=".docx,.doc,.pdf,.txt,.md,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <Upload className={`w-4 h-4 transition-transform ${isDragging ? 'text-blue-700 scale-125' : 'text-blue-600 group-hover:scale-110'}`} />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                      {isDragging ? 'Thả toàn bộ file vào đây...' : 'Tải file Word (.docx), PDF, Ảnh, TXT'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ chọn hoặc kéo thả nhiều file (Bài 1, Bài 2, đề cương...)
                  </p>
                </div>

                {/* Attached Docs List with max height limit */}
                {config.uploadedDocs && config.uploadedDocs.length > 0 ? (
                  <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1 custom-scrollbar">
                    {config.uploadedDocs.map((doc, idx) => {
                      const isCurrentExtracting = isAnalyzingLesson && (extractingFileIndex === idx || (extractingFileIndex === -1 && idx === 0));
                      const isCompleted = completedFileIndices.includes(idx);

                      return (
                        <div
                          key={doc.id || idx}
                          className={`p-2 rounded-lg border text-xs transition-all ${
                            isCurrentExtracting
                              ? 'bg-purple-50/60 border-purple-300 shadow-2xs'
                              : isCompleted
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                              {isCurrentExtracting ? (
                                <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0 animate-pulse" />
                              ) : isCompleted ? (
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span className="font-semibold text-slate-800 text-[11px] truncate" title={doc.name}>
                                {doc.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDoc(idx)}
                              disabled={isAnalyzingLesson}
                              className="text-slate-400 hover:text-rose-600 p-0.5 rounded disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                              title="Xóa tài liệu này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Live Progress Bar during extraction */}
                          {isCurrentExtracting && (
                            <div className="mt-1.5 pt-1.5 border-t border-purple-200/80 space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-extrabold text-purple-900">
                                <span className="flex items-center gap-1 truncate">
                                  <Sparkles className="w-3 h-3 text-purple-600 animate-spin shrink-0" />
                                  <span className="truncate">Đang phân tích {doc.name}</span>
                                </span>
                                <span className="text-purple-700 font-extrabold text-[11px] shrink-0 ml-1">
                                  {currentFileProgress || 93}%
                                </span>
                              </div>
                              <div className="w-full bg-purple-200/70 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 h-1.5 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${currentFileProgress || 93}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-center">
                    <span className="text-[11px] text-blue-700 font-medium">
                      Chưa nạp tài liệu. Bạn có thể bấm nút <strong>"Thư viện GDPT 2018"</strong> ở trên để nạp nhanh!
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2.5 border-t border-blue-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Chủ đề ma trận: <strong>{chuDeList.length}</strong></span>
                <span>Tài liệu đã đính kèm: <strong>{config.uploadedDocs?.length || 0} file</strong></span>
              </div>
            </div>

            {/* CARD 3: CẤU TRÚC ĐỀ & THẨM ĐỊNH CV 7991 */}
            <div className="rounded-xl border border-amber-200/90 bg-gradient-to-b from-amber-50/40 via-white to-white p-4 space-y-3 shadow-sm flex flex-col justify-between transition-all hover:border-amber-300">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase text-amber-950 tracking-wider truncate">
                      CẤU TRÚC ĐỀ & THẨM ĐỊNH CV 7991
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDetailedLuat(!showDetailedLuat)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{showDetailedLuat ? 'Đóng chi tiết' : 'Cấu hình chi tiết'}</span>
                    {showDetailedLuat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Preset Fast Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Chọn cấu trúc mẫu 1-Click:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleQuickPreset(key)}
                        className={`px-2 py-1.5 rounded-lg border text-left transition flex items-center justify-between text-[11px] cursor-pointer ${
                          luat.presetName === key
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4-Part Structure Pill Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                  <div className="p-1.5 bg-blue-50/90 rounded-lg border border-blue-200/70">
                    <p className="text-[10px] text-blue-700 font-bold truncate">Nhiều lựa chọn</p>
                    <p className="text-xs font-black text-blue-900">{luat.nlcCount}c ({calcNlcScore}đ)</p>
                  </div>

                  <div className="p-1.5 bg-indigo-50/90 rounded-lg border border-indigo-200/70">
                    <p className="text-[10px] text-indigo-700 font-bold truncate">Đúng – Sai</p>
                    <p className="text-xs font-black text-indigo-900">{luat.dsCount}c ({calcDsScore}đ)</p>
                  </div>

                  <div className="p-1.5 bg-teal-50/90 rounded-lg border border-teal-200/70">
                    <p className="text-[10px] text-teal-700 font-bold truncate">Trả lời ngắn</p>
                    <p className="text-xs font-black text-teal-900">{luat.tlnCount}c ({calcTlnScore}đ)</p>
                  </div>

                  <div className="p-1.5 bg-purple-50/90 rounded-lg border border-purple-200/70">
                    <p className="text-[10px] text-purple-700 font-bold truncate">Tự luận</p>
                    <p className="text-xs font-black text-purple-900">{luat.tlCount}c ({calcTlScore}đ)</p>
                  </div>
                </div>
              </div>

              {/* Cognitive level breakdown & status */}
              <div className="pt-2.5 border-t border-amber-100 flex items-center justify-between text-[11px] text-slate-700 font-semibold">
                <div className="flex items-center gap-2">
                  <span>Biết: <strong>{luat.bietTarget}đ</strong></span>
                  <span>Hiểu: <strong>{luat.hieuTarget}đ</strong></span>
                  <span>VD: <strong>{luat.vanDungTarget}đ</strong></span>
                </div>
                <span className="text-indigo-800 font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[10px]">
                  Tổng 10,0đ
                </span>
              </div>
            </div>
          </div>

          {/* BLOCK 3: NỘI DUNG BÀI HỌC & YÊU CẦU CẦN ĐẠT (Collapsible & Clean) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs transition-all">
            {/* Block Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  NỘI DUNG BÀI HỌC & YÊU CẦU CẦN ĐẠT
                </h3>
                {config.topicTitle && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-200">
                    {config.topicTitle.split('\n').filter(Boolean).length} bài học
                  </span>
                )}
                {config.learningOutcomes && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold border border-purple-200">
                    {config.learningOutcomes.split('\n').filter(Boolean).length} YCCĐ
                  </span>
                )}
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                {onClearOldContent && (
                  <button
                    type="button"
                    onClick={onClearOldContent}
                    className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Xóa toàn bộ nội dung bài cũ"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xóa nội dung</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSyncDocsToLessonFields}
                  disabled={!config.uploadedDocs || config.uploadedDocs.length === 0}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  title="Nạp nội dung từ Nguồn học liệu & YCCĐ vào các ô bên dưới"
                >
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Nạp từ Nguồn học liệu ({config.uploadedDocs?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCurriculumModal(true)}
                  className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Thư viện GDPT 2018</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAnalyzeDocs()}
                  disabled={isAnalyzingLesson}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>AI Đề xuất</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLessonDetails(!showLessonDetails)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title={showLessonDetails ? 'Thu gọn chi tiết bài học & YCCĐ' : 'Mở rộng chi tiết bài học & YCCĐ'}
                >
                  <span>{showLessonDetails ? 'Thu gọn' : 'Mở rộng chi tiết'}</span>
                  {showLessonDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* 3 Columns Input Area (Collapsible) */}
            {showLessonDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs pt-1">
              {/* Column 1: Tên bài & Chương */}
              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Tên bài / Chủ đề (Mỗi bài 1 dòng):
                    </label>
                    {config.topicTitle && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Sparkles className="w-2.5 h-2.5" />
                        {config.topicTitle.split('\n').filter(Boolean).length} bài
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={config.topicTitle || ''}
                    onChange={(e) => onChangeConfig({ ...config, topicTitle: e.target.value })}
                    placeholder="Bài 1: Hàm số và Đồ thị&#10;Bài 2: Cực trị hàm số&#10;Bài 3: Tiệm cận..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Chương / Phạm vi (Tương ứng theo bài):
                    </label>
                    {config.chapter && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {config.chapter.split('\n').filter(Boolean).length} chương
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={config.chapter || config.knowledgeScope || ''}
                    onChange={(e) => onChangeConfig({ ...config, chapter: e.target.value, knowledgeScope: e.target.value })}
                    placeholder="Chương I&#10;Chương I&#10;Chương I..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y"
                  />
                </div>
              </div>

              {/* Column 2: Yêu cầu cần đạt / Mục tiêu đánh giá */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Yêu cầu cần đạt / Mục tiêu đánh giá:
                  </label>
                  {config.learningOutcomes && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      <Sparkles className="w-2.5 h-2.5" />
                      {config.learningOutcomes.split('\n').filter(Boolean).length} YCCĐ
                    </span>
                  )}
                </div>
                <textarea
                  rows={8.5}
                  value={config.learningOutcomes || ''}
                  onChange={(e) => onChangeConfig({ ...config, learningOutcomes: e.target.value })}
                  placeholder="VD: Nhận biết cực trị, tính được giới hạn, giải quyết bài toán tối ưu..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y min-h-[160px]"
                />
              </div>

              {/* Column 3: Dán nội dung bài học hoặc ngữ liệu đọc hiểu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Dán nội dung bài học hoặc ngữ liệu đọc hiểu:
                  </label>
                  {config.readingPassage && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <BookOpen className="w-2.5 h-2.5" />
                      {config.readingPassage.length} ký tự
                    </span>
                  )}
                </div>
                <textarea
                  rows={8.5}
                  value={config.readingPassage || ''}
                  onChange={(e) => onChangeConfig({ ...config, readingPassage: e.target.value })}
                  placeholder="Dán văn bản đoạn trích thơ, văn xuôi, đoạn thông tin khoa học hoặc dữ liệu thực tế..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 font-medium text-slate-800 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none resize-y min-h-[160px]"
                />
              </div>
            </div>
          )}
        </div>

          {/* Expandable Detailed LuatConfigForm Full-Width */}
          {showDetailedLuat && (
            <div className="pt-3 border-t border-slate-200 transition-all">
              <LuatConfigForm
                luat={luat}
                nangLucList={nangLucList}
                onChangeLuat={onChangeLuat}
                onChangeNangLuc={onChangeNangLuc}
              />
            </div>
          )}
        </div>
      )}

      {/* Curriculum Standard Modal */}
      <CurriculumStandardModal
        isOpen={showCurriculumModal}
        onClose={() => setShowCurriculumModal(false)}
        onApply={handleApplyCurriculumTopics}
        config={config}
      />
    </div>
  );
};

export default ConfigPanel;
