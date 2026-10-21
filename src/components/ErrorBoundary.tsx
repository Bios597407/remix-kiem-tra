import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear potentially corrupted local storage keys but keep config/API key if possible
    // Only clear questions which is the most likely cause of render crashes
    localStorage.removeItem('exam_ai_questions_v2');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-rose-100 rounded-full text-rose-600">
                <AlertTriangle className="h-12 w-12" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Ôi! Có lỗi xảy ra rồi</h2>
              <p className="text-slate-600 font-medium">
                Giao diện bị sập do dữ liệu trả về không tương thích hoặc lỗi xử lý bộ nhớ. 
                Đừng lo lắng, các thiết lập của bạn vẫn được an toàn.
              </p>
              {this.state.error && (
                <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left overflow-auto max-h-32">
                  <code className="text-[10px] font-mono text-slate-500 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </code>
                </div>
              )}
            </div>

            <button
              onClick={this.handleReset}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Khôi phục giao diện & Thử lại</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
