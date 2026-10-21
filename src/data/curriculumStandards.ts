/**
 * THƯ VIỆN CHƯƠNG TRÌNH GIÁO DỤC PHỔ THÔNG 2018 (BỘ GIÁO DỤC VÀ ĐÀO TẠO)
 * Cung cấp danh mục Chủ đề, Đơn vị kiến thức và Yêu cầu cần đạt (YCCĐ) chuẩn
 * phân theo 3 mức độ nhận thức: Biết (Nhận biết), Hiểu (Thông hiểu), Vận dụng
 */

export interface CurriculumOutcome {
  know: string[];      // Biết (Nhận biết)
  understand: string[];// Hiểu (Thông hiểu)
  apply: string[];     // Vận dụng (Vận dụng & Vận dụng cao)
}

export interface CurriculumTopic {
  id: string;
  chapter: string;          // Chương / Mạch nội dung (VD: "Chương I: Ứng dụng đạo hàm để khảo sát hàm số")
  topicTitle: string;       // Tên bài học / Chủ đề (VD: "Tính đơn điệu và cực trị của hàm số")
  knowledgeScope: string;   // Phạm vi kiến thức trọng tâm
  outcomes: CurriculumOutcome; // Yêu cầu cần đạt chuẩn GDPT 2018
  recommendedTimeMinutes?: number;
}

export interface SubjectCurriculum {
  subject: string;
  grade: string;
  semester: 'hk1' | 'hk2' | 'all';
  topics: CurriculumTopic[];
}

