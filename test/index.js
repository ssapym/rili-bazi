/**
 * 八字排盘系统测试入口
 * 
 * @fileoverview
 * 本文件是八字排盘系统的测试入口程序，提供统一的测试命令行接口。
 * 支持多种测试类型和灵活的测试用例组合方式。
 * 
 * @description
 * 主要功能：
 * 1. 提供三种测试类型：完整对比测试、详细对比测试、纯API测试
 * 2. 支持四种测试用例来源：
 *    - 预设用例：从test_config.js中读取的固定测试用例
 *    - 失败用例：从failed_cases.json中读取的历史失败用例
 *    - 随机用例：运行时根据规则随机生成的测试用例
 *    - 单个用例：通过命令行参数指定的单个测试用例
 * 3. 自动检查API和SPA服务状态
 * 4. 自动保存失败用例（随机和单个指定用例）
 * 5. 生成详细的HTML测试报告
 * 
 * @usage
 * 基本用法：
 *   node index.js [测试类型] [选项...]
 * 
 * 示例：
 *   # 测试全部预设用例
 *   node index.js compare
 * 
 *   # 测试前3个预设 + 随机5个
 *   node index.js compare -p 3 -r 5
 * 
 *   # 测试单个指定生日
 *   node index.js compare -s 1990-5-15-10-男
 * 
 *   # 测试失败用例 + 随机10个
 *   node index.js compare -f test -r 10
 * 
 *   # 查看帮助信息
 *   node index.js help
 * 
 * @version 1.0.0
 * @date 2026-01-22
 * @author Trae AI
 */

// 引入必要的 Node.js 模块
const { spawn, exec } = require('child_process'); // 子进程管理，用于启动测试脚本
const path = require('path'); // 路径处理模块
const http = require('http'); // HTTP 模块，用于检查服务状态
const fs = require('fs'); // 文件系统模块，用于读写失败用例文件
const { TEST_CASES } = require('./test_config'); // 导入预设的测试用例

// 失败用例保存路径
const FAILED_CASES_FILE = path.join(__dirname, 'failed_cases.json');

/**
 * 获取当前年月
 * @returns {Object} 包含当前年份和月份的对象
 */
function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/**
 * 计算年龄
 * @param {number} birthYear - 出生年份
 * @param {number} birthMonth - 出生月份
 * @param {number} currentYear - 当前年份
 * @param {number} currentMonth - 当前月份
 * @returns {number} 计算出的年龄
 */
function calculateAge(birthYear, birthMonth, currentYear, currentMonth) {
  let age = currentYear - birthYear;
  if (currentMonth < birthMonth) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * 获取指定月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 * @returns {number} 该月的天数
 */
function getDaysInMonth(year, month) {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)) {
    return 29;
  }
  return days[month - 1];
}

/**
 * 生成四柱八字（年柱、月柱、日柱、时柱）
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @param {number} day - 日期
 * @param {number} hour - 时辰
 * @returns {Object} 包含四柱八字的字符串对象
 */
function generateFourPillars(year, month, day, hour) {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  const yearStemIndex = (year - 4) % 10;
  const yearBranchIndex = (year - 4) % 12;

  const monthStemBaseRaw = 2 * month + (month > 2 ? 2 : -10);
  const monthStemBase = (monthStemBaseRaw % 10 + 10) % 10;
  const monthBranchIndex = (month + 1) % 12;

  const dayStemIndexRaw = year % 5 * 2 + (month > 2 ? month : month + 12) % 5 * 2 + day % 30;
  const dayStemIndex = (dayStemIndexRaw % 10 + 10) % 10;
  const dayBranchIndex = (day + 2) % 12;

  const hourStemBaseRaw = 2 * (Math.floor(hour / 2) + 1) + (day % 2 === 0 ? 0 : 5);
  const hourStemBase = (hourStemBaseRaw % 10 + 10) % 10;
  const hourBranchIndex = (Math.floor(hour / 2) + 2) % 12;

  return {
    year: STEMS[yearStemIndex] + BRANCHES[yearBranchIndex],
    month: STEMS[monthStemBase] + BRANCHES[monthBranchIndex],
    day: STEMS[dayStemIndex] + BRANCHES[dayBranchIndex],
    hour: STEMS[hourStemBase] + BRANCHES[hourBranchIndex]
  };
}

