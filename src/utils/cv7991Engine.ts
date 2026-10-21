import {
  LuatConfig,
  ChuDeItem,
  NoiDungItem,
  YccdItem,
  CauItem,
  NangLucItem,
  QuestionType,
  CognitiveLevel,
} from '../types/exam';

/**
 * Default preset values for CV 7991 reference templates
 */
export const PRESETS: Record<string, { label: string; tag?: string; luat: LuatConfig }> = {
  '3-4-3': {
    label: 'Preset 3-4-3 (Mẫu tham khảo phổ biến GDPT 2018)',
    tag: 'Phụ lục CV 7991',
    luat: {
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
      presetName: '3-4-3',
      showTlnColumnsIfZero: false,
      groupYccdMode: 'by_level',
      showQuestionColInSpec: false,
    },
  },
  '3-2-2-3': {
    label: 'Preset 3-2-2-3 (Mẫu tham khảo có Trắc nghiệm Trả lời ngắn)',
    tag: 'Suy từ mẫu CV 7991',
    luat: {
      nlcCount: 12,
      nlcPrice: 0.25,
      dsCount: 2,
      dsSubItems: 4,
      dsPricePerSub: 0.25,
      tlnCount: 4,
      tlnPrice: 0.5,
      tlCount: 3,
      tlUnit: 'cau',
      tlPrice: 1.0,
      bietTarget: 4.0,
      hieuTarget: 3.0,
      vanDungTarget: 3.0,
      tolerance: 0,
      presetName: '3-2-2-3',
      showTlnColumnsIfZero: true,
      groupYccdMode: 'by_level',
      showQuestionColInSpec: false,
    },
  },
  '4-3-3': {
    label: 'Preset 4-3-3 (Biến thể tỷ lệ)',
    tag: 'biến thể, không theo chú thích 3 của Phụ lục',
    luat: {
      nlcCount: 16,
      nlcPrice: 0.25,
      dsCount: 3,
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
      presetName: '4-3-3',
      showTlnColumnsIfZero: false,
      groupYccdMode: 'by_level',
      showQuestionColInSpec: false,
    },
  },
  '5-2-3': {
    label: 'Preset 5-2-3 (Biến thể tỷ lệ)',
    tag: 'biến thể, không theo chú thích 3 của Phụ lục',
    luat: {
      nlcCount: 20,
      nlcPrice: 0.25,
      dsCount: 2,
      dsSubItems: 4,
      dsPricePerSub: 0.25,
      tlnCount: 0,
      tlnPrice: 0.5,
      tlCount: 3,
      tlUnit: 'cau',
      tlPrice: 1.0,
      bietTarget: 5.0,
      hieuTarget: 2.0,
      vanDungTarget: 3.0,
      tolerance: 0,
      presetName: '5-2-3',
      showTlnColumnsIfZero: false,
      groupYccdMode: 'by_level',
      showQuestionColInSpec: false,
    },
  },
};

/**
 * Largest Remainder Method (Hamilton Method) for integer allocation
 */
export function largestRemainderAllocation(
  totalToDistribute: number,
  items: Array<{ id: string; weight: number; maxAllowed?: number }>
): Record<string, number> {
  const result: Record<string, number> = {};
  if (totalToDistribute <= 0 || items.length === 0) return result;

  const validItems = items.filter((it) => (it.maxAllowed === undefined || it.maxAllowed > 0));
  if (validItems.length === 0) return result;

  const totalWeight = validItems.reduce((s, it) => s + (it.weight || 1), 0);
  if (totalWeight <= 0) return result;

  let allocatedSum = 0;
  const remainders: Array<{ id: string; remainder: number; quota: number }> = [];

  validItems.forEach((it) => {
    const rawQuota = (totalToDistribute * (it.weight || 1)) / totalWeight;
    let integerQuota = Math.floor(rawQuota);
    if (it.maxAllowed !== undefined && integerQuota > it.maxAllowed) {
      integerQuota = it.maxAllowed;
    }
    result[it.id] = integerQuota;
    allocatedSum += integerQuota;
    remainders.push({
      id: it.id,
      remainder: rawQuota - integerQuota,
      quota: integerQuota,
    });
  });

  let remaining = totalToDistribute - allocatedSum;
  remainders.sort((a, b) => b.remainder - a.remainder);

  let idx = 0;
  while (remaining > 0 && remainders.length > 0 && idx < remainders.length) {
    const target = remainders[idx];
    const itemConfig = validItems.find((v) => v.id === target.id);
    if (!itemConfig || itemConfig.maxAllowed === undefined || (result[target.id] || 0) < itemConfig.maxAllowed) {
      result[target.id] = (result[target.id] || 0) + 1;
      remaining--;
    }
    idx++;
    if (idx >= remainders.length && remaining > 0) {
      // Loop around if still remaining and allow overage if needed
      idx = 0;
      if (remainders.every((r) => itemConfig?.maxAllowed !== undefined && (result[r.id] || 0) >= itemConfig.maxAllowed!)) {
        break;
      }
    }
  }

  return result;
}

