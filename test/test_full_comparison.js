/**
 * 完整对比测试
 * 
 * 对比 API 和 SPA 的计算结果
 * 覆盖：四柱、纳音、五行能量、大运、神煞、地支关系
 * 
 * 前置要求：
 *   1. 启动 API 服务器: cd server && node server.js
 *   2. 启动 SPA 服务器: python3 -m http.server 8001
 */

const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { TEST_CASES, BEIJING_DONGCHENG_LONGITUDE, CHROME_PATH } = require('./test_config');

const RESULTS_DIR = path.join(__dirname, 'results');
const FAILED_CASES_FILE = path.join(__dirname, 'failed_cases.json');

/**
 * 保存失败用例到文件
 * 会自动去重，避免重复保存相同的失败用例
 * 如果用例之前已修复，会更新状态为"失败"
 * @param {Array} failedCases - 失败用例数组
 */
function saveFailedCases(failedCases) {
  try {
    let existingCases = [];
    if (fs.existsSync(FAILED_CASES_FILE)) {
      const data = fs.readFileSync(FAILED_CASES_FILE, 'utf8');
      existingCases = JSON.parse(data);
    }

    const existingKeys = new Map();
    existingCases.forEach(tc => {
      const key = `${tc.year}-${tc.month}-${tc.day}-${tc.hour}-${tc.gender}`;
      existingKeys.set(key, tc);
    });

    const newCases = [];
    const updatedCases = [];

    failedCases.forEach(tc => {
      const key = `${tc.year}-${tc.month}-${tc.day}-${tc.hour}-${tc.gender}`;
      const existing = existingKeys.get(key);
      
      if (!existing) {
        newCases.push({
          ...tc,
          status: '失败'
        });
      } else if (existing.status === '已修复' || existing.status === '已清空') {
        updatedCases.push({
          ...existing,
          status: '失败',
          failedAt: new Date().toISOString(),
          mismatches: tc.mismatches
        });
      }
    });

    if (newCases.length > 0 || updatedCases.length > 0) {
      const allCases = [...existingCases, ...newCases];
      
      updatedCases.forEach(updated => {
        const index = allCases.findIndex(tc => 
          tc.year === updated.year && 
          tc.month === updated.month && 
          tc.day === updated.day && 
          tc.hour === updated.hour && 
          tc.gender === updated.gender
        );
        if (index !== -1) {
          allCases[index] = updated;
        }
      });
      
      fs.writeFileSync(FAILED_CASES_FILE, JSON.stringify(allCases, null, 2), 'utf8');
      const totalSaved = newCases.length + updatedCases.length;
      console.log(`\n💾 已保存 ${totalSaved} 个失败用例到 ${FAILED_CASES_FILE}`);
      if (updatedCases.length > 0) {
        console.log(`   其中 ${updatedCases.length} 个之前已修复的用例重新标记为失败`);
      }
    }
  } catch (error) {
    console.warn(`保存失败用例文件失败: ${error.message}`);
  }
}

/**
 * 标记失败用例为已修复
 * 当失败用例测试通过时，更新其状态为"已修复"
 * @param {Array} fixedCases - 已修复的失败用例数组
 */
function markAsFixed(fixedCases) {
  try {
    if (fixedCases.length === 0) return;
    
    if (!fs.existsSync(FAILED_CASES_FILE)) {
      console.log(`\n⚠️  失败用例文件不存在，无法更新状态`);
      return;
    }

    const data = fs.readFileSync(FAILED_CASES_FILE, 'utf8');
    const existingCases = JSON.parse(data);
    
    let updatedCount = 0;
    
    fixedCases.forEach(fixedTc => {
      const index = existingCases.findIndex(tc => 
        tc.year === fixedTc.year && 
        tc.month === fixedTc.month && 
        tc.day === fixedTc.day && 
        tc.hour === fixedTc.hour && 
        tc.gender === fixedTc.gender
      );
      
      if (index !== -1 && existingCases[index].status === '失败') {
        existingCases[index] = {
          ...existingCases[index],
          status: '已修复',
          fixedAt: new Date().toISOString()
        };
        updatedCount++;
      }
    });
    
    if (updatedCount > 0) {
      fs.writeFileSync(FAILED_CASES_FILE, JSON.stringify(existingCases, null, 2), 'utf8');
      console.log(`\n✅ 已将 ${updatedCount} 个失败用例标记为已修复`);
    }
  } catch (error) {
    console.warn(`更新失败用例状态失败: ${error.message}`);
  }
}

/**
 * 调用API获取八字计算结果
 * @param {Object} params - 请求参数对象
 * @returns {Promise<Object>} API返回的计算结果
 */
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

/**
 * 测试SPA页面获取八字计算结果
 * @param {Object} tc - 测试用例对象
 * @param {Object} browser - Puppeteer浏览器实例
 * @returns {Promise<Object>} SPA返回的计算结果
 */
