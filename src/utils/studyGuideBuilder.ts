import { ExamConfig, QuestionItem, StudyGuideData, StudyGuideTrapItem } from '../types/exam';
import { fetchGeminiWithFallback, extractTextFromGeminiResponse } from './geminiModels';

/**
 * Builds a comprehensive Study Guide & Pitfall Avoidance Handbook
 * based on current exam config and actual generated questions
 */
export function buildStudyGuide(config: ExamConfig, questions: QuestionItem[]): StudyGuideData {
  const subjectName = (config.customSubject || config.subject || 'Môn học').toLowerCase();
  const topic = config.topicTitle || config.chapter || 'Kiến thức trọng tâm ôn thi';

  // 1. Core Concepts dynamic extraction
  const coreConcepts: Array<{ term: string; definition: string }> = [];
  const keyFormulas: Array<{ name: string; formula: string; note: string }> = [];
  const trapList: StudyGuideTrapItem[] = [];
  const commonMistakes: string[] = [];

  // Extract from questions distractor analysis and topics
  if (questions && questions.length > 0) {
    questions.forEach((q, idx) => {
      // Collect distractor analysis traps
      if (q.distractorAnalysis) {
        Object.entries(q.distractorAnalysis).forEach(([option, analysis]) => {
          if (analysis && analysis.length > 10) {
            trapList.push({
              trapType: `Bẫy phương án gây nhiễu (${option}) - Câu ${idx + 1}`,
              description: analysis,
              exampleQuestion: q.question.slice(0, 120) + (q.question.length > 120 ? '...' : ''),
              avoidanceTip: `Phân tích kỹ giả thiết, tránh vội chọn phương án ${option} do nhầm lẫn tư duy.`,
            });
          }
        });
      }

      // Collect specific question level / type traps
      if (q.part === 'part2' && q.subItems) {
        // True/False group trap
        commonMistakes.push(
          `Ở câu hỏi Đúng/Sai (Câu ${idx + 1}): Đọc kỹ từng ý a, b, c, d vì chỉ cần nhầm lẫn 1 dấu hoặc 1 thuật ngữ sẽ làm sai toàn bộ điểm lũy tiến.`
        );
      } else if (q.part === 'part3') {
        // Short Answer trap
        commonMistakes.push(
          `Ở câu trả lời ngắn (Câu ${idx + 1}): Nhớ làm tròn chính xác theo yêu cầu (vd: số thập phân) và không điền kèm đơn vị đo vào ô kết quả.`
        );
      }
    });
  }

  // Fallback defaults based on subject if question analysis is brief
  if (trapList.length === 0) {
    if (subjectName.includes('toán')) {
      trapList.push(
        {
          trapType: 'Bẫy điều kiện xác định & Tập xác định',
          description: 'Học sinh thường quên giải điều kiện mẫu số $\\ne 0$, biểu thức trong căn $\\ge 0$ hoặc logarit $> 0$ trước khi chọn nghiệm.',
          avoidanceTip: 'Gạch chân ngay điều kiện xác định ở bước đầu tiên của bài làm.',
        },
        {
          trapType: 'Bẫy nhầm lẫn giữa Điểm cực trị ($x$) và Giá trị cực trị ($y$)',
          description: 'Đề bài hỏi "Giá trị cực đại" nhưng học sinh lại khoanh chọn "Điểm cực đại $x$".',
          avoidanceTip: '"Điểm cực trị" là $x$, "Giá trị cực trị" hay "Cực trị" là $y$, "Điểm cực trị của đồ thị" là cặp $(x; y)$.',
        },
        {
          trapType: 'Bẫy tiệm cận đứng & tiệm cận ngang',
          description: 'Bỏ quên kiểm tra điều kiện triệt tiêu nghiệm của mẫu số với tử số khi tìm tiệm cận đứng.',
          avoidanceTip: 'Cho mẫu bằng 0 tìm $x_0$, rồi thay $x_0$ vào tử số. Nếu tử số khác 0 mới kết luận là tiệm cận đứng.',
        }
      );
    } else if (subjectName.includes('văn') || subjectName.includes('tiếng việt')) {
      trapList.push(
        {
          trapType: 'Bẫy kể lại tác phẩm thay vì Phân tích',
          description: 'Học sinh sa vào diễn xướng tóm tắt cốt truyện thay vì chỉ ra nghệ thuật, từ ngữ và dụng ý tác giả.',
          avoidanceTip: 'Luôn áp dụng công thức: Dẫn chứng nghệ thuật $\\to$ Trích câu văn/thơ $\\to$ Phân tích hiệu quả thẩm mỹ.',
        },
        {
          trapType: 'Bẫy tách đoạn sai quy cách trong Đoạn văn 200 chữ',
          description: 'Viết bài nghị luận xã hội 200 chữ nhưng xuống dòng tách thành nhiều đoạn, bị trừ điểm hình thức nặng.',
          avoidanceTip: 'Chỉ lùi vào đầu dòng 1 lần duy nhất ở đầu đoạn văn, viết liên tục cho đến khi kết thúc đoạn.',
        }
      );
    } else if (subjectName.includes('anh')) {
      trapList.push(
        {
          trapType: 'Bẫy lùi thì trong Câu gián tiếp & Câu điều kiện',
          description: 'Quên lùi thì của động từ hoặc quên đổi các từ chỉ thời gian/nơi chốn (this $\\to$ that, now $\\to$ then).',
          avoidanceTip: 'Luôn rà soát 3 yếu tố khi chuyển sang câu gián tiếp: Đại từ + Thì của động từ + Trạng từ chỉ thời gian.',
        },
        {
          trapType: 'Bẫy từ đồng nghĩa nhưng sai Nét nghĩa (Nuance trap)',
          description: 'Chọn từ có nghĩa tương tự nhưng không hợp với ngữ cảnh collocations hoặc cấu trúc ngữ pháp đi kèm.',
          avoidanceTip: 'Đọc hết cả câu để kiểm tra giới từ và tính chất trang trọng/thông dụng của từ.',
        }
      );
    } else {
      trapList.push(
        {
          trapType: 'Bẫy đọc không kỹ từ phủ định trong câu hỏi',
          description: 'Đề hỏi "Phương án nào KHÔNG ĐÚNG" nhưng học sinh đọc lướt và khoanh ngay phương án đúng đầu tiên.',
          avoidanceTip: 'Dùng bút khoanh tròn các từ "KHÔNG", "SAI", "NGOẠI TRỪ" trong đề thi.',
        },
        {
          trapType: 'Bẫy nhầm lẫn giữa Nguyên nhân trực tiếp & Nguyên nhân sâu xa',
          description: 'Chọn nhầm ngòi nổ bùng nổ sự kiện thay cho bản chất quy luật kinh tế - xã hội.',
          avoidanceTip: 'Nguyên nhân sâu xa thường liên quan đến mâu thuẫn giai cấp, kinh tế, thể chế; nguyên nhân trực tiếp là sự kiện ngòi nổ.',
        }
      );
    }
  }

  // Populate core concepts
  if (subjectName.includes('toán')) {
    coreConcepts.push(
      {
        term: 'Cực trị của hàm số',
        definition: 'Điểm $x_0$ là điểm cực trị nếu $f\'(x)$ đổi dấu khi đi qua $x_0$. Nếu $f\'(x)$ đổi dấu từ $+$ sang $-$ thì $x_0$ là điểm cực đại.',
      },
      {
        term: 'Giá trị lớn nhất và giá trị nhỏ nhất (GTLN, GTNN)',
        definition: 'Số $M$ là GTLN của $f(x)$ trên tập $D$ nếu $f(x) \\le M, \\forall x \\in D$ và tồn tại $x_0 \\in D$ sao cho $f(x_0) = M$.',
      },
      {
        term: 'Đường tiệm cận',
        definition: 'Đường thẳng $y = y_0$ là tiệm cận ngang nếu $\\lim_{x \\to \\pm\\infty} f(x) = y_0$. Đường thẳng $x = x_0$ là tiệm cận đứng nếu $\\lim_{x \\to x_0} f(x) = \\pm\\infty$.',
      }
    );

    keyFormulas.push(
      {
        name: 'Đạo hàm hàm phân thức $y = \\frac{ax+b}{cx+d}$',
        formula: '$y\' = \\frac{ad - bc}{(cx+d)^2}$',
        note: 'Dấu của đạo hàm phụ thuộc vào $ad - bc$, luôn không đổi trên từng khoảng xác định.',
      },
      {
        name: 'Đạo hàm hàm hợp $y = f(u(x))$',
        formula: '$y\' = u\'(x) \\cdot f\'(u)$',
        note: 'Đừng quên nhân thêm đạo hàm của hàm số bên trong $u\'(x)$.',
      }
    );
  } else if (subjectName.includes('văn') || subjectName.includes('tiếng việt')) {
    coreConcepts.push(
      {
        term: 'Phong cách ngôn ngữ & Biện pháp tu từ',
        definition: 'Nhận diện đúng phong cách (Nghệ thuật, Báo chí, Chính luận...) và tác dụng biểu cảm của các biện pháp tu từ (Ẩn dụ, Hoán dụ, Điệp từ...).',
      },
      {
        term: 'Cấu trúc Đoạn văn Nghị luận xã hội 200 chữ',
        definition: 'Mở đoạn (Nêu vấn đề) $\\to$ Thân đoạn (Giải thích $\\to$ Phân tích $\\to$ Chứng minh $\\to$ Bàn luận phản đề) $\\to$ Kết đoạn (Bài học nhận thức & hành động).',
      }
    );

    keyFormulas.push({
      name: 'Công thức phân tích ngữ liệu Đọc hiểu',
      formula: 'Chỉ ra yếu tố nghệ thuật + Nêu nội dung trực tiếp + Nêu ý nghĩa sâu xa / Dụng ý tác giả',
      note: 'Trả lời ngắn gọn, thẳng vào vấn đề, không viết lan man.',
    });
  } else {
    coreConcepts.push(
      {
        term: 'Bản chất kiến thức cốt lõi',
        definition: `Các khái niệm, nguyên lý và quy luật cơ bản thuộc chủ đề "${topic}".`,
      },
      {
        term: 'Khả năng vận dụng thực tiễn',
        definition: 'Liên hệ kiến thức đã học để giải thích hiện tượng thực tế và giải quyết bài toán tình huống.',
      }
    );

    keyFormulas.push({
      name: 'Quy tắc suy luận nguyên nhân - kết quả',
      formula: 'Bản chất quy luật $\\to$ Tác động điều kiện $\\to$ Hậu quả / Kết quả',
      note: 'Chú ý tính logic và căn cứ khoa học.',
    });
  }

  // Common Mistakes
  if (commonMistakes.length === 0) {
    commonMistakes.push(
      'Không đọc kỹ câu hỏi phủ định (Phương án nào KHÔNG ĐÚNG, NGOẠI TRỪ...).',
      'Phân bổ thời gian không hợp lý: Dành quá nhiều thời gian cho câu khó đầu tiên dẫn đến thiếu giờ làm các câu dễ ở cuối.',
      'Không kiểm tra lại các đáp án tô trên phiếu trả lời trắc nghiệm / phiếu trả lời ngắn.'
    );
  }

  // Time Strategy
  const timeStrategy = [
    {
      partTitle: 'PHẦN I. Trắc nghiệm 4 lựa chọn (Mức độ Nhận biết & Thông hiểu)',
      timeAlloc: 'Dành 25 - 30% tổng thời gian',
      strategy: 'Giải nhanh, làm từ câu 1 đến câu cuối. Đọc đến đâu tô đáp án đến đó. Không dừng lại quá 1.5 phút/câu.',
    },
    {
      partTitle: 'PHẦN II. Trắc nghiệm Đúng/Sai 4 ý (Mức độ Thông hiểu & Vận dụng)',
      timeAlloc: 'Dành 30 - 35% tổng thời gian',
      strategy: 'Đọc kỹ từng mệnh đề a, b, c, d. Kiểm tra kĩ mệnh đề phụ thuộc (ý c và d thường dựa vào kết quả ý a và b).',
    },
    {
      partTitle: 'PHẦN III. Trắc nghiệm Trả lời ngắn & Tự luận',
      timeAlloc: 'Dành 35 - 40% tổng thời gian',
      strategy: 'Tính toán cẩn thận ra nháp. Rà soát làm tròn số và kiểm tra lại điều kiện xác định trước khi ghi kết quả.',
    },
  ];

  // Readiness Checklist
  const readinessChecklist = [
    'Đã thuộc lòng các định nghĩa, khái niệm và từ khóa trọng tâm của bài.',
    'Đã ghi nhớ chính xác các công thức tính nhanh và điều kiện áp dụng.',
    'Đã nắm rõ 3 bẫy sai kinh điển nhất của chủ đề thi này.',
    'Đã chuẩn bị đầy đủ dụng cụ học tập: Máy tính cầm tay, bút tô trắc nghiệm, thước kẻ, nháp.',
    'Tâm lý tự tin, bình tĩnh, sẵn sàng bứt phá điểm số tối đa!',
  ];

  const reviewTips = [
    'Tập trung làm chắc chắn các câu ở mức độ Nhận biết và Thông hiểu trước để giữ trọn điểm cơ bản.',
    'Khi gặp câu vận dụng cao khó, đánh dấu lại và quay lại giải quyết ở 10 phút cuối trận.',
    'Dùng phương pháp loại trừ phương án sai dựa trên kích thước đại lượng, dấu âm dương hoặc giá trị đặc biệt.',
  ];

  return {
    topicTitle: topic,
    coreConcepts,
    keyFormulas,
    commonMistakes,
    trapList,
    timeStrategy,
    readinessChecklist,
    reviewTips,
  };
}

