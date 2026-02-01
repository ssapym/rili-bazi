/**
 * 测试关系类型的大类和细类字段
 * 
 * 测试返回的type（大类）和detailType（细类）字段是否正确
 */

const { calculateRelationships, getRelationTypeInfo } = require('../server/src/services/relationshipService');

/**
 * 测试关系类型字段
 * @returns {Object} 测试结果
 */
function testRelationTypeFields() {
  console.log('\n========== 测试关系类型字段（type和detailType） ==========');
  
  const testCases = [
    {
      name: '测试天干五合',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '己', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expectedRelations: [
        { desc: '甲己合化土', type: '合', detailType: '天干五合' }
      ]
    },
    {
      name: '测试地支六合',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '巳' },
        month: { heavenStem: '乙', earthBranch: '申' },
        day: { heavenStem: '辛', earthBranch: '卯' },
        hour: { heavenStem: '癸', earthBranch: '酉' }
      },
      expectedRelations: [
        { desc: '巳申合化水', type: '合', detailType: '地支六合' }
      ]
    },
    {
      name: '测试地支三合',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '亥卯未三合木', type: '合', detailType: '地支三合' }
      ]
    },
    {
      name: '测试半三合',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '申' },
        month: { heavenStem: '乙', earthBranch: '酉' },
        day: { heavenStem: '辛', earthBranch: '卯' },
        hour: { heavenStem: '癸', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '申子半合水', type: '合', detailType: '半三合' },
        { desc: '巳酉半合金', type: '合', detailType: '半三合' }
      ]
    },
    {
      name: '测试半三会',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '亥子半会水', type: '会', detailType: '半三会' },
        { desc: '巳午半会火', type: '会', detailType: '半三会' }
      ]
    },
    {
      name: '测试地支三会',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '丑' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '亥子丑会水', type: '会', detailType: '地支三会' }
      ]
    },
    {
      name: '测试地支六冲',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '子午冲', type: '冲', detailType: '地支六冲' }
      ]
    },
    {
      name: '测试地支六害',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '子未害', type: '害', detailType: '地支六害' }
      ]
    },
    {
      name: '测试地支六破',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '申' },
        month: { heavenStem: '乙', earthBranch: '酉' },
        day: { heavenStem: '辛', earthBranch: '午' },
        hour: { heavenStem: '癸', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '卯午破', type: '破', detailType: '地支六破' }
      ]
    },
    {
      name: '测试地支四绝',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '午亥绝', type: '绝', detailType: '地支四绝' }
      ]
    },
    {
      name: '测试地支相刑',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '申' },
        month: { heavenStem: '乙', earthBranch: '酉' },
        day: { heavenStem: '辛', earthBranch: '卯' },
        hour: { heavenStem: '癸', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '巳申相刑', type: '刑', detailType: '地支相刑' }
      ]
    },
    {
      name: '测试地支自刑',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '申' },
        month: { heavenStem: '乙', earthBranch: '酉' },
        day: { heavenStem: '辛', earthBranch: '午' },
        hour: { heavenStem: '癸', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '午午自刑', type: '刑', detailType: '地支自刑' }
      ]
    },
    {
      name: '测试地支三刑（三刑）',
      pillars: {
        year: { heavenStem: '丙', earthBranch: '寅' },
        month: { heavenStem: '辛', earthBranch: '巳' },
        day: { heavenStem: '庚', earthBranch: '申' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expectedRelations: [
        { desc: '寅巳申三刑', type: '刑', detailType: '地支三刑（三刑）' }
      ]
    },
    {
      name: '测试天干相克',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '己', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expectedRelations: [
        { desc: '甲戊克', type: '克', detailType: '天干相克' }
      ]
    },
    {
      name: '测试双冲',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '癸亥冲己巳', type: '双冲', detailType: '双冲' }
      ]
    },
    {
      name: '测试天克地刑',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '癸亥克己亥', type: '双冲', detailType: '天克地刑' }
      ]
    },
    {
      name: '测试双合',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '子' },
        month: { heavenStem: '己', earthBranch: '丑' },
        day: { heavenStem: '丙', earthBranch: '寅' },
        hour: { heavenStem: '丁', earthBranch: '卯' }
      },
      expectedRelations: [
        { desc: '甲子合己丑', type: '双合', detailType: '双合' }
      ]
    },
    {
      name: '测试暗合',
      pillars: {
        year: { heavenStem: '癸', earthBranch: '亥' },
        month: { heavenStem: '甲', earthBranch: '子' },
        day: { heavenStem: '甲', earthBranch: '午' },
        hour: { heavenStem: '己', earthBranch: '巳' }
      },
      expectedRelations: [
        { desc: '午亥暗合', type: '合', detailType: '暗合' }
      ]
    }
  ];
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    
    const result = calculateRelationships(testCase.pillars);
    
    let allPassed = true;
    
    for (const expected of testCase.expectedRelations) {
      const found = findRelation(result, expected.desc);
      
      if (!found) {
        console.log(`❌ 失败: 未找到关系 "${expected.desc}"`);
        allPassed = false;
        continue;
      }
      
      if (found.type !== expected.type) {
        console.log(`❌ 失败: 关系 "${expected.desc}" 的 type 字段不正确`);
        console.log(`   期望: ${expected.type}, 实际: ${found.type}`);
        allPassed = false;
        continue;
      }
      
      if (found.detailType !== expected.detailType) {
        console.log(`❌ 失败: 关系 "${expected.desc}" 的 detailType 字段不正确`);
        console.log(`   期望: ${expected.detailType}, 实际: ${found.detailType}`);
        allPassed = false;
        continue;
      }
      
      console.log(`✅ 通过: ${expected.desc} - type: ${found.type}, detailType: ${found.detailType}`);
    }
    
    if (allPassed) {
      passedCount++;
    } else {
      failedCount++;
    }
  }
  
  console.log('\n========== 测试结果 ==========');
  console.log(`通过: ${passedCount}/${testCases.length}`);
  console.log(`失败: ${failedCount}/${testCases.length}`);
  
  return {
    total: testCases.length,
    passed: passedCount,
    failed: failedCount,
    success: failedCount === 0
  };
}