async function testSPA(tc, browser) {
  let page = null;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.setDefaultTimeout(30000);

    const typeLabel = tc.isFailed ? '(失败用例)' : tc.isRandom ? '(随机生成)' : tc.isSingle ? '(单个指定)' : '(预设用例)';
    console.log(`\n${'='.repeat(60)}`);
    console.log(`测试: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} (${tc.age}岁) ${typeLabel}`);
    console.log('='.repeat(60));

    await page.goto('http://localhost:8001/', { waitUntil: 'networkidle0' });
    await page.click('[data-tab="bazi"]');
    await new Promise(r => setTimeout(r, 1500));
    await page.waitForSelector('#solar-year');

    await page.click('#solar-year', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#solar-year', String(tc.year), { delay: 30 });
    await page.keyboard.press('Tab');

    await page.click('#solar-month', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#solar-month', String(tc.month), { delay: 30 });
    await page.keyboard.press('Tab');

    await page.click('#solar-day', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#solar-day', String(tc.day), { delay: 30 });
    await page.keyboard.press('Tab');

    await page.click('#cfg-hour', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#cfg-hour', String(tc.hour), { delay: 30 });
    await page.click('#cfg-minute', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#cfg-minute', '0', { delay: 30 });
    await page.click('#cfg-second', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#cfg-second', '0', { delay: 30 });

    const genderValue = tc.gender === '男' ? '1' : '0';
    await page.evaluate((gv) => {
      const radios = document.querySelectorAll('input[name="cfg-gender"]');
      radios.forEach(r => {
        if (r.value === gv) {
          r.checked = true;
          r.dispatchEvent(new Event('change'));
        }
      });
    }, genderValue);

    await page.evaluate(() => {
      const checkbox = document.getElementById('cfg-true-solar-enable');
      if (checkbox && !checkbox.checked) {
        checkbox.click();
      }
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const province = document.getElementById('cfg-province');
      if (province) {
        province.value = '110000';
        province.dispatchEvent(new Event('change'));
      }
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const city = document.getElementById('cfg-city');
      if (city) {
        city.value = '110100';
        city.dispatchEvent(new Event('change'));
      }
    });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const district = document.getElementById('cfg-district');
      if (district) {
        district.value = '110101';
        district.dispatchEvent(new Event('change'));
      }
    });

    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const btn = document.getElementById('btn-apply-config');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 5000));

    const spaData = await page.evaluate(() => {
      const vm = window.eightCharApp;
      if (!vm || !vm.$data) return null;
      const d = vm.$data;
      if (!d.year || !d.year.heavenStem) return null;

      const extractPillar = (p) => ({
        heavenStem: p?.heavenStem || '',
        earthBranch: p?.earthBranch || '',
        tenStar: p?.tenStar?.heavenStem || '',
        terrain: p?.terrain || '',
        terrainSelf: p?.terrainSelf || '',
        sound: p?.sound || '',
        hideHeavenStems: (p?.hideHeavenStems || []).map(h => ({
          name: h?.name || '',
          tenStar: h?.tenStar || ''
        })),
        extraEarthBranches: p?.extraEarthBranches || []
      });

      return {
        year: extractPillar(d.year),
        month: extractPillar(d.month),
        day: extractPillar(d.day),
        hour: extractPillar(d.hour),
        nayin: {
          nian: d.year?.sound || '',
          yue: d.month?.sound || '',
          ri: d.day?.sound || '',
          shi: d.hour?.sound || ''
        },
        wuxingEnergy: d.wuxingEnergy ? {
          summary: d.wuxingEnergy.summary || '',
          bodyStrengthText: d.wuxingEnergy.bodyStrengthText || '',
          balanceIndex: d.wuxingEnergy.balanceIndex || 0,
          elements: (d.wuxingEnergy.elements || []).map(e => ({
            name: e?.name || '',
            score: e?.score || 0,
            percentage: e?.percentage || 0
          }))
        } : null,
        dayun: {
          minggong: d.ownSign || {name: '', sound: ''},
          shengong: d.bodySign || {name: '', sound: ''},
          taiyuan: d.fetalOrigin || {name: '', sound: ''},
          taixi: d.fetalBreath || {name: '', sound: ''},
          qiyun: d.childLimitInfo ? `${d.childLimitInfo.year}年${d.childLimitInfo.month}个月${d.childLimitInfo.day}天${d.childLimitInfo.hour}时${d.childLimitInfo.minute}分 (${d.childLimitInfo.endSolarTime}后起运)` : '',
          dayun: (d.decadeFortunes || []).map((dy, idx) => ({
             ganzhi: dy?.sixtyCycle || dy?.name || `大运${idx}`,
             startYear: dy?.startYear || dy?.start || 0,
             endYear: dy?.endYear || dy?.end || 0,
             startAge: dy?.startAge || 0,
             endAge: dy?.endAge || 0,
             shishen: dy?.tenStar || ''
           }))
        },
        shensha: {
          nian: d.sizhu?.nian?.shensha || d.year?.shensha || [],
          yue: d.sizhu?.yue?.shensha || d.month?.shensha || [],
          ri: d.sizhu?.ri?.shensha || d.day?.shensha || [],
          shi: d.sizhu?.shi?.shensha || d.hour?.shensha || []
        },
        geju: {
          geju: d.wuxingEnergy?.summary?.match(/【(.+?)】/)?.[1] || '',
          shuoming: d.wuxingEnergy?.summary?.replace(/本命局为【.+?】。/, '') || '',
          tiaohou: d.wuxingEnergy?.climate || '',
          xiyong: d.wuxingEnergy?.preferences?.likes || [],
          jihui: d.wuxingEnergy?.preferences?.dislikes || [],
          jianyi: d.wuxingEnergy?.suggestion || ''
        },
        relationships: d.chonghe || d.relationships || { stems: [], branches: [] }
      };
    });

    if (page) {
      await page.close();
    }
    return spaData;
  } catch (error) {
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('关闭页面失败:', e.message);
      }
    }
    throw error;
  }
}

