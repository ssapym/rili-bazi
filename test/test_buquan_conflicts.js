/**
 * 八字补全冲突检测测试
 * 
 * 测试八字补全功能中的冲突检测：
 * - 暗带：双冲（60组）+ 天克地刑（20组）
 * - 拱三合和拱隔位：地支六冲（6个）
 * 
 * 前置要求：
 *   启动 API 服务器: cd server && ./start.command
 */

const http = require('http');
const { API_BASE_URL } = require('./test_config');

/**
 * 调用API获取八字数据
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} API返回的数据
 */
function callAPI(params) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(params);

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/bazi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 测试单个八字补全案例
 * @param {Object} testCase - 测试用例
 * @returns {Promise<Object>} 测试结果
 */
async function testBuQuanCase(testCase) {
  const params = {
    year: testCase.year,
    month: testCase.month,
    day: testCase.day,
    hour: testCase.hour,
    minute: testCase.minute || 0
  };

  try {
    const response = await callAPI(params);
    
    if (!response.success || !response.data || !response.data.buquan) {
      return {
        name: testCase.name,
        success: false,
        error: 'API返回数据格式不正确或缺少buquan字段'
      };
    }

    const buquan = response.data.buquan;
    
    const result = {
      name: testCase.name,
      success: true,
      derivedBranches: buquan.derivedBranches,
      summary: buquan.summary,
      andai: buquan.andai,
      gongsanhe: buquan.gongsanhe,
      gonggewei: buquan.gonggewei
    };

    return result;
  } catch (error) {
    return {
      name: testCase.name,
      success: false,
      error: error.message
    };
  }
}

/**
 * 打印测试结果
 * @param {Object} result - 测试结果
 */
function printTestResult(result) {
  console.log(`测试案例: ${result.name}`);
  console.log('-'.repeat(60));

  if (!result.success) {
    console.log(`❌ 测试失败: ${result.error}`);
    console.log('');
    return;
  }

  console.log(`✅ 测试成功`);
  console.log('');
  console.log(`补全地支: ${result.derivedBranches.join(', ') || '无'}`);
  console.log(`拱三合: ${result.summary.gongsanheCount}`);
  console.log(`拱隔位: ${result.summary.gonggeweiCount}`);
  console.log(`暗带: ${result.summary.andaiCount}`);
  console.log('');

  if (result.andai && result.andai.length > 0) {
    console.log('暗带详情:');
    result.andai.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.desc}`);
      if (item.conflicts && item.conflicts.length > 0) {
        item.conflicts.forEach(conflict => {
          console.log(`     冲突: ${conflict.type} - ${conflict.desc} (目标: ${conflict.targetPillar})`);
        });
      } else {
        console.log('     无冲突');
      }
    });
    console.log('');
  }

  if (result.gongsanhe && result.gongsanhe.length > 0) {
    console.log('拱三合详情:');
    result.gongsanhe.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.desc} (来源: ${item.source})`);
      if (item.conflicts && item.conflicts.length > 0) {
        item.conflicts.forEach(conflict => {
          console.log(`     冲突: ${conflict.type} - ${conflict.desc} (目标: ${conflict.targetPillar})`);
        });
      } else {
        console.log('     无冲突');
      }
    });
    console.log('');
  }

  if (result.gonggewei && result.gonggewei.length > 0) {
    console.log('拱隔位详情:');
    result.gonggewei.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.desc} (来源: ${item.source})`);
      if (item.conflicts && item.conflicts.length > 0) {
        item.conflicts.forEach(conflict => {
          console.log(`     冲突: ${conflict.type} - ${conflict.desc} (目标: ${conflict.targetPillar})`);
        });
      } else {
        console.log('     无冲突');
      }
    });
    console.log('');
  }
}

/**
 * 主测试函数
 * @param {Array} testCases - 测试用例数组
 */
async function runBuQuanTests(testCases) {
  console.log('========================================');
  console.log('  八字补全冲突检测测试');
  console.log('========================================');
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    const result = await testBuQuanCase(testCase);
    printTestResult(result);

    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }

    console.log('========================================');
    console.log('');
  }

  console.log('测试总结:');
  console.log(`  总计: ${testCases.length} 个`);
  console.log(`  成功: ${successCount} 个`);
  console.log(`  失败: ${failCount} 个`);
  console.log('');
}

/**
 * 从命令行参数获取测试用例
 * @returns {Array} 测试用例数组
 */
function getTestCasesFromArgs() {
  const args = process.argv.slice(2);
  
  const testCasesIndex = args.indexOf('--test-cases');
  if (testCasesIndex !== -1 && args[testCasesIndex + 1]) {
    try {
      return JSON.parse(args[testCasesIndex + 1]);
    } catch (e) {
      console.error('解析测试用例失败:', e.message);
      return [];
    }
  }

  return [];
}

/**
 * 默认测试用例
 */
const DEFAULT_TEST_CASES = [
  {
    name: '测试1：有拱隔位',
    year: 1984,
    month: 3,
    day: 15,
    hour: 10,
    minute: 0
  },
  {
    name: '测试2：有暗带',
    year: 1984,
    month: 3,
    day: 15,
    hour: 7,
    minute: 0
  },
  {
    name: '测试3：有拱三合',
    year: 1984,
    month: 3,
    day: 15,
    hour: 9,
    minute: 0
  }
];

/**
 * 主函数
 */
async function main() {
  const testCases = getTestCasesFromArgs();
  
  if (testCases.length === 0) {
    console.log('使用默认测试用例...');
    console.log('');
    await runBuQuanTests(DEFAULT_TEST_CASES);
  } else {
    await runBuQuanTests(testCases);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runBuQuanTests, testBuQuanCase };
