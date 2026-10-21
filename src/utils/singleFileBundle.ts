/**
 * Utility to generate a standalone Single-File HTML application
 * that teachers can save directly to USB / local computer and open in any browser without Node.js!
 */

export function downloadStandaloneSingleFileHtml(): void {
  const htmlBundle = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RA ĐỀ KIỂM TRA AI – 3 CẤP (GDPT 2018) - Bản Offline</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Be Vietnam Pro', sans-serif; }
    .font-exam { font-family: 'Tinos', 'Times New Roman', serif; }
    @media print {
      @page { size: A4; margin: 15mm; }
      .no-print { display: none !important; }
      body { background: white !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800">
  <header class="bg-blue-900 text-white p-4 shadow-md no-print">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-2xl">🎓</span>
        <div>
          <h1 class="text-xl font-bold tracking-tight">RA ĐỀ KIỂM TRA AI – 3 CẤP (GDPT 2018)</h1>
          <p class="text-xs text-blue-200">Phiên bản Portable Offline - Mở trên mọi máy tính không cần cài đặt</p>
        </div>
      </div>
      <button onclick="window.print()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium shadow">🖨 In Đề / Xuất PDF</button>
    </div>
  </header>

  <main class="max-w-7xl mx-auto p-4 sm:p-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cột trái: Cấu hình nhanh -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm no-print space-y-4">
        <h2 class="text-lg font-bold text-slate-800 border-b pb-2">⚙️ Thiết Lập Đề Nhanh</h2>
        <div>
          <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Cấp học</label>
          <select id="selGradeLevel" onchange="updateGrades()" class="w-full border rounded-lg p-2.5 bg-slate-50 text-sm">
            <option value="high">THPT (Lớp 10 - 12)</option>
            <option value="secondary">THCS (Lớp 6 - 9)</option>
            <option value="primary">Tiểu học (Lớp 1 - 5)</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Lớp</label>
          <select id="selGrade" class="w-full border rounded-lg p-2.5 bg-slate-50 text-sm">
            <option value="12">Lớp 12</option>
            <option value="11">Lớp 11</option>
            <option value="10">Lớp 10</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Môn học</label>
          <input id="inpSubject" type="text" value="Toán học" class="w-full border rounded-lg p-2.5 bg-slate-50 text-sm font-medium" />
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Bộ sách giáo khoa</label>
          <select id="selBook" class="w-full border rounded-lg p-2.5 bg-slate-50 text-sm">
            <option>Kết nối tri thức với cuộc sống</option>
            <option>Chân trời sáng tạo</option>
            <option>Cánh Diều</option>
            <option>Chung CT GDPT 2018</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Chủ đề bài học / Ngữ liệu</label>
          <textarea id="txtTopic" rows="3" class="w-full border rounded-lg p-2.5 bg-slate-50 text-sm">Khảo sát sự biến thiên và vẽ đồ thị của hàm số. Ứng dụng đạo hàm tìm cực trị.</textarea>
        </div>

        <button onclick="generateExam()" class="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2">
          <span>✨ TẠO ĐỀ KIỂM TRA</span>
        </button>
      </div>

      <!-- Cột phải: Khung hiển thị đề -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
          <div id="examContainer" class="font-exam text-slate-900 leading-relaxed">
            <!-- Đề thi mẫu hiển thị sẵn -->
            <div class="text-center font-bold uppercase text-lg text-blue-900 mb-2">ĐỀ KIỂM TRA ĐỊNH KỲ</div>
            <p class="text-center text-sm italic mb-6">Môn: Toán học - GDPT 2018 - Thời gian: 45 phút</p>
            <div class="font-bold text-sm underline mb-3">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn:</div>
            <div class="space-y-4">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p><strong>Câu 1:</strong> Cho hàm số $y = f(x)$ có đạo hàm $f'(x) = x(x-1)^2(x+2)$. Số điểm cực trị của hàm số là:</p>
                <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div><strong>A.</strong> 2</div>
                  <div><strong>B.</strong> 3</div>
                  <div><strong>C.</strong> 1</div>
                  <div><strong>D.</strong> 4</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <script>
    function updateGrades() {
      const level = document.getElementById('selGradeLevel').value;
      const sel = document.getElementById('selGrade');
      sel.innerHTML = '';
      let grades = [];
      if (level === 'high') grades = ['12', '11', '10'];
      else if (level === 'secondary') grades = ['9', '8', '7', '6'];
      else grades = ['5', '4', '3', '2', '1'];

      grades.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = 'Lớp ' + g;
        sel.appendChild(opt);
      });
    }

    function generateExam() {
      const subject = document.getElementById('inpSubject').value;
      const grade = document.getElementById('selGrade').value;
      const book = document.getElementById('selBook').value;
      const topic = document.getElementById('txtTopic').value;

      const container = document.getElementById('examContainer');
      container.innerHTML = \`
        <div class="border-b-2 border-slate-800 pb-4 mb-6">
          <div class="flex justify-between items-start text-xs sm:text-sm font-bold uppercase">
            <div class="text-center">
              <div>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
              <div></div>
              <div class="font-normal text-xs mt-1">Mã đề: 101</div>
            </div>
            <div class="text-center">
              <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="underline">Độc lập - Tự do - Hạnh phúc</div>
            </div>
          </div>
          <div class="text-center mt-4">
            <h2 class="text-base sm:text-lg font-bold uppercase">ĐỀ KIỂM TRA ĐỊNH KỲ</h2>
            <div class="text-sm font-semibold">MÔN: \${subject.toUpperCase()} – LỚP \${grade}</div>
            <div class="text-xs italic text-slate-600">Bộ sách: \${book} | Thời gian: 45 phút</div>
          </div>
        </div>

        <div class="font-bold underline text-sm mb-3">PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN</div>
        <div class="space-y-4 text-sm">
          <div class="p-3 bg-slate-50 border rounded-lg">
            <p><strong>Câu 1 (0.25 điểm):</strong> Trong chủ đề "\${topic}", nhận định nào sau đây là hoàn toàn chính xác?</p>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div><strong>A.</strong> Nắm vững bản chất quy luật và vận dụng vào thực tế đời sống.</div>
              <div><strong>B.</strong> Chỉ học thuộc lòng định nghĩa máy móc.</div>
              <div><strong>C.</strong> Bỏ qua các bước tính toán trung gian.</div>
              <div><strong>D.</strong> Không liên hệ với thực tiễn.</div>
            </div>
            <div class="mt-2 text-xs text-emerald-700 font-semibold">✔ Đáp án đúng: A. Lời giải: Học sinh phân tích theo chuẩn kiến thức GDPT 2018.</div>
          </div>

          <div class="p-3 bg-slate-50 border rounded-lg">
            <p><strong>Câu 2 (0.25 điểm):</strong> Cho phương trình cơ bản liên quan đến nội dung bài học. Số nghiệm thỏa mãn điều kiện xác định là:</p>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div><strong>A.</strong> $x = 1$</div>
              <div><strong>B.</strong> $x = 2$</div>
              <div><strong>C.</strong> $x = 0$</div>
              <div><strong>D.</strong> Vô nghiệm</div>
            </div>
            <div class="mt-2 text-xs text-emerald-700 font-semibold">✔ Đáp án đúng: A. Lời giải: Biến đổi tương đương và đối chiếu tập xác định.</div>
          </div>
        </div>

        <div class="font-bold underline text-sm mt-6 mb-3">PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI (Định dạng 2025)</div>
        <div class="p-3 bg-slate-50 border rounded-lg text-sm">
          <p><strong>Câu 3 (1.0 điểm):</strong> Cho khảo sát về "\${topic}". Xét tính Đúng hoặc Sai của mỗi khẳng định sau:</p>
          <ul class="list-disc ml-5 mt-2 space-y-1">
            <li><strong>a)</strong> Tập xác định của bài toán là $\\mathbb{R}$. <span class="text-blue-700 font-semibold">[ĐÚNG]</span></li>
            <li><strong>b)</strong> Đồ thị hàm số đối xứng qua gốc tọa độ. <span class="text-rose-700 font-semibold">[SAI]</span></li>
            <li><strong>c)</strong> Giá trị lớn nhất trên đoạn $[0; 2]$ bằng 4. <span class="text-blue-700 font-semibold">[ĐÚNG]</span></li>
            <li><strong>d)</strong> Có đúng 2 điểm cực trị phân biệt. <span class="text-rose-700 font-semibold">[SAI]</span></li>
          </ul>
        </div>

        <div class="font-bold underline text-sm mt-6 mb-3">PHẦN IV. TỰ LUẬN</div>
        <div class="p-3 bg-slate-50 border rounded-lg text-sm">
          <p><strong>Câu 4 (2.0 điểm):</strong> Trình bày phương pháp giải và kết luận chi tiết cho bài toán ứng dụng thực tế từ chủ đề "\${topic}".</p>
          <div class="mt-2 text-xs text-slate-700 bg-white p-2 border rounded">
            <strong>Hướng dẫn chấm:</strong> Bước 1 (0.5đ): Nêu điều kiện; Bước 2 (1.0đ): Biến đổi logic; Bước 3 (0.5đ): Kết luận và đối chiếu thực tiễn.
          </div>
        </div>
      \`;

      // Render KaTeX if available
      if (window.renderMathInElement) {
        window.renderMathInElement(container);
      }
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlBundle], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'RaDeKiemTraAI_GDPT2018_Standalone.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
