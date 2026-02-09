/**
 * JSON报告生成器模块
 * 
 * 生成JSON格式的测试报告，便于AI和程序读取分析
 */

/**
 * 生成JSON测试报告
 * @param {Array} results - 测试结果数组
 * @param {number} passed - 通过数
 * @param {number} failed - 失败数
 * @param {number} total - 总数
 * @param {string} reportId - 报告ID
 * @param {string} testType - 测试类型
 * @param {string} testScope - 测试范围
 * @returns {Object} JSON报告对象
 */
function generateJSONReport(results, passed, failed, total, reportId, testType, testScope) {
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  const localTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  
  return {
    reportInfo: {
      reportId: reportId,
      generatedAt: localTimestamp,
      testType: testType,
      testScope: convertTestScope(testScope)
    },
    summary: {
      total: total,
      passed: passed,
      failed: failed,
      passRate: parseFloat(passRate)
    },
    testCases: results.map((result, index) => generateTestCaseJSON(result, index + 1))
  };
}

/**
 * 生成单个测试用例的JSON
 * @param {Object} result - 测试结果
 * @param {number} caseId - 用例编号
 * @returns {Object} JSON对象
 */
function generateTestCaseJSON(result, caseId) {
  return {
    caseId: caseId,
    caseType: convertCaseType(result.caseType),
    birthday: {
      year: result.birthday.year,
      month: result.birthday.month,
      day: result.birthday.day,
      hour: result.birthday.hour,
      minute: result.birthday.minute,
      gender: result.birthday.gender,
      genderCode: result.birthday.genderCode,
      age: result.birthday.age
    },
    fourPillars: result.fourPillars || {},
    testResult: {
      status: result.status,
      mismatchCount: result.mismatchCount,
      acceptableDifferences: result.acceptableDifferences || [],
      mismatches: convertMismatches(result.mismatches || []),
      comparisonItems: convertComparisonItems(result.comparisonItems || {})
    },
    detailedComparison: result.detailedComparison || {},
    rawData: {
      api: result.apiRawData || {},
      spa: result.spaRawData || {}
    }
  };
}

/**
 * 转换比对项目为英文键名
 * @param {Object} comparisonItems - 比对项目对象（中文键名）
 * @returns {Object} 比对项目对象（英文键名）
 */
function convertComparisonItems(comparisonItems) {
  const nameMap = {
    '四柱': 'fourPillars',
    '八字数组': 'baziArr',
    '纳音': 'nayin',
    '五行能量': 'wuxingEnergy',
    '大运': 'dayun',
    '神煞': 'shensha',
    '天干地支关系': 'relationships',
    '格局分析': 'patternAnalysis',
    '字段': 'field',
    '期望值': 'expected',
    '实际值': 'actual',
    '差异': 'difference'
  };
  
  const result = {};
  for (const [key, value] of Object.entries(comparisonItems)) {
    const englishKey = nameMap[key] || key;
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[englishKey] = value.map(item => 
          typeof item === 'object' && item !== null ? convertComparisonItems(item) : item
        );
      } else {
        result[englishKey] = convertComparisonItems(value);
      }
    } else {
      result[englishKey] = value;
    }
  }
  
  return result;
}

/**
 * 转换用例类型为英文
 * @param {string} caseType - 用例类型（中文）
 * @returns {string} 用例类型（英文）
 */
function convertCaseType(caseType) {
  const typeMap = {
    '预设': 'preset',
    '随机': 'random',
    '单个': 'single_specified',
    '失败': 'failed'
  };
  
  return typeMap[caseType] || caseType;
}

/**
 * 转换测试范围为英文格式
 * @param {string} testScope - 测试范围（中文）
 * @returns {string} 测试范围（英文）
 */
function convertTestScope(testScope) {
  let scope = testScope;
  
  // 处理完整格式：预设: 前 3 个 + 失败: 失败用例 1 个 + 随机: 随机生成 5 个 + 单个: 单个指定1 个
  scope = scope.replace(/全部: 预设全部 \+ 失败用例 \+ 随机10个/g, 'all: all presets + failed cases + random 10');
  scope = scope.replace(/预设: 全部 (\d+) 个/g, 'preset: all $1');
  scope = scope.replace(/预设: 前 (\d+) 个/g, 'preset: first $1');
  scope = scope.replace(/预设: 第(\d+)-(\d+)个/g, 'preset: items $1-$2');
  scope = scope.replace(/失败: 失败用例 (\d+) 个/g, 'failed: $1 failed cases');
  scope = scope.replace(/随机: 随机生成 (\d+) 个/g, 'random: $1 random cases');
  scope = scope.replace(/单个: 单个指定 (\d+) 个/g, 'single: $1 specified');
  scope = scope.replace(/ \+ /g, ' + ');
  
  // 处理简化格式：预设 3 + 失败 1 + 随机 5 + 单个 1
  if (!scope.includes(':')) {
    scope = scope.replace(/预设 (\d+)/g, 'preset: $1');
    scope = scope.replace(/失败 (\d+)/g, 'failed: $1');
    scope = scope.replace(/随机 (\d+)/g, 'random: $1');
    scope = scope.replace(/单个 (\d+)/g, 'single: $1');
  }
  
  return scope;
}