/**
 * Uses Gemini AI to dynamically synthesize an ultra-comprehensive, highly detailed
 * Study Guide & Pitfall Avoidance Handbook for students based on active exam questions.
 */
export async function generateAIStudyGuide(
  config: ExamConfig,
  questions: QuestionItem[],
  apiKey?: string
): Promise<StudyGuideData> {
  const cleanKey = (k?: string) => {
    if (!k) return '';
    const trimmed = k.trim();
    if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '""') return '';
    return trimmed;
  };

  const userKey =
    cleanKey(apiKey) ||
    cleanKey(localStorage.getItem('exam_ai_gemini_key_v2') || '') ||
    cleanKey(localStorage.getItem('exam_ai_gemini_key') || '') ||
    cleanKey(localStorage.getItem('gemini_api_key') || '');

  const envKey =
    cleanKey(import.meta.env.VITE_GEMINI_API_KEY as string) ||
    (typeof process !== 'undefined'
      ? cleanKey(process.env?.GEMINI_API_KEY) || cleanKey(process.env?.VITE_GEMINI_API_KEY)
      : '');

  const activeApiKey = userKey || envKey;

  if (!activeApiKey) {
    throw new Error(
      'Chưa tìm thấy Gemini API Key! Vui lòng nhấn "🔑 Cấu hình API Key" trên thanh tiêu đề.'
    );
  }

  const subject = config.customSubject || config.subject || 'Toán học';
  const grade = config.grade || '12';
  const topic = config.topicTitle || config.chapter || 'Kiến thức trọng tâm';

  // Sample questions summary for prompt
  const questionsSummary = questions
    .slice(0, 15)
    .map(
      (q, idx) =>
        `Câu ${idx + 1} (${q.part}, ${q.type}, ${q.level}): ${q.question}\n- Đáp án: ${q.correctAnswer}\n- Phân tích bẫy/Giải thích: ${q.explanation}`
    )
    .join('\n\n');

  const prompt = `
Bạn là chuyên gia sư phạm hàng đầu biên soạn CẨM NANG ÔN TẬP & BỐ TRỢ NĂNG LỰC DÀNH CHO HỌC SINH trước kỳ kiểm tra GDPT 2018.

THÔNG TIN ĐỀ THI:
- Môn học: ${subject} - Lớp ${grade}
- Chủ đề / Bài học: ${topic}
- Bộ sách giáo khoa: ${config.textbook || 'GDPT 2018'}
- Danh sách câu hỏi thực tế trong đề kiểm tra:
${questionsSummary}

NHIỆM VỤ CỦA BẠN:
Dựa trên chính danh sách câu hỏi và ma trận đề thi thực tế ở trên, hãy biên soạn một BẢN CẨM NANG ÔN TẬP & BẮT BẪY THI KINHDIỂN sâu sắc, chất lượng cao phát cho học sinh ôn tập trước giờ G.

Cấu trúc JSON đầu ra bắt buộc:
{
  "topicTitle": "Tên chủ đề ôn tập trọng tâm",
  "coreConcepts": [
    { "term": "Khái niệm / Từ khóa 1", "definition": "Định nghĩa & bản chất ngắn gọn, dễ nhớ" },
    ...
  ],
  "keyFormulas": [
    { "name": "Tên công thức / Quy tắc giải nhanh 1", "formula": "Công thức toán/khoa học dạng LaTeX hoặc biểu thức", "note": "Ghi chú điều kiện áp dụng & mẹo giải nhanh" },
    ...
  ],
  "trapList": [
    {
      "trapType": "Tên bẫy tư duy 1 (VD: Bẫy quên điều kiện xác định)",
      "description": "Mô tả chi tiết bẫy sai kinh điển mà học sinh rất hay mắc phải trong đề thi này",
      "exampleQuestion": "Trích dẫn hoặc ví dụ minh họa ngắn từ câu hỏi trong đề",
      "avoidanceTip": "Bí quyết phòng tránh & Quy tắc kiểm tra thần tốc"
    },
    ...
  ],
  "commonMistakes": [
    "Sai lầm 1 học sinh hay mắc khi bấm máy tính / đọc đề...",
    "Sai lầm 2...",
    ...
  ],
  "timeStrategy": [
    { "partTitle": "Phần I: Trắc nghiệm 4 lựa chọn", "timeAlloc": "Dành 25 phút", "strategy": "Chiến thuật làm bài cụ thể..." },
    { "partTitle": "Phần II: Trắc nghiệm Đúng/Sai 4 ý", "timeAlloc": "Dành 30 phút", "strategy": "Chiến thuật kiểm tra từng mệnh đề..." },
    { "partTitle": "Phần III: Trả lời ngắn & Tự luận", "timeAlloc": "Dành 35 phút", "strategy": "Chiến thuật tính toán & làm tròn số..." }
  ],
  "readinessChecklist": [
    "Checklist 1: Đã thuộc lòng...",
    "Checklist 2: Đã biết cách bấm máy tính...",
    ...
  ],
  "reviewTips": [
    "Mẹo 1...",
    "Mẹo 2..."
  ]
}

YÊU CẦU:
Trả về duy nhất MỘT JSON Object hợp lệ (không kèm văn bản giải thích outside JSON).
`;

  try {
    const { data } = await fetchGeminiWithFallback(
      { contents: [{ parts: [{ text: prompt }] }] },
      activeApiKey,
      {
        temperature: 0.4,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      }
    );

    const rawText = extractTextFromGeminiResponse(data);
    if (!rawText) return buildStudyGuide(config, questions);

    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    if (parsed && (parsed.coreConcepts || parsed.trapList || parsed.keyFormulas)) {
      return {
        topicTitle: parsed.topicTitle || topic,
        coreConcepts: parsed.coreConcepts || [],
        keyFormulas: parsed.keyFormulas || [],
        commonMistakes: parsed.commonMistakes || [],
        trapList: parsed.trapList || [],
        timeStrategy: parsed.timeStrategy || [],
        readinessChecklist: parsed.readinessChecklist || [],
        reviewTips: parsed.reviewTips || [],
      };
    }
  } catch (err: unknown) {
    console.error('Study guide generation error:', err);
  }

  // Fallback if AI call fails
  return buildStudyGuide(config, questions);
}