/**
 * Flattens ChuDeItem list to list of NoiDungItem with chapter title
 */
export function getAllNoiDungList(chuDeList: ChuDeItem[]): Array<{
  chuDeId: string;
  chuDeTen: string;
  noiDung: NoiDungItem;
}> {
  const list: Array<{ chuDeId: string; chuDeTen: string; noiDung: NoiDungItem }> = [];
  if (!Array.isArray(chuDeList)) return list;
  chuDeList.forEach((cd) => {
    if (!cd || !Array.isArray(cd.noiDung)) return;
    cd.noiDung.forEach((nd) => {
      if (nd) {
        list.push({ chuDeId: cd.id, chuDeTen: cd.ten, noiDung: nd });
      }
    });
  });
  return list;
}

/**
 * Checks available cognitive levels for a specific content item based on its YCCĐs
 */
export function getAvailableLevelsForNoiDung(noiDung: NoiDungItem): Record<CognitiveLevel, boolean> {
  if (!noiDung || !Array.isArray(noiDung.yccd)) {
    return { Biet: false, Hieu: false, VanDung: false };
  }
  const validYccd = noiDung.yccd.filter((y) => y && !y.noiDung?.includes('THIẾU YCCĐ'));
  const hasBiet = validYccd.some((y) => y && (y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung'));
  const hasHieu = validYccd.some((y) => y && (y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung'));
  const hasVanDung = validYccd.some((y) => y && y.mucToiDa === 'VanDung');

  return {
    Biet: hasBiet,
    Hieu: hasHieu,
    VanDung: hasVanDung,
  };
}

/**
 * Solves for integer distribution of (QuestionType × CognitiveLevel) satisfying luat constraints
 */
export function solveTypeLevelDistribution(
  luat: LuatConfig,
  levelAvailability: { Biet: boolean; Hieu: boolean; VanDung: boolean }
): {
  nlcDist: Record<CognitiveLevel, number>;
  dsDist: Record<CognitiveLevel, number>;
  tlnDist: Record<CognitiveLevel, number>;
  tlDist: Record<CognitiveLevel, number>;
} | null {
  // If standard preset and all levels available, use default pedagogical distribution
  if (luat.presetName === '3-4-3' && levelAvailability.Biet && levelAvailability.Hieu && levelAvailability.VanDung) {
    return {
      nlcDist: { Biet: 8, Hieu: 4, VanDung: 0 },
      dsDist: { Biet: 1, Hieu: 2, VanDung: 1 },
      tlnDist: { Biet: 0, Hieu: 0, VanDung: 0 },
      tlDist: { Biet: 1, Hieu: 0, VanDung: 2 },
    };
  }
  if (luat.presetName === '3-2-2-3' && levelAvailability.Biet && levelAvailability.Hieu && levelAvailability.VanDung) {
    return {
      nlcDist: { Biet: 8, Hieu: 4, VanDung: 0 },
      dsDist: { Biet: 1, Hieu: 1, VanDung: 0 },
      tlnDist: { Biet: 0, Hieu: 2, VanDung: 2 },
      tlDist: { Biet: 1, Hieu: 0, VanDung: 2 },
    };
  }
  if (luat.presetName === '4-3-3' && levelAvailability.Biet && levelAvailability.Hieu && levelAvailability.VanDung) {
    return {
      nlcDist: { Biet: 12, Hieu: 4, VanDung: 0 },
      dsDist: { Biet: 1, Hieu: 1, VanDung: 1 },
      tlnDist: { Biet: 0, Hieu: 0, VanDung: 0 },
      tlDist: { Biet: 0, Hieu: 1, VanDung: 2 },
    };
  }
  if (luat.presetName === '5-2-3' && levelAvailability.Biet && levelAvailability.Hieu && levelAvailability.VanDung) {
    return {
      nlcDist: { Biet: 16, Hieu: 4, VanDung: 0 },
      dsDist: { Biet: 1, Hieu: 1, VanDung: 0 },
      tlnDist: { Biet: 0, Hieu: 0, VanDung: 0 },
      tlDist: { Biet: 0, Hieu: 0, VanDung: 3 },
    };
  }

  // General Diophantine integer solver for custom or constrained parameters
  const dsSubItems = luat.dsSubItems || 4;
  const dsPricePerBig = dsSubItems * luat.dsPricePerSub;
  const tol = luat.tolerance || 0;

  let bestSolution: {
    nlcDist: Record<CognitiveLevel, number>;
    dsDist: Record<CognitiveLevel, number>;
    tlnDist: Record<CognitiveLevel, number>;
    tlDist: Record<CognitiveLevel, number>;
    penalty: number;
  } | null = null;

  for (let tlB = 0; tlB <= luat.tlCount; tlB++) {
    if (tlB > 0 && !levelAvailability.Biet) continue;
    for (let tlH = 0; tlH <= luat.tlCount - tlB; tlH++) {
      if (tlH > 0 && !levelAvailability.Hieu) continue;
      const tlVD = luat.tlCount - tlB - tlH;
      if (tlVD > 0 && !levelAvailability.VanDung) continue;

      for (let dsB = 0; dsB <= luat.dsCount; dsB++) {
        if (dsB > 0 && !levelAvailability.Biet) continue;
        for (let dsH = 0; dsH <= luat.dsCount - dsB; dsH++) {
          if (dsH > 0 && !levelAvailability.Hieu) continue;
          const dsVD = luat.dsCount - dsB - dsH;
          if (dsVD > 0 && !levelAvailability.VanDung) continue;

          for (let tlnB = 0; tlnB <= luat.tlnCount; tlnB++) {
            if (tlnB > 0 && !levelAvailability.Biet) continue;
            for (let tlnH = 0; tlnH <= luat.tlnCount - tlnB; tlnH++) {
              if (tlnH > 0 && !levelAvailability.Hieu) continue;
              const tlnVD = luat.tlnCount - tlnB - tlnH;
              if (tlnVD > 0 && !levelAvailability.VanDung) continue;

              const remB = luat.bietTarget - (tlB * luat.tlPrice + dsB * dsPricePerBig + tlnB * luat.tlnPrice);
              const remH = luat.hieuTarget - (tlH * luat.tlPrice + dsH * dsPricePerBig + tlnH * luat.tlnPrice);
              const remVD = luat.vanDungTarget - (tlVD * luat.tlPrice + dsVD * dsPricePerBig + tlnVD * luat.tlnPrice);

              let nlcB = 0;
              let nlcH = 0;
              let nlcVD = 0;

              if (luat.nlcCount > 0 && luat.nlcPrice > 0) {
                nlcB = Math.round(remB / luat.nlcPrice);
                nlcH = Math.round(remH / luat.nlcPrice);
                nlcVD = Math.round(remVD / luat.nlcPrice);
              }

              if (nlcB < 0 || nlcH < 0 || nlcVD < 0) continue;
              if (nlcB > 0 && !levelAvailability.Biet) continue;
              if (nlcH > 0 && !levelAvailability.Hieu) continue;
              if (nlcVD > 0 && !levelAvailability.VanDung) continue;
              if (nlcB + nlcH + nlcVD !== luat.nlcCount) continue;

              const scoreB = nlcB * luat.nlcPrice + dsB * dsPricePerBig + tlnB * luat.tlnPrice + tlB * luat.tlPrice;
              const scoreH = nlcH * luat.nlcPrice + dsH * dsPricePerBig + tlnH * luat.tlnPrice + tlH * luat.tlPrice;
              const scoreVD = nlcVD * luat.nlcPrice + dsVD * dsPricePerBig + tlnVD * luat.tlnPrice + tlVD * luat.tlPrice;

              if (
                Math.abs(scoreB - luat.bietTarget) > tol + 0.001 ||
                Math.abs(scoreH - luat.hieuTarget) > tol + 0.001 ||
                Math.abs(scoreVD - luat.vanDungTarget) > tol + 0.001
              ) {
                continue;
              }

              let penalty = 0;
              penalty += nlcVD * 10;
              penalty += tlB * 5;
              penalty += tlnB * 5;

              if (!bestSolution || penalty < bestSolution.penalty) {
                bestSolution = {
                  nlcDist: { Biet: nlcB, Hieu: nlcH, VanDung: nlcVD },
                  dsDist: { Biet: dsB, Hieu: dsH, VanDung: dsVD },
                  tlnDist: { Biet: tlnB, Hieu: tlnH, VanDung: tlnVD },
                  tlDist: { Biet: tlB, Hieu: tlH, VanDung: tlVD },
                  penalty,
                };
              }
            }
          }
        }
      }
    }
  }

  return bestSolution;
}

/**
 * Generates initial automatic "cau" (question allocations) table based on "luat" and content weights
 */
export function generateCauAllocation(
  chuDeList: ChuDeItem[],
  luat: LuatConfig
): {
  cauList: CauItem[];
  unsolvableReason?: string;
  candidatesCount?: number;
} {
  const allNoiDung = getAllNoiDungList(chuDeList);

  if (allNoiDung.length === 0) {
    return {
      cauList: [],
      unsolvableReason: 'Chưa có dữ liệu Chủ đề/Nội dung. Vui lòng tải lên tài liệu học tập hoặc nhập nội dung bài học ở Bước 1.',
    };
  }

  // Check if any YCCĐ exists
  const totalYccdCount = allNoiDung.reduce((s, nd) => s + nd.noiDung.yccd.length, 0);
  if (totalYccdCount === 0) {
    return {
      cauList: [],
      unsolvableReason: 'Tất cả các nội dung đều chưa có Yêu cầu cần đạt (YCCĐ). Không thể phân bổ câu hỏi!',
    };
  }

  // Determine question count target per type × level
  // Mức Biết (Biết Target: default 4.0), Mức Hiểu (3.0), Mức Vận dụng (3.0)
  // Let's allocate NLC, DS sub-items, TLN, TL to levels to match level target scores exactly!
  
  // Total NLC = luat.nlcCount (score = nlcCount * nlcPrice, e.g., 12 * 0.25 = 3.0)
  // Total DS = luat.dsCount (score = dsCount * dsSubItems * dsPricePerSub, e.g., 4 * 4 * 0.25 = 4.0)
  // Total TLN = luat.tlnCount (score = tlnCount * tlnPrice, e.g., 0 * 0.5 = 0.0)
  // Total TL = luat.tlCount (score = tlCount * tlPrice, e.g., 3 * 1.0 = 3.0)

  // Standard CV 7991 distribution matrix by question type & cognitive level:
  // NLC (12 câu): 8 câu Biết (2.0đ), 4 câu Hiểu (1.0đ), 0 câu Vận dụng (0.0đ)
  // DS (4 câu = 16 ý): 1 câu Biết (1.0đ), 2 câu Hiểu (2.0đ), 1 câu Vận dụng (1.0đ)
  // TLN (0 câu): 0 câu
  // TL (3 câu): 1 câu Biết (1.0đ), 0 câu Hiểu, 2 câu Vận dụng (2.0đ)
  // Sum Biết = 2.0 + 1.0 + 1.0 = 4.0đ
  // Sum Hiểu = 1.0 + 2.0 + 0.0 = 3.0đ
  // Sum Vận dụng = 0.0 + 1.0 + 2.0 = 3.0đ

  // Verify whether content items have available YCCĐs for each level (with automatic fallback to all topics)
  const hasBiet = allNoiDung.some((nd) => getAvailableLevelsForNoiDung(nd.noiDung).Biet);
  const hasHieu = allNoiDung.some((nd) => getAvailableLevelsForNoiDung(nd.noiDung).Hieu);
  const hasVD = allNoiDung.some((nd) => getAvailableLevelsForNoiDung(nd.noiDung).VanDung);

  const levelAvailability = {
    Biet: true,
    Hieu: true,
    VanDung: true,
  };

  // Solve integer partition (dang × muc) satisfying luat and targets
  let solvedDist = solveTypeLevelDistribution(luat, levelAvailability);

  if (!solvedDist) {
    // If strict partition fails, build standard 3-4-3 or default distribution
    const nlc = luat.nlcCount || 12;
    const ds = luat.dsCount || 4;
    const tln = luat.tlnCount || 6;
    const tl = luat.tlCount || 0;
    solvedDist = {
      nlcDist: { Biet: Math.min(8, nlc), Hieu: Math.min(4, Math.max(0, nlc - 8)), VanDung: Math.max(0, nlc - 12) },
      dsDist: { Biet: Math.min(2, ds), Hieu: Math.min(1, Math.max(0, ds - 2)), VanDung: Math.max(0, ds - 3) },
      tlnDist: { Biet: Math.min(2, tln), Hieu: Math.min(2, Math.max(0, tln - 2)), VanDung: Math.max(0, tln - 4) },
      tlDist: { Biet: Math.min(1, tl), Hieu: Math.min(1, Math.max(0, tl - 1)), VanDung: Math.max(0, tl - 2) },
    };
  }

  const { nlcDist, dsDist, tlnDist, tlDist } = solvedDist;

  const getFilteredOrAll = (level: 'Biet' | 'Hieu' | 'VanDung') => {
    const filtered = allNoiDung.filter((nd) => getAvailableLevelsForNoiDung(nd.noiDung)[level]);
    return filtered.length > 0 ? filtered : allNoiDung;
  };

  const levelContentMap = {
    Biet: getFilteredOrAll('Biet'),
    Hieu: getFilteredOrAll('Hieu'),
    VanDung: getFilteredOrAll('VanDung'),
  };

  // Now, distribute each (type, level) across allNoiDung using Largest Remainder Method
  const cauList: CauItem[] = [];
  let nlcCounter = 1;
  let dsCounter = 1;
  let tlnCounter = 1;
  let tlCounter = 1;

  // 1. Distribute NLC
  (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
    const totalForLevel = nlcDist[lvl];
    if (totalForLevel <= 0) return;

    const availableNoiDung = levelContentMap[lvl];
    if (availableNoiDung.length === 0) return;

    const items = availableNoiDung.map((nd) => ({
      id: nd.noiDung.id,
      weight: nd.noiDung.trongSo || nd.noiDung.yccd.length || 1,
    }));

    const allocated = largestRemainderAllocation(totalForLevel, items);

    availableNoiDung.forEach((nd) => {
      const count = allocated[nd.noiDung.id] || 0;
      const matchingYccd = nd.noiDung.yccd.filter((y) => {
        if (lvl === 'Biet') return y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
        if (lvl === 'Hieu') return y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
        return y.mucToiDa === 'VanDung';
      });
      const yccdCodes = matchingYccd.map((y) => y.ma);

      for (let i = 0; i < count; i++) {
        cauList.push({
          id: `NLC${nlcCounter}`,
          noiDungId: nd.noiDung.id,
          chuDeId: nd.chuDeId,
          dang: 'NLC',
          muc: lvl,
          cauSo: nlcCounter,
          diem: luat.nlcPrice,
          maYCCD: yccdCodes.length > 0 ? [yccdCodes[i % yccdCodes.length]] : [],
          nguon: `Nguồn tài liệu ${nd.noiDung.ten}`,
        });
        nlcCounter++;
      }
    });
  });

  // 2. Distribute DS (True/False big questions)
  (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
    const totalBigQ = dsDist[lvl];
    if (totalBigQ <= 0) return;

    const availableNoiDung = levelContentMap[lvl];
    if (availableNoiDung.length === 0) return;

    const items = availableNoiDung.map((nd) => ({
      id: nd.noiDung.id,
      weight: nd.noiDung.trongSo || nd.noiDung.yccd.length || 1,
    }));

    const allocated = largestRemainderAllocation(totalBigQ, items);

    availableNoiDung.forEach((nd) => {
      const bigCount = allocated[nd.noiDung.id] || 0;
      const matchingYccd = nd.noiDung.yccd.filter((y) => {
        if (lvl === 'Biet') return y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
        if (lvl === 'Hieu') return y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
        return y.mucToiDa === 'VanDung';
      });
      const yccdCodes = matchingYccd.map((y) => y.ma);

      for (let i = 0; i < bigCount; i++) {
        const subLabels: Array<'a' | 'b' | 'c' | 'd'> = ['a', 'b', 'c', 'd'];
        const currentDsNum = dsCounter;
        subLabels.forEach((label, subIdx) => {
          cauList.push({
            id: `DS${currentDsNum}_${label}`,
            noiDungId: nd.noiDung.id,
            chuDeId: nd.chuDeId,
            dang: 'DS',
            muc: lvl,
            cauSo: currentDsNum,
            y: label,
            diem: luat.dsPricePerSub,
            maYCCD: yccdCodes.length > 0 ? [yccdCodes[subIdx % yccdCodes.length]] : [],
            nguon: `Nguồn tài liệu ${nd.noiDung.ten}`,
          });
        });
        dsCounter++;
      }
    });
  });

  // 3. Distribute TLN (Short Answer)
  if (luat.tlnCount > 0) {
    (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
      const totalForLevel = tlnDist[lvl];
      if (totalForLevel <= 0) return;

      const availableNoiDung = levelContentMap[lvl];
      if (availableNoiDung.length === 0) return;

      const items = availableNoiDung.map((nd) => ({
        id: nd.noiDung.id,
        weight: nd.noiDung.trongSo || nd.noiDung.yccd.length || 1,
      }));

      const allocated = largestRemainderAllocation(totalForLevel, items);

      availableNoiDung.forEach((nd) => {
        const count = allocated[nd.noiDung.id] || 0;
        const matchingYccd = nd.noiDung.yccd.filter((y) => {
          if (lvl === 'Biet') return y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
          if (lvl === 'Hieu') return y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
          return y.mucToiDa === 'VanDung';
        });
        const yccdCodes = matchingYccd.map((y) => y.ma);

        for (let i = 0; i < count; i++) {
          cauList.push({
            id: `TLN${tlnCounter}`,
            noiDungId: nd.noiDung.id,
            chuDeId: nd.chuDeId,
            dang: 'TLN',
            muc: lvl,
            cauSo: tlnCounter,
            diem: luat.tlnPrice,
            maYCCD: yccdCodes.length > 0 ? [yccdCodes[i % yccdCodes.length]] : [],
            nguon: `Nguồn tài liệu ${nd.noiDung.ten}`,
          });
          tlnCounter++;
        }
      });
    });
  }

  // 4. Distribute TL (Essay)
  (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
    const totalForLevel = tlDist[lvl];
    if (totalForLevel <= 0) return;

    const availableNoiDung = levelContentMap[lvl];
    if (availableNoiDung.length === 0) return;

    const items = availableNoiDung.map((nd) => ({
      id: nd.noiDung.id,
      weight: nd.noiDung.trongSo || nd.noiDung.yccd.length || 1,
    }));

    const allocated = largestRemainderAllocation(totalForLevel, items);

    availableNoiDung.forEach((nd) => {
      const count = allocated[nd.noiDung.id] || 0;
      const matchingYccd = nd.noiDung.yccd.filter((y) => {
        if (lvl === 'Biet') return y.mucToiDa === 'Biet' || y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
        if (lvl === 'Hieu') return y.mucToiDa === 'Hieu' || y.mucToiDa === 'VanDung';
        return y.mucToiDa === 'VanDung';
      });
      const yccdCodes = matchingYccd.map((y) => y.ma);

      for (let i = 0; i < count; i++) {
        cauList.push({
          id: `TL${tlCounter}`,
          noiDungId: nd.noiDung.id,
          chuDeId: nd.chuDeId,
          dang: 'TL',
          muc: lvl,
          cauSo: tlCounter,
          diem: luat.tlPrice,
          maYCCD: yccdCodes.length > 0 ? [yccdCodes[i % yccdCodes.length]] : [],
          nguon: `Nguồn tài liệu ${nd.noiDung.ten}`,
        });
        tlCounter++;
      }
    });
  });

  return {
    cauList,
    candidatesCount: 1,
  };
}

