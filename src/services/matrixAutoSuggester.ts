import { ExamConfig, ExamMatrix, ExamSpecificationRow, ExamMatrixRow } from '../types/exam';
import { fetchGeminiWithFallback, extractTextFromGeminiResponse, tryRepairJson } from '../utils/geminiModels';
import { CURRICULUM_STANDARDS, getCurriculumBySubjectAndGrade, CurriculumTopic } from '../data/curriculumStandards';
import { getCognitiveLevelsList } from '../utils/matrixSpecBuilder';

export interface SuggestedUnit {
  id: string;
  chapter: string;          // Tên Chương / Mạch nội dung
  topicTitle: string;       // Tên Đơn vị kiến thức / Bài học
  knowledgeScope: string;   // Phạm vi kiến thức
  outcomes: {
    know: string[];         // YCCĐ Biết (Nhận biết / Mức 1)
    understand: string[];   // YCCĐ Hiểu (Thông hiểu / Mức 2)
    apply: string[];        // YCCĐ Vận dụng (Vận dụng / Mức 3)
  };
  weightPercent?: number;   // Trọng số phân bổ
  selected?: boolean;
}

export type ExamSemesterScope = 'mid_hk1' | 'final_hk1' | 'mid_hk2' | 'final_hk2' | 'all';

/**
 * Thư viện dự phòng đơn vị kiến thức phong phú theo Chương trình GDPT 2018
 * Dành cho các cấp học (Tiểu học, THCS, THPT) khi cần truy xuất tức thì
 */