/**
 * 解析性别字符串
 * @param {string} genderStr - 性别字符串（支持：男/女、1/0、M/F）
 * @returns {string|null} 标准化的性别字符串（'男'或'女'），无效时返回null
 */
function parseGender(genderStr) {
  const normalized = genderStr.trim().toLowerCase();
  if (normalized === '男' || normalized === '1' || normalized === 'm') {
    return '男';
  }
  if (normalized === '女' || normalized === '0' || normalized === 'f') {
    return '女';
  }
  return null;
}

/**
 * 解析单个测试用例参数
 * @param {string} param - 测试用例参数字符串，格式：年-月-日-时:分-性别
 * @returns {Object|null} 测试用例对象，解析失败返回null
 */
function parseSingleTestCase(param) {
  const parts = param.split('-');
  if (parts.length < 5 || parts.length > 6) {
    return null;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const timePart = parts[3];
  const gender = parseGender(parts[4]);

  if (isNaN(year) || isNaN(month) || isNaN(day) || !gender) {
    return null;
  }

  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  let hour, minute = 0;
  if (timePart.includes(':')) {
    const timeParts = timePart.split(':');
    hour = parseInt(timeParts[0], 10);
    minute = parseInt(timeParts[1], 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }
  } else {
    hour = parseInt(timePart, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return null;
    }
  }

  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const age = calculateAge(year, month, currentYear, currentMonth);
  const fourPillars = generateFourPillars(year, month, day, hour);
  const fourPillarsKey = `${fourPillars.year}${fourPillars.month}${fourPillars.day}${fourPillars.hour}${gender}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    gender,
    age,
    name: `单个测试-${year}年${month}月${day}日${hour}:${minute.toString().padStart(2, '0')}${gender}(${age}岁)`,
    isSingle: true,
    fourPillarsKey,
    fourPillars
  };
}

/**
 * 生成随机测试用例
 * @param {number} currentYear - 当前年份
 * @param {number} currentMonth - 当前月份
 * @param {Array} existingCases - 已存在的测试用例列表
 * @returns {Object|null} 随机生成的测试用例对象，失败返回null
 */
function generateRandomTestCase(currentYear, currentMonth, existingCases) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const ageRand = Math.random();
    let age;
    if (ageRand < 0.7) {
      age = Math.floor(Math.random() * (45 - 20 + 1)) + 20;
    } else if (ageRand < 0.85) {
      age = Math.floor(Math.random() * (19 - 1 + 1)) + 1;
    } else {
      age = Math.floor(Math.random() * (60 - 46 + 1)) + 46;
    }

    let birthYear = currentYear - age;
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const daysInMonth = getDaysInMonth(birthYear, birthMonth);
    const birthDay = Math.floor(Math.random() * daysInMonth) + 1;
    const birthHour = Math.floor(Math.random() * 24);
    const gender = Math.random() < 0.5 ? '男' : '女';

    const fourPillars = generateFourPillars(birthYear, birthMonth, birthDay, birthHour);
    const fourPillarsKey = `${fourPillars.year}${fourPillars.month}${fourPillars.day}${fourPillars.hour}${gender}`;

    const isDuplicate = existingCases.some(tc =>
      tc.isRandom === false &&
      generateFourPillars(tc.year, tc.month, tc.day, tc.hour).year === fourPillars.year &&
      generateFourPillars(tc.year, tc.month, tc.day, tc.hour).month === fourPillars.month &&
      generateFourPillars(tc.year, tc.month, tc.day, tc.hour).day === fourPillars.day &&
      generateFourPillars(tc.year, tc.month, tc.day, tc.hour).hour === fourPillars.hour
    );

    const isDuplicateRandom = existingCases.some(tc =>
      tc.isRandom === true &&
      tc.fourPillarsKey === fourPillarsKey
    );

    if (!isDuplicate && !isDuplicateRandom) {
      return {
        year: birthYear,
        month: birthMonth,
        day: birthDay,
        hour: birthHour,
        minute: 0,
        gender: gender,
        age: age,
        name: `随机测试-${birthYear}年${birthMonth}月${birthDay}日${birthHour}时${gender}(${age}岁)`,
        isRandom: true,
        fourPillarsKey: fourPillarsKey,
        fourPillars: fourPillars
      };
    }
  }

  return null;
}

/**
 * 生成多个随机测试用例
 * @param {number} count - 需要生成的测试用例数量
 * @param {number} currentYear - 当前年份
 * @param {number} currentMonth - 当前月份
 * @param {Array} fixedCases - 固定的测试用例列表（预设用例）
 * @returns {Array} 随机生成的测试用例数组
 */
function generateRandomTestCases(count, currentYear, currentMonth, fixedCases) {
  const randomCases = [];
  const existingCases = fixedCases.map(tc => ({
    ...tc,
    isRandom: false
  }));

  for (let i = 0; i < count * 3; i++) {
    if (randomCases.length >= count) break;

    const newCase = generateRandomTestCase(currentYear, currentMonth, [...existingCases, ...randomCases]);
    if (newCase) {
      randomCases.push(newCase);
    }
  }

  return randomCases;
}

/**
 * 从文件加载失败用例
 * 只加载状态为"失败"的用例（status === '失败'）
 * @returns {Array} 失败用例数组，文件不存在或读取失败返回空数组
 */
function loadFailedCases() {
  try {
    if (fs.existsSync(FAILED_CASES_FILE)) {
      const data = fs.readFileSync(FAILED_CASES_FILE, 'utf8');
      const cases = JSON.parse(data);
      
      const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
      
      return cases
        .filter(tc => tc.status === '失败')
        .map(tc => {
          const age = calculateAge(tc.year, tc.month, currentYear, currentMonth);
          return {
            ...tc,
            isFailed: true,
            age: age,
            name: `失败测试-${tc.year}年${tc.month}月${tc.day}日${tc.hour}:${(tc.minute || 0).toString().padStart(2, '0')}${tc.gender}(${age}岁)`
          };
        });
    }
  } catch (error) {
    console.warn(`读取失败用例文件失败: ${error.message}`);
  }
  return [];
}

/**
 * 保存失败用例到文件
 * @param {Array} failedCases - 需要保存的失败用例数组
 */
function saveFailedCases(failedCases) {
  try {
    fs.writeFileSync(FAILED_CASES_FILE, JSON.stringify(failedCases, null, 2), 'utf8');
    console.log(`\n💾 已保存 ${failedCases.length} 个失败用例到 ${FAILED_CASES_FILE}`);
  } catch (error) {
    console.warn(`保存失败用例文件失败: ${error.message}`);
  }
}

/**
 * 清空失败用例（标注状态而不是删除文件）
 * 将所有失败用例的状态标注为"已清空"
 * @returns {boolean} 清空成功返回true，失败返回false
 */
function clearFailedCases() {
  try {
    if (fs.existsSync(FAILED_CASES_FILE)) {
      const data = fs.readFileSync(FAILED_CASES_FILE, 'utf8');
      const cases = JSON.parse(data);
      
      const updatedCases = cases.map(tc => ({
        ...tc,
        status: '已清空',
        clearedAt: new Date().toISOString()
      }));
      
      fs.writeFileSync(FAILED_CASES_FILE, JSON.stringify(updatedCases, null, 2), 'utf8');
      console.log(`\n🗑️  已清空 ${cases.length} 个失败用例（标注为已清空状态）`);
    } else {
      console.log(`\nℹ️  失败用例文件不存在，无需清空`);
    }
    return true;
  } catch (error) {
    console.warn(`清空失败用例文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 重置失败用例状态
 * 将所有失败用例的状态重置为"失败"，以便重新测试
 * @returns {boolean} 重置成功返回true，失败返回false
 */
function resetFailedCases() {
  try {
    if (fs.existsSync(FAILED_CASES_FILE)) {
      const data = fs.readFileSync(FAILED_CASES_FILE, 'utf8');
      const cases = JSON.parse(data);
      
      const updatedCases = cases.map(tc => ({
        ...tc,
        status: '失败',
        resetAt: new Date().toISOString()
      }));
      
      fs.writeFileSync(FAILED_CASES_FILE, JSON.stringify(updatedCases, null, 2), 'utf8');
      console.log(`\n🔄 已重置 ${cases.length} 个失败用例（标注为失败状态，可重新测试）`);
    } else {
      console.log(`\nℹ️  失败用例文件不存在，无需重置`);
    }
    return true;
  } catch (error) {
    console.warn(`重置失败用例文件失败: ${error.message}`);
    return false;
  }
}

/**
 * 解析命令行选项参数
 * @param {Array} args - 命令行参数数组
 * @returns {Object} 包含解析后的选项对象
 */
function parseOptions(args) {
  const options = {
    preset: 'all',
    random: 'skip',
    single: [],
    failed: 'skip'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--preset' || arg === '-p') {
      if (nextArg && !nextArg.startsWith('-')) {
        options.preset = nextArg;
        i++;
      }
    } else if (arg === '--random' || arg === '-r') {
      if (nextArg && !nextArg.startsWith('-')) {
        options.random = nextArg;
        i++;
      }
    } else if (arg === '--single' || arg === '-s') {
      if (nextArg && !nextArg.startsWith('-')) {
        options.single.push(nextArg);
        i++;
      }
    } else if (arg === '--failed' || arg === '-f') {
      if (nextArg && !nextArg.startsWith('-')) {
        options.failed = nextArg;
        i++;
      }
    }
  }

  return options;
}

/**
 * 解析预设用例选项
 * @param {string} presetValue - 预设选项值（all、数字、范围、skip）
 * @param {number} totalTests - 总测试用例数
 * @returns {Object} 包含类型、测试用例数组和描述的对象
 */
function parsePresetOption(presetValue, totalTests) {
  if (presetValue === 'skip') {
    return { type: 'skip', testCases: [] };
  }

  if (presetValue === 'all') {
    return {
      type: 'all',
      testCases: TEST_CASES.map(tc => ({ ...tc, isPreset: true })),
      description: `全部 ${totalTests} 个`
    };
  }

  if (presetValue.includes('-')) {
    const parts = presetValue.split('-');
    if (parts.length === 2) {
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end) && start >= 1 && end >= start) {
        const actualStart = Math.min(start, totalTests);
        const actualEnd = Math.min(end, totalTests);
        const count = actualEnd - actualStart + 1;
        return {
          type: 'range',
          start: actualStart,
          end: actualEnd,
          count,
          testCases: TEST_CASES.slice(actualStart - 1, actualEnd).map(tc => ({ ...tc, isPreset: true })),
          description: `第 ${actualStart} 至 ${actualEnd} 个（共 ${count} 个）`
        };
      }
    }
  }

  const num = parseInt(presetValue, 10);
  if (!isNaN(num) && num >= 1) {
    const count = Math.min(num, totalTests);
    return {
      type: 'count',
      count,
      testCases: TEST_CASES.slice(0, count).map(tc => ({ ...tc, isPreset: true })),
      description: `前 ${count} 个`
    };
  }

  return { type: 'invalid', testCases: [] };
}

