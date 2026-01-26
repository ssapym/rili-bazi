/**
 * 详细对比测试
 * 
 * 详细展示每个测试案例的四柱数据
 * 包括藏干、空亡、神煞等详细信息
 * 
 * 前置要求：
 *   1. 启动 API 服务器: cd server && node server.js
 *   2. 启动 SPA 服务器: python3 -m http.server 8001
 */

const { SolarTime, ChildLimit, Gender, SixtyCycle } = require('tyme4ts');
const http = require('http');
const { TEST_CASES, BEIJING_DONGCHENG_LONGITUDE } = require('./test_config');

function callAPI(params) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams(params).toString();
    http.get(`http://localhost:8000/api/bazi?${query}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function calculateSPAResult(year, month, day, hour, gender) {
  const tymeGender = gender === '男' ? Gender.MAN : Gender.WOMAN;
  const solarTime = SolarTime.fromYmdHms(year, month, day, hour, 0, 0);
  const childLimit = ChildLimit.fromSolarTime(solarTime, tymeGender);
  const eightChar = childLimit.getEightChar();

  const yearSc = eightChar.getYear();
  const monthSc = eightChar.getMonth();
  const daySc = eightChar.getDay();
  const hourSc = eightChar.getHour();
  const dayHeavenStem = daySc.getHeavenStem();

  function buildPillar(sc, isDayPillar) {
    const stem = sc.getHeavenStem();
    const branch = sc.getEarthBranch();
    const branchObj = sc.getEarthBranch();
    const scName = stem.getName() + branch.getName();
    const sixtyCycle = SixtyCycle.fromName(scName);

    const hideHeavenStems = [
      { stem: branchObj.getHideHeavenStemMain(), level: '本气' },
      { stem: branchObj.getHideHeavenStemMiddle(), level: '中气' },
      { stem: branchObj.getHideHeavenStemResidual(), level: '余气' }
    ].filter(h => h.stem).map(h => ({
      name: h.stem.getName(),
      level: h.level,
      tenStar: dayHeavenStem.getTenStar(h.stem).getName()
    }));

    const extraEarthBranches = sixtyCycle.getExtraEarthBranches()?.map(b => b.getName()) || [];
    const pillarTenStar = isDayPillar ? '比肩' : dayHeavenStem.getTenStar(stem).getName();

    return {
      heavenStem: stem.getName(),
      earthBranch: branch.getName(),
      tenStar: pillarTenStar,
      hideHeavenStems: hideHeavenStems,
      extraEarthBranches: extraEarthBranches,
      terrain: dayHeavenStem.getTerrain(branch).getName(),
      terrainSelf: stem.getTerrain(branch).getName(),
      sound: sc.getSound().toString()
    };
  }

  return {
    year: buildPillar(yearSc, false),
    month: buildPillar(monthSc, false),
    day: buildPillar(daySc, true),
    hour: buildPillar(hourSc, false)
  };
}

function printPillarResult(testCase, spaResult, apiResult) {
  console.log('\n' + '='.repeat(70));
  console.log(`【测试案例】${testCase.year}-${testCase.month}-${testCase.day} ${testCase.hour}:00 ${testCase.gender} (${testCase.name})`);
  console.log('='.repeat(70));

  const pillars = ['year', 'month', 'day', 'hour'];
  const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
  const apiKeyMap = { 'year': 'nian', 'month': 'yue', 'day': 'ri', 'hour': 'shi' };

  const apiSizhu = (apiResult.sizhu || {});

  pillars.forEach((key, idx) => {
    const spa = spaResult[key];
    const api = apiSizhu[apiKeyMap[key]];

    console.log(`\n【${pillarNames[idx]}】`);
    console.log(`  天干:  SPA=${spa.heavenStem}  |  API=${api.tiangan}  |  ${spa.heavenStem === api.tiangan ? '✅' : '❌'}`);
    console.log(`  地支:  SPA=${spa.earthBranch}  |  API=${api.dizhi}  |  ${spa.earthBranch === api.dizhi ? '✅' : '❌'}`);
    console.log(`  十神:  SPA=${spa.tenStar}  |  API=${api.zhuxing}  |  ${spa.tenStar === api.zhuxing ? '✅' : '❌'}`);
    console.log(`  星运:  SPA=${spa.terrain}  |  API=${api.xingyun}  |  ${spa.terrain === api.xingyun ? '✅' : '❌'}`);
    console.log(`  自坐:  SPA=${spa.terrainSelf}  |  API=${api.zizuo}  |  ${spa.terrainSelf === api.zizuo ? '✅' : '❌'}`);
    console.log(`  纳音:  SPA=${spa.sound}  |  API=${api.nayin}  |  ${spa.sound === api.nayin ? '✅' : '❌'}`);
    console.log(`  空亡:  SPA=[${spa.extraEarthBranches.join(',')}]  |  API=[${api.kongwang?.join(',')}]  |  ${JSON.stringify(spa.extraEarthBranches.sort()) === JSON.stringify((api.kongwang || []).sort()) ? '✅' : '❌'}`);

    console.log(`  藏干:`);
    spa.hideHeavenStems.forEach((h, i) => {
      const apiH = api.canggan?.[i];
      const match = h.name === apiH?.ming && h.tenStar === apiH?.shishen;
      console.log(`    [${h.level}] ${h.name} (主星=${h.tenStar} 副星=${h.fuxing || '无'})  |  API(${apiH?.jibie || ''}) ${apiH?.ming} (主星=${apiH?.shishen} 副星=${apiH?.fuxing || '无'})  |  ${match ? '✅' : '❌'}`);
    });

    const pillarShensha = api?.shensha || [];
    console.log(`  神煞:  [${pillarShensha.join(',')}]`);
  });

  console.log('\n【神煞汇总】');
  console.log(`  年柱: ${(apiSizhu.year?.shensha || []).join(', ') || '无'}`);
  console.log(`  月柱: ${(apiSizhu.yue?.shensha || []).join(', ') || '无'}`);
  console.log(`  日柱: ${(apiSizhu.ri?.shensha || []).join(', ') || '无'}`);
  console.log(`  时柱: ${(apiSizhu.shi?.shensha || []).join(', ') || '无'}`);
}

async function runTest() {
  console.log('='.repeat(70));
  console.log('八字API详细对比测试');
  console.log('='.repeat(70));

  let allPassed = true;

  for (const testCase of TEST_CASES) {
    const spaResult = calculateSPAResult(testCase.year, testCase.month, testCase.day, testCase.hour, testCase.gender);

    const params = {
      year: testCase.year,
      month: testCase.month,
      day: testCase.day,
      hour: testCase.hour,
      minute: 0,
      longitude: BEIJING_DONGCHENG_LONGITUDE,
      gender: testCase.gender === '男' ? 1 : 2,
      useTrueSolar: true
    };

    const apiResponse = await callAPI(params);
    if (!apiResponse.success || !apiResponse.data) {
      console.error(`API调用失败: ${apiResponse.error?.message || '未知错误'}`);
      allPassed = false;
      continue;
    }

    const apiResult = apiResponse.data;
    printPillarResult(testCase, spaResult, apiResult);
  }

  console.log('\n' + '='.repeat(70));
  console.log(allPassed ? '✅ 所有测试通过' : '❌ 部分测试失败');
  console.log('='.repeat(70));
}

runTest().catch(console.error);
