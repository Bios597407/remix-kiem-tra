import React from 'react';

interface MathToolbarProps {
  onInsert: (snippet: string) => void;
}

export const MathToolbar: React.FC<MathToolbarProps> = ({ onInsert }) => {
  const symbols = [
    { label: 'a/b', insert: '$\\frac{a}{b}$', desc: 'Phân số' },
    { label: '√x', insert: '$\\sqrt{x}$', desc: 'Căn bậc hai' },
    { label: 'x²', insert: '$x^2$', desc: 'Số mũ' },
    { label: 'x₁', insert: '$x_1$', desc: 'Chỉ số dưới' },
    { label: 'π', insert: '$\\pi$', desc: 'Số Pi' },
    { label: '≤', insert: '$\\le$', desc: 'Nhỏ hơn hoặc bằng' },
    { label: '≥', insert: '$\\ge$', desc: 'Lớn hơn hoặc bằng' },
    { label: '≠', insert: '$\\ne$', desc: 'Khác' },
    { label: '±', insert: '$\\pm$', desc: 'Cộng trừ' },
    { label: 'Δ', insert: '$\\Delta$', desc: 'Delta' },
    { label: '∫', insert: '$\\int f(x)dx$', desc: 'Tích phân' },
    { label: '∈', insert: '$\\in$', desc: 'Thuộc' },
    { label: '∞', insert: '$\\infty$', desc: 'Vô cực' },
    { label: '°', insert: '$^\\circ$', desc: 'Độ' },
    { label: '<u>_</u>', insert: '<u>chữ gạch chân</u>', desc: 'Gạch chân phát âm (Tiếng Anh)' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
      <span className="text-[10px] font-bold text-slate-500 uppercase px-1">Chèn nhanh:</span>
      {symbols.map((s, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onInsert(s.insert)}
          title={s.desc}
          className="px-2 py-0.5 rounded bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 text-slate-700 hover:text-blue-700 font-serif font-bold text-xs transition"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default MathToolbar;