const EXPANDED_CURRICULUM_REPOSITORY: Record<string, SuggestedUnit[]> = {
  // ================= TIỂU HỌC: TOÁN LỚP 5 =================
  'toan_5': [
    {
      id: 'p5_m1',
      chapter: 'Chương 1: Ôn tập và bổ sung về phân số. Giải toán liên quan đến tỉ lệ',
      topicTitle: 'Phân số thập phân và các phép tính với phân số',
      knowledgeScope: 'Khái niệm phân số thập phân; cộng, trừ, nhân, chia phân số; hỗn số.',
      outcomes: {
        know: ['Nhận biết được phân số thập phân và chuyển đổi phân số về dạng phân số thập phân.', 'Đọc và viết đúng các hỗn số cơ bản.'],
        understand: ['Thực hiện thành thạo phép cộng, trừ, nhân, chia hai phân số và hỗn số.', 'Rút gọn phân số và quy đồng mẫu số.'],
        apply: ['Vận dụng giải bài toán tìm hai số khi biết tổng (hiệu) và tỉ số của hai số đó trong thực tế.']
      },
      weightPercent: 30,
      selected: true
    },
    {
      id: 'p5_m2',
      chapter: 'Chương 2: Số thập phân và các phép tính với số thập phân',
      topicTitle: 'Khái niệm số thập phân và so sánh hai số thập phân',
      knowledgeScope: 'Cấu tạo số thập phân (phần nguyên, phần thập phân); hàng của số thập phân; so sánh số thập phân.',
      outcomes: {
        know: ['Nhận biết được cấu tạo số thập phân và giá trị theo vị trí của từng chữ số.', 'Đọc, viết số thập phân.'],
        understand: ['So sánh và sắp xếp thứ tự các số thập phân theo thứ tự từ bé đến lớn và ngược lại.', 'Viết các số đo đại lượng dưới dạng số thập phân.'],
        apply: ['Vận dụng quy đổi đơn vị đo độ dài, khối lượng, diện tích trong các bài toán thực tiễn đời sống.']
      },
      weightPercent: 40,
      selected: true
    },
    {
      id: 'p5_m3',
      chapter: 'Chương 3: Hình học và Đo lường',
      topicTitle: 'Hình tam giác, hình thang và diện tích',
      knowledgeScope: 'Đặc điểm hình tam giác, hình thang; công thức tính diện tích hình tam giác và diện tích hình thang.',
      outcomes: {
        know: ['Nhận biết được đáy và đường cao tương ứng của hình tam giác, hình thang.', 'Nhớ công thức tính diện tích hình tam giác và hình thang.'],
        understand: ['Tính được diện tích hình tam giác và hình thang khi biết độ dài đáy và chiều cao cùng đơn vị đo.'],
        apply: ['Giải quyết bài toán thực tế tính diện tích mảnh đất, bờ ruộng, vật thể hình tam giác/hình thang.']
      },
      weightPercent: 30,
      selected: true
    }
  ],

  // ================= TIỂU HỌC: TIẾNG VIỆT LỚP 5 =================
  'tieng viet_5': [
    {
      id: 'p5_v1',
      chapter: 'Chủ điểm 1: Việt Nam - Tổ quốc em',
      topicTitle: 'Đọc hiểu văn bản văn học ngợi ca quê hương đất nước',
      knowledgeScope: 'Đọc hiểu nội dung chính, chi tiết hình ảnh nghệ thuật, thông điệp bài đọc ca ngợi vẻ đẹp đất nước.',
      outcomes: {
        know: ['Nhận biết được các chi tiết, hình ảnh, từ ngữ giàu sức gợi trong bài thơ/truyện ca ngợi quê hương.'],
        understand: ['Hiểu được ý nghĩa của các hình ảnh so sánh, nhân hóa và tình cảm của tác giả đối với Tổ quốc.'],
        apply: ['Rút ra bài học về lòng yêu nước và trách nhiệm gìn giữ vẻ đẹp quê hương em.']
      },
      weightPercent: 35,
      selected: true
    },
    {
      id: 'p5_v2',
      chapter: 'Chủ điểm 2: Luyện từ và câu',
      topicTitle: 'Từ đồng nghĩa, từ trái nghĩa và từ nhiều nghĩa',
      knowledgeScope: 'Phân biệt từ đồng nghĩa hoàn toàn và không hoàn toàn; từ trái nghĩa; nghĩa gốc và nghĩa chuyển của từ nhiều nghĩa.',
      outcomes: {
        know: ['Nhận biết được các cặp từ đồng nghĩa, từ trái nghĩa quen thuộc trong ngữ cảnh.'],
        understand: ['Phân biệt được nghĩa gốc và nghĩa chuyển của từ nhiều nghĩa; chọn từ thích hợp để điền vào chỗ trống.'],
        apply: ['Đặt câu có sử dụng từ đồng nghĩa, từ trái nghĩa để làm nổi bật sự đối lập hoặc tương đồng.']
      },
      weightPercent: 35,
      selected: true
    },
    {
      id: 'p5_v3',
      chapter: 'Chủ điểm 3: Tập làm văn',
      topicTitle: 'Viết bài văn tả cảnh thiên nhiên quê hương',
      knowledgeScope: 'Bố cục bài văn tả cảnh (mở bài, thân bài, kết bài); trình tự miêu tả theo thời gian hoặc không gian; sử dụng biện pháp tu từ.',
      outcomes: {
        know: ['Nêu được cấu tạo ba phần của bài văn miêu tả cảnh vật thiên nhiên.'],
        understand: ['Lập được dàn ý chi tiết cho bài văn tả cảnh buổi sáng/hoàng hôn/dòng sông quê hương.'],
        apply: ['Viết đoạn văn mở bài gián tiếp hoặc kết bài mở rộng có cảm xúc và hình ảnh sinh động.']
      },
      weightPercent: 30,
      selected: true
    }
  ],

  // ================= THCS: TOÁN LỚP 9 =================
  'toan_9': [
    {
      id: 'm9_c1',
      chapter: 'Chương I: Phương trình và Hệ hai phương trình bậc nhất hai ẩn',
      topicTitle: 'Phương trình và hệ hai phương trình bậc nhất hai ẩn',
      knowledgeScope: 'Khái niệm phương trình bậc nhất hai ẩn; nghiệm và tập nghiệm; giải hệ phương trình bằng phương pháp thế và cộng đại số.',
      outcomes: {
        know: ['Nhận biết được phương trình bậc nhất hai ẩn và hệ hai phương trình bậc nhất hai ẩn.', 'Kiểm tra một cặp số có là nghiệm của hệ phương trình hay không.'],
        understand: ['Giải thành thạo hệ hai phương trình bậc nhất hai ẩn bằng phương pháp thế hoặc cộng đại số.'],
        apply: ['Vận dụng giải bài toán bằng cách lập hệ phương trình (toán chuyển động, toán năng suất, toán phần trăm thực tế).']
      },
      weightPercent: 35,
      selected: true
    },
    {
      id: 'm9_c2',
      chapter: 'Chương II: Phương trình bậc hai một ẩn và Định lý Viète',
      topicTitle: 'Công thức nghiệm và ứng dụng định lý Viète',
      knowledgeScope: 'Công thức nghiệm tổng quát và công thức nghiệm thu gọn; định lý Viète và ứng dụng tính nhẩm nghiệm, tìm hai số biết tổng và tích.',
      outcomes: {
        know: ['Nhận biết dạng phương trình bậc hai một ẩn $ax^2 + bx + c = 0$ ($a \\neq 0$).', 'Tính biệt thức $\\Delta$ và $\\Delta\'$.'],
        understand: ['Giải phương trình bậc hai bằng công thức nghiệm; áp dụng hệ thức Viète tính giá trị biểu thức đối xứng của các nghiệm.'],
        apply: ['Tìm điều kiện của tham số $m$ để phương trình bậc hai có hai nghiệm thỏa mãn hệ thức cho trước.']
      },
      weightPercent: 35,
      selected: true
    },
    {
      id: 'm9_c3',
      chapter: 'Chương III: Hệ thức lượng trong tam giác vuông và Đường tròn',
      topicTitle: 'Góc ở tâm, góc nội tiếp và tứ giác nội tiếp',
      knowledgeScope: 'Khái niệm góc ở tâm, góc nội tiếp; định lý về số đo góc nội tiếp; dấu hiệu nhận biết tứ giác nội tiếp đường tròn.',
      outcomes: {
        know: ['Nhận biết góc ở tâm, góc nội tiếp chắn một cung trong đường tròn.', 'Nêu định nghĩa và định lý về tứ giác nội tiếp.'],
        understand: ['Chứng minh được một tứ giác là tứ giác nội tiếp dựa vào các dấu hiệu quen thuộc (tổng hai góc đối bằng 180°, hai đỉnh kề nhìn một cạnh dưới cùng một góc).'],
        apply: ['Vận dụng tính chất tứ giác nội tiếp để chứng minh các hệ thức hình học và bài toán tiếp tuyến thực tiễn.']
      },
      weightPercent: 30,
      selected: true
    }
  ],

  // ================= THCS: KHOA HỌC TỰ NHIÊN LỚP 9 =================
  'khoa hoc tu nhien_9': [
    {
      id: 'khtn9_c1',
      chapter: 'Chủ đề 1: Năng lượng cơ học và Động lượng',
      topicTitle: 'Động năng, Thế năng và Định luật bảo toàn cơ năng',
      knowledgeScope: 'Khái niệm động năng, thế năng trọng trường; biểu thức tính cơ năng; định luật bảo toàn và chuyển hóa cơ năng.',
      outcomes: {
        know: ['Nêu được định nghĩa động năng, thế năng và cơ năng của một vật.', 'Viết được công thức tính $W_đ = \\frac{1}{2}mv^2$ và $W_t = mgh$.'],
        understand: ['Giải thích được sự chuyển hóa giữa động năng và thế năng trong các hiện tượng rơi tự do, con lắc đơn.'],
        apply: ['Vận dụng định luật bảo toàn cơ năng để tính vận tốc hoặc độ cao cực đại của vật chuyển động không ma sát.']
      },
      weightPercent: 35,
      selected: true
    },
    {
      id: 'khtn9_c2',
      chapter: 'Chủ đề 2: Kim loại và Sự biến đổi hóa học',
      topicTitle: 'Tính chất hóa học của kim loại và Dãy hoạt động hóa học',
      knowledgeScope: 'Tác dụng của kim loại với phi kim, axit, dung dịch muối; ý nghĩa của dãy hoạt động hóa học của kim loại.',
      outcomes: {
        know: ['Nêu được tính chất hóa học chung của kim loại (tác dụng với oxi, axit clohiđric, dung dịch muối).', 'Nhớ trật tự dãy hoạt động hóa học của kim loại.'],
        understand: ['Viết đúng các phương trình hóa học minh họa tính chất hóa học của kim loại; dự đoán phản ứng xảy ra dựa vào dãy hoạt động hóa học.'],
        apply: ['Tính khối lượng kim loại tham gia phản ứng hoặc thể tích khí hiđro sinh ra sau phản ứng; đề xuất phương pháp hóa học nhận biết kim loại.']
      },
      weightPercent: 35,
      selected: true
    },
    {
      id: 'khtn9_c3',
      chapter: 'Chủ đề 3: Di truyền và Biến dị',
      topicTitle: 'Quy luật di truyền của Menđen và Cấu trúc NST',
      knowledgeScope: 'Khái niệm alen, kiểu gen, kiểu hình; quy luật phân li và phân li độc lập; cấu trúc và chức năng của nhiễm sắc thể (NST).',
      outcomes: {
        know: ['Nêu được các thuật ngữ cơ bản của di truyền học: tính trạng, gen, alen, kiểu gen, kiểu hình.'],
        understand: ['Giải thích được cơ chế phân li và tổ hợp tự do của các cặp alen trong quá trình phát sinh giao tử và thụ tinh.'],
        apply: ['Viết sơ đồ lai và xác định tỉ lệ kiểu gen, kiểu hình ở đời con $F_1, F_2$ trong các phép lai một và hai cặp tính trạng.']
      },
      weightPercent: 30,
      selected: true
    }
  ],

  // ================= THCS: NGỮ VĂN LỚP 9 =================
  'ngu van_9': [
    {
      id: 'nv9_c1',
      chapter: 'Mạch 1: Đọc hiểu văn bản truyện hiện đại',
      topicTitle: 'Truyện ngắn Việt Nam hiện đại (1945 - 1975)',
      knowledgeScope: 'Nhân vật, cốt truyện, ngôi kể, chi tiết tiêu biểu, chủ đề tình yêu quê hương đất nước và vẻ đẹp người lính thời kỳ kháng chiến.',
      outcomes: {
        know: ['Nhận biết được đề tài, ngôi kể, nhân vật chính và cốt truyện của tác phẩm truyện hiện đại.'],
        understand: ['Phân tích được đặc điểm tính cách, tâm lí nhân vật qua hành động, lời nói, suy nghĩ và chi tiết nghệ thuật.'],
        apply: ['Liên hệ ý nghĩa tư tưởng của tác phẩm với lối sống, lý tưởng cống hiến của thế hệ trẻ ngày nay.']
      },
      weightPercent: 40,
      selected: true
    },
    {
      id: 'nv9_c2',
      chapter: 'Mạch 2: Thực hành tiếng Việt',
      topicTitle: 'Khởi ngữ và các thành phần biệt lập của câu',
      knowledgeScope: 'Đặc điểm và công dụng của khởi ngữ; các thành phần tình thái, cảm thán, gọi - đáp, phụ chú.',
      outcomes: {
        know: ['Nhận biết được thành phần khởi ngữ và các thành phần biệt lập trong câu.'],
        understand: ['Phân tích được tác dụng biểu đạt của các thành phần biệt lập trong ngữ cảnh giao tiếp.'],
        apply: ['Chuyển đổi câu không có khởi ngữ thành câu có khởi ngữ; viết đoạn văn có sử dụng thành phần tình thái/cảm thán.']
      },
      weightPercent: 20,
      selected: true
    },
    {
      id: 'nv9_c3',
      chapter: 'Mạch 3: Viết bài văn nghị luận xã hội',
      topicTitle: 'Nghị luận về một tư tưởng đạo lí hoặc hiện tượng đời sống',
      knowledgeScope: 'Kỹ năng giải thích, bàn luận, chứng minh bằng dẫn chứng thực tế; rút ra bài học nhận thức và hành động.',
      outcomes: {
        know: ['Xác định được vấn đề cần nghị luận từ đề bài cho trước.'],
        understand: ['Lập luận chặt chẽ, nêu lí lẽ và dẫn chứng thuyết phục để khẳng định tính đúng đắn của vấn đề.'],
        apply: ['Viết bài văn nghị luận hoàn chỉnh (khoảng 400 - 500 chữ) thể hiện quan điểm cá nhân sâu sắc, nhân văn.']
      },
      weightPercent: 40,
      selected: true
    }
  ],

  // ================= THPT: TOÁN LỚP 12 =================
  'toan_12': [
    {
      id: 'm12_c1',
      chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
      topicTitle: 'Tính đơn điệu, cực trị và tiệm cận của hàm số',
      knowledgeScope: 'Đồng biến, nghịch biến; cực trị hàm số; giá trị lớn nhất - nhỏ nhất; đường tiệm cận đứng, ngang, xiên.',
      outcomes: {
        know: ['Nhận biết khoảng đồng biến, nghịch biến, cực trị và tiệm cận từ bảng biến thiên hoặc đồ thị hàm số.'],
        understand: ['Tìm các khoảng đơn điệu, điểm cực trị, GTLN, GTNN của hàm số đa thức và hàm phân thức bậc nhất trên bậc nhất.'],
        apply: ['Vận dụng đạo hàm giải bài toán tối ưu hóa thực tế trong kinh tế, kỹ thuật và đời sống.']
      },
      weightPercent: 40,
      selected: true
    },
    {
      id: 'm12_c2',
      chapter: 'Chương II: Vectơ và Hệ tọa độ trong không gian',
      topicTitle: 'Phương pháp tọa độ trong không gian Oxyz',
      knowledgeScope: 'Tọa độ điểm, vectơ; tích vô hướng và tích có hướng; góc và khoảng cách trong không gian.',
      outcomes: {
        know: ['Nhận biết hệ trục Oxyz, tọa độ điểm, vectơ đơn vị, công thức độ dài và khoảng cách giữa hai điểm.'],
        understand: ['Thực hiện các phép toán vectơ bằng tọa độ; tính tích vô hướng, góc giữa hai vectơ và tích có hướng.'],
        apply: ['Vận dụng tọa độ Oxyz để mô hình hóa vị trí không gian 3D, tính diện tích tam giác và thể tích tứ diện.']
      },
      weightPercent: 30,
      selected: true
    },
    {
      id: 'm12_c3',
      chapter: 'Chương III: Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm',
      topicTitle: 'Khoảng biến thiên, khoảng tứ phân vị và phương sai mẫu ghép nhóm',
      knowledgeScope: 'Mẫu số liệu ghép nhóm; khoảng biến thiên; khoảng tứ phân vị; phương sai và độ lệch chuẩn.',
      outcomes: {
        know: ['Nhận biết mẫu số liệu ghép nhóm và xác định các nhóm số liệu, tần số của nhóm.'],
        understand: ['Tính được khoảng biến thiên, khoảng tứ phân vị, phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm.'],
        apply: ['Sử dụng các số đặc trưng đo mức độ phân tán để so sánh độ ổn định và mức độ đồng đều của hai tập số liệu thực tế.']
      },
      weightPercent: 30,
      selected: true
    }
  ]
};