/**
 * 解析随机用例选项
 * @param {string} randomValue - 随机选项值（数字、skip）
 * @param {number} currentYear - 当前年份
 * @param {number} currentMonth - 当前月份
 * @param {Array} existingCases - 已存在的测试用例列表
 * @returns {Object} 包含类型、测试用例数组和描述的对象
 */
function parseRandomOption(randomValue, currentYear, currentMonth, existingCases) {
  if (randomValue === 'skip') {
    return { type: 'skip', testCases: [] };
  }

  const num = parseInt(randomValue, 10);
  if (!isNaN(num) && num >= 1) {
    const randomCases = generateRandomTestCases(num, currentYear, currentMonth, existingCases);
    return {
      type: 'random',
      count: num,
      testCases: randomCases,
      description: `随机生成 ${num} 个`
    };
  }

  return { type: 'invalid', testCases: [] };
}

/**
 * 解析单个用例选项
 * @param {Array} singleValues - 单个用例参数字符串数组
 * @returns {Object} 包含类型、测试用例数组和描述的对象
 */
function parseSingleOption(singleValues) {
  const singleCases = [];
  for (const value of singleValues) {
    const tc = parseSingleTestCase(value);
    if (tc) {
      singleCases.push(tc);
    }
  }

  return {
    type: 'single',
    count: singleCases.length,
    testCases: singleCases,
    description: `单个指定 ${singleCases.length} 个`
  };
}