/**
 * 对比四柱八字
 * @param {Object} api - API返回的四柱数据
 * @param {Object} spa - SPA返回的四柱数据
 * @param {string} pillarName - 柱名称（年柱、月柱、日柱、时柱）
 * @returns {Array} 差异数组
 */
function comparePillars(api, spa, pillarName) {
  const mismatches = [];
  if (!api || !spa) {
    mismatches.push(`数据缺失: api=${!!api} spa=${!!spa}`);
    return mismatches;
  }
  
  const apiHeavenStem = api.tiangan || '';
  const spaHeavenStem = spa.heavenStem || '';
  if (apiHeavenStem !== spaHeavenStem) {
    mismatches.push(`天干: API=${apiHeavenStem} SPA=${spaHeavenStem}`);
  }
  
  const apiEarthBranch = api.dizhi || '';
  const spaEarthBranch = spa.earthBranch || '';
  if (apiEarthBranch !== spaEarthBranch) {
    mismatches.push(`地支: API=${apiEarthBranch} SPA=${spaEarthBranch}`);
  }
  
  const apiTenStar = api.zhuxing || '';
  const spaTenStar = spa.tenStar || '';
  if (pillarName !== '日柱' && apiTenStar !== spaTenStar) {
    mismatches.push(`十神: API=${apiTenStar} SPA=${spaTenStar}`);
  }
  
  const apiTerrain = api.xingyun || '';
  const spaTerrain = spa.terrain || '';
  if (apiTerrain !== spaTerrain) {
    mismatches.push(`地势: API=${apiTerrain} SPA=${spaTerrain}`);
  }
  
  const apiTerrainSelf = api.zizuo || '';
  const spaTerrainSelf = spa.terrainSelf || '';
  if (apiTerrainSelf !== spaTerrainSelf) {
    mismatches.push(`自坐: API=${apiTerrainSelf} SPA=${spaTerrainSelf}`);
  }
  
  const apiHide = api.canggan || [];
  const spaHide = spa.hideHeavenStems || [];
  if (apiHide.length !== spaHide.length) {
    mismatches.push(`藏干数量: API=${apiHide.length} SPA=${spaHide.length}`);
  } else {
    for (let i = 0; i < apiHide.length; i++) {
      if (apiHide[i].ming !== spaHide[i]?.name ||
          apiHide[i].shishen !== spaHide[i]?.tenStar) {
        mismatches.push(`藏干[${i}]: API=(${apiHide[i].ming},${apiHide[i].shishen}) SPA=(${spaHide[i]?.name || ''},${spaHide[i]?.tenStar || ''})`);
      }
    }
  }
  
  const apiExtra = api.kongwang || [];
  const spaExtra = spa.extraEarthBranches || [];
  if (JSON.stringify(apiExtra.sort()) !== JSON.stringify(spaExtra.sort())) {
    mismatches.push(`空亡: API=${apiExtra.join(',')} SPA=${spaExtra.join(',')}`);
  }
  
  return mismatches;
}

/**
 * 对比纳音
 * @param {Object} api - API返回的纳音数据
 * @param {Object} spa - SPA返回的纳音数据
 * @returns {Array} 差异数组
 */
function compareNayin(api, spa) {
  const mismatches = [];
  const nayinMap = {
    nian: '年柱',
    yue: '月柱',
    ri: '日柱',
    shi: '时柱'
  };
  for (const [key, label] of Object.entries(nayinMap)) {
    if (api.sizhu?.[key]?.nayin !== spa[key]) {
      mismatches.push(`${label}纳音: API=${api.sizhu?.[key]?.nayin} SPA=${spa[key] || 'N/A'}`);
    }
  }
  return mismatches;
}

/**
 * 对比五行能量
 * @param {Object} api - API返回的五行能量数据
 * @param {Object} spa - SPA返回的五行能量数据
 * @returns {Array} 差异数组
 */
function compareWuxingEnergy(api, spa) {
  const mismatches = [];
  if (!api || !spa) {
    if (!api && !spa) return mismatches;
    mismatches.push(`五行能量数据缺失: api=${!!api} spa=${!!spa}`);
    return mismatches;
  }
  
  // 比对总分
  if (api.totalScore !== undefined && spa.totalScore !== undefined) {
    if (Math.abs((api.totalScore || 0) - (spa.totalScore || 0)) > 0.01) {
      mismatches.push(`五行总分: API=${api.totalScore?.toFixed(2)} SPA=${spa.totalScore?.toFixed(2)}`);
    }
  }
  
  // 比对平衡度
  if (api.balance !== undefined && spa.balanceIndex !== undefined) {
    const balanceDiff = Math.abs((api.balance || 0) - (spa.balanceIndex || 0));
    if (balanceDiff > 0.001) {
      mismatches.push(`平衡度: API=${api.balance?.toFixed(3)} SPA=${spa.balanceIndex?.toFixed(3)} (差异: ${balanceDiff.toFixed(3)})`);
    }
  }
  
  const apiElements = api.elements || [];
  const spaElements = spa.elements || [];
  for (const apiEl of apiElements) {
    const spaEl = spaElements.find(e => e.name === apiEl.name);
    if (!spaEl) continue;
    const scoreDiff = Math.abs((apiEl.score || 0) - (spaEl.score || 0));
    if (scoreDiff > 2) {
      mismatches.push(`元素${apiEl.name}得分: API=${apiEl.score?.toFixed(2)} SPA=${spaEl.score?.toFixed(2)}`);
    }
  }
  return mismatches;
}

/**
 * 对比大运
 * @param {Object} api - API返回的大运数据
 * @param {Object} spa - SPA返回的大运数据
 * @returns {Array} 差异数组
 */
