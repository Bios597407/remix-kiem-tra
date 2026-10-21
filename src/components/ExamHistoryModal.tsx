import React, { useState, useRef } from 'react';
import { X, History, RotateCcw, Trash2, Calendar, Download, Upload, Search } from 'lucide-react';
import { ExamHistoryItem } from '../types/exam';

interface ExamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExamHistoryItem[];
  onRestore: (item: ExamHistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
  onImportHistory?: (items: ExamHistoryItem[]) => void;
}

export const ExamHistoryModal: React.FC<ExamHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onRestore,
  onDeleteHistoryItem,
  onClearAllHistory,
  onImportHistory,
}) => {
  if (!isOpen) return null;

  const [searchKw, setSearchKw] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredHistory = history.filter((item) => {
    if (!searchKw.trim()) return true;
    const kw = searchKw.toLowerCase();
    return (
      item.examTitle.toLowerCase().includes(kw) ||
      item.subject.toLowerCase().includes(kw) ||
      (item.config.topicTitle && item.config.topicTitle.toLowerCase().includes(kw)) ||
      item.dateStr.toLowerCase().includes(kw)
    );
  });

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `Sao_Luu_Lich_Su_De_Thi_${Date.now()}.json`);
    dlAnchor.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && onImportHistory) {
          onImportHistory(parsed);
        }
      } catch (err) {
        alert('Tệp sao lưu không hợp lệ.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
              <History className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-lg">Lịch Sử Các Đề Kiểm Tra Đã Tạo</h3>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                  {history.length} đề
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu tự động trong trình duyệt, mở lại đề bất kỳ lúc nào hoặc xuất file sao lưu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar: Search & Backup / Restore */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchKw}
              onChange={(e) => setSearchKw(e.target.value)}
              placeholder="Tìm kiếm theo tên đề, môn học hoặc ngày tạo..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportBackup}
              disabled={history.length === 0}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              title="Xuất file JSON sao lưu toàn bộ lịch sử đề"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Xuất sao lưu (JSON)</span>
            </button>

            {onImportHistory && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Nạp lại lịch sử đề từ tệp sao lưu JSON"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Nạp sao lưu</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Không tìm thấy đề nào phù hợp.</p>
              <p className="text-xs text-slate-400 mt-1">
                Mỗi khi thầy cô bấm "✨ TẠO ĐỀ KIỂM TRA", đề mới sẽ tự động được lưu vào đây.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                      {item.gradeLevel === 'primary' ? 'Tiểu học' : item.gradeLevel === 'secondary' ? 'THCS' : 'THPT'} – Lớp {item.grade}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{item.subject}</span>
                    <span className="text-[11px] text-slate-500">
                      ({item.totalQuestions} câu • {item.totalScore}đ)
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.examTitle}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span>{item.dateStr}</span>
                    <span>•</span>
                    <span className="truncate max-w-[280px]">
                      Chủ đề: {item.config.topicTitle || 'Kiến thức trọng tâm'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                  <button
                    onClick={() => {
                      onRestore(item);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Mở đề này</span>
                  </button>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Xóa đề này khỏi lịch sử"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          {history.length > 0 ? (
            <button
              onClick={onClearAllHistory}
              className="text-xs font-medium text-rose-600 hover:underline cursor-pointer"
            >
              Xóa sạch lịch sử
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamHistoryModal;
