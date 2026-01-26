const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const GX = [
  [0, 0, [0, 6], -1, '甲庚冲'],
  [0, 0, [1, 7], -1, '乙辛冲'],
  [0, 0, [2, 8], -1, '丙壬冲'],
  [0, 0, [3, 9], -1, '丁癸冲'],
  [0, 1, [0, 5], 4, '甲己合化土'],
  [0, 1, [1, 6], 0, '乙庚合化金'],
  [0, 1, [2, 7], 1, '丙辛合化水'],
  [0, 1, [3, 8], 2, '丁壬合化木'],
  [0, 1, [4, 9], 3, '戊癸合化火'],
  [1, 2, [0, 6], -1, '子午冲'],
  [1, 2, [1, 7], -1, '丑未冲'],
  [1, 2, [2, 8], -1, '寅申冲'],
  [1, 2, [3, 9], -1, '卯酉冲'],
  [1, 2, [4, 10], -1, '辰戌冲'],
  [1, 2, [5, 11], -1, '巳亥冲'],
  [1, 3, [2, 5, 8], -1, '寅巳申三刑'],
  [1, 3, [1, 10, 7], -1, '丑戌未三刑'],
  [1, 4, [2, 5], -1, '寅巳相刑'],
  [1, 4, [5, 8], -1, '巳申相刑'],
  [1, 4, [1, 10], -1, '丑戌相刑'],
  [1, 4, [10, 7], -1, '戌未相刑'],
  [1, 4, [0, 3], -1, '子卯相刑'],
  [1, 5, [9, 9], -1, '酉酉自刑'],
  [1, 5, [11, 11], -1, '亥亥自刑'],
  [1, 5, [6, 6], -1, '午午自刑'],
  [1, 5, [4, 4], -1, '辰辰自刑'],
  [1, 6, [0, 1], 4, '子丑合化土'],
  [1, 6, [2, 11], 2, '寅亥合化木'],
  [1, 6, [3, 10], 3, '卯戌合化火'],
  [1, 6, [4, 9], 0, '辰酉合化金'],
  [1, 6, [5, 8], 1, '巳申合化水'],
  [1, 6, [6, 7], 3, '午未合化火'],
  [1, 7, [2, 6, 10], 3, '寅午戌三合火'],
  [1, 7, [8, 0, 4], 1, '申子辰三合水'],
  [1, 7, [5, 9, 1], 0, '巳酉丑三合金'],
  [1, 7, [11, 3, 7], 2, '亥卯未三合木'],
  [1, 8, [8, 0], 1, '申子半合水'],
  [1, 8, [0, 4], 1, '子辰半合水'],
  [1, 8, [11, 3], 2, '亥卯半合木'],
  [1, 8, [3, 7], 2, '卯未半合木'],
  [1, 8, [2, 6], 3, '寅午半合火'],
  [1, 8, [6, 10], 3, '午戌半合火'],
  [1, 8, [5, 9], 0, '巳酉半合金'],
  [1, 8, [9, 1], 0, '酉丑半合金'],
  [1, 9, [8, 4], 0, '申辰拱合子'],
  [1, 9, [11, 7], 3, '亥未拱合卯'],
  [1, 9, [2, 10], 6, '寅戌拱合午'],
  [1, 9, [5, 1], 9, '巳丑拱合酉'],
  [1, 10, [2, 3, 4], 2, '寅卯辰会木'],
  [1, 10, [5, 6, 7], 3, '巳午未会火'],
  [1, 10, [8, 9, 10], 0, '申酉戌会金'],
  [1, 10, [11, 0, 1], 1, '亥子丑会水'],
  [1, 11, [2, 4], 3, '寅辰拱会卯'],
  [1, 11, [5, 7], 6, '巳未拱会午'],
  [1, 11, [8, 10], 9, '申戌拱会酉'],
  [1, 11, [11, 1], 0, '亥丑拱会子'],
  [1, 12, [3, 8], -1, '卯申暗合'],
  [1, 12, [6, 11], -1, '午亥暗合'],
  [1, 12, [1, 2], -1, '丑寅暗合'],
  [1, 12, [2, 7], -1, '寅未暗合'],
  [1, 12, [0, 10], -1, '子戌暗合'],
  [1, 12, [0, 4], -1, '子辰暗合'],
  [1, 12, [5, 9], -1, '巳酉暗合'],
  [1, 13, [0, 7], -1, '子未害'],
  [1, 13, [1, 6], -1, '丑午害'],
  [1, 13, [2, 5], -1, '寅巳害'],
  [1, 13, [3, 4], -1, '卯辰害'],
  [1, 13, [8, 11], -1, '申亥害'],
  [1, 13, [9, 10], -1, '酉戌害']
];

