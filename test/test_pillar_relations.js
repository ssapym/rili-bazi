/**
 * 测试干支组合关系（双冲、天克地刑、双合）
 * 
 * 测试新增的干支组合关系：双冲（60组）、天克地刑（20组）、双合（30组）
 */

const { calculateRelationships } = require('../server/src/services/relationshipService');

/**
 * 测试干支组合关系
 * @returns {Object} 测试结果
 */
function testPillarRelations() {
  console.log('\n========== 测试干支组合关系 ==========');
  
  const testCases = [
    {
      name: '双冲-甲子冲庚午',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '庚', earthBranch: '午' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '甲子冲庚午',
      expectedType: '双冲'
    },
    {
      name: '双冲-乙丑冲辛未',
      pillars: {
        year: { heavenStem: '乙', earthBranch: '丑' },
        month: { heavenStem: '辛', earthBranch: '未' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '乙丑冲辛未',
      expectedType: '双冲'
    },
    {
      name: '双冲-己巳冲乙亥',
      pillars: {
        year: { heavenStem: '己', earthBranch: '巳' },
        month: { heavenStem: '乙', earthBranch: '亥' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '己巳冲乙亥',
      expectedType: '双冲'
    },
    {
      name: '双冲-庚午冲丙子',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '午' },
        month: { heavenStem: '丙', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '寅' },
        hour: { heavenStem: '乙', earthBranch: '卯' }
      },
      expected: '庚午冲丙子',
      expectedType: '双冲'
    },
    {
      name: '双冲-壬申冲戊寅',
      pillars: {
        year: { heavenStem: '壬', earthBranch: '申' },
        month: { heavenStem: '戊', earthBranch: '寅' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '壬申冲戊寅',
      expectedType: '双冲'
    },
    {
      name: '双冲-癸酉冲己卯',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '酉' },
        month: { heavenStem: '己', earthBranch: '卯' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '癸酉冲己卯',
      expectedType: '双冲'
    },
    {
      name: '双冲-丙寅冲癸酉',
      pillars: {
        year: { heavenStem: '丙', earthBranch: '寅' },
        month: { heavenStem: '癸', earthBranch: '酉' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '丙寅冲癸酉',
      expectedType: '双冲'
    },
    {
      name: '双冲-丁卯冲壬申',
      pillars: {
        year: { heavenStem: '丁', earthBranch: '卯' },
        month: { heavenStem: '壬', earthBranch: '申' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '丁卯冲壬申',
      expectedType: '双冲'
    },
    {
      name: '双冲-戊辰冲甲戌',
      pillars: {
        year: { heavenStem: '戊', earthBranch: '辰' },
        month: { heavenStem: '甲', earthBranch: '戌' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '戊辰冲甲戌',
      expectedType: '双冲'
    },
    {
      name: '双冲-辛未冲丁丑',
      pillars: {
        year: { heavenStem: '辛', earthBranch: '未' },
        month: { heavenStem: '丁', earthBranch: '丑' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '辛未冲丁丑',
      expectedType: '双冲'
    },
    {
      name: '天克地刑-乙亥克己亥',
      pillars: {
        year: { heavenStem: '乙', earthBranch: '亥' },
        month: { heavenStem: '己', earthBranch: '亥' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '乙亥克己亥',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-戊辰克壬辰',
      pillars: {
        year: { heavenStem: '戊', earthBranch: '辰' },
        month: { heavenStem: '壬', earthBranch: '辰' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '戊辰克壬辰',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-庚午克丙午',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '午' },
        month: { heavenStem: '丙', earthBranch: '午' },
        day: { heavenStem: '甲', earthBranch: '寅' },
        hour: { heavenStem: '乙', earthBranch: '卯' }
      },
      expected: '庚午克丙午',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-癸酉克己酉',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '酉' },
        month: { heavenStem: '己', earthBranch: '酉' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '癸酉克己酉',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-丁亥克癸亥',
      pillars: {
        year: { heavenStem: '丁', earthBranch: '亥' },
        month: { heavenStem: '癸', earthBranch: '亥' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '丁亥克癸亥',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-庚辰克丙辰',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '辰' },
        month: { heavenStem: '丙', earthBranch: '辰' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '庚辰克丙辰',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-壬午克戊午',
      pillars: {
        year: { heavenStem: '壬', earthBranch: '午' },
        month: { heavenStem: '戊', earthBranch: '午' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '壬午克戊午',
      expectedType: '天克地刑'
    },
    {
      name: '天克地刑-乙酉克辛酉',
      pillars: {
        year: { heavenStem: '乙', earthBranch: '酉' },
        month: { heavenStem: '辛', earthBranch: '酉' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '乙酉克辛酉',
      expectedType: '天克地刑'
    },
    {
      name: '双合-甲子合己丑',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '己', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '甲子合己丑',
      expectedType: '双合'
    },
    {
      name: '双合-丙寅合辛亥',
      pillars: {
        year: { heavenStem: '丙', earthBranch: '寅' },
        month: { heavenStem: '辛', earthBranch: '亥' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '丙寅合辛亥',
      expectedType: '双合'
    },
    {
      name: '双合-戊辰合癸酉',
      pillars: {
        year: { heavenStem: '戊', earthBranch: '辰' },
        month: { heavenStem: '癸', earthBranch: '酉' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '戊辰合癸酉',
      expectedType: '双合'
    },
    {
      name: '双合-庚午合乙未',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '午' },
        month: { heavenStem: '乙', earthBranch: '未' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '庚午合乙未',
      expectedType: '双合'
    },
    {
      name: '双合-壬申合丁巳',
      pillars: {
        year: { heavenStem: '壬', earthBranch: '申' },
        month: { heavenStem: '丁', earthBranch: '巳' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '壬申合丁巳',
      expectedType: '双合'
    },
    {
      name: '双合-甲午合己未',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '午' },
        month: { heavenStem: '己', earthBranch: '未' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expected: '甲午合己未',
      expectedType: '双合'
    },
    {
      name: '双合-丙辰合辛酉',
      pillars: {
        year: { heavenStem: '丙', earthBranch: '辰' },
        month: { heavenStem: '辛', earthBranch: '酉' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '丙辰合辛酉',
      expectedType: '双合'
    },
    {
      name: '双合-戊戌合癸卯',
      pillars: {
        year: { heavenStem: '戊', earthBranch: '戌' },
        month: { heavenStem: '癸', earthBranch: '卯' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '戊戌合癸卯',
      expectedType: '双合'
    },
    {
      name: '双合-庚戌合乙卯',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '戌' },
        month: { heavenStem: '乙', earthBranch: '卯' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '庚戌合乙卯',
      expectedType: '双合'
    },
    {
      name: '双合-壬午合丁未',
      pillars: {
        year: { heavenStem: '壬', earthBranch: '午' },
        month: { heavenStem: '丁', earthBranch: '未' },
        day: { heavenStem: '甲', earthBranch: '子' },
        hour: { heavenStem: '乙', earthBranch: '丑' }
      },
      expected: '壬午合丁未',
      expectedType: '双合'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = calculateRelationships(testCase.pillars);
    const found = result.pillars.find(item => item.desc === testCase.expected);
    
    if (found && found.type === testCase.expectedType) {
      console.log(`✅ ${testCase.name}: 检测到 ${testCase.expected}，类型为 ${testCase.expectedType}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.name}: 未检测到 ${testCase.expected} 或类型不正确`);
      console.log(`   期望类型: ${testCase.expectedType}`);
      console.log(`   实际结果:`, JSON.stringify(result.pillars, null, 2));
      failed++;
    }
  }

  console.log(`\n干支组合关系测试结果: ${passed}/${testCases.length} 通过`);
  return { passed, failed, total: testCases.length };
}

/**
 * 测试pillars字段
 * @returns {Object} 测试结果
 */
function testPillarField() {
  console.log('\n========== 测试pillars字段 ==========');
  
  const pillars = {
    year: { heavenStem: '甲', earthBranch: '子' },
    month: { heavenStem: '己', earthBranch: '丑' },
    day: { heavenStem: '丙', earthBranch: '寅' },
    hour: { heavenStem: '丁', earthBranch: '卯' }
  };

  const result = calculateRelationships(pillars);
  
  console.log('\n完整的关系结果:');
  console.log('天干关系:', JSON.stringify(result.stems, null, 2));
  console.log('地支关系:', JSON.stringify(result.branches, null, 2));
  console.log('干支组合关系:', JSON.stringify(result.pillars, null, 2));
  
  if (result.pillars && Array.isArray(result.pillars)) {
    console.log('\n✅ pillars字段存在且为数组');
    if (result.pillars.length > 0) {
      console.log(`✅ pillars字段包含 ${result.pillars.length} 个关系`);
      return { passed: 1, failed: 0, total: 1 };
    } else {
      console.log('⚠️  pillars字段为空（可能没有匹配的干支组合关系）');
      return { passed: 1, failed: 0, total: 1 };
    }
  } else {
    console.log('❌ pillars字段不存在或不是数组');
    return { passed: 0, failed: 1, total: 1 };
  }
}

/**
 * 主测试函数
 */
async function runPillarRelationsTests() {
  console.log('========================================');
  console.log('  干支组合关系测试');
  console.log('========================================');

  const pillarResult = testPillarRelations();
  const fieldResult = testPillarField();

  const totalPassed = pillarResult.passed + fieldResult.passed;
  const totalFailed = pillarResult.failed + fieldResult.failed;
  const totalTests = pillarResult.total + fieldResult.total;

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
  runPillarRelationsTests().then(result => {
    process.exit(result.totalFailed > 0 ? 1 : 0);
  });
}

module.exports = { runPillarRelationsTests, testPillarRelations, testPillarField };
