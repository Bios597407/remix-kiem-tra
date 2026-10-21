import React from 'react';
import { LuatConfig, NangLucItem } from '../types/exam';
import { PRESETS } from '../utils/cv7991Engine';
import { Sparkles, Sliders, Info, Plus, Trash2 } from 'lucide-react';

interface LuatConfigFormProps {
  luat: LuatConfig;
  nangLucList: NangLucItem[];
  onChangeLuat: (updated: LuatConfig) => void;
  onChangeNangLuc: (updated: NangLucItem[]) => void;
  className?: string;
}

export const LuatConfigForm: React.FC<LuatConfigFormProps> = ({
  luat,
  nangLucList,
  onChangeLuat,
  onChangeNangLuc,
  className = '',
}) => {
  const handleSelectPreset = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      onChangeLuat({
        ...PRESETS[presetKey].luat,
      });
    }
  };

  const handleAddNangLuc = () => {
    onChangeNangLuc([
      ...nangLucList,
      { ten: 'Năng lực tư duy', viettat: `NL${nangLucList.length + 1}` },
    ]);
  };

  const handleUpdateNangLuc = (index: number, field: keyof NangLucItem, value: string) => {
    const updated = [...nangLucList];
    updated[index] = { ...updated[index], [field]: value };
    onChangeNangLuc(updated);
  };

  const handleRemoveNangLuc = (index: number) => {
    onChangeNangLuc(nangLucList.filter((_, i) => i !== index));
  };

  return (
    <div className={`space-y-5 bg-slate-50 border border-slate-200 p-4 rounded-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
            Cấu trúc Đề thi & Tham số "luat" (Chỉnh sửa được)
          </h3>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-slate-700">
          Chọn Preset cấu trúc đề mẫu (1-Click):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPreset(key)}
              className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                luat.presetName === key
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs">{p.label}</span>
                {p.tag && (
                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium ${
                      p.tag.includes('Phụ lục')
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : p.tag.includes('Suy từ')
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.tag}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of parameters with Source badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Multiple Choice NLC */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">1. Nhiều lựa chọn (NLC)</span>
            <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              Tổ/trường tự chọn
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Số câu:</label>
              <input
                type="number"
                min="0"
                max="50"
                value={luat.nlcCount}
                onChange={(e) => onChangeLuat({ ...luat, nlcCount: Number(e.target.value) || 0, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Đơn giá (đ):</label>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="2.0"
                value={luat.nlcPrice}
                onChange={(e) => onChangeLuat({ ...luat, nlcPrice: Number(e.target.value) || 0.25, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-blue-700">
            Thành tiền: {(luat.nlcCount * luat.nlcPrice).toFixed(2).replace('.', ',')} điểm
          </p>
        </div>

        {/* 2. True-False DS */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">2. Đúng – Sai (DS)</span>
            <span className="text-[9.5px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
              Phụ lục CV 7991
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Số câu lớn:</label>
              <input
                type="number"
                min="0"
                max="20"
                value={luat.dsCount}
                onChange={(e) => onChangeLuat({ ...luat, dsCount: Number(e.target.value) || 0, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Số ý/câu:</label>
              <input
                type="number"
                min="1"
                max="8"
                value={luat.dsSubItems || 4}
                onChange={(e) => onChangeLuat({ ...luat, dsSubItems: Number(e.target.value) || 4, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Đơn giá/ý:</label>
              <input
                type="number"
                step="0.05"
                value={luat.dsPricePerSub}
                onChange={(e) => onChangeLuat({ ...luat, dsPricePerSub: Number(e.target.value) || 0.25, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-blue-700">
            Thành tiền: {(luat.dsCount * (luat.dsSubItems || 4) * luat.dsPricePerSub).toFixed(2).replace('.', ',')} điểm
          </p>
        </div>

        {/* 3. Short Answer TLN */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">3. Trả lời ngắn (TLN)</span>
            <span className="text-[9.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
              Tổ/trường tự chọn
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Số câu:</label>
              <input
                type="number"
                min="0"
                max="20"
                value={luat.tlnCount}
                onChange={(e) => onChangeLuat({ ...luat, tlnCount: Number(e.target.value) || 0, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Đơn giá (đ):</label>
              <input
                type="number"
                step="0.05"
                value={luat.tlnPrice}
                onChange={(e) => onChangeLuat({ ...luat, tlnPrice: Number(e.target.value) || 0.5, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-blue-700">
            {luat.tlnCount === 0 ? 'Không sử dụng (0,0đ)' : `Thành tiền: ${(luat.tlnCount * luat.tlnPrice).toFixed(2).replace('.', ',')} điểm`}
          </p>
        </div>

        {/* 4. Essay TL */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">4. Tự luận (TL)</span>
            <span className="text-[9.5px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
              Suy từ mẫu
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Số lượng:</label>
              <input
                type="number"
                min="0"
                max="20"
                value={luat.tlCount}
                onChange={(e) => onChangeLuat({ ...luat, tlCount: Number(e.target.value) || 0, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Đơn vị:</label>
              <select
                value={luat.tlUnit}
                onChange={(e) => onChangeLuat({ ...luat, tlUnit: e.target.value as 'cau' | 'y', presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-semibold text-slate-900 text-center"
              >
                <option value="cau">câu</option>
                <option value="y">ý</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold">Đơn giá:</label>
              <input
                type="number"
                step="0.25"
                value={luat.tlPrice}
                onChange={(e) => onChangeLuat({ ...luat, tlPrice: Number(e.target.value) || 1.0, presetName: 'custom' })}
                className="w-full border border-slate-300 rounded p-1 font-bold text-slate-900 text-center"
              />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-blue-700">
            Thành tiền: {(luat.tlCount * luat.tlPrice).toFixed(2).replace('.', ',')} điểm
          </p>
        </div>
      </div>

      {/* Target Cognitive Level Scores */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">
            Mục tiêu Tỉ lệ Điểm theo Mức độ nhận thức (Biết / Hiểu / Vận dụng):
          </span>
          <span className="text-[9.5px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
            Suy từ mẫu CV 7991
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">Biết (đ):</label>
            <input
              type="number"
              step="0.5"
              value={luat.bietTarget}
              onChange={(e) => onChangeLuat({ ...luat, bietTarget: Number(e.target.value) || 4.0, presetName: 'custom' })}
              className="w-full border border-slate-300 rounded p-1 text-center font-bold text-blue-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">Hiểu (đ):</label>
            <input
              type="number"
              step="0.5"
              value={luat.hieuTarget}
              onChange={(e) => onChangeLuat({ ...luat, hieuTarget: Number(e.target.value) || 3.0, presetName: 'custom' })}
              className="w-full border border-slate-300 rounded p-1 text-center font-bold text-blue-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">Vận dụng (đ):</label>
            <input
              type="number"
              step="0.5"
              value={luat.vanDungTarget}
              onChange={(e) => onChangeLuat({ ...luat, vanDungTarget: Number(e.target.value) || 3.0, presetName: 'custom' })}
              className="w-full border border-slate-300 rounded p-1 text-center font-bold text-blue-900"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-semibold">Dung sai (±đ):</label>
            <input
              type="number"
              step="0.1"
              value={luat.tolerance}
              onChange={(e) => onChangeLuat({ ...luat, tolerance: Number(e.target.value) || 0, presetName: 'custom' })}
              className="w-full border border-slate-300 rounded p-1 text-center font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Competency Table Section */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900">Bảng Năng lực môn học (Tùy chọn ký hiệu NL?):</span>
            <p className="text-[10px] text-slate-500">Người dùng tự nhập danh sách tên năng lực và chữ viết tắt ký hiệu.</p>
          </div>
          <button
            type="button"
            onClick={handleAddNangLuc}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[11px] border border-indigo-200 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Năng Lực
          </button>
        </div>

        {nangLucList.length === 0 ? (
          <p className="text-[11px] text-slate-400 italic">Chưa nhập bảng năng lực (ô đặc tả sẽ hiển thị YCCĐ nguyên văn).</p>
        ) : (
          <div className="space-y-1.5">
            {nangLucList.map((nl, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nl.ten}
                  onChange={(e) => handleUpdateNangLuc(idx, 'ten', e.target.value)}
                  placeholder="Tên năng lực..."
                  className="flex-1 border border-slate-300 rounded p-1 text-[11px]"
                />
                <input
                  type="text"
                  value={nl.viettat}
                  onChange={(e) => handleUpdateNangLuc(idx, 'viettat', e.target.value)}
                  placeholder="Viết tắt (VD: TD1)..."
                  className="w-24 border border-slate-300 rounded p-1 text-[11px] font-mono font-bold text-center"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNangLuc(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Presentation Options */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
        <span className="font-bold text-slate-900">Tùy chọn trình bày bảng:</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!luat.showQuestionColInSpec}
              onChange={(e) => onChangeLuat({ ...luat, showQuestionColInSpec: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>Hiện cột "Câu" trong Bản đặc tả (Mặc định: Tắt)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!luat.showTlnColumnsIfZero}
              onChange={(e) => onChangeLuat({ ...luat, showTlnColumnsIfZero: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <span>Hiện nhóm cột "Trả lời ngắn" trống khi số câu = 0</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default LuatConfigForm;