function compareDayun(api, spa) {
  const mismatches = [];
  const toleranceNotes = [];
  if (!api || !spa) {
    if (!api && !spa) return mismatches;
    mismatches.push(`大运数据缺失: api=${!!api} spa=${!!spa}`);
    return mismatches;
  }
  
  // 比对命宫
  if (api.minggong?.name !== spa.minggong?.name) {
    mismatches.push(`命宫: API=${api.minggong?.name}(${api.minggong?.sound}) SPA=${spa.minggong?.name}(${spa.minggong?.sound})`);
  }
  
  // 比对身宫
  if (api.shengong?.name !== spa.shengong?.name) {
    mismatches.push(`身宫: API=${api.shengong?.name}(${api.shengong?.sound}) SPA=${spa.shengong?.name}(${spa.shengong?.sound})`);
  }
  
  // 比对胎元
  if (api.taiyuan?.name !== spa.taiyuan?.name) {
    mismatches.push(`胎元: API=${api.taiyuan?.name}(${api.taiyuan?.sound}) SPA=${spa.taiyuan?.name}(${spa.taiyuan?.sound})`);
  }
  
  // 比对胎息
  if (api.taixi?.name !== spa.taixi?.name) {
    mismatches.push(`胎息: API=${api.taixi?.name}(${api.taixi?.sound}) SPA=${spa.taixi?.name}(${spa.taixi?.sound})`);
  }
  
  // 比对起运信息（容差比较，允许10分钟差异）
  const QIYUN_TOLERANCE_MINUTES = 10;
  if (api.qiyun !== spa.qiyun) {
    // 解析起运信息中的时间
    const parseQiyunTime = (str) => {
      if (!str) return null;
      // 匹配格式: "8年1个月17天22时4分 (2005年5月29日 07:48:24后起运)" 或类似格式
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
    
    const apiTime = parseQiyunTime(api.qiyun);
    const spaTime = parseQiyunTime(spa.qiyun);
    
    if (apiTime && spaTime) {
      const diffMs = Math.abs(apiTime - spaTime);
      const diffMinutes = Math.round(diffMs / 60000);
      
      if (diffMinutes <= QIYUN_TOLERANCE_MINUTES) {
        // 在容差范围内，记录为可接受的差异
        toleranceNotes.push(`起运时间差异: ${diffMinutes}分钟 (API: ${api.qiyun}, SPA: ${spa.qiyun}) - 已接受（tyme库差异导致）`);
      } else {
        mismatches.push(`起运信息: API=${api.qiyun} SPA=${spa.qiyun}`);
      }
    } else {
      mismatches.push(`起运信息: API=${api.qiyun} SPA=${spa.qiyun}`);
    }
  }
  
  const apiDayun = api.dayun || [];
  const spaDayun = spa.dayun || [];
  if (apiDayun.length !== spaDayun.length) {
    mismatches.push(`大运数量: API=${apiDayun.length} SPA=${spaDayun.length}`);
  }
  
  for (let i = 0; i < Math.min(apiDayun.length, spaDayun.length); i++) {
    const apiDy = apiDayun[i];
    const spaDy = spaDayun[i];
    
    // 检查是否是童限（第一个大运）
    const label = i === 0 ? '童限' : `大运${i+1}`;
    
    // 比对干支
    if (apiDy.ganzhi !== spaDy.ganzhi) {
      mismatches.push(`${label}干支: API=${apiDy.ganzhi} SPA=${spaDy.ganzhi}`);
    }
    
    // 比对起始年
    if ((apiDy.startYear || apiDy.qishinian) !== (spaDy.startYear || spaDy.qishinian)) {
      mismatches.push(`${label}起始年: API=${apiDy.startYear || apiDy.qishinian} SPA=${spaDy.startYear || spaDy.qishinian}`);
    }
    
    // 比对结束年
    if ((apiDy.endYear || apiDy.zhishinian) !== (spaDy.endYear || spaDy.zhishinian)) {
      mismatches.push(`${label}结束年: API=${apiDy.endYear || apiDy.zhishinian} SPA=${spaDy.endYear || spaDy.zhishinian}`);
    }
    
    // 比对起始年龄
    const startAgeDiff = Math.abs((apiDy.startAge || 0) - (spaDy.startAge || 0));
    if (startAgeDiff > 1) {
      mismatches.push(`${label}起始年龄: API=${apiDy.startAge} SPA=${spaDy.startAge}`);
    }
    
    // 比对结束年龄
    const endAgeDiff = Math.abs((apiDy.endAge || 0) - (spaDy.endAge || 0));
    if (endAgeDiff > 1) {
      mismatches.push(`${label}结束年龄: API=${apiDy.endAge} SPA=${spaDy.endAge}`);
    }
    
    // 比对十神
    if (apiDy.shishen !== spaDy.shishen) {
      mismatches.push(`${label}十神: API=${apiDy.shishen} SPA=${spaDy.shishen}`);
    }
  }
  return { mismatches, toleranceNotes };
}

function compareGeju(api, spa) {
  const mismatches = [];
  if (!api && !spa) return mismatches;
  if (!api && spa) {
    mismatches.push(`格局数据缺失: api缺失`);
    return mismatches;
  }
  if (!spa && api) {
    mismatches.push(`格局数据缺失: spa缺失`);
    return mismatches;
  }

  // 比对格局名称
  if (api.geju !== spa.geju) {
    mismatches.push(`格局名称: API=${api.geju} SPA=${spa.geju}`);
  }

  // 比对说明
  if (api.shuoming !== spa.shuoming) {
    mismatches.push(`格局说明: API=${api.shuoming} SPA=${spa.shuoming}`);
  }

  // 比对调候
  if (api.tiaohou !== spa.tiaohou) {
    mismatches.push(`调候: API=${api.tiaohou} SPA=${spa.tiaohou}`);
  }

  // 比对喜用神
  if (JSON.stringify(api.xiyong) !== JSON.stringify(spa.xiyong)) {
    mismatches.push(`喜用神: API=${api.xiyong?.join(',')} SPA=${spa.xiyong?.join(',')}`);
  }

  // 比对忌讳神
  if (JSON.stringify(api.jihui) !== JSON.stringify(spa.jihui)) {
    mismatches.push(`忌讳神: API=${api.jihui?.join(',')} SPA=${spa.jihui?.join(',')}`);
  }

  // 比对建议
  if (api.jianyi !== spa.jianyi) {
    mismatches.push(`格局建议: API=${api.jianyi} SPA=${spa.jianyi}`);
  }

  return mismatches;
}

/**
 * 对比格局分析
 * @param {Object} api - API返回的格局数据
 * @param {Object} spa - SPA返回的格局数据
 * @returns {Array} 差异数组
 */
function compareGeju(api, spa) {
  const mismatches = [];
  
  // 从API的sizhu构建shensha对象用于比较
  let apiShensha = api;
  if (api?.sizhu && !api?.nian && !api?.yue && !api?.ri && !api?.shi) {
    apiShensha = {
      nian: api.sizhu.nian?.shensha || [],
      yue: api.sizhu.yue?.shensha || [],
      ri: api.sizhu.ri?.shensha || [],
      shi: api.sizhu.shi?.shensha || []
    };
  }
  
  if (!apiShensha && !spa) return mismatches;
  if (!apiShensha && spa) {
    mismatches.push(`神煞数据缺失: api缺失`);
    return mismatches;
  }
  if (!spa && apiShensha) {
    mismatches.push(`神煞数据缺失: spa缺失`);
    return mismatches;
  }

  const pillars = ['nian', 'yue', 'ri', 'shi'];
  for (const p of pillars) {
    const apiArr = apiShensha[p] || [];
    const spaArr = spa[p] || [];

    const apiStr = JSON.stringify(apiArr.sort());
    const spaStr = JSON.stringify(spaArr.sort());

    if (apiStr !== spaStr) {
      const apiMissing = spaArr.filter(x => !apiArr.includes(x));
      const spaMissing = apiArr.filter(x => !spaArr.includes(x));
      if (apiMissing.length > 0 || spaMissing.length > 0) {
        mismatches.push(`${p}神煞差异: API有${apiArr} SPA有${spaArr}`);
      }
    }
  }

  return mismatches;
}

/**
 * 对比地支关系
 * @param {Object} api - API返回的地支关系数据
 * @param {Object} spa - SPA返回的地支关系数据
 * @returns {Array} 差异数组
 */
function compareRelationships(api, spa) {
  const mismatches = [];
  if (!api && !spa) return mismatches;
  if (!api && spa) {
    mismatches.push(`地支关系数据缺失: api缺失`);
    return mismatches;
  }
  if (!spa && api) {
    mismatches.push(`地支关系数据缺失: spa缺失`);
    return mismatches;
  }

  const apiStems = api.stems || [];
  const apiBranches = api.branches || [];
  const spaStems = spa.stems || [];
  const spaBranches = spa.branches || [];

  if (apiStems.length !== spaStems.length) {
    mismatches.push(`天干关系数量: API=${apiStems.length} SPA=${spaStems.length}`);
  }
  if (apiBranches.length !== spaBranches.length) {
    mismatches.push(`地支关系数量: API=${apiBranches.length} SPA=${spaBranches.length}`);
  }

  for (let i = 0; i < Math.min(apiStems.length, spaStems.length); i++) {
    const apiRel = apiStems[i];
    const spaRel = spaStems[i];
    const apiType = apiRel.type || '';
    const spaType = spaRel.type || '';
    if (apiType !== spaType || apiRel.desc !== spaRel.desc) {
      mismatches.push(`天干关系${i+1}: API=${apiType}${apiRel.desc} SPA=${spaType}${spaRel.desc}`);
    }
  }

  for (let i = 0; i < Math.min(apiBranches.length, spaBranches.length); i++) {
    const apiRel = apiBranches[i];
    const spaRel = spaBranches[i];
    const apiType = apiRel.type || '';
    const spaType = spaRel.type || '';
    if (apiType !== spaType || apiRel.desc !== spaRel.desc) {
      mismatches.push(`地支关系${i+1}: API=${apiType}${apiRel.desc} SPA=${spaType}${spaRel.desc}`);
    }
  }

  return mismatches;
}

/**
 * 对比完整的计算结果
 * @param {Object} api - API返回的完整数据
 * @param {Object} spa - SPA返回的完整数据
 * @returns {Object} 包含是否匹配和差异数组的对象
 */
function compareFullResults(api, spa) {
  const mismatches = [];
  const details = {
    pillars: {},
    nayin: true,
    wuxing: true,
    pattern: true,
    dayun: true,
    shensha: true,
    baziArr: true
  };
  
  if (!api || !spa) {
    console.error('API or SPA data is null:', { api: !!api, spa: !!spa });
    mismatches.push('API或SPA数据为空');
    return { match: false, mismatches, details };
  }
  
  // 比对 baziArr
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
  
  if (JSON.stringify(apiBaziArr) !== JSON.stringify(spaBaziArr)) {
    mismatches.push(`baziArr 不匹配: API=${apiBaziArr.join('')} SPA=${spaBaziArr.join('')}`);
    details.baziArr = false;
  }
  
  const pillars = ['nian', 'yue', 'ri', 'shi'];
  const pillarNames = { nian: '年柱', yue: '月柱', ri: '日柱', shi: '时柱' };
  
  for (const p of pillars) {
    const apiPillar = api.sizhu?.[p];
    const spaPillar = spa[p === 'nian' ? 'year' : p === 'yue' ? 'month' : p === 'ri' ? 'day' : 'hour'];
    if (!apiPillar || !spaPillar) {
      console.error(`Pillar ${p} data missing:`, { apiPillar: !!apiPillar, spaPillar: !!spaPillar });
    }
    const pMismatches = comparePillars(apiPillar, spaPillar, pillarNames[p]);
    if (pMismatches.length > 0) {
      mismatches.push(...pMismatches.map(m => `${pillarNames[p]}: ${m}`));
      details.pillars[p] = false;
    } else {
      details.pillars[p] = true;
    }
  }
  
  const nayinMismatches = compareNayin(api, spa.nayin);
  if (nayinMismatches.length > 0) {
    mismatches.push(...nayinMismatches);
    details.nayin = false;
  }
  
  const wuxingMismatches = compareWuxingEnergy(api.nengliang?.wuxing, spa.wuxingEnergy);
  if (wuxingMismatches.length > 0) {
    mismatches.push(...wuxingMismatches.map(m => `五行能量: ${m}`));
    details.wuxing = false;
  }
  
  const dayunResult = compareDayun(api.dayun, spa.dayun);
  if (dayunResult.mismatches.length > 0) {
    mismatches.push(...dayunResult.mismatches.map(m => `大运: ${m}`));
    details.dayun = false;
  }
  
  // 收集可接受的差异备注
  if (dayunResult.toleranceNotes && dayunResult.toleranceNotes.length > 0) {
    details.dayunToleranceNotes = dayunResult.toleranceNotes;
  }
  
  const relMismatches = compareRelationships(api.chonghe, spa.relationships);
  if (relMismatches.length > 0) {
    mismatches.push(...relMismatches.map(m => `地支关系: ${m}`));
    details.relationships = false;
  }
  
  const gejuMismatches = compareGeju(api.geju, spa.geju);
  if (gejuMismatches.length > 0) {
    mismatches.push(...gejuMismatches.map(m => `格局分析: ${m}`));
    details.pattern = false;
  }
  
  return { match: mismatches.length === 0, mismatches, details };
}

async function runTest(tc, browser) {
  const params = {
    year: tc.year,
    month: tc.month,
    day: tc.day,
    hour: tc.hour,
    minute: 0,
    longitude: BEIJING_DONGCHENG_LONGITUDE,
    gender: tc.gender === '男' ? 1 : 2,
    useTrueSolar: true
  };

  const apiResult = await callAPI(params);

  if (!apiResult.success || !apiResult.data) {
    return { match: false, error: apiResult.error?.message || 'API返回错误', tc };
  }

  const spaResult = await testSPA(tc, browser);

  if (!spaResult) {
    return { match: false, error: 'SPA数据提取失败', tc };
  }

  const comparison = compareFullResults(apiResult.data, spaResult);

  return { match: comparison.match, mismatches: comparison.mismatches, details: comparison.details, tc, apiResult: apiResult.data, spaResult };
}

function generateTestReport(results, passed, failed, total) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportDir = RESULTS_DIR;

  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = path.join(reportDir, `test_report_${timestamp}.html`);

  const passRate = ((passed / total) * 100).toFixed(1);
  const passColor = passRate >= 80 ? '#28a745' : passRate >= 50 ? '#ffc107' : '#dc3545';

  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>八字 API vs SPA 对比测试报告 - ${now.toLocaleString('zh-CN')}</title>
  <style>
    body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 15px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat-box { flex: 1; padding: 20px; border-radius: 8px; text-align: center; color: white; }
    .stat-total { background: #6c757d; }
    .stat-pass { background: #28a745; }
    .stat-fail { background: #dc3545; }
    .stat-rate { background: ${passColor}; }
    .stat-number { font-size: 36px; font-weight: bold; }
    .stat-label { font-size: 14px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    tr:hover { background: #f8f9fa; }
    .status-pass { color: #28a745; font-weight: bold; }
    .status-fail { color: #dc3545; font-weight: bold; }
    .mismatch-list { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; font-size: 13px; }
    .mismatch-item { padding: 5px 0; border-bottom: 1px solid #e0c975; }
    .footer { margin-top: 30px; color: #6c757d; text-align: center; font-size: 12px; }
    .detail-section { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .detail-title { font-weight: bold; margin-bottom: 10px; color: #495057; }
    .detail-item { display: flex; justify-content: space-between; padding: 5px 0; }
    .detail-ok { color: #28a745; }
    .detail-error { color: #dc3545; }
    .data-toggle { cursor: pointer; color: #007bff; text-decoration: underline; font-size: 13px; margin-top: 10px; }
    .data-section { display: none; margin-top: 10px; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 5px; }
    .data-section.show { display: block; }
    .data-title { font-weight: bold; margin-bottom: 10px; color: #007bff; }
    .data-content { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 八字 API vs SPA 完整对比测试报告</h1>
    <p><strong>生成时间:</strong> ${now.toLocaleString('zh-CN')}</p>
    
    <div class="summary">
      <div class="stat-box stat-total">
        <div class="stat-number">${total}</div>
        <div class="stat-label">总测试数</div>
      </div>
      <div class="stat-box stat-pass">
        <div class="stat-number">${passed}</div>
        <div class="stat-label">通过 ✅</div>
      </div>
      <div class="stat-box stat-fail">
        <div class="stat-number">${failed}</div>
        <div class="stat-label">失败 ❌</div>
      </div>
      <div class="stat-box stat-rate">
        <div class="stat-number">${passRate}%</div>
        <div class="stat-label">通过率</div>
      </div>
    </div>

    <h2>📋 测试详情</h2>
    <table>
      <thead>
        <tr>
          <th>序号</th>
          <th>测试用例</th>
          <th>类型</th>
          <th>状态</th>
          <th>差异数</th>
          <th>详情</th>
        </tr>
      </thead>
      <tbody>`;

  results.forEach((r, idx) => {
    const tc = r.tc;
    const status = r.match ? 'pass' : 'fail';
    const mismatches = r.mismatches || [];
    const details = r.details || {};
    const apiData = r.apiResult || {};
    const spaData = r.spaResult || {};
    const typeLabel = tc.isFailed ? '失败' : tc.isRandom ? '随机' : tc.isSingle ? '单个' : '预设';

    let detailHtml = '';
    if (!r.match && !r.error) {
      detailHtml = `<div class="mismatch-list">
        ${mismatches.slice(0, 10).map(m => `<div class="mismatch-item">${m}</div>`).join('')}
        ${mismatches.length > 10 ? `<div class="mismatch-item">... 还有 ${mismatches.length - 10} 项差异</div>` : ''}
      </div>`;
    } else if (r.error) {
      detailHtml = `<div class="mismatch-list" style="background: #f8d7da;">错误: ${r.error}</div>`;
    } else {
      detailHtml = `<div class="detail-section">
        <div class="detail-title">比对项目</div>
        ${Object.entries(details).map(([key, value]) => {
          if (key === 'pillars') {
            return Object.entries(value).map(([p, v]) => 
              `<div class="detail-item"><span>${p === 'nian' ? '年柱' : p === 'yue' ? '月柱' : p === 'ri' ? '日柱' : '时柱'}</span><span class="${v ? 'detail-ok' : 'detail-error'}">${v ? '✅' : '❌'}</span></div>`
            ).join('');
          }
          if (key === 'dayunToleranceNotes') {
            return '';
          }
          return `<div class="detail-item"><span>${key}</span><span class="${value ? 'detail-ok' : 'detail-error'}">${value ? '✅' : '❌'}</span></div>`;
        }).join('')}
      </div>`;
    }

    // 添加可接受的差异备注
    const toleranceNotes = details.dayunToleranceNotes || [];
    if (toleranceNotes.length > 0) {
      detailHtml += `<div class="detail-section" style="background: #d4edda; border: 1px solid #c3e6cb;">
        <div class="detail-title" style="color: #155724;">ℹ️ 可接受的差异说明 (tyme库实现差异)</div>
        ${toleranceNotes.map(note => `<div class="detail-item" style="color: #155724;">${note}</div>`).join('')}
      </div>`;
    }

    const sectionId = `data-${idx}`;
    detailHtml += `
      <div class="data-toggle" onclick="toggleData('${sectionId}')">📄 查看原始数据 (API + SPA)</div>
      <div id="${sectionId}" class="data-section">
        <div class="data-title">🔹 API 返回数据</div>
        <div class="data-content">${JSON.stringify(apiData, null, 2)}</div>
        <div class="data-title" style="margin-top: 15px;">🔹 SPA 页面数据</div>
        <div class="data-content">${JSON.stringify(spaData, null, 2)}</div>
      </div>`;

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td>${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender}</td>
        <td>${typeLabel}</td>
        <td class="status-${status}">${r.match ? '✅ 通过' : '❌ 失败'}</td>
        <td>${r.error ? '-' : mismatches.length}</td>
        <td>${detailHtml}</td>
      </tr>`;
  });

  html += `
      </tbody>
    </table>

    <div class="footer">
      <p>测试用例总数: ${total} | 通过: ${passed} | 失败: ${failed} | 通过率: ${passRate}%</p>
      <p>报告生成时间: ${now.toISOString()}</p>
    </div>
  </div>
  <script>
    function toggleData(id) {
      const section = document.getElementById(id);
      section.classList.toggle('show');
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(reportPath, html, 'utf8');
  return reportPath;
}

async function main() {
  const args = process.argv.slice(2);
  let testCasesArg = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--test-cases' && args[i + 1]) {
      try {
        testCasesArg = JSON.parse(args[i + 1]);
      } catch (e) {
        console.error('解析测试用例失败:', e.message);
        process.exit(1);
      }
      i++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('API vs SPA 完整对比测试');
  console.log('='.repeat(60));

  let actualTestCases;
  if (testCasesArg && Array.isArray(testCasesArg) && testCasesArg.length > 0) {
    actualTestCases = testCasesArg;
    const presetCount = actualTestCases.filter(tc => tc.isPreset).length;
    const failedCount = actualTestCases.filter(tc => tc.isFailed).length;
    const randomCount = actualTestCases.filter(tc => tc.isRandom).length;
    const singleCount = actualTestCases.filter(tc => tc.isSingle).length;
    const parts = [];
    if (presetCount > 0) parts.push(`预设 ${presetCount}`);
    if (failedCount > 0) parts.push(`失败 ${failedCount}`);
    if (randomCount > 0) parts.push(`随机 ${randomCount}`);
    if (singleCount > 0) parts.push(`单个 ${singleCount}`);
    console.log(`测试数量: ${actualTestCases.length} (${parts.join(' + ')})`);
  } else {
    actualTestCases = TEST_CASES;
    console.log(`测试数量: ${TEST_CASES.length} (全部预设)`);
  }
  console.log('');

  let browser = null;
  let passed = 0;
  let failed = 0;
  const results = [];
  const fixedFailedCases = [];

  try {
    console.log('\n正在启动Chrome浏览器...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--disable-crashpad',
        '--disable-crash-reporter',
        '--disable-rlz',
        '--rlz-offline=1',
        '--disable-logging',
        '--log-level=3',
        '--user-data-dir=/tmp/chrome-test-profile',
        '--disk-cache-dir=/tmp/chrome-test-cache',
        '--crash-dumps-dir=/tmp/chrome-crashes',
        '--breakpad-dump-dir=/tmp/chrome-crashes',
        '--no-crash-upload',
        '--disable-features=NetworkService,NetworkServiceInProcess',
        '--disable-print-preview',
        '--disable-merge-session-crld',
        '--disable-background-mode',
        '--disable-floating-virtual-keyboard',
        '--disable-hangout-services-extension',
        '--disable-password-manager-reauthentication',
        '--disable-save-password-bubble',
        '--disable-speech-api',
        '--disable-permission-auto-deny-for-testing',
        '--disable-site-isolation-for-policy',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-component-update-on-restart',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-disk-cache',
        '--disable-java',
        '--disable-plugins-discovery',
        '--disable-preconnect',
        '--enable-automation',
        '--no-experiments',
        '--ignore-gpu-blocklist',
        '--test-third-party-cookie-phaseout',
        '--disable-accelerated-2d-canvas',
        '--disable-canvas-aa',
        '--disable-2d-canvas-clip-aa',
        '--disable-web-resources',
        '--disable-cloud-import',
        '--disable-oopr-debug-crash',
        '--force-courtesies',
        '--homepage=about:blank',
        '--new-tab-page-url=about:blank',
        '--no-service-autorun'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      handleSIGINT: true
    });
    console.log('Chrome浏览器启动成功');

    for (let i = 0; i < actualTestCases.length; i++) {
      const tc = actualTestCases[i];
      const typeLabel = tc.isFailed ? '(失败用例)' : tc.isRandom ? '(随机生成)' : tc.isSingle ? '(单个指定)' : '(预设用例)';
      try {
        const result = await runTest(tc, browser);
        results.push(result);

        if (result.match) {
          console.log(`\n[${i + 1}/${actualTestCases.length}] ✅ 测试通过: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} ${typeLabel}`);
          passed++;
          
          if (tc.isFailed) {
            fixedFailedCases.push(tc);
          }
        } else {
          console.log(`\n[${i + 1}/${actualTestCases.length}] ❌ 测试失败: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} ${typeLabel}`);
          if (result.error) {
            console.log(`  错误: ${result.error}`);
          } else {
            console.log(`  差异数: ${result.mismatches?.length || 0}`);
            result.mismatches?.slice(0, 5).forEach(m => console.log(`    - ${m}`));
          }
          failed++;
        }
      } catch (error) {
        console.log(`\n[${i + 1}/${actualTestCases.length}] ❌ 测试异常: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} ${typeLabel}`);
        console.log(`  异常: ${error.message}`);
        console.log('');
        console.log('测试遇到异常，停止后续测试');
        console.log('');
        console.log('请检查：');
        console.log('  1. API 和 SPA 服务是否正常运行');
        console.log('  2. 浏览器是否正常启动');
        console.log('  3. 网络连接是否正常');
        console.log('');
        failed++;
        throw error;
      }

      if (i < actualTestCases.length - 1) {
        console.log('\n  等待2秒后继续下一个测试...');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('\n✅ 浏览器已统一关闭');
      } catch (e) {
        console.error('关闭浏览器失败:', e.message);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总测试数: ${actualTestCases.length}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`通过率: ${((passed / actualTestCases.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n失败案例:');
    results.filter(r => !r.match).forEach(r => {
      console.log(`  - ${r.tc.year}年${r.tc.month}月${r.tc.day}日 ${r.tc.hour}:00 ${r.tc.gender}`);
    });
  }

  const failedNonPresetCases = results.filter(r => !r.match && (r.tc.isRandom || r.tc.isSingle)).map(r => ({
    year: r.tc.year,
    month: r.tc.month,
    day: r.tc.day,
    hour: r.tc.hour,
    minute: r.tc.minute || 0,
    gender: r.tc.gender,
    name: r.tc.name,
    failedAt: new Date().toISOString(),
    mismatches: r.mismatches || []
  }));

  if (failedNonPresetCases.length > 0) {
    saveFailedCases(failedNonPresetCases);
  }

  if (fixedFailedCases.length > 0) {
    markAsFixed(fixedFailedCases);
  }

  console.log('\n' + '='.repeat(60));
  console.log('生成测试报告...');
  const reportPath = generateTestReport(results, passed, failed, actualTestCases.length);
  console.log(`报告已保存: ${reportPath}`);
}

main().catch(e => {
  console.error('测试执行错误:', e);
  process.exit(1);
});
