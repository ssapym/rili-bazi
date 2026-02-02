/**
 * 八字根基判断服务
 * 
 * 功能：判断四柱天干和暗带天干是否有根
 * 
 * 判断范围：
 * 1. 四柱天干：年干、月干、日干、时干
 * 2. 暗带天干：buquan.andai中推导出的天干
 * 
 * 判断地支：
 * 1. 四柱地支：年支、月支、日支、时支
 * 2. 补全地支：
 *    - 拱三合推导的地支
 *    - 拱隔位（夹）推导的地支
 *    - 暗带推导的地支
 */

/**
 * 天干根基映射表
 * 
 * 键：天干名称
 * 值：该天干有根的地支列表
 * 
 * 根据传统八字理论，每个天干在某些地支中有根
 */
const STEM_ROOT_MAP = {
  '甲': ['亥', '寅', '卯', '未'],
  '乙': ['寅', '卯', '辰', '未'],
  '丙': ['寅', '巳', '午', '戌'],
  '丁': ['巳', '午', '未', '戌'],
  '戊': ['寅', '巳', '午', '辰', '戌'],
  '己': ['未', '午', '巳', '丑'],
  '庚': ['巳', '申', '酉', '丑'],
  '辛': ['酉', '申', '戌', '丑'],
  '壬': ['申', '亥', '子', '辰'],
  '癸': ['亥', '子', '丑', '辰']
};

/**
 * 计算八字根基
 * 
 * @param {Object} pillars - 四柱信息
 * @param {Object} buquan - 八字补全信息
 * @returns {Object} 根基判断结果
 * 
 * 返回格式：
 * {
 *   hasRoot: boolean,           // 四柱天干和暗带天干是否有根
 *   rootCount: number,         // 有根的天干数量
 *   rootDetails: Array          // 每个天干的详细根基信息
 * }
 * 
 * rootDetails中每个元素的格式：
 * {
 *   stem: string,              // 天干名称
 *   position: string,           // 天干位置（年干、月干、日干、时干、暗带）
 *   hasRoot: boolean,          // 该天干是否有根
 *   originalRoots: Array,      // 四柱地支中的根基
 *   derivedRoots: Array,       // 补全地支中的根基
 *   allRoots: Array           // 所有根基（合并原始和补全）
 * }
 * 
 * 暗带天干额外字段：
 * {
 *   source: string,            // 暗带来源（如"年+月"）
 *   derivedGanZhi: string      // 暗带推导出的完整干支（如"乙丑"）
 * }
 * 
 * originalRoots和derivedRoots中每个根基的格式：
 * {
 *   branch: string,            // 地支名称
 *   position: string,         // 地支位置（年支、月支、日支、时支、拱三合、拱隔位（夹）、暗带）
 *   type: string,             // 地支类型（original、derived）
 *   source: string,           // 补全来源（仅补全地支有此字段）
 *   derivedType: string        // 补全类型（gongsanhe、gonggewei、andai）
 * }
 */
function calculateGenji(pillars, buquan) {
  const pillarData = [
    { stem: pillars.year.heavenStem, branch: pillars.year.earthBranch, stemPos: '年干', branchPos: '年支' },
    { stem: pillars.month.heavenStem, branch: pillars.month.earthBranch, stemPos: '月干', branchPos: '月支' },
    { stem: pillars.day.heavenStem, branch: pillars.day.earthBranch, stemPos: '日干', branchPos: '日支' },
    { stem: pillars.hour.heavenStem, branch: pillars.hour.earthBranch, stemPos: '时干', branchPos: '时支' }
  ];

  const originalBranches = pillarData.map(p => p.branch);

  const derivedBranchesMap = new Map();
  
  if (buquan) {
    buquan.gongsanhe?.forEach(item => {
      derivedBranchesMap.set(item.derivedBranch, {
        position: '拱三合',
        source: item.source,
        derivedType: 'gongsanhe'
      });
    });

    buquan.gonggewei?.forEach(item => {
      derivedBranchesMap.set(item.derivedBranch, {
        position: '拱隔位（夹）',
        source: item.source,
        derivedType: 'gonggewei'
      });
    });

    buquan.andai?.forEach(item => {
      derivedBranchesMap.set(item.derivedBranch, {
        position: '暗带',
        source: item.source,
        derivedType: 'andai'
      });
    });
  }

  const allBranches = [...originalBranches, ...Array.from(derivedBranchesMap.keys())];

  const allStemsToCheck = [...pillarData.map(p => p.stem)];

  if (buquan?.andai) {
    buquan.andai.forEach(item => {
      if (item.derivedStem && !allStemsToCheck.includes(item.derivedStem)) {
        allStemsToCheck.push(item.derivedStem);
      }
    });
  }

  const rootDetails = allStemsToCheck.map(stem => {
    const rootBranches = STEM_ROOT_MAP[stem] || [];
    const originalRoots = [];
    const derivedRoots = [];
    const allRoots = [];

    const isAndaiStem = buquan?.andai?.find(item => item.derivedStem === stem);
    const stemPosition = isAndaiStem ? '暗带' : pillarData.find(p => p.stem === stem)?.stemPos || '未知';

    for (const branch of allBranches) {
      if (rootBranches.includes(branch)) {
        const isDerived = derivedBranchesMap.has(branch);
        
        if (isDerived) {
          const derivedInfo = derivedBranchesMap.get(branch);
          const rootInfo = {
            branch: branch,
            position: derivedInfo.position,
            source: derivedInfo.source,
            derivedType: derivedInfo.derivedType,
            type: 'derived'
          };

          allRoots.push(rootInfo);
          derivedRoots.push(rootInfo);
        } else {
          const rootInfo = {
            branch: branch,
            position: pillarData.find(p => p.branch === branch)?.branchPos || '未知',
            type: 'original'
          };

          allRoots.push(rootInfo);
          originalRoots.push(rootInfo);
        }
      }
    }

    const result = {
      stem: stem,
      position: stemPosition,
      hasRoot: allRoots.length > 0,
      originalRoots: originalRoots,
      derivedRoots: derivedRoots,
      allRoots: allRoots
    };

    if (isAndaiStem) {
      result.source = isAndaiStem.source;
      result.derivedGanZhi = isAndaiStem.derivedGanZhi;
    }

    return result;
  });

  const rootCount = rootDetails.filter(d => d.hasRoot).length;
  const hasRoot = rootCount > 0;

  return {
    hasRoot: hasRoot,
    rootCount: rootCount,
    rootDetails: rootDetails
  };
}

module.exports = {
  calculateGenji
};