const PILLAR_NAMES = ['年', '月', '日', '时'];

function array_intersect(arr1, arr2) {
  const result = {};
  for (let key = 0; key < arr1.length; key++) {
    if (arr2.includes(arr1[key])) {
      result[key] = arr1[key];
    }
  }
  return result;
}

function array_diff(arr1, arr2) {
  if (Array.isArray(arr2)) {
    return arr1.filter(x => !arr2.includes(x));
  } else {
    return arr1.filter(x => !Object.values(arr2).includes(x));
  }
}

function empty(val) {
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return !val;
}

function count(arr) {
  return Array.isArray(arr) ? arr.length : Object.keys(arr).length;
}

function pc_array_power_set(arr) {
  const results = [[]];
  for (const item of arr) {
    for (const existing of [...results]) {
      results.push([...existing, item]);
    }
  }
  return results;
}

function array_keys(input) {
  if (Array.isArray(input)) {
    return input.map((_, idx) => idx);
  }
  return Object.keys(input);
}

function getRelationType(type) {
  const types = {
    0: '冲',
    1: '合',
    2: '冲',
    3: '刑',
    4: '刑',
    5: '刑',
    6: '合',
    7: '合',
    8: '合',
    9: '合',
    10: '会',
    11: '会',
    12: '合',
    13: '害'
  };
  return types[type] || '';
}

function calculateRelationships(pillars) {
  const tg = [
    STEMS.indexOf(pillars.year.heavenStem),
    STEMS.indexOf(pillars.month.heavenStem),
    STEMS.indexOf(pillars.day.heavenStem),
    STEMS.indexOf(pillars.hour.heavenStem)
  ];
  const dz = [
    BRANCHES.indexOf(pillars.year.earthBranch),
    BRANCHES.indexOf(pillars.month.earthBranch),
    BRANCHES.indexOf(pillars.day.earthBranch),
    BRANCHES.indexOf(pillars.hour.earthBranch)
  ];

  const list = [[], []];
  const excludes = {
    4: 3,
    8: 7,
    9: 7,
    11: 10
  };

  for (const gx of GX) {
    const type = gx[0];
    const relationType = gx[1];
    const targetIndices = gx[2];
    const desc = gx[4];

    const to = type === 0 ? tg : dz;
    const fd = array_intersect(to, targetIndices);

    if (empty(array_diff(targetIndices, fd))) {
      const c1 = count(fd);
      const c2 = targetIndices.length;
      const fds = [];

      if (c1 === c2) {
        fds.push(fd);
      }
      if (c1 > c2) {
        const keys = array_keys(fd);
        const set = pc_array_power_set(keys);
        for (const subset of set) {
          if (subset.length !== c2) continue;
          const newFd = {};
          for (const key of subset) {
            newFd[key] = to[key];
          }
          if (empty(array_diff(targetIndices, newFd))) {
            fds.push(newFd);
          }
        }
      }

      b1: for (const item of fds) {
        for (const [expect, exclude] of Object.entries(excludes)) {
          if (parseInt(expect) === relationType) {
            for (const [fd2, gx2] of list[type]) {
              if (gx2[1] === exclude) {
                const intersect = array_intersect(targetIndices, gx2[2]);
                if (!empty(intersect)) {
                  continue b1;
                }
              }
            }
            break;
          }
        }
        list[type].push([item, gx]);
      }
    }
  }

  const result = { stems: [], branches: [] };

  for (const [fds, gx] of list[0]) {
    const pillars = Object.keys(fds).map(idx => PILLAR_NAMES[idx]).join('+');
    result.stems.push({ source: pillars, desc: gx[4], type: getRelationType(gx[1]) });
  }

  for (const [fds, gx] of list[1]) {
    const pillars = Object.keys(fds).map(idx => PILLAR_NAMES[idx]).join('+');
    result.branches.push({ source: pillars, desc: gx[4], type: getRelationType(gx[1]) });
  }

  return result;
}

module.exports = {
  calculateRelationships
};
