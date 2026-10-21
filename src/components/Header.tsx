import React, { useState } from 'react';
import { Sparkles, Key, Download, Database, RotateCcw, History, Settings, ChevronDown, Trash2 } from 'lucide-react';
import { ExamConfig } from '../types/exam';

interface HeaderProps {
  onOpenApiKey: () => void;
  onOpenQuestionBank: () => void;
  onOpenHistory: () => void;
  onResetDefaults: () => void;
  onDownloadStandalone: () => void;
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
  onClearOldContent,
  savedBankCount,
  historyCount,
  hasApiKey,
  config,
  onConfigChange,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);
  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg shadow-sm">
      <div className="mx-auto flex max-w-[1720px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3 group cursor-default">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white shadow-lg group-hover:shadow-blue-200 transition-all duration-300">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                RA ĐỀ KIỂM TRA <span className="text-blue-600">AI</span>
              </h1>
              <span className="hidden rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-800 uppercase tracking-wider md:inline-block">
                GDPT 2018
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 tracking-tight">
              HỆ THỐNG RA ĐỀ KIỂM TRA ĐỊNH KÌ (MẪU THAM KHẢO CV 7991)
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2.5">
          {/* History */}
          <button
            onClick={onOpenHistory}
            className="group flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-xs"
            title="Lịch sử các đề thi đã tạo"
          >
            <History className="h-4 w-4 text-indigo-500 group-hover:rotate-[-10deg] transition-transform" />
            <span className="hidden lg:inline">Lịch sử</span>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black text-indigo-700">
              {historyCount}
            </span>
          </button>

          {/* Bank */}
          <button
            onClick={onOpenQuestionBank}
            className="group flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-700 transition-all shadow-xs"
            title="Ngân hàng câu hỏi cá nhân"
          >
            <Database className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline">Ngân hàng</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-700">
              {savedBankCount}
            </span>
          </button>

          {/* Gemini API Key */}
          <button
            onClick={onOpenApiKey}
            className={`flex items-center space-x-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
              hasApiKey
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-300'
            }`}
          >
            <Key className={`h-4 w-4 ${hasApiKey ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="hidden md:inline">{hasApiKey ? 'Gemini AI: Connected' : 'Cấu hình AI'}</span>
            {!hasApiKey && <span className="md:hidden">Cấu hình AI</span>}
          </button>

          {/* 1 Nút bấm duy nhất: Xóa toàn bộ nội dung bài cũ */}
          {onClearOldContent && (
            <button
              type="button"
              onClick={onClearOldContent}
              className="flex items-center space-x-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-600 hover:text-white hover:border-rose-600 px-3 py-2 text-xs font-black text-rose-700 transition-all shadow-xs cursor-pointer group"
              title="1 Nút bấm duy nhất: Xóa toàn bộ nội dung bài cũ (tên bài, chương, yêu cầu cần đạt, ngữ liệu, file tải lên, câu hỏi cũ) trước khi nạp bài mới"
            >
              <Trash2 className="h-4 w-4 text-rose-600 group-hover:text-white transition-colors" />
              <span className="hidden md:inline">Xóa toàn bộ bài cũ</span>
              <span className="md:hidden">Xóa bài cũ</span>
            </button>
          )}

          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Standalone HTML */}
          <button
            onClick={onDownloadStandalone}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            title="Tải về file HTML độc lập chạy offline không cần mạng"
          >
            <Download className="h-5 w-5" />
          </button>

          {/* Direct 3-Mode Font Size Quick Selector */}
          <div className="hidden sm:flex items-center space-x-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-slate-500 px-2">Cỡ chữ:</span>
            {[
              { id: 'compact', label: 'Nhỏ', desc: '16px - dòng 1.35' },
              { id: 'standard', label: 'Vừa', desc: '18px - dòng 1.5' },
              { id: 'relaxed', label: 'Lớn', desc: '20px - dòng 1.65' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => onConfigChange({ ...config, appUiScale: s.id as any })}
                title={`${s.label}: ${s.desc}`}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (config.appUiScale || 'standard') === s.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-blue-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Settings / Global UI Scale Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex h-10 px-3 items-center justify-center space-x-1.5 rounded-xl border transition-all shadow-sm ${
                showSettings ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
              title="Cài đặt hiển thị & Kích thước hệ thống"
            >
              <Settings className={`h-4 w-4 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-tight">Cài đặt</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>

            {showSettings && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)}></div>
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="text-[11px] font-black uppercase text-slate-500 mb-3 tracking-widest">
                    Hiển thị & Kích thước chữ toàn ứng dụng
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'compact', label: 'Cỡ chữ nhỏ', desc: '16px - dòng 1.35' },
                      { id: 'standard', label: 'Cỡ chữ tiêu chuẩn', desc: '18px - dòng 1.5' },
                      { id: 'relaxed', label: 'Cỡ chữ lớn', desc: '20px - dòng 1.65' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          onConfigChange({ ...config, appUiScale: s.id as any });
                          setShowSettings(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all group cursor-pointer ${
                          (config.appUiScale || 'standard') === s.id 
                            ? 'border-blue-600 bg-blue-50/70' 
                            : 'border-transparent bg-slate-50 hover:bg-white hover:border-slate-200'
                        }`}
                      >
                        <div className={`text-xs font-black uppercase ${ (config.appUiScale || 'standard') === s.id ? 'text-blue-700' : 'text-slate-700'}`}>
                          {s.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset */}
          <button
            onClick={onResetDefaults}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
            title="Khôi phục cấu hình mặc định"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
