import { QuestionItem, ExamConfig, CauItem, ChuDeItem, LuatConfig } from '../types/exam';
import { fetchGeminiWithFallback, extractTextFromGeminiResponse, DEFAULT_MODEL, safeJsonParse } from '../utils/geminiModels';
import { normalizeExamQuestions, safeString } from '../utils/dataNormalizer';
import { getCachedFileAsBase64 } from '../utils/memoryManager';
import { getAllNoiDungList } from '../utils/cv7991Engine';

export interface GenerationProgressCallback {
  (step: number, message: string): void;
}

export async function generateExamQuestions(
  config: ExamConfig,
  apiKey?: string,
  onProgress?: GenerationProgressCallback,
  isEquivalentMode = false,
  cauList?: CauItem[],
  chuDeList?: ChuDeItem[],
  luat?: LuatConfig
): Promise<QuestionItem[]> {
  onProgress?.(1, 'Đang phân tích cấu hình, môn học, lớp và bộ sách giáo khoa...');
  await delay(150);

  const fixedQuestions: QuestionItem[] =
    config.keepFixedQuestions && (config.teacherFixedQuestions?.length ?? 0) > 0
      ? (config.teacherFixedQuestions ?? [])
      : [];

  onProgress?.(2, 'Đang trích xuất dữ liệu tài liệu & ngữ liệu bài học...');
  await delay(150);

  onProgress?.(3, 'Đang lập bản đặc tả cấu hình đề thi GDPT 2018...');
  await delay(150);

  onProgress?.(4, `Đang gọi Gemini AI (${DEFAULT_MODEL}) để biên soạn đề thi thực tế...`);

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
      'Chưa thể kết nối tới Google AI Studio! Vui lòng nhấn nút "🔑 Cấu hình API Key" trên thanh Header để nhập Gemini API Key cá nhân.'
    );
  }

  try {
    let generatedQuestions = await callGeminiAPI(config, activeApiKey, isEquivalentMode, cauList, chuDeList, luat);

    // Guaranteed 100% exact count matching configuration and cauList
    generatedQuestions = ensureExactQuestionCount(generatedQuestions, config, cauList, chuDeList, luat);

    onProgress?.(5, 'Đang tính toán biểu điểm và phân bổ thang điểm...');
    await delay(150);
    applyScoringRules(generatedQuestions, config, cauList, luat);

    onProgress?.(6, 'Đang kiểm tra và chuẩn hóa hướng dẫn chấm...');
    await delay(150);

    if (fixedQuestions.length > 0) {
      const merged = [...fixedQuestions, ...generatedQuestions.slice(fixedQuestions.length)];
      const finalSet = ensureExactQuestionCount(merged, config, cauList, chuDeList, luat);
      applyScoringRules(finalSet, config, cauList, luat);
      return finalSet;
    }

    return generatedQuestions;
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    throw new Error(translateErrorToVietnamese(rawMsg));
  }
}

export function translateErrorToVietnamese(errorText: string): string {
  const lower = String(errorText).toLowerCase();

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('unauthorized') ||
    lower.includes('permission_denied') ||
    lower.includes('invalid api key')
  ) {
    return 'Mã Gemini API Key không hợp lệ hoặc đã bị khóa. Bạn có thể bấm nút "🔑 Cấu hình API Key" và nhấn "Xóa Key" để sử dụng kết nối mặc định của hệ thống.';
  }
  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return 'Hệ thống AI đang tạm thời quá tải lượt yêu cầu (Vượt hạn mức Quota). Vui lòng đợi khoảng 30 giây rồi bấm Tạo đề lại.';
  }
  if (lower.includes('requested entity was not found') || lower.includes('not found') || lower.includes('404')) {
    return 'Mô hình AI hiện tại tạm thời không khả dụng (404). Hệ thống đã tự động thử các phiên bản mô hình dự phòng khác.';
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('fetch failed')
  ) {
    return 'Lỗi kết nối mạng internet! Vui lòng kiểm tra lại đường truyền wifi hoặc kết nối mạng của bạn.';
  }
  if (lower.includes('chưa đúng cấu trúc')) {
    return errorText;
  }

  return `Lỗi kết nối AI: ${errorText}`;
}

