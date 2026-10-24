/**
 * Module suy luận và nhận diện tự động Môn học, Bộ sách giáo khoa và Khối lớp
 * Dựa trên thuật toán phân tích ngữ nghĩa, từ khóa chuyên môn GDPT 2018 và tên file.
 */

import { GradeLevel } from '../types/exam';

export const STANDARD_SUBJECTS = [
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
] as const;

export const STANDARD_TEXTBOOKS = [
  'Kết nối tri thức với cuộc sống',
  'Cánh diều',
  'Chân trời sáng tạo',
  'Tự do / Chung các bộ sách',
] as const;

export interface InferredExamMeta {
  subject: string;
  textbook: string;
  grade?: string;
  gradeLevel?: GradeLevel;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

/**
 * Chuẩn hóa tên môn học về danh sách chuẩn của hệ thống
 */
export function normalizeSubject(raw?: string): string {
  if (!raw) return 'Toán học';
  const clean = raw.trim().toLowerCase();

  if (clean.includes('toán') || clean === 'math' || clean === 'mathematics') {
    return 'Toán học';
  }
  if (clean.includes('văn') || clean.includes('ngữ văn') || clean === 'literature') {
    return 'Ngữ văn';
  }
  if (clean.includes('tiếng anh') || clean.includes('ngoại ngữ') || clean === 'english' || clean === 'anh') {
    return 'Tiếng Anh';
  }
  if (clean.includes('khtn') || clean.includes('khoa học tự nhiên') || clean.includes('khoa học tn')) {
    return 'Khoa học tự nhiên';
  }
  if (clean.includes('sử & địa') || clean.includes('lịch sử và địa') || clean.includes('lịch sử & địa')) {
    return 'Lịch sử & Địa lý';
  }
  if (clean.includes('vật lý') || clean.includes('vật lí') || clean === 'physics') {
    return 'Vật lý';
  }
  if (clean.includes('hóa học') || clean.includes('hoá học') || clean === 'hóa' || clean === 'hoá' || clean === 'chemistry') {
    return 'Hóa học';
  }
  if (clean.includes('sinh học') || clean === 'sinh' || clean === 'biology') {
    return 'Sinh học';
  }
  if (clean.includes('lịch sử') || clean === 'sử' || clean === 'history') {
    return 'Lịch sử';
  }
  if (clean.includes('địa lý') || clean.includes('địa lí') || clean === 'địa' || clean === 'geography') {
    return 'Địa lý';
  }
  if (clean.includes('tin học') || clean.includes('tin') || clean === 'computer science' || clean === 'it') {
    return 'Tin học';
  }
  if (clean.includes('kinh tế') || clean.includes('pháp luật') || clean.includes('ktpl') || clean.includes('gdkt')) {
    return 'Giáo dục Kinh tế & Pháp luật';
  }
  if (clean.includes('công dân') || clean.includes('gdcd')) {
    return 'Giáo dục công dân';
  }
  if (clean.includes('công nghệ') || clean === 'technology') {
    return 'Công nghệ';
  }

  // Khớp gần đúng trong danh sách
  for (const s of STANDARD_SUBJECTS) {
    if (clean.includes(s.toLowerCase())) return s;
  }

  return raw;
}

/**
 * Chuẩn hóa tên bộ sách
 */
export function normalizeTextbook(raw?: string): string {
  if (!raw) return 'Kết nối tri thức với cuộc sống';
  const clean = raw.trim().toLowerCase();

  if (clean.includes('kết nối') || clean.includes('kntt') || clean.includes('tri thức với cuộc sống')) {
    return 'Kết nối tri thức với cuộc sống';
  }
  if (clean.includes('cánh diều') || clean.includes('canh dieu')) {
    return 'Cánh diều';
  }
  if (clean.includes('chân trời') || clean.includes('ctst') || clean.includes('sáng tạo')) {
    return 'Chân trời sáng tạo';
  }
  if (clean.includes('tự do') || clean.includes('chung') || clean.includes('tổng hợp')) {
    return 'Tự do / Chung các bộ sách';
  }

  for (const tb of STANDARD_TEXTBOOKS) {
    if (clean.includes(tb.toLowerCase())) return tb;
  }

  return 'Kết nối tri thức với cuộc sống';
}

/**
 * Suy luận Môn học, Bộ sách và Khối lớp trực tiếp từ nội dung văn bản và tên file
 */
export function inferSubjectAndTextbook(
  text: string,
  fileName: string = ''
): InferredExamMeta {
  const combined = (fileName + ' ' + text.slice(0, 30000)).toLowerCase();
  const reasons: string[] = [];

  // 1. NHẬN DIỆN BỘ SÁCH
  let textbook = 'Kết nối tri thức với cuộc sống';
  if (
    combined.includes('kết nối tri thức') ||
    combined.includes('kntt') ||
    combined.includes('tri thức với cuộc sống') ||
    combined.includes('nhà xuất bản giáo dục việt nam - kết nối')
  ) {
    textbook = 'Kết nối tri thức với cuộc sống';
    reasons.push('Nhận diện bộ sách "Kết nối tri thức với cuộc sống"');
  } else if (
    combined.includes('cánh diều') ||
    combined.includes('vepic') ||
    combined.includes('sách cánh diều')
  ) {
    textbook = 'Cánh diều';
    reasons.push('Nhận diện bộ sách "Cánh diều"');
  } else if (
    combined.includes('chân trời sáng tạo') ||
    combined.includes('ctst')
  ) {
    textbook = 'Chân trời sáng tạo';
    reasons.push('Nhận diện bộ sách "Chân trời sáng tạo"');
  }

  // 2. NHẬN DIỆN KHỐI LỚP & CẤP HỌC
  let grade: string | undefined = undefined;
  let gradeLevel: GradeLevel | undefined = undefined;

  const gradeMatch = combined.match(/(?:lớp|khoi|khối|grade|k)\s*(\d{1,2})/i);
  if (gradeMatch && gradeMatch[1]) {
    const num = parseInt(gradeMatch[1], 10);
    if (num >= 6 && num <= 12) {
      grade = String(num);
      gradeLevel = num >= 10 ? 'THPT' : 'THCS';
      reasons.push(`Nhận diện Khối ${grade} (${gradeLevel})`);
    }
  }

  // Bổ sung suy luận khối lớp theo đặc thù môn học GDPT 2018 nếu tài liệu không ghi rõ chữ 'Lớp X'
  if (!grade) {
    if (
      combined.includes('cơ khí chế tạo') ||
      combined.includes('gia công cơ khí') ||
      combined.includes('động cơ đốt trong') ||
      combined.includes('chăn nuôi')
    ) {
      grade = '11';
      gradeLevel = 'THPT';
      reasons.push('Nhận diện chuyên đề Cơ khí chế tạo / Chăn nuôi thuộc Công nghệ 11 (GDPT 2018)');
    } else if (
      combined.includes('điện - điện tử') ||
      combined.includes('mạch điện xoay chiều') ||
      combined.includes('lâm nghiệp') ||
      combined.includes('thủy sản')
    ) {
      grade = '12';
      gradeLevel = 'THPT';
      reasons.push('Nhận diện chuyên đề Công nghệ Điện tử / Thủy sản thuộc Công nghệ 12 (GDPT 2018)');
    } else if (
      combined.includes('vẽ kĩ thuật') ||
      combined.includes('thiết kế kĩ thuật') ||
      combined.includes('trồng trọt')
    ) {
      grade = '10';
      gradeLevel = 'THPT';
      reasons.push('Nhận diện Thiết kế kĩ thuật / Trồng trọt thuộc Công nghệ 10 (GDPT 2018)');
    }
  }

  // 3. NHẬN DIỆN MÔN HỌC
  // Kiểm tra tên file hoặc tiêu đề đầu văn bản trước (độ ưu tiên cao nhất)
  const headerSlice = (fileName + ' ' + text.slice(0, 1500)).toLowerCase();

  const directSubjectRules: Array<{ sub: string; patterns: RegExp[] }> = [
    { sub: 'Toán học', patterns: [/\bmôn\s*:\s*toán/i, /\bsgk\s*toán/i, /\btoán\s*(?:học)?\s*\d{1,2}\b/i, /\btoán\s*1[0-2]\b/i] },
    { sub: 'Ngữ văn', patterns: [/\bmôn\s*:\s*ngữ\s*văn/i, /\bmôn\s*:\s*văn/i, /\bngữ\s*văn\s*\d{1,2}\b/i, /\bsgk\s*ngữ\s*văn/i] },
    { sub: 'Tiếng Anh', patterns: [/\bmôn\s*:\s*tiếng\s*anh/i, /\benglish\s*\d{1,2}\b/i, /\btiếng\s*anh\s*\d{1,2}\b/i, /\bunit\s*\d+\s*:/i] },
    { sub: 'Khoa học tự nhiên', patterns: [/\bmôn\s*:\s*khoa\s*học\s*tự\s*nhiên/i, /\bkhtn\s*\d{1,2}\b/i, /\bkhoa\s*học\s*tự\s*nhiên\s*[6-9]\b/i] },
    { sub: 'Vật lý', patterns: [/\bmôn\s*:\s*vật\s*l[ýí]/i, /\bvật\s*l[ýí]\s*\d{1,2}\b/i, /\bsgk\s*vật\s*l[ýí]/i] },
    { sub: 'Hóa học', patterns: [/\bmôn\s*:\s*hóa\s*học/i, /\bmôn\s*:\s*hoá\s*học/i, /\bhóa\s*học\s*\d{1,2}\b/i, /\bhoá\s*học\s*\d{1,2}\b/i] },
    { sub: 'Sinh học', patterns: [/\bmôn\s*:\s*sinh\s*học/i, /\bsinh\s*học\s*\d{1,2}\b/i, /\bsgk\s*sinh\s*học/i] },
    { sub: 'Lịch sử & Địa lý', patterns: [/\bmôn\s*:\s*lịch\s*sử\s*(?:và|&)\s*địa\s*l[ýí]/i, /\blịch\s*sử\s*(?:và|&)\s*địa\s*l[ýí]\s*[6-9]\b/i] },
    { sub: 'Lịch sử', patterns: [/\bmôn\s*:\s*lịch\s*sử/i, /\blịch\s*sử\s*\d{1,2}\b/i, /\bsgk\s*lịch\s*sử/i] },
    { sub: 'Địa lý', patterns: [/\bmôn\s*:\s*địa\s*l[ýí]/i, /\bđịa\s*l[ýí]\s*\d{1,2}\b/i, /\bsgk\s*địa\s*l[ýí]/i] },
    { sub: 'Tin học', patterns: [/\bmôn\s*:\s*tin\s*học/i, /\btin\s*học\s*\d{1,2}\b/i, /\bsgk\s*tin\s*học/i] },
    { sub: 'Giáo dục Kinh tế & Pháp luật', patterns: [/\bkinh\s*tế\s*(?:&|và)\s*pháp\s*luật/i, /\bgdkt\s*&\s*pl/i, /\bktpl\s*\d{1,2}\b/i] },
    { sub: 'Giáo dục công dân', patterns: [/\bgiáo\s*dục\s*công\s*dân/i, /\bgdcd\s*\d{1,2}\b/i] },
    { sub: 'Công nghệ', patterns: [/\bmôn\s*:\s*công\s*nghệ/i, /\bcông\s*nghệ\s*\d{1,2}\b/i, /\bsgk\s*công\s*nghệ/i] },
  ];

  for (const rule of directSubjectRules) {
    for (const pat of rule.patterns) {
      if (pat.test(headerSlice)) {
        reasons.push(`Tiêu đề tài liệu chứa định danh môn "${rule.sub}"`);
        return {
          subject: rule.sub,
          textbook,
          grade,
          gradeLevel,
          confidence: 'high',
          reasons,
        };
      }
    }
  }

  // 4. ĐẾM TỪ KHÓA CHUYÊN NGÀNH GDPT 2018 (SEMANTIC KEYWORD SCORING)
  const scores: Record<string, number> = {
    'Toán học': 0,
    'Ngữ văn': 0,
    'Tiếng Anh': 0,
    'Khoa học tự nhiên': 0,
    'Vật lý': 0,
    'Hóa học': 0,
    'Sinh học': 0,
    'Lịch sử': 0,
    'Địa lý': 0,
    'Tin học': 0,
    'Giáo dục Kinh tế & Pháp luật': 0,
    'Giáo dục công dân': 0,
    'Công nghệ': 0,
  };

  const keywords: Record<string, string[]> = {
    'Toán học': [
      'đạo hàm', 'tích phân', 'nguyên hàm', 'lượng giác', 'tọa độ', 'véc tơ', 'vectơ',
      'xác suất', 'hình học không gian', 'số phức', 'bất đẳng thức', 'phương trình bậc',
      'hàm số', 'tiệm cận', 'cực trị', 'đồng biến', 'nghịch biến', 'cấp số cộng',
      'cấp số nhân', 'logarit', 'lũy thừa', 'tứ diện', 'hình chóp', 'khối lăng trụ',
      'hình nón', 'hình trụ', 'mặt cầu', 'nhị thức newton', 'tập hợp', 'mệnh đề'
    ],
    'Ngữ văn': [
      'tác phẩm', 'tác giả', 'nhân vật', 'đoạn trích', 'nghị luận xã hội', 'nghị luận văn học',
      'biện pháp tu từ', 'so sánh', 'ẩn dụ', 'hoán dụ', 'điệp từ', 'thể thơ', 'nhan đề',
      'tâm trạng', 'tình cảm', 'thông điệp', 'nội dung chính', 'nghệ thuật đặc sắc',
      'truyện ngắn', 'tiểu thuyết', 'thơ lục bát', 'thơ tự do', 'tùy bút', 'truyện thơ'
    ],
    'Tiếng Anh': [
      'vocabulary', 'grammar', 'pronunciation', 'reading passage', 'choose the correct answer',
      'present perfect', 'past continuous', 'conditional sentence', 'passive voice',
      'reported speech', 'relative clause', 'synonym', 'antonym', 'stress on the',
      'listening comprehension', 'question 1', 'fill in the blank'
    ],
    'Vật lý': [
      'dao động điều hòa', 'con lắc lò xo', 'con lắc đơn', 'sóng cơ', 'sóng âm',
      'giao thoa sóng', 'dòng điện xoay chiều', 'điện trường', 'từ trường', 'cảm ứng điện từ',
      'quang học', 'thấu kính', 'động năng', 'thế năng', 'cơ năng', 'định luật newton',
      'lực lorentz', 'tần số góc', 'chu kì', 'biên độ dao động', 'quang phổ', 'vật lí'
    ],
    'Hóa học': [
      'cân bằng hóa học', 'phản ứng thuận nghịch', 'hằng số cân bằng', 'este', 'lipit',
      'cacbohiđrat', 'glucozơ', 'amino axit', 'peptit', 'protein', 'polime', 'kim loại kiềm',
      'kim loại kiềm thổ', 'nhôm', 'sắt', 'oxi hóa - khử', 'cấu hình electron', 'bảng tuần hoàn',
      'ancol', 'anđehit', 'axit cacboxylic', 'nhiệt động hóa học', 'dung dịch đệm', 'ph'
    ],
    'Sinh học': [
      'tế bào', 'adn', 'arn', 'gen', 'nhiễm sắc thể', 'đột biến gen', 'đột biến nhiễm sắc thể',
      'nguyên phân', 'giảm phân', 'thụ tinh', 'di truyền', 'menđen', 'quần thể', 'quần xã',
      'hệ sinh thái', 'chuỗi thức ăn', 'lưới thức ăn', 'tiến hóa', 'quang hợp', 'hô hấp tế bào',
      'trao đổi chất', 'chọn lọc tự nhiên'
    ],
    'Khoa học tự nhiên': [
      'khoa học tự nhiên', 'vật sống', 'chất tinh khiết', 'hỗn hợp', 'nguyên tử', 'nguyên tố',
      'tế bào thực vật', 'tế bào động vật', 'trao đổi chất và năng lượng', 'lực và chuyển động',
      'ánh sáng và khúc xạ', 'hệ tiêu hóa', 'hệ tuần hoàn', 'trái đất và bầu trời'
    ],
    'Lịch sử': [
      'chiến dịch', 'kháng chiến', 'phong trào cách mạng', 'đảng cộng sản', 'triều đại',
      'hiệp định', 'chiến tranh thế giới', 'liên hợp quốc', 'mặt trận việt minh', 'cách mạng tháng tám',
      'đổi mới 1986', 'chính sách thuộc địa', 'thực dân pháp', 'đế quốc', 'khởi nghĩa'
    ],
    'Địa lý': [
      'khí hậu', 'nhiệt đới ẩm gió mùa', 'địa hình', 'sông ngòi', 'khoáng sản', 'thổ nhưỡng',
      'dân số', 'đô thị hóa', 'cơ cấu kinh tế', 'ngành nông nghiệp', 'ngành công nghiệp',
      'ngành dịch vụ', 'vùng kinh tế trọng điểm', 'đồng bằng sông hồng', 'đồng bằng sông cửu long',
      'atlat địa lí', 'bản đồ'
    ],
    'Tin học': [
      'thuật toán', 'lập trình', 'ngôn ngữ python', 'biến', 'vòng lặp', 'hàm', 'cơ sở dữ liệu',
      'mạng máy tính', 'internet', 'bảng tính', 'excel', 'an toàn thông tin', 'hệ điều hành',
      'phần cứng', 'phần mềm', 'thiết bị số', 'trí tuệ nhân tạo'
    ],
    'Giáo dục Kinh tế & Pháp luật': [
      'kinh tế thị trường', 'cung cầu', 'lạm phát', 'thất nghiệp', 'ngân sách nhà nước',
      'thuế', 'sản xuất kinh doanh', 'pháp luật', 'vi phạm pháp luật', 'trách nhiệm pháp lý',
      'quyền bình đẳng', 'quyền tự do cơ bản', 'hiến pháp', 'bộ máy nhà nước'
    ],
    'Giáo dục công dân': [
      'giáo dục công dân', 'chuẩn mực đạo đức', 'lòng tự trọng', 'tình yêu thương con người',
      'tôn trọng sự thật', 'kỷ luật', 'quyền trẻ em', 'bảo vệ môi trường'
    ],
    'Công nghệ': [
      'bản vẽ kỹ thuật', 'cơ khí chế tạo', 'vật liệu cơ khí', 'gia công cơ khí', 'chi tiết máy',
      'động cơ đốt trong', 'mạch điện', 'công nghệ điện', 'điện dân dụng', 'trồng trọt',
      'chăn nuôi', 'thủy sản', 'lâm nghiệp', 'thiết kế kỹ thuật', 'an toàn lao động'
    ],
  };

  for (const [sub, termList] of Object.entries(keywords)) {
    for (const term of termList) {
      if (combined.includes(term)) {
        // Trọng số cao hơn nếu từ khóa xuất hiện nhiều lần hoặc ở đầu bài
        scores[sub] = (scores[sub] || 0) + 1;
      }
    }
  }

  // Tìm môn có điểm cao nhất
  let maxScore = 0;
  let detectedSubject = 'Toán học';

  for (const [sub, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedSubject = sub;
    }
  }

  // Nếu là THCS (lớp 6-9) và phát hiện Vật lý, Hóa học, Sinh học đơn lẻ, tự quy về "Khoa học tự nhiên"
  if (grade && parseInt(grade, 10) <= 9 && parseInt(grade, 10) >= 6) {
    if (detectedSubject === 'Vật lý' || detectedSubject === 'Hóa học' || detectedSubject === 'Sinh học') {
      detectedSubject = 'Khoa học tự nhiên';
      reasons.push(`Khối lớp ${grade} (THCS) học môn tích hợp "Khoa học tự nhiên"`);
    } else if (detectedSubject === 'Lịch sử' || detectedSubject === 'Địa lý') {
      detectedSubject = 'Lịch sử & Địa lý';
      reasons.push(`Khối lớp ${grade} (THCS) học môn tích hợp "Lịch sử & Địa lý"`);
    }
  }

  if (maxScore > 0) {
    reasons.push(`Khớp ${maxScore} thuật ngữ chuyên môn đặc trưng của môn "${detectedSubject}"`);
  }

  return {
    subject: detectedSubject,
    textbook,
    grade,
    gradeLevel,
    confidence: maxScore >= 3 ? 'high' : maxScore >= 1 ? 'medium' : 'low',
    reasons,
  };
}
