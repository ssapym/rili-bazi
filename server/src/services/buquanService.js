const {
  STEMS,
  BRANCHES,
  GX,
  PILLAR_NAMES,
  PILLAR_RELATIONS,
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

function checkBranchSixClash(derivedBranch, allBranches, pillarNames) {
  const conflicts = [];
  const derivedIndex = BRANCHES.indexOf(derivedBranch);
  
  for (const gx of GX) {
    if (gx[1] === 2) {
      const [branch1, branch2] = gx[2];
      
      if (derivedIndex === branch1) {
        for (let i = 0; i < allBranches.length; i++) {
          if (allBranches[i] === branch2) {
            conflicts.push({
              type: '地支六冲',
              desc: `${BRANCHES[derivedIndex]}与${BRANCHES[branch2]}相冲`,
              targetPillar: pillarNames[i],
              targetBranch: BRANCHES[branch2]
            });
          }
        }
      } else if (derivedIndex === branch2) {
        for (let i = 0; i < allBranches.length; i++) {
          if (allBranches[i] === branch1) {
            conflicts.push({
              type: '地支六冲',
              desc: `${BRANCHES[derivedIndex]}与${BRANCHES[branch1]}相冲`,
              targetPillar: pillarNames[i],
              targetBranch: BRANCHES[branch1]
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

function checkPillarClash(derivedGanZhi, allPillars, pillarNames) {
  const conflicts = [];
  const derivedStem = derivedGanZhi[0];
  const derivedBranch = derivedGanZhi[1];
  const derivedStemIndex = STEMS.indexOf(derivedStem);
  const derivedBranchIndex = BRANCHES.indexOf(derivedBranch);
  
  for (const relation of PILLAR_RELATIONS) {
    if (relation.type === '双冲' || relation.type === '天克地刑') {
      if (relation.stem1 === derivedStemIndex && relation.branch1 === derivedBranchIndex) {
        const targetStem = STEMS[relation.stem2];
        const targetBranch = BRANCHES[relation.branch2];
        const targetGanZhi = targetStem + targetBranch;
        
        for (let i = 0; i < allPillars.length; i++) {
          if (allPillars[i] === targetGanZhi) {
            conflicts.push({
              type: relation.type,
              desc: relation.desc,
              targetPillar: pillarNames[i],
              targetGanZhi: targetGanZhi
            });
          }
        }
      }
    }
  }
  
  return conflicts;
}

function calculateBuQuan(pillars) {
  const pillarData = [
    { stem: pillars.year.heavenStem, branch: pillars.year.earthBranch, name: '年', ganZhi: pillars.year.heavenStem + pillars.year.earthBranch },
    { stem: pillars.month.heavenStem, branch: pillars.month.earthBranch, name: '月', ganZhi: pillars.month.heavenStem + pillars.month.earthBranch },
    { stem: pillars.day.heavenStem, branch: pillars.day.earthBranch, name: '日', ganZhi: pillars.day.heavenStem + pillars.day.earthBranch },
    { stem: pillars.hour.heavenStem, branch: pillars.hour.earthBranch, name: '时', ganZhi: pillars.hour.heavenStem + pillars.hour.earthBranch }
  ];

  const allPillars = pillarData.map(p => p.ganZhi);
  const allBranches = pillarData.map(p => p.branch);
  const pillarNames = pillarData.map(p => p.name);

  const andai = calculateAnDai(pillars);

  for (const item of andai) {
    item.conflicts = checkPillarClash(item.derivedGanZhi, allPillars, pillarNames);
  }

  const validAndai = andai.filter(item => item.conflicts.length === 0);

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

  const allPillarData = [...pillarData];
  for (const andaiItem of validAndai) {
    allPillarData.push({
      stem: andaiItem.derivedStem,
      branch: andaiItem.derivedBranch,
      name: `暗带(${andaiItem.derivedGanZhi})`,
      ganZhi: andaiItem.derivedGanZhi
    });
  }

  const allTg = allPillarData.map(p => p.stem);
  const allDz = allPillarData.map(p => BRANCHES.indexOf(p.branch));
  const allPillarNames = allPillarData.map(p => p.name);

  for (let i = 0; i < allPillarData.length; i++) {
    for (let j = i + 1; j < allPillarData.length; j++) {
      if (allTg[i] !== allTg[j]) {
        continue;
      }

      const branch1 = allDz[i];
      const branch2 = allDz[j];

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
            const source = [allPillarNames[i], allPillarNames[j]].join('+');
            const relationTypeStr = getRelationType(relationType);

            const derivedInfo = {
              source: source,
              desc: desc,
              type: relationTypeStr,
              derivedBranch: derivedBranch,
              derivedIndex: derivedIndex
            };

            const allBranchesForCheck = allPillarData.map(p => p.branch);
            const allPillarNamesForCheck = allPillarData.map(p => p.name);
            derivedInfo.conflicts = checkBranchSixClash(derivedBranch, allBranchesForCheck, allPillarNamesForCheck);

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
