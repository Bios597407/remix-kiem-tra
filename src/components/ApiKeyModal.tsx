import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { useToast } from './Toast';
import { translateErrorToVietnamese } from '../services/aiGenerator';
import { FALLBACK_MODELS, DEFAULT_MODEL } from '../utils/geminiModels';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const toast = useToast();
  const [inputKey, setInputKey] = useState(apiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey, isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const keyToTest =
      inputKey.trim() ||
      (import.meta.env.VITE_GEMINI_API_KEY as string)?.trim() ||
      (typeof process !== 'undefined' ? (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY) : '') ||
      '';

    if (!keyToTest) {
      setTestResult({
        success: false,
        msg: 'Chưa có API Key để kiểm tra. Vui lòng dán Gemini API Key lấy từ Google AI Studio (aistudio.google.com) vào ô bên trên.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    const MODEL_CANDIDATES = Array.from(new Set([DEFAULT_MODEL, ...FALLBACK_MODELS]));


    let lastErrorMsg = '';
    let successModel = '';

    for (const modelName of MODEL_CANDIDATES) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${keyToTest}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Trả về: OK' }] }],
          }),
        });

        if (res.ok) {
          successModel = modelName;
          break;
        } else {
          const errData = await res.json().catch(() => ({}));
          const errText = errData.error?.message || `Lỗi HTTP ${res.status}`;
          lastErrorMsg = errText;

          // Chỉ dừng hẳn nếu sai API Key (400/403), còn lỗi 404/429/503 thì tự thử tiếp model dự phòng
          if (res.status === 400 && errText.toLowerCase().includes('api key not valid')) {
            break;
          }
          continue;
        }
      } catch (err: unknown) {
        lastErrorMsg = err instanceof Error ? err.message : String(err);
      }
    }

    if (successModel) {
      setTestResult({
        success: true,
        msg: `Kết nối thành công tới Gemini AI (Mô hình ${successModel})! Hệ thống đã sẵn sàng tạo đề thi thật 100%.`,
      });
    } else {
      setTestResult({
        success: false,
        msg: `Kiểm tra thất bại: ${translateErrorToVietnamese(lastErrorMsg)}`,
      });
    }

    setTesting(false);
  };

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    toast.success('Đã lưu cấu hình Gemini API Key!');
    onClose();
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
    setTestResult(null);
    toast.info('Đã xóa API Key. Hệ thống tự động sử dụng kết nối Gemini AI mặc định của Google AI Studio.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Key className="h-5 w-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Cấu hình Gemini API Key</h3>
              <p className="text-xs text-slate-500">Google Generative Language API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5"/>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Google Gemini API Key (Không bắt buộc)
            </label>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Để trống nếu muốn dùng kết nối mặc định AI Studio..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm font-mono focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Bạn có thể nhập Key cá nhân hoặc để trống để sử dụng kết nối mặc định của hệ thống.
            </p>
          </div>

          <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center font-semibold text-blue-800 space-x-1.5">
              <Sparkles className="h-4 w-4"/>
              <span>Kết nối Gemini AI ({DEFAULT_MODEL}):</span>
            </div>
            <p>
              • Khi bạn nhập Key cá nhân: Hệ thống sử dụng Key của bạn để tạo đề thi.
            </p>
            <p>
              • Khi bấm "Xóa Key" hoặc để trống: Hệ thống tự động sử dụng kết nối mặc định từ Google AI Studio để tạo đề thật 100%.
            </p>
          </div>

          {testResult && (
            <div
              className={`rounded-lg p-3 text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5"/>
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5"/>
              )}
              <span>{testResult.msg}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
            </button>

            <div className="flex items-center space-x-2">
              {inputKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-rose-600"
                >
                  Xóa Key
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;