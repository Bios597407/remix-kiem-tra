import React, { useState } from 'react';
import { X, Play, CheckCircle2, XCircle, Terminal, RefreshCw } from 'lucide-react';
import { runFullCv7991TestSuite, FullTestSuiteResult } from '../tests/cv7991TestRunner';

interface TestDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestDashboardModal: React.FC<TestDashboardModalProps> = ({ isOpen, onClose }) => {
  const [testResult, setTestResult] = useState<FullTestSuiteResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const result = runFullCv7991TestSuite();
      setTestResult(result);
      setIsRunning(false);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-bold text-base uppercase tracking-wider text-slate-100">
                BỘ KIỂM THỬ TỰ ĐỘNG BẢO ĐẢM SỐ LIỆU (6 NHÓM TEST - P1, P2, P3)
              </h2>
              <p className="text-xs text-slate-400">
                Chạy kiểm thử trực tiếp: Thích ứng 5 đầu vào, Reference Fixture (ND1–ND3), 1000 Random Configs, Điểm biên, Hồi quy 7b & Soạn câu hỏi AI / Khóa xuất file.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-indigo-900 text-sm">Chạy Bộ Kiểm Thử Tự Động (Automation Runner)</p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Xác minh thực tế các thuật toán tính toán, ma trận phân bổ, quy tắc kiểm tra audit và khả năng cách ly dữ liệu.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-lg shadow transition text-xs shrink-0"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang chạy kiểm thử...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  CHẠY TOÀN BỘ 6 NHÓM TEST
                </>
              )}
            </button>
          </div>

          {!testResult && !isRunning && (
            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
              <Terminal className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Nhấn nút trên để bắt đầu chạy kiểm thử tự động</p>
            </div>
          )}

          {testResult && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                  testResult.passedAll
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                    : 'bg-rose-50 border-rose-500 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {testResult.passedAll ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-extrabold text-sm uppercase">
                      KẾT QUẢ TỔNG THỂ: {testResult.passedAll ? 'HOÀN THÀNH TẤT CẢ CÁC NHÓM KIỂM THỬ' : 'CÓ LỖI KIỂM THỬ'}
                    </span>
                    <p className="text-xs mt-0.5 opacity-90">
                      Thời gian thực thi: {new Date(testResult.timestamp).toLocaleTimeString('vi-VN')} | Đã hoàn thành 6/6 nhóm test.
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Groups */}
              <div className="space-y-3">
                {testResult.groups.map((group, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        {group.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="font-bold text-xs text-slate-900">{group.groupName}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-300">
                        {group.passedRun}/{group.totalRun} PASSED
                      </span>
                    </div>

                    <div className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] leading-relaxed space-y-1 max-h-48 overflow-y-auto">
                      <p className="text-slate-400 italic font-sans">// {group.description}</p>
                      {group.logs.map((log, lIdx) => (
                        <p key={lIdx} className={log.startsWith('✓') ? 'text-emerald-400' : log.startsWith('✗') ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {log}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestDashboardModal;
