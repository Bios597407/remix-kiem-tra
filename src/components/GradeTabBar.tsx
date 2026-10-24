import React from 'react';
import { GradeLevel } from '../types/exam';
import { GraduationCap, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface GradeTabBarProps {
  gradeLevel: GradeLevel;
  activeGrade: string;
  availableGrades: string[];
  activeTabs: string[];
  docCountsByGrade?: Record<string, number>;
  onSelectGradeLevel: (level: GradeLevel) => void;
  onSelectTab: (grade: string) => void;
  onAddTab: (grade: string) => void;
  onRemoveTab: (grade: string) => void;
  className?: string;
}

export const GradeTabBar: React.FC<GradeTabBarProps> = ({
  gradeLevel,
  activeGrade,
  availableGrades,
  activeTabs,
  docCountsByGrade,
  onSelectGradeLevel,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  className = '',
}) => {
  const unusedGrades = availableGrades.filter((g) => !activeTabs.includes(g));

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Level Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectGradeLevel('THPT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              gradeLevel === 'THPT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            🏛️ THPT (Khối 10, 11, 12 - Mặc định)
          </button>
          <button
            type="button"
            onClick={() => onSelectGradeLevel('THCS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              gradeLevel === 'THCS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            🏫 THCS (Lớp 6 – 9)
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-semibold px-2">
          Quản lý tối đa 3 Tab Khối lớp song song (Dữ liệu tách biệt hoàn toàn)
        </span>
      </div>

      {/* Warning for THCS */}
      {gradeLevel === 'THCS' && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="font-medium">
            <strong>Lưu ý:</strong> CV 7991 ghi hướng dẫn xây dựng ma trận, đặc tả cho cấp THPT; THCS là vận dụng.
          </p>
        </div>
      )}

      {/* Tabs List */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {activeTabs.map((g) => {
          const docCount = docCountsByGrade?.[g] ?? 0;
          return (
            <div
              key={g}
              onClick={() => onSelectTab(g)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-t-lg border-t-2 border-x font-bold text-xs cursor-pointer transition select-none ${
                activeGrade === g
                  ? 'bg-white border-t-blue-600 border-x-slate-300 text-blue-900 shadow-xs'
                  : 'bg-slate-100 border-t-transparent border-x-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate">Khối Lớp {g}</span>

              {/* Badge số file tài liệu trực tiếp trên Tab */}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition ${
                  docCount > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200 text-slate-500'
                }`}
                title={`Khối Lớp ${g} đang có ${docCount} tài liệu nạp`}
              >
                📄 {docCount} file
              </span>

              {activeTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTab(g);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                  title="Đóng Tab khối này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add new grade tab button */}
        {activeTabs.length < 3 && unusedGrades.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-semibold ml-1">Mở thêm Tab:</span>
            {unusedGrades.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onAddTab(g)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Lớp {g}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeTabBar;
