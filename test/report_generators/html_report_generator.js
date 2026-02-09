/**
 * HTML报告生成器模块
 * 
 * 生成HTML格式的测试报告
 */

const fs = require('fs');
const path = require('path');

/**
 * 生成HTML测试报告
 * @param {Array} results - 测试结果数组
 * @param {number} passed - 通过数
 * @param {number} failed - 失败数
 * @param {number} total - 总数
 * @param {string} reportId - 报告ID
 * @returns {string} HTML报告内容
 */
function generateHTMLReport(results, passed, failed, total, reportId) {
  const now = new Date();
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  const passColor = passRate >= 80 ? '#28a745' : passRate >= 50 ? '#ffc107' : '#dc3545';

  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>八字 API vs SPA 对比测试报告 - ${now.toLocaleString('zh-CN')}</title>
  <style>
    body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 15px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .stat-box { flex: 1; padding: 20px; border-radius: 8px; text-align: center; color: white; cursor: pointer; transition: transform 0.2s; }
    .stat-box:hover { transform: translateY(-2px); }
    .stat-box.active { border: 3px solid #007bff; }
    .stat-total { background: #6c757d; }
    .stat-pass { background: #28a745; }
    .stat-fail { background: #dc3545; }
    .stat-rate { background: ${passColor}; }
    .stat-number { font-size: 36px; font-weight: bold; }
    .stat-label { font-size: 14px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    tr:hover { background: #f8f9fa; }
    .status-pass { color: #28a745; font-weight: bold; }
    .status-fail { color: #dc3545; font-weight: bold; }
    .mismatch-list { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0; font-size: 13px; }
    .mismatch-item { padding: 5px 0; border-bottom: 1px solid #e0c975; }
    .footer { margin-top: 30px; color: #6c757d; text-align: center; font-size: 12px; }
    .detail-section { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .detail-title { font-weight: bold; margin-bottom: 10px; color: #495057; }
    .detail-item { display: flex; justify-content: space-between; padding: 5px 0; }
    .detail-ok { color: #28a745; }
    .detail-error { color: #dc3545; }
    .data-toggle { cursor: pointer; color: #007bff; text-decoration: underline; font-size: 13px; margin-top: 10px; }
    .data-section { display: none; margin-top: 10px; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 5px; }
    .data-section.show { display: block; }
    .data-title { font-weight: bold; margin-bottom: 10px; color: #007bff; }
    .data-content { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
    
    /* 新增样式：四柱信息 */
    .sizhu-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 10px 0; padding: 10px; background: #e9ecef; border-radius: 5px; }
    .sizhu-pillar { text-align: center; padding: 8px; background: white; border-radius: 4px; }
    .sizhu-pillar .label { font-size: 12px; color: #6c757d; margin-bottom: 5px; }
    .sizhu-pillar .value { font-size: 18px; font-weight: bold; color: #212529; }
    .sizhu-pillar .nayin { font-size: 11px; color: #6c757d; margin-top: 3px; }
    
    /* 新增样式：差异总结 */
    .difference-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; padding: 15px; background: #fff; border: 1px solid #ddd; border-radius: 5px; }
    .difference-summary-column { padding: 10px; background: #f8f9fa; border-radius: 4px; }
    .difference-summary-column .title { font-size: 14px; font-weight: bold; color: #212529; margin-bottom: 10px; text-align: center; }
    .difference-summary-item { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #e9ecef; }
    .difference-summary-item:last-child { border-bottom: none; }
    .difference-summary-item .field { color: #6c757d; }
    .difference-summary-item .value { color: #212529; font-weight: 500; }
    
    /* 新增样式：可接受差异 */
    .acceptable-differences { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .acceptable-differences .title { font-weight: bold; margin-bottom: 10px; color: #155724; }
    .acceptable-difference-item { padding: 5px 0; color: #155724; font-size: 13px; }
    
    /* 新增样式：全部差异总结 */
    .all-differences-summary { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 10px 0; }
    .all-differences-summary .title { font-weight: bold; margin-bottom: 10px; color: #856404; }
    
    /* 隐藏的测试用例 */
    .test-row.hidden { display: none; }
    
    /* 原始数据左右并排显示 */
    .data-section-split { display: none; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
    .data-section-split.show { display: grid; }
    .data-column { background: #f8f9fa; padding: 10px; border-radius: 5px; border: 1px solid #ddd; }
    .data-column .data-title { font-weight: bold; margin-bottom: 10px; color: #007bff; }
    .data-column .data-content { background: white; padding: 10px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; max-height: 400px; overflow-y: auto; }
    
    /* 新增样式：比对项目展开/收起 */
    .comparison-item { margin: 8px 0; border-radius: 5px; overflow: hidden; }
    .comparison-item.item-passed { background: #d4edda; border: 1px solid #c3e6cb; }
    .comparison-item.item-failed { background: #f8d7da; border: 1px solid #f5c6cb; }
    .comparison-item-header { display: flex; align-items: center; padding: 10px 12px; cursor: pointer; user-select: none; }
    .comparison-item-header:hover { opacity: 0.9; }
    .item-name { font-weight: bold; color: #212529; flex: 1; }
    .item-status { font-size: 13px; color: #495057; margin-right: 10px; }
    .toggle-icon { font-size: 10px; color: #6c757d; transition: transform 0.2s; }
    .comparison-item-details { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out; background: white; }
    .comparison-item-details.expanded { max-height: 2000px; }
    .comparison-item-details.collapsed { max-height: 0; }
    .detail-row { display: flex; align-items: center; padding: 8px 15px; border-bottom: 1px solid #e9ecef; font-size: 13px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row.passed { background: #fff; }
    .detail-row.failed { background: #fff3cd; }
    .detail-name { width: 140px; color: #6c757d; flex-shrink: 0; }
    .detail-values { flex: 1; display: flex; gap: 10px; justify-content: center; }
    .api-value { color: #007bff; font-weight: 500; }
    .separator { color: #adb5bd; }
    .spa-value { color: #28a745; font-weight: 500; }
    .detail-status { width: 80px; text-align: right; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 八字 API vs SPA 完整对比测试报告</h1>
    <p><strong>生成时间:</strong> ${now.toLocaleString('zh-CN')}</p>
    <p><strong>报告ID:</strong> ${reportId}</p>
    
    <div class="summary">
      <div class="stat-box stat-total active" data-filter="all" onclick="filterResults('all')">
        <div class="stat-number">${total}</div>
        <div class="stat-label">总测试数</div>
      </div>
      <div class="stat-box stat-pass" data-filter="passed" onclick="filterResults('passed')">
        <div class="stat-number">${passed}</div>
        <div class="stat-label">通过 ✅</div>
      </div>
      <div class="stat-box stat-fail" data-filter="failed" onclick="filterResults('failed')">
        <div class="stat-number">${failed}</div>
        <div class="stat-label">失败 ❌</div>
      </div>
      <div class="stat-box stat-rate">
        <div class="stat-number">${passRate}%</div>
        <div class="stat-label">通过率</div>
      </div>
    </div>

    <h2>📋 测试详情</h2>
    <table>
      <thead>
        <tr>
          <th>序号</th>
          <th>测试用例</th>
          <th>类型</th>
          <th>状态</th>
          <th>差异数</th>
          <th>详情</th>
        </tr>
      </thead>
      <tbody>`;

  results.forEach((r, idx) => {
    const tc = r.birthday;
    const status = r.status === 'passed' ? 'pass' : 'fail';
    const mismatches = r.mismatches || [];
    const acceptableDifferences = r.acceptableDifferences || [];
    const comparisonItems = r.comparisonItems || {};
    const fourPillars = r.fourPillars || {};
    const typeLabel = r.caseType;

    let detailHtml = '';
    
    // 添加四柱信息
    detailHtml += `<div class="sizhu-info">
      <div class="sizhu-pillar">
        <div class="label">年柱</div>
        <div class="value">${fourPillars.year?.stem || ''}${fourPillars.year?.branch || ''}</div>
        <div class="nayin">${fourPillars.year?.nayin || ''}</div>
      </div>
      <div class="sizhu-pillar">
        <div class="label">月柱</div>
        <div class="value">${fourPillars.month?.stem || ''}${fourPillars.month?.branch || ''}</div>
        <div class="nayin">${fourPillars.month?.nayin || ''}</div>
      </div>
      <div class="sizhu-pillar">
        <div class="label">日柱</div>
        <div class="value">${fourPillars.day?.stem || ''}${fourPillars.day?.branch || ''}</div>
        <div class="nayin">${fourPillars.day?.nayin || ''}</div>
      </div>
      <div class="sizhu-pillar">
        <div class="label">时柱</div>
        <div class="value">${fourPillars.hour?.stem || ''}${fourPillars.hour?.branch || ''}</div>
        <div class="nayin">${fourPillars.hour?.nayin || ''}</div>
      </div>
    </div>`;
    
    // 添加比对项目（支持展开/收起，显示通过+失败=总数）
    const comparisonItemNames = {
      'fourPillars': '四柱',
      'baziArr': '八字数组',
      'nayin': '纳音',
      'wuxingEnergy': '五行能量',
      'dayun': '大运',
      'shensha': '神煞',
      'relationships': '天干地支关系',
      'patternAnalysis': '格局分析'
    };
    
    const detailSectionId = `detail-${idx}`;
    detailHtml += `<div class="detail-section">
      <div class="detail-title">比对项目</div>`;
    
    for (const [key, item] of Object.entries(comparisonItems)) {
      const itemName = comparisonItemNames[key] || key;
      const passed = item.passed || 0;
      const failed = item.failed || 0;
      const total = item.total || (passed + failed);
      const status = item.status || 'passed';
      const isPassed = status === 'passed';
      const uniqueDetailId = `${detailSectionId}-${key}`;
      
      detailHtml += `
        <div class="comparison-item ${isPassed ? 'item-passed' : 'item-failed'}">
          <div class="comparison-item-header" onclick="toggleDetail('${uniqueDetailId}')">
            <span class="item-name">${itemName}</span>
            <span class="item-status">${passed}✅+${failed}❌=${total}</span>
            <span class="toggle-icon">▶</span>
          </div>
          <div id="${uniqueDetailId}" class="comparison-item-details collapsed">
            ${(item.details || []).map(d => `
              <div class="detail-row ${d.status}">
                <span class="detail-name">${d.name || ''}</span>
                <span class="detail-values">
                  <span class="api-value">${d.apiValue || '无'}</span>
                  <span class="separator">|</span>
                  <span class="spa-value">${d.spaValue || '无'}</span>
                </span>
                <span class="detail-status">${d.status === 'passed' ? '✅' : '❌'}${d.acceptable ? ' (可接受)' : ''}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
    }
    
    detailHtml += `</div>`;
    
    // 添加可接受的差异说明（详细描述）
    if (acceptableDifferences.length > 0) {
      detailHtml += `<div class="acceptable-differences">
        <div class="title">ℹ️ 可接受的差异说明</div>`;
      
      acceptableDifferences.forEach(diff => {
        detailHtml += `<div class="acceptable-difference-item"><strong>${diff.fieldName}:</strong> ${diff.apiValue} vs ${diff.spaValue} - 已接受（${diff.reason}）</div>`;
      });
      
      detailHtml += `</div>`;
    }
    
    // 添加失败差异
    if (mismatches.length > 0) {
      detailHtml += `<div class="mismatch-list">
        <div class="title">❌ 失败差异</div>
        ${mismatches.slice(0, 10).map(m => `<div class="mismatch-item">${m}</div>`).join('')}
        ${mismatches.length > 10 ? `<div class="mismatch-item">... 还有 ${mismatches.length - 10} 项差异</div>` : ''}
      </div>`;
    }
    
    // 添加全部差异总结（左右两列，包含可接受和失败的差异）
    if (mismatches.length > 0 || acceptableDifferences.length > 0) {
      detailHtml += `<div class="all-differences-summary">
        <div class="title">📊 全部差异总结</div>
        <div class="difference-summary">
          <div class="difference-summary-column">
            <div class="title">API</div>
            ${acceptableDifferences.map(diff => `
              <div class="difference-summary-item">
                <span class="field">✅ ${diff.fieldName}:</span>
                <span class="value">${diff.apiValue}</span>
              </div>
            `).join('')}
            ${Array.isArray(mismatches) ? mismatches.map(m => {
              if (typeof m === 'string') {
                const match = m.match(/(.+?): API=(.+?)(?: SPA=.+)?$/);
                if (match) {
                  return `<div class="difference-summary-item">
                    <span class="field">❌ ${match[1]}:</span>
                    <span class="value">${match[2]}</span>
                  </div>`;
                }
                return '';
              } else if (m && m.apiValue !== undefined) {
                return `<div class="difference-summary-item">
                  <span class="field">❌ ${m.fieldName || '差异'}:</span>
                  <span class="value">${m.apiValue}</span>
                </div>`;
              }
              return '';
            }).join('') : ''}
          </div>
          <div class="difference-summary-column">
            <div class="title">SPA</div>
            ${acceptableDifferences.map(diff => `
              <div class="difference-summary-item">
                <span class="field">✅ ${diff.fieldName}:</span>
                <span class="value">${diff.spaValue}</span>
              </div>
            `).join('')}
            ${Array.isArray(mismatches) ? mismatches.map(m => {
              if (typeof m === 'string') {
                const match = m.match(/.+? SPA=(.+)$/);
                if (match) {
                  return `<div class="difference-summary-item">
                    <span class="field">❌ 值:</span>
                    <span class="value">${match[1]}</span>
                  </div>`;
                }
                return '';
              } else if (m && m.spaValue !== undefined) {
                return `<div class="difference-summary-item">
                  <span class="field">❌ 值:</span>
                  <span class="value">${m.spaValue}</span>
                </div>`;
              }
              return '';
            }).join('') : ''}
          </div>
        </div>
      </div>`;
    }

    const sectionId = `data-${idx}`;
    detailHtml += `
      <div class="data-toggle" onclick="toggleData('${sectionId}')">📄 查看原始数据 (API + SPA)</div>
      <div id="${sectionId}" class="data-section-split">
        <div class="data-column">
          <div class="data-title">🔹 API 返回数据</div>
          <div class="data-content">${JSON.stringify(r.apiRawData || {}, null, 2)}</div>
        </div>
        <div class="data-column">
          <div class="data-title">🔸 SPA 返回数据</div>
          <div class="data-content">${JSON.stringify(r.spaRawData || {}, null, 2)}</div>
        </div>
      </div>`;

    html += `
      <tr class="test-row" data-status="${status}">
        <td>${idx + 1}</td>
        <td>${tc.year}年${tc.month}月${tc.day}日 ${tc.hour}:00 ${tc.gender} (${tc.age}岁)</td>
        <td>${typeLabel}</td>
        <td class="status-${status}">${r.status === 'passed' ? '✅ 通过' : '❌ 失败'}</td>
        <td>${mismatches.length}</td>
        <td>${detailHtml}</td>
      </tr>`;
  });

  html += `
      </tbody>
    </table>

    <div class="footer">
      <p>测试用例总数: ${total} | 通过: ${passed} | 失败: ${failed} | 通过率: ${passRate}%</p>
      <p>报告生成时间: ${now.toISOString()}</p>
    </div>
  </div>
  <script>
    function toggleData(id) {
      const section = document.getElementById(id);
      section.classList.toggle('show');
    }
    
    function toggleDetail(id) {
      const detail = document.getElementById(id);
      const header = detail.previousElementSibling;
      if (detail.classList.contains('collapsed')) {
        detail.classList.remove('collapsed');
        detail.classList.add('expanded');
        header.querySelector('.toggle-icon').textContent = '▼';
      } else {
        detail.classList.remove('expanded');
        detail.classList.add('collapsed');
        header.querySelector('.toggle-icon').textContent = '▶';
      }
    }
    
    function filterResults(filter) {
      // 更新摘要项的激活状态
      document.querySelectorAll('.stat-box').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.filter === filter) {
          item.classList.add('active');
        }
      });
      
      // 筛选测试用例
      document.querySelectorAll('.test-row').forEach(testRow => {
        if (filter === 'all') {
          testRow.classList.remove('hidden');
        } else if (filter === 'passed') {
          if (testRow.dataset.status === 'pass') {
            testRow.classList.remove('hidden');
          } else {
            testRow.classList.add('hidden');
          }
        } else if (filter === 'failed') {
          if (testRow.dataset.status === 'fail') {
            testRow.classList.remove('hidden');
          } else {
            testRow.classList.add('hidden');
          }
        }
      });
    }
  </script>
</body>
</html>`;

  return html;
}

module.exports = {
  generateHTMLReport
};
