import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  X,
  BookOpen,
  GraduationCap,
  Sparkles,
  Info,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ExamConfig } from '../types/exam';
import { useToast } from './Toast';

interface PromptTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
}

export const PromptTemplateModal: React.FC<PromptTemplateModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [targetTier, setTargetTier] = useState<'primary' | 'secondary_high'>(() => {
    return config.gradeLevel === 'primary' || Number(config.grade) <= 5
      ? 'primary'
      : 'secondary_high';
  });

  const subjectName = config.customSubject || config.subject || 'Toán học';
  const gradeNumber = config.grade || '10';
  const examTypeName = config.examTitle || 'Kiểm tra Giữa Học kỳ 1';
  const duration = config.durationMinutes || (targetTier === 'primary' ? 40 : 90);

  // Generate Prompt for Secondary / High School (CV 7991/BGDĐT-GDTrH)
  const generateSecondaryHighPrompt = () => {
    const isVan = subjectName.toLowerCase().includes('văn') || subjectName.toLowerCase().includes('ngữ văn');
    
    if (isVan) {
      return `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục hàng đầu của Bộ Giáo dục và Đào tạo Việt Nam.
Hãy xây dựng MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ MÔN NGỮ VĂN tuân thủ nghiêm ngặt CÔNG VĂN 7991/BGDĐT-GDTrH và Chương trình GDPT 2018.

THÔNG TIN ĐỀ KIỂM TRA:
- Môn học: ${subjectName}
- Khối lớp: Lớp ${gradeNumber} (Cấp ${Number(gradeNumber) <= 9 ? 'THCS' : 'THPT'})
- Loại đề: ${examTypeName}
- Thời gian làm bài: ${duration} phút
- Bộ sách giáo khoa: ${config.textbook || 'Kết nối tri thức với cuộc sống'}
${config.topicTitle ? `- Phạm vi kiến thức/Văn bản trọng tâm: ${config.topicTitle}` : ''}

QUY TẮC CỐT LÕI BẮT BUỘC THEO CÔNG VĂN 7991:
1. 3 Mức độ nhận thức: Nhận biết (40%), Thông hiểu (30%), Vận dụng (30%). Tuyệt đối KHÔNG chia mức độ "Vận dụng cao" thành cột riêng.
2. Cấu trúc bài kiểm tra môn Ngữ văn:
   - Phần I: ĐỌC HIỂU (4,0 điểm): Ngữ liệu ngoài SGK (truyện, thơ hoặc văn bản nghị luận/thông tin phù hợp lứa tuổi). Gồm các câu hỏi phân bổ: Nhận biết (2 câu x 0.5đ = 1.0đ), Thông hiểu (2 câu x 0.5đ = 1.0đ), Vận dụng (2 câu x 1.0đ = 2.0đ).
   - Phần II: VIẾT (6,0 điểm):
     * Câu 1: Viết đoạn văn nghị luận xã hội/nghị luận văn học ngắn (2,0 điểm) - Mức độ Thông hiểu & Vận dụng.
     * Câu 2: Viết bài văn nghị luận hoàn chỉnh (4,0 điểm) - Mức độ Vận dụng tích hợp sáng tạo.
3. Quy tắc viết Bản đặc tả:
   - Sử dụng chính xác động từ hành động của GDPT 2018:
     * Nhận biết: Nhận biết được ngôi kể, nhân vật, thể thơ, từ ngữ, chi tiết, phương thức biểu đạt...
     * Thông hiểu: Phân tích được tác dụng của biện pháp tu từ, giải thích ý nghĩa hình ảnh, thông điệp...
     * Vận dụng: Rút ra bài học cho bản thân, liên hệ thực tiễn đời sống, thể hiện thái độ/quan điểm...
   - Cột Số câu hỏi: Chỉ định rõ mã câu: Phần I (Câu 1, 2, 3, 4, 5); Phần II (Câu 1, Câu 2).

YÊU CẦU ĐẦU RA:
Xuất toàn bộ dữ liệu dưới dạng BẢNG MARKDOWN chuẩn chỉnh:
1. Bảng 1: KHUNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KÌ THEO CÔNG VĂN 7991 (Tổng điểm tròn 10.0đ).
2. Bảng 2: BẢN ĐẶC TẢ KĨ THUẬT ĐỀ KIỂM TRA (Đồng bộ 1-1 với tọa độ ma trận).
3. ĐỀ KIỂM TRA MINH HOẠ KÈM HƯỚNG DẪN CHẤM VÀ RUBRIC TỰ LUẬN TỪNG BƯỚC CHI TIẾT.`;
    }

    return `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục hàng đầu của Bộ Giáo dục và Đào tạo Việt Nam.
Dựa trên CẨM NANG HƯỚNG DẪN KỸ THUẬT CỦA BỘ GD&ĐT VIỆT NAM (THEO CÔNG VĂN 7991/BGDĐT-GDTrH VÀ THÔNG TƯ 22/2021/TT-BGDĐT), hãy xây dựng MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ ĐỒNG BỘ 100% cho:

THÔNG TIN ĐỀ KIỂM TRA:
- Môn học: ${subjectName}
- Khối lớp: Lớp ${gradeNumber} (Cấp ${Number(gradeNumber) <= 9 ? 'THCS' : 'THPT'})
- Loại đề kiểm tra: ${examTypeName}
- Thời gian làm bài: ${duration} phút
- Bộ sách giáo khoa: ${config.textbook || 'Kết nối tri thức với cuộc sống'}
${config.topicTitle ? `- Chủ đề/Bài học trọng tâm: ${config.topicTitle}` : ''}
${config.knowledgeScope ? `- Phạm vi kiến thức: ${config.knowledgeScope}` : ''}

1. BẢN CHẤT CỐT LÕI BẮT BUỘC PHẢI TUÂN THỦ THEO CÔNG VĂN 7991:
• 3 Mức độ nhận thức: Gồm Nhận biết (40% = 4,0đ), Thông hiểu (30% = 3,0đ), Vận dụng (30% = 3,0đ). TUYỆT ĐỐI KHÔNG chia mức độ "Vận dụng cao" thành cột riêng.
• Tỷ lệ điểm cố định: 7,0 điểm Trắc nghiệm khách quan (70%) và 3,0 điểm Tự luận (30%). Tổng điểm = 10,0 điểm.
• Cơ cấu 4 định dạng câu hỏi bắt buộc:
  - Dạng 1 (Trắc nghiệm nhiều lựa chọn): Chọn 1 trong 4 phương án (A, B, C, D). Mỗi câu đúng = 0,25 điểm.
  - Dạng 2 (Trắc nghiệm Đúng/Sai): Mỗi câu có 4 ý (a, b, c, d). Chấm điểm bậc thang chuẩn Bộ GD&ĐT:
    * Đúng 1 ý = 0,10 điểm
    * Đúng 2 ý = 0,25 điểm
    * Đúng 3 ý = 0,50 điểm
    * Đúng cả 4 ý = 1,00 điểm
  - Dạng 3 (Trắc nghiệm Trả lời ngắn): Tự điền đáp số/từ ngữ ngắn. Mỗi câu đúng = 0,25đ hoặc 0,5đ.
  - Dạng 4 (Tự luận): Chấm theo Rubric từng bước (Step-by-step), tổng điểm Tự luận phải đúng bằng 3,0 điểm.

2. THUẬT TOÁN PHÂN BỔ MỨC ĐỘ TRONG MA TRẬN:
• Nhận biết (4,0 điểm): Phân bổ toàn bộ vào Dạng 1 và các ý ban đầu (ý a, b) của Dạng 2.
• Thông hiểu (3,0 điểm): Phân bổ vào các ý đào sâu (ý c, d) của Dạng 2 và các câu hỏi cơ bản của Dạng 3.
• Vận dụng (3,0 điểm): Phân bổ vào Dạng 3 (tính toán tư duy ngắn phức tạp) và Dạng 4 (Bài tập tự luận tổng hợp).

3. QUY TẮC BẢN ĐẶC TẢ:
• Trích xuất chính xác các động từ năng lực chuẩn Chương trình GDPT 2018:
  - Nhận biết: Nhận biết được, phát biểu được, nêu được, kể tên được, xác định được (trực quan).
  - Thông hiểu: Giải thích được, phân biệt được, lấy ví dụ được, minh họa được, so sánh được.
  - Vận dụng: Vận dụng được để giải quyết..., tính toán được..., chứng minh được..., giải quyết vấn đề thực tiễn liên quan đến...
• Cột Số câu hỏi phải chỉ định rõ mã câu/ý: (VD: Dạng 1: Câu 1, Câu 2; Dạng 2: Câu 11 (ý a, b); Tự luận: Câu 1).

YÊU CẦU ĐẦU RA (XUẤT DƯỚI DẠNG BẢNG MARKDOWN):
1. Bảng 1: Khung Ma trận đề kiểm tra 19 cột (CV 7991).
2. Bảng 2: Bản đặc tả kĩ thuật đề kiểm tra chi tiết (16 cột).
3. Đề thi minh họa theo 4 dạng thức chuẩn kèm bảng đáp án và hướng dẫn chấm tự luận.`;
  };

  // Generate Prompt for Primary School (TT 27/2020/TT-BGDĐT)
  const generatePrimaryPrompt = () => {
    return `Bạn là Chuyên gia Khảo thí và Giáo dục Tiểu học hàng đầu của Bộ Giáo dục và Đào tạo Việt Nam.
Dựa trên CẨM NANG HƯỚNG DẪN KỸ THUẬT CỦA BỘ GD&ĐT VIỆT NAM (THEO THÔNG TƯ 27/2020/TT-BGDĐT VÀ CHƯƠNG TRÌNH GDPT 2018 TIỂU HỌC), hãy xây dựng MA TRẬN VÀ BẢN ĐẶC TẢ ĐỀ KIỂM TRA ĐỊNH KỲ TIỂU HỌC cho:

THÔNG TIN ĐỀ KIỂM TRA TIỂU HỌC:
- Môn học: ${subjectName}
- Khối lớp: Lớp ${Number(gradeNumber) <= 5 ? gradeNumber : '4'} (Cấp Tiểu học)
- Loại đề kiểm tra: ${examTypeName}
- Thời gian làm bài: ${duration} phút
- Bộ sách giáo khoa: ${config.textbook || 'Kết nối tri thức với cuộc sống'}
${config.topicTitle ? `- Mạch kiến thức/Chủ đề trọng tâm: ${config.topicTitle}` : ''}
${config.knowledgeScope ? `- Phạm vi kiến thức: ${config.knowledgeScope}` : ''}

1. BẢN CHẤT CỐT LÕI BẮT BUỘC PHẢI TUÂN THỦ THEO THÔNG TƯ 27/2020/TT-BGDĐT:
• 3 Mức độ nhận thức đặc thù Tiểu học:
  - Mức 1 (Nhận biết, nhắc lại): Học sinh nhận biết, nhắc lại hoặc mô tả được kiến thức, kĩ năng đã học trong các tình huống quen thuộc.
  - Mức 2 (Thông hiểu, kết nối): Học sinh kết nối, sắp xếp được một số kiến thức, kĩ năng đã học để giải quyết vấn đề tương tự.
  - Mức 3 (Vận dụng): Học sinh vận dụng các kiến thức, kĩ năng đã học để giải quyết vấn đề mới hoặc đưa ra những phản hồi hợp lý trong học tập, cuộc sống.
• Hình thức đề thi: Kết hợp linh hoạt giữa Trắc nghiệm khách quan 4 lựa chọn đơn giản (TNKQ) và Tự luận viết ngắn/điền khuyết/giải toán lời văn (TL).
• Tỷ lệ điểm khuyến nghị: 50% Trắc nghiệm (5,0 điểm) và 50% Tự luận (5,0 điểm) (hoặc 40% TN / 60% TL). Tổng điểm toàn đề = 10,0 điểm.

2. CẤU TRÚC MA TRẬN TIỂU HỌC THEO THÔNG TƯ 27 (DẠNG BẢNG MARKDOWN):
Bảng ma trận gồm các cột chuẩn:
| STT | Mạch kiến thức / Kĩ năng | Mức 1 (Nhận biết) | Mức 2 (Thông hiểu) | Mức 3 (Vận dụng) | Tổng cộng |
Trong mỗi ô Mức độ phải thể hiện rõ 3 thông số:
- Số câu TN
- Số câu TL
- Số điểm

3. QUY TẮC VIẾT BẢN ĐẶC TẢ TIỂU HỌC:
• Mức 1: Gắn liền với các yêu cầu: Đọc được, viết được, nhận biết được hình vẽ/biểu tượng, tính nhẩm trực tiếp.
• Mức 2: Gắn liền với các yêu cầu: Thực hiện được phép tính có nhớ, tóm tắt được bài toán, so sánh các số, điền dấu thích hợp.
• Mức 3: Gắn liền với các yêu cầu: Giải bài toán có lời văn (2-3 bước tính), giải quyết tình huống thực tế liên quan đến đo lường/tiền tệ/hình học.
• Chỉ định cụ thể câu hỏi trong đề: (VD: Câu 1 (TN), Câu 2 (TN), Câu 7 (TL), Câu 9 (TL)).

YÊU CẦU ĐẦU RA (XUẤT DƯỚI DẠNG BẢNG MARKDOWN):
1. Bảng Ma trận kiểm tra định kỳ Tiểu học chuẩn Thông tư 27 (Tổng điểm = 10.0đ).
2. Bản đặc tả chi tiết yêu cầu cần đạt từng mức độ 1, 2, 3.
3. Đề kiểm tra minh họa phù hợp tâm lý lứa tuổi học sinh tiểu học kèm đáp án và biểu điểm chi tiết.`;
  };

  const activePromptText =
    targetTier === 'primary' ? generatePrimaryPrompt() : generateSecondaryHighPrompt();

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(activePromptText);
      setCopied(true);
      toast.success('Đã sao chép toàn văn Lệnh Prompt Kỹ Thuật vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Không thể sao chép tự động, vui lòng chọn và copy thủ công.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-black shadow-sm">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-black text-sm sm:text-base tracking-wide">
                  CẨM NANG LỆNH PROMPT KỸ THUẬT RA ĐỀ BỘ GD&ĐT
                </h3>
                <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Chuẩn 2025
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Sao chép lệnh chuẩn hóa để AI (Gemini, ChatGPT, Claude) xây dựng Ma trận & Bản đặc tả chuẩn 100%
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Level Switcher & Dynamic Parameter Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Chọn cấp học:</span>
            <div className="flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTargetTier('secondary_high')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  targetTier === 'secondary_high'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>THCS & THPT (Công văn 7991)</span>
              </button>
              <button
                type="button"
                onClick={() => setTargetTier('primary')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  targetTier === 'primary'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Tiểu học (Thông tư 27)</span>
              </button>
            </div>
          </div>

          {/* Quick Context Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="bg-white border px-2 py-0.5 rounded-md text-indigo-900">
              Môn: <strong>{subjectName}</strong>
            </span>
            <span className="bg-white border px-2 py-0.5 rounded-md text-indigo-900">
              Lớp: <strong>{gradeNumber}</strong>
            </span>
            <span className="bg-white border px-2 py-0.5 rounded-md text-indigo-900">
              Thời gian: <strong>{duration} phút</strong>
            </span>
          </div>
        </div>

        {/* Prompt Content Preview Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-500 font-bold flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Nội dung Prompt đã điền sẵn tham số thực tế:</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {targetTier === 'primary' ? 'Thông tư 27/2020/TT-BGDĐT' : 'Công văn 7991/BGDĐT-GDTrH'}
            </span>
          </div>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto border border-slate-800 selection:bg-indigo-500 selection:text-white max-h-[50vh]">
              {activePromptText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Prompt đã được kiểm định khảo thí, bám sát 100% động từ năng lực GDPT 2018.
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black shadow-md transition flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'ĐÃ SAO CHÉP PROMPT!' : 'SAO CHÉP LỆNH PROMPT NÀY'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptTemplateModal;