/**
 * 转换mismatches为英文格式
 * @param {Array} mismatches - 中文mismatches数组
 * @returns {Array} 英文mismatches数组
 */
function convertMismatches(mismatches) {
  const fieldMap = {
    '五行能量': 'wuxingEnergy',
    '神煞': 'shensha',
    '天干关系': 'stemRelationships',
    '地支关系': 'branchRelationships',
    '四柱': 'fourPillars',
    '八字数组': 'baziArr',
    '纳音': 'nayin',
    '大运': 'dayun',
    '格局分析': 'patternAnalysis'
  };
  
  return mismatches.map(mismatch => {
    let field = '';
    let apiValue = '';
    let spaValue = '';
    let reason = '';
    
    if (mismatch.includes('API缺失')) {
      const parts = mismatch.split(':');
      field = parts[0].trim();
      reason = 'api_missing';
    } else if (mismatch.includes('SPA缺失')) {
      const parts = mismatch.split(':');
      field = parts[0].trim();
      reason = 'spa_missing';
    } else if (mismatch.includes('API有') && mismatch.includes('但SPA没有')) {
      const match = mismatch.match(/(.+?): API有(.+?)但SPA没有/);
      if (match) {
        field = match[1].trim();
        apiValue = match[2].trim();
        reason = 'api_only';
      }
    } else if (mismatch.includes('SPA有') && mismatch.includes('但API没有')) {
      const match = mismatch.match(/(.+?): SPA有(.+?)但API没有/);
      if (match) {
        field = match[1].trim();
        spaValue = match[2].trim();
        reason = 'spa_only';
      }
    } else if (mismatch.includes('API=') && mismatch.includes('SPA=')) {
      const match = mismatch.match(/(.+?): API=(.+?) SPA=(.+)/);
      if (match) {
        field = match[1].trim();
        apiValue = match[2].trim();
        spaValue = match[3].trim();
        reason = 'api_different_from_spa';
      }
    } else if (mismatch.includes('API与SPA不一致')) {
      const parts = mismatch.split(':');
      field = parts[0].trim();
      reason = 'inconsistent';
    }
    
    return {
      field: fieldMap[field] || field,
      fieldName: field,
      apiValue: apiValue,
      spaValue: spaValue,
      reason: reason,
      originalMessage: mismatch
    };
  });
}

function generateSummaryJSON(results, passed, failed, total, reportId, testType, testScope) {
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  const localTimestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;

  const passedFiles = [];
  const failedFiles = [];
  
  results.forEach((result, index) => {
    const fileName = result._savedFile || `unknown_${index + 1}.json`;
    const birthdayStr = `${result.birthday.year}-${String(result.birthday.month).padStart(2, '0')}-${String(result.birthday.day).padStart(2, '0')} ${String(result.birthday.hour).padStart(2, '0')}:${String(result.birthday.minute || 0).padStart(2, '0')}`;
    const genderCode = result.birthday.gender === '男' ? 'M' : 'F';
    
    const fileInfo = {
      file: fileName,
      birthday: birthdayStr,
      gender: genderCode,
      status: result.status,
      mismatchCount: result.mismatchCount
    };
    
    if (result.status === 'passed') {
      passedFiles.push(fileInfo);
    } else {
      failedFiles.push(fileInfo);
    }
  });
  
  return {
    reportInfo: {
      reportId: reportId,
      generatedAt: localTimestamp,
      testType: testType,
      testScope: convertTestScope(testScope),
      format: 'split'
    },
    summary: {
      total: total,
      passed: passed,
      failed: failed,
      passRate: parseFloat(passRate)
    },
    files: {
      html: 'test_report.html',
      passed: passedFiles,
      failed: failedFiles
    }
  };
}

function generateSingleTestJSON(result, caseId) {
  return {
    caseId: caseId,
    caseType: convertCaseType(result.caseType),
    birthday: {
      year: result.birthday.year,
      month: result.birthday.month,
      day: result.birthday.day,
      hour: result.birthday.hour,
      minute: result.birthday.minute,
      gender: result.birthday.gender,
      genderCode: result.birthday.genderCode,
      age: result.birthday.age
    },
    fourPillars: result.fourPillars || {},
    testResult: {
      status: result.status,
      mismatchCount: result.mismatchCount,
      acceptableDifferences: result.acceptableDifferences || [],
      mismatches: convertMismatches(result.mismatches || []),
      comparisonItems: convertComparisonItems(result.comparisonItems || {})
    },
    detailedComparison: result.detailedComparison || {},
    rawData: {
      api: result.apiRawData || {},
      spa: result.spaRawData || {}
    }
  };
}

function generateLegacyJSONReport(results, passed, failed, total, reportId, testType, testScope) {
  return generateJSONReport(results, passed, failed, total, reportId, testType, testScope);
}

module.exports = {
  generateJSONReport,
  generateTestCaseJSON,
  generateSummaryJSON,
  generateSingleTestJSON,
  generateLegacyJSONReport,
  convertComparisonItems,
  convertCaseType,
  convertTestScope,
  convertMismatches
};