/**
 * 解析失败用例选项
 * @param {string} failedValue - 失败用例选项值（test、clear、reset、skip）
 * @returns {Object} 包含类型、测试用例数组和描述的对象
 */
function parseFailedOption(failedValue) {
  if (failedValue === 'skip') {
    return { type: 'skip', testCases: [] };
  }

  if (failedValue === 'clear') {
    return { type: 'clear', testCases: [] };
  }

  if (failedValue === 'reset') {
    return { type: 'reset', testCases: [] };
  }

  if (failedValue === 'test') {
    const failedCases = loadFailedCases();
    return {
      type: 'test',
      count: failedCases.length,
      testCases: failedCases,
      description: `失败用例 ${failedCases.length} 个`
    };
  }

  return { type: 'invalid', testCases: [] };
}

/**
 * 构建完整的测试用例列表
 * 根据选项参数组合预设、失败、随机和单个测试用例
 * 失败用例优先于预设用例，并自动去重
 * @param {Object} options - 解析后的选项对象
 * @returns {Object} 包含测试用例数组、描述和失败操作的对象
 */
function buildTestCases(options) {
  const { year: currentYear, month: currentMonth } = getCurrentYearMonth();
  const totalTests = TEST_CASES.length;

  const presetResult = parsePresetOption(options.preset, totalTests);
  const failedResult = parseFailedOption(options.failed);
  const randomResult = parseRandomOption(options.random, currentYear, currentMonth, [
    ...presetResult.testCases,
    ...failedResult.testCases
  ]);
  const singleResult = parseSingleOption(options.single);

  const allTestCases = [
    ...failedResult.testCases,
    ...presetResult.testCases,
    ...randomResult.testCases,
    ...singleResult.testCases
  ];

  const descriptions = [];
  if (failedResult.type === 'test') {
    descriptions.push(`失败: ${failedResult.description}`);
  }
  if (presetResult.type !== 'skip') {
    descriptions.push(`预设: ${presetResult.description}`);
  }
  if (randomResult.type !== 'skip') {
    descriptions.push(`随机: ${randomResult.description}`);
  }
  if (singleResult.count > 0) {
    descriptions.push(`单个: ${singleResult.description}`);
  }

  return {
    testCases: allTestCases,
    description: descriptions.length > 0 ? descriptions.join(' + ') : '无测试用例',
    failedAction: failedResult.type === 'clear' ? 'clear' : (failedResult.type === 'reset' ? 'reset' : null)
  };
}

