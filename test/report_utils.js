/**
 * 报告工具函数模块
 * 
 * 提供测试报告生成相关的工具函数
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

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
      console.log(`✅ 失败用例已保存: ${newCases.length} 个新用例, ${updatedCases.length} 个已更新`);
    }
  } catch (error) {
    console.error('❌ 保存失败用例时出错:', error.message);
  }
}

/**
 * 标记失败用例为已修复
 * @param {Array} fixedCases - 已修复的用例数组
 */
function markAsFixed(fixedCases) {
  try {
    if (!fs.existsSync(FAILED_CASES_FILE)) {
      console.log('⚠️  失败用例文件不存在，无需标记');
      return;
    }

    const data = fs.readFileSync(FAILED_CASES_FILE, 'utf8');
    const allCases = JSON.parse(data);
    
    let updatedCount = 0;
    fixedCases.forEach(fixed => {
      const index = allCases.findIndex(tc => 
        tc.year === fixed.year && 
        tc.month === fixed.month && 
        tc.day === fixed.day && 
        tc.hour === fixed.hour && 
        tc.gender === fixed.gender
      );
      
      if (index !== -1 && allCases[index].status === '失败') {
        allCases[index].status = '已修复';
        allCases[index].fixedAt = new Date().toISOString();
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      fs.writeFileSync(FAILED_CASES_FILE, JSON.stringify(allCases, null, 2), 'utf8');
      console.log(`✅ 已标记 ${updatedCount} 个失败用例为已修复`);
    }
  } catch (error) {
    console.error('❌ 标记失败用例时出错:', error.message);
  }
}

/**
 * 调用API获取八字数据
 * @param {Object} params - 请求参数
 * @returns {Promise<Object>} API返回的数据
 */
async function callAPI(params) {
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
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            resolve(result.data);
          } else {
            reject(new Error(result.message || 'API请求失败'));
          }
        } catch (error) {
          reject(new Error(`解析API响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`API请求失败: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 格式化四柱八字信息
 * @param {Object} api - API返回的数据
 * @returns {Object} 格式化后的四柱八字信息
 */
function formatFourPillars(api) {
  const sizhu = api.sizhu || {};
  return {
    year: {
      stem: sizhu.nian?.tiangan || '',
      branch: sizhu.nian?.dizhi || '',
      nayin: sizhu.nian?.nayin || ''
    },
    month: {
      stem: sizhu.yue?.tiangan || '',
      branch: sizhu.yue?.dizhi || '',
      nayin: sizhu.yue?.nayin || ''
    },
    day: {
      stem: sizhu.ri?.tiangan || '',
      branch: sizhu.ri?.dizhi || '',
      nayin: sizhu.ri?.nayin || ''
    },
    hour: {
      stem: sizhu.shi?.tiangan || '',
      branch: sizhu.shi?.dizhi || '',
      nayin: sizhu.shi?.nayin || ''
    }
  };
}

/**
 * 格式化生日信息
 * @param {Object} tc - 测试用例
 * @returns {Object} 格式化后的生日信息
 */
function formatBirthday(tc) {
  return {
    year: tc.year,
    month: tc.month,
    day: tc.day,
    hour: tc.hour,
    minute: tc.minute || 0,
    gender: tc.gender,
    genderCode: tc.gender === '男' || tc.gender === 1 || tc.gender === 'M' ? 1 : 2,
    age: tc.age || 0
  };
}

/**
 * 获取用例类型（英文）
 * @param {string} caseType - 用例类型（中文）
 * @returns {string} 用例类型（英文）
 */
function getCaseTypeEnglish(caseType) {
  const typeMap = {
    '预设': 'preset',
    '随机': 'random',
    '单个': 'single_specified',
    '失败': 'failed'
  };
  return typeMap[caseType] || 'unknown';
}

/**
 * 获取比对项目名称（中文）
 * @param {string} key - 比对项目键名
 * @returns {string} 比对项目名称（中文）
 */
function getComparisonItemName(key) {
  const nameMap = {
    '四柱': 'fourPillars',
    '八字数组': 'baziArr',
    '纳音': 'nayin',
    '五行能量': 'wuxingEnergy',
    '大运': 'dayun',
    '神煞': 'shensha',
    '天干地支关系': 'relationships',
    '格局分析': 'patternAnalysis'
  };
  return nameMap[key] || key;
}

/**
 * 获取比对项目名称（中文）
 * @param {string} key - 比对项目键名（英文）
 * @returns {string} 比对项目名称（中文）
 */
function getComparisonItemNameChinese(key) {
  const nameMap = {
    'fourPillars': '四柱',
    'baziArr': '八字数组',
    'nayin': '纳音',
    'wuxingEnergy': '五行能量',
    'dayun': '大运',
    'shensha': '神煞',
    'relationships': '天干地支关系',
    'patternAnalysis': '格局分析'
  };
  return nameMap[key] || key;
}

module.exports = {
  saveFailedCases,
  markAsFixed,
  callAPI,
  formatFourPillars,
  formatBirthday,
  getCaseTypeEnglish,
  getComparisonItemName,
  getComparisonItemNameChinese,
  FAILED_CASES_FILE
};
