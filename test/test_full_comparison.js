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
const fs = require('fs');
const path = require('path');

const { TEST_CASES, CHROME_PATH } = require('./test_config');
const { saveFailedCases, markAsFixed, callAPI, formatFourPillars, formatBirthday, getCaseTypeEnglish } = require('./report_utils');
const { compareFullResults } = require('./comparators');
const { generateHTMLReport } = require('./report_generators/html_report_generator');
const { generateSummaryJSON, generateSingleTestJSON, generateLegacyJSONReport } = require('./report_generators/json_report_generator');

const RESULTS_DIR = path.join(__dirname, 'results');

/**
 * 生成目录名称
 * 格式：日期_时间_测试个数，例如：20260205_203045_1000
 * @param {number} testCount - 测试用例数量
 * @returns {string} 目录名称
 */
function generateReportDirName(testCount) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}_${testCount}`;
}

/**
 * 生成单个测试结果文件名
 * 格式：YYYYMMDDHHMM_G_P/F.json，例如：199001011200_M_P.json
 * @param {Object} tc - 测试用例
 * @param {string} status - 状态（passed/failed）
 * @returns {string} 文件名
 */
function generateSingleFileName(tc, status) {
  const genderCode = tc.gender === '男' || tc.gender === 'M' ? 'M' : 'F';
  const statusCode = status === 'passed' ? 'P' : 'F';
  
  const year = String(tc.year).padStart(4, '0');
  const month = String(tc.month).padStart(2, '0');
  const day = String(tc.day).padStart(2, '0');
  const hour = String(tc.hour).padStart(2, '0');
  const minute = String((tc.minute || 0)).padStart(2, '0');
  
  return `${year}${month}${day}${hour}${minute}_${genderCode}_${statusCode}.json`;
}

/**
 * 确保结果目录存在
 */
function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

/**
 * 测试SPA页面
 * @param {Object} tc - 测试用例
 * @param {Object} browser - Puppeteer浏览器实例
 * @returns {Promise<Object>} SPA返回的数据
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
 * 运行单个测试用例
 * @param {Object} tc - 测试用例
 * @param {Object} browser - Puppeteer浏览器实例
 * @param {string} reportDir - 报告目录路径
 * @returns {Promise<Object>} 测试结果
 */
async function runTest(tc, browser, reportDir) {
  console.log(`\n============================================================`);
  console.log(`测试: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} (${tc.age}岁) (${tc.caseType})`);
  console.log(`============================================================`);

  try {
    const apiData = await callAPI({
      year: tc.year,
      month: tc.month,
      day: tc.day,
      hour: tc.hour,
      minute: tc.minute || 0,
      gender: tc.gender === '男' || tc.gender === 1 || tc.gender === 'M' ? 1 : 2
    });

    const spaData = await testSPA(tc, browser);

    const comparison = compareFullResults(apiData, spaData);
    const isPassed = comparison.mismatches.length === 0;

    const result = {
      caseType: tc.caseType,
      birthday: formatBirthday(tc),
      fourPillars: formatFourPillars(apiData),
      status: isPassed ? 'passed' : 'failed',
      mismatchCount: comparison.mismatches.length,
      acceptableDifferences: comparison.acceptableDifferences,
      mismatches: comparison.mismatches,
      comparisonItems: comparison.comparisonItems,
      apiRawData: apiData,
      spaRawData: spaData,
      detailedComparison: {
        fourPillars: {
          status: comparison.comparisonItems['四柱'],
          api: {
            year: `${apiData.sizhu?.nian?.tiangan || ''}${apiData.sizhu?.nian?.dizhi || ''}`,
            month: `${apiData.sizhu?.yue?.tiangan || ''}${apiData.sizhu?.yue?.dizhi || ''}`,
            day: `${apiData.sizhu?.ri?.tiangan || ''}${apiData.sizhu?.ri?.dizhi || ''}`,
            hour: `${apiData.sizhu?.shi?.tiangan || ''}${apiData.sizhu?.shi?.dizhi || ''}`
          },
          spa: {
            year: `${spaData.year?.heavenStem || ''}${spaData.year?.earthBranch || ''}`,
            month: `${spaData.month?.heavenStem || ''}${spaData.month?.earthBranch || ''}`,
            day: `${spaData.day?.heavenStem || ''}${spaData.day?.earthBranch || ''}`,
            hour: `${spaData.hour?.heavenStem || ''}${spaData.hour?.earthBranch || ''}`
          }
        },
        nayin: {
          status: comparison.comparisonItems['纳音'],
          api: {
            year: apiData.sizhu?.nian?.nayin || '',
            month: apiData.sizhu?.yue?.nayin || '',
            day: apiData.sizhu?.ri?.nayin || '',
            hour: apiData.sizhu?.shi?.nayin || ''
          },
          spa: {
            year: spaData.year?.sound || '',
            month: spaData.month?.sound || '',
            day: spaData.day?.sound || '',
            hour: spaData.hour?.sound || ''
          }
        },
        relationships: {
          status: comparison.comparisonItems['地支关系'],
          api: apiData.relationships || apiData.chonghe || {},
          spa: spaData.relationships || spaData.chonghe || {}
        }
      }
    };

    if (isPassed) {
      console.log(`[${tc.caseId}] ✅ 测试通过: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} (${tc.caseType})`);
    } else {
      console.log(`[${tc.caseId}] ❌ 测试失败: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} (${tc.caseType})`);
      console.log(`  差异数: ${comparison.mismatches.length}`);
      comparison.mismatches.forEach(mismatch => {
        console.log(`    - ${mismatch}`);
      });
      console.log(`  等待2秒后继续下一个测试...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (reportDir) {
      const fileName = generateSingleFileName(tc, result.status);
      const filePath = path.join(reportDir, fileName);
      const singleJson = generateSingleTestJSON(result, tc.caseId);
      fs.writeFileSync(filePath, JSON.stringify(singleJson, null, 2), 'utf8');
      result._savedFile = fileName;
    }

    return result;
  } catch (error) {
    console.error(`❌ 测试出错: ${error.message}`);
    throw error;
  }
}