/**
 * Unified cell representation for both Matrix Table and Specification Table
 */
export interface MatrixCellData {
  count: number;             // Count of questions/sub-items in cell
  displayStr: string;        // e.g. "4 (Câu 1, 2, 3, 4)" or "2 (Câu 1: ý a, b)"
  questionNumbersStr: string;// e.g. "Câu 1, 2, 3, 4"
  score: number;             // Total score in this cell
}

export interface UnifiedRowData {
  stt: number;
  chuDeId: string;
  chuDeTen: string;
  noiDungId: string;
  noiDungTen: string;
  rowspanChuDe?: number;
  isFirstInChuDe?: boolean;
  yccdList: YccdItem[];

  // Cells by QuestionType & CognitiveLevel
  matrixCells: Record<QuestionType, Record<CognitiveLevel, MatrixCellData>>;

  // Summary for Matrix Row
  rowTotalCount: number;
  rowTotalScore: number;
  rowPercentScore: number; // e.g. 30.0 for 3.0 points out of 10.0
}

export interface UnifiedTableData {
  rows: UnifiedRowData[];
  showTln: boolean;

  // Bottom row totals
  typeLevelTotals: Record<QuestionType, Record<CognitiveLevel, { count: number; score: number }>>;
  typeGrandTotals: Record<QuestionType, { count: number; score: number; percent: number }>;
  levelGrandTotals: Record<CognitiveLevel, { count: number; score: number; percent: number }>;

