import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Database, Sparkles, RefreshCw } from 'lucide-react';
import { QuestionItem, ExamConfig } from '../types/exam';
import { parseRawExamText } from '../utils/examParser';
import { extractTextFromFile } from '../utils/fileParser';
import MathRenderer from '../utils/mathRenderer';
import { useToast } from './Toast';

interface ExamImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  onImportToExam: (questions: QuestionItem[]) => void;
  onSaveToBank: (questions: QuestionItem[]) => void;
}

export const ExamImportModal: React.FC<ExamImportModalProps> = ({
  isOpen,
  onClose,
  config,
  onImportToExam,
  onSaveToBank,
}) => {
  if (!isOpen) return null;

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [parsedList, setParsedList] = useState<QuestionItem[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await extractTextFromFile(file);
      setInputText(text);
      const parsed = parseRawExamText(text, config.topicTitle || 'Chủ đề từ file cũ');
      setParsedList(parsed);
      setHasParsed(true);
      toast.success(`Đã phân tích thành công ${parsed.length} câu hỏi từ file!`);
    } catch (err) {
      console.error(err);
      toast.error('Không thể đọc nội dung file. Vui lòng thử sao chép và dán trực tiếp.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleParseText = () => {
    if (!inputText.trim()) {
      toast.warning('Vui lòng dán nội dung đề kiểm tra cũ vào ô trước khi phân tích!');
      return;
    }
    const parsed = parseRawExamText(inputText, config.topicTitle || 'Chủ đề từ đề cũ');
    setParsedList(parsed);
    setHasParsed(true);
    toast.success(`Đã bóc tách thành công ${parsed.length} câu hỏi!`);
  };

  const handleApplyToExam = () => {
    if (parsedList.length === 0) return;
    onImportToExam(parsedList);
    onClose();
    toast.success(`Đã nạp ${parsedList.length} câu hỏi vào đề kiểm tra và cập nhật Ma trận!`);
  };

  const handleAddToBank = () => {
    if (parsedList.length === 0) return;
    onSaveToBank(parsedList);
    onClose();
    toast.success(`Đã lưu ${parsedList.length} câu hỏi vào Ngân hàng câu hỏi cá nhân!`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-lg">
                  Nhập Đề Thi Có Sẵn (Word / Text) Vào Hệ Thống
                </h3>
                <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">
                  Smart Parser
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tự động nhận diện Câu 1, 2, các phương án A, B, C, D, đáp án đúng và phân loại mức độ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-4">
          {!hasParsed ? (
            <div className="space-y-4">
              {/* Upload zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 rounded-xl p-6 text-center cursor-pointer transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".docx,.pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="mx-auto h-8 w-8 text-teal-600 mb-2" />
                <p className="text-sm font-bold text-teal-900">
                  {uploading ? 'Đang trích xuất nội dung file...' : 'Tải lên file đề thi cũ (.docx, .pdf, .txt)'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống tự động đọc và phân tích cấu trúc đề ngay trên trình duyệt
                </p>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hoặc dán trực tiếp nội dung đề thi vào đây:
                </label>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ví dụ:&#10;Câu 1: Cho hàm số y = f(x)...&#10;A. 1&#10;*B. 2&#10;C. 3&#10;D. 4&#10;Lời giải: Chọn B...&#10;&#10;Câu 2: Các khẳng định sau đúng hay sai:&#10;a) ...&#10;b) ...&#10;&#10;Bảng đáp án: 1-B, 2-A..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs font-mono leading-relaxed focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 ml-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Phân tích & Bóc tách câu hỏi</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between bg-teal-50 p-3 rounded-xl border border-teal-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-600" />
                  <div>
                    <span className="text-xs font-bold text-teal-900">
                      Bóc tách thành công {parsedList.length} câu hỏi từ đề cũ!
                    </span>
                    <p className="text-[11px] text-teal-700">
                      Phần I: {parsedList.filter((q) => q.part === 'part1').length} câu | Phần II: {parsedList.filter((q) => q.part === 'part2').length} câu | Phần III/IV: {parsedList.filter((q) => ['part3', 'part4'].includes(q.part)).length} câu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHasParsed(false)}
                  className="text-xs font-semibold text-teal-800 hover:underline flex items-center space-x-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Nhập đề khác</span>
                </button>
              </div>

              {/* Preview of Parsed questions */}
              <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                {parsedList.map((q, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>Câu {idx + 1} [{q.level}] ({q.score}đ)</span>
                      <span className="text-emerald-700">Đáp án: {String(q.correctAnswer)}</span>
                    </div>
                    <div className="text-slate-800 font-medium">
                      <MathRenderer text={q.question} />
                    </div>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mt-1">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>
                            <strong>{['A', 'B', 'C', 'D'][oIdx]}.</strong> {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Đóng
          </button>

          {hasParsed && parsedList.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleAddToBank}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center space-x-1.5"
              >
                <Database className="h-3.5 w-3.5 text-blue-600" />
                <span>Lưu vào Ngân hàng</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToExam}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
              >
                <span>Nạp vào Đề thi & Vẽ Ma trận</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamImportModal;
