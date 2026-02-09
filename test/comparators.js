/**
 * 比较逻辑模块
 * 
 * 提供API和SPA数据的比较函数
 */

// =============================================================================
// API新增的关系类型（与SPA不一致）
// =============================================================================

// 天干关系类型
const API_NEW_STEM_TYPES = [15]; // 克(15)

// 地支关系类型
const API_NEW_BRANCH_TYPES = [9, 16, 20]; // 拱合(9)、破(16)、绝(20)

// =============================================================================
// API其他新增关系（不在SPA中）
// =============================================================================

const API_OTHER_NEW_RELATIONS = [
  // 天干相克（6个）
  '甲戊克', '乙己克', '丙庚克', '丁辛克', '戊壬克', '己癸克',
  // 地支拱合（4个）
  '申辰拱合子', '亥未拱合卯', '寅戌拱合午', '巳丑拱合酉',
  // 地支半三会（4个）
  '亥子半会水', '寅卯半会木', '巳午半会火', '申酉半会金',
  // 地支相刑（6个）
  '寅巳相刑', '巳申相刑', '丑戌相刑', '戌未相刑',
  // 地支六破（6个）
  '子酉破', '卯午破', '辰丑破', '未戌破', '寅亥破', '申巳破',
  // 地支绝（4个）
  '子巳绝', '卯申绝', '午亥绝', '寅酉绝'
];

/**
 * 获取关系类型的中文描述
 * @param {string} relationDesc - 关系描述
 * @returns {string} 关系类型描述
 */
function getRelationType(relationDesc) {
  // 天干相克
  const stemKills = ['甲戊克', '乙己克', '丙庚克', '丁辛克', '戊壬克', '己癸克'];
  if (stemKills.includes(relationDesc)) return '天干相克';
  
  // 地支拱合
  const branchGonghe = ['申辰拱合子', '亥未拱合卯', '寅戌拱合午', '巳丑拱合酉'];
  if (branchGonghe.includes(relationDesc)) return '地支拱合';
  
  // 地支半三会
  const branchBanSanHui = ['亥子半会水', '寅卯半会木', '巳午半会火', '申酉半会金'];
  if (branchBanSanHui.includes(relationDesc)) return '地支半三会';
  
  // 地支相刑
  const branchXing = ['寅巳相刑', '巳申相刑', '丑戌相刑', '戌未相刑'];
  if (branchXing.includes(relationDesc)) return '地支相刑';
  
  // 地支六破
  const branchPo = ['子酉破', '卯午破', '辰丑破', '未戌破', '寅亥破', '申巳破'];
  if (branchPo.includes(relationDesc)) return '地支六破';
  
  // 地支绝
  const branchJue = ['子酉绝', '卯午绝', '辰丑绝', '申巳绝'];
  if (branchJue.includes(relationDesc)) return '地支绝';
  
  return 'API新增关系';
}

