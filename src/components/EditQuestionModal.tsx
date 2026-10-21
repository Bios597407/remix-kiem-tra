import React, { useState } from 'react';
import { X, Check, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { QuestionItem, SubStatement, RubricStep } from '../types/exam';
import MathToolbar from './MathToolbar';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionItem | null;
  onSave: (updated: QuestionItem) => void;
}

export const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  question,
  onSave,
}) => {
  if (!isOpen || !question) return null;

  const [formData, setFormData] = useState<QuestionItem>({ ...question });

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...(formData.options || [])];
    opts[idx] = val;
    setFormData({ ...formData, options: opts });
  };

  const handleSubItemChange = (idx: number, field: keyof SubStatement, val: unknown) => {
    const subs = [...(formData.subItems || [])];
    subs[idx] = { ...subs[idx], [field]: val };
    setFormData({ ...formData, subItems: subs });
  };

  const handleRubricChange = (idx: number, field: keyof RubricStep, val: unknown) => {
    const rbs = [...(formData.rubric || [])];
    rbs[idx] = { ...rbs[idx], [field]: val };
    setFormData({ ...formData, rubric: rbs });
  };

  const addRubricStep = () => {
    const rbs = [...(formData.rubric || [])];
    rbs.push({ step: `Bước ${rbs.length + 1}`, point: 0.5, detail: 'Mô tả tiêu chí chấm...' });
    setFormData({ ...formData, rubric: rbs });
  };

  const removeRubricStep = (idx: number) => {
    const rbs = (formData.rubric || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, rubric: rbs });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Chỉnh sửa câu hỏi</h3>
            <p className="text-xs text-slate-500">
              Phần: {formData.part} • Dạng: {formData.type} • Mức độ: {formData.level}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
              <input
                type="text"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm số</label>
              <input
                type="number"
                step="0.05"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nội dung câu hỏi (Hỗ trợ LaTeX $...$)
              </label>
            </div>
            <div className="mb-1.5">
              <MathToolbar onInsert={(snippet) => setFormData({ ...formData, question: formData.question + ' ' + snippet })} />
            </div>
            <textarea
              rows={3}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
            />
          </div>

          {/* Part 1 Options */}
          {(formData.type === 'mcq_single' || formData.part === 'part1') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">4 Phương án trả lời</label>
              {['A', 'B', 'C', 'D'].map((letter, idx) => (
                <div key={letter} className="flex items-center space-x-2">
                  <span className="w-6 font-bold text-xs text-slate-700 text-center">{letter}.</span>
                  <input
                    type="text"
                    value={formData.options?.[idx] || ''}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 p-2 text-xs"
                  />
                  <label className="flex items-center space-x-1 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={formData.correctAnswer === letter}
                      onChange={() => setFormData({ ...formData, correctAnswer: letter })}
                    />
                    <span className="font-semibold text-emerald-700">Đúng</span>
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Part 2 SubItems */}
          {(formData.type === 'true_false_group' || formData.part === 'part2') && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">4 Mệnh đề Đúng/Sai</label>
              {formData.subItems?.map((sub, idx) => (
                <div key={sub.id} className="rounded-lg border border-slate-200 p-2.5 bg-slate-50 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-blue-700">{sub.label})</span>
                    <input
                      type="text"
                      value={sub.statement}
                      onChange={(e) => handleSubItemChange(idx, 'statement', e.target.value)}
                      className="flex-1 rounded border border-slate-300 p-1.5 text-xs bg-white"
                    />
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1 text-xs text-emerald-700 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name={`sub_${sub.id}`}
                          checked={sub.isCorrect === true}
                          onChange={() => handleSubItemChange(idx, 'isCorrect', true)}
                        />
                        <span>Đúng</span>
                      </label>
                      <label className="flex items-center space-x-1 text-xs text-rose-700 font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name={`sub_${sub.id}`}
                          checked={sub.isCorrect === false}
                          onChange={() => handleSubItemChange(idx, 'isCorrect', false)}
                        />
                        <span>Sai</span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={sub.explanation || ''}
                    placeholder="Giải thích ngắn cho mệnh đề này..."
                    onChange={(e) => handleSubItemChange(idx, 'explanation', e.target.value)}
                    className="w-full rounded border border-slate-200 p-1 text-[11px] bg-white text-slate-600"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Part 3 Short Answer */}
          {(formData.type === 'short_answer' || formData.part === 'part3') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đáp án ngắn gọn / kết quả số
              </label>
              <input
                type="text"
                value={String(formData.correctAnswer)}
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-emerald-800"
              />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hướng dẫn giải chi tiết / Lời giải mẫu
            </label>
            <textarea
              rows={3}
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          {/* Rubric for Essay */}
          {(formData.type === 'essay' || formData.part === 'part4') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Biểu điểm thành phần (Rubric)</label>
                <button
                  type="button"
                  onClick={addRubricStep}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <Plus className="h-3 w-3" />
                  <span>Thêm bước</span>
                </button>
              </div>
              {formData.rubric?.map((r, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={r.step}
                    onChange={(e) => handleRubricChange(idx, 'step', e.target.value)}
                    className="w-20 rounded border border-slate-300 p-1.5 text-xs text-center font-bold"
                  />
                  <input
                    type="text"
                    value={r.detail}
                    onChange={(e) => handleRubricChange(idx, 'detail', e.target.value)}
                    className="flex-1 rounded border border-slate-300 p-1.5 text-xs"
                  />
                  <input
                    type="number"
                    step="0.25"
                    value={r.point}
                    onChange={(e) => handleRubricChange(idx, 'point', parseFloat(e.target.value) || 0)}
                    className="w-16 rounded border border-slate-300 p-1.5 text-xs text-center font-bold text-blue-700"
                  />
                  <button
                    type="button"
                    onClick={() => removeRubricStep(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Needs Review Flag */}
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="chkReview"
              checked={formData.needsReview || false}
              onChange={(e) => setFormData({ ...formData, needsReview: e.target.checked })}
              className="rounded text-amber-600"
            />
            <label htmlFor="chkReview" className="text-xs text-amber-800 flex items-center space-x-1 font-medium cursor-pointer">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Gắn nhãn: "⚠ Cần GV kiểm tra kỹ số liệu / dữ kiện"</span>
            </label>
          </div>

          <div className="border-t pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1.5"
            >
              <Check className="h-4 w-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuestionModal;