/**
 * Trích xuất chuẩn hóa khóa tìm kiếm môn học
 */
function normalizeSubjectKey(subject: string, grade: string): string {
  const s = (subject || '').trim().toLowerCase();
  const g = (grade || '').trim();

  let baseSubject = 'toan';
  if (s.includes('toán') || s.includes('toan')) baseSubject = 'toan';
  else if (s.includes('văn') || s.includes('ngữ văn') || s.includes('van')) baseSubject = 'ngu van';
  else if (s.includes('tiếng việt') || s.includes('tieng viet')) baseSubject = 'tieng viet';
  else if (s.includes('khtn') || s.includes('khoa học tự nhiên')) baseSubject = 'khoa hoc tu nhien';
  else if (s.includes('vật l') || s.includes('vat ly')) baseSubject = 'vat ly';
  else if (s.includes('hóa') || s.includes('hoa hoc')) baseSubject = 'hoa hoc';
  else if (s.includes('sinh') || s.includes('sinh hoc')) baseSubject = 'sinh hoc';
  else if (s.includes('lịch sử') || s.includes('lich su')) baseSubject = 'lich su';
  else if (s.includes('địa') || s.includes('dia ly')) baseSubject = 'dia ly';
  else if (s.includes('tin') || s.includes('tin hoc')) baseSubject = 'tin hoc';
  else if (s.includes('tiếng anh') || s.includes('tieng anh') || s.includes('anh')) baseSubject = 'tieng anh';

  return `${baseSubject}_${g}`;
}

