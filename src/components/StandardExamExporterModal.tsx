import React, { useState } from 'react';
import { FileText, Download, Printer, X, FileCheck, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { QuestionItem, ExamConfig, ShuffledExamCode } from '../types/exam';
import { downloadStandardFormDocx, balanceMcqAnswerKeys } from '../utils/docxExporter';
import { downloadAllExamCodesZip } from '../utils/multiCodeExporter';
import { generateShuffledCodes } from '../utils/examShuffler';
import MathRenderer from '../utils/mathRenderer';

interface StandardExamExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  questions: QuestionItem[];
  onChangeConfig?: (updated: ExamConfig) => void;
  shuffledCodes?: ShuffledExamCode[];
  initialExamCode?: string;
}

export const StandardExamExporterModal: React.FC<StandardExamExporterModalProps> = ({
  isOpen,
  onClose,
  config,
  questions,
  onChangeConfig,
  shuffledCodes = [],
  initialExamCode = '101',
}) => {
  if (!isOpen) return null;

  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>(config.pageSize || 'A4');
  const [balanceAnswers, setBalanceAnswers] = useState<boolean>(config.balanceAnswersOption ?? true);

  // Unit configuration state (saved in user config, editable per exam, default pre-filled)
  const [department, setDepartment] = useState<string>(
    config.departmentName || 'SỞ GIÁO DỤC & ĐÀO TẠO TPHCM'
  );
  const [school, setSchool] = useState<string>(
    config.schoolName || 'TRƯỜNG THPT VÕ TRƯỜNG TOẢN'
  );
  const [showOfficial, setShowOfficial] = useState<boolean>(
    config.showOfficialBadge !== false
  );
  const [examCode, setExamCode] = useState<string>(initialExamCode || '101');
  const [examTitle, setExamTitle] = useState<string>(
    config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I'
  );
  const [academicYear, setAcademicYear] = useState<string>(
    config.academicYear || '2026 - 2027'
  );
  const [duration, setDuration] = useState<number>(config.durationMinutes || 45);
  const [showUnitConfig, setShowUnitConfig] = useState<boolean>(false);
  const [manualPageInput, setManualPageInput] = useState<string>(
    config.manualPageCount !== undefined ? String(config.manualPageCount) : ''
  );

  const [fontScale, setFontScale] = useState<'compact' | 'standard' | 'relaxed'>(
    (config.appUiScale as any) || 'standard'
  );

  // Fallback to auto-generated 4 codes if questions exist
  const effectiveCodes = React.useMemo(() => {
    if (shuffledCodes && shuffledCodes.length > 0) return shuffledCodes;
    if (questions && questions.length > 0) {
      return generateShuffledCodes(questions, { variantCount: 4, namingPreset: '101' }, config.grade);
    }
    return [];
  }, [shuffledCodes, questions, config.grade]);

  // Determine current questions: if effectiveCodes has the selected code, use its questions
  const currentQuestions = React.useMemo(() => {
    if (effectiveCodes && effectiveCodes.length > 0) {
      const found = effectiveCodes.find((c) => c.code === examCode);
      if (found) return found.questions;
    }
    return questions;
  }, [effectiveCodes, examCode, questions]);


  const getScaleStyle = (scale: 'compact' | 'standard' | 'relaxed') => {
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

  // Apply answer balancing if option is ON
  const activeQuestions = balanceAnswers ? balanceMcqAnswerKeys(currentQuestions) : currentQuestions;

  const rawSubject = (config.customSubject || config.subject || 'Khoa học tự nhiên').trim();
  const subjectUpper = rawSubject.toUpperCase();
  const gradeStr = `LỚP ${config.grade || '9'}`;

  // Separate question parts
  const p1Questions = activeQuestions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
  const p2Questions = activeQuestions.filter((q) => q.part === 'part2' || q.type === 'true_false_group');
  const p3Questions = activeQuestions.filter((q) => q.part === 'part3' || q.type === 'short_answer');
  const p4Questions = activeQuestions.filter((q) => q.part === 'part4' || q.type === 'essay');

  const p1Score = p1Questions.reduce((s, q) => s + (q.score || 0.25), 0);
  const p2Score = p2Questions.reduce((s, q) => s + (q.score || 1.0), 0);
  const p3Score = p3Questions.reduce((s, q) => s + (q.score || 0.5), 0);
  const p4Score = p4Questions.reduce((s, q) => s + (q.score || 1.0), 0);

  const hasP1 = p1Questions.length > 0;
  const hasP2 = p2Questions.length > 0;
  const hasP3 = p3Questions.length > 0;
  const hasP4 = p4Questions.length > 0;

  // Compute Part 1 page count n
  const calcPart1Pages = (): number => {
    if (manualPageInput.trim() !== '') {
      const parsed = parseInt(manualPageInput, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    const load = 0.25 + 
      (p1Questions.length * 0.08) + 
      (p2Questions.length * 0.28) + 
      (p3Questions.length * 0.12) + 
      (p4Questions.length * 0.25);
    return Math.max(1, Math.ceil(load));
  };

  const displayPageCount = calcPart1Pages();
  const isEstimate = manualPageInput.trim() === '';

  let sectionRomanIndex = 1;
  const toRoman = (n: number) => ['I', 'II', 'III', 'IV', 'V'][n - 1] || `${n}`;

  const p1Roman = hasP1 ? toRoman(sectionRomanIndex++) : '';
  const p2Roman = hasP2 ? toRoman(sectionRomanIndex++) : '';
  const p3Roman = hasP3 ? toRoman(sectionRomanIndex++) : '';
  const p4Roman = hasP4 ? toRoman(sectionRomanIndex++) : '';

  const fmtScore = (num: number) => (num % 1 === 0 ? `${num},0` : num.toFixed(2).replace('.', ','));

  const getUpdatedConfig = (): ExamConfig => ({
    ...config,
    departmentName: department,
    schoolName: school,
    showOfficialBadge: showOfficial,
    examTitle,
    academicYear,
    durationMinutes: duration,
    pageSize,
    balanceAnswersOption: balanceAnswers,
    manualPageCount: manualPageInput.trim() !== '' ? parseInt(manualPageInput, 10) : undefined,
  });

  const handleDownloadDocx = () => {
    const updated = getUpdatedConfig();
    if (onChangeConfig) onChangeConfig(updated);
    downloadStandardFormDocx(updated, activeQuestions, { mode: 'full', examCode });
  };

  const handleDownloadZip = () => {
    const targetCodes = effectiveCodes.length > 0 ? effectiveCodes : shuffledCodes;
    if (targetCodes && targetCodes.length > 0) {
      const updated = getUpdatedConfig();
      if (onChangeConfig) onChangeConfig(updated);
      downloadAllExamCodesZip(updated, targetCodes, { mode: 'full' });
    }
  };

  const handlePrint = () => {
    const updated = getUpdatedConfig();
    if (onChangeConfig) onChangeConfig(updated);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-5 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-5xl max-h-[95vh] bg-slate-200 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <FileCheck className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
                Xuất Đề Kiểm Tra Theo Form Trình Bày Chuẩn 100%
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Khuôn Cố Định CV 7991
                </span>
                {effectiveCodes && effectiveCodes.length > 1 && (
                  <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                    {effectiveCodes.length} Mã Đề
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-blue-200">
                Hiển thị chuẩn lề 2,03cm × 1,91cm • Font Times New Roman 11pt • Bảng đáp án chuẩn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Code Selector Strip if codes exist */}
        {effectiveCodes && effectiveCodes.length > 0 && (
          <div className="no-print bg-slate-800 text-white px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-amber-300">Chọn mã đề xuất:</span>
              <div className="flex flex-wrap gap-1">
                {effectiveCodes.map((c, idx) => (
                  <button
                    key={c.code}
                    onClick={() => setExamCode(c.code)}
                    className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                      examCode === c.code
                        ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-300'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    {idx === 0 ? `⭐ Mã ${c.code}` : `Mã ${c.code}`}
                  </button>
                ))}
              </div>
            </div>

            {effectiveCodes.length > 1 && (
              <button
                onClick={handleDownloadZip}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition flex items-center gap-1 cursor-pointer"
                title="Tải gói ZIP trọn bộ tất cả các mã đề"
              >
                <Download className="w-3.5 h-3.5 text-amber-200" />
                <span>📦 Tải Toàn Bộ {effectiveCodes.length} Mã (.ZIP)</span>
              </button>
            )}
          </div>
        )}

        {/* Main Toolbar & Action Strip */}
        <div className="no-print bg-white border-b border-slate-300 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Unit Config Toggle Button */}
            <button
              onClick={() => setShowUnitConfig(!showUnitConfig)}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cấu hình Đơn vị & Đề</span>
              {showUnitConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Paper Size Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Khổ giấy:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const val = e.target.value as 'A4' | 'Letter';
                  setPageSize(val);
                  if (onChangeConfig) onChangeConfig({ ...config, pageSize: val });
                }}
                className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="A4">A4 (21,0 × 29,7 cm)</option>
                <option value="Letter">Letter (21,59 × 27,94 cm)</option>
              </select>
            </div>

            {/* Answer Balancing Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={balanceAnswers}
                onChange={(e) => {
                  setBalanceAnswers(e.target.checked);
                  if (onChangeConfig) onChangeConfig({ ...config, balanceAnswersOption: e.target.checked });
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <span className="font-bold text-slate-700">
                Cân bằng vị trí đáp án đúng (A, B, C, D)
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span>In Mã {examCode}</span>
            </button>

            <button
              onClick={handleDownloadDocx}
              className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-lg text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Tải Word Mã {examCode}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Unit Config Fields */}
        {showUnitConfig && (
          <div className="no-print bg-indigo-50/70 border-b border-indigo-200 px-6 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-fadeIn">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cơ quan quản lý:</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="VD: SỞ GIÁO DỤC & ĐÀO TẠO TPHCM"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên trường:</label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="VD: TRƯỜNG THPT VÕ TRƯỜNG TOẢN"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tên kỳ kiểm tra:</label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="VD: ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã đề / Năm học:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  placeholder="Mã đề"
                  className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 font-bold text-center text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="Năm học"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center justify-between pt-2 gap-3 border-t border-indigo-200/60">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOfficial}
                  onChange={(e) => setShowOfficial(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-bold text-indigo-950">
                  Hiển thị dòng &quot;ĐỀ CHÍNH THỨC&quot; ở góc trái đề
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span>Số trang đề (Phần 1):</span>
                    {isEstimate && (
                      <span className="text-[10px] text-amber-800 font-normal italic bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300/80">
                        (ước tính)
                      </span>
                    )}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    placeholder={`${displayPageCount}`}
                    value={manualPageInput}
                    onChange={(e) => setManualPageInput(e.target.value)}
                    className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 font-bold text-center text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Thời gian làm bài:</span>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 45)}
                    className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 font-bold text-center text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="font-semibold text-slate-600">phút</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Paper Preview Sheet */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-200">
          <div
            className={`mx-auto bg-white shadow-xl rounded-xs print-sheet text-black font-serif scale-${fontScale} ${
              pageSize === 'Letter' ? 'max-w-[215.9mm]' : 'max-w-[210mm]'
            }`}
            style={{
              paddingTop: '1.91cm',
              paddingBottom: '1.91cm',
              paddingLeft: '2.03cm',
              paddingRight: '2.03cm',
              fontFamily: "'Times New Roman', Times, serif",
              color: '#000000',
              ...getScaleStyle(fontScale),
            }}
          >
            {/* 3. KHỐI ĐẦU ĐỀ (Table 1 row x 2 columns) */}
            <div className="w-full border-b border-[#787878] pb-1.5 mb-2">
              <table className="w-full text-center border-collapse">
                <tbody>
                  <tr>
                    <td className="w-1/2 align-top text-center pr-2">
                      <div className="font-bold text-[10pt] uppercase">{department}</div>
                      <div className="font-bold text-[11pt] uppercase">{school}</div>
                      {showOfficial && (
                        <div className="font-bold text-[10pt] uppercase pt-0.5 tracking-wide">ĐỀ CHÍNH THỨC</div>
                      )}
                      <div className="italic text-[10pt] pt-0.5">(Đề có {displayPageCount} trang)</div>
                    </td>
                    <td className="w-1/2 align-top text-center pl-2">
                      <div className="font-bold text-[11pt] uppercase">{examTitle}</div>
                      <div className="font-bold text-[11pt] uppercase">NĂM HỌC {academicYear}</div>
                      <div className="font-bold text-[11pt] uppercase pt-0.5">
                        Môn: {subjectUpper} - {gradeStr}
                      </div>
                      <div className="italic text-[9.5pt] pt-0.5 font-normal">
                        Thời gian làm bài: {duration} phút (Không kể phát đề)
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. STUDENT INFO LINE */}
            <div className="mb-4 text-[10pt] italic">
              Họ và tên học sinh: .................................................... Lớp: ................ Số báo danh: ................ Mã đề: {examCode && examCode.trim() ? examCode.trim() : '.........'}
            </div>

            {/* 5. TIÊU ĐỀ PHẦN 1 */}
            <div className="text-center font-bold text-[13pt] text-[#003366] my-3 uppercase">
              PHẦN 1: ĐỀ KIỂM TRA
            </div>

            {/* 6 & 7. SECTION I: TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
            {hasP1 && (
              <div className="space-y-3 mb-4">
                <div className="font-bold text-[11pt]">
                  {p1Roman}. PHẦN TRẮC NGHIỆM NHIỀU LỰA CHỌN ({fmtScore(p1Score)} điểm)
                </div>
                <div className="italic text-[10pt] text-slate-800">
                  Thí sinh chọn một phương án trả lời đúng duy nhất trong mỗi câu hỏi từ Câu 1 đến Câu {p1Questions.length}.
                </div>

                <div className="space-y-3 pl-1">
                  {p1Questions.map((q, idx) => (
                    <div key={q.id || idx} className="space-y-1">
                      <p className="font-serif">
                        <strong className="font-bold">Câu {idx + 1}. </strong>
                        <MathRenderer text={q.question} />
                      </p>

                      {/* 2 options per line table or 1 per line */}
                      {q.options && q.options.length >= 4 && (
                        <div className="pl-4 pt-1">
                          <table className="w-full text-left border-collapse border-0">
                            <tbody>
                              <tr>
                                <td className="w-1/2 align-top py-0.5 pr-2">
                                  <MathRenderer text={q.options[0]} />
                                </td>
                                <td className="w-1/2 align-top py-0.5 pl-2">
                                  <MathRenderer text={q.options[1]} />
                                </td>
                              </tr>
                              <tr>
                                <td className="w-1/2 align-top py-0.5 pr-2">
                                  <MathRenderer text={q.options[2]} />
                                </td>
                                <td className="w-1/2 align-top py-0.5 pl-2">
                                  <MathRenderer text={q.options[3]} />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6 & 8. SECTION II: TRẮC NGHIỆM ĐÚNG / SAI */}
            {hasP2 && (
              <div className="space-y-3 mb-4 pt-2">
                <div className="font-bold text-[11pt]">
                  {p2Roman}. PHẦN TRẮC NGHIỆM ĐÚNG / SAI ({fmtScore(p2Score)} điểm)
                </div>
                <div className="italic text-[10pt] text-slate-800">
                  Thí sinh trả lời từ Câu 1 đến Câu {p2Questions.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
                </div>

                <div className="space-y-3 pl-1">
                  {p2Questions.map((q, idx) => {
                    const qNum = idx + 1;
                    const subs = q.subItems && q.subItems.length > 0 ? q.subItems : [
                      { id: '1', label: 'a' as const, statement: '', isCorrect: true },
                      { id: '2', label: 'b' as const, statement: '', isCorrect: false },
                      { id: '3', label: 'c' as const, statement: '', isCorrect: true },
                      { id: '4', label: 'd' as const, statement: '', isCorrect: true },
                    ];

                    return (
                      <div key={q.id || idx} className="space-y-1">
                        <p className="font-serif">
                          <strong className="font-bold">Câu {qNum}. </strong>
                          <MathRenderer text={q.question} />
                        </p>
                        <div className="pl-4 space-y-0.5 text-[11pt]">
                          {subs.map((sub) => (
                            <p key={sub.id}>
                              <strong className="font-bold">{sub.label}) </strong>
                              <MathRenderer text={sub.statement} />
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION III: TRẮC NGHIỆM TRẢ LỜI NGẮN */}
            {hasP3 && (
              <div className="space-y-3 mb-4 pt-2">
                <div className="font-bold text-[11pt]">
                  {p3Roman}. PHẦN TRẮC NGHIỆM TRẢ LỜI NGẮN ({fmtScore(p3Score)} điểm)
                </div>
                <div className="italic text-[10pt] text-slate-800">
                  Thí sinh trả lời từ Câu 1 đến Câu {p3Questions.length}.
                </div>

                <div className="space-y-3 pl-1">
                  {p3Questions.map((q, idx) => {
                    const qNum = idx + 1;
                    return (
                      <div key={q.id || idx} className="space-y-1">
                        <p className="font-serif">
                          <strong className="font-bold">Câu {qNum}. </strong>
                          <MathRenderer text={q.question} />
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION IV: TỰ LUẬN */}
            {hasP4 && (
              <div className="space-y-3 mb-4 pt-2">
                <div className="font-bold text-[11pt]">
                  {p4Roman}. PHẦN TỰ LUẬN ({fmtScore(p4Score)} điểm)
                </div>

                <div className="space-y-3 pl-1">
                  {p4Questions.map((q, idx) => {
                    const qNum = idx + 1;
                    return (
                      <div key={q.id || idx} className="space-y-1">
                        <p className="font-serif">
                          <strong className="font-bold">Câu {qNum} ({fmtScore(q.score || 1.0)} điểm). </strong>
                          <MathRenderer text={q.question} />
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* END MARKER */}
            <div className="text-center py-4 space-y-1">
              <p className="font-bold italic text-[11pt]">------------------- HẾT -------------------</p>
              <p className="italic text-[10pt] text-slate-700">(Cán bộ coi thi không giải thích gì thêm)</p>
            </div>

            {/* PAGE BREAK TO PART 2 */}
            <div className="my-8 border-t-2 border-dashed border-slate-300 pt-8 page-break-before">
              {/* 5. TIÊU ĐỀ PHẦN 2 */}
              <div className="text-center font-bold text-[13pt] text-[#003366] my-3 uppercase">
                PHẦN 2: ĐÁP ÁN - HƯỚNG DẪN CHẤM
              </div>

              {/* 10. ĐÁP ÁN TRẮC NGHIỆM NHIỀU LỰA CHỌN */}
              {hasP1 && (
                <div className="space-y-2 mb-6">
                  <div className="font-bold text-[11pt]">
                    {p1Roman}. ĐÁP ÁN PHẦN TRẮC NGHIỆM NHIỀU LỰA CHỌN ({fmtScore(p1Score)} điểm)
                  </div>
                  <div className="italic text-[10pt]">
                    Mỗi câu trả lời đúng được {fmtScore(p1Questions[0]?.score || 0.25)} điểm. Tổng cộng {p1Questions.length} câu = {fmtScore(p1Score)} điểm.
                  </div>

                  {/* 8-COLUMN GRID TABLE */}
                  <table className="w-full text-center border-collapse border border-[#CCCCCC] text-[11pt]">
                    <tbody>
                      <tr className="bg-[#EAECEE] font-bold">
                        <td className="p-1.5 border border-[#CCCCCC] w-16">Câu</td>
                        {p1Questions.slice(0, 8).map((_, i) => (
                          <td key={i} className="p-1.5 border border-[#CCCCCC]">{i + 1}</td>
                        ))}
                      </tr>
                      <tr className="font-bold text-[#B40000]">
                        <td className="p-1.5 border border-[#CCCCCC]">Đáp án</td>
                        {p1Questions.slice(0, 8).map((q, i) => (
                          <td key={i} className="p-1.5 border border-[#CCCCCC]">{String(q.correctAnswer || 'A').toUpperCase()}</td>
                        ))}
                      </tr>
                      {p1Questions.length > 8 && (
                        <>
                          <tr className="bg-[#EAECEE] font-bold border-t border-[#CCCCCC]">
                            <td className="p-1.5 border border-[#CCCCCC] w-16">Câu</td>
                            {p1Questions.slice(8, 16).map((_, i) => (
                              <td key={i} className="p-1.5 border border-[#CCCCCC]">{i + 9}</td>
                            ))}
                          </tr>
                          <tr className="font-bold text-[#B40000]">
                            <td className="p-1.5 border border-[#CCCCCC]">Đáp án</td>
                            {p1Questions.slice(8, 16).map((q, i) => (
                              <td key={i} className="p-1.5 border border-[#CCCCCC]">{String(q.correctAnswer || 'A').toUpperCase()}</td>
                            ))}
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 11. ĐÁP ÁN TRẮC NGHIỆM ĐÚNG / SAI */}
              {hasP2 && (
                <div className="space-y-2 mb-6">
                  <div className="font-bold text-[11pt]">
                    {p2Roman}. ĐÁP ÁN PHẦN TRẮC NGHIỆM ĐÚNG / SAI ({fmtScore(p2Score)} điểm)
                  </div>
                  <div className="italic text-[9.5pt] space-y-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                    <p className="font-semibold text-slate-800">Quy tắc tính điểm theo quy ước của tổ/trường:</p>
                    <p>- Trả lời đúng 01 ý: được 0,10 điểm.</p>
                    <p>- Trả lời đúng 02 ý: được 0,25 điểm.</p>
                    <p>- Trả lời đúng 03 ý: được 0,50 điểm.</p>
                    <p>- Trả lời đúng cả 04 ý: được 1,00 điểm.</p>
                  </div>

                  {/* 4-COLUMN TABLE: 20% / 12% / 12% / 56% */}
                  <table className="w-full border-collapse border border-[#CCCCCC] text-[11pt] mt-2">
                    <thead>
                      <tr className="bg-[#D6EAF8] font-bold text-center">
                        <th className="p-1.5 border border-[#CCCCCC] w-[20%]">Câu hỏi</th>
                        <th className="p-1.5 border border-[#CCCCCC] w-[12%]">Lệnh hỏi</th>
                        <th className="p-1.5 border border-[#CCCCCC] w-[12%]">Đáp án</th>
                        <th className="p-1.5 border border-[#CCCCCC] w-[56%]">Hướng dẫn giải thích ngắn gọn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p2Questions.map((q, idx) => {
                        const qNumStr = `Câu ${idx + 1}`;
                        const qScoreStr = `(${fmtScore(q.score || 1.0)} điểm)`;
                        const subs = q.subItems && q.subItems.length > 0 ? q.subItems : [
                          { id: '1', label: 'a' as const, statement: '', isCorrect: true },
                          { id: '2', label: 'b' as const, statement: '', isCorrect: false },
                          { id: '3', label: 'c' as const, statement: '', isCorrect: true },
                          { id: '4', label: 'd' as const, statement: '', isCorrect: true },
                        ];

                        return subs.map((sub, sIdx) => (
                          <tr key={`${idx}_${sIdx}`} className="border-b border-[#CCCCCC]">
                            {sIdx === 0 && (
                              <td rowSpan={subs.length} className="p-2 border border-[#CCCCCC] text-center font-bold align-middle">
                                <div>{qNumStr}</div>
                                <div className="font-normal text-[10pt]">{qScoreStr}</div>
                              </td>
                            )}
                            <td className="p-1.5 border border-[#CCCCCC] text-center font-bold">{sub.label})</td>
                            <td className={`p-1.5 border border-[#CCCCCC] text-center font-bold ${sub.isCorrect ? 'text-[#008000]' : 'text-[#C80000]'}`}>
                              {sub.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </td>
                            <td className="p-1.5 border border-[#CCCCCC] text-left">
                              <MathRenderer text={sub.explanation || q.explanation || 'Hướng dẫn giải chi tiết'} />
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ĐÁP ÁN TRẮC NGHIỆM TRẢ LỜI NGẮN */}
              {hasP3 && (
                <div className="space-y-2 mb-6">
                  <div className="font-bold text-[11pt]">
                    {p3Roman}. ĐÁP ÁN PHẦN TRẮC NGHIỆM TRẢ LỜI NGẮN ({fmtScore(p3Score)} điểm)
                  </div>
                  <table className="w-full border-collapse border border-[#CCCCCC] text-[11pt] mt-2">
                    <thead>
                      <tr className="bg-[#D6EAF8] font-bold text-center">
                        <th className="p-1.5 border border-[#CCCCCC] w-[18%]">Câu hỏi</th>
                        <th className="p-1.5 border border-[#CCCCCC] w-[28%]">Đáp án chính xác</th>
                        <th className="p-1.5 border border-[#CCCCCC] w-[54%]">Hướng dẫn phương pháp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p3Questions.map((q, idx) => {
                        const qNum = idx + 1;
                        return (
                          <tr key={idx} className="border-b border-[#CCCCCC]">
                            <td className="p-1.5 border border-[#CCCCCC] text-center font-bold">Câu {qNum}</td>
                            <td className="p-1.5 border border-[#CCCCCC] text-center font-bold">{String(q.correctAnswer || '.........')}</td>
                            <td className="p-1.5 border border-[#CCCCCC] text-left">
                              <MathRenderer text={q.explanation || 'Tính toán theo công thức cốt lõi.'} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 12. ĐÁP ÁN TỰ LUẬN */}
              {hasP4 && (
                <div className="space-y-3 mb-6">
                  <div className="font-bold text-[11pt]">
                    {p4Roman}. ĐÁP ÁN VÀ THANG ĐIỂM PHẦN TỰ LUẬN ({fmtScore(p4Score)} điểm)
                  </div>

                  {p4Questions.map((q, idx) => {
                    const qNum = idx + 1;
                    const qScore = q.score || 1.0;
                    const rubric = q.rubric && q.rubric.length > 0 ? q.rubric : [
                      { step: '1', point: qScore * 0.25, detail: q.explanation || 'Nêu đúng định nghĩa / ý chính câu hỏi.' },
                      { step: '2', point: qScore * 0.25, detail: 'Viết công thức biến đổi và thay số chuẩn.' },
                      { step: '3', point: qScore * 0.5, detail: 'Tính toán chính xác kết quả kèm đơn vị đo.' },
                    ];

                    return (
                      <div key={idx} className="space-y-1">
                        <p className="font-bold text-[11pt]">Câu {qNum} ({fmtScore(qScore)} điểm):</p>
                        <table className="w-full border-collapse border border-[#CCCCCC] text-[11pt]">
                          <tbody>
                            {rubric.map((r, rIdx) => (
                              <tr key={rIdx} className="border-b border-[#CCCCCC]">
                                <td className="p-2 border border-[#CCCCCC] w-[82%] text-left">
                                  <span className="font-bold">• </span>
                                  <MathRenderer text={r.detail} />
                                </td>
                                <td className="p-2 border border-[#CCCCCC] w-[18%] text-center font-bold">
                                  {fmtScore(r.point)} điểm
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print px-6 py-3 bg-white border-t border-slate-300 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-medium">
            Tên file Word tự động: <strong>{rawSubject.replace(/\s+/g, '_')}_Khoid{config.grade || '9'}_{examTitle.replace(/\s+/g, '_')}_MaDe{examCode}.docx</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandardExamExporterModal;
