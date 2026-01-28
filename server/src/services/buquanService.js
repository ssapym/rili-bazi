const {
  STEMS,
  BRANCHES,
  GX,
  PILLAR_NAMES,
  array_intersect,
  array_diff,
  empty,
  count,
  getRelationType
} = require('./relationshipService');

const SIXTY_JIAZI = [
  ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉'],
  ['甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未'],
  ['甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳'],
  ['甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯'],
  ['甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'],
  ['甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥']
];

const XUN_NAMES = ['甲子旬', '甲戌旬', '甲申旬', '甲午旬', '甲辰旬', '甲寅旬'];

function getGanZhiIndexInXun(ganZhi) {
  for (let xunIndex = 0; xunIndex < 6; xunIndex++) {
    const index = SIXTY_JIAZI[xunIndex].indexOf(ganZhi);
    if (index !== -1) {
      return { xunIndex, index, xunName: XUN_NAMES[xunIndex] };
    }
  }
  return null;
}

function calculateAnDai(pillars) {
  const andai = [];
  const adjacentPairs = [
    { i: 0, j: 1, name: '年+月' },
    { i: 1, j: 2, name: '月+日' },
    { i: 2, j: 3, name: '日+时' }
  ];

  const pillarData = [
    { stem: pillars.year.heavenStem, branch: pillars.year.earthBranch, name: '年' },
    { stem: pillars.month.heavenStem, branch: pillars.month.earthBranch, name: '月' },
    { stem: pillars.day.heavenStem, branch: pillars.day.earthBranch, name: '日' },
    { stem: pillars.hour.heavenStem, branch: pillars.hour.earthBranch, name: '时' }
  ];

  for (const pair of adjacentPairs) {
    const ganZhi1 = pillarData[pair.i].stem + pillarData[pair.i].branch;
    const ganZhi2 = pillarData[pair.j].stem + pillarData[pair.j].branch;

    const pos1 = getGanZhiIndexInXun(ganZhi1);
    const pos2 = getGanZhiIndexInXun(ganZhi2);

    if (!pos1 || !pos2) {
      continue;
    }

    if (pos1.xunIndex !== pos2.xunIndex) {
      continue;
    }

    if (Math.abs(pos1.index - pos2.index) === 2) {
      const middleIndex = Math.min(pos1.index, pos2.index) + 1;
      const middleGanZhi = SIXTY_JIAZI[pos1.xunIndex][middleIndex];
      const derivedStem = middleGanZhi[0];
      const derivedBranch = middleGanZhi[1];

      const andaiInfo = {
        source: pair.name,
        desc: `${ganZhi1}${ganZhi2}暗带${middleGanZhi}`,
        derivedStem: derivedStem,
        derivedBranch: derivedBranch,
        derivedGanZhi: middleGanZhi,
        xun: pos1.xunName,
        index1: pos1.index,
        index2: pos2.index,
        middleIndex: middleIndex
      };

      andai.push(andaiInfo);
    }
  }

  return andai;
}

function calculateBuQuan(pillars) {
  const dz = [
    BRANCHES.indexOf(pillars.year.earthBranch),
    BRANCHES.indexOf(pillars.month.earthBranch),
    BRANCHES.indexOf(pillars.day.earthBranch),
    BRANCHES.indexOf(pillars.hour.earthBranch)
  ];

  const tg = [
    pillars.year.heavenStem,
    pillars.month.heavenStem,
    pillars.day.heavenStem,
    pillars.hour.heavenStem
  ];

  const derivedBranches = [];
  const gongsanhe = [];
  const gonggewei = [];

  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      if (tg[i] !== tg[j]) {
        continue;
      }

      const branch1 = dz[i];
      const branch2 = dz[j];

      for (const gx of GX) {
        const type = gx[0];
        const relationType = gx[1];
        const targetIndices = gx[2];
        const derivedIndex = gx[3];
        const desc = gx[4];

        if (type !== 1) {
          continue;
        }

        if (relationType !== 9 && relationType !== 11 && relationType !== 14) {
          continue;
        }

        const fd = array_intersect([branch1, branch2], targetIndices);

        if (empty(array_diff(targetIndices, fd))) {
          const c1 = count(fd);
          const c2 = targetIndices.length;

          if (c1 === c2) {
            const derivedBranch = BRANCHES[derivedIndex];
            const pillarNames = [PILLAR_NAMES[i], PILLAR_NAMES[j]].join('+');
            const relationTypeStr = getRelationType(relationType);

            const derivedInfo = {
              source: pillarNames,
              desc: desc,
              type: relationTypeStr,
              derivedBranch: derivedBranch,
              derivedIndex: derivedIndex
            };

            if (relationType === 9 || relationType === 11) {
              gongsanhe.push(derivedInfo);
            } else if (relationType === 14) {
              gonggewei.push(derivedInfo);
            }

            if (!derivedBranches.includes(derivedBranch)) {
              derivedBranches.push(derivedBranch);
            }
          }
        }
      }
    }
  }

  const andai = calculateAnDai(pillars);

  for (const item of andai) {
    if (!derivedBranches.includes(item.derivedBranch)) {
      derivedBranches.push(item.derivedBranch);
    }
  }

  return {
    derivedBranches: derivedBranches,
    gongsanhe: gongsanhe,
    gonggewei: gonggewei,
    andai: andai,
    summary: {
      totalDerived: derivedBranches.length,
      gongsanheCount: gongsanhe.length,
      gonggeweiCount: gonggewei.length,
      andaiCount: andai.length
    }
  };
}

module.exports = {
  calculateBuQuan
};