/**
 * Tạo danh sách các Đơn vị kiến thức (Unit) chuẩn thông qua phân tích kết hợp:
 * 1. Kho chuẩn GDPT 2018 (CURRICULUM_STANDARDS & EXPANDED_CURRICULUM_REPOSITORY)
 * 2. Trí tuệ nhân tạo Gemini (nếu có API Key hoặc yêu cầu phân tích sâu theo chuyên đề riêng)
 */
export async function analyzeAndSuggestUnits(
  config: ExamConfig,
  apiKey?: string,
  options?: {
    forceAI?: boolean;
    customPrompt?: string;
    semesterScope?: ExamSemesterScope;
  }
): Promise<SuggestedUnit[]> {
  const subject = config.customSubject || config.subject || 'Toán học';
  const grade = config.grade || '12';
  const textbook = config.textbook || 'Kết nối tri thức với cuộc sống';
  const duration = config.durationMinutes || 45;
  const examType = config.examType || 'Giữa học kỳ 1';

  // 1. Kiểm tra kho chuẩn nếu không ép buộc chạy AI thuần
  if (!options?.forceAI) {
    const key = normalizeSubjectKey(subject, grade);
    if (EXPANDED_CURRICULUM_REPOSITORY[key] && EXPANDED_CURRICULUM_REPOSITORY[key].length > 0) {
      return EXPANDED_CURRICULUM_REPOSITORY[key].map((u) => ({ ...u, selected: true }));
    }

    const cur = getCurriculumBySubjectAndGrade(subject, grade);
    if (cur && cur.topics && cur.topics.length > 0) {
      return cur.topics.map((t: CurriculumTopic, idx: number) => ({
        id: t.id || `cur_${idx + 1}`,
        chapter: t.chapter || `Chủ đề ${idx + 1}`,
        topicTitle: t.topicTitle,
        knowledgeScope: t.knowledgeScope || t.topicTitle,
        outcomes: {
          know: t.outcomes.know || [`Nhận biết các khái niệm cơ bản về ${t.topicTitle}.`],
          understand: t.outcomes.understand || [`Hiểu và giải thích được các quy tắc về ${t.topicTitle}.`],
          apply: t.outcomes.apply || [`Vận dụng giải quyết các bài toán điển hình về ${t.topicTitle}.`]
        },
        weightPercent: Math.round(100 / cur.topics.length),
        selected: true
      }));
    }
  }

  // 2. Chạy Phân tích AI thông minh (Gemini API)
  const cleanKey = (k?: string) => {
    if (!k) return '';
    const trimmed = k.trim();
    if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '""') return '';
    return trimmed;
  };

  const activeApiKey =
    cleanKey(apiKey) ||
    cleanKey(localStorage.getItem('exam_ai_gemini_key_v2') || '') ||
    cleanKey(localStorage.getItem('exam_ai_gemini_key') || '') ||
    cleanKey(import.meta.env.VITE_GEMINI_API_KEY as string) ||
    '';

  if (activeApiKey) {
    try {
      const isPrimary = config.gradeLevel === 'primary' || Number(grade) <= 5;
      const promptText = `
Bạn là Chuyên gia Khảo thí và Phát triển Chương trình Giáo dục Phổ thông 2018 hàng đầu của Bộ GD&ĐT Việt Nam.
Hãy phân tích dữ liệu môn học, khối lớp và bộ sách sau đây để tự động đề xuất từ 3 đến 5 Đơn vị kiến thức (Unit / Bài học trọng tâm) CHUẨN XÁC NHẤT để xây dựng Ma trận & Bản đặc tả đề kiểm tra:

- Cấp học: ${isPrimary ? 'Tiểu học (Thông tư 27/2020/TT-BGDĐT)' : 'Trung học (Công văn 7991/BGDĐT-GDTrH & TT 22/2021)'}
- Môn học: ${subject}
- Khối lớp: Lớp ${grade}
- Bộ sách giáo khoa: ${textbook}
- Loại đề kiểm tra: ${examType}
- Thời gian làm bài: ${duration} phút
${options?.customPrompt ? `- Yêu cầu bổ sung của giáo viên: "${options.customPrompt}"` : ''}

QUY TẮC BẮT BUỘC:
1. Đơn vị kiến thức (Unit) phải bám sát tuyệt đối Chương trình GDPT 2018 và Mục lục SGK môn ${subject} Lớp ${grade} (Bộ sách ${textbook}).
2. Yêu cầu cần đạt (outcomes) phải sử dụng đúng các động từ hành động chuẩn:
   - Biết: Nhận biết được, kể tên được, nêu được, phát biểu được, chỉ ra được...
   - Hiểu: Giải thích được, phân biệt được, so sánh được, tính toán được mức cơ bản...
   - Vận dụng: Vận dụng được, chứng minh được, giải quyết vấn đề thực tế đời sống...
3. Trả về DUY NHẤT một mảng JSON thuần túy gồm các đối tượng có cấu trúc sau:
[
  {
    "id": "unit_1",
    "chapter": "Tên Chương hoặc Mạch nội dung chuẩn...",
    "topicTitle": "Tên Bài học hoặc Đơn vị kiến thức chuẩn...",
    "knowledgeScope": "Phạm vi kiến thức trọng tâm ngắn gọn...",
    "outcomes": {
      "know": ["Yêu cầu cần đạt mức Biết 1", "Yêu cầu cần đạt mức Biết 2"],
      "understand": ["Yêu cầu cần đạt mức Hiểu 1", "Yêu cầu cần đạt mức Hiểu 2"],
      "apply": ["Yêu cầu cần đạt mức Vận dụng 1"]
    },
    "weightPercent": 35
  }
]
`;

      const { data } = await fetchGeminiWithFallback(
        { contents: [{ parts: [{ text: promptText }] }] },
        activeApiKey,
        { temperature: 0.2, responseMimeType: 'application/json' }
      );

      const raw = extractTextFromGeminiResponse(data);
      const parsed = tryRepairJson(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any, idx: number) => ({
          id: item.id || `ai_unit_${idx + 1}`,
          chapter: item.chapter || `Chương ${idx + 1}`,
          topicTitle: item.topicTitle || `Đơn vị kiến thức ${idx + 1}`,
          knowledgeScope: item.knowledgeScope || item.topicTitle || '',
          outcomes: {
            know: Array.isArray(item.outcomes?.know) ? item.outcomes.know : ['Nhận biết kiến thức cơ bản.'],
            understand: Array.isArray(item.outcomes?.understand) ? item.outcomes.understand : ['Hiểu và giải thích các khái niệm.'],
            apply: Array.isArray(item.outcomes?.apply) ? item.outcomes.apply : ['Vận dụng giải quyết bài toán thực tế.']
          },
          weightPercent: item.weightPercent || Math.round(100 / parsed.length),
          selected: true
        }));
      }
    } catch (err) {
      console.warn('Lỗi khi gọi AI Gemini để gợi ý đơn vị kiến thức, chuyển sang bộ sinh dự phòng thông minh:', err);
    }
  }

  // 3. Fallback tổng quát thông minh chuẩn GDPT 2018 khi không có API key hoặc lỗi mạng
  return generateIntelligentFallbackUnits(subject, grade, textbook);
}

