import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Key, Download, Database, RotateCcw, History, Trash2, Sliders, ChevronDown, Check } from 'lucide-react';
import { ExamConfig } from '../types/exam';

interface HeaderProps {
  onOpenApiKey: () => void;
  onOpenQuestionBank: () => void;
  onOpenHistory: () => void;
  onResetDefaults: () => void;
  onDownloadStandalone: () => void;
  onOpenStandardExporter?: () => void;
  onClearOldContent?: () => void;
  savedBankCount: number;
  historyCount: number;
  hasApiKey: boolean;
  config: ExamConfig;
  onConfigChange: (updated: ExamConfig) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiKey,
  onOpenQuestionBank,
  onOpenHistory,
  onResetDefaults,
  onDownloadStandalone,
  onOpenStandardExporter,
  onClearOldContent,
  savedBankCount,
  historyCount,
  hasApiKey,
  config,
  onConfigChange,
}) => {
  const [showDisplayDropdown, setShowDisplayDropdown] = useState(false);
  const displayDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (displayDropdownRef.current && !displayDropdownRef.current.contains(event.target as Node)) {
        setShowDisplayDropdown(false);
      }
    }
    if (showDisplayDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDisplayDropdown]);
  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        {/* Brand Header Logo & Title */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 group cursor-default shrink-0 mr-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-md group-hover:shadow-blue-200 transition-all duration-300 shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none whitespace-nowrap">
                RA ĐỀ KIỂM TRA <span className="text-blue-600">AI</span>
              </h1>
              <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase tracking-wider md:inline-block">
                GDPT 2018
              </span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] font-semibold text-slate-500 mt-0.5 tracking-tight hidden xl:block">
              HỆ THỐNG RA ĐỀ KIỂM TRA ĐỊNH KÌ (MẪU THAM KHẢO CV 7991)
            </p>
          </div>
        </div>

        {/* All action buttons balanced and aligned strictly in 1 single row */}
        <div className="flex items-center gap-1.5 sm:gap-2 py-1 justify-end shrink-0 flex-nowrap">
          {/* Export Standard Form Button (Primary Action) */}
          {onOpenStandardExporter && (
            <button
              onClick={onOpenStandardExporter}
              className="flex h-10 items-center space-x-1.5 sm:space-x-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 px-3 sm:px-3.5 text-xs font-extrabold text-white transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
              title="Xuất Đề Kiểm Tra Theo Form Trình Bày Chuẩn (Xem trước, In & Tải Word)"
            >
              <Download className="h-4 w-4 text-amber-300 shrink-0" />
              <span>Xuất đề <span className="hidden xl:inline">(theo form chuẩn)</span></span>
            </button>
          )}

          {/* History */}
          <button
            onClick={onOpenHistory}
            className="group flex h-10 items-center space-x-1.5 sm:space-x-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Lịch sử các đề thi đã tạo"
          >
            <History className="h-4 w-4 text-indigo-500 group-hover:rotate-[-10deg] transition-transform shrink-0" />
            <span className="hidden md:inline">Lịch sử</span>
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-black text-indigo-700">
              {historyCount}
            </span>
          </button>

          {/* Bank */}
          <button
            onClick={onOpenQuestionBank}
            className="group flex h-10 items-center space-x-1.5 sm:space-x-2 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-700 transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Ngân hàng câu hỏi cá nhân"
          >
            <Database className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="hidden md:inline">Ngân hàng</span>
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-black text-blue-700">
              {savedBankCount}
            </span>
          </button>

          {/* Gemini API Key */}
          <button
            onClick={onOpenApiKey}
            className={`flex h-10 items-center space-x-1.5 sm:space-x-2 rounded-xl border px-2.5 sm:px-3 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer ${
              hasApiKey
                ? 'border-amber-200 bg-amber-50/90 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
                : 'border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200'
            }`}
            title="Cấu hình Google Gemini AI"
          >
            <Key className={`h-4 w-4 shrink-0 ${hasApiKey ? 'text-amber-700' : 'text-amber-800'}`} />
            <span className="hidden sm:inline">Cấu hình AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* Clear Old Content */}
          {onClearOldContent && (
            <button
              type="button"
              onClick={onClearOldContent}
              className="flex h-10 items-center space-x-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 border-rose-300 px-2.5 sm:px-3 text-xs font-extrabold text-rose-800 transition-all shadow-2xs shrink-0 cursor-pointer group"
              title="Xóa toàn bộ nội dung bài cũ trước khi nạp bài mới"
            >
              <Trash2 className="h-4 w-4 text-rose-600 transition-colors shrink-0" />
              <span className="hidden xl:inline">Xóa toàn bộ bài cũ</span>
              <span className="xl:hidden hidden sm:inline">Xóa bài cũ</span>
              <span className="sm:hidden">Xóa</span>
            </button>
          )}

          {/* Cài đặt hiển thị dạng sổ xuống với 3 lựa chọn */}
          <div className="relative shrink-0" ref={displayDropdownRef}>
            <button
              type="button"
              onClick={() => setShowDisplayDropdown((prev) => !prev)}
              className={`flex h-10 items-center space-x-1.5 sm:space-x-2 rounded-xl border px-2.5 sm:px-3 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                showDisplayDropdown
                  ? 'border-blue-400 bg-blue-50/90 text-blue-800 ring-2 ring-blue-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Cài đặt hiển thị cỡ chữ toàn ứng dụng"
            >
              <Sliders className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="font-extrabold whitespace-nowrap">Cài đặt hiển thị</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">
                {config.appUiScale === 'compact' ? 'Nhỏ' : config.appUiScale === 'relaxed' ? 'Lớn' : 'Vừa'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showDisplayDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Sổ Xuống */}
            {showDisplayDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Cài đặt hiển thị</p>
                  <p className="text-[11px] text-slate-500 font-medium">Chọn chế độ cỡ chữ cho toàn bộ ứng dụng</p>
                </div>

                <div className="space-y-1">
                  {/* Lựa chọn 1: Nhỏ */}
                  <button
                    type="button"
                    onClick={() => {
                      onConfigChange({ ...config, appUiScale: 'compact' });
                      setShowDisplayDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      (config.appUiScale || 'standard') === 'compact'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        Nhỏ: 14px — Dòng 1.35.
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Gọn gàng, tối ưu hiển thị nhiều nội dung
                      </div>
                    </div>
                    {(config.appUiScale || 'standard') === 'compact' && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  {/* Lựa chọn 2: Vừa */}
                  <button
                    type="button"
                    onClick={() => {
                      onConfigChange({ ...config, appUiScale: 'standard' });
                      setShowDisplayDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      (config.appUiScale || 'standard') === 'standard'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        Vừa: 16px — Dòng 1.5
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Cân đối, chuẩn thị giác, dễ đọc trên mọi thiết bị
                      </div>
                    </div>
                    {(config.appUiScale || 'standard') === 'standard' && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>

                  {/* Lựa chọn 3: Lớn */}
                  <button
                    type="button"
                    onClick={() => {
                      onConfigChange({ ...config, appUiScale: 'relaxed' });
                      setShowDisplayDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      (config.appUiScale || 'standard') === 'relaxed'
                        ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        Lớn: 18px — Dòng 1.65.
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        Chữ to, khoảng cách dòng rộng rãi, thoáng mắt
                      </div>
                    </div>
                    {(config.appUiScale || 'standard') === 'relaxed' && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block"></div>

          {/* Standalone HTML Download */}
          <button
            onClick={onDownloadStandalone}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer"
            title="Tải về file HTML độc lập chạy offline không cần mạng"
          >
            <Download className="h-4.5 w-4.5" />
          </button>

          {/* Reset Defaults */}
          <button
            onClick={onResetDefaults}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shrink-0 cursor-pointer"
            title="Khôi phục cấu hình mặc định"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
