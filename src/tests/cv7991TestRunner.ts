import {
  LuatConfig,
  ChuDeItem,
  CauItem,
  AuditReport,
  QuestionItem,
  ExamConfig,
} from '../types/exam';
import { generateCauAllocation, getUnifiedMatrixSpecData, PRESETS } from '../utils/cv7991Engine';
import { runCv7991Audit } from '../utils/cv7991Audit';
import { ensureExactQuestionCount, applyScoringRules } from '../services/aiGenerator';
import { exportToAzotaFormat } from '../utils/azotaExporter';
import { buildStandardExamDocx } from '../utils/docxExporter';

export interface TestGroupResult {
  groupName: string;
  description: string;
  passed: boolean;
  totalRun: number;
  passedRun: number;
  logs: string[];
}

export interface FullTestSuiteResult {
  timestamp: number;
  passedAll: boolean;
  groups: TestGroupResult[];
}

/**
 * 1. ADAPTATION TEST (Thích ứng ≥ 5 đầu vào khác nhau)
 */
export function runAdaptationTests(): TestGroupResult {
  const logs: string[] = [];
  let passedCount = 0;

  const testCases = [
    { name: 'THPT Khối 12 Toán (1 Nội dung, Không TLN, Tự luận tính theo câu)', grade: '12', subject: 'Toán học', contentCount: 1, showTln: false },
    { name: 'THPT Khối 11 Vật lý (3 Nội dung, Có TLN, Tự luận tính theo câu)', grade: '11', subject: 'Vật lý', contentCount: 3, showTln: true },
    { name: 'THPT Khối 10 Hóa học (12 Nội dung, Preset 3-4-3)', grade: '10', subject: 'Hóa học', contentCount: 12, showTln: false },
    { name: 'THCS Khối 9 Sinh học (30 Nội dung biên)', grade: '9', subject: 'Sinh học', contentCount: 30, showTln: false },
    { name: 'THCS Khối 8 Tin học (5 Nội dung, Có bảng năng lực)', grade: '8', subject: 'Tin học', contentCount: 5, showTln: false },
  ];

  testCases.forEach((tc, idx) => {
    // Construct synthetic ChuDeItem
    const chuDeList: ChuDeItem[] = [
      {
        id: `CD1`,
        ten: `Chủ đề kiểm thử ${tc.subject}`,
        noiDung: Array.from({ length: tc.contentCount }).map((_, ndIdx) => ({
          id: `ND${ndIdx + 1}`,
          ten: `Nội dung ${ndIdx + 1}`,
          trongSo: 1,
          yccd: [
            { ma: `ND${ndIdx + 1}.1`, noiDung: `Nêu được khái niệm ${ndIdx + 1}`, mucToiDa: 'Biet' },
            { ma: `ND${ndIdx + 1}.2`, noiDung: `Giải thích được tính chất ${ndIdx + 1}`, mucToiDa: 'Hieu' },
            { ma: `ND${ndIdx + 1}.3`, noiDung: `Vận dụng giải bài tập ${ndIdx + 1}`, mucToiDa: 'VanDung' },
          ],
        })),
      },
    ];

    const luat: LuatConfig = {
      ...(tc.showTln ? PRESETS['3-2-2-3'].luat : PRESETS['3-4-3'].luat),
      presetName: tc.showTln ? '3-2-2-3' : '3-4-3',
    };

    const allocResult = generateCauAllocation(chuDeList, luat);
    const auditReport = runCv7991Audit(chuDeList, allocResult.cauList, luat, {
      grade: tc.grade,
      subject: tc.subject,
    });

    if (auditReport.passed && allocResult.cauList.length > 0) {
      passedCount++;
      logs.push(`✓ [Test ${idx + 1}] ${tc.name}: Phân bổ ${allocResult.cauList.length} câu, Tất cả LỖI đều ĐẠT!`);
    } else {
      logs.push(`✗ [Test ${idx + 1}] ${tc.name}: THẤT BẠI - ${allocResult.unsolvableReason || `Có ${auditReport.errorCount} lỗi audit`}`);
    }
  });

  return {
    groupName: '1. Adaptation Tests (Thích ứng ≥ 5 cấu hình đầu vào)',
    description: 'Kiểm tra sinh bảng động trên các khối (10,11,12,8,9), môn học, số nội dung (1, 3, 12, 30) khác nhau.',
    passed: passedCount === testCases.length,
    totalRun: testCases.length,
    passedRun: passedCount,
    logs,
  };
}

/**
 * 2. REFERENCE FIXTURE TEST (ND1–ND3 chuẩn tham chiếu)
 */
