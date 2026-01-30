/**
 * 测试天干相克和地支六破关系
 * 
 * 测试新增的天干相克（6个）和地支六破（6个）关系
 */

const { calculateRelationships } = require('../server/src/services/relationshipService');

/**
 * 测试天干相克关系
 * @returns {Object} 测试结果
 */
function testStemOvercome() {
  console.log('\n========== 测试天干相克关系 ==========');
  
  const testCases = [
    {
      name: '甲克戊',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '戊', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '甲戊克'
    },
    {
      name: '乙克己',
      pillars: {
        year: { heavenStem: '乙', earthBranch: '子' },
        month: { heavenStem: '己', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '乙己克'
    },
    {
      name: '丙克庚',
      pillars: {
        year: { heavenStem: '丙', earthBranch: '子' },
        month: { heavenStem: '庚', earthBranch: '丑' },
        day: { heavenStem: '甲', earthBranch: '寅' },
        hour: { heavenStem: '乙', earthBranch: '卯' }
      },
      expected: '丙庚克'
    },
    {
      name: '丁克辛',
      pillars: {
        year: { heavenStem: '丁', earthBranch: '子' },
        month: { heavenStem: '辛', earthBranch: '丑' },
        day: { heavenStem: '甲', earthBranch: '寅' },
        hour: { heavenStem: '乙', earthBranch: '卯' }
      },
      expected: '丁辛克'
    },
    {
      name: '戊克壬',
      pillars: {
        year: { heavenStem: '戊', earthBranch: '子' },
        month: { heavenStem: '壬', earthBranch: '丑' },
        day: { heavenStem: '甲', earthBranch: '寅' },
        hour: { heavenStem: '乙', earthBranch: '卯' }
      },
      expected: '戊壬克'
    },
    {
      name: '己克癸',
      pillars: {
        year: { heavenStem: '己', earthBranch: '子' },
        month: { heavenStem: '癸', earthBranch: '丑' },
        day: { heavenStem: '甲', earthBranch: '寅' },
        hour: { heavenStem: '乙', earthBranch: '卯' }
      },
      expected: '己癸克'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = calculateRelationships(testCase.pillars);
    const found = result.stems.find(item => item.desc === testCase.expected);
    
    if (found) {
      console.log(`✅ ${testCase.name}: 检测到 ${testCase.expected}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name}: 未检测到 ${testCase.expected}`);
      console.log(`   实际结果:`, JSON.stringify(result.stems, null, 2));
      failed++;
    }
  }

  console.log(`\n天干相克测试结果: ${passed}/${testCases.length} 通过`);
  return { passed, failed, total: testCases.length };
}

/**
 * 测试地支六破关系
 * @returns {Object} 测试结果
 */
function testBranchBreak() {
  console.log('\n========== 测试地支六破关系 ==========');
  
  const testCases = [
    {
      name: '子酉破',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '乙', earthBranch: '酉' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '子酉破'
    },
    {
      name: '卯午破',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '卯' },
        month: { heavenStem: '乙', earthBranch: '午' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '卯午破'
    },
    {
      name: '辰丑破',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '辰' },
        month: { heavenStem: '乙', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '辰丑破'
    },
    {
      name: '未戌破',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '未' },
        month: { heavenStem: '乙', earthBranch: '戌' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '未戌破'
    },
    {
      name: '寅亥破',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '寅' },
        month: { heavenStem: '乙', earthBranch: '亥' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '寅亥破'
    },
    {
      name: '申巳破',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '申' },
        month: { heavenStem: '乙', earthBranch: '巳' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '申巳破'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = calculateRelationships(testCase.pillars);
    const found = result.branches.find(item => item.desc === testCase.expected);
    
    if (found) {
      console.log(`✅ ${testCase.name}: 检测到 ${testCase.expected}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name}: 未检测到 ${testCase.expected}`);
      console.log(`   实际结果:`, JSON.stringify(result.branches, null, 2));
      failed++;
    }
  }

  console.log(`\n地支六破测试结果: ${passed}/${testCases.length} 通过`);
  return { passed, failed, total: testCases.length };
}

/**
 * 测试关系类型
 * @returns {Object} 测试结果
 */
function testRelationType() {
  console.log('\n========== 测试关系类型 ==========');
  
  const testCases = [
    {
      name: '天干相克关系类型',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '戊', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expectedDesc: '甲戊克',
      expectedType: '克'
    },
    {
      name: '地支六破关系类型',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '乙', earthBranch: '酉' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expectedDesc: '子酉破',
      expectedType: '破'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = calculateRelationships(testCase.pillars);
    
    const stemRelation = result.stems.find(item => item.desc === testCase.expectedDesc);
    const branchRelation = result.branches.find(item => item.desc === testCase.expectedDesc);
    
    const found = stemRelation || branchRelation;
    
    if (found && found.type === testCase.expectedType) {
      console.log(`✅ ${testCase.name}: ${testCase.expectedDesc} 的类型为 ${testCase.expectedType}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name}: ${testCase.expectedDesc} 的类型不正确`);
      console.log(`   期望类型: ${testCase.expectedType}`);
      console.log(`   实际类型: ${found ? found.type : '未找到'}`);
      failed++;
    }
  }

  console.log(`\n关系类型测试结果: ${passed}/${testCases.length} 通过`);
  return { passed, failed, total: testCases.length };
}

/**
 * 主测试函数
 */
async function runRelationshipsTests() {
  console.log('========================================');
  console.log('  天干相克和地支六破关系测试');
  console.log('========================================');

  const stemResult = testStemOvercome();
  const branchResult = testBranchBreak();
  const typeResult = testRelationType();

  const totalPassed = stemResult.passed + branchResult.passed + typeResult.passed;
  const totalFailed = stemResult.failed + branchResult.failed + typeResult.failed;
  const totalTests = stemResult.total + branchResult.total + typeResult.total;

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${totalPassed}`);
  console.log(`失败: ${totalFailed}`);
  console.log(`成功率: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
  console.log('========================================');

  return { totalPassed, totalFailed, totalTests };
}

if (require.main === module) {
  runRelationshipsTests().then(result => {
    process.exit(result.totalFailed > 0 ? 1 : 0);
  });
}

module.exports = {
  runRelationshipsTests,
  testStemOvercome,
  testBranchBreak,
  testRelationType
};