/**
 * 生成测试报告
 * @param {Array} results - 测试结果数组
 * @param {number} passCount - 通过数
 * @param {number} failCount - 失败数
 * @param {number} totalCount - 总数
 * @param {string} testScope - 测试范围
 * @param {string} reportDirName - 报告目录名称
 * @returns {Object} 报告文件路径对象
 */
function generateTestReport(results, passCount, failCount, totalCount, testScope, reportDirName) {
  const reportDir = path.join(RESULTS_DIR, reportDirName);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  const localTimestamp = `${year}-${month}-${day}T${hours}-${minutes}-${seconds}-${milliseconds}Z`;
  const reportId = `test_report_${localTimestamp}`;
  
  const htmlReport = generateHTMLReport(results, passCount, failCount, totalCount, reportId);

  const htmlFilePath = path.join(reportDir, 'test_report.html');
  fs.writeFileSync(htmlFilePath, htmlReport, 'utf8');

  const summaryJson = generateSummaryJSON(results, passCount, failCount, totalCount, reportId, 'compare', testScope);
  const summaryFilePath = path.join(reportDir, 'summary.json');
  fs.writeFileSync(summaryFilePath, JSON.stringify(summaryJson, null, 2), 'utf8');

  console.log(`\n============================================================`);
  console.log(`生成测试报告...`);
  console.log(`报告目录: ${reportDir}`);
  console.log(`HTML报告: test_report.html`);
  console.log(`汇总JSON: summary.json`);
  console.log(`测试用例JSON: ${results.length} 个文件`);
  console.log(`============================================================`);

  return {
    reportDir,
    reportDirName,
    htmlFilePath,
    htmlFileName: 'test_report.html',
    summaryFilePath,
    summaryFileName: 'summary.json',
    totalCases: totalCount,
    passedCases: passCount,
    failedCases: failCount
  };
}

/**
 * 主函数
 * @param {Object} options - 测试选项
 */
