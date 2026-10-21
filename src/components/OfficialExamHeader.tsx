import React from 'react';
import { ExamConfig } from '../types/exam';

interface OfficialExamHeaderProps {
  config: ExamConfig;
  activeCode: string;
}

export const OfficialExamHeader: React.FC<OfficialExamHeaderProps> = ({ config, activeCode }) => {
  const department = (config.departmentName || 'SỞ GIÁO DỤC & ĐÀO TẠO TPHCM').toUpperCase();
  const school = (config.schoolName || 'TRƯỜNG THPT VÕ TRƯỜNG TOẢN').toUpperCase();
  const officialType = config.officialExamType || 'Đề chính thức';
  const pageCount = config.pageCountText || '2';

  const examTitle = (config.examTitle || 'ĐỀ KIỂM TRA CUỐI HỌC KÌ 1').toUpperCase();
  const academicYear = config.academicYear || '2025 - 2026';
  
  const rawSubject = config.customSubject || config.subject || 'CÔNG NGHỆ ĐIỆN – ĐIỆN TỬ';
  const gradeSuffix = config.grade ? ` ${config.grade}` : '';
  const subjectDisplay = rawSubject.toUpperCase();

  const duration = config.durationMinutes || 45;
  const durationNote = config.durationNote || '(không kể thời gian phát đề)';

  return (
    <div className="font-exam text-black leading-snug select-text pb-2 mb-4">
      {/* 2-Column Header Table */}
      <div className="grid grid-cols-12 gap-2 text-center items-start">
        {/* Left Column */}
        <div className="col-span-5 space-y-0.5">
          <div className="font-bold text-xs sm:text-sm uppercase">{department}</div>
          <div className="font-bold text-xs sm:text-sm uppercase">{school}</div>
          <div className="font-bold italic text-xs sm:text-sm pt-0.5">{officialType}</div>
          <div className="italic text-[11px] sm:text-xs text-black">
            (Đề có _{pageCount}_ trang)
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-7 space-y-0.5">
          <div className="font-bold text-xs sm:text-sm uppercase">
            {examTitle} NĂM HỌC {academicYear}
          </div>
          <div className="font-bold text-xs sm:text-sm uppercase pt-0.5">
            MÔN: {subjectDisplay}{gradeSuffix}
          </div>
          <div className="italic text-xs sm:text-sm pt-0.5">
            Thời gian làm bài: {duration} PHÚT
          </div>
          <div className="italic text-[11px] sm:text-xs text-black">{durationNote}</div>
        </div>
      </div>

      {/* Underlined Student Info Bar & Mã đề */}
      <div className="mt-3 border-b-2 border-black pb-2 text-xs sm:text-sm font-exam flex flex-wrap items-baseline justify-between gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 overflow-hidden">
          <span>
            <strong>Họ và tên:</strong> ................................................................
          </span>
          <span>
            <strong>LỚP:</strong> ...........
          </span>
          <span>
            <strong>MS:</strong> ....................
          </span>
          <span>
            <strong>Số báo danh:</strong> ..............
          </span>
        </div>
        <div className="font-bold text-sm sm:text-base whitespace-nowrap ml-auto pl-2">
          Mã đề {activeCode || '111'}
        </div>
      </div>
    </div>
  );
};

export default OfficialExamHeader;
