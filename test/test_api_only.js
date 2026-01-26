/**
 * 纯API测试
 * 
 * 仅测试 API 端点，检查返回数据格式是否正确
 * 
 * 前置要求：
 *   启动 API 服务器: cd server && node server.js
 */

const http = require('http');
const { TEST_CASES, BEIJING_DONGCHENG_LONGITUDE, API_BASE_URL } = require('./test_config');

function callAPI(params) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams(params).toString();
    http.get(`${API_BASE_URL}/api/bazi?${query}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function validateResponse(data) {
  const errors = [];

  if (!data.success) {
    errors.push('success 字段为 false');
  }

  if (!data.data) {
    errors.push('data 字段缺失');
    return errors;
  }

  const d = data.data;

  if (!d.sizhu) {
    errors.push('sizhu 数据缺失');
  } else {
    const pillars = ['nian', 'yue', 'ri', 'shi'];
    for (const p of pillars) {
      if (!d.sizhu[p]) {
        errors.push(`四柱[${p}] 数据缺失`);
      } else {
        const pillar = d.sizhu[p];
        if (!pillar.tiangan) errors.push(`四柱[${p}] 天干缺失`);
        if (!pillar.dizhi) errors.push(`四柱[${p}] 地支缺失`);
        if (!pillar.zhuxing) errors.push(`四柱[${p}] 十神缺失`);
        if (!pillar.xingyun) errors.push(`四柱[${p}] 星运缺失`);
        if (!pillar.zizuo) errors.push(`四柱[${p}] 自坐缺失`);
        if (!pillar.nayin) errors.push(`四柱[${p}] 纳音缺失`);
        if (!pillar.canggan) errors.push(`四柱[${p}] 藏干缺失`);
        if (!pillar.kongwang) errors.push(`四柱[${p}] 空亡缺失`);
      }
    }
  }

  if (!d.nengliang) {
    errors.push('nengliang 数据缺失');
  } else {
    if (!d.nengliang.summary) errors.push('五行能量 summary 缺失');
    if (!d.nengliang.bodyStrengthText) errors.push('五行能量 bodyStrengthText 缺失');
    if (!d.nengliang.wuxing) errors.push('五行能量 wuxing 缺失');
    else if (!d.nengliang.wuxing.elements) errors.push('五行能量 elements 缺失');
  }

  if (!d.geju) {
    errors.push('geju 数据缺失');
  } else {
    if (!d.geju.mingcheng) errors.push('格局 mingcheng 缺失');
    if (!d.geju.yongshen) errors.push('格局 yongshen 缺失');
    if (!d.geju.xishen) errors.push('格局 xishen 缺失');
    if (!d.geju.jishen) errors.push('格局 jishen 缺失');
  }

  if (!d.dayun || !Array.isArray(d.dayun)) {
    errors.push('dayun 数据缺失或格式错误');
  }

  if (!d.shensha) {
    errors.push('shensha 数据缺失');
  } else {
    const pillars = ['nian', 'yue', 'ri', 'shi'];
    for (const p of pillars) {
      if (!d.shensha[p]) {
        errors.push(`神煞[${p}] 数据缺失`);
      }
    }
  }

  if (!d.chonghe) {
    errors.push('chonghe 数据缺失');
  } else {
    if (!d.chonghe.stems) errors.push('天干关系 stems 缺失');
    if (!d.chonghe.branches) errors.push('地支关系 branches 缺失');
  }

  return errors;
}

async function runTest() {
  console.log('='.repeat(60));
  console.log('纯API测试');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    console.log(`\n测试: ${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender}`);

    const params = {
      year: tc.year,
      month: tc.month,
      day: tc.day,
      hour: tc.hour,
      minute: 0,
      longitude: BEIJING_DONGCHENG_LONGITUDE,
      gender: tc.gender === '男' ? 1 : 2,
      useTrueSolar: true
    };

    try {
      const response = await callAPI(params);

      if (response.error) {
        console.log(`  ❌ API错误: ${response.error.message}`);
        failed++;
        continue;
      }

      const errors = validateResponse(response);

      if (errors.length === 0) {
        console.log(`  ✅ API返回数据格式正确`);
        passed++;
      } else {
        console.log(`  ❌ 数据验证失败:`);
        errors.forEach(e => console.log(`     - ${e}`));
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ 请求异常: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('测试结果汇总');
  console.log('='.repeat(60));
  console.log(`总测试数: ${TEST_CASES.length}`);
  console.log(`通过: ${passed} ✅`);
  console.log(`失败: ${failed} ❌`);
  console.log(`通过率: ${((passed / TEST_CASES.length) * 100).toFixed(1)}%`);
}

runTest().catch(console.error);
