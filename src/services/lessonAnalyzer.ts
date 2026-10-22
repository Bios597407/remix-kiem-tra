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
import {
  inferSubjectAndTextbook,
  normalizeSubject,
  normalizeTextbook,
} from '../utils/subjectInference';

export interface StructuredExtractionResult {
  cap: GradeLevel;
  khoi: string;
  mon: string;
  textbook: string;
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

  // Kết hợp nội dung và tên file để suy luận nền tảng bằng heuristic
  const combinedDocText = docs.map((d) => d.content || '').join('\n\n');
  const combinedFileNames = docs.map((d) => d.name).join(' ');
  const heuristic = inferSubjectAndTextbook(combinedDocText, combinedFileNames);

  const promptText = `
Bạn là chuyên gia Khảo thí và Chương trình Giáo dục Phổ thông (GDPT) 2018 Việt Nam.
NHIỆM VỤ ĐẶC BIỆT: Phân tích toàn diện tài liệu được nạp vào để:
1. TỰ ĐỘNG SUY LUẬN VÀ NHẬN DIỆN MÔN HỌC ("mon"):
   BẮT BUỘC đọc kỹ các thuật ngữ, công thức, bài học, văn bản trong tài liệu để suy ra môn học chính xác.
   CHỌN CHUẨN XÁC 1 TRONG CÁC MÔN SAU:
   - "Toán học": nếu có đạo hàm, tích phân, lượng giác, tọa độ, véc tơ, phương trình, hàm số, hình học, số học...
   - "Vật lý": nếu có dao động điều hòa, con lắc, sóng cơ, sóng ánh sáng, điện từ, dòng điện xoay chiều, cơ năng...
   - "Hóa học": nếu có cân bằng hóa học, este, lipit, amino acid, kim loại, phản ứng, electron, dung dịch, pH...
   - "Sinh học": nếu có tế bào, ADN, ARN, di truyền, biến dị, nhiễm sắc thể, đột biến, quang hợp, sinh thái...
   - "Khoa học tự nhiên": nếu là môn tích hợp KHTN THCS (Lớp 6, 7, 8, 9) gồm lí, hóa, sinh.
   - "Ngữ văn": nếu có tác phẩm văn học, tác giả, bài thơ, truyện ngắn, đoạn trích, biện pháp tu từ, nghị luận...
   - "Tiếng Anh": nếu tài liệu bằng tiếng Anh (vocabulary, grammar, reading comprehension, pronunciation...).
   - "Lịch sử": nếu có chiến dịch, phong trào cách mạng, kháng chiến, triều đại, hiệp định, mốc lịch sử...
   - "Địa lý": nếu có khí hậu, địa hình, sông ngòi, atlat, dân số, các ngành và vùng kinh tế...
   - "Lịch sử & Địa lý": nếu là môn tích hợp Lịch sử và Địa lí THCS (Lớp 6, 7, 8, 9).
   - "Tin học": nếu có lập trình, thuật toán, Python, Pascal, cơ sở dữ liệu, mạng máy tính, bảng tính Excel...
   - "Giáo dục Kinh tế & Pháp luật": nếu có kinh tế thị trường, cung cầu, pháp luật, hiến pháp, doanh nghiệp...
   - "Giáo dục công dân": nếu là môn GDCD THCS.
   - "Công nghệ": nếu có cơ khí chế tạo, công nghệ điện, trồng trọt, chăn nuôi, bản vẽ kỹ thuật...
   TUYỆT ĐỐI KHÔNG mặc định là Toán học nếu nội dung rõ ràng thuộc môn học khác!

2. TỰ ĐỘNG NHẬN DIỆN BỘ SÁCH GIÁO KHOA ("textbook"):
   CHỌN CHUẨN XÁC 1 TRONG CÁC BỘ SÁCH SAU:
   - "Kết nối tri thức với cuộc sống": nếu có cụm từ Kết nối tri thức, KNTT, NXB Giáo dục Việt Nam...
   - "Cánh diều": nếu có Cánh diều, VEPIC...
   - "Chân trời sáng tạo": nếu có Chân trời sáng tạo, CTST...
   - "Tự do / Chung các bộ sách": nếu không xác định được bộ sách cụ thể.

3. TỰ ĐỘNG NHẬN DIỆN KHỐI LỚP ("khoi") VÀ CẤP HỌC ("cap"):
   - "khoi": '6', '7', '8', '9', '10', '11', '12' (dựa trên tên file, tiêu đề hoặc nội dung bài học).
   - "cap": 'THPT' (khối 10-12) hoặc 'THCS' (khối 6-9).

4. TRÍCH XUẤT CHỦ ĐỀ, NỘI DUNG VÀ ĐỦ 3 MỨC ĐỘ YCCĐ (Biết, Hiểu, V.Dung):
   - Mỗi nội dung BẮT BUỘC PHẢI CÓ ĐỦ 3 MỨC YCCĐ: "Biết", "Hiểu", "V.Dung".
   - Tên nội dung / bài học phải giữ nguyên vẹn 100% tên bài từ tài liệu (VD: "BÀI 1: DAO ĐỘNG ĐIỀU HÒA").

THÔNG TIN TÀI LIỆU NẠP VÀO:
- Gợi ý phân tích ban đầu từ heuristic: Môn ${heuristic.subject}, Bộ sách ${heuristic.textbook}${heuristic.grade ? `, Lớp ${heuristic.grade}` : ''}
- Danh sách tài liệu đính kèm:
${docs.map((d, i) => `File ${i + 1} (${d.name}): ${(d.content || '').slice(0, 8000)}`).join('\n---\n')}

RÀNG BUỘC NGHIÊM NGẶT SCHEMA JSON:
TRẢ VỀ DUY NHẤT MỘT JSON OBJECT CÓ CẤU TRÚC:
{
  "cap": "THPT" | "THCS",
  "khoi": "12",
  "mon": "Tên môn học chuẩn trong danh sách trên",
  "textbook": "Tên bộ sách chuẩn trong danh sách trên",
  "chuDe": [
    {
      "id": "CD1",
      "ten": "Tên Chủ đề / Chương 1",
      "noiDung": [
        {
          "id": "ND1",
          "ten": "Tên Bài học / đơn vị kiến thức 1",
          "trongSo": 1,
          "yccd": [
            {
              "ma": "ND1.1",
              "noiDung": "Nêu/nhận biết được...",
              "dongTu": "nêu"
            },
            {
              "ma": "ND1.2",
              "noiDung": "Giải thích/phân biệt được...",
              "dongTu": "giải thích"
            },
            {
              "ma": "ND1.3",
              "noiDung": "Vận dụng kiến thức để giải quyết...",
              "dongTu": "vận dụng"
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
            const ndName = safeString(nd?.ten) || `Nội dung ${ndIdx + 1}`;
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

            // GUARANTEE 3 HARD CONTENT LEVELS: Biết, Hiểu, V.Dung
            const hasBiet = yccdList.some((y) => y.mucToiDa === 'Biet');
            const hasHieu = yccdList.some((y) => y.mucToiDa === 'Hieu');
            const hasVD = yccdList.some((y) => y.mucToiDa === 'VanDung');

            if (!hasBiet) {
              yccdList.unshift({
                ma: `${ndId}.B`,
                noiDung: `Nhận biết và nêu được các khái niệm, kiến thức cơ bản của ${ndName}`,
                dongTu: 'nhận biết',
                mucToiDa: 'Biet',
              });
            }
            if (!hasHieu) {
              yccdList.push({
                ma: `${ndId}.H`,
                noiDung: `Hiểu và giải thích được bản chất, ý nghĩa kiến thức của ${ndName}`,
                dongTu: 'giải thích',
                mucToiDa: 'Hieu',
              });
            }
            if (!hasVD) {
              yccdList.push({
                ma: `${ndId}.VD`,
                noiDung: `Vận dụng kiến thức của ${ndName} để giải quyết bài tập và tình huống thực tiễn`,
                dongTu: 'vận dụng',
                mucToiDa: 'VanDung',
              });
            }

            return {
              id: ndId,
              ten: ndName,
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
                  noiDung: `Nhận biết và nêu được các nội dung kiến thức trọng tâm của bài ${defaultName}`,
                  dongTu: 'nhận biết',
                  mucToiDa: 'Biet',
                },
                {
                  ma: 'ND1.2',
                  noiDung: `Hiểu và giải thích được bản chất kiến thức và ứng dụng của bài ${defaultName}`,
                  dongTu: 'giải thích',
                  mucToiDa: 'Hieu',
                },
                {
                  ma: 'ND1.3',
                  noiDung: `Vận dụng kiến thức bài ${defaultName} vào giải quyết bài tập và thực tiễn`,
                  dongTu: 'vận dụng',
                  mucToiDa: 'VanDung',
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

    // Chuẩn hóa môn học và bộ sách trích xuất từ Gemini hoặc kết hợp Heuristic
    const finalMon = normalizeSubject(rootObj?.mon || heuristic.subject);
    const finalTextbook = normalizeTextbook(rootObj?.textbook || heuristic.textbook);
    const finalKhoi = String(rootObj?.khoi || heuristic.grade || config.grade || '12');
    const finalCap = (rootObj?.cap as GradeLevel) || heuristic.gradeLevel || (config.gradeLevel as GradeLevel) || 'THPT';

    return {
      cap: finalCap,
      khoi: finalKhoi,
      mon: finalMon,
      textbook: finalTextbook,
      chuDeList,
      rawTopicsStr: cleanTopics.join('\n'),
      rawOutcomesStr: cleanOutcomes.join('\n'),
      readingPassageStr: docs.map((d) => d.content || '').join('\n\n'),
    };
  } catch (err: any) {
    console.error('Structured extraction error caught gracefully:', err);
    const defaultName = docs[0]?.name ? docs[0].name.replace(/\.[^/.]+$/, '').trim() : 'Bài học trích xuất từ tài liệu';
    return {
      cap: heuristic.gradeLevel || (config.gradeLevel as GradeLevel) || 'THPT',
      khoi: String(heuristic.grade || config.grade || '12'),
      mon: normalizeSubject(heuristic.subject || config.subject || 'Toán học'),
      textbook: normalizeTextbook(heuristic.textbook || config.textbook || 'Kết nối tri thức với cuộc sống'),
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