  grandTotalCount: number;
  grandTotalScore: number;
  grandTotalPercent: number;
}

/**
 * Single Unified Counting Engine that builds all numbers, question codes (n), cell texts,
 * and bottom row totals for BOTH Matrix and Specification tables directly from the "cau" table!
 */
export function getUnifiedMatrixSpecData(
  chuDeListInput: ChuDeItem[] = [],
  cauListInput: CauItem[] = [],
  luatInput?: LuatConfig,
  options: {
    showTln?: boolean;
    activeCompetencies?: NangLucItem[];
  } = {}
): UnifiedTableData {
  const chuDeList = Array.isArray(chuDeListInput) ? chuDeListInput : [];
  const cauList = Array.isArray(cauListInput) ? cauListInput : [];
  const luat = luatInput || PRESETS['3-4-3'].luat;
  const showTln = options.showTln !== undefined ? options.showTln : ((luat.tlnCount || 0) > 0 || !!luat.showTlnColumnsIfZero);

  const allNoiDung = getAllNoiDungList(chuDeList);

  // Grouping rowspan for ChuDe
  const chuDeCountMap = new Map<string, number>();
  allNoiDung.forEach((nd) => {
    chuDeCountMap.set(nd.chuDeId, (chuDeCountMap.get(nd.chuDeId) || 0) + 1);
  });

  const processedChuDeSet = new Set<string>();

  // Pre-calculate continuous question numbering labels across exam sections
  // Section 1: NLC (Câu 1..N)
  // Section 2: DS (Câu 1..M with sub-items)
  // Section 3: TLN (Câu 1..K)
  // Section 4: TL (Câu 1..L)

  let rowStt = 1;

  const rows: UnifiedRowData[] = allNoiDung.map((item) => {
    const nd = item.noiDung;
    const isFirstInChuDe = !processedChuDeSet.has(item.chuDeId);
    if (isFirstInChuDe) {
      processedChuDeSet.add(item.chuDeId);
    }
    const rowspanChuDe = isFirstInChuDe ? chuDeCountMap.get(item.chuDeId) || 1 : undefined;

    // Filter questions belonging to this content
    const ndCauList = cauList.filter((c) => c.noiDungId === nd.id);

    const matrixCells: Record<QuestionType, Record<CognitiveLevel, MatrixCellData>> = {
      NLC: { Biet: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, Hieu: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, VanDung: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 } },
      DS: { Biet: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, Hieu: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, VanDung: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 } },
      TLN: { Biet: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, Hieu: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, VanDung: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 } },
      TL: { Biet: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, Hieu: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 }, VanDung: { count: 0, displayStr: '', questionNumbersStr: '', score: 0 } },
    };

    let rowTotalCount = 0;
    let rowTotalScore = 0;

    (['NLC', 'DS', 'TLN', 'TL'] as QuestionType[]).forEach((type) => {
      (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
        const matchingCau = ndCauList.filter((c) => c.dang === type && c.muc === lvl);
        const count = matchingCau.length;

        if (count > 0) {
          const score = matchingCau.reduce((s, c) => s + (c.diem || 0), 0);
          rowTotalCount += count;
          rowTotalScore += score;

          // Format question numbers str (n)
          let displayStr = '';
          let questionNumbersStr = '';

          if (type === 'NLC' || type === 'TLN' || type === 'TL') {
            const numSet = Array.from(new Set(matchingCau.map((c) => c.cauSo || 1))).sort((a, b) => a - b);
            if (numSet.length === 1) {
              questionNumbersStr = `Câu ${numSet[0]}`;
            } else if (numSet.length > 1) {
              questionNumbersStr = `Câu ${numSet.join(', ')}`;
            }
            displayStr = `${count} (${questionNumbersStr})`;
          } else if (type === 'DS') {
            // Group sub-items by big question number
            const dsGroupMap = new Map<number, string[]>();
            matchingCau.forEach((c) => {
              const qNum = c.cauSo || 1;
              if (!dsGroupMap.has(qNum)) dsGroupMap.set(qNum, []);
              if (c.y) dsGroupMap.get(qNum)!.push(c.y);
            });

            const dsParts: string[] = [];
            dsGroupMap.forEach((subList, qNum) => {
              if (subList.length === 4) {
                dsParts.push(`Câu ${qNum}`);
              } else {
                dsParts.push(`Câu ${qNum}: ý ${subList.join(', ')}`);
              }
            });

            questionNumbersStr = dsParts.join('; ');
            displayStr = `${count} (${questionNumbersStr})`;
          }

          matrixCells[type][lvl] = {
            count,
            displayStr,
            questionNumbersStr,
            score: Number(score.toFixed(2)),
          };
        }
      });
    });

    const roundedRowScore = Number(rowTotalScore.toFixed(2));
    const rowPercentScore = Number(((roundedRowScore / 10.0) * 100).toFixed(1));

    return {
      stt: rowStt++,
      chuDeId: item.chuDeId,
      chuDeTen: item.chuDeTen,
      noiDungId: nd.id,
      noiDungTen: nd.ten,
      rowspanChuDe,
      isFirstInChuDe,
      yccdList: nd.yccd,
      matrixCells,
      rowTotalCount,
      rowTotalScore: roundedRowScore,
      rowPercentScore,
    };
  });

  // Calculate bottom row totals
  const typeLevelTotals: Record<QuestionType, Record<CognitiveLevel, { count: number; score: number }>> = {
    NLC: { Biet: { count: 0, score: 0 }, Hieu: { count: 0, score: 0 }, VanDung: { count: 0, score: 0 } },
    DS: { Biet: { count: 0, score: 0 }, Hieu: { count: 0, score: 0 }, VanDung: { count: 0, score: 0 } },
    TLN: { Biet: { count: 0, score: 0 }, Hieu: { count: 0, score: 0 }, VanDung: { count: 0, score: 0 } },
    TL: { Biet: { count: 0, score: 0 }, Hieu: { count: 0, score: 0 }, VanDung: { count: 0, score: 0 } },
  };

  const typeGrandTotals: Record<QuestionType, { count: number; score: number; percent: number }> = {
    NLC: { count: 0, score: 0, percent: 0 },
    DS: { count: 0, score: 0, percent: 0 },
    TLN: { count: 0, score: 0, percent: 0 },
    TL: { count: 0, score: 0, percent: 0 },
  };

  const levelGrandTotals: Record<CognitiveLevel, { count: number; score: number; percent: number }> = {
    Biet: { count: 0, score: 0, percent: 0 },
    Hieu: { count: 0, score: 0, percent: 0 },
    VanDung: { count: 0, score: 0, percent: 0 },
  };

  let grandTotalCount = 0;
  let grandTotalScore = 0;

  rows.forEach((r) => {
    (['NLC', 'DS', 'TLN', 'TL'] as QuestionType[]).forEach((type) => {
      (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
        const cell = r.matrixCells[type][lvl];
        typeLevelTotals[type][lvl].count += cell.count;
        typeLevelTotals[type][lvl].score += cell.score;

        typeGrandTotals[type].count += cell.count;
        typeGrandTotals[type].score += cell.score;

        levelGrandTotals[lvl].count += cell.count;
        levelGrandTotals[lvl].score += cell.score;

        grandTotalCount += cell.count;
        grandTotalScore += cell.score;
      });
    });
  });

  // Round scores and compute percentages
  (['NLC', 'DS', 'TLN', 'TL'] as QuestionType[]).forEach((type) => {
    typeGrandTotals[type].score = Number(typeGrandTotals[type].score.toFixed(2));
    typeGrandTotals[type].percent = Number(((typeGrandTotals[type].score / 10.0) * 100).toFixed(1));
    (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
      typeLevelTotals[type][lvl].score = Number(typeLevelTotals[type][lvl].score.toFixed(2));
    });
  });

  (['Biet', 'Hieu', 'VanDung'] as CognitiveLevel[]).forEach((lvl) => {
    levelGrandTotals[lvl].score = Number(levelGrandTotals[lvl].score.toFixed(2));
    levelGrandTotals[lvl].percent = Number(((levelGrandTotals[lvl].score / 10.0) * 100).toFixed(1));
  });

  const roundedGrandTotalScore = Number(grandTotalScore.toFixed(2));
  const grandTotalPercent = Number(((roundedGrandTotalScore / 10.0) * 100).toFixed(1));

  return {
    rows,
    showTln,
    typeLevelTotals,
    typeGrandTotals,
    levelGrandTotals,
    grandTotalCount,
    grandTotalScore: roundedGrandTotalScore,
    grandTotalPercent,
  };
}