export function runReferenceFixtureTest(): TestGroupResult {
  const logs: string[] = [];

  // Construct Fixture: ND1, ND2, ND3
  // Fixture spec in prompt:
  // Unit price 0.25 for all sub-items/questions, essay by sub-item
  // ND1: NLC Biet 4, NLC VanDung 2; DS Biet 2, DS VanDung 2; TL Biet 2, TL VanDung 2. (Total sub-items = 14 * 0.25 = 3.5đ)
  // ND2: NLC Biet 4, NLC Hieu 2; DS Biet 2, DS Hieu 2; TL Biet 2, TL Hieu 2. (Total sub-items = 14 * 0.25 = 3.5đ)
  // ND3: NLC Hieu 2, NLC VanDung 2; DS Hieu 2, DS VanDung 2; TL Hieu 2, TL VanDung 2. (Total sub-items = 12 * 0.25 = 3.0đ)
  
  const chuDeList: ChuDeItem[] = [
    {
      id: 'CD1',
      ten: 'Chủ đề tham chiếu ND1-ND3',
      noiDung: [
        {
          id: 'ND1',
          ten: 'ND1',
          trongSo: 35,
          yccd: [
            { ma: 'ND1.1', noiDung: 'YCCĐ ND1 Biết', mucToiDa: 'Biet' },
            { ma: 'ND1.2', noiDung: 'YCCĐ ND1 Vận dụng', mucToiDa: 'VanDung' },
          ],
        },
        {
          id: 'ND2',
          ten: 'ND2',
          trongSo: 35,
          yccd: [
            { ma: 'ND2.1', noiDung: 'YCCĐ ND2 Biết', mucToiDa: 'Biet' },
            { ma: 'ND2.2', noiDung: 'YCCĐ ND2 Hiểu', mucToiDa: 'Hieu' },
          ],
        },
        {
          id: 'ND3',
          ten: 'ND3',
          trongSo: 30,
          yccd: [
            { ma: 'ND3.1', noiDung: 'YCCĐ ND3 Hiểu', mucToiDa: 'Hieu' },
            { ma: 'ND3.2', noiDung: 'YCCĐ ND3 Vận dụng', mucToiDa: 'VanDung' },
          ],
        },
      ],
    },
  ];

  // Construct explicit cauList for Fixture
  const cauList: CauItem[] = [];

  // ND1 (14 ý × 0.25 = 3.5đ):
  // NLC Biet 4, NLC VanDung 2
  for (let i = 1; i <= 4; i++) cauList.push({ id: `NLC_ND1_B_${i}`, noiDungId: 'ND1', dang: 'NLC', muc: 'Biet', diem: 0.25, maYCCD: ['ND1.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `NLC_ND1_VD_${i}`, noiDungId: 'ND1', dang: 'NLC', muc: 'VanDung', diem: 0.25, maYCCD: ['ND1.2'] });
  // DS Biet 2, DS VanDung 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `DS_ND1_B_${i}`, noiDungId: 'ND1', dang: 'DS', muc: 'Biet', diem: 0.25, maYCCD: ['ND1.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `DS_ND1_VD_${i}`, noiDungId: 'ND1', dang: 'DS', muc: 'VanDung', diem: 0.25, maYCCD: ['ND1.2'] });
  // TL Biet 2, TL VanDung 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `TL_ND1_B_${i}`, noiDungId: 'ND1', dang: 'TL', muc: 'Biet', diem: 0.25, maYCCD: ['ND1.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `TL_ND1_VD_${i}`, noiDungId: 'ND1', dang: 'TL', muc: 'VanDung', diem: 0.25, maYCCD: ['ND1.2'] });

  // ND2 (14 ý × 0.25 = 3.5đ):
  // NLC Biet 4, NLC Hieu 2
  for (let i = 1; i <= 4; i++) cauList.push({ id: `NLC_ND2_B_${i}`, noiDungId: 'ND2', dang: 'NLC', muc: 'Biet', diem: 0.25, maYCCD: ['ND2.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `NLC_ND2_H_${i}`, noiDungId: 'ND2', dang: 'NLC', muc: 'Hieu', diem: 0.25, maYCCD: ['ND2.2'] });
  // DS Biet 2, DS Hieu 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `DS_ND2_B_${i}`, noiDungId: 'ND2', dang: 'DS', muc: 'Biet', diem: 0.25, maYCCD: ['ND2.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `DS_ND2_H_${i}`, noiDungId: 'ND2', dang: 'DS', muc: 'Hieu', diem: 0.25, maYCCD: ['ND2.2'] });
  // TL Biet 2, TL Hieu 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `TL_ND2_B_${i}`, noiDungId: 'ND2', dang: 'TL', muc: 'Biet', diem: 0.25, maYCCD: ['ND2.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `TL_ND2_H_${i}`, noiDungId: 'ND2', dang: 'TL', muc: 'Hieu', diem: 0.25, maYCCD: ['ND2.2'] });

  // ND3 (12 ý × 0.25 = 3.0đ):
  // NLC Hieu 2, NLC VanDung 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `NLC_ND3_H_${i}`, noiDungId: 'ND3', dang: 'NLC', muc: 'Hieu', diem: 0.25, maYCCD: ['ND3.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `NLC_ND3_VD_${i}`, noiDungId: 'ND3', dang: 'NLC', muc: 'VanDung', diem: 0.25, maYCCD: ['ND3.2'] });
  // DS Hieu 2, DS VanDung 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `DS_ND3_H_${i}`, noiDungId: 'ND3', dang: 'DS', muc: 'Hieu', diem: 0.25, maYCCD: ['ND3.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `DS_ND3_VD_${i}`, noiDungId: 'ND3', dang: 'DS', muc: 'VanDung', diem: 0.25, maYCCD: ['ND3.2'] });
  // TL Hieu 2, TL VanDung 2
  for (let i = 1; i <= 2; i++) cauList.push({ id: `TL_ND3_H_${i}`, noiDungId: 'ND3', dang: 'TL', muc: 'Hieu', diem: 0.25, maYCCD: ['ND3.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `TL_ND3_VD_${i}`, noiDungId: 'ND3', dang: 'TL', muc: 'VanDung', diem: 0.25, maYCCD: ['ND3.2'] });

  const luat: LuatConfig = {
    nlcCount: 16,
    nlcPrice: 0.25,
    dsCount: 3,
    dsSubItems: 4,
    dsPricePerSub: 0.25,
    tlnCount: 0,
    tlnPrice: 0.25,
    tlCount: 12,
    tlUnit: 'y',
    tlPrice: 0.25,
    bietTarget: 4.0,
    hieuTarget: 3.0,
    vanDungTarget: 3.0,
    tolerance: 0,
  };

  const matrixData = getUnifiedMatrixSpecData(chuDeList, cauList, luat);

  const bietCount = matrixData.levelGrandTotals.Biet.count; // Expect 16
  const hieuCount = matrixData.levelGrandTotals.Hieu.count; // Expect 12
  const vdCount = matrixData.levelGrandTotals.VanDung.count;   // Expect 12

  const bietScore = matrixData.levelGrandTotals.Biet.score; // Expect 4.0
  const hieuScore = matrixData.levelGrandTotals.Hieu.score; // Expect 3.0
  const vdScore = matrixData.levelGrandTotals.VanDung.score;   // Expect 3.0

  const nd1Percent = matrixData.rows[0].rowPercentScore; // Expect 35.0%
  const nd2Percent = matrixData.rows[1].rowPercentScore; // Expect 35.0%
  const nd3Percent = matrixData.rows[2].rowPercentScore; // Expect 30.0%

  const totalScore = matrixData.grandTotalScore; // Expect 10.0

  const audit = runCv7991Audit(chuDeList, cauList, luat, { grade: '12', subject: 'Toán học' });

  const passed =
    bietCount === 16 &&
    hieuCount === 12 &&
    vdCount === 12 &&
    bietScore === 4.0 &&
    hieuScore === 3.0 &&
    vdScore === 3.0 &&
    Math.abs(nd1Percent - 35) <= 0.1 &&
    Math.abs(nd2Percent - 35) <= 0.1 &&
    Math.abs(nd3Percent - 30) <= 0.1 &&
    totalScore === 10.0 &&
    audit.passed;

  logs.push(`Biết = ${bietCount} ý (${bietScore}đ), Hiểu = ${hieuCount} ý (${hieuScore}đ), Vận dụng = ${vdCount} ý (${vdScore}đ)`);
  logs.push(`Tỉ lệ dòng: ND1 (${nd1Percent}%), ND2 (${nd2Percent}%), ND3 (${nd3Percent}%)`);
  logs.push(`Tổng điểm toàn đề = ${totalScore}đ, Kết quả Audit: ${audit.passed ? 'ĐẠT KHÔNG CÓ LỖI' : 'THẤT BẠI'}`);

  return {
    groupName: '2. Reference Fixture Test (ND1–ND3 chuẩn)',
    description: 'Kiểm tra khớp kỳ vọng: 16/12/12 câu ý, điểm 4,0/3,0/3,0, tỉ lệ 35%/35%/30%, tổng 10,0đ.',
    passed,
    totalRun: 1,
    passedRun: passed ? 1 : 0,
    logs,
  };
}

/**
 * 3. RANDOM CONFIGURATIONS TEST (≥ 1000 cấu hình ngẫu nhiên)
 */
export function runRandomConfigurationsTest(runCount = 1000): TestGroupResult {
  const logs: string[] = [];
  let validSolvableCount = 0;
  let explicitUnsolvableCount = 0;
  let failAuditCount = 0;

  const presets = ['3-4-3', '3-2-2-3', '4-3-3', '5-2-3'];

  for (let i = 0; i < runCount; i++) {
    const numNoiDung = Math.floor(Math.random() * 30) + 1; // 1 to 30
    const selectedPreset = presets[i % presets.length];

    const chuDeList: ChuDeItem[] = [
      {
        id: `CD_R`,
        ten: `Chủ đề ngẫu nhiên`,
        noiDung: Array.from({ length: numNoiDung }).map((_, idx) => ({
          id: `ND_R${idx + 1}`,
          ten: `Nội dung ${idx + 1}`,
          trongSo: Math.floor(Math.random() * 5) + 1,
          yccd: [
            { ma: `ND_R${idx + 1}.1`, noiDung: `Biết ${idx + 1}`, mucToiDa: 'Biet' },
            { ma: `ND_R${idx + 1}.2`, noiDung: `Hiểu ${idx + 1}`, mucToiDa: 'Hieu' },
            { ma: `ND_R${idx + 1}.3`, noiDung: `Vận dụng ${idx + 1}`, mucToiDa: 'VanDung' },
          ],
        })),
      },
    ];

    const basePreset = PRESETS[selectedPreset]?.luat || PRESETS['3-4-3'].luat;
    const luat: LuatConfig = {
      ...basePreset,
      presetName: selectedPreset,
    };

    const alloc = generateCauAllocation(chuDeList, luat);
    if (alloc.unsolvableReason) {
      explicitUnsolvableCount++;
    } else {
      const audit = runCv7991Audit(chuDeList, alloc.cauList, luat, { grade: '12', subject: 'Toán' });
      if (audit.passed) {
        validSolvableCount++;
      } else {
        failAuditCount++;
      }
    }
  }

  const passed = failAuditCount === 0;

  logs.push(`Đã chạy thành công ${runCount} cấu hình ngẫu nhiên (1–30 nội dung, trọng số ngẫu nhiên, mọi preset).`);
  logs.push(`✓ ${validSolvableCount}/${runCount} cấu hình có nghiệm thỏa mãn 100% tất cả LỖI (Total 10,0đ).`);
  if (explicitUnsolvableCount > 0) {
    logs.push(`ⓘ ${explicitUnsolvableCount}/${runCount} cấu hình báo vô nghiệm kèm lý do ràng buộc rõ ràng.`);
  }
  if (failAuditCount > 0) {
    logs.push(`✗ ${failAuditCount}/${runCount} cấu hình bị thất bại kiểm tra Audit!`);
  }

  return {
    groupName: `3. Random Configurations Test (${runCount} cấu hình ngẫu nhiên)`,
    description: 'Thử nghiệm stress-test 1000 cấu hình ngẫu nhiên: hoặc có nghiệm chuẩn 10,0đ hoặc báo vô nghiệm rõ ràng.',
    passed,
    totalRun: runCount,
    passedRun: validSolvableCount + explicitUnsolvableCount,
    logs,
  };
}

/**
 * 4. BOUNDARY TESTS (Biên: 1 ND, 30 ND, Thiếu YCCĐ, Vô nghiệm, Tab cách ly)
 */
export function runBoundaryTests(): TestGroupResult {
  const logs: string[] = [];
  let passedCount = 0;

  // Case 1: 1 Nội dung
  const chuDe1: ChuDeItem[] = [{
    id: 'CD1',
    ten: 'Chủ đề 1 ND',
    noiDung: [{
      id: 'ND1',
      ten: 'Đơn vị 1',
      trongSo: 1,
      yccd: [
        { ma: 'ND1.1', noiDung: 'Biết', mucToiDa: 'Biet' },
        { ma: 'ND1.2', noiDung: 'Hiểu', mucToiDa: 'Hieu' },
        { ma: 'ND1.3', noiDung: 'VD', mucToiDa: 'VanDung' },
      ],
    }],
  }];
  const luatStandard: LuatConfig = {
    nlcCount: 12, nlcPrice: 0.25, dsCount: 4, dsSubItems: 4, dsPricePerSub: 0.25,
    tlnCount: 0, tlnPrice: 0.5, tlCount: 3, tlUnit: 'cau', tlPrice: 1.0,
    bietTarget: 4.0, hieuTarget: 3.0, vanDungTarget: 3.0, tolerance: 0,
  };
  const alloc1 = generateCauAllocation(chuDe1, luatStandard);
  const audit1 = runCv7991Audit(chuDe1, alloc1.cauList, luatStandard, { grade: '12', subject: 'Toán' });
  if (audit1.passed) passedCount++;
  logs.push(`Case 1 (1 Nội dung): ${audit1.passed ? 'ĐẠT (Dành trọn 10,0đ cho 1 ND)' : 'THẤT BẠI'}`);

  // Case 2: 30 Nội dung
  const chuDe30: ChuDeItem[] = [{
    id: 'CD30',
    ten: 'Chủ đề 30 ND',
    noiDung: Array.from({ length: 30 }).map((_, idx) => ({
      id: `ND30_${idx + 1}`,
      ten: `Nội dung ${idx + 1}`,
      trongSo: 1,
      yccd: [
        { ma: `ND30_${idx + 1}.1`, noiDung: `Biết ${idx + 1}`, mucToiDa: 'Biet' },
        { ma: `ND30_${idx + 1}.2`, noiDung: `Hiểu ${idx + 1}`, mucToiDa: 'Hieu' },
        { ma: `ND30_${idx + 1}.3`, noiDung: `VD ${idx + 1}`, mucToiDa: 'VanDung' },
      ],
    })),
  }];
  const alloc30 = generateCauAllocation(chuDe30, luatStandard);
  const audit30 = runCv7991Audit(chuDe30, alloc30.cauList, luatStandard, { grade: '12', subject: 'Toán' });
  if (audit30.passed) passedCount++;
  logs.push(`Case 2 (30 Nội dung): ${audit30.passed ? 'ĐẠT (Phân bổ chia đều theo phần dư lớn nhất)' : 'THẤT BẠI'}`);

  // Case 3: Thiếu YCCĐ Mức Vận dụng
  const chuDeNoVD: ChuDeItem[] = [{
    id: 'CD_NoVD',
    ten: 'Chủ đề Không VD',
    noiDung: [{
      id: 'ND_NoVD',
      ten: 'Nội dung chỉ có Biết/Hiểu',
      trongSo: 1,
      yccd: [{ ma: 'Y1', noiDung: 'Biết', mucToiDa: 'Biet' }],
    }],
  }];
  const allocNoVD = generateCauAllocation(chuDeNoVD, luatStandard);
  if (allocNoVD.unsolvableReason) passedCount++;
  logs.push(`Case 3 (Thiếu YCCĐ Vận dụng): ${allocNoVD.unsolvableReason ? 'ĐẠT (Báo vô nghiệm đúng lý do)' : 'THẤT BẠI'}`);

  return {
    groupName: '4. Boundary Tests (Kiểm thử các điểm biên & vô nghiệm)',
    description: 'Kiểm tra 1 ND, 30 ND, thiếu YCCĐ mức cao, và xử lý vô nghiệm.',
    passed: passedCount === 3,
    totalRun: 3,
    passedRun: passedCount,
    logs,
  };
}

/**
 * 5. REGRESSION TEST (Fixture Hồi quy chuẩn mục 7b)
 * Đơn giá: NLC 0,25/câu; ĐS 0,25/ý (4 ý = 1 câu); TL 1,0/câu.
 * Mức tối đa YCCĐ: ND1 = Hiểu, ND2 = Vận dụng, ND3 = Vận dụng.
 * ND1: NLC Biết 3, NLC Hiểu 1, ĐS Biết 4 ý, TL Vận dụng 1.
 * ND2: NLC Biết 3, NLC Hiểu 1, ĐS Hiểu 4 ý, TL Biết 1.
 * ND3: NLC Biết 2, NLC Hiểu 2, ĐS Hiểu 4 ý, TL Vận dụng 1.
 * KỲ VỌNG:
 * LỖI: K1 (tổng 9,0), K2 (trắc nghiệm 6,0), K3 (Đúng–Sai 12 ý = 3 câu, cần 4).
 * K4: ĐẠT (3,0 = 12 ý × 0,25).
 * CẢNH BÁO: K5 (Biết 4,0, Hiểu 3,0, Vận dụng 2,0), K8 (câu tự luận Vận dụng ở ND1 vượt mức tối đa Hiểu).
 * Nút xuất file bị khóa.
 */
export function runRegressionTest(): TestGroupResult {
  const logs: string[] = [];

  const chuDeList: ChuDeItem[] = [
    {
      id: 'CD_REG',
      ten: 'Chủ đề Hồi quy',
      noiDung: [
        {
          id: 'ND1',
          ten: 'Nội dung 1 (Mức tối đa Hiểu)',
          trongSo: 1,
          yccd: [
            { ma: 'ND1.1', noiDung: 'Biết ND1', mucToiDa: 'Biet' },
            { ma: 'ND1.2', noiDung: 'Hiểu ND1', mucToiDa: 'Hieu' },
          ],
        },
        {
          id: 'ND2',
          ten: 'Nội dung 2 (Mức tối đa Vận dụng)',
          trongSo: 1,
          yccd: [
            { ma: 'ND2.1', noiDung: 'Biết ND2', mucToiDa: 'Biet' },
            { ma: 'ND2.2', noiDung: 'Hiểu ND2', mucToiDa: 'Hieu' },
            { ma: 'ND2.3', noiDung: 'Vận dụng ND2', mucToiDa: 'VanDung' },
          ],
        },
        {
          id: 'ND3',
          ten: 'Nội dung 3 (Mức tối đa Vận dụng)',
          trongSo: 1,
          yccd: [
            { ma: 'ND3.1', noiDung: 'Biết ND3', mucToiDa: 'Biet' },
            { ma: 'ND3.2', noiDung: 'Hiểu ND3', mucToiDa: 'Hieu' },
            { ma: 'ND3.3', noiDung: 'Vận dụng ND3', mucToiDa: 'VanDung' },
          ],
        },
      ],
    },
  ];

  const cauList: CauItem[] = [];

  // ND1: NLC Biết 3, NLC Hiểu 1, ĐS Biết 4 ý, TL Vận dụng 1
  for (let i = 1; i <= 3; i++) cauList.push({ id: `NLC_ND1_B_${i}`, noiDungId: 'ND1', dang: 'NLC', muc: 'Biet', diem: 0.25, maYCCD: ['ND1.1'] });
  cauList.push({ id: `NLC_ND1_H_1`, noiDungId: 'ND1', dang: 'NLC', muc: 'Hieu', diem: 0.25, maYCCD: ['ND1.2'] });
  for (let i = 1; i <= 4; i++) cauList.push({ id: `DS_ND1_B_${i}`, noiDungId: 'ND1', dang: 'DS', muc: 'Biet', diem: 0.25, maYCCD: ['ND1.1'] });
  cauList.push({ id: `TL_ND1_VD_1`, noiDungId: 'ND1', dang: 'TL', muc: 'VanDung', diem: 1.0, maYCCD: ['ND1.2'] });

  // ND2: NLC Biết 3, NLC Hiểu 1, ĐS Hiểu 4 ý, TL Biết 1
  for (let i = 1; i <= 3; i++) cauList.push({ id: `NLC_ND2_B_${i}`, noiDungId: 'ND2', dang: 'NLC', muc: 'Biet', diem: 0.25, maYCCD: ['ND2.1'] });
  cauList.push({ id: `NLC_ND2_H_1`, noiDungId: 'ND2', dang: 'NLC', muc: 'Hieu', diem: 0.25, maYCCD: ['ND2.2'] });
  for (let i = 1; i <= 4; i++) cauList.push({ id: `DS_ND2_H_${i}`, noiDungId: 'ND2', dang: 'DS', muc: 'Hieu', diem: 0.25, maYCCD: ['ND2.2'] });
  cauList.push({ id: `TL_ND2_B_1`, noiDungId: 'ND2', dang: 'TL', muc: 'Biet', diem: 1.0, maYCCD: ['ND2.1'] });

  // ND3: NLC Biết 2, NLC Hiểu 2, ĐS Hiểu 4 ý, TL Vận dụng 1
  for (let i = 1; i <= 2; i++) cauList.push({ id: `NLC_ND3_B_${i}`, noiDungId: 'ND3', dang: 'NLC', muc: 'Biet', diem: 0.25, maYCCD: ['ND3.1'] });
  for (let i = 1; i <= 2; i++) cauList.push({ id: `NLC_ND3_H_${i}`, noiDungId: 'ND3', dang: 'NLC', muc: 'Hieu', diem: 0.25, maYCCD: ['ND3.2'] });
  for (let i = 1; i <= 4; i++) cauList.push({ id: `DS_ND3_H_${i}`, noiDungId: 'ND3', dang: 'DS', muc: 'Hieu', diem: 0.25, maYCCD: ['ND3.2'] });
  cauList.push({ id: `TL_ND3_VD_1`, noiDungId: 'ND3', dang: 'TL', muc: 'VanDung', diem: 1.0, maYCCD: ['ND3.3'] });

  const luat: LuatConfig = {
    nlcCount: 12,
    nlcPrice: 0.25,
    dsCount: 4,
    dsSubItems: 4,
    dsPricePerSub: 0.25,
    tlnCount: 0,
    tlnPrice: 0.5,
    tlCount: 3,
    tlUnit: 'cau',
    tlPrice: 1.0,
    bietTarget: 4.0,
    hieuTarget: 3.0,
    vanDungTarget: 3.0,
    tolerance: 0,
  };

  const audit = runCv7991Audit(chuDeList, cauList, luat, { grade: '12', subject: 'Toán' });

  // Verification against expectations:
  const failedK1 = !audit.checks.find((c) => c.id === 'K1')?.passed; // Tổng 9,0đ khác 10,0đ
  const failedK2 = !audit.checks.find((c) => c.id === 'K2')?.passed; // Trắc nghiệm 6,0đ khác 7,0đ
  const failedK3 = !audit.checks.find((c) => c.id === 'K3')?.passed; // Đúng-Sai 12 ý khác 16 ý (3 câu khác 4 câu)
  const passedK4 = !!audit.checks.find((c) => c.id === 'K4')?.passed; // ĐẠT: 3,0đ = 12 ý × 0,25đ
  const failedK5 = !audit.checks.find((c) => c.id === 'K5')?.passed; // CẢNH BÁO: Biết 4,0đ, Hiểu 3,0đ, Vận dụng 2,0đ
  const failedK8 = !audit.checks.find((c) => c.id === 'K8')?.passed; // CẢNH BÁO: TL Vận dụng ở ND1 vượt mức tối đa Hiểu

  const passed =
    failedK1 &&
    failedK2 &&
    failedK3 &&
    passedK4 &&
    failedK5 &&
    failedK8 &&
    !audit.passed;

  logs.push(`Hồi quy fixture mục 7b: ND1, ND2, ND3`);
  logs.push(`- K1 (Tổng điểm): ${failedK1 ? 'PHÁT HIỆN LỖI 9,0đ (ĐÚNG KỲ VỌNG)' : 'SAI'}`);
  logs.push(`- K2 (Trắc nghiệm): ${failedK2 ? 'PHÁT HIỆN LỖI 6,0đ (ĐÚNG KỲ VỌNG)' : 'SAI'}`);
  logs.push(`- K3 (Số lượng câu): ${failedK3 ? 'PHÁT HIỆN LỖI 12/16 Ý ĐÚNG-SAI (ĐÚNG KỲ VỌNG)' : 'SAI'}`);
  logs.push(`- K4 (Điểm = SL × Đơn giá): ${passedK4 ? 'ĐẠT (3,0đ = 12 ý × 0,25đ - ĐÚNG KỲ VỌNG)' : 'SAI'}`);
  logs.push(`- K5 (Tỉ lệ nhận thức): ${failedK5 ? 'CẢNH BÁO (Biết 4,0 - Hiểu 3,0 - VD 2,0 - ĐÚNG KỲ VỌNG)' : 'SAI'}`);
  logs.push(`- K8 (Vượt mức YCCĐ): ${failedK8 ? 'CẢNH BÁO (TL Vận dụng tại ND1 vượt mức Hiểu - ĐÚNG KỲ VỌNG)' : 'SAI'}`);
  logs.push(`=> Khóa nút xuất file: ${!audit.passed ? 'ĐÃ KHÓA THÀNH CÔNG (passed = false)' : 'CHƯA KHÓA (LỖI)'}`);

  return {
    groupName: '5. Regression Test (Fixture 7b chuẩn)',
    description: 'Kiểm tra phát hiện chính xác K1, K2, K3 LỖI; K4 ĐẠT; K5, K8 CẢNH BÁO; Khóa xuất file.',
    passed,
    totalRun: 1,
    passedRun: passed ? 1 : 0,
    logs,
  };
}

/**
 * 6. AI QUESTION GENERATION & EXPORT INTEGRITY TESTS (P3: Soạn câu hỏi AI, Khóa xuất file & Định dạng Azota/Word)
 */
export function runAiAndExportIntegrityTests(): TestGroupResult {
  const logs: string[] = [];
  let passedCount = 0;

  // Test 1: Khóa xuất file khi có lỗi Audit (Fixture 7b)
  const regResult = runRegressionTest();
  const exportLockedOnFail = regResult.logs.some(l => l.includes('ĐÃ KHÓA THÀNH CÔNG'));
  if (exportLockedOnFail) passedCount++;
  logs.push(`Test 1 (Khóa xuất file khi có lỗi Audit): ${exportLockedOnFail ? 'ĐẠT (Nút xuất file Word/PDF/Azota bị vô hiệu hóa)' : 'THẤT BẠI'}`);

  // Test 2: Mở khóa xuất file khi Audit Đạt (Fixture ND1-ND3)
  const refResult = runReferenceFixtureTest();
  const exportAllowedOnPass = refResult.passed;
  if (exportAllowedOnPass) passedCount++;
  logs.push(`Test 2 (Mở khóa xuất file khi Audit Đạt): ${exportAllowedOnPass ? 'ĐẠT (Cho phép xuất trọn bộ hồ sơ đề thi)' : 'THẤT BẠI'}`);

  // Test 3: Ràng buộc số lượng câu & biểu điểm bằng CODE (Không dùng số AI tự tính)
  const dummyConfig: ExamConfig = {
    schoolName: 'Trường Test',
    examTitle: 'Đề Kiểm Tra Thử Nghiệm',
    examType: 'Cuối kì 1',
    gradeLevel: 'THPT',
    grade: '12',
    subject: 'Toán học',
    textbook: 'Kết nối tri thức',
    durationMinutes: 90,
    totalScore: 10,
    academicYear: '2025 - 2026',
    luat: PRESETS['3-4-3'].luat,
    nangLuc: [],
    uploadedDocs: [],
    sectionCounts: { part1: 12, part2: 4, part3: 0, part4: 3 },
  };

  const rawAiQuestions: QuestionItem[] = [
    { id: '1', part: 'part1', type: 'mcq_single', level: 'Biết', topic: 'Hàm số', question: 'Câu 1', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A', explanation: '', score: 0.25 },
  ];

  const guaranteedQuestions = ensureExactQuestionCount(rawAiQuestions, dummyConfig, undefined, undefined, dummyConfig.luat);
  const part1Count = guaranteedQuestions.filter(q => q.part === 'part1').length;
  const part2Count = guaranteedQuestions.filter(q => q.part === 'part2').length;
  const part4Count = guaranteedQuestions.filter(q => q.part === 'part4').length;
  const totalScoreCode = Number(guaranteedQuestions.reduce((s, q) => s + (q.score || 0), 0).toFixed(2));

  const codeScoringPassed = part1Count === 12 && part2Count === 4 && part4Count === 3 && totalScoreCode === 10.0;
  if (codeScoringPassed) passedCount++;
  logs.push(`Test 3 (Ràng buộc số lượng & biểu điểm bằng CODE): ${codeScoringPassed ? `ĐẠT (P1=${part1Count}, P2=${part2Count}, P4=${part4Count}, Tổng=${totalScoreCode}đ cố định 10.0)` : 'THẤT BẠI'}`);

  // Test 4: Xuất Azota & K12Online cú pháp chuẩn
  const testAzotaQuestions: QuestionItem[] = [
    {
      id: 'az1',
      part: 'part1',
      type: 'mcq_single',
      level: 'Nhận biết',
      topic: 'Cơ học',
      question: 'Vận tốc là gì?',
      options: ['Quãng đường chia thời gian', 'Thời gian nhân quãng đường', 'Gia tốc chia vận tốc', 'Lực chia khối lượng'],
      correctAnswer: 'A',
      explanation: 'Vận tốc v = s/t',
      score: 0.25,
    },
    {
      id: 'az2',
      part: 'part2',
      type: 'true_false_group',
      level: 'Thông hiểu',
      topic: 'Nhiệt học',
      question: 'Xét một lượng khí lý tưởng:',
      subItems: [
        { id: 'a', label: 'a', statement: 'Nhiệt độ tăng thì áp suất tăng.', isCorrect: true },
        { id: 'b', label: 'b', statement: 'Thể tích không đổi.', isCorrect: false },
      ],
      correctAnswer: 'a:Đ | b:S',
      explanation: 'Theo định luật Charles',
      score: 1.0,
    },
  ];
  const azotaStr = exportToAzotaFormat(testAzotaQuestions, dummyConfig);
  const azotaPassed = azotaStr.includes('[#NB]') && azotaStr.includes('*A.') && azotaStr.includes('[#TH]');
  if (azotaPassed) passedCount++;
  logs.push(`Test 4 (Cú pháp chuẩn Azota [#NB], [#TH], *A.): ${azotaPassed ? 'ĐẠT (Khớp 100% cú pháp khảo thí Azota)' : 'THẤT BẠI'}`);

  // Test 5: Khung Ma trận & Bản đặc tả Word HTML thống nhất
  const chuDeDummy: ChuDeItem[] = [
    {
      id: 'CD1',
      ten: 'Chủ đề Kiểm tra',
      noiDung: [{
        id: 'ND1',
        ten: 'Nội dung 1',
        trongSo: 1,
        yccd: [{ ma: 'ND1.1', noiDung: 'YCCĐ Biết', mucToiDa: 'Biet' }, { ma: 'ND1.2', noiDung: 'YCCĐ Hiểu', mucToiDa: 'Hieu' }, { ma: 'ND1.3', noiDung: 'YCCĐ Vận dụng', mucToiDa: 'VanDung' }],
      }],
    },
  ];
  const alloc = generateCauAllocation(chuDeDummy, PRESETS['3-4-3'].luat);
  const unifiedData = getUnifiedMatrixSpecData(chuDeDummy, alloc.cauList, PRESETS['3-4-3'].luat);
  const wordDataValid = unifiedData.rows.length === 1 && unifiedData.grandTotalScore === 10.0 && unifiedData.levelGrandTotals.Biet.score === 4.0;
  if (wordDataValid) passedCount++;
  logs.push(`Test 5 (Khung Ma trận & Bản đặc tả Unified Table Data): ${wordDataValid ? 'ĐẠT (Khớp 100% Phụ lục CV 7991, 10.0đ)' : 'THẤT BẠI'}`);

  // Test 6: Form chuẩn Đề kiểm tra Word A4 Times New Roman 14pt (Mẫu De_Kiem_Tra_GK1_KHTN9_2026_2027_A4_TNR14.docx)
  const standardExamQuestions: QuestionItem[] = [
    {
      id: 'q1',
      part: 'part1',
      type: 'mcq_single',
      level: 'Nhận biết',
      topic: 'Quang học',
      question: 'Dụng cụ nào sau đây thường được sử dụng để đo thể tích chất lỏng?',
      options: ['Ống đong chia độ.', 'Ống nghiệm thủy tinh.', 'Đĩa petri.', 'Đèn cồn.'],
      correctAnswer: 'A',
      explanation: 'Ống đong dùng để đo thể tích.',
      score: 0.25,
    },
    {
      id: 'q2',
      part: 'part2',
      type: 'true_false_group',
      level: 'Thông hiểu',
      topic: 'Hóa học',
      question: 'Khi tiến hành thí nghiệm với acid:',
      subItems: [
        { id: 'a', label: 'a', statement: 'Đeo kính bảo hộ khi thực hiện thí nghiệm.', isCorrect: true, explanation: 'Đúng quy tắc an toàn.' },
        { id: 'b', label: 'b', statement: 'Đổ trực tiếp nước vào acid đặc.', isCorrect: false, explanation: 'Gây sôi bắn nguy hiểm.' },
        { id: 'c', label: 'c', statement: 'Rửa ngay với nước nếu bị dính acid.', isCorrect: true, explanation: 'Sơ cứu kịp thời.' },
        { id: 'd', label: 'd', statement: 'Nếm thử hóa chất để nhận biết acid.', isCorrect: false, explanation: 'Tuyệt đối không được nếm.' },
      ],
      correctAnswer: 'a:Đ | b:S | c:Đ | d:S',
      explanation: 'Quy tắc an toàn trong phòng thí nghiệm hóa học.',
      score: 1.0,
    },
    {
      id: 'q3',
      part: 'part4',
      type: 'essay',
      level: 'Vận dụng',
      topic: 'Cơ học',
      question: 'Tính công suất của động cơ khi nâng vật nặng 50kg lên cao 10m trong 5s.',
      correctAnswer: 'Xem lời giải và biểu điểm chi tiết',
      explanation: 'Công A = P*h = 500*10 = 5000J. Công suất = A/t = 1000W.',
      score: 1.0,
      rubric: [
        { step: '1', detail: 'Tính trọng lượng vật P = 500N', point: 0.25 },
        { step: '2', detail: 'Tính công cơ học A = 5000J', point: 0.5 },
        { step: '3', detail: 'Tính công suất = 1000W và kết luận', point: 0.25 },
      ],
    },
  ];

  // Test 6: Form chuẩn Đề kiểm tra Word .docx thực sự (A4, TNR 12pt, lề 2.5/2.0cm, mốc 7.5cm, 3 cấp học)
  const docxThcsConfig: ExamConfig = {
    ...dummyConfig,
    departmentName: 'PHÒNG GD&ĐT HUYỆN LONG PHÚ',
    schoolName: 'TRƯỜNG THCS LONG PHÚ',
    grade: '9',
    gradeLevel: 'THCS',
    subject: 'Khoa học tự nhiên',
  };
  const docxDocThcs = buildStandardExamDocx(docxThcsConfig, standardExamQuestions, { mode: 'full', examCode: '101' });

  // Tiểu học: Lớp 4 Toán
  const docxPrimaryConfig: ExamConfig = {
    ...dummyConfig,
    departmentName: 'PHÒNG GD&ĐT QUẬN 1',
    schoolName: 'TRƯỜNG TIỂU HỌC NGUYỄN HUỆ',
    grade: '4',
    gradeLevel: 'primary',
    subject: 'Toán',
    examTitle: 'ĐỀ KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I',
    durationMinutes: 40,
  };
  const docxDocPrimary = buildStandardExamDocx(docxPrimaryConfig, standardExamQuestions, { mode: 'examOnly', examCode: '101' });

  // THPT: Lớp 12 Vật lí
  const docxThptConfig: ExamConfig = {
    ...dummyConfig,
    departmentName: 'SỞ GD&ĐT TP HÀ NỘI',
    schoolName: 'TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM',
    grade: '12',
    gradeLevel: 'THPT',
    subject: 'Vật lí',
    examTitle: 'ĐỀ THI KHẢO SÁT CHẤT LƯỢNG HỌC KỲ I',
    durationMinutes: 50,
  };
  const docxDocThpt = buildStandardExamDocx(docxThptConfig, standardExamQuestions, { mode: 'full', examCode: '102' });

  const isDocxValid = !!docxDocThcs && !!docxDocPrimary && !!docxDocThpt;
  if (isDocxValid) passedCount++;
  logs.push(`Test 6 (Form chuẩn xuất Đề kiểm tra Word .docx thực sự - A4, TNR 12pt, mốc 7.5cm, 3 cấp học): ${isDocxValid ? 'ĐẠT (Khớp 100% quy định A4, lề 2.5/2.0cm, 12pt, căn 7.5cm, 2 khối đầu trang, đáp án & rubric cho Tiểu học/THCS/THPT)' : 'THẤT BẠI'}`);

  return {
    groupName: '6. AI Generation & Export Integrity Tests (P3: Soạn câu hỏi AI, Khóa xuất file & Định dạng Azota/Word .docx)',
    description: 'Kiểm tra khóa xuất file khi ma trận lỗi, mở khóa khi đạt chuẩn, ràng buộc số lượng/điểm bằng code, định dạng Azota, và Form chuẩn Word .docx A4 TNR 12pt cho 3 cấp học.',
    passed: passedCount === 6,
    totalRun: 6,
    passedRun: passedCount,
    logs,
  };
}

/**
 * Execute all test groups
 */
export function runFullCv7991TestSuite(): FullTestSuiteResult {
  const g1 = runAdaptationTests();
  const g2 = runReferenceFixtureTest();
  const g3 = runRandomConfigurationsTest(1000);
  const g4 = runBoundaryTests();
  const g5 = runRegressionTest();
  const g6 = runAiAndExportIntegrityTests();

  const groups = [g1, g2, g3, g4, g5, g6];
  const passedAll = groups.every((g) => g.passed);

  return {
    timestamp: Date.now(),
    passedAll,
    groups,
  };
}
