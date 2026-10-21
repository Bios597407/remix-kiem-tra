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
  const combined = (safeString(verb) + ' ' + safeString(text)).toLowerCase();

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
${docs.map((d, i) => `File ${i + 1} (${d.name}): ${(d.content || '').slice(0, 8000)}`).join('\n---\n')}

RÀNG BUỘC NGHIÊM NGẶT SCHEMA JSON:
1. "chuDe": Mảng danh sách các Chủ đề / Chương (1-30). GIỮ NGUYÊN VĂN 100% ĐẦY ĐỦ TÊN BÀI HỌC VÀ CHƯƠNG TỪ TÀI LIỆU, KHÔNG ĐƯỢC TÓM TẮT HOẶC CẮT BỚT.
2. "noiDung": Mỗi chủ đề có mảng các "Nội dung / đơn vị kiến thức" (1-30). TÊN NỘI DUNG / BÀI HỌC PHẢI CHÍNH XÁC NGUYÊN VĂN ĐẦY ĐỦ GIỐNG HỆT TÊN TÀI LIỆU VÀ TÊN BÀI ĐƯỢC GỬI LÊN (VD: "BÀI 1 - KHÁI QUÁT VỀ CƠ KHÍ CHẾ TẠO"), TUYỆT ĐỐI KHÔNG RÚT GỌN HOẶC BỎ BỚT TỪ.
3. "yccd": Mỗi Nội dung có danh sách các Yêu cầu cần đạt nguyên văn trích từ tài liệu. Mã YCCĐ đánh số theo nội dung (VD: ND1.1, ND1.2).
4. Động từ hành vi ("dongTu") trích từ YCCĐ (kể tên, nêu, giải thích, vận dụng...).
5. TUYỆT ĐỐI KHÔNG CHÈN BẤT KỲ KÝ HIỆU LẠ HOẶC NHÃN NHƯ [?] VÀO ĐẦU HOẶC TRONG NỘI DUNG YCCĐ.
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
    let rawText = '';
    try {
      const { data } = await fetchGeminiWithFallback(
        { contents: [{ parts: [{ text: promptText }] }] },
        activeApiKey,
        { temperature: 0.1, responseMimeType: 'application/json' }
      );
      rawText = extractTextFromGeminiResponse(data);
    } catch (apiErr: any) {
      console.warn('[AI System] Gemini extraction request warning:', apiErr);
    }

    const parsed = tryRepairJson(rawText);

    // Safely extract root object whether parsed is object, array, or null
    let rootObj: any = {};
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed)) {
        rootObj = parsed.find((item) => item && typeof item === 'object' && (item.chuDe || item.mon || item.cap)) || parsed[0] || {};
      } else {
        rootObj = parsed;
      }
    }

    const rawChuDe = Array.isArray(rootObj?.chuDe) ? rootObj.chuDe : [];

    let chuDeList: ChuDeItem[] = rawChuDe
      .filter((cd: any) => cd && typeof cd === 'object')
      .map((cd: any, cdIdx: number) => ({
        id: safeString(cd?.id) || `CD${cdIdx + 1}`,
        ten: safeString(cd?.ten).replace(/^\[\?\]\s*/, '').replace(/\[\?\]\s*/g, '').trim() || `Chủ đề ${cdIdx + 1}`,
        noiDung: (Array.isArray(cd?.noiDung) ? cd.noiDung : [])
          .filter((nd: any) => nd && typeof nd === 'object')
          .map((nd: any, ndIdx: number) => {
            const ndId = safeString(nd?.id) || `ND${cdIdx + 1}_${ndIdx + 1}`;
            const rawYccd = Array.isArray(nd?.yccd) ? nd.yccd : [];

            let yccdList: YccdItem[] = rawYccd
              .filter((y: any) => y !== null && y !== undefined)
              .map((y: any, yIdx: number) => {
                const rawContent = typeof y === 'object' ? safeString(y?.noiDung || y?.text) : safeString(y);
                const text = rawContent.replace(/^\[\?\]\s*/, '').replace(/\[\?\]\s*/g, '').trim();
                const verb = (typeof y === 'object' ? safeString(y?.dongTu) : '') || text.split(' ')[0] || '';
                const inferredLevel = inferMucToiDaFromVerb(verb, text);

                return {
                  ma: (typeof y === 'object' && safeString(y?.ma)) || `${ndId}.${yIdx + 1}`,
                  noiDung: text || 'Nội dung YCCĐ',
                  dongTu: verb || 'nêu',
                  mucToiDa: inferredLevel,
                  nangLuc: typeof y === 'object' ? y?.nangLuc : undefined,
                };
              });

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
              ten: safeString(nd?.ten) || `Nội dung ${ndIdx + 1}`,
              trongSo: Number(nd?.trongSo) || yccdList.length || 1,
              yccd: yccdList,
            };
          }),
      }));

    // Smart Fallback if chuDeList is empty or extraction returned unparseable JSON
    if (chuDeList.length === 0) {
      const defaultName = docs[0]?.name ? docs[0].name.replace(/\.[^/.]+$/, '').trim() : 'Bài học trích xuất từ tài liệu';
      chuDeList = [
        {
          id: 'CD1',
          ten: defaultName,
          noiDung: [
            {
              id: 'ND1',
              ten: defaultName,
              trongSo: 1,
              yccd: [
                {
                  ma: 'ND1.1',
                  noiDung: `Nêu được các nội dung kiến thức trọng tâm của bài ${defaultName}`,
                  dongTu: 'nêu',
                  mucToiDa: 'Biet',
                },
                {
                  ma: 'ND1.2',
                  noiDung: `Hiểu và giải thích được các ứng dụng thực tế của bài ${defaultName}`,
                  dongTu: 'giải thích',
                  mucToiDa: 'Hieu',
                },
              ],
            },
          ],
        },
      ];
    }

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
      cap: (rootObj && rootObj.cap) || (config.gradeLevel as GradeLevel) || 'THPT',
      khoi: String((rootObj && rootObj.khoi) || config.grade || '12'),
      mon: (rootObj && rootObj.mon) || config.subject || 'Toán học',
      chuDeList,
      rawTopicsStr: cleanTopics.join('\n'),
      rawOutcomesStr: cleanOutcomes.join('\n'),
      readingPassageStr: docs.map((d) => d.content || '').join('\n\n'),
    };
  } catch (err: any) {
    console.error('Structured extraction error caught gracefully:', err);
    const defaultName = docs[0]?.name ? docs[0].name.replace(/\.[^/.]+$/, '').trim() : 'Bài học trích xuất từ tài liệu';
    return {
      cap: (config.gradeLevel as GradeLevel) || 'THPT',
      khoi: String(config.grade || '12'),
      mon: config.subject || 'Toán học',
      chuDeList: [
        {
          id: 'CD1',
          ten: defaultName,
          noiDung: [
            {
              id: 'ND1',
              ten: defaultName,
              trongSo: 1,
              yccd: [
                {
                  ma: 'ND1.1',
                  noiDung: `Nêu được các nội dung kiến thức trọng tâm của bài ${defaultName}`,
                  dongTu: 'nêu',
                  mucToiDa: 'Biet',
                },
              ],
            },
          ],
        },
      ],
      rawTopicsStr: defaultName,
      rawOutcomesStr: `[${defaultName}] ND1.1: Nêu được các nội dung kiến thức trọng tâm của bài ${defaultName}`,
      readingPassageStr: docs.map((d) => d.content || '').join('\n\n'),
    };
  }
}
