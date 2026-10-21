/**
 * Định nghĩa cấu trúc dữ liệu cho Hệ thống Ra Đề Kiểm Tra AI – GDPT 2018 (CV 7991 Engine)
 */

export type GradeLevel = 'THPT' | 'THCS' | 'primary' | 'secondary' | 'high';

export type CognitiveLevel = 'Biet' | 'Hieu' | 'VanDung';

export type QuestionType = 'NLC' | 'DS' | 'TLN' | 'TL';

export interface LuatConfig {
  nlcCount: number;         // Số câu Trắc nghiệm nhiều lựa chọn
  nlcPrice: number;         // Đơn giá mỗi câu NLC (VD: 0.25)
  dsCount: number;          // Số câu lớn Trắc nghiệm Đúng/Sai
  dsSubItems: number;       // Số ý mỗi câu Đúng/Sai (Mặc định 4)
  dsPricePerSub: number;    // Đơn giá mỗi ý Đúng/Sai (VD: 0.25 -> 1 câu 4 ý = 1.0 điểm)
  tlnCount: number;         // Số câu Trắc nghiệm trả lời ngắn (0 nếu không dùng)
  tlnPrice: number;         // Đơn giá mỗi câu TLN (VD: 0.5)
  tlCount: number;          // Số câu Tự luận
  tlUnit: 'cau' | 'y';      // Đơn vị tính tự luận ("câu" hoặc "ý")
  tlPrice: number;          // Đơn giá tự luận (VD: 1.0/câu)
  
  bietTarget: number;       // Mục tiêu điểm Mức Biết (VD: 4.0)
  hieuTarget: number;       // Mục tiêu điểm Mức Hiểu (VD: 3.0)
  vanDungTarget: number;    // Mục tiêu điểm Mức Vận dụng (VD: 3.0)
  tolerance: number;        // Dung sai cho phép (Mặc định 0.0)
  presetName?: string;      // Tên preset ("3-4-3", "3-2-2-3", "4-3-3", "5-2-3", "custom")
  showTlnColumnsIfZero?: boolean; // Tùy chọn hiện cột TLN trống khi tlnCount = 0
  groupYccdMode?: 'by_level' | 'split_lines'; // Trình bày YCCĐ đặc tả ("gom một ô theo mức" hay "tách dòng")
  showQuestionColInSpec?: boolean; // Hiện cột "Câu" trong bản đặc tả (mặc định false)
}

export interface NangLucItem {
  ten: string;              // Tên năng lực (VD: "Tư duy và lập luận toán học")
  viettat: string;          // Chữ viết tắt ký hiệu (VD: "TD")
}

export interface YccdItem {
  ma: string;               // Mã YCCĐ (VD: "ND1.1")
  noiDung: string;          // Nội dung YCCĐ nguyên văn
  dongTu?: string;          // Động từ hành vi chuẩn
  mucToiDa: CognitiveLevel; // Mức tối đa gợi ý từ bảng động từ (Biết | Hiểu | Vận dụng)
  nangLuc?: string;         // Ký hiệu năng lực thành phần (VD: "TD1")
}

export interface NoiDungItem {
  id: string;               // Mã nội dung (VD: "ND1")
  ten: string;              // Tên nội dung / đơn vị kiến thức
  trongSo: number;          // Trọng số (số tiết hoặc %; mặc định theo số YCCĐ)
  yccd: YccdItem[];
}

export interface ChuDeItem {
  id: string;               // Mã chủ đề / chương (VD: "CD1")
  ten: string;              // Tên chủ đề / chương
  noiDung: NoiDungItem[];
}

export interface CauItem {
  id: string;               // Mã nội bộ (VD: NLC1, DS1_a, TLN1, TL1)
  noiDungId: string;        // ID nội dung kiến thức (VD: ND1)
  chuDeId?: string;         // ID chủ đề / chương (VD: CD1)
  dang: QuestionType;       // NLC | DS | TLN | TL
  muc: CognitiveLevel;      // Biet | Hieu | VanDung
  cauSo?: number;           // Số thứ tự câu lớn trong đề thi (1..N)
  y?: 'a' | 'b' | 'c' | 'd'; // Nhãn ý cho Đúng/Sai
  diem: number;             // Số điểm của câu/ý này
  maYCCD: string[];         // Danh sách mã YCCĐ đo
  nangLuc?: string;         // Ký hiệu năng lực (VD: NL1)
  nguon?: string;           // Trích nguồn tài liệu (trang/mục trong văn bản)
  cauHoiText?: string;      // Nội dung câu hỏi AI soạn
  phuongAn?: string[];      // Phương án Lựa chọn [A, B, C, D]
  dapAn?: string;           // Đáp án đúng
  huongDanCham?: string;    // Hướng dẫn chấm / biểu điểm
}

export interface AuditCheckItem {
  id: string;               // K1 .. K15
  ten: string;              // Tên tiêu chí
  type: 'ERROR' | 'WARNING';// LỖI (khóa xuất file) hoặc CẢNH BÁO
  passed: boolean;
  cauTrucNhap?: string;     // Số liệu theo cấu trúc đã nhập
  demDuoc?: string;         // Số liệu thực tế đếm được từ bảng câu
  formula: string;          // Phép tính cụ thể
  sourceLabel: 'Suy từ mẫu Phụ lục CV 7991' | 'Tham số người dùng nhập' | 'Quy tắc của ứng dụng';
  calcMethod: 'Code tính' | 'CHƯA KIỂM CHỨNG';
  details: string;
}

