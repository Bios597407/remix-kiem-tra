import {
  LuatConfig,
  ChuDeItem,
  CauItem,
  AuditCheckItem,
  AuditReport,
  QuestionType,
  CognitiveLevel,
} from '../types/exam';
import { getUnifiedMatrixSpecData, getAllNoiDungList, getAvailableLevelsForNoiDung, PRESETS } from './cv7991Engine';

/**
 * Executes the 15 internal audit checks (K1 - K15) based on the "cau" table, "luat", and content list
 */
export function runCv7991Audit(
  chuDeListInput: ChuDeItem[] = [],
  cauListInput: CauItem[] = [],
  luatInput?: LuatConfig,
  contextInfoInput?: { grade: string; subject: string }
): AuditReport {
  const chuDeList = Array.isArray(chuDeListInput) ? chuDeListInput : [];
  const cauList = Array.isArray(cauListInput) ? cauListInput : [];
  const luat = luatInput || PRESETS['3-4-3'].luat;
  const contextInfo = contextInfoInput || { grade: '', subject: '' };

  const checks: AuditCheckItem[] = [];
  const allNoiDung = getAllNoiDungList(chuDeList);
  const matrixData = getUnifiedMatrixSpecData(chuDeList, cauList, luat);

  // Helper rounding function
  const round2 = (val: number) => Number(val.toFixed(2));

  // --- K1 [ERROR]: Tổng điểm = 10,0 ---
  const totalScore = round2(cauList.reduce((s, c) => s + (c?.diem || 0), 0));
  const k1Passed = Math.abs(totalScore - 10.0) < 0.01;
  checks.push({
    id: 'K1',
    ten: 'Tổng điểm đề thi bằng 10,0 điểm',
    type: 'ERROR',
    passed: k1Passed,
    cauTrucNhap: '10,0 điểm',
    demDuoc: `${totalScore.toFixed(2).replace('.', ',')} điểm`,
    formula: 'Tổng điểm = Cộng toàn bộ điểm các câu/ý trong danh sách câu',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k1Passed
      ? 'ĐẠT: Tổng điểm toàn đề đạt đúng 10,0 điểm.'
      : `LỖI: Tổng điểm đếm được là ${totalScore.toFixed(2)}đ, khác 10,0đ quy định!`,
  });

  // --- K2 [ERROR]: Điểm Trắc nghiệm / Tự luận khớp luật ---
  const tnScore = round2(
    cauList.filter((c) => c.dang === 'NLC' || c.dang === 'DS' || c.dang === 'TLN').reduce((s, c) => s + (c.diem || 0), 0)
  );
  const tlScore = round2(cauList.filter((c) => c.dang === 'TL').reduce((s, c) => s + (c.diem || 0), 0));
  const expectedTnScore = round2(
    luat.nlcCount * luat.nlcPrice +
      luat.dsCount * luat.dsSubItems * luat.dsPricePerSub +
      luat.tlnCount * luat.tlnPrice
  );
  const expectedTlScore = round2(luat.tlCount * luat.tlPrice);
  const k2Passed = Math.abs(tnScore - expectedTnScore) < 0.01 && Math.abs(tlScore - expectedTlScore) < 0.01;
  checks.push({
    id: 'K2',
    ten: 'Cấu trúc điểm Trắc nghiệm vs Tự luận khớp tham số nhập',
    type: 'ERROR',
    passed: k2Passed,
    cauTrucNhap: `TN ${expectedTnScore.toFixed(1)}đ + TL ${expectedTlScore.toFixed(1)}đ`,
    demDuoc: `TN ${tnScore.toFixed(1)}đ + TL ${tlScore.toFixed(1)}đ`,
    formula: 'Điểm TN = Điểm NLC + ĐS + TLN | Điểm TL = Điểm các câu Tự luận',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k2Passed
      ? `ĐẠT: Trắc nghiệm ${tnScore}đ, Tự luận ${tlScore}đ khớp cấu trúc.`
      : `LỖI: Điểm Trắc nghiệm (${tnScore}đ) hoặc Tự luận (${tlScore}đ) không khớp cấu trúc đã nhập!`,
  });

  // --- K3 [ERROR]: Số lượng câu/ý khớp cấu trúc đã nhập ---
  const nlcActual = cauList.filter((c) => c.dang === 'NLC').length;
  const dsActualSub = cauList.filter((c) => c.dang === 'DS').length; // sub-items count
  const dsActualBig = Math.ceil(dsActualSub / (luat.dsSubItems || 4));
  const tlnActual = cauList.filter((c) => c.dang === 'TLN').length;
  const tlActual = cauList.filter((c) => c.dang === 'TL').length;

  const expectedDsSub = luat.dsCount * (luat.dsSubItems || 4);
  const k3Passed =
    nlcActual === luat.nlcCount &&
    dsActualSub === expectedDsSub &&
    tlnActual === luat.tlnCount &&
    tlActual === luat.tlCount;

  checks.push({
    id: 'K3',
    ten: 'Số lượng câu hỏi khớp cấu trúc đã nhập',
    type: 'ERROR',
    passed: k3Passed,
    cauTrucNhap: `NLC ${luat.nlcCount}, ĐS ${luat.dsCount} câu (${expectedDsSub} ý), TLN ${luat.tlnCount}, TL ${luat.tlCount}`,
    demDuoc: `NLC ${nlcActual}, ĐS ${dsActualBig} câu (${dsActualSub} ý), TLN ${tlnActual}, TL ${tlActual}`,
    formula: 'So sánh từng dạng: đếm số dòng thuộc dạng NLC, DS, TLN, TL',
    sourceLabel: 'Tham số người dùng nhập',
    calcMethod: 'Code tính',
    details: k3Passed
      ? 'ĐẠT: Số lượng câu/ý của tất cả các dạng câu hỏi khớp hoàn toàn với tham số đã nhập.'
      : `LỖI: Số lượng câu/ý đếm được không khớp với tham số đã nhập!`,
  });

  // --- K4 [ERROR]: Điểm từng dạng = Số lượng × Đơn giá ---
  let k4Passed = true;
  let k4Msg = '';
  const nlcScore = round2(nlcActual * luat.nlcPrice);
  const dsScore = round2(dsActualSub * luat.dsPricePerSub);
  const tlnScore = round2(tlnActual * luat.tlnPrice);
  const tlScoreActual = round2(tlActual * luat.tlPrice);

  cauList.forEach((c) => {
    let expectedUnit = luat.nlcPrice;
    if (c.dang === 'DS') expectedUnit = luat.dsPricePerSub;
    else if (c.dang === 'TLN') expectedUnit = luat.tlnPrice;
    else if (c.dang === 'TL') expectedUnit = luat.tlPrice;

    if (Math.abs(c.diem - expectedUnit) > 0.001) {
      k4Passed = false;
      k4Msg = `Câu ${c.id} dạng ${c.dang} có điểm ${c.diem}đ khác đơn giá quy định ${expectedUnit}đ.`;
    }
  });

  checks.push({
    id: 'K4',
    ten: 'Điểm từng dạng bằng số lượng nhân đơn giá',
    type: 'ERROR',
    passed: k4Passed,
    cauTrucNhap: `NLC ${luat.nlcPrice}đ/c, ĐS ${luat.dsPricePerSub}đ/ý, TLN ${luat.tlnPrice}đ/c, TL ${luat.tlPrice}đ/c`,
    demDuoc: `Thực tế: NLC ${nlcScore}đ, ĐS ${dsScore}đ, TLN ${tlnScore}đ, TL ${tlScoreActual}đ`,
    formula: 'Điểm câu = Số lượng câu/ý × Đơn giá tương ứng',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k4Passed
      ? 'ĐẠT: Điểm số của từng câu và từng dạng bằng đúng số lượng nhân đơn giá.'
      : `LỖI: ${k4Msg}`,
  });

  // --- K5 [WARNING]: Tỷ lệ điểm theo mức độ nhận thức (Biết / Hiểu / Vận dụng) ---
  const bietScore = round2(cauList.filter((c) => c && c.muc === 'Biet').reduce((s, c) => s + (c?.diem || 0), 0));
  const hieuScore = round2(cauList.filter((c) => c && c.muc === 'Hieu').reduce((s, c) => s + (c?.diem || 0), 0));
  const vdScore = round2(cauList.filter((c) => c && c.muc === 'VanDung').reduce((s, c) => s + (c?.diem || 0), 0));

  const bietDiff = Math.abs(bietScore - (luat.bietTarget || 0));
  const hieuDiff = Math.abs(hieuScore - (luat.hieuTarget || 0));
  const vdDiff = Math.abs(vdScore - (luat.vanDungTarget || 0));

  const tol = luat.tolerance || 0;
  const k5Passed = bietDiff <= tol && hieuDiff <= tol && vdDiff <= tol;

  checks.push({
    id: 'K5',
    ten: 'Tỉ lệ điểm theo mức độ nhận thức lệch trong dung sai cho phép',
    type: 'WARNING',
    passed: k5Passed,
    cauTrucNhap: `Biết ${luat.bietTarget.toFixed(1)}đ | Hiểu ${luat.hieuTarget.toFixed(1)}đ | VD ${luat.vanDungTarget.toFixed(1)}đ (dung sai ±${tol})`,
    demDuoc: `Biết ${bietScore.toFixed(1)}đ | Hiểu ${hieuScore.toFixed(1)}đ | VD ${vdScore.toFixed(1)}đ`,
    formula: 'Cộng tổng điểm các câu theo từng mức Biết, Hiểu, Vận dụng và so sánh với mục tiêu',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k5Passed
      ? 'ĐẠT: Tỷ lệ điểm giữa các mức độ đạt đúng mục tiêu cấu trúc đã nhập.'
      : 'CẢNH BÁO: Tỷ lệ điểm theo mức độ có sự lệch so với mục tiêu. Giáo viên cần kiểm tra xem có chấp nhận mức lệch này hay không.',
  });

  // --- K6 [ERROR]: Cột % điểm các dòng cộng đủ 100% ---
  const sumPercent = round2(matrixData.rows.reduce((s, r) => s + r.rowPercentScore, 0));
  const k6Passed = Math.abs(sumPercent - 100.0) <= 0.5; // Allow minor rounding within 0.5%
  checks.push({
    id: 'K6',
    ten: 'Tổng cột Tỉ lệ % điểm của các dòng ma trận bằng 100%',
    type: 'ERROR',
    passed: k6Passed,
    cauTrucNhap: '100%',
    demDuoc: `${sumPercent.toFixed(1)}%`,
    formula: 'Tỉ lệ % dòng = (Điểm dòng ÷ 10,0) × 100%; Tổng % = Cộng tất cả các dòng',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k6Passed
      ? 'ĐẠT: Tổng tỷ lệ % điểm của tất cả các dòng nội dung cộng lại đạt đúng 100%.'
      : `LỖI: Tổng tỷ lệ % điểm đếm được là ${sumPercent}%, không bằng 100%!`,
  });

  // --- K7 [WARNING]: Nội dung chưa có câu nào ---
  const emptyNoiDung = allNoiDung.filter((item) => {
    return !cauList.some((c) => c.noiDungId === item.noiDung.id);
  });
  const k7Passed = emptyNoiDung.length === 0;
  checks.push({
    id: 'K7',
    ten: 'Mọi nội dung/đơn vị kiến thức đều có ít nhất 1 câu hỏi',
    type: 'WARNING',
    passed: k7Passed,
    cauTrucNhap: `Tổng ${allNoiDung.length} nội dung`,
    demDuoc: `${allNoiDung.length - emptyNoiDung.length}/${allNoiDung.length} nội dung có câu`,
    formula: 'Kiểm tra từng nội dung xem có xuất hiện trong danh sách câu hay không',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k7Passed
      ? 'ĐẠT: Tất cả các nội dung kiến thức đều có câu hỏi đánh giá.'
      : `CẢNH BÁO: Có ${emptyNoiDung.length} nội dung chưa được phân bổ câu hỏi (${emptyNoiDung.map((e) => e.noiDung.ten).join(', ')}).`,
  });

  // --- K8 [WARNING]: Mức độ câu hỏi vượt quá Mức tối đa của YCCĐ ---
  let k8Passed = true;
  const invalidLevels: string[] = [];

  cauList.forEach((c) => {
    const targetNoiDung = allNoiDung.find((item) => item.noiDung.id === c.noiDungId);
    if (!targetNoiDung) return;

    const available = getAvailableLevelsForNoiDung(targetNoiDung.noiDung);
    if (!available[c.muc]) {
      k8Passed = false;
      invalidLevels.push(`Câu ${c.id} (Mức ${c.muc}) tại "${targetNoiDung.noiDung.ten}"`);
    }
  });

  checks.push({
    id: 'K8',
    ten: 'Mức độ nhận thức của câu hỏi không vượt quá Mức tối đa của YCCĐ',
    type: 'WARNING',
    passed: k8Passed,
    cauTrucNhap: 'Mức câu ≤ Mức tối đa YCCĐ',
    demDuoc: k8Passed ? 'Không có câu vượt mức' : `${invalidLevels.length} câu vi phạm`,
    formula: 'Kiểm tra mức nhận thức của câu so với bảng YCCĐ của đúng nội dung đó',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k8Passed
      ? 'ĐẠT: Mức độ nhận thức của tất cả các câu hỏi hoàn toàn phù hợp với Mức tối đa YCCĐ.'
      : `CẢNH BÁO: Phát hiện câu hỏi có mức nhận thức vượt quá YCCĐ tương ứng: ${invalidLevels.join('; ')}.`,
  });

  // --- K9 [WARNING]: YCCĐ chưa có câu hỏi đo lường ---
  let unmeasuredYccdCount = 0;
  allNoiDung.forEach((item) => {
    item.noiDung.yccd.forEach((y) => {
      const isMeasured = cauList.some(
        (c) => c.noiDungId === item.noiDung.id && c.maYCCD && c.maYCCD.includes(y.ma)
      );
      if (!isMeasured) unmeasuredYccdCount++;
    });
  });
  const k9Passed = unmeasuredYccdCount === 0;

  checks.push({
    id: 'K9',
    ten: 'Mọi Yêu cầu cần đạt (YCCĐ) đều được đo lường bởi câu hỏi',
    type: 'WARNING',
    passed: k9Passed,
    cauTrucNhap: '100% YCCĐ được đo lường',
    demDuoc: k9Passed ? 'Tất cả YCCĐ đều được đo' : `Còn ${unmeasuredYccdCount} YCCĐ chưa đo`,
    formula: 'Kiểm tra từng mã YCCĐ trong danh sách YCCĐ xem có xuất hiện trong maYCCD của danh sách câu',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k9Passed
      ? 'ĐẠT: Toàn bộ các YCCĐ đã nhập đều được gán đo lường bởi ít nhất 1 câu hỏi.'
      : `CẢNH BÁO: Còn ${unmeasuredYccdCount} YCCĐ chưa có câu hỏi trực tiếp đo lường trong đề thi này.`,
  });

  // --- K10 [ERROR]: YCCĐ không bị lẫn lộn giữa các nội dung ---
  let k10Passed = true;
  cauList.forEach((c) => {
    const ownerNoiDung = allNoiDung.find((item) => item.noiDung.id === c.noiDungId);
    if (!ownerNoiDung) return;

    if (c.maYCCD) {
      c.maYCCD.forEach((ma) => {
        const belongsToOwner = ownerNoiDung.noiDung.yccd.some((y) => y.ma === ma);
        if (!belongsToOwner) k10Passed = false;
      });
    }
  });

  checks.push({
    id: 'K10',
    ten: 'YCCĐ gán cho câu hỏi thuộc đúng Nội dung/đơn vị kiến thức',
    type: 'ERROR',
    passed: k10Passed,
    cauTrucNhap: 'YCCĐ chính chủ',
    demDuoc: k10Passed ? 'Khớp 100%' : 'Có YCCĐ bị lẫn lộn',
    formula: 'So sánh mã YCCĐ trong câu hỏi với danh sách YCCĐ của đúng Nội dung chứa câu hỏi đó',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k10Passed
      ? 'ĐẠT: Tất cả câu hỏi đều gán YCCĐ chính chủ thuộc đúng nội dung kiến thức.'
      : 'LỖI: Phát hiện YCCĐ của nội dung này bị gán sang nội dung khác!',
  });

  // --- K11 [ERROR]: ID câu không trùng, Dạng/Mức hợp lệ ---
  const idSet = new Set<string>();
  let k11Passed = true;
  let k11Msg = '';

  cauList.forEach((c) => {
    if (idSet.has(c.id)) {
      k11Passed = false;
      k11Msg = `Trùng ID câu: ${c.id}`;
    } else {
      idSet.add(c.id);
    }
    if (!['NLC', 'DS', 'TLN', 'TL'].includes(c.dang)) {
      k11Passed = false;
      k11Msg = `Dạng câu không hợp lệ: ${c.dang}`;
    }
    if (!['Biet', 'Hieu', 'VanDung'].includes(c.muc)) {
      k11Passed = false;
      k11Msg = `Mức câu không hợp lệ: ${c.muc}`;
    }
  });

  checks.push({
    id: 'K11',
    ten: 'Mã ID câu duy nhất, Dạng và Mức nhận thức hợp lệ',
    type: 'ERROR',
    passed: k11Passed,
    cauTrucNhap: 'Duy nhất & Chuẩn Schema',
    demDuoc: k11Passed ? `Đủ ${cauList.length} ID duy nhất` : k11Msg,
    formula: 'Kiểm tra tính trùng lặp của ID và kiểm tra enum hợp lệ của Dạng (NLC|DS|TLN|TL) và Mức',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k11Passed
      ? `ĐẠT: Tất cả ${cauList.length} phần tử câu/ý hỏi có ID duy nhất và dạng/mức chuẩn.`
      : `LỖI: ${k11Msg}`,
  });

  // --- K12 [ERROR]: Cùng Khối/Môn trên toàn bộ hệ thống ---
  const k12Passed = !!contextInfo.grade && !!contextInfo.subject;
  checks.push({
    id: 'K12',
    ten: 'Đề thi thống nhất đúng 1 Khối lớp và 1 Môn học',
    type: 'ERROR',
    passed: k12Passed,
    cauTrucNhap: `${contextInfo.grade || 'Chưa chọn'} – ${contextInfo.subject || 'Chưa chọn'}`,
    demDuoc: k12Passed ? `${contextInfo.grade} – ${contextInfo.subject}` : 'THIẾU THÔNG TIN',
    formula: 'Kiểm tra thuộc tính Khối và Môn học của Tab dữ liệu hiện tại',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k12Passed
      ? `ĐẠT: Dữ liệu thuộc đúng Khối ${contextInfo.grade}, Môn ${contextInfo.subject}.`
      : 'LỖI: Chưa xác định Khối lớp hoặc Môn học!',
  });

  // --- K13 [ERROR]: Ma trận khớp Bản đặc tả từng ô dòng/cột ---
  let k13Passed = true;
  matrixData.rows.forEach((r) => {
    (['NLC', 'DS', 'TLN', 'TL'] as QuestionType[]).forEach((type) => {
      (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
        const countFromMatrix = r.matrixCells[type][lvl].count;

        // Count directly in cauList for this content + type + lvl
        const countFromCau = cauList.filter(
          (c) => c.noiDungId === r.noiDungId && c.dang === type && c.muc === lvl
        ).length;

        if (countFromMatrix !== countFromCau) {
          k13Passed = false;
        }
      });
    });
  });

  checks.push({
    id: 'K13',
    ten: 'Số liệu tại từng ô dòng/cột của Ma trận khớp với Bản đặc tả',
    type: 'ERROR',
    passed: k13Passed,
    cauTrucNhap: 'Khớp 1-1 từng ô',
    demDuoc: k13Passed ? 'Khớp tuyệt đối từng ô' : 'Lệch ô giữa Ma trận và Đặc tả',
    formula: 'So sánh từng ô [Nội dung × Dạng × Mức] giữa Ma trận và Bản đặc tả',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k13Passed
      ? 'ĐẠT: Số liệu số câu và mã câu ở từng ô của Ma trận khớp hoàn toàn với Bản đặc tả.'
      : 'LỖI: Phát hiện sự không đồng nhất giữa ô Ma trận và ô Bản đặc tả!',
  });

  // --- K14 [WARNING]: Trích dẫn nguồn tài liệu cho câu hỏi ---
  const unquotedCount = cauList.filter((c) => !c.nguon || c.nguon.trim().length === 0).length;
  const k14Passed = unquotedCount === 0;

  checks.push({
    id: 'K14',
    ten: 'Tất cả câu hỏi đều có trích dẫn nguồn tài liệu tham chiếu',
    type: 'WARNING',
    passed: k14Passed,
    cauTrucNhap: 'Đầy đủ nguồn',
    demDuoc: k14Passed ? 'Tất cả câu đều có nguồn' : `Còn ${unquotedCount} câu thiếu nguồn`,
    formula: 'Kiểm tra trường nguon trong danh sách câu',
    sourceLabel: 'Quy tắc của ứng dụng',
    calcMethod: 'Code tính',
    details: k14Passed
      ? 'ĐẠT: Tất cả các câu hỏi đều có thông tin trích dẫn nguồn tài liệu tham chiếu.'
      : `CẢNH BÁO: Còn ${unquotedCount} câu chưa ghi trích dẫn nguồn tài liệu.`,
  });

  // --- K15 [ERROR]: Hàng cuối Đặc tả khớp Ma trận theo dạng câu ---
  let k15Passed = true;
  (['NLC', 'DS', 'TLN', 'TL'] as QuestionType[]).forEach((type) => {
    const matTypeCount = matrixData.typeGrandTotals[type].count;
    const matTypeScore = matrixData.typeGrandTotals[type].score;

    const cauTypeCount = cauList.filter((c) => c && c.dang === type).length;
    const cauTypeScore = round2(cauList.filter((c) => c && c.dang === type).reduce((s, c) => s + (c?.diem || 0), 0));

    if (matTypeCount !== cauTypeCount || Math.abs(matTypeScore - cauTypeScore) > 0.01) {
      k15Passed = false;
    }
  });

  checks.push({
    id: 'K15',
    ten: 'Hàng cuối của Bản đặc tả khớp Dòng tổng theo dạng của Ma trận',
    type: 'ERROR',
    passed: k15Passed,
    cauTrucNhap: 'Khớp tổng dạng',
    demDuoc: k15Passed ? 'Khớp hoàn toàn hàng tổng' : 'Khác hàng tổng',
    formula: 'So sánh tổng số câu và tổng số điểm của từng dạng ở hàng cuối',
    sourceLabel: 'Suy từ mẫu Phụ lục CV 7991',
    calcMethod: 'Code tính',
    details: k15Passed
      ? 'ĐẠT: Dòng tổng số câu và điểm theo từng dạng ở hàng cuối Đặc tả khớp Ma trận.'
      : 'LỖI: Số liệu tổng ở hàng cuối Bản đặc tả không khớp với Ma trận!',
  });

  const errorCount = checks.filter((c) => c.type === 'ERROR' && !c.passed).length;
  const warningCount = checks.filter((c) => c.type === 'WARNING' && !c.passed).length;
  const passed = errorCount === 0;

  return {
    passed,
    errorCount,
    warningCount,
    checks,
  };
}
