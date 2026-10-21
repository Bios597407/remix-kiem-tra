import React from 'react';
import { ExamConfig } from '../types/exam';

interface OfficialExamHeaderProps {
  config: ExamConfig;
  activeCode: string;
}

export const OfficialExamHeader: React.FC<OfficialExamHeaderProps> = ({ config, activeCode }) => {
  const department = (config.departmentName || 'SỞ GIÁO DỤC & ĐÀO TẠO TPHCM').toUpperCase();
  const school = (config.schoolName || 'TRƯỜNG THCS LONG PHÚ').toUpperCase();

  const examTitle = (config.examTitle || 'ĐỀ KIỂM TRA ĐỊNH KỲ GIỮA HỌC KỲ I').toUpperCase();
  const academicYear = config.academicYear || '2026 - 2027';
  
  const rawSubject = config.customSubject || config.subject || 'Khoa học tự nhiên';
  const gradeSuffix = config.grade ? ` - LỚP ${config.grade}` : '';
  const subjectDisplay = rawSubject.toUpperCase();

  const duration = config.durationMinutes || 45;
  const durationNote = config.durationNote || '(Không kể phát đề)';

  return (
    <div className="font-serif text-black leading-snug select-text pb-2 mb-3">
      {/* 2-Column Header Grid */}
      <div className="grid grid-cols-12 gap-2 text-center items-start border-b border-black pb-3">
        {/* Left Column */}
        <div className="col-span-5 space-y-0.5">
          <div className="font-bold text-xs sm:text-sm uppercase tracking-tight">{department}</div>
          <div className="font-bold text-xs sm:text-sm uppercase tracking-tight">{school}</div>
          <div className="font-bold text-xs sm:text-sm pt-1 uppercase">
            MÃ ĐỀ: {activeCode || '101'}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-7 space-y-0.5">
          <div className="font-bold text-xs sm:text-sm uppercase tracking-tight">
            {examTitle}
          </div>
          <div className="font-bold text-xs sm:text-sm uppercase tracking-tight">
            NĂM HỌC {academicYear}
          </div>
          <div className="font-bold text-xs sm:text-sm uppercase pt-0.5">
            Môn: {subjectDisplay}{gradeSuffix}
          </div>
          <div className="italic text-xs text-slate-800 pt-0.5">
            Thời gian làm bài: {duration} phút <em>{durationNote}</em>
          </div>
        </div>
      </div>

      {/* Student Info Bar */}
      <div className="mt-2.5 pt-1 text-xs sm:text-sm font-serif flex flex-wrap items-baseline justify-between gap-y-1">
        <div className="w-full flex flex-wrap items-baseline justify-between">
          <span>
            <strong>Họ và tên học sinh:</strong> .........................................................................
          </span>
          <span>
            <strong>Lớp:</strong> ................
          </span>
          <span>
            <strong>Số báo danh:</strong> ................
          </span>
        </div>
      </div>
    </div>
  );
};

export default OfficialExamHeader;
