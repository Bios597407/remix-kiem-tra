import React, { useState } from 'react';
import { BookOpen, Check, X, Search, Sparkles, Layers, Award } from 'lucide-react';
import { CURRICULUM_STANDARDS, CurriculumTopic, SubjectCurriculum } from '../data/curriculumStandards';
import { ExamConfig } from '../types/exam';

interface CurriculumStandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExamConfig;
  onApply: (selectedTopics: CurriculumTopic[]) => void;
}

export const CurriculumStandardModal: React.FC<CurriculumStandardModalProps> = ({
  isOpen,
  onClose,
  config,
  onApply,
}) => {
  if (!isOpen) return null;

  const [selectedSubject, setSelectedSubject] = useState<string>(config.subject || 'Toán học');
  const [selectedGrade, setSelectedGrade] = useState<string>(config.grade || '12');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Find matching curriculum
  const availableCurricula = CURRICULUM_STANDARDS.filter(
    (c) => c.subject === selectedSubject && c.grade === selectedGrade
  );

  const allTopics = availableCurricula.flatMap((c) => c.topics);

  const filteredTopics = allTopics.filter((t) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      t.chapter.toLowerCase().includes(kw) ||
      t.topicTitle.toLowerCase().includes(kw) ||
      t.knowledgeScope.toLowerCase().includes(kw) ||
      t.outcomes.know.some((k) => k.toLowerCase().includes(kw)) ||
      t.outcomes.understand.some((u) => u.toLowerCase().includes(kw)) ||
      t.outcomes.apply.some((a) => a.toLowerCase().includes(kw))
    );
  });

  const handleToggleTopic = (topicId: string) => {
    if (selectedTopicIds.includes(topicId)) {
      setSelectedTopicIds(selectedTopicIds.filter((id) => id !== topicId));
    } else {
      setSelectedTopicIds([...selectedTopicIds, topicId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTopicIds.length === filteredTopics.length) {
      setSelectedTopicIds([]);
    } else {
      setSelectedTopicIds(filteredTopics.map((t) => t.id));
    }
  };

  const handleConfirmApply = () => {
    const chosen = allTopics.filter((t) => selectedTopicIds.includes(t.id));
    if (chosen.length === 0) {
      return;
    }
    onApply(chosen);
    onClose();
  };

  // Unique subjects and grades in standard library
  const subjectList = Array.from(new Set(CURRICULUM_STANDARDS.map((c) => c.subject)));
  const gradeList = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <BookOpen className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Thư Viện Chuẩn GDPT 2018 (Bộ GD&ĐT)
                <span className="text-[11px] font-semibold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                  Chính thức
                </span>
              </h2>
              <p className="text-xs text-indigo-100">
                Nạp sẵn Chủ đề, Đơn vị kiến thức & Yêu cầu cần đạt theo 3 mức: Biết – Hiểu – Vận dụng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Môn học chuẩn:</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopicIds([]);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-hidden"
            >
              {subjectList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Khối lớp:</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedTopicIds([]);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-hidden"
            >
              {gradeList.map((g) => (
                <option key={g} value={g}>
                  Lớp {g}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tìm kiếm bài học / YCCĐ:</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Gõ từ khóa tìm kiếm..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Content Topics List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b">
            <span>
              Tìm thấy <strong className="text-indigo-700">{filteredTopics.length}</strong> bài học / chủ đề chuẩn cho môn <strong>{selectedSubject} Lớp {selectedGrade}</strong>
            </span>
            {filteredTopics.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {selectedTopicIds.length === filteredTopics.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            )}
          </div>

          {filteredTopics.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-40 text-slate-500" />
              <p className="text-sm font-semibold text-slate-600">
                Chưa có dữ liệu bài mẫu cho môn {selectedSubject} Lớp {selectedGrade}.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Thầy/Cô có thể tải lên tệp giáo trình SGK hoặc nhập trực tiếp ở khung thiết lập.
              </p>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const isChecked = selectedTopicIds.includes(topic.id);
              return (
                <div
                  key={topic.id}
                  onClick={() => handleToggleTopic(topic.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 ${
                    isChecked
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
                          {topic.chapter}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{topic.topicTitle}</h4>
                        <p className="text-xs text-slate-600 mt-1 italic">
                          <strong>Trọng tâm:</strong> {topic.knowledgeScope}
                        </p>
                      </div>

                      {/* 3 Cognitive Levels Outcomes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/70 text-xs">
                        {/* Biết */}
                        <div className="rounded-lg bg-sky-50 border border-sky-100 p-2.5">
                          <div className="flex items-center space-x-1.5 text-sky-800 font-bold mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                            <span>1. Biết (Nhận biết)</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                            {topic.outcomes.know.map((k, i) => (
                              <li key={i}>{k}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Hiểu */}
                        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
                          <div className="flex items-center space-x-1.5 text-emerald-800 font-bold mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>2. Hiểu (Thông hiểu)</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                            {topic.outcomes.understand.map((u, i) => (
                              <li key={i}>{u}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Vận dụng */}
                        <div className="rounded-lg bg-purple-50 border border-purple-100 p-2.5">
                          <div className="flex items-center space-x-1.5 text-purple-800 font-bold mb-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                            <span>3. Vận dụng</span>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                            {topic.outcomes.apply.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            Đã chọn: <strong className="text-indigo-700">{selectedTopicIds.length}</strong> bài học/chủ đề
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
              Đóng
            </button>
            <button
              type="button"
              disabled={selectedTopicIds.length === 0}
              onClick={handleConfirmApply}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-sm disabled:opacity-50 disabled:pointer-events-none flex items-center space-x-1.5 transition"
            >
              <Check className="h-4 w-4" />
              <span>Nạp vào Thiết Lập Ma Trận & Bản Đặc Tả</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CurriculumStandardModal;
