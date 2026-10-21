import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface GenerationStepperProps {
  currentStep: number;
  message: string;
}

export const GenerationStepper: React.FC<GenerationStepperProps> = ({ currentStep, message }) => {
  const steps = [
    { num: 1, label: 'Phân tích thiết lập' },
    { num: 2, label: 'Đọc tài liệu' },
    { num: 3, label: 'Lập Ma trận & Đặc tả' },
    { num: 4, label: 'Biên soạn câu hỏi AI' },
    { num: 5, label: 'Tính biểu điểm & Thang' },
    { num: 6, label: 'HD chấm step-by-step' },
    { num: 7, label: 'Kiểm duyệt Auto-QA' },
  ];

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 animate-spin">
          <Loader2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base">Hệ thống đang xử lý quy trình 7 bước...</h3>
          <p className="text-xs text-blue-700 font-medium">{message || 'Đang tạo câu hỏi chuẩn GDPT 2018...'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {steps.map((st) => {
          const isDone = st.num < currentStep;
          const isCurrent = st.num === currentStep;

          return (
            <div
              key={st.num}
              className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : isCurrent
                  ? 'border-blue-400 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-100'
                  : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isCurrent ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white animate-pulse">
                    {st.num}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">{st.num}</span>
                )}
              </div>
              <span className="text-[11px] font-semibold leading-tight line-clamp-2">{st.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GenerationStepper;
