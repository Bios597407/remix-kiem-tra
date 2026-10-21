import React, { useState } from 'react';
import { X, Search, Plus, Trash2, Copy, ArrowRight, Database } from 'lucide-react';
import { QuestionItem } from '../types/exam';
import MathRenderer from '../utils/mathRenderer';
import { useToast } from './Toast';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: QuestionItem[];
  onInsertToExam: (q: QuestionItem) => void;
  onDeleteFromBank: (id: string) => void;
  onAddNewToBank: (q: QuestionItem) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  bank,
  onInsertToExam,
  onDeleteFromBank,
  onAddNewToBank,
}) => {
  if (!isOpen) return null;

  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = bank.filter((q) => {
    const matchSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || q.type === filterType;
    return matchSearch && matchType;
  });

  const handleCreateEmpty = () => {
    const newQ: QuestionItem = {
      id: `bank_${Date.now()}`,
      part: 'part1',
      type: 'mcq_single',
      level: 'Nhận biết',
      topic: 'Chủ đề mới',
      question: 'Nhập nội dung câu hỏi mới...',
      options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
      correctAnswer: 'A',
      explanation: 'Hướng dẫn giải chi tiết...',
      score: 0.25,
    };
    onAddNewToBank(newQ);
    toast.success('Đã thêm 1 câu hỏi mẫu vào ngân hàng!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-800 text-lg">Ngân hàng Câu hỏi Cá nhân</h3>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                  {bank.length} câu hỏi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Lưu trữ các câu hỏi chất lượng để tái sử dụng và chèn trực tiếp vào đề đang soạn
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

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-slate-50 px-6 py-3">
          <div className="flex flex-1 items-center space-x-2 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo nội dung, chủ đề..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
            >
              <option value="all">Tất cả dạng câu</option>
              <option value="mcq_single">Trắc nghiệm 4 lựa chọn</option>
              <option value="true_false_group">Đúng/Sai kiểu mới</option>
              <option value="short_answer">Trả lời ngắn</option>
              <option value="essay">Tự luận</option>
            </select>
          </div>

          <button
            onClick={handleCreateEmpty}
            className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Thêm câu mới</span>
          </button>
        </div>

        {/* Questions List */}
        <div className="overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Database className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <p className="text-sm font-medium">Chưa có câu hỏi nào trong ngân hàng.</p>
              <p className="text-xs text-slate-400 mt-1">
                Khi xem đề kiểm tra, hãy bấm nút "📌 Lưu vào ngân hàng" tại bất kỳ câu hỏi nào.
              </p>
            </div>
          ) : (
            filtered.map((q, idx) => (
              <div
                key={q.id || idx}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                      {q.part === 'part1' ? 'Phần I (TN 4 LC)' : q.part === 'part2' ? 'Phần II (Đ/S)' : q.part === 'part3' ? 'Phần III (Ngắn)' : 'Phần IV (Tự luận)'}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {q.level}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{q.topic}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onInsertToExam(q)}
                      className="flex items-center space-x-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                      title="Chèn câu hỏi này vào đề đang soạn"
                    >
                      <span>Chèn vào đề</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteFromBank(q.id);
                        toast.info('Đã xóa câu hỏi khỏi ngân hàng.');
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      title="Xóa khỏi ngân hàng"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-xs font-medium text-slate-900 leading-relaxed font-exam">
                  <MathRenderer text={q.question} />
                </div>

                {/* Part 1 options */}
                {q.options && q.options.length === 4 && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                    {q.options.map((opt, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx];
                      const isCorrect = q.correctAnswer === letter;
                      return (
                        <div
                          key={letter}
                          className={`rounded px-2 py-1 ${isCorrect ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'bg-slate-50'}`}
                        >
                          <strong>{letter}.</strong> <MathRenderer text={opt} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-slate-500">
            Dữ liệu ngân hàng câu hỏi được lưu tự động trên máy tính của bạn.
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

export default QuestionBankModal;