/**
 * 比较四柱
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @param {string} pillarName - 柱名称（nian/yue/ri/shi）
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function comparePillars(api, spa, pillarName) {
  const pillarChinese = { nian: '年', yue: '月', ri: '日', shi: '时' };
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const apiPillar = api.sizhu?.[pillarName];
  const spaPillar = spa[pillarName === 'nian' ? 'year' : pillarName === 'yue' ? 'month' : pillarName === 'ri' ? 'day' : 'hour'];

  if (!apiPillar && !spaPillar) return result;
  if (!apiPillar) {
    result.mismatches.push(`${pillarChinese[pillarName]}柱: API缺失`);
    result.failed += 1;
    result.details.push({ name: `${pillarChinese[pillarName]}柱`, apiValue: '缺失', spaValue: '有', status: 'failed' });
    return result;
  }
  if (!spaPillar) {
    result.mismatches.push(`${pillarChinese[pillarName]}柱: SPA缺失`);
    result.failed += 1;
    result.details.push({ name: `${pillarChinese[pillarName]}柱`, apiValue: '有', spaValue: '缺失', status: 'failed' });
    return result;
  }

  const fields = [
    { apiKey: ['tiangan', 'stem'], spaKey: 'heavenStem', name: '天干' },
    { apiKey: ['dizhi', 'branch'], spaKey: 'earthBranch', name: '地支' },
    { apiKey: ['zhuxing'], spaKey: 'tenStar', name: '十神', skip: pillarName === 'ri' },
    { apiKey: ['xingyun'], spaKey: 'terrain', name: '地势' },
    { apiKey: ['zizuo'], spaKey: 'terrainSelf', name: '自坐' },
    { apiKey: ['canggan'], spaKey: 'hideHeavenStems', name: '藏干', isArray: true },
    { apiKey: ['kongwang'], spaKey: 'extraEarthBranches', name: '空亡', isArray: true }
  ];

  fields.forEach(field => {
    if (field.skip) return;

    let apiVal, spaVal;
    if (field.isArray) {
      const apiArr = apiPillar[field.apiKey[0]] || [];
      const spaArr = spaPillar[field.spaKey] || [];
      if (field.name === '藏干') {
        apiVal = apiArr.map((item, i) => {
          const itemObj = typeof item === 'string' ? { ming: item, shishen: '' } : item;
          return `${itemObj.ming}(${itemObj.shishen})`;
        }).join(',');
        spaVal = spaArr.map((item, i) => `${item.name || ''}(${item.tenStar || ''})`).join(',');
      } else {
        apiVal = apiArr.join(',');
        spaVal = spaArr.join(',');
      }
    } else {
      apiVal = apiPillar[field.apiKey.find(k => apiPillar[k])] || '';
      spaVal = spaPillar[field.spaKey] || '';
    }

    if (apiVal === spaVal) {
      result.passed += 1;
      result.details.push({ name: `${pillarChinese[pillarName]}柱${field.name}`, apiValue: apiVal, spaValue: spaVal, status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`${pillarChinese[pillarName]}柱${field.name}: API=${apiVal} SPA=${spaVal}`);
      result.details.push({ name: `${pillarChinese[pillarName]}柱${field.name}`, apiValue: apiVal, spaValue: spaVal, status: 'failed' });
    }
  });

  return result;
}

/**
 * 比较纳音
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareNayin(api, spa) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const pillarNames = { nian: '年', yue: '月', ri: '日', shi: '时' };
  const pillars = ['nian', 'yue', 'ri', 'shi'];

  pillars.forEach(pillar => {
    const apiNayin = api.sizhu?.[pillar]?.nayin;
    const spaPillar = pillar === 'nian' ? 'year' : pillar === 'yue' ? 'month' : pillar === 'ri' ? 'day' : 'hour';
    const spaNayin = spa[spaPillar]?.sound || spa.nayin?.[pillar];

    if (apiNayin === spaNayin) {
      result.passed += 1;
      result.details.push({ name: `${pillarNames[pillar]}柱纳音`, apiValue: apiNayin || '无', spaValue: spaNayin || '无', status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`${pillarNames[pillar]}柱纳音: API=${apiNayin || '无'} SPA=${spaNayin || '无'}`);
      result.details.push({ name: `${pillarNames[pillar]}柱纳音`, apiValue: apiNayin || '无', spaValue: spaNayin || '无', status: 'failed' });
    }
  });

  return result;
}

/**
 * 比较五行能量
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareWuxingEnergy(api, spa) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const apiEnergy = api.nengliang?.wuxing;
  const spaEnergy = spa.wuxingEnergy;

  if (!apiEnergy && !spaEnergy) return result;
  if (!apiEnergy) {
    result.mismatches.push('五行能量: API缺失');
    result.failed += 1;
    result.details.push({ name: '五行能量', apiValue: '缺失', spaValue: '有', status: 'failed' });
    return result;
  }
  if (!spaEnergy) {
    result.mismatches.push('五行能量: SPA缺失');
    result.failed += 1;
    result.details.push({ name: '五行能量', apiValue: '有', spaValue: '缺失', status: 'failed' });
    return result;
  }

  const apiElements = apiEnergy.elements || [];
  const spaElements = spaEnergy.elements || [];
  const wuxing = ['金', '木', '水', '火', '土'];
  
  wuxing.forEach(wx => {
    const apiEl = apiElements.find(e => e.name === wx);
    const spaEl = spaElements.find(e => e.name === wx);
    const apiValue = apiEl?.score || 0;
    const spaValue = spaEl?.score || 0;
    
    if (Math.abs(apiValue - spaValue) <= 2) {
      result.passed += 1;
      result.details.push({ name: `五行能量(${wx})`, apiValue: apiValue.toFixed(2), spaValue: spaValue.toFixed(2), status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`五行能量(${wx}): API=${apiValue.toFixed(2)} SPA=${spaValue.toFixed(2)}`);
      result.details.push({ name: `五行能量(${wx})`, apiValue: apiValue.toFixed(2), spaValue: spaValue.toFixed(2), status: 'failed' });
    }
  });

  return result;
}

/**
 * 比较神煞
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareShensha(api, spa) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const apiShenshaObj = {
    nian: api.sizhu?.nian?.shensha || [],
    yue: api.sizhu?.yue?.shensha || [],
    ri: api.sizhu?.ri?.shensha || [],
    shi: api.sizhu?.shi?.shensha || []
  };
  const spaShenshaObj = spa.shensha || {};
  const pillars = ['nian', 'yue', 'ri', 'shi'];
  const pillarNames = { nian: '年', yue: '月', ri: '日', shi: '时' };

  for (const p of pillars) {
    const apiArr = apiShenshaObj[p] || [];
    const spaArr = spaShenshaObj[p] || [];
    const apiStr = apiArr.join(',');
    const spaStr = spaArr.join(',');

    if (apiStr === spaStr) {
      result.passed += 1;
      result.details.push({ name: `${pillarNames[p]}神煞`, apiValue: apiStr || '无', spaValue: spaStr || '无', status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`${pillarNames[p]}神煞: API=${apiStr} SPA=${spaStr}`);
      result.details.push({ name: `${pillarNames[p]}神煞`, apiValue: apiStr || '无', spaValue: spaStr || '无', status: 'failed' });
    }
  }

  return result;
}

/**
 * 比较大运
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareDayun(api, spa) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const apiDayun = api.dayun;
  const spaDayun = spa.dayun;

  if (!apiDayun && !spaDayun) return result;
  if (!apiDayun) {
    result.mismatches.push('大运: API缺失');
    result.failed += 1;
    result.details.push({ name: '大运', apiValue: '缺失', spaValue: '有', status: 'failed' });
    return result;
  }
  if (!spaDayun) {
    result.mismatches.push('大运: SPA缺失');
    result.failed += 1;
    result.details.push({ name: '大运', apiValue: '有', spaValue: '缺失', status: 'failed' });
    return result;
  }

  const extraItems = [
    { api: apiDayun.minggong, spa: spaDayun.minggong, name: '命宫' },
    { api: apiDayun.shengong, spa: spaDayun.shengong, name: '身宫' },
    { api: apiDayun.taiyuan, spa: spaDayun.taiyuan, name: '胎元' },
    { api: apiDayun.taixi, spa: spaDayun.taixi, name: '胎息' }
  ];

  extraItems.forEach(item => {
    const apiVal = item.api?.name ? `${item.api.name}(${item.api.sound || ''})` : '无';
    const spaVal = item.spa?.name ? `${item.spa.name}(${item.spa.sound || ''})` : '无';
    if (apiVal === spaVal) {
      result.passed += 1;
      result.details.push({ name: item.name, apiValue: apiVal, spaValue: spaVal, status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`${item.name}: API=${apiVal} SPA=${spaVal}`);
      result.details.push({ name: item.name, apiValue: apiVal, spaValue: spaVal, status: 'failed' });
    }
  });

  const minLen = Math.min(apiDayun.length, spaDayun.length);
  for (let i = 0; i < minLen; i++) {
    const apiD = apiDayun[i];
    const spaD = spaDayun[i];

    if (apiD.stem === spaD.stem) {
      result.passed += 1;
      result.details.push({ name: `大运[${i + 1}]天干`, apiValue: apiD.stem, spaValue: spaD.stem, status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`大运[${i}]天干: API=${apiD.stem} SPA=${spaD.stem}`);
      result.details.push({ name: `大运[${i + 1}]天干`, apiValue: apiD.stem, spaValue: spaD.stem, status: 'failed' });
    }

    if (apiD.branch === spaD.branch) {
      result.passed += 1;
      result.details.push({ name: `大运[${i + 1}]地支`, apiValue: apiD.branch, spaValue: spaD.branch, status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`大运[${i}]地支: API=${apiD.branch} SPA=${spaD.branch}`);
      result.details.push({ name: `大运[${i + 1}]地支`, apiValue: apiD.branch, spaValue: spaD.branch, status: 'failed' });
    }

    if (apiD.nayin === spaD.nayin) {
      result.passed += 1;
      result.details.push({ name: `大运[${i + 1}]纳音`, apiValue: apiD.nayin, spaValue: spaD.nayin, status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`大运[${i}]纳音: API=${apiD.nayin} SPA=${spaD.nayin}`);
      result.details.push({ name: `大运[${i + 1}]纳音`, apiValue: apiD.nayin, spaValue: spaD.nayin, status: 'failed' });
    }
  }

  if (apiDayun.length !== spaDayun.length) {
    result.failed += 1;
    result.mismatches.push(`大运数量: API=${apiDayun.length} SPA=${spaDayun.length}`);
    result.details.push({ name: '大运数量', apiValue: apiDayun.length, spaValue: spaDayun.length, status: 'failed' });
  }

  return result;
}

/**
 * 比较格局分析
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareGeju(api, spa) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const apiGeju = api.geju;
  const spaGeju = spa.geju;

  if (!apiGeju && !spaGeju) return result;
  if (!apiGeju) {
    result.mismatches.push('格局分析: API缺失');
    result.failed += 1;
    result.details.push({ name: '格局分析', apiValue: '缺失', spaValue: '有', status: 'failed' });
    return result;
  }
  if (!spaGeju) {
    result.mismatches.push('格局分析: SPA缺失');
    result.failed += 1;
    result.details.push({ name: '格局分析', apiValue: '有', spaValue: '缺失', status: 'failed' });
    return result;
  }

  const fields = [
    { apiVal: apiGeju.geju, spaVal: spaGeju.geju, name: '格局名称' },
    { apiVal: apiGeju.shuoming || '', spaVal: spaGeju.shuoming || '', name: '格局说明' },
    { apiVal: apiGeju.tiaohou || '', spaVal: spaGeju.tiaohou || '', name: '调候' },
    { apiVal: (apiGeju.xiyong || []).join(',') || '', spaVal: (spaGeju.xiyong || []).join(',') || '', name: '喜用神' },
    { apiVal: (apiGeju.jihui || []).join(',') || '', spaVal: (spaGeju.jihui || []).join(',') || '', name: '忌讳神' },
    { apiVal: apiGeju.jianyi || '', spaVal: spaGeju.jianyi || '', name: '格局建议' }
  ];

  fields.forEach(field => {
    if (field.apiVal === field.spaVal) {
      result.passed += 1;
      result.details.push({ name: field.name, apiValue: field.apiVal || '无', spaValue: field.spaVal || '无', status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`${field.name}: API=${field.apiVal} SPA=${field.spaVal}`);
      result.details.push({ name: field.name, apiValue: field.apiVal || '无', spaValue: field.spaVal || '无', status: 'failed' });
    }
  });

  return result;
}

/**
 * 比较八字数组（baziArr）
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareBaziArr(api, spa) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  const pillarNames = ['年干', '年支', '月干', '月支', '日干', '日支', '时干', '时支'];
  const apiBaziObj = api.baseInfo?.baziArr || {};
  const apiBaziArr = [
    apiBaziObj.niangan || '',
    apiBaziObj.nianzhi || '',
    apiBaziObj.yuegan || '',
    apiBaziObj.yuezhi || '',
    apiBaziObj.rigan || '',
    apiBaziObj.rizhi || '',
    apiBaziObj.shigan || '',
    apiBaziObj.shizhi || ''
  ];
  const spaBaziArr = [
    spa.year?.heavenStem || '',
    spa.year?.earthBranch || '',
    spa.month?.heavenStem || '',
    spa.month?.earthBranch || '',
    spa.day?.heavenStem || '',
    spa.day?.earthBranch || '',
    spa.hour?.heavenStem || '',
    spa.hour?.earthBranch || ''
  ];

  pillarNames.forEach((name, i) => {
    if (apiBaziArr[i] === spaBaziArr[i]) {
      result.passed += 1;
      result.details.push({ name: `八字${name}`, apiValue: apiBaziArr[i] || '无', spaValue: spaBaziArr[i] || '无', status: 'passed' });
    } else {
      result.failed += 1;
      result.mismatches.push(`八字${name}: API=${apiBaziArr[i]} SPA=${spaBaziArr[i]}`);
      result.details.push({ name: `八字${name}`, apiValue: apiBaziArr[i] || '无', spaValue: spaBaziArr[i] || '无', status: 'failed' });
    }
  });

  return result;
}

/**
 * 比较天干地支关系
 * @param {Object} api - API返回的关系数据
 * @param {Object} spa - SPA返回的关系数据
 * @param {Array} acceptableDifferences - 可接受的差异数组（引用传递）
 * @returns {Object} 比较结果对象 { mismatches: [], passed: 0, failed: 0, details: [] }
 */