export interface AuditReport {
  passed: boolean;          // true nếu không có LỖI (ERROR) nào
  errorCount: number;
  warningCount: number;
  checks: AuditCheckItem[];
}

export interface QAResultItem {
  id: number;
  title: string;
  passed: boolean;
  details: string;
  severity: 'success' | 'warning' | 'error';
}

export interface QAReport {
  score: number;
  passedAll: boolean;
  items: QAResultItem[];
}

export interface SubStatement {
  id: string;
  label: 'a' | 'b' | 'c' | 'd';
  statement: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface RubricStep {
  step: string;
  point: number;
  detail: string;
}

export interface QuestionItem {
  id: string;
  part: 'part1' | 'part2' | 'part3' | 'part4';
  partTitle?: string;
  type: 'mcq_single' | 'true_false_group' | 'short_answer' | 'essay' | 'matching' | 'fill_blank';
  level: string; // "Biết" | "Hiểu" | "Vận dụng"
  topic: string;
  subTopic?: string;
  passage?: string;
  question: string;
  options?: string[];
  subItems?: SubStatement[];
  correctAnswer: string | boolean | string[];
  explanation: string;
  rubric?: RubricStep[];
  distractorAnalysis?: Record<string, string>;
  score: number;
  yccdCode?: string;
  sourceDoc?: string;
  needsReview?: boolean;
}

export interface ExamHistoryItem {
  id: string;
  timestamp: number;
  dateStr: string;
  examTitle: string;
  subject: string;
  grade: string;
  gradeLevel: GradeLevel;
  totalQuestions: number;
  totalScore: number;
  config: ExamConfig;
  questions: QuestionItem[];
}

export interface StudyGuideFormula {
  name: string;
  formula: string;
  note: string;
}

export interface StudyGuideTrapItem {
  trapType: string;
  description: string;
  exampleQuestion?: string;
  avoidanceTip: string;
}

export interface StudyGuideData {
  topicTitle: string;
  coreConcepts: Array<{ term: string; definition: string }>;
  keyFormulas: StudyGuideFormula[];
  commonMistakes: string[];
  trapList?: StudyGuideTrapItem[];
  timeStrategy?: Array<{ partTitle: string; timeAlloc: string; strategy: string }>;
  readinessChecklist?: string[];
  reviewTips: string[];
}

export interface ExamMatrixCellDetails {
  count: number;
  codeStr?: string;
}

export type MatrixCellValue = number | ExamMatrixCellDetails;

export interface ExamMatrixRow {
  stt?: number;
  chapter?: string;
  topic: string;
  subTopic?: string;
  part1: Record<string, MatrixCellValue>;
  part2: Record<string, MatrixCellValue>;
  part3?: Record<string, MatrixCellValue>;
  part4: Record<string, MatrixCellValue>;
  totalQuestions: number;
  totalScore: number;
  percent: number;
}

export interface ExamMatrix {
  levels: string[];
  rows: ExamMatrixRow[];
  totalByLevel: Record<string, { count: number; score: number; percent: number }>;
  grandTotal: { count: number; score: number; percent: number };
}

export interface ExamSpecificationRow {
  id: string;
  stt: number;
  topic: string;
  subTopic: string;
  competency: string;
  level: string;
  questionType: string;
  questionCount: number;
  questionIds: string[];
  score: number;
}

export interface ExamConfig {
  schoolName: string;
  examTitle: string;
  examType: string;
  gradeLevel: GradeLevel;
  grade: string;             // '6' - '12'
  subject: string;
  customSubject?: string;
  textbook: string;
  durationMinutes: number;
  totalScore: number;        // Cố định 10.0
  academicYear: string;
  departmentName?: string;
  officialExamType?: string;
  pageCountText?: string;
  durationNote?: string;

  luat: LuatConfig;
  nangLuc: NangLucItem[];
  
  // Storage for multi-doc analysis
  uploadedDocs: Array<{ id: string; name: string; content: string; size: number; mimeType?: string }>;

  // Non-optional required sectionCounts for backwards compatibility
  sectionCounts: {
    part1: number;
    part2: number;
    part3: number;
    part4: number;
    matching?: number;
    fill_blank?: number;
  };

  // Optional fields for layout & backward compatibility
  topicTitle?: string;
  chapter?: string;
  knowledgeScope?: string;
  learningOutcomes?: string;
  teacherNotes?: string;
  readingPassage?: string;
  keepFixedQuestions?: boolean;
  teacherFixedQuestions?: QuestionItem[];
  cognitiveSystem?: string;
  cognitiveDist?: Record<string, number>;
  distMode?: 'count' | 'percent';
  layoutLineHeight?: 'compact' | 'standard' | 'relaxed';
  layoutFontSize?: 'small' | 'medium' | 'large';
  appUiScale?: 'compact' | 'standard' | 'relaxed';
}

export interface GradeTabState {
  grade: string;
  subject: string;
  textbook: string;
  examTitle: string;
  durationMinutes: number;
  chuDeList: ChuDeItem[];
  luat: LuatConfig;
  nangLucList: NangLucItem[];
  cauList: CauItem[];
  selectedCandidateIndex?: number;
  unsolvableReason?: string;
  uploadedDocs: Array<{ id: string; name: string; content: string; size: number }>;
  generatedQuestions: QuestionItem[];
}

export interface ShuffledExamCode {
  code: string;
  questions: QuestionItem[];
  quickAnswers: Array<{
    stt: number;
    part: string;
    answer: string;
  }>;
}
