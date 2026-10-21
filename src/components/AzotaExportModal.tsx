import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Sparkles, FileSpreadsheet, Share2 } from 'lucide-react';
import { QuestionItem, ExamConfig } from '../types/exam';
import { exportToAzotaFormat, exportToK12OnlineTSV, exportToGoogleFormsFormat } from '../utils/azotaExporter';

interface AzotaExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuestionItem[];
  config: ExamConfig;
}

export const AzotaExportModal: React.FC<AzotaExportModalProps> = ({
  isOpen,
  onClose,
  questions,
  config,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'azota' | 'k12' | 'google'>('azota');
  const [copied, setCopied] = useState(false);

  const azotaContent = exportToAzotaFormat(questions, config);
  const k12Content = exportToK12OnlineTSV(questions);
  const googleContent = exportToGoogleFormsFormat(questions);

  const currentContent = activeTab === 'azota' ? azotaContent : activeTab === 'k12' ? k12Content : googleContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700">
              <Share2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-lg">Xuất Đề Sang Azota / K12Online / Google Forms</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">
                  Chuẩn 100%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tự động gán mã nhận diện [#NB], [#TH], [#VD] và đánh dấu sao (*A.) cho đáp án đúng
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

        {/* Platform Tabs */}
        <div className="flex border-b bg-slate-50 px-6 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('azota')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition ${
              activeTab === 'azota'
                ? 'border-orange-600 text-orange-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            🔥 Cú pháp chuẩn Azota (*A, [#NB])
          </button>

          <button
            onClick={() => setActiveTab('k12')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition ${
              activeTab === 'k12'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Bảng K12Online (Excel / TSV)
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition ${
              activeTab === 'google'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📝 Google Forms / Quizizz
          </button>
        </div>

        {/* Instructions banner */}
        <div className="px-6 py-2.5 bg-orange-50/70 border-b border-orange-100 text-xs text-orange-950 flex items-center justify-between">
          <span>
            {activeTab === 'azota' && (
              <>
                <strong>Cách dùng trên Azota:</strong> Nhấp "Sao chép toàn bộ", vào Azota chọn "Tạo đề từ file Word/Văn bản", dán nội dung này vào là hệ thống tự nhận diện câu hỏi & đáp án 100%!
              </>
            )}
            {activeTab === 'k12' && (
              <>
                <strong>Cách dùng trên K12Online:</strong> Nhấp "Sao chép bảng TSV", dán vào Microsoft Excel hoặc Google Sheets rồi lưu lại để tải lên K12Online.
              </>
            )}
            {activeTab === 'google' && (
              <>
                <strong>Cách dùng trên Google Forms / Quizizz:</strong> Văn bản đã được định dạng sạch sẽ, sẵn sàng chuyển đổi bằng tiện ích Forms Converter.
              </>
            )}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shrink-0 shadow-2xs ml-3"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép toàn bộ'}</span>
          </button>
        </div>

        {/* Text View */}
        <div className="overflow-y-auto p-6 bg-slate-900 font-mono text-xs text-slate-200">
          <pre className="whitespace-pre-wrap leading-relaxed selection:bg-orange-600 selection:text-white">
            {currentContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-slate-500">
            Tổng cộng: <strong>{questions.length} câu hỏi</strong> đã được mã hóa chuẩn hóa.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AzotaExportModal;