export const CURRICULUM_STANDARDS: SubjectCurriculum[] = [
  // ================= TOÁN 12 (GDPT 2018) =================
  {
    subject: 'Toán học',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'math12_c1_b1',
        chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        topicTitle: 'Tính đơn điệu và cực trị của hàm số',
        knowledgeScope: 'Khái niệm đồng biến, nghịch biến; Điều kiện cần và đủ của tính đơn điệu; Khái niệm cực trị, điểm cực trị; Dấu hiệu tìm cực trị (dấu hiệu 1 và dấu hiệu 2).',
        outcomes: {
          know: [
            'Nhận biết được tính đồng biến, nghịch biến của một hàm số trên một khoảng dựa vào dấu của đạo hàm cấp một.',
            'Nhận biết được khái niệm cực đại, cực tiểu, điểm cực trị của hàm số và điểm cực trị của đồ thị hàm số.',
            'Xác định được các khoảng đơn điệu và cực trị của hàm số thông qua bảng biến thiên hoặc đồ thị cho trước.'
          ],
          understand: [
            'Giải thích được mối liên hệ giữa dấu của đạo hàm bậc nhất và chiều biến thiên của hàm số.',
            'Phân biệt được điểm cực trị của hàm số, điểm cực trị của đồ thị hàm số và giá trị cực trị của hàm số.',
            'Tìm được các khoảng đơn điệu và cực trị của các hàm số đa thức bậc ba, hàm phân thức bậc nhất trên bậc nhất, hàm phân thức bậc hai trên bậc nhất.'
          ],
          apply: [
            'Vận dụng đạo hàm để xét tính đơn điệu và tìm cực trị của hàm số có chứa tham số đơn giản.',
            'Vận dụng tính đơn điệu và cực trị để giải quyết bài toán thực tế tối ưu hóa (tìm cực trị lớn nhất, nhỏ nhất trong kinh tế, kĩ thuật, đời sống).'
          ]
        }
      },
      {
        id: 'math12_c1_b2',
        chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        topicTitle: 'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số',
        knowledgeScope: 'Định nghĩa GTLN, GTNN trên tập xác định và trên một đoạn; Quy tắc tìm GTLN, GTNN trên một đoạn [a; b].',
        outcomes: {
          know: [
            'Nhận biết được khái niệm giá trị lớn nhất (GTLN), giá trị nhỏ nhất (GTNN) của hàm số trên một tập hợp số.',
            'Xác định được GTLN, GTNN của hàm số trên một đoạn dựa vào đồ thị hoặc bảng biến thiên.'
          ],
          understand: [
            'Giải thích được sự tồn tại của GTLN, GTNN của hàm số liên tục trên một đoạn [a; b].',
            'Thực hiện được quy tắc tính GTLN, GTNN của hàm số trên một đoạn mà không cần vẽ bảng biến thiên.'
          ],
          apply: [
            'Vận dụng đạo hàm tìm GTLN, GTNN của hàm số trên một khoảng vô hạn hoặc nửa khoảng.',
            'Giải quyết các bài toán tối ưu hóa thực tiễn liên quan đến diện tích, thể tích, chi phí sản xuất, lợi nhuận lớn nhất.'
          ]
        }
      },
      {
        id: 'math12_c1_b3',
        chapter: 'Chương I: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        topicTitle: 'Đường tiệm cận của đồ thị hàm số',
        knowledgeScope: 'Tiệm cận đứng, tiệm cận ngang, tiệm cận xiên của đồ thị hàm số.',
        outcomes: {
          know: [
            'Nhận biết được định nghĩa đường tiệm cận đứng, đường tiệm cận ngang, đường tiệm cận xiên của đồ thị hàm số thông qua giới hạn tại vô cực hoặc giới hạn một bên.',
            'Chỉ ra được số lượng và phương trình các đường tiệm cận từ bảng biến thiên hoặc đồ thị hàm số.'
          ],
          understand: [
            'Giải thích được cách tìm tiệm cận đứng, tiệm cận ngang và tiệm cận xiên của đồ thị hàm phân thức hữu tỉ.',
            'Xác định được phương trình các đường tiệm cận của đồ thị hàm số $y = \\frac{ax+b}{cx+d}$ và $y = \\frac{ax^2+bx+c}{dx+e}$.'
          ],
          apply: [
            'Vận dụng định nghĩa và giới hạn để xác định tiệm cận của đồ thị hàm số chứa căn thức hoặc tham số.',
            'Sử dụng tiệm cận để phác thảo đồ thị và biện luận sự tương giao.'
          ]
        }
      },
      {
        id: 'math12_c2_b1',
        chapter: 'Chương II: Vectơ và hệ tọa độ trong không gian',
        topicTitle: 'Vectơ trong không gian và các phép toán',
        knowledgeScope: 'Khái niệm vectơ trong không gian, quy tắc hình hộp, quy tắc ba điểm, tích vô hướng của hai vectơ.',
        outcomes: {
          know: [
            'Nhận biết được vectơ trong không gian, vectơ cùng phương, cùng hướng, hai vectơ bằng nhau, vectơ-không.',
            'Nhận biết được quy tắc ba điểm, quy tắc hình bình hành, quy tắc hình hộp trong không gian.'
          ],
          understand: [
            'Biểu diễn được một vectơ qua các vectơ không đồng phẳng trong hình chóp, hình lăng trụ, hình hộp.',
            'Tính được tích vô hướng của hai vectơ trong không gian và góc giữa hai vectơ.'
          ],
          apply: [
            'Vận dụng vectơ để chứng minh hai đường thẳng vuông góc, ba điểm thẳng hàng, bốn điểm đồng phẳng trong không gian.',
            'Vận dụng vectơ để giải bài toán cơ học, tính công của lực tác dụng trong thực tiễn không gian 3 chiều.'
          ]
        }
      },
      {
        id: 'math12_c2_b2',
        chapter: 'Chương II: Vectơ và hệ tọa độ trong không gian',
        topicTitle: 'Hệ tọa độ trong không gian Oxyz',
        knowledgeScope: 'Hệ trục tọa độ Oxyz; Tọa độ của điểm, tọa độ của vectơ; Biểu thức tọa độ của các phép toán vectơ, tích có hướng.',
        outcomes: {
          know: [
            'Nhận biết được hệ trục tọa độ Oxyz, các vectơ đơn vị $\\vec{i}, \\vec{j}, \\vec{k}$, tọa độ của một điểm và tọa độ của một vectơ.',
            'Nhớ được công thức tính độ dài vectơ, khoảng cách giữa hai điểm, tọa độ trung điểm, tọa độ trọng tâm tam giác.'
          ],
          understand: [
            'Thực hiện được các phép cộng, trừ vectơ, nhân vectơ với một số bằng tọa độ trong không gian Oxyz.',
            'Tính được tích vô hướng của hai vectơ và góc giữa hai vectơ qua tọa độ.',
            'Tính được tích có hướng của hai vectơ và ứng dụng tính diện tích tam giác, thể tích tứ diện.'
          ],
          apply: [
            'Vận dụng phương pháp tọa độ để xác định vị trí của vật thể trong không gian thực tế (định vị vệ tinh, mô hình kiến trúc).',
            'Chứng minh tính vuông góc, song song và tính khoảng cách giữa các đối tượng hình học trong không gian.'
          ]
        }
      }
    ]
  },

  // ================= TOÁN 11 (GDPT 2018) =================
  {
    subject: 'Toán học',
    grade: '11',
    semester: 'hk1',
    topics: [
      {
        id: 'math11_c1_b1',
        chapter: 'Chương I: Hàm số lượng giác và phương trình lượng giác',
        topicTitle: 'Góc lượng giác và các công thức lượng giác',
        knowledgeScope: 'Khái niệm góc lượng giác, radian, đường tròn lượng giác; Công thức cộng, công thức nhân đôi, công thức biến đổi tích thành tổng và tổng thành tích.',
        outcomes: {
          know: [
            'Nhận biết được khái niệm góc lượng giác, đơn vị đo radian và mối quan hệ giữa radian với độ.',
            'Nhận biết được giá trị lượng giác của một góc trên đường tròn lượng giác.',
            'Nhớ được các công thức lượng giác cơ bản, công thức cộng, công thức nhân đôi.'
          ],
          understand: [
            'Biểu diễn được các góc lượng giác trên đường tròn lượng giác.',
            'Sử dụng công thức lượng giác để rút gọn biểu thức và tính giá trị lượng giác của các góc đặc biệt.'
          ],
          apply: [
            'Vận dụng các công thức biến đổi lượng giác để chứng minh đẳng thức lượng giác phức tạp.',
            'Vận dụng vào giải các bài toán thực tiễn liên quan đến chuyển động tròn đều, sóng âm, chu kỳ dao động.'
          ]
        }
      },
      {
        id: 'math11_c2_b1',
        chapter: 'Chương II: Dãy số, Cấp số cộng và Cấp số nhân',
        topicTitle: 'Cấp số cộng và Cấp số nhân',
        knowledgeScope: 'Định nghĩa cấp số cộng, số hạng tổng quát, tính chất, tổng n số hạng đầu; Định nghĩa cấp số nhân, số hạng tổng quát, tổng n số hạng đầu.',
        outcomes: {
          know: [
            'Nhận biết được dãy số là một cấp số cộng hoặc cấp số nhân.',
            'Xác định được công sai $d$ của cấp số cộng và công bội $q$ của cấp số nhân.'
          ],
          understand: [
            'Tính được số hạng thứ $n$ và tổng của $n$ số hạng đầu tiên của một cấp số cộng và cấp số nhân.',
            'Giải thích được điều kiện để ba số lập thành một cấp số cộng hoặc cấp số nhân.'
          ],
          apply: [
            'Vận dụng cấp số cộng và cấp số nhân để giải quyết các bài toán lãi kép ngân hàng, bài toán tăng trưởng dân số, phân rã chất phóng xạ trong thực tế.'
          ]
        }
      }
    ]
  },

  // ================= TOÁN 10 (GDPT 2018) =================
  {
    subject: 'Toán học',
    grade: '10',
    semester: 'hk1',
    topics: [
      {
        id: 'math10_c1_b1',
        chapter: 'Chương I: Mệnh đề và Tập hợp',
        topicTitle: 'Mệnh đề toán học và các phép toán trên tập hợp',
        knowledgeScope: 'Mệnh đề, mệnh đề phủ định, mệnh đề kéo theo, mệnh đề tương đương; Kí hiệu $\\forall, \\exists$; Tập hợp, tập con, các phép giao, hợp, hiệu của hai tập hợp.',
        outcomes: {
          know: [
            'Nhận biết được mệnh đề toán học, mệnh đề chứa biến.',
            'Nhận biết được các tập hợp số tự nhiên, số nguyên, số hữu tỉ, số thực và các khoảng, đoạn trên trục số.'
          ],
          understand: [
            'Lập được mệnh đề phủ định của một mệnh đề cho trước (chứa kí hiệu $\\forall, \\exists$).',
            'Thực hiện được các phép toán giao, hợp, hiệu của hai tập hợp và biểu diễn kết quả trên trục số.'
          ],
          apply: [
            'Vận dụng biểu đồ Ven và các phép toán tập hợp để giải quyết bài toán đếm, bài toán thực tế về phân loại nhóm đối tượng.'
          ]
        }
      },
      {
        id: 'math10_c2_b1',
        chapter: 'Chương II: Bất phương trình và Hệ bất phương trình bậc nhất hai ẩn',
        topicTitle: 'Biểu diễn miền nghiệm của hệ bất phương trình bậc nhất hai ẩn',
        knowledgeScope: 'Bất phương trình bậc nhất hai ẩn, biểu diễn miền nghiệm trên mặt phẳng tọa độ; Hệ bất phương trình bậc nhất hai ẩn và bài toán quy hoạch tuyến tính tối ưu.',
        outcomes: {
          know: [
            'Nhận biết được bất phương trình bậc nhất hai ẩn và hệ bất phương trình bậc nhất hai ẩn.',
            'Nhận biết được một điểm $(x_0; y_0)$ có phải là nghiệm của hệ bất phương trình hay không.'
          ],
          understand: [
            'Biểu diễn được miền nghiệm của một bất phương trình và hệ bất phương trình bậc nhất hai ẩn trên mặt phẳng tọa độ Oxy.',
            'Xác định được tọa độ các đỉnh của miền đa giác nghiệm.'
          ],
          apply: [
            'Vận dụng hệ bất phương trình bậc nhất hai ẩn để giải bài toán quy hoạch tuyến tính thực tế: tìm phương án sản xuất tối ưu để chi phí nhỏ nhất hoặc lợi nhuận lớn nhất.'
          ]
        }
      }
    ]
  },

  // ================= VẬT LÝ 12 (GDPT 2018) =================
  {
    subject: 'Vật lý',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'phys12_c1_b1',
        chapter: 'Chủ đề 1: Vật lý nhiệt',
        topicTitle: 'Mô hình động học phân tử chất khí và cấu trúc vật chất',
        knowledgeScope: 'Cấu trúc các thể rắn, lỏng, khí; Chuyển động Brown; Thuyết động học phân tử chất khí; Nhiệt độ và thang nhiệt độ Celsius, Kelvin.',
        outcomes: {
          know: [
            'Nêu được cấu trúc của chất rắn kết tinh, chất rắn vô định hình, chất lỏng và chất khí dưới góc độ phân tử.',
            'Nhận biết được các thang nhiệt độ: Celsius, thang nhiệt độ tuyệt đối Kelvin và công thức chuyển đổi giữa chúng.',
            'Phát biểu được các nội dung cơ bản của thuyết động học phân tử chất khí.'
          ],
          understand: [
            'Giải thích được chuyển động nhiệt và sự phụ thuộc của tốc độ chuyển động phân tử vào nhiệt độ.',
            'Giải thích được nguyên nhân gây ra áp suất chất khí lên thành bình chứa dưới góc độ va chạm phân tử.'
          ],
          apply: [
            'Vận dụng mối liên hệ giữa nhiệt độ tuyệt đối và động năng trung bình của phân tử để tính toán các đại lượng vi mô và vĩ mô.',
            'Giải thích các hiện tượng nhiệt trong thực tế đời sống và sản xuất công nghiệp.'
          ]
        }
      },
      {
        id: 'phys12_c1_b2',
        chapter: 'Chủ đề 1: Vật lý nhiệt',
        topicTitle: 'Nhiệt dung riêng, nhiệt nóng chảy riêng và nhiệt hóa hơi riêng',
        knowledgeScope: 'Nội năng; Định luật I Nhiệt động lực học: $\\Delta U = A + Q$; Nhiệt dung riêng $c$; Nhiệt nóng chảy riêng $\\lambda$; Nhiệt hóa hơi riêng $L$.',
        outcomes: {
          know: [
            'Định nghĩa được nội năng của một vật và hai cách làm biến đổi nội năng (thực hiện công và truyền nhiệt).',
            'Nêu được định nghĩa và đơn vị của nhiệt dung riêng, nhiệt nóng chảy riêng và nhiệt hóa hơi riêng.'
          ],
          understand: [
            'Vận dụng định luật I nhiệt động lực học $\\Delta U = A + Q$ kèm theo quy ước về dấu của nhiệt lượng và công.',
            'Giải thích được tại sao trong quá trình chuyển thể (nóng chảy, sôi) nhiệt độ của chất nguyên chất lại không đổi.'
          ],
          apply: [
            'Tính toán nhiệt lượng trao đổi trong các quá trình truyền nhiệt và chuyển thể của các chất trong đời sống và kỹ thuật làm mát.',
            'Xác định hiệu suất của các thiết bị nhiệt và đề xuất giải pháp tiết kiệm năng lượng nhiệt.'
          ]
        }
      },
      {
        id: 'phys12_c2_b1',
        chapter: 'Chủ đề 2: Khí lí tưởng',
        topicTitle: 'Phương trình trạng thái khí lí tưởng',
        knowledgeScope: 'Khí lí tưởng; Quá trình đẳng nhiệt (Định luật Boyle); Quá trình đẳng tích (Định luật Charles); Phương trình Clapeyron - Mendeleev.',
        outcomes: {
          know: [
            'Nêu được định nghĩa khí lí tưởng.',
            'Phát biểu được định luật Boyle về quá trình đẳng nhiệt và định luật Charles về quá trình đẳng tích.'
          ],
          understand: [
            'Vẽ và nhận dạng được các đường đẳng nhiệt, đẳng tích, đẳng áp trên các hệ tọa độ $(p, V), (p, T), (V, T)$.',
            'Giải thích được sự biến đổi các thông số trạng thái $(p, V, T)$ của một lượng khí xác định.'
          ],
          apply: [
            'Vận dụng phương trình trạng thái khí lí tưởng $\\frac{p_1 V_1}{T_1} = \\frac{p_2 V_2}{T_2}$ và $pV = nRT$ để giải các bài toán thực tiễn về khí trong bình kín, lốp xe, bóng thám không.',
            'Đánh giá các hiện tượng an toàn cháy nổ của bình khí nén khi nhiệt độ thay đổi.'
          ]
        }
      }
    ]
  },

  // ================= HÓA HỌC 12 (GDPT 2018) =================
  {
    subject: 'Hóa học',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'chem12_c1_b1',
        chapter: 'Chương 1: Ester - Lipid',
        topicTitle: 'Ester và phản ứng xà phòng hóa',
        knowledgeScope: 'Khái niệm, cấu tạo nhóm chức ester; Danh pháp ester; Tính chất vật lí; Phản ứng thủy phân trong môi trường axit và môi trường kiềm (xà phòng hóa); Ứng dụng.',
        outcomes: {
          know: [
            'Nhận biết được đặc điểm cấu tạo nhóm chức ester $-COO-$, công thức chung của ester no, đơn chức, mạch hở.',
            'Gọi được tên thông thường và tên thay thế của các ester đơn giản.',
            'Nêu được tính chất vật lí đặc trưng của ester (mùi thơm hoa quả, ít tan trong nước, nhiệt độ sôi thấp hơn axit tương ứng).'
          ],
          understand: [
            'Viết được phương trình hóa học của phản ứng thủy phân ester trong môi trường axit (thuận nghịch) và môi trường bazơ (một chiều).',
            'Giải thích được nguyên nhân gây ra sự khác biệt về nhiệt độ sôi và độ tan giữa ester với ancol và axit cacboxylic cùng phân tử khối.'
          ],
          apply: [
            'Tính toán lượng ester hoặc xà phòng tạo thành trong phản ứng thủy phân dựa vào phương trình hóa học và hiệu suất phản ứng.',
            'Đề xuất ứng dụng của ester trong công nghiệp hương liệu, dung môi và mĩ phẩm.'
          ]
        }
      },
      {
        id: 'chem12_c2_b1',
        chapter: 'Chương 2: Carbohydrate',
        topicTitle: 'Glucose và Fructose',
        knowledgeScope: 'Phân loại carbohydrate (monosaccharide, disaccharide, polysaccharide); Cấu trúc phân tử glucose và fructose; Tính chất hóa học: phản ứng tráng bạc, phản ứng với $Cu(OH)_2$, phản ứng lên men.',
        outcomes: {
          know: [
            'Nhận biết được glucose và fructose thuộc loại monosaccharide.',
            'Nêu được trạng thái tự nhiên, tính chất vật lí của glucose và fructose.'
          ],
          understand: [
            'Mô tả và giải thích được các hiện tượng thí nghiệm: phản ứng tráng bạc của glucose, phản ứng hòa tan $Cu(OH)_2$ tạo dung dịch màu xanh lam thẫm.',
            'Phân biệt được glucose và fructose qua cấu tạo nhóm chức và phản ứng với nước brom.'
          ],
          apply: [
            'Tính toán lượng Ag thu được trong phản ứng tráng bạc hoặc thể tích $CO_2$ sinh ra từ phản ứng lên men rượu của glucose.',
            'Giải thích được ứng dụng của glucose trong y tế (dịch truyền dinh dưỡng, tráng gương) và đời sống.'
          ]
        }
      }
    ]
  },

  // ================= SINH HỌC 12 (GDPT 2018) =================
  {
    subject: 'Sinh học',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'bio12_c1_b1',
        chapter: 'Phần 5: Di truyền học',
        topicTitle: 'Gen, mã di truyền và quá trình nhân đôi ADN',
        knowledgeScope: 'Khái niệm gen; Cấu trúc và đặc điểm của mã di truyền (tính thoái hóa, tính phổ biến, tính đặc hiệu); Nguyên tắc và diễn biến của quá trình nhân đôi ADN.',
        outcomes: {
          know: [
            'Nêu được định nghĩa gen và cấu trúc chung của một gen cấu trúc gồm 3 vùng: điều hòa, mã hóa, kết thúc.',
            'Nhận biết được 4 đặc điểm cốt lõi của mã di truyền.',
            'Nêu được các nguyên tắc trong nhân đôi ADN: nguyên tắc bổ sung và nguyên tắc bán bảo toàn.'
          ],
          understand: [
            'Mô tả được các giai đoạn chính của quá trình nhân đôi ADN và vai trò của các enzyme ADN polymerase, helicase, ligase.',
            'Phân biệt được cơ chế tổng hợp liên tục trên mạch khuôn $3\' \\to 5\'$ và tổng hợp gián đoạn (đoạn Okazaki) trên mạch khuôn $5\' \\to 3\'$.'
          ],
          apply: [
            'Tính số lượng nucleotit từng loại, số liên kết hydro, số phân tử ADN con tạo ra sau $k$ lần nhân đôi.',
            'Vận dụng cơ chế sao chép ADN để giải thích cơ sở phân tử của kỹ thuật PCR trong chẩn đoán y học và xét nghiệm ADN.'
          ]
        }
      }
    ]
  },

  // ================= KHOA HỌC TỰ NHIÊN 9 (GDPT 2018) =================
  {
    subject: 'Khoa học tự nhiên',
    grade: '9',
    semester: 'hk1',
    topics: [
      {
        id: 'khtn9_c1_b1',
        chapter: 'Chủ đề 1: Năng lượng cơ học và ánh sáng',
        topicTitle: 'Động năng và Thế năng',
        knowledgeScope: 'Khái niệm động năng, thế năng trọng trường; Sự chuyển hóa giữa động năng và thế năng; Định luật bảo toàn cơ năng.',
        outcomes: {
          know: [
            'Nhận biết được dạng năng lượng một vật có được do chuyển động là động năng, do vị trí so với mặt đất là thế năng trọng trường.',
            'Nêu được các yếu tố ảnh hưởng đến động năng (khối lượng, tốc độ) và thế năng (khối lượng, độ cao).'
          ],
          understand: [
            'Mô tả được sự chuyển hóa giữa động năng và thế năng trong các trường hợp thực tế (con lắc đơn, vật rơi tự do, tàu lượn siêu tốc).',
            'Giải thích được sự bảo toàn cơ năng khi bỏ qua ma sát và lực cản.'
          ],
          apply: [
            'Tính toán cơ năng, động năng, thế năng của vật tại các vị trí xác định trong trường trọng lực.',
            'Đề xuất các biện pháp giảm thiểu tai nạn giao thông dựa trên mối liên hệ giữa động năng và tốc độ của phương tiện.'
          ]
        }
      },
      {
        id: 'khtn9_c2_b1',
        chapter: 'Chủ đề 2: Kim loại và Hợp kim',
        topicTitle: 'Tính chất hóa học của kim loại và Dãy hoạt động hóa học',
        knowledgeScope: 'Tính chất hóa học chung của kim loại (tác dụng với phi kim, axit, dung dịch muối); Ý nghĩa của dãy hoạt động hóa học của kim loại.',
        outcomes: {
          know: [
            'Nêu được các tính chất hóa học chung của kim loại.',
            'Nhớ được thứ tự các kim loại trong dãy hoạt động hóa học: K, Na, Ca, Mg, Al, Zn, Fe, Pb, (H), Cu, Ag, Au.'
          ],
          understand: [
            'Viết được các phương trình hóa học minh họa tính chất hóa học của kim loại.',
            'Dự đoán được phản ứng có xảy ra hay không giữa kim loại với dung dịch axit và dung dịch muối dựa vào dãy hoạt động hóa học.'
          ],
          apply: [
            'Tính khối lượng kim loại tham gia phản ứng, thể tích khí $H_2$ sinh ra hoặc nồng độ mol dung dịch sau phản ứng.',
            'Giải thích các biện pháp chống ăn mòn kim loại trong đời sống và kỹ thuật (sơn phủ, mạ điện, gắn kẽm bảo vệ vỏ tàu biển).'
          ]
        }
      }
    ]
  },

  // ================= NGỮ VĂN 12 (GDPT 2018) =================
  {
    subject: 'Ngữ văn',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'van12_c1_b1',
        chapter: 'Bài 1: Khát vọng lập thân và trách nhiệm công dân',
        topicTitle: 'Đọc hiểu văn bản Nghị luận và Viết đoạn văn nghị luận xã hội',
        knowledgeScope: 'Đặc trưng văn bản nghị luận: luận đề, luận điểm, lí lẽ, dẫn chứng; Thao tác lập luận giải thích, chứng minh, bình luận; Kỹ năng viết đoạn văn NLXH khoảng 200 chữ.',
        outcomes: {
          know: [
            'Nhận biết được luận đề, hệ thống luận điểm, lí lẽ và bằng chứng tiêu biểu trong văn bản nghị luận xã hội.',
            'Chỉ ra được các biện pháp tu từ, thao tác lập luận được tác giả sử dụng trong văn bản.'
          ],
          understand: [
            'Phân tích được mối quan hệ giữa luận đề, luận điểm, lí lẽ và dẫn chứng; làm rõ mục đích viết của người viết.',
            'Giải thích được thông điệp, ý nghĩa triết lí hoặc bài học nhân sinh sâu sắc rút ra từ văn bản đọc hiểu.'
          ],
          apply: [
            'Viết được đoạn văn nghị luận xã hội (khoảng 200 chữ) thể hiện quan điểm cá nhân về một hiện tượng đời sống hoặc vấn đề tư tưởng đạo lí phù hợp với lứa tuổi.',
            'Biết liên hệ, đối chiếu vấn đề trong tác phẩm với thực tế bản thân và xã hội hiện đại.'
          ]
        }
      }
    ]
  },

  // ================= TIẾNG ANH 12 (GDPT 2018) =================
  {
    subject: 'Tiếng Anh',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'eng12_u1',
        chapter: 'Unit 1: Life Stories we admire',
        topicTitle: 'Grammar: Past Simple vs. Past Continuous, Vocabulary of Achievements',
        knowledgeScope: 'Vocabulary: achievements, dedication, inspirational figures; Grammar: Past Simple vs. Past Continuous with when/while.',
        outcomes: {
          know: [
            'Nhận biết được dạng quá khứ đơn (Past Simple) và quá khứ tiếp diễn (Past Continuous) của các động từ thông dụng.',
            'Nhận biết được trọng âm và phát âm đuôi -ed của động từ có quy tắc.'
          ],
          understand: [
            'Phân biệt được hành động đang xảy ra thì có hành động khác xen vào bằng liên từ when và while.',
            'Hiểu được nghĩa và ngữ cảnh sử dụng của các từ vựng chủ đề tiểu sử danh nhân và thành tựu cuộc sống.'
          ],
          apply: [
            'Chia đúng thì động từ trong câu phức và đoạn văn mô tả sự kiện quá khứ.',
            'Đọc hiểu và trích xuất thông tin chi tiết từ đoạn văn về một nhân vật truyền cảm hứng trong xã hội.'
          ]
        }
      }
    ]
  },

  // ================= LỊCH SỬ 12 (GDPT 2018) =================
  {
    subject: 'Lịch sử',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'his12_c1_b1',
        chapter: 'Chủ đề 1: Thế giới trong và sau Chiến tranh lạnh',
        topicTitle: 'Sự hình thành trật tự thế giới hai cực Ianta và Chiến tranh lạnh',
        knowledgeScope: 'Hội nghị Ianta (1945) và những quyết định trọng tài; Sự đối đầu Đông - Tây và Chiến tranh lạnh (1947 - 1989); Sự sụp đổ của trật tự hai cực Ianta.',
        outcomes: {
          know: [
            'Nêu được hoàn cảnh lịch sử, thành phần tham dự và các quyết định cốt lõi của Hội nghị Ianta (2/1945).',
            'Nhận biết được thời gian bắt đầu và kết thúc của thời kỳ Chiến tranh lạnh giữa hai phe TBCN và XHCN.'
          ],
          understand: [
            'Giải thích được bản chất của trật tự hai cực Ianta và nguyên nhân dẫn đến sự đối đầu gay gắt giữa hai siêu cường Mỹ - Liên Xô.',
            'Phân tích được tác động to lớn của Chiến tranh lạnh đối với hòa bình và an ninh quốc tế.'
          ],
          apply: [
            'Rút ra bài học lịch sử cho Việt Nam trong chính sách đối ngoại đa phương hóa, hội nhập quốc tế và bảo vệ độc lập chủ quyền ngày nay.'
          ]
        }
      }
    ]
  },

  // ================= ĐỊA LÝ 12 (GDPT 2018) =================
  {
    subject: 'Địa lý',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'geo12_c1_b1',
        chapter: 'Chủ đề 1: Địa lý tự nhiên Việt Nam',
        topicTitle: 'Vị trí địa lí và phạm vi lãnh thổ Việt Nam',
        knowledgeScope: 'Đặc điểm vị trí địa lí và phạm vi lãnh thổ (vùng đất, vùng biển, vùng trời); Ý nghĩa tự nhiên, kinh tế, xã hội và quốc phòng an ninh của vị trí địa lí.',
        outcomes: {
          know: [
            'Trình bày được tọa độ địa lí, phạm vi không gian lãnh thổ Việt Nam gồm vùng đất liền, vùng biển và vùng trời.',
            'Kể tên được các nước có chung đường biên giới trên đất liền và trên biển với nước ta.'
          ],
          understand: [
            'Phân tích được ý nghĩa to lớn của vị trí địa lí đối với việc quy định thiên nhiên nước ta mang tính chất nhiệt đới ẩm gió mùa.',
            'Giải thích được tại sao nước ta nằm trong vành đai sinh khoáng nhưng cũng chịu nhiều thiên tai bão lũ.'
          ],
          apply: [
            'Đọc và phân tích bản đồ địa lí để xác định vị trí chiến lược của Biển Đông đối với phát triển kinh tế biển và an ninh quốc phòng.',
            'Đề xuất các giải pháp bảo vệ chủ quyền biển đảo thiêng liêng của Tổ quốc.'
          ]
        }
      }
    ]
  },

  // ================= TIN HỌC 12 (GDPT 2018) =================
  {
    subject: 'Tin học',
    grade: '12',
    semester: 'hk1',
    topics: [
      {
        id: 'it12_c1_b1',
        chapter: 'Chủ đề A: Máy tính và xã hội tri thức',
        topicTitle: 'Trí tuệ nhân tạo và Ứng dụng trong đời sống',
        knowledgeScope: 'Khái niệm Trí tuệ nhân tạo (AI); Các lĩnh vực ứng dụng của AI (thị giác máy tính, xử lý ngôn ngữ tự nhiên, hệ chuyên gia); Vấn đề đạo đức và an toàn khi sử dụng AI.',
        outcomes: {
          know: [
            'Nêu được định nghĩa cơ bản về Trí tuệ nhân tạo (AI).',
            'Nhận biết được các ứng dụng phổ biến của AI trong nhận diện khuôn mặt, dịch máy, trợ lý ảo và lái xe tự hành.'
          ],
          understand: [
            'Phân biệt được AI hẹp (Narrow AI) và AI tổng quát (AGI).',
            'Giải thích được vai trò của dữ liệu lớn (Big Data) và thuật toán học máy (Machine Learning) đối với sự phát triển của hệ thống AI hiện đại.'
          ],
          apply: [
            'Sử dụng các công cụ AI tạo sinh một cách có trách nhiệm, tuân thủ liêm chính học thuật và bảo vệ dữ liệu cá nhân trong học tập.'
          ]
        }
      }
    ]
  }
];

/**
 * Tra cứu danh mục chương trình theo môn học và khối lớp
 */
export function getCurriculumBySubjectAndGrade(subject: string, grade: string): SubjectCurriculum | undefined {
  const normSubj = (subject || '').trim().toLowerCase();
  const normGrade = (grade || '').trim();

  return CURRICULUM_STANDARDS.find((c) => {
    const sMatch = c.subject.toLowerCase() === normSubj ||
      (normSubj.includes('toán') && c.subject === 'Toán học') ||
      (normSubj.includes('vật l') && c.subject === 'Vật lý') ||
      (normSubj.includes('hóa') && c.subject === 'Hóa học') ||
      (normSubj.includes('sinh') && c.subject === 'Sinh học') ||
      (normSubj.includes('văn') && c.subject === 'Ngữ văn') ||
      (normSubj.includes('anh') && c.subject === 'Tiếng Anh') ||
      (normSubj.includes('lịch sử') && c.subject === 'Lịch sử') ||
      (normSubj.includes('địa') && c.subject === 'Địa lý') ||
      (normSubj.includes('tin') && c.subject === 'Tin học') ||
      (normSubj.includes('khtn') && c.subject === 'Khoa học tự nhiên');

    return sMatch && c.grade === normGrade;
  });
}