/**
 * 检查指定端口的服务是否运行
 * @param {number} port - 端口号
 * @param {string} serviceName - 服务名称
 * @returns {Promise<Object>} 包含运行状态和信息的对象
 */
function checkServiceStatus(port, serviceName) {
  return new Promise((resolve) => {
    exec(`lsof -i :${port} 2>/dev/null`, (error, stdout, stderr) => {
      if (stdout && stdout.trim()) {
        resolve({ running: true, info: stdout.trim() });
      } else {
        resolve({ running: false, info: null });
      }
    });
  });
}

/**
 * 检查指定URL的页面是否可访问
 * @param {string} url - 要检查的URL
 * @param {string} name - 页面名称
 * @returns {Promise<boolean>} 可访问返回true，否则返回false
 */
function checkPageAccess(url, name) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ ${name} 页面可访问 (${url})`);
        resolve(true);
      } else {
        console.log(`❌ ${name} 页面返回状态码: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ ${name} 页面无法访问: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.abort();
      console.log(`❌ ${name} 页面访问超时`);
      resolve(false);
    });
  });
}

/**
 * 检查API和SPA服务状态
 * @param {string} testType - 测试类型（api或compare）
 * @returns {Promise<void>}
 */
async function checkServices(testType) {
  console.log('='.repeat(60));
  console.log('检查服务状态');
  console.log('='.repeat(60));
  console.log('');

  const apiStatus = await checkServiceStatus(8000, 'API');
  const spaStatus = await checkServiceStatus(8001, 'SPA');

  if (apiStatus.running) {
    console.log('✅ API 服务器 (8000) 已运行');
  } else {
    console.log('❌ API 服务器 (8000) 未运行');
  }

  if (spaStatus.running) {
    console.log('✅ SPA 服务器 (8001) 已运行');
  } else {
    console.log('❌ SPA 服务器 (8001) 未运行');
  }

  console.log('');
  console.log('检查页面可访问性...');
  console.log('');

  let apiAccessible = false;
  let spaAccessible = false;

  if (apiStatus.running) {
    apiAccessible = await checkPageAccess('http://localhost:8000/api/bazi?year=2024&month=1&day=1&hour=12&gender=1', 'API');
  }

  if (spaStatus.running) {
    spaAccessible = await checkPageAccess('http://localhost:8001/', 'SPA');
  }

  console.log('');

  if (testType === 'api') {
    if (!apiStatus.running || !apiAccessible) {
      console.error('错误: API 服务器未运行或页面无法访问，无法执行 API 测试');
      console.log('');
      console.log('启动 API 服务器:');
      console.log('  cd /Users/yangyang/Downloads/Files/rili-bazi/server');
      console.log('  ./start.command');
      process.exit(1);
    }
  } else {
    if (!apiStatus.running || !spaStatus.running || !apiAccessible || !spaAccessible) {
      console.error('错误: 服务未全部启动或页面无法访问，无法执行对比测试');
      console.log('');
      console.log('启动服务:');
      console.log('  API 服务器:');
      console.log('    cd /Users/yangyang/Downloads/Files/rili-bazi/server');
      console.log('    ./start.command');
      console.log('  SPA 服务器:');
      console.log('    cd /Users/yangyang/Downloads/Files/rili-bazi');
      console.log('    python3 -m http.server 8001');
      process.exit(1);
    }
  }

  console.log('✅ 服务检查通过，页面可访问');
  console.log('');
}