async function main(options = {}) {
  ensureResultsDir();

  // 处理命令行参数
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

  // 如果有通过命令行传递的测试用例，使用它们
  if (testCasesArg && Array.isArray(testCasesArg) && testCasesArg.length > 0) {
    const testCases = testCasesArg.map((tc, index) => ({
      ...tc,
      caseId: index + 1,
      caseType: tc.isPreset ? '预设' : (tc.isFailed ? '失败' : (tc.isRandom ? '随机' : '单个'))
    }));
    
    const presetCount = testCases.filter(tc => tc.caseType === '预设').length;
    const failedCount = testCases.filter(tc => tc.caseType === '失败').length;
    const randomCount = testCases.filter(tc => tc.caseType === '随机').length;
    const singleCount = testCases.filter(tc => tc.caseType === '单个').length;
    
    const parts = [];
    if (presetCount > 0) parts.push(`预设 ${presetCount}`);
    if (failedCount > 0) parts.push(`失败 ${failedCount}`);
    if (randomCount > 0) parts.push(`随机 ${randomCount}`);
    if (singleCount > 0) parts.push(`单个 ${singleCount}`);
    
    const testScope = parts.join(' + ');
    
    return await runTests(testCases, testScope);
  }

  const {
    preset = 'all',
    random = 'skip',
    single = [],
    failedOption = 'skip',
    all = false
  } = options;

  let testCases = [];
  let testScope = '';

  // 处理all参数
  if (all) {
    preset = 'all';
    random = 10;
    failedOption = 'test';
    testScope = '全部: 预设全部 + 失败用例 + 随机10个';
  }

  // 预设用例
  if (preset !== 'skip') {
    if (preset === 'all') {
      testCases = testCases.concat(TEST_CASES.map((tc, index) => ({ ...tc, caseId: index + 1, caseType: '预设' })));
      testScope += (testScope ? ' + ' : '') + `预设: 全部 ${TEST_CASES.length} 个`;
    } else if (typeof preset === 'number') {
      const selected = TEST_CASES.slice(0, preset);
      testCases = testCases.concat(selected.map((tc, index) => ({ ...tc, caseId: index + 1, caseType: '预设' })));
      testScope += (testScope ? ' + ' : '') + `预设: 前 ${preset} 个`;
    } else if (typeof preset === 'string' && preset.includes('-')) {
      const [start, end] = preset.split('-').map(Number);
      const selected = TEST_CASES.slice(start - 1, end);
      testCases = testCases.concat(selected.map((tc, index) => ({ ...tc, caseId: start + index, caseType: '预设' })));
      testScope += (testScope ? ' + ' : '') + `预设: 第${start}-${end}个`;
    }
  }

  // 失败用例
  if (failedOption === 'test') {
    const failedCases = require('./report_utils').FAILED_CASES_FILE;
    if (fs.existsSync(failedCases)) {
      const data = fs.readFileSync(failedCases, 'utf8');
      const cases = JSON.parse(data).filter(tc => tc.status === '失败');
      testCases = testCases.concat(cases.map((tc, index) => ({ ...tc, caseId: testCases.length + index + 1, caseType: '失败' })));
      testScope += (testScope ? ' + ' : '') + `失败: 失败用例 ${cases.length} 个`;
    }
  }

  // 随机用例
  if (typeof random === 'number' && random > 0) {
    const randomCases = generateRandomCases(random, testCases);
    testCases = testCases.concat(randomCases.map((tc, index) => ({ ...tc, caseId: testCases.length + index + 1, caseType: '随机' })));
    testScope += (testScope ? ' + ' : '') + `随机: 随机生成 ${random} 个`;
  }

  // 单个指定用例
  if (single.length > 0) {
    const singleCases = single.map(s => parseSingleCase(s));
    testCases = testCases.concat(singleCases.map((tc, index) => ({ ...tc, caseId: testCases.length + index + 1, caseType: '单个' })));
    testScope += (testScope ? ' + ' : '') + `单个: 单个指定 ${single.length} 个`;
  }

  if (testCases.length === 0) {
    console.log('⚠️  没有测试用例，请指定测试参数');
    return;
  }

  return await runTests(testCases, testScope);
}

/**
 * 运行测试
 * @param {Array} testCases - 测试用例数组
 * @param {string} testScope - 测试范围描述
 * @returns {Promise<Object>} 报告文件路径对象
 */
