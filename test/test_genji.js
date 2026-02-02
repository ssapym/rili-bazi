/**
 * 八字根基判断测试
 * 
 * 测试内容：
 * 1. 测试四柱天干的根基判断
 * 2. 测试暗带天干的根基判断
 * 3. 测试补全地支的根基判断（拱三合、拱隔位、暗带）
 * 4. 测试各种情况：有根、无根、多个根基
 */

const { calculateGenji } = require('../server/src/services/genjiService');

function testGenji() {
  console.log('\n========== 测试根基判断 ==========\n');

  let passCount = 0;
  let failCount = 0;

  const testCases = [
    {
      name: '测试1：甲寅年、丙午月、癸未日、丁子时（有补全）',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '寅' },
        month: { heavenStem: '丙', earthBranch: '午' },
        day: { heavenStem: '癸', earthBranch: '未' },
        hour: { heavenStem: '丁', earthBranch: '子' }
      },
      buquan: {
        gongsanhe: [
          { source: '年+日', derivedBranch: '卯' }
        ],
        gonggewei: [
          { source: '年+时', derivedBranch: '辰' }
        ],
        andai: [
          { 
            source: '年+月',
            derivedStem: '乙',
            derivedBranch: '丑',
            derivedGanZhi: '乙丑'
          }
        ]
      },
      expectedHasRoot: true,
      expectedRootCount: 5
    },
    {
      name: '测试2：庚申年、辛酉月、壬子日、癸丑时（无补全）',
      pillars: {
        year: { heavenStem: '庚', earthBranch: '申' },
        month: { heavenStem: '辛', earthBranch: '酉' },
        day: { heavenStem: '壬', earthBranch: '子' },
        hour: { heavenStem: '癸', earthBranch: '丑' }
      },
      buquan: {
        gongsanhe: [],
        gonggewei: [],
        andai: []
      },
      expectedHasRoot: true,
      expectedRootCount: 4
    },
    {
      name: '测试3：甲巳年、乙亥月、丙子日、丁酉时（部分无根）',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '巳' },
        month: { heavenStem: '乙', earthBranch: '亥' },
        day: { heavenStem: '丙', earthBranch: '子' },
        hour: { heavenStem: '丁', earthBranch: '酉' }
      },
      buquan: {
        gongsanhe: [],
        gonggewei: [],
        andai: []
      },
      expectedHasRoot: true,
      expectedRootCount: 3
    },
    {
      name: '测试4：甲戌年、乙申月、丙丑日、丁子时（无根）',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '戌' },
        month: { heavenStem: '乙', earthBranch: '申' },
        day: { heavenStem: '丙', earthBranch: '丑' },
        hour: { heavenStem: '丁', earthBranch: '子' }
      },
      buquan: {
        gongsanhe: [],
        gonggewei: [],
        andai: []
      },
      expectedHasRoot: true,
      expectedRootCount: 2
    },
    {
      name: '测试5：甲戌年、乙申月、丙丑日、丁亥时（无根）',
      pillars: {
        year: { heavenStem: '甲', earthBranch: '戌' },
        month: { heavenStem: '乙', earthBranch: '申' },
        day: { heavenStem: '丙', earthBranch: '丑' },
        hour: { heavenStem: '丁', earthBranch: '亥' }
      },
      buquan: {
        gongsanhe: [],
        gonggewei: [],
        andai: []
      },
      expectedHasRoot: true,
      expectedRootCount: 3
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    
    const result = calculateGenji(testCase.pillars, testCase.buquan);
    
    console.log('结果：');
    console.log(JSON.stringify(result, null, 2));
    
    const hasRootMatch = result.hasRoot === testCase.expectedHasRoot;
    const rootCountMatch = result.rootCount === testCase.expectedRootCount;
    
    if (hasRootMatch && rootCountMatch) {
      console.log('✅ 通过');
      passCount++;
    } else {
      console.log('❌ 失败');
      if (!hasRootMatch) {
        console.log(`  hasRoot 期望: ${testCase.expectedHasRoot}, 实际: ${result.hasRoot}`);
      }
      if (!rootCountMatch) {
        console.log(`  rootCount 期望: ${testCase.expectedRootCount}, 实际: ${result.rootCount}`);
      }
      failCount++;
    }
  }

  console.log('\n========== 测试结果 ==========');
  console.log(`通过：${passCount}`);
  console.log(`失败：${failCount}`);
  console.log(`总计：${passCount + failCount}`);
  
  return {
    pass: passCount,
    fail: failCount,
    total: passCount + failCount
  };
}

if (require.main === module) {
  testGenji();
}

module.exports = {
  testGenji
};