/**
 * 在关系数据中查找指定的关系
 * @param {Object} data - 关系数据
 * @param {string} desc - 关系描述
 * @returns {Object|null} 找到的关系对象
 */
function findRelation(data, desc) {
  const allRelations = [
    ...(data.stems || []),
    ...(data.branches || []),
    ...(data.pillars || [])
  ];
  
  return allRelations.find(relation => relation.desc === desc) || null;
}

/**
 * 测试getRelationTypeInfo函数
 * @returns {Object} 测试结果
 */
function testGetRelationTypeInfo() {
  console.log('\n========== 测试getRelationTypeInfo函数 ==========');
  
  const testCases = [
    { type: 0, expected: { type: '冲', detailType: '天干相冲' } },
    { type: 1, expected: { type: '合', detailType: '天干五合' } },
    { type: 2, expected: { type: '冲', detailType: '地支六冲' } },
    { type: 3, expected: { type: '刑', detailType: '地支三刑（三刑）' } },
    { type: 4, expected: { type: '刑', detailType: '地支相刑' } },
    { type: 5, expected: { type: '刑', detailType: '地支自刑' } },
    { type: 6, expected: { type: '合', detailType: '地支六合' } },
    { type: 7, expected: { type: '合', detailType: '地支三合' } },
    { type: 8, expected: { type: '合', detailType: '半三合' } },
    { type: 9, expected: { type: '合', detailType: '拱合' } },
    { type: 10, expected: { type: '会', detailType: '地支三会' } },
    { type: 11, expected: { type: '会', detailType: '半三会' } },
    { type: 12, expected: { type: '合', detailType: '暗合' } },
    { type: 13, expected: { type: '害', detailType: '地支六害' } },
    { type: 14, expected: { type: '夹', detailType: '夹' } },
    { type: 15, expected: { type: '克', detailType: '天干相克' } },
    { type: 16, expected: { type: '破', detailType: '地支六破' } },
    { type: 17, expected: { type: '双冲', detailType: '双冲' } },
    { type: 18, expected: { type: '双冲', detailType: '天克地刑' } },
    { type: 19, expected: { type: '双合', detailType: '双合' } },
    { type: 20, expected: { type: '绝', detailType: '地支四绝' } }
  ];
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const testCase of testCases) {
    const result = getRelationTypeInfo(testCase.type);
    
    if (result.type === testCase.expected.type && result.detailType === testCase.expected.detailType) {
      console.log(`✅ 通过: type=${testCase.type} -> type=${result.type}, detailType=${result.detailType}`);
      passedCount++;
    } else {
      console.log(`❌ 失败: type=${testCase.type}`);
      console.log(`   期望: type=${testCase.expected.type}, detailType=${testCase.expected.detailType}`);
      console.log(`   实际: type=${result.type}, detailType=${result.detailType}`);
      failedCount++;
    }
  }
  
  console.log('\n========== 测试结果 ==========');
  console.log(`通过: ${passedCount}/${testCases.length}`);
  console.log(`失败: ${failedCount}/${testCases.length}`);
  
  return {
    total: testCases.length,
    passed: passedCount,
    failed: failedCount,
    success: failedCount === 0
  };
}

/**
 * 主函数
 */
function main() {
  console.log('========================================');
  console.log('  测试关系类型字段（type和detailType）');
  console.log('========================================');
  
  const result1 = testGetRelationTypeInfo();
  const result2 = testRelationTypeFields();
  
  const totalPassed = result1.passed + result2.passed;
  const totalFailed = result1.failed + result2.failed;
  const totalTests = result1.total + result2.total;
  
  console.log('\n========== 总体测试结果 ==========');
  console.log(`通过: ${totalPassed}/${totalTests}`);
  console.log(`失败: ${totalFailed}/${totalTests}`);
  
  if (totalFailed === 0) {
    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  } else {
    console.log('\n❌ 部分测试失败！');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testRelationTypeFields,
  testGetRelationTypeInfo
};