/**
 * Bộ sinh đơn vị kiến thức tổng quát dự phòng
 */
function generateIntelligentFallbackUnits(subject: string, grade: string, textbook: string): SuggestedUnit[] {
  return [
    {
      id: 'fb_1',
      chapter: `Chương I: Kiến thức nền tảng và Lý thuyết trọng tâm môn ${subject}`,
      topicTitle: `Đơn vị kiến thức 1: Các khái niệm, quy luật và bản chất cốt lõi`,
      knowledgeScope: `Hệ thống hóa các định nghĩa, quy tắc và hiện tượng cơ bản của môn ${subject} Lớp ${grade} (${textbook}).`,
      outcomes: {
        know: [
          `Nhận biết và phát biểu chính xác các khái niệm, quy tắc, định luật cơ bản của ${subject} Lớp ${grade}.`,
          `Chỉ ra các đại lượng, thuật ngữ và biểu tượng chuyên ngành quy chuẩn.`
        ],
        understand: [
          `Giải thích được mối quan hệ bản chất giữa các thành phần và quy luật trong bài học.`,
          `Phân biệt và so sánh được các dạng bài, hiện tượng tương đồng.`
        ],
        apply: [
          `Vận dụng các công thức và quy tắc đã học vào giải quyết bài tập cơ bản và tình huống thực tiễn quen thuộc.`
        ]
      },
      weightPercent: 40,
      selected: true
    },
    {
      id: 'fb_2',
      chapter: `Chương II: Phương pháp tính toán, Xử lý dữ liệu và Kỹ năng chuyên môn`,
      topicTitle: `Đơn vị kiến thức 2: Kỹ năng phân tích, giải thuật và biểu diễn thông tin`,
      knowledgeScope: `Quy trình thực hiện bài tập, lập luận logic, xử lý bảng số liệu/đồ thị/ngữ liệu thực hành.`,
      outcomes: {
        know: [
          `Nhận biết các bước thực hiện theo quy trình chuẩn và các dấu hiệu nhận dạng đặc thù.`
        ],
        understand: [
          `Thiết lập được phương án giải quyết, lập bảng biểu diễn hoặc sơ đồ tư duy logic.`,
          `Chứng minh hoặc giải thích kết quả tính toán/phân tích một cách khoa học.`
        ],
        apply: [
          `Vận dụng linh hoạt các phương pháp vào các dạng bài tổng hợp có sự kết nối giữa các đơn vị kiến thức.`
        ]
      },
      weightPercent: 30,
      selected: true
    },
    {
      id: 'fb_3',
      chapter: `Chương III: Ứng dụng thực tiễn, Mô hình hóa và Tình huống đời sống`,
      topicTitle: `Đơn vị kiến thức 3: Giải quyết vấn đề liên môn và thực tế xã hội`,
      knowledgeScope: `Vận dụng kiến thức môn học vào bảo vệ môi trường, phát triển kinh tế, đời sống gia đình và xã hội.`,
      outcomes: {
        know: [
          `Nêu được các ứng dụng thực tế điển hình của kiến thức bài học trong cuộc sống hằng ngày.`
        ],
        understand: [
          `Phân tích được vai trò và tác động của các yếu tố môn học đối với thực tiễn đời sống.`
        ],
        apply: [
          `Vận dụng tổng hợp các kiến thức và kỹ năng để giải quyết bài toán thực tế, đề xuất giải pháp khả thi và sáng tạo.`
        ]
      },
      weightPercent: 30,
      selected: true
    }
  ];
}