/**
 * 测试类型定义
 * 包含所有可用的测试类型及其配置信息
 */
const TESTS = {
  compare: {
    name: '完整对比测试',
    description: '对比 API 和 SPA 的计算结果，包括四柱、纳音、五行能量、大运、神煞、地支关系',
    file: './test_full_comparison.js'
  },
  detail: {
    name: '详细对比测试',
    description: '详细对比每个测试案例的四柱数据，包括藏干、空亡、神煞等',
    file: './test_comparison_detail.js'
  },
  api: {
    name: '纯API测试',
    description: '仅测试 API 端点，检查返回数据格式是否正确',
    file: './test_api_only.js'
  }
};

/**
 * 运行指定的测试
 * @param {string} testName - 测试类型名称
 * @param {Object} testRange - 测试范围对象
 * @returns {Promise<void>}
 */
async function runTest(testName, testRange) {
  const test = TESTS[testName];
  if (!test) {
    console.error(`未知的测试类型: ${testName}`);
    console.log('\n可用测试类型:');
    for (const [key, t] of Object.entries(TESTS)) {
      console.log(`  ${key.padEnd(10)} - ${t.name}`);
    }
    console.log('\n使用 help 查看详细说明');
    return;
  }

  console.log('='.repeat(60));
  console.log(`正在运行: ${test.name}`);
  console.log(test.description);
  if (testRange) {
    console.log(`测试范围: ${testRange.description}`);
  }
  console.log('='.repeat(60));
  console.log('');

  return new Promise((resolve, reject) => {
    const args = [test.file];
    if (testRange && testRange.testCases) {
      const testCasesJson = JSON.stringify(testRange.testCases);
      args.push('--test-cases', testCasesJson);
    }
    const proc = spawn('node', args, {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('\n' + '='.repeat(60));
        console.log('✅ 测试完成');
        console.log('='.repeat(60));
        resolve();
      } else {
        console.log('\n' + '='.repeat(60));
        console.log(`❌ 测试失败，退出码: ${code}`);
        console.log('='.repeat(60));
        reject(new Error(`测试失败，退出码: ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

function printHelp() {
  console.log('');
  console.log('八字排盘系统测试入口');
  console.log('');
  console.log('使用方法:');
  console.log('  node index.js [测试类型] [选项...]');
  console.log('');
  console.log('可用测试类型:');
  console.log('');
  console.log('  compare      完整对比测试');
  console.log('               对比 API 和 SPA 的计算结果');
  console.log('               覆盖四柱、纳音、五行能量、大运、神煞、地支关系');
  console.log('');
  console.log('  detail       详细对比测试');
  console.log('               详细展示每个测试案例的四柱数据');
  console.log('               包括藏干、空亡、神煞等详细信息');
  console.log('');
  console.log('  api          纯API测试');
  console.log('               仅测试 API 端点');
  console.log('               检查返回数据格式是否正确');
  console.log('');
  console.log('  help         显示此帮助信息');
  console.log('');
  console.log('选项:');
  console.log('');
  console.log('  --preset, -p      预设生日组合');
  console.log('    all             - 全部预设用例（默认）');
  console.log('    数字            - 前N个，例如: 3');
  console.log('    范围            - 指定范围，例如: 2-3');
  console.log('    skip            - 跳过预设用例，只测试随机或单个');
  console.log('');
  console.log('  --random, -r      随机生日组合数量');
  console.log('    数字            - 随机生成N个，例如: 10');
  console.log('    skip            - 跳过随机用例');
  console.log('');
  console.log('  --single, -s      指定单个生日组合');
  console.log('    格式: 年-月-日-时:分-性别');
  console.log('    时:分支持小时或小时:分钟');
  console.log('    性别支持: 男/女, 1/0, M/F');
  console.log('    例如: 1990-5-15-10-男');
  console.log('          1990-5-15-10:30-女');
  console.log('          1990-5-15-10-M');
  console.log('    可多次使用，例如: -s 1990-5-15-10-男 -s 2000-8-8-15:30-F');
  console.log('');
  console.log('  --failed, -f      失败用例处理');
  console.log('    test            - 测试之前记录的失败用例');
  console.log('    clear           - 清空失败用例记录');
  console.log('    reset           - 重置失败用例状态（可重新测试）');
  console.log('    skip            - 跳过失败用例（默认）');
  console.log('');
  console.log('组合示例:');
  console.log('  node index.js compare                          # 测试全部预设用例');
  console.log('  node index.js compare -p 3                     # 测试前3个预设用例');
  console.log('  node index.js compare -p 2-3                   # 测试第2-3个预设用例');
  console.log('  node index.js compare -p 3 -r 5                # 测试前3个预设 + 随机5个');
  console.log('  node index.js compare -r 10                    # 只测试随机生成的10个');
  console.log('  node index.js compare -s 1990-5-15-10-男        # 测试单个指定生日');
  console.log('  node index.js compare -s 1990-5-15-10:30-F     # 测试单个指定生日（带分钟）');
  console.log('  node index.js compare -f test                  # 测试之前记录的失败用例');
  console.log('  node index.js compare -f test -r 5             # 测试失败用例 + 随机5个');
  console.log('  node index.js compare -f clear                 # 清空失败用例记录');
  console.log('  node index.js compare -f reset                 # 重置失败用例状态（可重新测试）');
  console.log('  node index.js compare -p 3 -f test -r 5 -s 1990-5-15-10-M  # 完整组合');
  console.log('  node index.js detail 5                         # 详细测试前5个预置用例');
  console.log('  node index.js api                              # API测试');
  console.log('  node index.js help                             # 显示帮助信息');
  console.log('');
  console.log('测试顺序:');
  console.log('  1. 预设用例');
  console.log('  2. 失败用例');
  console.log('  3. 随机用例');
  console.log('  4. 单个用例');
  console.log('');
  console.log('失败用例:');
  console.log('  文件路径: test/failed_cases.json');
  console.log('  自动记录: 随机测试失败的用例会自动保存');
  console.log('  重新测试: 使用 -f test 选项重新测试失败的用例');
  console.log('  清空记录: 使用 -f clear 选项清空失败用例记录');
  console.log('');
  console.log('前置要求:');
  console.log('  1. 启动 API 服务器: cd server && ./start.command');
  console.log('  2. 启动 SPA 服务器: python3 -m http.server 8001');
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'help';

  if (testType === 'help' || testType === '-h' || testType === '--help') {
    printHelp();
    return;
  }

  const options = parseOptions(args.slice(1));

  if (options.failed === 'clear') {
    clearFailedCases();
    return;
  }

  if (options.failed === 'reset') {
    resetFailedCases();
    return;
  }

  const testRange = buildTestCases(options);

  if (testRange.testCases.length === 0) {
    console.error('错误: 没有测试用例可执行');
    console.log('');
    console.log('使用 help 查看详细说明');
    process.exit(1);
  }

  try {
    await checkServices(testType);
    await runTest(testType, testRange);
  } catch (error) {
    console.error('测试执行失败:', error.message);
    process.exit(1);
  }
}

main();