async function runTests(testCases, testScope) {
  console.log(`============================================================`);
  console.log(`正在运行: 完整对比测试`);
  console.log(`对比 API 和 SPA 的计算结果，包括四柱、纳音、五行能量、大运、神煞、地支关系`);
  console.log(`测试范围: ${testScope}`);
  console.log(`============================================================`);

  console.log(`\n============================================================`);
  console.log(`API vs SPA 完整对比测试`);
  console.log(`============================================================`);
  console.log(`测试数量: ${testCases.length}`);

  const reportDirName = generateReportDirName(testCases.length);
  const reportDir = path.join(RESULTS_DIR, reportDirName);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  console.log(`\n📁 报告目录: ${reportDir}`);

  console.log(`\n正在启动Chrome浏览器...`);
  
  const browser = await puppeteer.launch({
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

  console.log(`Chrome浏览器启动成功`);

  const results = [];
  const fixedCases = [];

  try {
    for (const tc of testCases) {
      const result = await runTest(tc, browser, reportDir);
      results.push(result);

      if (result.status === 'passed') {
        fixedCases.push(tc);
      }
    }
  } finally {
    await browser.close();
    console.log(`\n✅ 浏览器已统一关闭`);
  }

  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const total = results.length;

  console.log(`\n============================================================`);
  console.log(`测试结果汇总`);
  console.log(`============================================================`);
  console.log(`总测试数: ${total}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`);

  if (fixedCases.length > 0) {
    markAsFixed(fixedCases);
  }

  if (failed > 0) {
    const failedCases = results.filter(r => r.status === 'failed').map(r => ({
      year: r.birthday.year,
      month: r.birthday.month,
      day: r.birthday.day,
      hour: r.birthday.hour,
      gender: r.birthday.gender,
      name: `${r.caseType}-${r.birthday.year}年${r.birthday.month}月${r.birthday.day}日${r.birthday.hour}:00${r.birthday.gender}(${r.birthday.age}岁)`,
      mismatches: r.mismatches
    }));
    saveFailedCases(failedCases);
  }

  const reportFiles = generateTestReport(results, passed, failed, total, testScope, reportDirName);

  console.log(`\n============================================================`);
  console.log(`✅ 测试完成`);
  console.log(`============================================================`);
  console.log(`\n📊 测试报告文件:`);
  console.log(`   HTML: ${reportFiles.htmlFileName}`);
  console.log(`   汇总: ${reportFiles.summaryFileName}`);
  console.log(`   测试用例: ${reportFiles.totalCases} 个JSON文件`);
  console.log(`\n📁 报告目录:`);
  console.log(`   ${reportFiles.reportDir}`);
  console.log(`\n📈 测试统计:`);
  console.log(`   总数: ${reportFiles.totalCases}`);
  console.log(`   通过: ${reportFiles.passedCases} ✅`);
  console.log(`   失败: ${reportFiles.failedCases} ❌`);
  console.log(`============================================================`);

  return reportFiles;
}

/**
 * 生成随机测试用例
 * @param {number} count - 生成数量
 * @param {Array} existingCases - 已存在的用例
 * @returns {Array} 随机用例数组
 */
function generateRandomCases(count, existingCases) {
  const currentYear = new Date().getFullYear();
  const cases = [];
  const existingKeys = new Set(existingCases.map(tc => `${tc.year}-${tc.month}-${tc.day}-${tc.hour}-${tc.gender}`));

  while (cases.length < count) {
    const age = Math.random() < 0.7 ? Math.floor(Math.random() * 26) + 20 : Math.floor(Math.random() * 60) + 1;
    const year = currentYear - age;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    const hour = Math.floor(Math.random() * 24);
    const gender = Math.random() < 0.5 ? '男' : '女';
    const key = `${year}-${month}-${day}-${hour}-${gender}`;

    if (!existingKeys.has(key)) {
      cases.push({
        year,
        month,
        day,
        hour,
        minute: 0,
        gender,
        age,
        name: `随机-${year}年${month}月${day}日${hour}:00${gender}(${age}岁)`
      });
      existingKeys.add(key);
    }
  }

  return cases;
}

/**
 * 解析单个测试用例
 * @param {string} single - 单个用例字符串（格式：年-月-日-时:分-性别）
 * @returns {Object} 测试用例对象
 */
function parseSingleCase(single) {
  const parts = single.split('-');
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  const timePart = parts[3];
  const gender = parts[4];

  let hour, minute;
  if (timePart.includes(':')) {
    [hour, minute] = timePart.split(':').map(Number);
  } else {
    hour = parseInt(timePart);
    minute = 0;
  }

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  return {
    year,
    month,
    day,
    hour,
    minute,
    gender,
    age,
    name: `单个-${year}年${month}月${day}日${hour}:${minute.toString().padStart(2, '0')}${gender}(${age}岁)`
  };
}

module.exports = { main, generateTestReport };

// 如果直接运行此文件，执行main函数
if (require.main === module) {
  main().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}
