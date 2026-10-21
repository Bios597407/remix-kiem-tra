import React, { useState } from 'react';
import { ChuDeItem, CauItem, LuatConfig, NangLucItem } from '../types/exam';
import OfficialMatrixTable from './OfficialMatrixTable';
import OfficialSpecificationTable from './OfficialSpecificationTable';
import MatrixAuditBar from './MatrixAuditBar';
import TestDashboardModal from './TestDashboardModal';
import { runCv7991Audit } from '../utils/cv7991Audit';
import { Eye, Edit2, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

interface InteractiveMatrixDashboardProps {
  chuDeList: ChuDeItem[];
  cauList: CauItem[];
  luat: LuatConfig;
  activeCompetencies?: NangLucItem[];
  grade: string;
  subject: string;
  onUpdateCauList?: (updatedCau: CauItem[]) => void;
  className?: string;
}

export const InteractiveMatrixDashboard: React.FC<InteractiveMatrixDashboardProps> = ({
  chuDeList,
  cauList,
  luat,
  activeCompetencies,
  grade,
  subject,
  onUpdateCauList,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'spec' | 'cau' | 'audit'>('matrix');
  const [showTestModal, setShowTestModal] = useState(false);

  const auditReport = runCv7991Audit(chuDeList, cauList, luat, { grade, subject });

  const handleUpdateCauItem = (index: number, field: keyof CauItem, value: any) => {
    if (!onUpdateCauList) return;
    const updated = [...cauList];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateCauList(updated);
  };

  return (
    <div className={`space-y-6 ${className}`}>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'matrix'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Ma trận Đề kiểm tra
          </button>
          <button
            onClick={() => setActiveTab('spec')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeTab === 'spec'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Bản đặc tả Đề kiểm tra
          </button>
          <button
            onClick={() => setActiveTab('cau')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'cau'
                ? 'bg-white text-indigo-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bảng danh sách câu ({cauList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'audit'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Khung kiểm tra Audit (K1–K15)</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        {activeTab === 'matrix' && (
          <OfficialMatrixTable
            chuDeList={chuDeList}
            cauList={cauList}
            luat={luat}
            activeCompetencies={activeCompetencies}
          />
        )}

        {activeTab === 'spec' && (
          <OfficialSpecificationTable
            chuDeList={chuDeList}
            cauList={cauList}
            luat={luat}
            activeCompetencies={activeCompetencies}
          />
        )}

        {activeTab === 'cau' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm uppercase text-slate-900">
                  Bảng danh sách câu "cau" (Nguồn số liệu duy nhất)
                </h3>
                <p className="text-xs text-slate-500">
                  Giáo viên có thể chỉnh sửa tay Dạng, Mức nhận thức hoặc Điểm số của từng câu. Mọi bảng ma trận, đặc tả và kết quả kiểm tra Audit sẽ tự động tính lại lập tức!
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                    <th className="p-2 w-16 text-center border-r">Mã câu</th>
                    <th className="p-2 min-w-[140px] border-r">Dạng câu</th>
                    <th className="p-2 w-28 border-r">Mức nhận thức</th>
                    <th className="p-2 w-20 border-r text-center">Điểm</th>
                    <th className="p-2 min-w-[120px] border-r">Mã YCCĐ</th>
                    <th className="p-2 min-w-[160px]">Nguồn tài liệu trích dẫn</th>
                  </tr>
                </thead>
                <tbody>
                  {cauList.map((c, idx) => (
                    <tr key={c.id || idx} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-blue-900 text-center border-r">
                        {c.id}
                      </td>
                      <td className="p-2 border-r">
                        <select
                          value={c.dang}
                          onChange={(e) => handleUpdateCauItem(idx, 'dang', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 font-bold text-slate-800"
                        >
                          <option value="NLC">Nhiều lựa chọn (NLC)</option>
                          <option value="DS">Đúng – Sai (DS)</option>
                          <option value="TLN">Trả lời ngắn (TLN)</option>
                          <option value="TL">Tự luận (TL)</option>
                        </select>
                      </td>
                      <td className="p-2 border-r">
                        <select
                          value={c.muc}
                          onChange={(e) => handleUpdateCauItem(idx, 'muc', e.target.value)}
                          className="w-full border border-slate-300 rounded p-1 font-bold text-slate-800"
                        >
                          <option value="Biet">Biết</option>
                          <option value="Hieu">Hiểu</option>
                          <option value="VanDung">Vận dụng</option>
                        </select>
                      </td>
                      <td className="p-2 border-r text-center">
                        <input
                          type="number"
                          step="0.05"
                          value={c.diem}
                          onChange={(e) => handleUpdateCauItem(idx, 'diem', Number(e.target.value) || 0)}
                          className="w-full border border-slate-300 rounded p-1 text-center font-bold"
                        />
                      </td>
                      <td className="p-2 font-mono text-[10px] border-r">
                        {c.maYCCD?.join(', ') || '—'}
                      </td>
                      <td className="p-2 text-[10px] text-slate-600">
                        <input
                          type="text"
                          value={c.nguon || ''}
                          onChange={(e) => handleUpdateCauItem(idx, 'nguon', e.target.value)}
                          placeholder="Nhập trích dẫn nguồn..."
                          className="w-full border border-slate-300 rounded p-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-slate-900">
              Khung kiểm tra Audit Chi Tiết (15 Tiêu chí K1–K15)
            </h3>
            <div className="space-y-2">
              {auditReport.checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-3 rounded-lg border text-xs ${
                    check.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {check.id}. {check.ten}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        check.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {check.passed ? 'ĐẠT' : 'LỖI'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{check.details}</p>
                  <div className="text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-200/60">
                    Phép tính: {check.formula} | Nguồn: {check.sourceLabel}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Test Dashboard Modal */}
      <TestDashboardModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />
    </div>
  );
};

export default InteractiveMatrixDashboard;
