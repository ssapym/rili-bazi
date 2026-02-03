/**
 * 十神分布及天透地藏测试用例
 * 
 * 测试目标：
 * 1. 验证十神分布字段名已英文化
 * 2. 验证十神分布distribution功能
 * 3. 验证天透地藏tianTouDiCang功能
 */

const http = require('http');

const API_URL = 'http://localhost:8000/api/bazi';

/**
 * 发送POST请求到API
 */
function postToAPI(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
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
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * 测试用例1：验证十神分布字段名英文化
 */
async function testFieldNamesEnglish() {
  console.log('\n=== 测试用例1：验证十神分布字段名英文化 ===');
  
  const response = await postToAPI({
    year: 1990,
    month: 5,
    day: 15,
    hour: 8,
    minute: 30,
    gender: 1
  });

  const shishen = response.data.nengliang.shishen;
  
  console.log('检查字段名...');
  
  if (shishen.totalCount !== undefined) {
    console.log('✓ totalCount字段存在');
  } else {
    console.log('✗ totalCount字段不存在');
    return false;
  }

  if (shishen.byCount && shishen.byCount.length > 0) {
    const firstItem = shishen.byCount[0];
    if (firstItem.name !== undefined) {
      console.log('✓ byCount[0].name字段存在');
    } else {
      console.log('✗ byCount[0].name字段不存在');
      return false;
    }
    if (firstItem.count !== undefined) {
      console.log('✓ byCount[0].count字段存在');
    } else {
      console.log('✗ byCount[0].count字段不存在');
      return false;
    }
    if (firstItem.percentage !== undefined) {
      console.log('✓ byCount[0].percentage字段存在');
    } else {
      console.log('✗ byCount[0].percentage字段不存在');
      return false;
    }
  }

  if (shishen.zonggeshu !== undefined) {
    console.log('✗ 旧字段zonggeshu仍然存在（应该已删除）');
    return false;
  } else {
    console.log('✓ 旧字段zonggeshu已删除');
  }

  console.log('✓ 字段名英文化测试通过');
  return true;
}

/**
 * 测试用例2：验证十神分布distribution功能
 */
async function testShiShenDistribution() {
  console.log('\n=== 测试用例2：验证十神分布distribution功能 ===');
  
  const response = await postToAPI({
    year: 1990,
    month: 5,
    day: 15,
    hour: 8,
    minute: 30,
    gender: 1
  });

  const distribution = response.data.nengliang.shishen.distribution;
  
  console.log('检查distribution字段...');
  
  if (!distribution) {
    console.log('✗ distribution字段不存在');
    return false;
  }

  const requiredFields = ['niangan', 'nianzhi', 'yuegan', 'yuezhi', 'rigan', 'rizhi', 'shigan', 'shizhi'];
  let allFieldsExist = true;
  
  requiredFields.forEach(field => {
    if (distribution[field] !== undefined) {
      console.log(`✓ ${field}字段存在: ${distribution[field]}`);
    } else {
      console.log(`✗ ${field}字段不存在`);
      allFieldsExist = false;
    }
  });

  if (!allFieldsExist) {
    return false;
  }

  console.log('✓ 十神分布distribution测试通过');
  return true;
}

/**
 * 测试用例3：验证天透地藏tianTouDiCang功能
 */
async function testTianTouDiCang() {
  console.log('\n=== 测试用例3：验证天透地藏tianTouDiCang功能 ===');
  
  const response = await postToAPI({
    year: 1990,
    month: 5,
    day: 15,
    hour: 8,
    minute: 30,
    gender: 1
  });

  const tianTouDiCang = response.data.nengliang.shishen.tianTouDiCang;
  
  console.log('检查tianTouDiCang字段...');
  
  if (!Array.isArray(tianTouDiCang)) {
    console.log('✗ tianTouDiCang不是数组');
    return false;
  }

  console.log(`✓ tianTouDiCang是数组，包含${tianTouDiCang.length}个天透地藏的十神`);

  if (tianTouDiCang.length > 0) {
    const firstItem = tianTouDiCang[0];
    
    if (firstItem.name !== undefined) {
      console.log(`✓ 第一个天透地藏的十神名称: ${firstItem.name}`);
    } else {
      console.log('✗ name字段不存在');
      return false;
    }

    if (firstItem.tianTouPosition !== undefined) {
      console.log(`✓ 天透位置: ${firstItem.tianTouPosition}`);
    } else {
      console.log('✗ tianTouPosition字段不存在');
      return false;
    }

    if (Array.isArray(firstItem.tianTouDetails)) {
      console.log(`✓ 天透详情包含${firstItem.tianTouDetails.length}项`);
    } else {
      console.log('✗ tianTouDetails不是数组');
      return false;
    }

    if (firstItem.diCangPosition !== undefined) {
      console.log(`✓ 地藏位置: ${firstItem.diCangPosition}`);
    } else {
      console.log('✗ diCangPosition字段不存在');
      return false;
    }

    if (Array.isArray(firstItem.diCangDetails)) {
      console.log(`✓ 地藏详情包含${firstItem.diCangDetails.length}项`);
    } else {
      console.log('✗ diCangDetails不是数组');
      return false;
    }
  }

  console.log('✓ 天透地藏tianTouDiCang测试通过');
  return true;
}

/**
 * 测试用例4：验证补全地支的十神分布
 */
async function testBuquanDistribution() {
  console.log('\n=== 测试用例4：验证补全地支的十神分布 ===');
  
  const response = await postToAPI({
    year: 1990,
    month: 5,
    day: 15,
    hour: 8,
    minute: 30,
    gender: 1
  });

  const distribution = response.data.nengliang.shishen.distribution;
  const buquan = response.data.buquan;
  
  console.log('检查补全地支的十神分布...');
  
  if (buquan.gonggewei && buquan.gonggewei.length > 0) {
    if (distribution.gonggewei !== undefined) {
      console.log(`✓ gonggewei字段存在: ${distribution.gonggewei}`);
    } else {
      console.log('✗ gonggewei字段不存在');
      return false;
    }
  }

  if (buquan.gongsanhe && buquan.gongsanhe.length > 0) {
    if (distribution.gongsanhe !== undefined) {
      console.log(`✓ gongsanhe字段存在: ${distribution.gongsanhe}`);
    } else {
      console.log('✗ gongsanhe字段不存在');
      return false;
    }
  }

  if (buquan.andai && buquan.andai.length > 0) {
    if (buquan.andai[0].derivedStem && distribution.andaiTiangan !== undefined) {
      console.log(`✓ andaiTiangan字段存在: ${distribution.andaiTiangan}`);
    }
    if (distribution.andaiDizhi !== undefined) {
      console.log(`✓ andaiDizhi字段存在: ${distribution.andaiDizhi}`);
    } else {
      console.log('✗ andaiDizhi字段不存在');
      return false;
    }
  }

  console.log('✓ 补全地支的十神分布测试通过');
  return true;
}

/**
 * 测试用例5：验证天透地藏包含补全地支
 */
async function testTianTouDiCangWithBuquan() {
  console.log('\n=== 测试用例5：验证天透地藏包含补全地支 ===');
  
  const response = await postToAPI({
    year: 1990,
    month: 5,
    day: 15,
    hour: 8,
    minute: 30,
    gender: 1
  });

  const tianTouDiCang = response.data.nengliang.shishen.tianTouDiCang;
  const buquan = response.data.buquan;
  
  console.log('检查天透地藏是否包含补全地支...');
  
  if (tianTouDiCang.length > 0) {
    const firstItem = tianTouDiCang[0];
    
    const hasBuquanDiCang = firstItem.diCangDetails.some(detail => 
      detail.type === '补全地支'
    );
    
    if (hasBuquanDiCang) {
      console.log('✓ 天透地藏包含补全地支');
      const buquanDiCang = firstItem.diCangDetails.filter(detail => 
        detail.type === '补全地支'
      );
      console.log(`  补全地支详情: ${JSON.stringify(buquanDiCang, null, 2)}`);
    } else {
      console.log('✗ 天透地藏不包含补全地支');
      return false;
    }
  }

  console.log('✓ 天透地藏包含补全地支测试通过');
  return true;
}

/**
 * 运行所有测试用例
 */
async function runAllTests() {
  console.log('========================================');
  console.log('  十神分布及天透地藏测试套件');
  console.log('========================================');

  const tests = [
    { name: '字段名英文化', fn: testFieldNamesEnglish },
    { name: '十神分布distribution', fn: testShiShenDistribution },
    { name: '天透地藏tianTouDiCang', fn: testTianTouDiCang },
    { name: '补全地支的十神分布', fn: testBuquanDistribution },
    { name: '天透地藏包含补全地支', fn: testTianTouDiCangWithBuquan }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`✗ ${test.name}测试失败:`, error.message);
      failed++;
    }
  }

  console.log('\n========================================');
  console.log('  测试结果汇总');
  console.log('========================================');
  console.log(`总计: ${tests.length}个测试`);
  console.log(`通过: ${passed}个`);
  console.log(`失败: ${failed}个`);
  
  if (failed === 0) {
    console.log('\n✓ 所有测试通过！');
  } else {
    console.log('\n✗ 部分测试失败');
    process.exit(1);
  }
}

runAllTests();