function compareRelationships(api, spa, acceptableDifferences) {
  const result = { mismatches: [], passed: 0, failed: 0, details: [] };
  if (!api && !spa) return result;
  if (!api && spa) {
    result.mismatches.push('关系数据缺失: api缺失');
    result.failed += 1;
    result.details.push({ name: '关系数据', apiValue: '缺失', spaValue: '有', status: 'failed' });
    return result;
  }
  if (!spa && api) {
    result.mismatches.push('关系数据缺失: spa缺失');
    result.failed += 1;
    result.details.push({ name: '关系数据', apiValue: '有', spaValue: '缺失', status: 'failed' });
    return result;
  }

  const apiStems = api.stems || [];
  const apiBranches = api.branches || [];
  const spaStems = spa.stems || [];
  const spaBranches = spa.branches || [];

  const apiStemsBySource = {};
  apiStems.forEach(r => {
    const source = r.source || '';
    if (!apiStemsBySource[source]) apiStemsBySource[source] = [];
    apiStemsBySource[source].push(r);
  });

  const apiBranchesBySource = {};
  apiBranches.forEach(r => {
    const source = r.source || '';
    if (!apiBranchesBySource[source]) apiBranchesBySource[source] = [];
    apiBranchesBySource[source].push(r);
  });

  const spaStemsBySource = {};
  spaStems.forEach(r => {
    const source = r.source || '';
    if (!spaStemsBySource[source]) spaStemsBySource[source] = [];
    spaStemsBySource[source].push(r);
  });

  const spaBranchesBySource = {};
  spaBranches.forEach(r => {
    const source = r.source || '';
    if (!spaBranchesBySource[source]) spaBranchesBySource[source] = [];
    spaBranchesBySource[source].push(r);
  });

  const apiStemSources = Object.keys(apiStemsBySource);
  for (const source of apiStemSources) {
    const apiRels = apiStemsBySource[source] || [];
    const spaRels = spaStemsBySource[source] || [];

    for (const apiRel of apiRels) {
      const spaRel = spaRels.find(r => r.desc === apiRel.desc);

      if (!spaRel) {
        if (API_OTHER_NEW_RELATIONS.includes(apiRel.desc)) {
          const relationType = getRelationType(apiRel.desc);
          const detailType = apiRel.detailType || apiRel.type || '';
          const fieldName = `天干-${detailType.replace('天干', '')}` || '天干关系';
          acceptableDifferences.push({
            field: 'stem_relationships',
            fieldName: fieldName,
            apiValue: apiRel.desc,
            spaValue: '无',
            differenceType: 'api_only',
            reason: relationType
          });
          result.passed += 1;
          result.details.push({ name: fieldName, apiValue: apiRel.desc, spaValue: '无', status: 'passed', acceptable: true, reason: relationType });
        } else {
          result.failed += 1;
          result.mismatches.push(`天干关系: API有${apiRel.desc}但SPA没有`);
          result.details.push({ name: '天干关系', apiValue: apiRel.desc, spaValue: '无', status: 'failed' });
        }
      } else if (apiRel.desc === spaRel.desc) {
        const detailType = apiRel.detailType || apiRel.type || '';
        const fieldName = `天干-${detailType.replace('天干', '')}` || '天干关系';
        result.passed += 1;
        result.details.push({ name: fieldName, apiValue: apiRel.desc, spaValue: spaRel.desc, status: 'passed' });
      } else {
        result.failed += 1;
        result.mismatches.push(`天干关系: API=${apiRel.desc} SPA=${spaRel.desc}`);
        result.details.push({ name: '天干关系', apiValue: apiRel.desc, spaValue: spaRel.desc, status: 'failed' });
      }
    }
  }

  const apiBranchSources = Object.keys(apiBranchesBySource);
  for (const source of apiBranchSources) {
    const apiRels = apiBranchesBySource[source] || [];
    const spaRels = spaBranchesBySource[source] || [];

    for (const apiRel of apiRels) {
      const spaRel = spaRels.find(r => r.desc === apiRel.desc);

      if (!spaRel) {
        if (API_OTHER_NEW_RELATIONS.includes(apiRel.desc)) {
          const relationType = getRelationType(apiRel.desc);
          const detailType = apiRel.detailType || apiRel.type || '';
          const fieldName = `地支-${detailType.replace('地支', '')}` || '地支关系';
          acceptableDifferences.push({
            field: 'branch_relationships',
            fieldName: fieldName,
            apiValue: apiRel.desc,
            spaValue: '无',
            differenceType: 'api_only',
            reason: relationType
          });
          result.passed += 1;
          result.details.push({ name: fieldName, apiValue: apiRel.desc, spaValue: '无', status: 'passed', acceptable: true, reason: relationType });
        } else {
          result.failed += 1;
          result.mismatches.push(`地支关系: API有${apiRel.desc}但SPA没有`);
          result.details.push({ name: '地支关系', apiValue: apiRel.desc, spaValue: '无', status: 'failed' });
        }
      } else if (apiRel.desc === spaRel.desc) {
        const detailType = apiRel.detailType || apiRel.type || '';
        const fieldName = `地支-${detailType.replace('地支', '')}` || '地支关系';
        result.passed += 1;
        result.details.push({ name: fieldName, apiValue: apiRel.desc, spaValue: spaRel.desc, status: 'passed' });
      } else {
        result.failed += 1;
        result.mismatches.push(`地支关系: API=${apiRel.desc} SPA=${spaRel.desc}`);
        result.details.push({ name: '地支关系', apiValue: apiRel.desc, spaValue: spaRel.desc, status: 'failed' });
      }
    }
  }

  return result;
}

