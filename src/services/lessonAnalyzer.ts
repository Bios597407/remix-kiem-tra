import {
  ExamConfig,
  GradeLevel,
  ChuDeItem,
  NoiDungItem,
  YccdItem,
  CognitiveLevel,
} from '../types/exam';
import {
  fetchGeminiWithFallback,
  extractTextFromGeminiResponse,
  tryRepairJson,
} from '../utils/geminiModels';
import { safeString } from '../utils/dataNormalizer';
import { getCachedFileAsBase64 } from '../utils/memoryManager';

export interface StructuredExtractionResult {
  cap: GradeLevel;
  khoi: string;
  mon: string;
  textbook?: string;
  chuDeList: ChuDeItem[];
  rawTopicsStr: string;
  rawOutcomesStr: string;
  readingPassageStr: string;
}

/**
 * Action Verb Table for automatic `mucToiDa` suggestion:
 * - Biết: kể tên, nêu, nhận biết, liệt kê, gọi tên, trình bày, chỉ ra...
 * - Hiểu: giải thích, mô tả, so sánh, phân biệt, tóm tắt, minh họa, phân loại...
 * - Vận dụng: vận dụng, tính toán, đề xuất, phân tích, thiết kế, giải quyết, đánh giá, tối ưu hóa...
 */
export function inferMucToiDaFromVerb(verb: string, text: string): CognitiveLevel {
  const combined = (verb + ' ' + text).toLowerCase();

  const vdVerbs = ['vận dụng', 'tính toán', 'đề xuất', 'phân tích', 'thiết kế', 'giải quyết', 'đánh giá', 'tối ưu', 'mô hình', 'sáng tạo'];
  const hieuVerbs = ['giải thích', 'mô tả', 'so sánh', 'phân biệt', 'tóm tắt', 'minh họa', 'phân loại', 'suy luận', 'trình bày'];

  for (const v of vdVerbs) {
    if (combined.includes(v)) return 'VanDung';
  }
  for (const v of hieuVerbs) {
    if (combined.includes(v)) return 'Hieu';
  }

  return 'Biet';
}

