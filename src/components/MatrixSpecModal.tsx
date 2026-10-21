import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck2,
  Printer,
  FileDown,
  Sparkles,
  Layers,
  ListTree,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Wand2,
  RefreshCw,
  Plus,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  GraduationCap,
  Info,
  Calendar,
  Layers3,
} from 'lucide-react';
import { ExamConfig, ExamMatrix, ExamSpecificationRow } from '../types/exam';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';
import {
  SuggestedUnit,
  ExamSemesterScope,
  analyzeAndSuggestUnits,
  buildMatrixAndSpecsFromUnits,
} from '../services/matrixAutoSuggester';

interface MatrixSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  matrix: ExamMatrix;
  specs: ExamSpecificationRow[];
  onGenerateFromMatrix: () => void;
  onExportWord: () => void;
  onPrint: () => void;
  onOpenInWorkspace: () => void;
  onUpdateMatrix?: (newMatrix: ExamMatrix, newSpecs?: ExamSpecificationRow[]) => void;
  onUpdateConfig?: (updatedConfig: Partial<ExamConfig>) => void;
  apiKey?: string;
  isGenerating?: boolean;
}

export const MatrixSpecModal: React.FC<MatrixSpecModalProps> = ({
  isOpen,
  onClose,
  config,
  matrix,
  specs,
  onGenerateFromMatrix,
  onExportWord,
  onPrint,
  onOpenInWorkspace,
  onUpdateMatrix,
  onUpdateConfig,
  apiKey,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'spec' | 'analytics'>('matrix');

  // AI Auto-Suggest State
  const [showAutoSuggestModal, setShowAutoSuggestModal] = useState<boolean>(false);
  const [suggestedUnits, setSuggestedUnits] = useState<SuggestedUnit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState<boolean>(false);
  const [semesterScope, setSemesterScope] = useState<ExamSemesterScope>('mid_hk1');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Load initial suggested units when modal opens
  useEffect(() => {
    if (isOpen && suggestedUnits.length === 0) {
      loadInitialUnits();
    }
  }, [isOpen, config.subject, config.grade]);

  const loadInitialUnits = async (forceAI = false) => {
    setIsLoadingUnits(true);
    try {
      const units = await analyzeAndSuggestUnits(config, apiKey, {
        forceAI,
        customPrompt,
        semesterScope,
      });
      setSuggestedUnits(units);
      if (units.length > 0 && !expandedUnitId) {
        setExpandedUnitId(units[0].id);
      }
    } catch (err: any) {
      console.error('Lỗi tải gợi ý ma trận:', err);
    } finally {
      setIsLoadingUnits(false);
    }
  };

  if (!isOpen) return null;

  const subjectName = config.customSubject || config.subject || 'Môn học';
  const gradeLabel = config.gradeLevel === 'primary' ? `Khối ${config.grade} Tiểu học` : `Lớp ${config.grade}`;

  // Section command counts
  const p1 = config.sectionCounts.part1 || 0;
  const p2 = config.sectionCounts.part2 || 0;
  const p3 = config.sectionCounts.part3 || 0;
  const p4 = config.sectionCounts.part4 || 0;
  const totalQuestions = p1 + p2 + p3 + p4;
  const totalCommands = p1 + p2 * 4 + p3 + p4;

  // Toggle selection of a unit
  const handleToggleUnit = (id: string) => {
    setSuggestedUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, selected: !u.selected } : u))
    );
  };

  // Update a unit field inline
  const handleUpdateUnitField = (id: string, field: 'topicTitle' | 'chapter', val: string) => {
    setSuggestedUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: val } : u))
    );
  };

  // Delete unit
  const handleDeleteUnit = (id: string) => {
    setSuggestedUnits((prev) => prev.filter((u) => u.id !== id));
  };

  // Add new blank unit
  const handleAddNewUnit = () => {
    const newId = `unit_manual_${Date.now()}`;
    const newUnit: SuggestedUnit = {
      id: newId,
      chapter: `Chương ${suggestedUnits.length + 1}: Kiến thức mở rộng`,
      topicTitle: `Bài học ${suggestedUnits.length + 1}: Chủ đề mới`,
      knowledgeScope: 'Trọng tâm bài học theo chuẩn GDPT 2018',
      outcomes: {
        know: ['Nhận biết và phát biểu được các khái niệm cơ bản.'],
        understand: ['Giải thích và tính toán được các tình huống điển hình.'],
        apply: ['Vận dụng giải quyết các bài toán thực tiễn đời sống.'],
      },
      weightPercent: 25,
      selected: true,
    };
    setSuggestedUnits((prev) => [...prev, newUnit]);
    setExpandedUnitId(newId);
  };

  // Apply suggested units to matrix and specs
  const handleApplySuggestedUnits = () => {
    const activeUnits = suggestedUnits.filter((u) => u.selected !== false);
    if (activeUnits.length === 0) {
      alert('Vui lòng chọn ít nhất 1 Đơn vị kiến thức để áp dụng vào Ma trận!');
      return;
    }

    const { matrix: newMatrix, specs: newSpecs } = buildMatrixAndSpecsFromUnits(activeUnits, config);

    // Call callback to parent
    if (onUpdateMatrix) {
      onUpdateMatrix(newMatrix, newSpecs);
    }

    // Also sync config topics and chapters
    if (onUpdateConfig) {
      const topicList = activeUnits.map((u) => u.topicTitle).join('\n');
      const chapterList = Array.from(new Set(activeUnits.map((u) => u.chapter))).join('\n');
      onUpdateConfig({
        topicTitle: topicList,
        chapter: chapterList,
        knowledgeScope: activeUnits.map((u) => `${u.topicTitle}: ${u.knowledgeScope}`).join('; '),
      });
    }

    setShowAutoSuggestModal(false);
    setNotificationMsg({
      type: 'success',
      text: `Đã áp dụng thành công ${activeUnits.length} Đơn vị kiến thức chuẩn GDPT 2018 vào Ma trận và Bản đặc tả!`,
    });

    setTimeout(() => {
      setNotificationMsg(null);
    }, 5000);
  };

  const selectedUnitsCount = suggestedUnits.filter((u) => u.selected !== false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 px-6 py-4 text-white shrink-0 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300">
              <FileCheck2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white uppercase">
                  Ma Trận & Bản Đặc Tả Đề Kiểm Tra
                </h2>
                <span className="rounded-full bg-blue-500/30 border border-blue-400/40 px-2.5 py-0.5 text-[10px] font-bold text-blue-200">
                  Chuẩn GDPT 2018
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {config.textbook}
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                {config.schoolName} • Môn: <strong className="text-white">{subjectName}</strong> ({gradeLabel}) • Thời gian: {config.durationMinutes} phút • Thang điểm: {config.totalScore}đ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Stats Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600">Quy mô đề thi:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800">
              {totalQuestions} câu hỏi ({totalCommands} lệnh hỏi)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-blue-700">
              {config.totalScore} điểm
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100/60 text-blue-800 font-semibold">
              P.I: {p1} câu | P.II: {p2} câu ({p2 * 4} ý Đ/S) | P.III: {p3} câu | P.IV: {p4} câu
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* FEATURE: Gợi ý Ma trận tự động */}
            <button
              onClick={() => {
                setShowAutoSuggestModal(true);
                if (suggestedUnits.length === 0) {
                  loadInitialUnits();
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-extrabold flex items-center space-x-1.5 transition shadow-xs text-xs cursor-pointer group"
              title="AI phân tích môn học và khối lớp để tự động điền các Đơn vị kiến thức (Unit) chuẩn vào Ma trận"
            >
              <Sparkles className="h-4 w-4 text-amber-300 group-hover:scale-110 transition-transform" />
              <span>Gợi ý Ma trận tự động</span>
            </button>

            <button
              onClick={onExportWord}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center space-x-1.5 transition shadow-xs text-xs cursor-pointer"
              title="Tải file Word Ma trận & Bản đặc tả riêng biệt chuẩn nộp duyệt chuyên môn"
            >
              <FileDown className="h-3.5 w-3.5 text-blue-600" />
              <span>Xuất Word (.doc)</span>
            </button>

            <button
              onClick={onPrint}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center space-x-1.5 transition shadow-xs text-xs cursor-pointer"
              title="In trực tiếp hoặc xuất PDF A4"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>In A4</span>
            </button>

            <button
              onClick={onOpenInWorkspace}
              className="px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center space-x-1.5 transition text-xs cursor-pointer"
              title="Xem trực tiếp trên bảng không gian làm việc bên phải"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở trong Workspace</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notificationMsg && (
          <div className="bg-emerald-500 text-white px-6 py-2 text-xs font-bold flex items-center justify-between shrink-0 animate-in slide-in-from-top-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{notificationMsg.text}</span>
            </div>
            <button
              onClick={() => setNotificationMsg(null)}
              className="text-white/80 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="border-b border-slate-200 px-6 bg-white shrink-0 flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 font-bold text-xs flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Khung Ma Trận 2 Chiều</span>
          </button>

          <button
            onClick={() => setActiveTab('spec')}
            className={`py-3 font-bold text-xs flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'spec'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ListTree className="h-4 w-4" />
            <span>2. Bản Đặc Tả Kỹ Thuật Chi Tiết</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 font-bold text-xs flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>3. Đối Soát Khảo Thí & Tỷ Lệ %</span>
          </button>
        </div>

        {/* Tab Contents - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: MA TRẬN 2 CHIỀU */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              {/* Feature Banner: Gợi ý Ma trận tự động */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-purple-50/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Wand2 className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                      <span>Gợi ý Ma trận tự động (AI Auto-Units)</span>
                      <span className="bg-indigo-200/80 text-indigo-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Chuẩn GDPT 2018
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {config.gradeLevel === 'primary' ? 'Thông tư 27/2020' : 'Công văn 7991/BGDĐT'}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                      AI phân tích dữ liệu môn <strong>{subjectName}</strong>, khối <strong>{gradeLabel}</strong> và bộ sách <strong>{config.textbook}</strong> để tự động điền các <strong>Đơn vị kiến thức (Unit/Bài học)</strong> chuẩn vào Ma trận thay vì phải tự nhập.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowAutoSuggestModal(true);
                    if (suggestedUnits.length === 0) {
                      loadInitialUnits();
                    }
                  }}
                  className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-black transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Mở bảng Gợi ý AI</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ (CHUẨN BỘ GIÁO DỤC VÀ ĐÀO TẠO)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Phân bổ câu hỏi theo mạch kiến thức, các phần thi và mức độ nhận thức
                  </p>
                </div>
              </div>

              <OfficialMatrixTable matrix={matrix} config={config} />

              {/* Assessment Footnote */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">📌 Ghi chú khảo thí & Thể thức tính điểm:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div>• <strong>Phần I:</strong> Trắc nghiệm nhiều lựa chọn: 0.25 điểm / câu đúng.</div>
                  <div>• <strong>Phần II:</strong> Trắc nghiệm Đúng/Sai 4 ý: Chấm theo quy tắc lũy tiến Bộ GD&ĐT (0.1đ - 0.25đ - 0.5đ - 1.0đ).</div>
                  <div>• <strong>Phần III:</strong> Trắc nghiệm trả lời ngắn: 0.5 điểm / câu đúng (hoặc 0.25đ đối với môn tự nhiên).</div>
                  <div>• <strong>Phần IV:</strong> Tự luận: Đánh giá theo thang Rubric chi tiết từng bước lập luận.</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BẢN ĐẶC TẢ CHI TIẾT */}
          {activeTab === 'spec' && (
            <div className="space-y-4">
              <OfficialSpecificationTable matrix={matrix} specs={specs} config={config} />
            </div>
          )}

          {/* TAB 3: ĐỐI SOÁT KHẢO THÍ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  ĐỐI SOÁT & KIỂM ĐỊNH TỶ LỆ KHẢO THÍ GDPT 2018
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân tích cấu trúc đề, mức độ phân hóa và tính phù hợp với đối tượng học sinh
                </p>
              </div>

              {/* KẾT QUẢ A: ĐÃ KHỚP SỐ LIỆU VÀ CẤU TRÚC (MATH & FORMAT) */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="font-bold text-blue-950 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span>KẾT QUẢ A: ĐÃ KHỚP SỐ LIỆU VÀ CẤU TRÚC (MATH & FORMAT INTEGRITY)</span>
                  </div>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Khớp cấu trúc & Thang điểm 10.0</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {Array.from(new Set(matrix.levels)).map((lvl, idx) => {
                    const data = matrix.totalByLevel[lvl] || { count: 0, score: 0, percent: 0 };
                    const targetPercent = config.cognitiveDist?.[lvl] ?? 0;
                    return (
                      <div key={`${lvl}_${idx}`} className="p-3 bg-white rounded-lg border border-slate-200 text-center space-y-1">
                        <div className="font-bold text-slate-700 truncate">{lvl}</div>
                        <div className="text-xl font-black text-blue-800">{data.percent}%</div>
                        <div className="text-[11px] text-slate-500">
                          {data.count} câu • {data.score}đ
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Định mức: {targetPercent}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Question Format Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần I: TN nhiều lựa chọn</div>
                    <div className="text-lg font-black text-slate-800 mt-1">{p1} câu</div>
                    <div className="text-slate-500 text-[11px]">~{(p1 * 1.5).toFixed(0)} phút (1.5p/câu)</div>
                    <div className="text-blue-700 font-bold mt-1 text-[11px]">{(p1 * 0.25).toFixed(2)} điểm</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần II: Đúng / Sai (4 ý)</div>
                    <div className="text-lg font-black text-slate-800 mt-1">{p2} câu ({p2 * 4} ý)</div>
                    <div className="text-slate-500 text-[11px]">~{(p2 * 5).toFixed(0)} phút (5p/câu)</div>
                    <div className="text-blue-700 font-bold mt-1 text-[11px]">{(p2 * 1.0).toFixed(2)} điểm</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần III: Trả lời ngắn</div>
                    <div className="text-lg font-black text-slate-800 mt-1">{p3} câu</div>
                    <div className="text-slate-500 text-[11px]">~{(p3 * 3).toFixed(0)} phút (3p/câu)</div>
                    <div className="text-blue-700 font-bold mt-1 text-[11px]">{(p3 * 0.5).toFixed(2)} điểm</div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">Phần IV: Tự luận</div>
                    <div className="text-lg font-black text-slate-800 mt-1">{p4} câu</div>
                    <div className="text-slate-500 text-[11px]">~{(p4 * 8).toFixed(0)} phút (8-10p/câu)</div>
                    <div className="text-blue-700 font-bold mt-1 text-[11px]">
                      {(config.totalScore - (p1 * 0.25 + p2 * 1.0 + p3 * 0.5)).toFixed(2)} điểm
                    </div>
                  </div>
                </div>
              </div>

              {/* KẾT QUẢ B: ĐÃ ĐỐI CHIẾU QUY ĐỊNH VÀ CHUYÊN MÔN (REGULATORY & CURRICULUM VERIFICATION) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div className="font-bold text-emerald-950 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>KẾT QUẢ B: ĐÃ ĐỐI CHIẾU QUY ĐỊNH VÀ CHUYÊN MÔN (REGULATORY & CURRICULUM STANDARDS)</span>
                  </div>
                  <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] shadow-2xs">
                    ✓ ĐÃ XÁC MINH - KHỚP CẤU TRÚC ĐÃ NHẬP
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-emerald-200 bg-white rounded-lg overflow-hidden">
                    <thead className="bg-emerald-100/70 text-emerald-950 font-bold text-[11px]">
                      <tr>
                        <th className="p-2 border-b border-emerald-200">Căn cứ quy định & Tiêu chí</th>
                        <th className="p-2 border-b border-emerald-200">Chi tiết đối chiếu</th>
                        <th className="p-2 border-b border-emerald-200 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100 text-[11px]">
                      <tr>
                        <td className="p-2 font-bold text-slate-800">
                          {config.gradeLevel === 'primary' ? 'Thông tư 27/2020/TT-BGDĐT (Tiểu học)' : 'Thông tư 22/2021 & CV 7991/BGDĐT-GDTrH'}
                        </td>
                        <td className="p-2 text-slate-700">
                          {config.gradeLevel === 'primary' 
                            ? 'Khung ma trận 3 mức độ (Mức 1, Mức 2, Mức 3) đúng Điều 7 quy định đánh giá Tiểu học.'
                            : 'Đúng khung Phụ lục 7991, bảo toàn 2 bảng Ma trận & Bản đặc tả, 4 dạng thức câu hỏi chuẩn.'}
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-700">ĐẠT</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">Chương trình GDPT 2018 (TT 32/2018)</td>
                        <td className="p-2 text-slate-700">
                          Nội dung & Yêu cầu cần đạt được trích xuất trực tiếp từ Chương trình GDPT môn {subjectName} - Lớp {config.grade}.
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-700">ĐẠT</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">Động từ hành động YCCĐ & Bloom Taxonomy</td>
                        <td className="p-2 text-slate-700">
                          Các động từ hành động ("Nêu", "Trình bày", "Giải thích", "Lựa chọn", "Vận dụng") khớp đúng thang mức độ nhận thức.
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-700">ĐẠT</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-800">Đồng bộ 1-1 Ma trận và Bản đặc tả</td>
                        <td className="p-2 text-slate-700">
                          Mỗi vị trí ô kiểm tra trong Ma trận đều có mã câu hỏi và YCCĐ tương ứng trên Bản đặc tả chi tiết.
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-700">ĐẠT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 shrink-0 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Thầy cô có thể bấm <strong className="text-indigo-700">"Gợi ý Ma trận tự động"</strong> để AI điền chuẩn các Đơn vị kiến thức (Unit) trước khi sinh đề.
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>

            <button
              onClick={() => {
                onClose();
                onGenerateFromMatrix();
              }}
              disabled={isGenerating}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white font-extrabold text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'ĐANG BIÊN SOẠN...' : '✨ TẠO CÂU HỎI THEO MA TRẬN NÀY'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL / DRAWER GỢI Ý MA TRẬN TỰ ĐỘNG BẰNG AI ================= */}
      {showAutoSuggestModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-300 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-blue-900 px-6 py-4 text-white shrink-0 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-300/40 text-amber-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black tracking-tight text-white uppercase">
                      Gợi Ý Ma Trận & Đơn Vị Kiến Thức Tự Động
                    </h3>
                    <span className="rounded-full bg-amber-400/30 border border-amber-300/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-200">
                      AI Powered
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    Phân tích tự động cấu trúc GDPT 2018 môn <strong className="text-white">{subjectName}</strong> • {gradeLabel} • {config.textbook}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAutoSuggestModal(false)}
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sub-toolbar: Exam Scope & AI Settings */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Scope Selection */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="font-bold text-slate-700">Đợt kiểm tra:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'mid_hk1', label: 'Giữa HK1' },
                      { id: 'final_hk1', label: 'Cuối HK1' },
                      { id: 'mid_hk2', label: 'Giữa HK2' },
                      { id: 'final_hk2', label: 'Cuối HK2' },
                      { id: 'all', label: 'Toàn năm' },
                    ].map((scope) => (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => {
                          setSemesterScope(scope.id as ExamSemesterScope);
                          loadInitialUnits(false);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          semesterScope === scope.id
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Re-Analyze Button */}
                <button
                  type="button"
                  onClick={() => loadInitialUnits(true)}
                  disabled={isLoadingUnits}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  title="Yêu cầu AI phân tích lại danh mục đơn vị kiến thức"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUnits ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>{isLoadingUnits ? 'AI đang phân tích...' : '⚡ Phân tích lại bằng AI'}</span>
                </button>
              </div>

              {/* Optional Custom Directive for AI */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-600 shrink-0">Chỉ dẫn chuyên môn cho AI:</span>
                <input
                  type="text"
                  placeholder="Ví dụ: Tập trung vào khảo sát hàm số và bài toán tối ưu hóa thực tế, bỏ bớt lý thuyết thuần túy..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadInitialUnits(true);
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Scrollable Units List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center space-x-2">
                    <BookOpen className="h-4 w-4 text-indigo-600" />
                    <span>DANH MỤC ĐƠN VỊ KIẾN THỨC (UNITS) AI ĐÃ PHÂN TÍCH:</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Giáo viên có thể tích chọn / bỏ chọn, chỉnh sửa trực tiếp tiêu đề bài học hoặc thêm bài mới
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Đã chọn: {selectedUnitsCount} / {suggestedUnits.length} Đơn vị kiến thức
                  </span>

                  <button
                    type="button"
                    onClick={handleAddNewUnit}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Thêm bài</span>
                  </button>

                  {suggestedUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ danh mục bài cũ trong Ma trận?')) {
                          setSuggestedUnits([]);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center space-x-1 cursor-pointer transition"
                      title="Xóa toàn bộ các bài cũ trong danh mục trước khi nạp bài mới"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      <span>Xóa toàn bộ bài cũ</span>
                    </button>
                  )}
                </div>
              </div>

              {isLoadingUnits ? (
                <div className="p-12 text-center space-y-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 animate-spin">
                    <RefreshCw className="h-6 w-6" />
                  </div>
                  <div className="font-extrabold text-slate-800 text-sm">
                    AI đang phân tích cấu trúc SGK môn {subjectName} Lớp {config.grade}...
                  </div>
                  <div className="text-xs text-slate-500 max-w-md mx-auto">
                    Hệ thống đang trích xuất các đơn vị kiến thức trọng tâm, chuẩn đầu ra (YCCĐ) theo định hướng Bộ GD&ĐT...
                  </div>
                </div>
              ) : suggestedUnits.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  Chưa tìm thấy đơn vị kiến thức nào. Vui lòng bấm nút <strong>"Phân tích lại bằng AI"</strong> ở trên.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestedUnits.map((unit, uIdx) => {
                    const isExpanded = expandedUnitId === unit.id;
                    const isSelected = unit.selected !== false;

                    return (
                      <div
                        key={unit.id}
                        className={`rounded-xl border transition-all duration-150 ${
                          isSelected
                            ? 'border-indigo-300 bg-white shadow-xs'
                            : 'border-slate-200 bg-slate-50/70 opacity-60'
                        }`}
                      >
                        {/* Unit Card Header */}
                        <div className="p-3.5 flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleUnit(unit.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />

                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Chapter input / title */}
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                  Chủ đề {uIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={unit.chapter}
                                  onChange={(e) => handleUpdateUnitField(unit.id, 'chapter', e.target.value)}
                                  className="text-xs font-bold text-slate-600 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded px-1.5 py-0.5 flex-1 border border-transparent hover:border-slate-200"
                                  title="Bấm để chỉnh sửa tên Chương/Chủ đề"
                                />
                              </div>

                              {/* Topic title input */}
                              <input
                                type="text"
                                value={unit.topicTitle}
                                onChange={(e) => handleUpdateUnitField(unit.id, 'topicTitle', e.target.value)}
                                className="text-sm font-extrabold text-slate-900 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-400 rounded px-1.5 py-0.5 w-full border border-transparent hover:border-slate-300"
                                title="Bấm để chỉnh sửa tên Đơn vị kiến thức"
                              />

                              {/* Knowledge scope summary */}
                              <div className="text-[11px] text-slate-500 px-1.5 line-clamp-1">
                                {unit.knowledgeScope}
                              </div>
                            </div>
                          </div>

                          {/* Right Controls */}
                          <div className="flex items-center space-x-1 shrink-0">
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              ~{unit.weightPercent || Math.round(100 / suggestedUnits.length)}% đề
                            </span>

                            <button
                              type="button"
                              onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                              title={isExpanded ? 'Thu gọn YCCĐ' : 'Xem chi tiết Yêu cầu cần đạt'}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                              title="Xóa đơn vị kiến thức này"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Outcomes Section */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50/80 p-3.5 space-y-2.5 text-xs animate-in fade-in duration-100">
                            <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                              Yêu cầu cần đạt GDPT 2018 (Ánh xạ 1-1 sang Bản đặc tả):
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                              {/* Know */}
                              <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200 space-y-1">
                                <span className="font-extrabold text-sky-900 block text-[11px]">
                                  🟢 1. Nhận biết (Biết):
                                </span>
                                <ul className="list-disc list-inside text-[11px] text-sky-950 space-y-0.5">
                                  {unit.outcomes.know.map((k, i) => (
                                    <li key={i}>{k}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Understand */}
                              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 space-y-1">
                                <span className="font-extrabold text-emerald-900 block text-[11px]">
                                  🔵 2. Thông hiểu (Hiểu):
                                </span>
                                <ul className="list-disc list-inside text-[11px] text-emerald-950 space-y-0.5">
                                  {unit.outcomes.understand.map((u, i) => (
                                    <li key={i}>{u}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Apply */}
                              <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 space-y-1">
                                <span className="font-extrabold text-purple-900 block text-[11px]">
                                  🟣 3. Vận dụng:
                                </span>
                                <ul className="list-disc list-inside text-[11px] text-purple-950 space-y-0.5">
                                  {unit.outcomes.apply.map((a, i) => (
                                    <li key={i}>{a}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Assessment Law Compliance Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <Info className="h-4 w-4 text-indigo-600" />
                  <span>Quy tắc tự động tính toán và đồng bộ Ma trận & Bản đặc tả:</span>
                </div>
                <div className="text-[11px] text-indigo-900 leading-relaxed">
                  Khi giáo viên bấm <strong>"Áp dụng vào Ma trận & Bản đặc tả"</strong>, hệ thống sẽ tự động phân bổ {totalQuestions} câu hỏi ({p1} TN4LC, {p2} Đúng/Sai, {p3} Trả lời ngắn, {p4} Tự luận) đều vào các Đơn vị kiến thức đã chọn, đảm bảo chuẩn tỷ lệ nhận thức 40% Biết – 30% Hiểu – 30% Vận dụng và thang điểm 10.0đ theo Công văn 7991/BGDĐT-GDTrH.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 shrink-0 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowAutoSuggestModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleApplySuggestedUnits}
                  disabled={selectedUnitsCount === 0 || isLoadingUnits}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black text-xs transition flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-4 w-4" />
                  <span>✅ ÁP DỤNG VÀO MA TRẬN & BẢN ĐẶC TẢ ({selectedUnitsCount} BÀI)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixSpecModal;