/**
 * Xây dựng toàn bộ Ma trận và Bản đặc tả từ các Đơn vị kiến thức (Units) đã được AI đề xuất và giáo viên lựa chọn
 * Tuyệt đối tuân thủ Công văn 7991/BGDĐT-GDTrH (hoặc Thông tư 27/2020 cho Tiểu học)
 */
export function buildMatrixAndSpecsFromUnits(
  units: SuggestedUnit[],
  config: ExamConfig
): { matrix: ExamMatrix; specs: ExamSpecificationRow[] } {
  const activeUnits = units.filter((u) => u.selected !== false);
  const unitsToUse = activeUnits.length > 0 ? activeUnits : units;

  const isPrimary = config.gradeLevel === 'primary' || Number(config.grade) <= 5;
  const levels = getCognitiveLevelsList(config);
  const totalScoreGoal = config.totalScore || 10;

  const p1Total = config.sectionCounts.part1 || 0;
  const p2Total = config.sectionCounts.part2 || 0;
  const p3Total = config.sectionCounts.part3 || 0;
  const p4Total = config.sectionCounts.part4 || 0;

  // Tính điểm mỗi phần
  const p1ScorePerQ = 0.25;
  const p2ScorePerQ = 1.0;
  const p3ScorePerQ = 0.5;

  let fixedScore = p1Total * p1ScorePerQ + p2Total * p2ScorePerQ + p3Total * p3ScorePerQ;
  let p4ScoreTotal = Math.max(0, Number((totalScoreGoal - fixedScore).toFixed(2)));
  if (p4Total > 0 && p4ScoreTotal <= 0) {
    p4ScoreTotal = 3.0; // Chuẩn 3.0đ tự luận của CV 7991
  }

  // Phân bổ câu hỏi theo trọng số của từng Unit
  const numUnits = unitsToUse.length;
  let allocatedP1 = 0;
  let allocatedP2 = 0;
  let allocatedP3 = 0;
  let allocatedP4 = 0;

  const rows: ExamMatrixRow[] = unitsToUse.map((unit, uIdx) => {
    const isLast = uIdx === numUnits - 1;
    const ratio = (unit.weightPercent || 100 / numUnits) / 100;

    // Số lượng câu từng phần cho unit này
    const uP1 = isLast ? Math.max(0, p1Total - allocatedP1) : Math.round(p1Total * ratio);
    allocatedP1 += uP1;

    const uP2 = isLast ? Math.max(0, p2Total - allocatedP2) : Math.round(p2Total * ratio);
    allocatedP2 += uP2;

    const uP3 = isLast ? Math.max(0, p3Total - allocatedP3) : Math.round(p3Total * ratio);
    allocatedP3 += uP3;

    const uP4 = isLast ? Math.max(0, p4Total - allocatedP4) : Math.round(p4Total * ratio);
    allocatedP4 += uP4;

    const part1: Record<string, any> = {};
    const part2: Record<string, any> = {};
    const part3: Record<string, any> = {};
    const part4: Record<string, any> = {};

    levels.forEach((lvl) => {
      part1[lvl] = { count: 0, codeStr: '' };
      part2[lvl] = { count: 0, codeStr: '' };
      part3[lvl] = { count: 0, codeStr: '' };
      part4[lvl] = { count: 0, codeStr: '' };
    });

    // 1. Phân bổ Part 1 (TNKQ 4 lựa chọn): Theo CV 7991 ưu tiên Nhận biết (~60%) và Thông hiểu (~40%)
    if (uP1 > 0) {
      const bCount = Math.ceil(uP1 * 0.6);
      const hCount = uP1 - bCount;
      if (bCount > 0) {
        part1[levels[0]] = { count: bCount, codeStr: `a${uIdx + 1}.1` };
      }
      if (hCount > 0 && levels[1]) {
        part1[levels[1]] = { count: hCount, codeStr: `a${uIdx + 1}.2` };
      }
    }

    // 2. Phân bổ Part 2 (Đúng / Sai 4 ý): Theo CV 7991: ý a, b Nhận biết; ý c, d Thông hiểu
    if (uP2 > 0) {
      // Mỗi câu có 4 lệnh hỏi
      part2[levels[0]] = { count: uP2 * 2, codeStr: `d${uIdx + 1}.1` };
      if (levels[1]) {
        part2[levels[1]] = { count: uP2 * 2, codeStr: `d${uIdx + 1}.2` };
      }
    }

    // 3. Phân bổ Part 3 (Trả lời ngắn): Thông hiểu và Vận dụng
    if (uP3 > 0) {
      const hCount = Math.floor(uP3 * 0.5);
      const vCount = uP3 - hCount;
      if (hCount > 0 && levels[1]) {
        part3[levels[1]] = { count: hCount, codeStr: `b${uIdx + 1}.1` };
      }
      if (vCount > 0 && levels[2]) {
        part3[levels[2]] = { count: vCount, codeStr: `b${uIdx + 1}.2` };
      }
    }

    // 4. Phân bổ Part 4 (Tự luận): Vận dụng
    if (uP4 > 0) {
      const vLvl = levels[2] || levels[levels.length - 1];
      part4[vLvl] = { count: uP4, codeStr: `c${uIdx + 1}.1` };
    }

    // Tính điểm của hàng
    const rowScore = Number(
      (
        uP1 * p1ScorePerQ +
        uP2 * p2ScorePerQ +
        uP3 * p3ScorePerQ +
        (p4Total > 0 ? (uP4 / p4Total) * p4ScoreTotal : 0)
      ).toFixed(2)
    );

    const percent = Math.round((rowScore / totalScoreGoal) * 100);

    return {
      stt: uIdx + 1,
      chapter: unit.chapter,
      topic: unit.topicTitle,
      subTopic: unit.knowledgeScope,
      learningOutcomes: {
        know: unit.outcomes.know.join(' '),
        understand: unit.outcomes.understand.join(' '),
        apply: unit.outcomes.apply.join(' ')
      },
      part1,
      part2,
      part3,
      part4,
      totalQuestions: uP1 + uP2 + uP3 + uP4,
      totalScore: rowScore,
      percent
    };
  });

  // Tính tổng theo từng mức độ
  const totalByLevel: Record<string, { count: number; score: number; percent: number }> = {};
  levels.forEach((lvl) => {
    let count = 0;
    let score = 0;
    rows.forEach((r) => {
      const p1C = typeof r.part1?.[lvl] === 'object' ? r.part1[lvl].count : (r.part1?.[lvl] || 0);
      const p2C = typeof r.part2?.[lvl] === 'object' ? r.part2[lvl].count : (r.part2?.[lvl] || 0);
      const p3C = typeof r.part3?.[lvl] === 'object' ? r.part3[lvl].count : (r.part3?.[lvl] || 0);
      const p4C = typeof r.part4?.[lvl] === 'object' ? r.part4[lvl].count : (r.part4?.[lvl] || 0);

      count += p1C + p2C + p3C + p4C;
      score += p1C * p1ScorePerQ + (p2C / 4) * p2ScorePerQ + p3C * p3ScorePerQ + (p4Total > 0 ? (p4C / p4Total) * p4ScoreTotal : 0);
    });

    const roundedScore = Number(score.toFixed(2));
    totalByLevel[lvl] = {
      count,
      score: roundedScore,
      percent: Math.round((roundedScore / totalScoreGoal) * 100)
    };
  });

  const totalQuestions = rows.reduce((s, r) => s + r.totalQuestions, 0);
  const grandTotalScore = totalScoreGoal;

  const matrix: ExamMatrix = {
    levels,
    rows,
    totalByLevel,
    grandTotal: {
      count: totalQuestions,
      score: grandTotalScore,
      percent: 100
    }
  };

  // Đồng bộ sang Bản đặc tả (Specifications) 100% khớp các đơn vị kiến thức
  const specs: ExamSpecificationRow[] = [];
  let specStt = 1;

  rows.forEach((row, rIdx) => {
    const unitSource = unitsToUse[rIdx];
    levels.forEach((lvl) => {
      const getC = (partObj: any) => (typeof partObj?.[lvl] === 'object' ? partObj[lvl].count : (partObj?.[lvl] || 0));
      const p1C = getC(row.part1);
      const p2C = getC(row.part2);
      const p3C = getC(row.part3);
      const p4C = getC(row.part4);

      const makeComp = (levelKey: string, defaultAction: string) => {
        if (unitSource?.outcomes) {
          if ((levelKey.includes('Biết') || levelKey.includes('Mức 1')) && unitSource.outcomes.know.length > 0) {
            return unitSource.outcomes.know.join('; ');
          }
          if ((levelKey.includes('Hiểu') || levelKey.includes('Mức 2')) && unitSource.outcomes.understand.length > 0) {
            return unitSource.outcomes.understand.join('; ');
          }
          if ((levelKey.includes('Vận dụng') || levelKey.includes('Mức 3')) && unitSource.outcomes.apply.length > 0) {
            return unitSource.outcomes.apply.join('; ');
          }
        }
        return `${defaultAction} về ${row.topic}.`;
      };

      if (p1C > 0) {
        specs.push({
          id: `spec_auto_${specStt}`,
          stt: specStt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeComp(lvl, 'Nhận biết và chọn đáp án chính xác'),
          level: lvl,
          questionType: 'Trắc nghiệm nhiều lựa chọn',
          questionCount: p1C,
          questionIds: [],
          score: Number((p1C * 0.25).toFixed(2))
        });
      }

      if (p2C > 0) {
        specs.push({
          id: `spec_auto_${specStt}`,
          stt: specStt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeComp(lvl, 'Đánh giá tính Đúng/Sai của từng nhận định chuyên môn'),
          level: lvl,
          questionType: 'Trắc nghiệm Đúng/Sai (4 lệnh hỏi)',
          questionCount: p2C,
          questionIds: [],
          score: Number((p2C * 0.25).toFixed(2)) // 4 ý = 1.0đ
        });
      }

      if (p3C > 0) {
        specs.push({
          id: `spec_auto_${specStt}`,
          stt: specStt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeComp(lvl, 'Tính toán và điền đáp số/thuật ngữ ngắn gọn'),
          level: lvl,
          questionType: 'Trắc nghiệm Trả lời ngắn',
          questionCount: p3C,
          questionIds: [],
          score: Number((p3C * 0.5).toFixed(2))
        });
      }

      if (p4C > 0) {
        specs.push({
          id: `spec_auto_${specStt}`,
          stt: specStt++,
          topic: row.topic,
          subTopic: row.subTopic || '',
          competency: makeComp(lvl, 'Trình bày lập luận và giải quyết bài toán tự luận tổng hợp'),
          level: lvl,
          questionType: 'Tự luận',
          questionCount: p4C,
          questionIds: [],
          score: Number((p4ScoreTotal * (p4C / (p4Total || 1))).toFixed(2))
        });
      }
    });
  });

  return { matrix, specs };
}