export async function extractStructuredContentFromDocs(
  docs: Array<{ id: string; name: string; content: string; size: number; mimeType?: string }>,
  config: Partial<ExamConfig>,
  apiKey?: string,
  onProgress?: (msg: string) => void
): Promise<StructuredExtractionResult> {
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
      'Chưa tìm thấy Gemini API Key! Vui lòng nhập API Key để phân tích tài liệu.'
    );
  }

  const promptText = `
Bạn là chuyên gia Khảo thí và Chương trình GDPT 2018 Việt Nam.
NHIỆM VỤ: Trích xuất chính xác danh sách Chủ đề, Nội dung / đơn vị kiến thức, và Yêu cầu cần đạt (YCCĐ) nguyên văn từ tài liệu.

THÔNG TIN ĐẦU VÀO:
- Môn: ${config.subject || 'Tự nhận diện'}
- Khối lớp: ${config.grade || 'Tự nhận diện'}
- Tài liệu đính kèm:
${docs.map((d, i) => `File ${i + 1} (${d.name}): ${d.content.slice(0, 8000)}`).join('\n---\n')}

RÀNG BUỘC NGHIÊM NGẶT SCHEMA JSON:
1. "chuDe": Mảng danh sách các Chủ đề / Chương (1-30).
2. "noiDung": Mỗi chủ đề có mảng các "Nội dung / đơn vị kiến thức" (1-30).
3. "yccd": Mỗi Nội dung có danh sách các Yêu cầu cần đạt nguyên văn trích từ tài liệu. Mã YCCĐ đánh số theo nội dung (VD: ND1.1, ND1.2).
4. Động từ hành vi ("dongTu") trích từ YCCĐ (kể tên, nêu, giải thích, vận dụng...).
5. Nếu mục nào nghi ngờ là mục tiêu hoạt động/bài học chứ không phải YCCĐ khảo thí -> Thêm nhãn "[?]" ở đầu.
6. Nếu nội dung nào hoàn toàn không có YCCĐ -> Trả về mảng yccd rỗng [].

TRẢ VỀ DUY NHẤT MỘT JSON OBJECT:
{
  "cap": "THPT" | "THCS",
  "khoi": "10-12 hoặc 6-9",
  "mon": "Tên môn học",
  "chuDe": [
    {
      "id": "CD1",
      "ten": "Tên Chủ đề / Chương 1",
      "noiDung": [
        {
          "id": "ND1",
          "ten": "Tên Nội dung / đơn vị kiến thức 1",
          "trongSo": 1,
          "yccd": [
            {
              "ma": "ND1.1",
              "noiDung": "Nội dung YCCĐ nguyên văn",
              "dongTu": "nêu"
            }
          ]
        }
      ]
    }
  ]
}
`;

  onProgress?.('Đang gửi yêu cầu trích xuất cấu trúc chuẩn sang Gemini AI...');

  try {
    const { data } = await fetchGeminiWithFallback(
      { contents: [{ parts: [{ text: promptText }] }] },
      activeApiKey,
      { temperature: 0.1, responseMimeType: 'application/json' }
    );

    const rawText = extractTextFromGeminiResponse(data);
    const parsed = tryRepairJson(rawText);

    const chuDeList: ChuDeItem[] = (parsed.chuDe || []).map((cd: any, cdIdx: number) => ({
      id: cd.id || `CD${cdIdx + 1}`,
      ten: safeString(cd.ten) || `Chủ đề ${cdIdx + 1}`,
      noiDung: (cd.noiDung || []).map((nd: any, ndIdx: number) => {
        const ndId = nd.id || `ND${cdIdx + 1}_${ndIdx + 1}`;
        const rawYccd = Array.isArray(nd.yccd) ? nd.yccd : [];

        let yccdList: YccdItem[] = rawYccd.map((y: any, yIdx: number) => {
          const text = safeString(y.noiDung || y);
          const verb = safeString(y.dongTu) || text.split(' ')[0] || '';
          const inferredLevel = inferMucToiDaFromVerb(verb, text);

          return {
            ma: y.ma || `${ndId}.${yIdx + 1}`,
            noiDung: text,
            dongTu: verb,
            mucToiDa: inferredLevel,
            nangLuc: y.nangLuc,
          };
        });

        // If YCCĐ is missing for this content, tag explicitly
        if (yccdList.length === 0) {
          yccdList = [
            {
              ma: `${ndId}.1`,
              noiDung: 'THIẾU YCCĐ – cần bổ sung',
              dongTu: 'thiếu',
              mucToiDa: 'Biet',
            },
          ];
        }

        return {
          id: ndId,
          ten: safeString(nd.ten) || `Nội dung ${ndIdx + 1}`,
          trongSo: Number(nd.trongSo) || yccdList.length || 1,
          yccd: yccdList,
        };
      }),
    }));

    // Generate raw string representations for legacy form fields
    const cleanTopics: string[] = [];
    const cleanOutcomes: string[] = [];

    chuDeList.forEach((cd) => {
      cd.noiDung.forEach((nd) => {
        cleanTopics.push(nd.ten);
        nd.yccd.forEach((y) => {
          cleanOutcomes.push(`[${nd.ten}] ${y.ma}: ${y.noiDung}`);
        });
      });
    });

    return {
      cap: parsed.cap || (config.gradeLevel as GradeLevel) || 'THPT',
      khoi: String(parsed.khoi || config.grade || '12'),
      mon: parsed.mon || config.subject || 'Toán học',
      chuDeList,
      rawTopicsStr: cleanTopics.join('\n'),
      rawOutcomesStr: cleanOutcomes.join('\n'),
      readingPassageStr: docs.map((d) => d.content).join('\n\n'),
    };
  } catch (err: any) {
    console.error('Structured extraction error:', err);
    throw new Error(`Lỗi trích xuất cấu trúc bài học: ${err.message}`);
  }
}