/**
 * 比较完整结果
 * @param {Object} api - API返回的数据
 * @param {Object} spa - SPA返回的数据
 * @returns {Object} 比较结果
 */
function compareFullResults(api, spa) {
  const comparisonItems = {};
  const allMismatches = [];
  const acceptableDifferences = [];
  const allDetails = [];

  const addComparisonResult = (name, result) => {
    comparisonItems[name] = {
      status: result.failed > 0 ? 'failed' : 'passed',
      passed: result.passed,
      failed: result.failed,
      total: result.passed + result.failed,
      details: result.details
    };
    allMismatches.push(...result.mismatches);
    allDetails.push(...result.details);
  };

  const pillarNames = { nian: '年', yue: '月', ri: '日', shi: '时' };
  const pillars = ['nian', 'yue', 'ri', 'shi'];
  let pillarResult = { mismatches: [], passed: 0, failed: 0, details: [] };
  pillars.forEach(pillar => {
    const r = comparePillars(api, spa, pillar);
    pillarResult.mismatches.push(...r.mismatches);
    pillarResult.passed += r.passed;
    pillarResult.failed += r.failed;
    pillarResult.details.push(...r.details);
  });
  addComparisonResult('四柱', pillarResult);

  const baziArrResult = compareBaziArr(api, spa);
  addComparisonResult('八字数组', baziArrResult);

  const nayinResult = compareNayin(api, spa);
  addComparisonResult('纳音', nayinResult);

  const wuxingResult = compareWuxingEnergy(api, spa);
  addComparisonResult('五行能量', wuxingResult);

  const dayunResult = compareDayun(api, spa);
  addComparisonResult('大运', dayunResult);

  const shenshaResult = compareShensha(api, spa);
  addComparisonResult('神煞', shenshaResult);

  const relationshipsResult = compareRelationships(api.relationships || api.chonghe, spa.relationships || spa.chonghe, acceptableDifferences);
  addComparisonResult('天干地支关系', relationshipsResult);

  const gejuResult = compareGeju(api, spa);
  addComparisonResult('格局分析', gejuResult);

  const QIYUN_TOLERANCE_MINUTES = 10;
  const apiQiyun = api.dayun?.qiyun;
  const spaQiyun = spa.dayun?.qiyun;

  if (apiQiyun && spaQiyun && apiQiyun !== spaQiyun) {
    const parseQiyunTime = (str) => {
      if (!str) return null;
      const timeMatch = str.match(/(\d{4})年(\d+)月(\d+)日\s+(\d+):(\d+):?(\d*)/);
      if (timeMatch) {
        return new Date(
          parseInt(timeMatch[1]),
          parseInt(timeMatch[2]) - 1,
          parseInt(timeMatch[3]),
          parseInt(timeMatch[4]),
          parseInt(timeMatch[5]),
          parseInt(timeMatch[6] || 0)
        );
      }
      return null;
    };

    const apiTime = parseQiyunTime(apiQiyun);
    const spaTime = parseQiyunTime(spaQiyun);

    if (apiTime && spaTime) {
      const diffMs = Math.abs(apiTime - spaTime);
      const diffMinutes = Math.round(diffMs / 60000);

      if (diffMinutes <= QIYUN_TOLERANCE_MINUTES) {
        acceptableDifferences.push({
          field: 'qiyunTime',
          fieldName: '起运时间',
          apiValue: apiQiyun,
          spaValue: spaQiyun,
          differenceType: 'api_different_from_spa',
          reason: `差异${diffMinutes}分钟（tyme库差异导致）`
        });
        comparisonItems['起运时间'] = {
          status: 'passed',
          passed: 1,
          failed: 0,
          total: 1,
          details: [{ name: '起运时间', apiValue: apiQiyun, spaValue: spaQiyun, status: 'passed', acceptable: true, reason: `差异${diffMinutes}分钟（tyme库差异导致）` }]
        };
      } else {
        allMismatches.push(`起运时间: API=${apiQiyun} SPA=${spaQiyun} (差异${diffMinutes}分钟，超出容差${QIYUN_TOLERANCE_MINUTES}分钟)`);
        comparisonItems['起运时间'] = {
          status: 'failed',
          passed: 0,
          failed: 1,
          total: 1,
          details: [{ name: '起运时间', apiValue: apiQiyun, spaValue: spaQiyun, status: 'failed', reason: `差异${diffMinutes}分钟，超出容差` }]
        };
      }
    }
  }

  return {
    comparisonItems,
    mismatches: allMismatches,
    acceptableDifferences
  };
}

module.exports = {
  comparePillars,
  compareNayin,
  compareWuxingEnergy,
  compareDayun,
  compareGeju,
  compareRelationships,
  compareShensha,
  compareFullResults,
  API_NEW_STEM_TYPES,
  API_NEW_BRANCH_TYPES,
  API_OTHER_NEW_RELATIONS
};