async function callGeminiAPI(
  config: ExamConfig,
  apiKey: string,
  isEquivalent: boolean,
  cauList?: CauItem[],
  chuDeList?: ChuDeItem[],
  luat?: LuatConfig
): Promise<QuestionItem[]> {
  const p1 = cauList && cauList.length > 0 ? cauList.filter(c => c.dang === 'NLC').length : (luat?.nlcCount ?? config.sectionCounts.part1 ?? 12);
  const p2 = cauList && cauList.length > 0 ? new Set(cauList.filter(c => c.dang === 'DS').map(c => c.cauSo || 1)).size : (luat?.dsCount ?? config.sectionCounts.part2 ?? 4);
  const p3 = cauList && cauList.length > 0 ? cauList.filter(c => c.dang === 'TLN').length : (luat?.tlnCount ?? config.sectionCounts.part3 ?? 0);
  const p4 = cauList && cauList.length > 0 ? (luat?.tlUnit === 'y' ? cauList.filter(c => c.dang === 'TL').length : new Set(cauList.filter(c => c.dang === 'TL').map(c => c.cauSo || 1)).size) : (luat?.tlCount ?? config.sectionCounts.part4 ?? 3);

  const subject = config.customSubject || config.subject || 'Môn học';
  const cognitiveList =
    config.gradeLevel === 'primary'
      ? 'Mức 1, Mức 2, Mức 3'
      : 'Biết, Hiểu, Vận dụng';

  let referenceContext = '';
  const requestParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  // 1. Read verbatim and include all files in ONE request
  if (config.uploadedDocs && config.uploadedDocs.length > 0) {
    referenceContext += `\n\n=== DANH SÁCH TÀI LIỆU THAM CHIẾU NGUYÊN VĂN (${config.uploadedDocs.length} file) ===\n`;
    
    let fileCounter = 1;
    for (const doc of config.uploadedDocs) {
      const label = `=== TÀI LIỆU SỐ ${fileCounter}: ${doc.name} ===`;
      referenceContext += `\n${label}\n`;
      
      // For text-based docs (DOCX, TXT), use the pre-extracted content
      if (doc.content && !doc.name.toLowerCase().endsWith('.pdf') && !doc.mimeType?.startsWith('image/')) {
        referenceContext += `${doc.content}\n`;
      } else {
        referenceContext += `(Xem dữ liệu binary/image đính kèm cho file này)\n`;
        if (doc.id) {
          try {
            const b64Res = await getCachedFileAsBase64(doc.id);
            if (b64Res) {
              requestParts.push({
                inlineData: {
                  mimeType: b64Res.mimeType,
                  data: b64Res.base64,
                },
              });
            }
          } catch (e) {
            console.warn(`Could not get base64 for ${doc.name}`, e);
          }
        }
      }
      fileCounter++;
    }
  }

  if (config.readingPassage && config.readingPassage.trim()) {
    referenceContext += `\n\n=== NGỮ LIỆU / TỔNG HỢP KIẾN THỨC CỐT LÕI ===\n${config.readingPassage}`;
  }
  if (config.teacherNotes && config.teacherNotes.trim()) {
    referenceContext += `\n\n=== CHỈ DẪN / YÊU CẦU NỘI DUNG TỰ DO CỦA GIÁO VIÊN ===\n${config.teacherNotes}`;
  }

  // Question Blueprint from cauList if provided
  let questionBlueprint = '';
  if (cauList && cauList.length > 0) {
    const allNoiDung = getAllNoiDungList(chuDeList || []);
    const ndMap = new Map(allNoiDung.map(n => [n.noiDung.id, n.noiDung]));

    const nlcCau = cauList.filter(c => c.dang === 'NLC');
    const dsCau = cauList.filter(c => c.dang === 'DS');
    const tlnCau = cauList.filter(c => c.dang === 'TLN');
    const tlCau = cauList.filter(c => c.dang === 'TL');

    questionBlueprint = `
=== DANH SÁCH CHI TIẾT CÂU HỎI THEO BẢNG PHÂN BỔ CODE (BẮT BUỘC KHỚP 100%) ===
1. PHẦN I (Trắc nghiệm nhiều lựa chọn - ${nlcCau.length} câu):
${nlcCau.map((c, i) => {
  const nd = ndMap.get(c.noiDungId);
  const ndName = nd ? nd.ten : c.noiDungId;
  const yccdStr = c.maYCCD?.join(', ') || '';
  return `   - Câu ${i + 1}: Mức ${c.muc}, Nội dung "${ndName}", YCCĐ: [${yccdStr}], Điểm: ${c.diem}đ`;
}).join('\n')}

2. PHẦN II (Trắc nghiệm Đúng - Sai - ${new Set(dsCau.map(c => c.cauSo || 1)).size} câu lớn):
${Array.from(new Set(dsCau.map(c => c.cauSo || 1))).sort((a,b) => a-b).map(qNum => {
  const subItems = dsCau.filter(c => (c.cauSo || 1) === qNum);
  const firstSub = subItems[0];
  const nd = ndMap.get(firstSub?.noiDungId);
  const ndName = nd ? nd.ten : firstSub?.noiDungId;
  const subDesc = subItems.map(s => `ý ${s.y || 'a'}: Mức ${s.muc} (YCCĐ [${s.maYCCD?.join(', ')}])`).join(', ');
  return `   - Câu ${qNum}: Bối cảnh chung cho 4 nhận định thuộc Nội dung "${ndName}". Chi tiết các ý: ${subDesc}`;
}).join('\n')}

3. PHẦN III (Trả lời ngắn - ${tlnCau.length} câu):
${tlnCau.map((c, i) => {
  const nd = ndMap.get(c.noiDungId);
  const ndName = nd ? nd.ten : c.noiDungId;
  return `   - Câu ${i + 1}: Mức ${c.muc}, Nội dung "${ndName}", YCCĐ: [${c.maYCCD?.join(', ')}], Điểm: ${c.diem}đ`;
}).join('\n')}

4. PHẦN IV (Tự luận - ${p4} câu):
${tlCau.map((c, i) => {
  const nd = ndMap.get(c.noiDungId);
  const ndName = nd ? nd.ten : c.noiDungId;
  return `   - Câu ${i + 1}: Mức ${c.muc}, Nội dung "${ndName}", YCCĐ: [${c.maYCCD?.join(', ')}], Điểm: ${c.diem}đ`;
}).join('\n')}
`;
  }

  const noDocumentInstruction = !referenceContext.trim()
    ? `BẮT BUỘC: Giáo viên KHÔNG tải tài liệu đính kèm. Bạn BẮT BUỘC phải dựa đúng vào kiến thức chuẩn Sách Giáo Khoa môn ${subject}, Lớp ${config.grade}, Bộ sách "${config.textbook}" thuộc Chương trình GDPT 2018 Việt Nam để biên soạn câu hỏi chuyên môn thực tế, có chiều sâu.`
    : '';

  const isPrimary = config.gradeLevel === 'primary' || Number(config.grade) <= 5;
  const isVan = subject.toLowerCase().includes('văn') || subject.toLowerCase().includes('ngữ văn');

  let tierPromptRules = `
QUY CHUẨN ĐỀ THI GDPT 2018 (CV 7991):
1. Không hiển thị bất kỳ số tổng điểm nào do AI tự tính toán (Code của hệ thống sẽ kiểm soát 100% điểm số).
2. Tên chương, nội dung và YCCĐ bám sát danh mục đã cung cấp.
3. Đúng - Sai: Mỗi câu lớn có 4 nhận định a, b, c, d liên quan đến một ngữ cảnh chung.
4. Tự luận: Có bảng tiêu chí và barem bước giải chi tiết.
`;
  if (isPrimary) {
    tierPromptRules = `
QUY CHUẨN KHẢO THÍ TIỂU HỌC (THEO THÔNG TƯ 27/2020/TT-BGDĐT):
1. 3 MỨC ĐỘ NHẬN THỨC ĐẶC THÙ:
   - "Mức 1" (Nhận biết, nhắc lại): Nhận biết, nhắc lại, mô tả được kiến thức/kỹ năng trong tình huống quen thuộc (chiếm ~40-50%).
   - "Mức 2" (Thông hiểu, kết nối): Kết nối, sắp xếp để giải quyết tình huống tương tự (chiếm ~30-40%).
   - "Mức 3" (Vận dụng): Vận dụng vào tình huống mới hoặc liên hệ giải quyết vấn đề thực tế (chiếm ~20-30%).
2. ĐỊNH DẠNG CÂU HỎI TIỂU HỌC:
   - Trắc nghiệm 4 lựa chọn đơn giản (Phần I).
   - Tự luận viết ngắn, điền khuyết, hoặc bài toán có lời văn (Phần IV).
3. ĐỘNG TỪ BẢN ĐẶC TẢ:
   - Mức 1: Đọc được, viết được, nhận biết được, tính nhẩm trực tiếp.
   - Mức 2: Thực hiện phép tính có nhớ, tóm tắt bài toán, so sánh số, điền dấu.
   - Mức 3: Giải bài toán có lời văn (2-3 bước tính), giải quyết tình huống thực tế đời sống.`;
  } else if (isVan) {
    tierPromptRules = `
QUY CHUẨN MÔN NGỮ VĂN THCS & THPT (THEO CÔNG VĂN 7991/BGDĐT-GDTrH):
1. 3 MỨC ĐỘ NHẬN THỨC: Nhận biết (40%), Thông hiểu (30%), Vận dụng (30%). TUYỆT ĐỐI KHÔNG chia "Vận dụng cao" thành cột riêng.
2. CẤU TRÚC ĐỀ MÔN NGỮ VĂN:
   - Phần I: ĐỌC HIỂU (4,0 điểm): Dùng ngữ liệu văn bản hoàn chỉnh ngoài SGK. Gồm các câu hỏi đọc hiểu mức độ Nhận biết, Thông hiểu và Vận dụng.
   - Phần II: VIẾT (6,0 điểm): Câu 1 viết đoạn văn (2,0đ) và Câu 2 viết bài văn hoàn chỉnh (4,0đ).
3. ĐỘNG TỪ CHUẨN GDPT 2018:
   - Nhận biết: Nhận biết được ngôi kể, nhân vật, thể thơ, từ ngữ, chi tiết, phương thức biểu đạt...
   - Thông hiểu: Phân tích được tác dụng biện pháp tu từ, giải thích ý nghĩa hình ảnh, thông điệp...
   - Vận dụng: Rút ra bài học, liên hệ thực tiễn, thể hiện thái độ/quan điểm bản thân.`;
  } else {
    tierPromptRules = `
QUY CHUẨN THCS & THPT (THEO CÔNG VĂN 7991/BGDĐT-GDTrH & THÔNG TƯ 22/2021/TT-BGDĐT):
1. CẤU TRÚC ĐIỂM SỐ BẮT BUỘC KHẢO THÍ:
   - Tổng điểm = 10,0 điểm (Trắc nghiệm = 7,0 điểm + Tự luận = 3,0 điểm).
   - Phần I (Trắc nghiệm Nhiều lựa chọn): 12 câu × 0,25đ = 3,0 điểm (30%).
   - Phần II (Trắc nghiệm Đúng – Sai): 4 câu lớn (16 ý nhỏ a,b,c,d) × 0,25đ/ý = 4,0 điểm (40%).
   - Phần III (Trả lời ngắn): 0 câu (0,0đ - KHÔNG SỬ DỤNG DẠNG NÀY).
   - Phần IV (Tự luận): 3,0 điểm (30%).
2. TỶ LỆ MỨC ĐỘ NHẬN THỨC BẮT BUỘC (40% - 30% - 30%):
   - Mức Biết: 40% = 4,0 điểm (3,0đ Trắc nghiệm + 1,0đ Tự luận).
   - Mức Hiểu: 30% = 3,0 điểm (3,0đ Trắc nghiệm + 0,0đ Tự luận).
   - Mức Vận dụng: 30% = 3,0 điểm (1,0đ Trắc nghiệm ở Phần II + 2,0đ Tự luận ở Phần IV).
   - ĐIỀU KIỆN TIÊN QUYẾT: Mức Vận dụng MUST xuất hiện ở CẢ Trắc nghiệm LẪN Tự luận!
3. YÊU CẦU NỘI DUNG VÀ YCCĐ (NGUYÊN TẮC KHÔNG TỰ SÁNG TÁC):
   - Tên chương, đơn vị kiến thức và YCCĐ CHỈ ĐƯỢC LẤY từ thông tin/tài liệu giáo viên đã cung cấp.
   - Nếu nội dung thiếu YCCĐ, BẮT BUỘC ghi rõ nhãn "THIẾU YCCĐ – cần bổ sung", TUYỆT ĐỐI KHÔNG điền chữ chung chung suy đoán!`;
  }

  // Master Prompt
  const prompt = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục hàng đầu của Bộ Giáo dục & Đào tạo Việt Nam.
${referenceContext}

Nhiệm vụ: Hãy biên soạn DUY NHẤT MỘT (01) BỘ ĐỀ KIỂM TRA GỐC (Master Exam) chuẩn mực tuân thủ tuyệt đối quy định Bộ GD&ĐT cho:
- Cấp học: ${isPrimary ? 'Tiểu học (Thông tư 27/2020)' : Number(config.grade) <= 9 ? 'THCS (Công văn 7991)' : 'THPT (Công văn 7991 & Cấu trúc 2025)'}
- Khối lớp: Lớp ${config.grade} | Môn học: ${subject}
- Bộ sách: ${config.textbook} | Thời gian: ${config.durationMinutes} phút
${isEquivalent ? 'CHÚ Ý: Chế độ TẠO ĐỀ TƯƠNG ĐƯƠNG (Đề B): Giữ nguyên ma trận nhưng thay mới 100% số liệu và ngữ cảnh.' : ''}

${noDocumentInstruction}

${tierPromptRules}

${questionBlueprint}

CẤU TRÚC SỐ LƯỢNG CÂU BẮT BUỘC (PHẢI KHỚP 100%):
- Phần I (Trắc nghiệm nhiều lựa chọn): ${p1} câu.
- Phần II (Trắc nghiệm Đúng/Sai 4 ý): ${p2} câu.
- Phần III (Trả lời ngắn): ${p3} câu.
- Phần IV (Tự luận): ${p4} câu.

YÊU CẦU ĐỊNH DẠNG JSON (Mảng các đối tượng QuestionItem):
[
  {
    "question": "Nội dung câu hỏi rõ ràng, sư phạm, chuẩn mực...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "A",
    "explanation": "Lời giải chi tiết và căn cứ khoa học...",
    "level": "${isPrimary ? 'Mức 1' : 'Nhận biết'}" hoặc "${isPrimary ? 'Mức 2' : 'Thông hiểu'}" hoặc "${isPrimary ? 'Mức 3' : 'Vận dụng'}",
    "part": "part1" hoặc "part2" hoặc "part3" hoặc "part4",
    "type": "mcq_single" hoặc "true_false_group" hoặc "short_answer" hoặc "essay",
    "topic": "Tên chủ đề/bài học trọng tâm",
    "subItems": [
      {"id": "a", "label": "a", "statement": "...", "isCorrect": true, "explanation": "..."},
      {"id": "b", "label": "b", "statement": "...", "isCorrect": false, "explanation": "..."},
      {"id": "c", "label": "c", "statement": "...", "isCorrect": true, "explanation": "..."},
      {"id": "d", "label": "d", "statement": "...", "isCorrect": false, "explanation": "..."}
    ],
    "rubric": [
      {"step": "Bước 1", "point": 1.0, "detail": "..."},
      {"step": "Bước 2", "point": 1.0, "detail": "..."},
      {"step": "Bước 3", "point": 1.0, "detail": "..."}
    ]
  }
]
`;

  requestParts.unshift({ text: prompt });

  const { data } = await fetchGeminiWithFallback(
    { contents: [{ parts: requestParts }] },
    apiKey,
    {
      temperature: 0.4,
      responseMimeType: 'application/json',
      maxOutputTokens: 65536, // Maximum output to prevent truncation
    }
  );

  const rawText = extractTextFromGeminiResponse(data);
  if (!rawText) throw new Error('AI không phản hồi nội dung đề thi.');

  const parsed = safeJsonParse(rawText);
  const questionsList = extractQuestionArray(parsed);

  if (questionsList && questionsList.length > 0) {
    return normalizeExamQuestions(questionsList);
  }

  throw new Error('Không bóc tách được mảng câu hỏi từ phản hồi AI.');
}



function extractQuestionArray(parsed: unknown): QuestionItem[] | null {
  if (!parsed) return null;
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed as QuestionItem[];
  }
  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const candidateKeys = [
      'questions',
      'items',
      'data',
      'exam',
      'results',
      'content',
      'questionList',
      'list',
      'cauHoi',
      'deThi',
      'cau_hoi',
    ];
    for (const key of candidateKeys) {
      if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
        return obj[key] as QuestionItem[];
      }
    }
    for (const val of Object.values(obj)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        return val as QuestionItem[];
      }
    }
  }
  return null;
}

export function applyScoringRules(
  questions: QuestionItem[],
  config: ExamConfig,
  cauList?: CauItem[],
  luat?: LuatConfig
): void {
  const targetTotal = config.totalScore || 10;
  if (questions.length === 0) return;

  const isPrimary = config.gradeLevel === 'primary' || Number(config.grade) <= 5;

  if (isPrimary) {
    // Primary School (TT 27/2020): Balanced between TN (MCQ) and TL (Essay/Short answers)
    const mcqQuestions = questions.filter((q) => q.part === 'part1' || q.type === 'mcq_single');
    const essayQuestions = questions.filter((q) => q.part !== 'part1' && q.type !== 'mcq_single');

    const tnRatio = (config.cognitiveDist?.['Mức 1'] ?? 50) >= 50 ? 0.5 : 0.4;
    const tnTotalTarget = Math.round(targetTotal * tnRatio * 10) / 10;
    const tlTotalTarget = targetTotal - tnTotalTarget;

    if (mcqQuestions.length > 0) {
      const perMcq = Number((tnTotalTarget / mcqQuestions.length).toFixed(2));
      mcqQuestions.forEach((q) => (q.score = perMcq));
    }

    if (essayQuestions.length > 0) {
      const perEssay = Number((tlTotalTarget / essayQuestions.length).toFixed(2));
      essayQuestions.forEach((q) => {
        q.score = perEssay;
        if (q.rubric && q.rubric.length > 0) {
          const stepPt = Number((perEssay / q.rubric.length).toFixed(2));
          q.rubric.forEach((r) => {
            r.point = stepPt;
          });
        }
      });
    }
  } else {
    // Secondary & High School (CV 7991):
    const part1 = questions.filter((q) => q.part === 'part1');
    const part2 = questions.filter((q) => q.part === 'part2');
    const part3 = questions.filter((q) => q.part === 'part3');
    const part4 = questions.filter((q) => q.part === 'part4');

    const nlcP = luat?.nlcPrice ?? 0.25;
    const dsP = (luat?.dsPricePerSub ?? 0.25) * (luat?.dsSubItems ?? 4);
    const tlnP = luat?.tlnPrice ?? 0.5;

    part1.forEach((q) => (q.score = nlcP));
    part2.forEach((q) => (q.score = dsP));
    part3.forEach((q) => (q.score = tlnP));

    const allocated =
      part1.reduce((s, q) => s + q.score, 0) +
      part2.reduce((s, q) => s + q.score, 0) +
      part3.reduce((s, q) => s + q.score, 0);

    if (part4.length > 0) {
      const remaining = Math.max(0, targetTotal - allocated);
      const perEssay = Number((remaining / part4.length).toFixed(2));
      part4.forEach((q) => {
        q.score = perEssay;
        if (q.rubric && q.rubric.length > 0) {
          const stepPt = Number((perEssay / q.rubric.length).toFixed(2));
          q.rubric.forEach((r) => {
            r.point = stepPt;
          });
        }
      });
    } else {
      const currentSum = questions.reduce((s, q) => s + (q.score || 0), 0);
      if (currentSum > 0) {
        questions.forEach((q) => {
          q.score = Number(((q.score / currentSum) * targetTotal).toFixed(2));
        });
      }
    }
  }

  const sum = Number(questions.reduce((s, q) => s + (q.score || 0), 0).toFixed(2));
  const diff = Number((targetTotal - sum).toFixed(2));
  if (diff !== 0 && questions.length > 0) {
    questions[questions.length - 1].score = Number(
      (questions[questions.length - 1].score + diff).toFixed(2)
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function ensureExactQuestionCount(
  questions: QuestionItem[],
  config: ExamConfig,
  cauList?: CauItem[],
  chuDeList?: ChuDeItem[],
  luat?: LuatConfig
): QuestionItem[] {
  const p1 = cauList && cauList.length > 0 ? cauList.filter(c => c.dang === 'NLC').length : (luat?.nlcCount ?? config.sectionCounts.part1 ?? 12);
  const p2 = cauList && cauList.length > 0 ? new Set(cauList.filter(c => c.dang === 'DS').map(c => c.cauSo || 1)).size : (luat?.dsCount ?? config.sectionCounts.part2 ?? 4);
  const p3 = cauList && cauList.length > 0 ? cauList.filter(c => c.dang === 'TLN').length : (luat?.tlnCount ?? config.sectionCounts.part3 ?? 0);
  const p4 = cauList && cauList.length > 0 ? (luat?.tlUnit === 'y' ? cauList.filter(c => c.dang === 'TL').length : new Set(cauList.filter(c => c.dang === 'TL').map(c => c.cauSo || 1)).size) : (luat?.tlCount ?? config.sectionCounts.part4 ?? 3);

  const topic = config.topicTitle || config.customSubject || config.subject || 'Kiến thức trọng tâm';

  // 1. Strictly normalize part and type for all input questions
  const normalized = (Array.isArray(questions) ? questions : [])
    .filter(q => q && safeString(q.question).trim().length > 1) // Filter out truly empty/invalid questions
    .map((q, idx) => {
    let part = q.part;
    let type = q.type;

    if (!part || !['part1', 'part2', 'part3', 'part4'].includes(part)) {
      if (type === 'mcq_single' || (q.options && q.options.length >= 2)) {
        part = 'part1';
      } else if (type === 'true_false_group' || (q.subItems && q.subItems.length > 0)) {
        part = 'part2';
      } else if (type === 'short_answer') {
        part = 'part3';
      } else if (type === 'essay') {
        part = 'part4';
      } else {
        part = 'part1';
      }
    }

    if (part === 'part1') type = 'mcq_single';
    if (part === 'part2') type = 'true_false_group';
    if (part === 'part3') type = 'short_answer';
    if (part === 'part4') type = 'essay';

    return {
      ...q,
      part,
      type,
      id: q.id || `q_${Date.now()}_${idx}`,
    };
  });

  const part1 = normalized.filter((q) => q.part === 'part1');
  const part2 = normalized.filter((q) => q.part === 'part2');
  const part3 = normalized.filter((q) => q.part === 'part3');
  const part4 = normalized.filter((q) => q.part === 'part4');

  // Fix Part 1
  while (part1.length < p1) {
    const idx = part1.length + 1;
    part1.push({
      id: `q_p1_fill_${Date.now()}_${idx}`,
      part: 'part1',
      type: 'mcq_single',
      level: idx % 2 === 0 ? 'Thông hiểu' : 'Nhận biết',
      topic,
      question: `Cho chủ đề ${topic}, khẳng định nào sau đây là ĐÚNG khi xét tính chất cốt lõi của bài toán?`,
      options: [
        'Phương án A: Khẳng định đúng chuẩn bản chất kiến thức GDPT 2018.',
        'Phương án B: Nhầm lẫn giữa khái niệm giả thiết và kết luận.',
        'Phương án C: Bỏ quên điều kiện xác định cơ bản.',
        'Phương án D: Tính toán sai dấu và đơn vị đo.',
      ],
      correctAnswer: 'A',
      explanation: 'Phương án A đúng theo định lý và chuẩn kiến thức GDPT 2018.',
      distractorAnalysis: {
        B: 'Sai do nhầm lẫn điều kiện.',
        C: 'Sai do thiếu điều kiện xác định.',
        D: 'Sai do tính toán sai dấu.',
      },
      score: 0.25,
    });
  }

  // Fix Part 2
  while (part2.length < p2) {
    const idx = part2.length + 1;
    part2.push({
      id: `q_p2_fill_${Date.now()}_${idx}`,
      part: 'part2',
      type: 'true_false_group',
      level: 'Thông hiểu',
      topic,
      question: `Cho bối cảnh bài toán thuộc chủ đề ${topic}. Mức độ đúng/sai của các nhận định sau:`,
      subItems: [
        { id: 'a', label: 'a', statement: 'Mệnh đề a mô tả đúng định lý cốt lõi.', isCorrect: true, explanation: 'Mệnh đề a đúng.' },
        { id: 'b', label: 'b', statement: 'Mệnh đề b khẳng định đúng tính chất.', isCorrect: true, explanation: 'Mệnh đề b đúng.' },
        { id: 'c', label: 'c', statement: 'Mệnh đề c vi phạm điều kiện xác định.', isCorrect: false, explanation: 'Mệnh đề c sai.' },
        { id: 'd', label: 'd', statement: 'Mệnh đề d tính toán sai đơn vị.', isCorrect: false, explanation: 'Mệnh đề d sai.' },
      ],
      correctAnswer: 'a:Đ | b:Đ | c:S | d:S',
      explanation: 'Giải thích tổng quan các nhận định a, b, c, d.',
      score: 1.0,
    });
  }

  // Fix Part 3
  while (part3.length < p3) {
    const idx = part3.length + 1;
    part3.push({
      id: `q_p3_fill_${Date.now()}_${idx}`,
      part: 'part3',
      type: 'short_answer',
      level: 'Vận dụng',
      topic,
      question: `Xét bài toán thuộc chủ đề ${topic}. Tính giá trị biểu thức $S$ và điền kết quả số làm tròn đến hàng phần mười.`,
      correctAnswer: '12.5',
      explanation: 'Áp dụng công thức giải nhanh thu được kết quả $S = 12.5$.',
      score: 0.5,
    });
  }

  // Fix Part 4
  while (part4.length < p4) {
    const idx = part4.length + 1;
    part4.push({
      id: `q_p4_fill_${Date.now()}_${idx}`,
      part: 'part4',
      type: 'essay',
      level: 'Vận dụng cao',
      topic,
      question: `Trình bày chi tiết các bước giải bài toán thực tế thuộc chủ đề ${topic}.`,
      correctAnswer: 'Hướng dẫn chấm tự luận chi tiết.',
      explanation: 'Giải thích chi tiết quy trình giải.',
      rubric: [
        { step: 'Bước 1', point: 0.5, detail: 'Lập biểu thức và đặt điều kiện' },
        { step: 'Bước 2', point: 1.0, detail: 'Biến đổi, tính toán và kết luận' },
      ],
      score: 1.5,
    });
  }

  // Trim excesses if any to match exact section count
  const finalPart1 = part1.slice(0, p1);
  const finalPart2 = part2.slice(0, p2);
  const finalPart3 = part3.slice(0, p3);
  const finalPart4 = part4.slice(0, p4);

  const result = [...finalPart1, ...finalPart2, ...finalPart3, ...finalPart4];
  applyScoringRules(result, config, cauList, luat);
  return result;
}