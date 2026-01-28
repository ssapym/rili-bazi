/**
 * 五行能量计算服务
 * 
 * 完全照抄SPA端bazi.js的updateWuXingEnergy函数
 * V3.0 Professional Five Element Energy Calculation
 */

const {
  STEM_ELEMENT_MAP,
  BRANCH_ELEMENT_MAP,
  WUXING_META,
  SEASONAL_ADJUSTMENT,
  HIDDEN_STEM_RATIOS,
  STEM_COMBINATIONS,
  TRIPLE_COMBOS,
  DIRECTIONAL_COMBOS,
  TRANSFORMATION_THRESHOLDS,
  VOID_BRANCHES,
  BRANCH_RELATIONS,
  RELATION_EFFECT
} = require('./baziConstants');

class WuxingEnergyCalculator {
  constructor() {
    this.scores = {};
    this.scoreLogs = {};
    this.contributions = {};
  }

  getWuXingElement(stem) {
    return STEM_ELEMENT_MAP[stem] || BRANCH_ELEMENT_MAP[stem];
  }

  recordLog(element, value, reason, type) {
    if (!element || !this.scoreLogs[element]) return;
    this.scoreLogs[element].push({
      value,
      reason,
      type: type || 'add'
    });
  }

  applyOtherBranchRelations(scores, branches, combinedBranches) {
    const types = ['harm', 'punish', 'break'];

    for (let t = 0; t < types.length; t++) {
      const type = types[t];
      const pairs = BRANCH_RELATIONS[type];
      if (!pairs) continue;

      for (let p = 0; p < pairs.length; p++) {
        const pair = pairs[p];
        const idx1 = branches.indexOf(pair[0]);
        const idx2 = branches.indexOf(pair[1]);

        if (idx1 >= 0 && idx2 >= 0 &&
            combinedBranches.indexOf(idx1) < 0 &&
            combinedBranches.indexOf(idx2) < 0) {

          const elem1 = this.getWuXingElement(pair[0]);
          const elem2 = this.getWuXingElement(pair[1]);

          if (elem1 && elem2) {
            const effect = RELATION_EFFECT[type] || 0;
            scores[elem1] += scores[elem1] * effect;
            scores[elem2] += scores[elem2] * effect;
          }
        }
      }
    }
  }

  getWuXingLevel(score, avg) {
    if (!avg) {
      return '平衡';
    }
    const ratio = score / avg;
    if (ratio >= 1.6) {
      return '极旺';
    }
    if (ratio >= 1.25) {
      return '偏旺';
    }
    if (ratio <= 0.55) {
      return '衰弱';
    }
    if (ratio <= 0.8) {
      return '偏弱';
    }
    return '平衡';
  }

  calculate(pillars) {
    const pillarList = [
      { key: 'year', data: pillars.year },
      { key: 'month', data: pillars.month },
      { key: 'day', data: pillars.day },
      { key: 'hour', data: pillars.hour }
    ];

    const scores = {};
    const scoreLogs = {};
    const contributions = {}; // V3.3: 追踪每个藏干的贡献
    
    WUXING_META.order.forEach(key => {
      scores[key] = 0;
      scoreLogs[key] = [];
    });

    const recordLog = (element, value, reason, type) => {
      if (!element || !scoreLogs[element]) return;
      scoreLogs[element].push({
        value,
        reason,
        type: type || 'add' // 'add', 'mult', 'set'
      });
    };

    // V3.3: 全局保底 - 确保能量不为负
    const ensureNonNegative = (stepName) => {
      WUXING_META.order.forEach(element => {
        if (scores[element] < 0) {
          console.warn(`⚠️ [${stepName}] ${element}能量为负(${scores[element].toFixed(2)})，已归零`);
          scores[element] = 0;
        }
      });
    };

    const pillarNames = ['年', '月', '日', '时'];

    // ========================================
    // V3.0 FIVE ELEMENT ENERGY CALCULATION
    // ========================================

    // === STEP 1: Static Initialization ===
    // Base Units: Stem = 10 BU, Branch = 20 BU (Month Branch = 40 BU)
    // Branch energy distributed to hidden stems by HIDDEN_STEM_RATIOS

    for (let i = 0; i < pillarList.length; i++) {
      const pillar = pillarList[i];
      const isMonthPillar = (pillar.key === 'month');
      const pillarName = (pillar.key === 'year' ? '年' : pillar.key === 'month' ? '月' : pillar.key === 'day' ? '日' : '时');

      // 1. Heavenly Stems: 10 BU each
      const stemElement = this.getWuXingElement(pillar.data.heavenStem);
      if (stemElement) {
        scores[stemElement] += 10;
        recordLog(stemElement, 10, `${pillarName}干${pillar.data.heavenStem}`, 'add');
      }

      // 2. Earthly Branches: Distribute by HIDDEN_STEM_RATIOS
      const branch = pillar.data.earthBranch;
      const branchTotalBU = isMonthPillar ? 40 : 20; // Month branch gets 2× weight // 藏干能量 (分配地支总能量)
      const hides = pillar.data.hideHeavenStems || [];
      const ratios = HIDDEN_STEM_RATIOS[branch] || [1.0];
      for (let h = 0; h < hides.length && h < ratios.length; h++) {
        const hide = hides[h];
        const hideElement = this.getWuXingElement(hide.name);
        if (hideElement) {
          const hideScore = branchTotalBU * ratios[h];
          scores[hideElement] += hideScore;
          const qiType = (h === 0) ? '本气' : (h === 1) ? '中气' : '余气';
          let label = `${pillarName}支(${branch})${qiType}${hide.name}`;
          if (isMonthPillar && h === 0) label += '【月令】';
          recordLog(hideElement, hideScore, label, 'add');

          // V3.3: 追踪每个藏干的贡献（用于后续精确调整）
          if (!contributions[hideElement]) contributions[hideElement] = [];
          contributions[hideElement].push({
            pillarIndex: i,
            branch,
            stemName: hide.name,
            qiLevel: h, // 0=本气, 1=中气, 2=余气
            baseContribution: hideScore,
            coefficient: 1.0 // 初始系数为1.0
          });
        }
      }
    }

    // ========================================
    // PROFESSIONAL ENERGY CALCULATION SEQUENCE
    // ========================================

    const monthBranch = pillarList[1].data.earthBranch;
    const branches = pillarList.map(item => item.data.earthBranch);
    const stems = pillarList.map(p => p.data.heavenStem);

    // Track which branches/stems have been combined (to exclude from clash)
    const combinedBranches = [];
    const combinedStems = [];

    // === STEP 2: Void (空亡) - Process First ===
    // Void affects all hidden stems, but combo participation can offset it later
    const daySixty = pillarList[2].data.heavenStem + pillarList[2].data.earthBranch;
    const voidBranches = VOID_BRANCHES[daySixty] || [];
    const voidReduction = {}; // Track void reductions for later offset

    for (let i = 0; i < pillarList.length; i++) {
      const branch = pillarList[i].data.earthBranch;
      if (voidBranches.indexOf(branch) >= 0) {
        // Reduce main qi - 使用系数法避免负数
        const branchElement = this.getWuXingElement(branch);
        if (branchElement) {
          const oldScore = scores[branchElement];
          scores[branchElement] *= 0.5;
          voidReduction[branch] = oldScore - scores[branchElement];
          recordLog(branchElement, 0.5, `空亡(${branch})削减`, 'mult');
        }

        // Also reduce hidden stems
        const hides = pillarList[i].data.hideHeavenStems || [];
        for (let h = 1; h < hides.length; h++) {
          const hideElement = this.getWuXingElement(hides[h].name);
          if (hideElement) {
            scores[hideElement] *= 0.5;
            recordLog(hideElement, 0.5, `空亡(${branch})藏干削减`, 'mult');
          }
        }
      }
    }
    ensureNonNegative('Step 2: Void');

    // === STEP 3: Seasonal Weighting (提纲加权) ===
    // Apply Wang/Xiang/Xiu/Qiu/Si multipliers based on month command
    const seasonalFactors = SEASONAL_ADJUSTMENT[monthBranch];
    if (seasonalFactors) {
      WUXING_META.order.forEach(element => {
        const factor = seasonalFactors[element] || 1.0;
        if (factor !== 1.0) {
          scores[element] *= factor;
          const seasonName = (factor === 1.5) ? '旺' : (factor === 1.2) ? '相' : (factor === 0.9) ? '休' : (factor === 0.7) ? '囚' : '死';
          recordLog(element, factor, `月令${seasonName}`, 'mult');
        }
      });
    }

    // === STEP 4A: Directional Combinations (三会局/方局) - HIGHEST PRIORITY ===
    for (let i = 0; i < stems.length - 1; i++) {
      if (combinedStems.indexOf(i) >= 0) continue;

      for (let j = i + 1; j < stems.length; j++) {
        if (combinedStems.indexOf(j) >= 0) continue;

        const combo = stems[i] + stems[j];
        const reverseCombo = stems[j] + stems[i];
        const transformedElement = STEM_COMBINATIONS[combo] || STEM_COMBINATIONS[reverseCombo];

        if (transformedElement) {
          // Calculate transformation success rate
          const transformedPower = scores[transformedElement] || 0;
          const stem1Element = this.getWuXingElement(stems[i]);
          const stem2Element = this.getWuXingElement(stems[j]);
          const originalPower = (scores[stem1Element] || 0) + (scores[stem2Element] || 0);

          const successRate = transformedPower / (originalPower + transformedPower + 0.01);

          if (successRate >= TRANSFORMATION_THRESHOLDS.complete) {
            // COMPLETE TRANSFORMATION: 完全合化
            if (stem1Element) {
              const transfer1 = Math.min(10, scores[stem1Element]); // 不超过现有值
              scores[stem1Element] -= transfer1;
              recordLog(stem1Element, -transfer1, `合化(${combo})转出`, 'add');
            }
            if (stem2Element) {
              const transfer2 = Math.min(10, scores[stem2Element]);
              scores[stem2Element] -= transfer2;
              recordLog(stem2Element, -transfer2, `合化(${combo})转出`, 'add');
            }
            scores[transformedElement] += 20;
            recordLog(transformedElement, 20, `合化(${combo})成功`, 'add');
            combinedStems.push(i, j);
          } else if (successRate >= TRANSFORMATION_THRESHOLDS.partial) {
            // PARTIAL TRANSFORMATION: 部分合化
            const transferRatio = (successRate - TRANSFORMATION_THRESHOLDS.partial) /
              (TRANSFORMATION_THRESHOLDS.complete - TRANSFORMATION_THRESHOLDS.partial);
            const transferAmount = 10 * transferRatio;
            if (stem1Element) {
              const transfer1 = Math.min(transferAmount * 0.5, scores[stem1Element]);
              scores[stem1Element] -= transfer1;
              recordLog(stem1Element, -transfer1, `合化(${combo})部分转出`, 'add');
            }
            if (stem2Element) {
              const transfer2 = Math.min(transferAmount * 0.5, scores[stem2Element]);
              scores[stem2Element] -= transfer2;
              recordLog(stem2Element, -transfer2, `合化(${combo})部分转出`, 'add');
            }
            scores[transformedElement] += transferAmount;
            recordLog(transformedElement, transferAmount, `合化(${combo})部分转入`, 'add');
            combinedStems.push(i, j);
          } else {
            // ENTANGLEMENT: 羁绊状态
            if (stem1Element) {
              scores[stem1Element] *= 0.85;
              recordLog(stem1Element, 0.85, `合化(${combo})羁绊`, 'mult');
            }
            if (stem2Element) {
              scores[stem2Element] *= 0.85;
              recordLog(stem2Element, 0.85, `合化(${combo})羁绊`, 'mult');
            }
          }
        }
      }
    }

    for (const element in DIRECTIONAL_COMBOS) {
      const requiredBranches = DIRECTIONAL_COMBOS[element];
      const matchedIndices = [];

      for (let i = 0; i < branches.length; i++) {
        if (requiredBranches.indexOf(branches[i]) >= 0 &&
            combinedBranches.indexOf(i) < 0) {
          matchedIndices.push(i);
        }
      }

      if (matchedIndices.length === 3) {
        // Complete directional combo - strongest transformation
        let totalTransferred = 0;
        const comboName = `三会${WUXING_META.names[element]}局`;

        matchedIndices.forEach(idx => {
          const branch = branches[idx];
          const branchElement = this.getWuXingElement(branch);
          if (branchElement) {
            const branchContribution = Math.min(40, scores[branchElement]); // 不超过现有值
            scores[branchElement] -= branchContribution;
            recordLog(branchElement, -branchContribution, `${comboName}转出`, 'add');
            totalTransferred += branchContribution;
          }
          combinedBranches.push(idx);

          // Offset void if this branch was void
          if (voidReduction[branch]) {
            // Restore 50% of void reduction due to combo participation
            const restore = voidReduction[branch] * 0.5;
            scores[branchElement] += restore;
            recordLog(branchElement, restore, '合局解空亡', 'add');
          }
        });

        scores[element] += totalTransferred;
        recordLog(element, totalTransferred, `${comboName}转入`, 'add');
      }
    }

    // === STEP 4B: Triple Combinations (三合局) ===
    for (const element in TRIPLE_COMBOS) {
      const requiredBranches = TRIPLE_COMBOS[element];
      const matchedIndices = [];

      for (let i = 0; i < branches.length; i++) {
        if (requiredBranches.indexOf(branches[i]) >= 0 &&
            combinedBranches.indexOf(i) < 0) {
          matchedIndices.push(i);
        }
      }

      const comboName = `三合${WUXING_META.names[element]}局`;
      if (matchedIndices.length === 3) {
        // Complete Triple Combo
        let totalTransferred = 0;
        matchedIndices.forEach(idx => {
          const branch = branches[idx];
          const branchElement = this.getWuXingElement(branch);
          if (branchElement) {
            const branchContribution = Math.min(40, scores[branchElement]); // 不超过现有值
            scores[branchElement] -= branchContribution;
            recordLog(branchElement, -branchContribution, `${comboName}转出`, 'add');
            totalTransferred += branchContribution;
          }
          combinedBranches.push(idx);

          // Offset void
          if (voidReduction[branch]) {
            const restore = voidReduction[branch] * 0.5;
            scores[branchElement] += restore;
            recordLog(branchElement, restore, '合局解空亡', 'add');
          }
        });

        scores[element] += totalTransferred;
        recordLog(element, totalTransferred, `${comboName}转入`, 'add');

      } else if (matchedIndices.length === 2) {
        // Half Combo (Semi-Triple)
        // Check if center branch (Emperor) is present
        // Wood: Mao, Fire: Wu, Metal: You, Water: Zi
        const centerBranch = requiredBranches[1];
        let hasCenter = false;
        matchedIndices.forEach(idx => {
          if (branches[idx] === centerBranch) hasCenter = true;
        });

        if (hasCenter) {
          // Valid Half Combo
          scores[element] += 20;
          recordLog(element, 20, `半合${WUXING_META.names[element]}局`, 'add');
          matchedIndices.forEach(idx => {
            combinedBranches.push(idx);
          });
        }
      }
    }
    ensureNonNegative('Step 4: Branch Combos');

    // === STEP 4: Strong Branch Interactions (地支强局) ===
    // 4A: Directional Combos (三会局) - Multiply by 2.0
    // 4B: Triple Combos (三合局) - Multiply by 1.8 if successful
    // 4C: Half Combos (半合局) - Multiply by 1.3

    // STEP 4A: Directional Combinations (三会局/方局)

    // === STEP 6: Stem Combinations (天干合化) ===
    // Process stem mergers/transformations
    for (let i = 0; i < stems.length - 1; i++) {
      if (combinedStems.indexOf(i) >= 0) continue;

      for (let j = i + 1; j < stems.length; j++) {
        if (combinedStems.indexOf(j) >= 0) continue;

        const combo = stems[i] + stems[j];
        const reverseCombo = stems[j] + stems[i];
        const transformedElement = STEM_COMBINATIONS[combo] || STEM_COMBINATIONS[reverseCombo];

        if (transformedElement) {
          // Simplified V3.0: If month supports (de ling), transform fully
          const seasonalFactors = SEASONAL_ADJUSTMENT[monthBranch] || {};
          const transformedSupport = seasonalFactors[transformedElement] || 1.0;

          const stem1Element = this.getWuXingElement(stems[i]);
          const stem2Element = this.getWuXingElement(stems[j]);

          if (transformedSupport >= 1.5) {
            // Month supports transformation: Complete merge
            if (stem1Element) {
              const transfer1 = Math.min(10, scores[stem1Element]); // 不超过现有值
              scores[stem1Element] -= transfer1;
              recordLog(stem1Element, -transfer1, `合化(${combo})转出`, 'add');
            }
            if (stem2Element) {
              const transfer2 = Math.min(10, scores[stem2Element]);
              scores[stem2Element] -= transfer2;
              recordLog(stem2Element, -transfer2, `合化(${combo})转出`, 'add');
            }
            scores[transformedElement] += 20 * 1.5; // ×1.5 for successful combo
            recordLog(transformedElement, 30, `合化(${combo})成功`, 'add');
            combinedStems.push(i, j);
          } else {
            // Month doesn't support: Entanglement (合而不化)
            if (stem1Element) {
              scores[stem1Element] *= 0.8;
              recordLog(stem1Element, 0.8, `合而不化(${combo})羁绊`, 'mult');
            }
            if (stem2Element) {
              scores[stem2Element] *= 0.8;
              recordLog(stem2Element, 0.8, `合而不化(${combo})羁绊`, 'mult');
            }
          }
        }
      }
    }
    ensureNonNegative('Step 6: Stem Combinations');

    // === STEP 7: Rooting Factor (通根透干系数) ===
    // V3.1: Apply coefficient based on root strength
    // Strong Root (Main Qi): ×1.2
    // Medium Root (Middle Qi): ×1.0 (no change)
    // Weak Root (Residual Qi): ×0.8
    // No Root (Floating): ×0.1 (视为假神，忽略不计)

    for (let i = 0; i < stems.length; i++) {
      // Skip if stem was transformed (involved in combination)
      if (combinedStems.indexOf(i) >= 0) continue;

      const stem = stems[i];
      const stemElement = this.getWuXingElement(stem);
      if (!stemElement) continue;

      let strongestRoot = 'none'; // none, weak, medium, strong
      let rootBranches = [];

      // Scan all branches for roots
      for (let b = 0; b < branches.length; b++) {
        const branch = branches[b];
        // Void branches cannot provide roots
        if (voidReduction[branch]) continue;

        const hides = pillarList[b].data.hideHeavenStems || [];
        for (let h = 0; h < hides.length; h++) {
          const hideElement = this.getWuXingElement(hides[h].name);

          if (hideElement === stemElement) {
            // Found a root - determine strength
            if (h === 0) {
              // Main Qi - Strong Root
              if (strongestRoot !== 'strong') {
                strongestRoot = 'strong';
                rootBranches = [branch];
              } else {
                rootBranches.push(branch);
              }
            } else if (h === 1 && strongestRoot !== 'strong') {
              // Middle Qi - Medium Root (only if no strong root)
              if (strongestRoot !== 'medium') {
                strongestRoot = 'medium';
                rootBranches = [branch];
              } else {
                rootBranches.push(branch);
              }
            } else if (h === 2 && strongestRoot === 'none') {
              // Residual Qi - Weak Root (only if no better root)
              strongestRoot = 'weak';
              rootBranches.push(branch);
            }
          }
        }
      }

      // Apply coefficient based on strongest root
      let coefficient = 1.0;
      let desc = '';
      if (strongestRoot === 'strong') {
        coefficient = 1.2;
        desc = `强根(${rootBranches.join('、')})`;
      } else if (strongestRoot === 'medium') {
        coefficient = 1.0;
        desc = `中根(${rootBranches.join('、')})`;
      } else if (strongestRoot === 'weak') {
        coefficient = 0.8;
        desc = `弱根(${rootBranches.join('、')})`;
      } else {
        coefficient = 0.1;  // V3.1: 0.4 → 0.1 (假神)
        desc = '无根虚浮';
      }

      if (coefficient !== 1.0) {
        scores[stemElement] *= coefficient;
        recordLog(stemElement, coefficient, `天干${stem}${desc}`, 'mult');
      }
    }

    // === STEP 5: Clash & Penalties (六冲) ===
    const clashPairs = BRANCH_RELATIONS.clash;
    for (let c = 0; c < clashPairs.length; c++) {
      const pair = clashPairs[c];
      const idx1 = branches.indexOf(pair[0]);
      const idx2 = branches.indexOf(pair[1]);

      // Only process if both exist and neither is combined
      if (idx1 >= 0 && idx2 >= 0 &&
          combinedBranches.indexOf(idx1) < 0 &&
          combinedBranches.indexOf(idx2) < 0) {

        const elem1 = this.getWuXingElement(pair[0]);
        const elem2 = this.getWuXingElement(pair[1]);

        // V3.0 Special Rule: Earth-Earth Clash (土土相冲)
        const isEarthEarthClash = (elem1 === 'earth' && elem2 === 'earth');
        const earthClashPairs = [['辰', '戌'], ['丑', '未']];
        const isEarthPair = earthClashPairs.some(ep => {
          return (ep[0] === pair[0] && ep[1] === pair[1]) || (ep[0] === pair[1] && ep[1] === pair[0]);
        });

        if (isEarthEarthClash && isEarthPair) {
          // V3.3: 纯系数法 - 通过contributions追踪精确调整

          [idx1, idx2].forEach(pillarIdx => {
            const branch = branches[pillarIdx];

            // 遍历所有元素的贡献记录
            WUXING_META.order.forEach(element => {
              if (!contributions[element]) return;

              // 找到来自这个地支的藏干
              contributions[element].forEach(contrib => {
                if (contrib.pillarIndex !== pillarIdx || contrib.branch !== branch) return;

                // 计算旧贡献
                const oldContrib = contrib.baseContribution * contrib.coefficient;

                // 确定新系数
                let newCoeff = contrib.coefficient;
                let reason = '';

                if (contrib.qiLevel === 0 && element === 'earth') {
                  // 本气土：×1.4（冲旺）
                  newCoeff = contrib.coefficient * 1.4;
                  reason = `土冲(${pair[0]}${pair[1]})${branch}本气旺×1.4`;
                } else if (contrib.qiLevel > 0) {
                  // 杂气：×0.1（灭，保留10%残气）
                  newCoeff = contrib.coefficient * 0.1;
                  const qiName = (contrib.qiLevel === 1) ? '中气' : '余气';
                  reason = `土冲(${pair[0]}${pair[1]})${branch}${qiName}灭×0.1`;
                } else {
                  return; // 不是土冲影响的藏干
                }

                // 计算新贡献
                const newContrib = contrib.baseContribution * newCoeff;

                // 更新总分：先减旧的，再加新的
                scores[element] = scores[element] - oldContrib + newContrib;

                // 更新系数
                contrib.coefficient = newCoeff;

                // 记录日志（记录系数倍数）
                const multiplier = (contrib.qiLevel === 0 && element === 'earth') ? 1.4 : 0.1;
                recordLog(element, multiplier, reason, 'mult');
              });
            });
          });
        } else {
          // 普通相冲：金木、水火
          const score1 = scores[elem1];
          const score2 = scores[elem2];

          if (Math.abs(score1 - score2) < 10) {
            // Evenly matched: both ×0.75
            scores[elem1] *= 0.75;
            scores[elem2] *= 0.75;
            recordLog(elem1, 0.75, `相冲(${pair[0]}${pair[1]})`, 'mult');
            recordLog(elem2, 0.75, `相冲(${pair[0]}${pair[1]})`, 'mult');
          } else if (score1 > score2) {
            // Winner ×0.9, Loser ×0.6
            scores[elem1] *= 0.9;
            scores[elem2] *= 0.6;
            recordLog(elem1, 0.9, `相冲(${pair[0]}${pair[1]})胜`, 'mult');
            recordLog(elem2, 0.6, `相冲(${pair[0]}${pair[1]})败`, 'mult');
          } else {
            scores[elem1] *= 0.6;
            scores[elem2] *= 0.9;
            recordLog(elem1, 0.6, `相冲(${pair[0]}${pair[1]})败`, 'mult');
            recordLog(elem2, 0.9, `相冲(${pair[0]}${pair[1]})胜`, 'mult');
          }
        }
      }
    }

    // Apply other relationships (harm, punish, break) to uncombined branches
    this.applyOtherBranchRelations(scores, branches, combinedBranches);
    ensureNonNegative('Step 5: Clash & Relations');

    // === V3.1: Step 8 removed - 不做生克迭代 ===
    // 原因：生克迭代会平滑化强弱悬殊，掩盖真实的"病药"格局
    // 我们要保留原始的静态能量分布，不希望被"平均化"
    // 这样才能清晰看到谁强谁弱，哪里是病，哪里是药

    // Calculate total and prepare final results
    let totalScore = 0;
    WUXING_META.order.forEach(key => {
      totalScore += scores[key];
    });
    if (!totalScore) {
      return {
        elements: [],
        totalScore: 0,
        balance: 0
      };
    }
    const avg = totalScore / WUXING_META.order.length;
    const elements = WUXING_META.order.map(key => {
      const score = scores[key];
      const percentage = score / totalScore * 100;
      const level = this.getWuXingLevel(score, avg);
      const derivations = scoreLogs[key] ? scoreLogs[key].slice(0, 6) : [];
      return {
        id: key,
        name: WUXING_META.names[key],
        score: score,
        percentage: percentage,
        level: level,
        logs: derivations
      };
    }).sort((a, b) => b.score - a.score);
    const variance = elements.reduce((sum, item) => {
      return sum + Math.pow(item.score - avg, 2);
    }, 0) / elements.length;
    const balanceIndex = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / (avg || 1)) * 50));

    return {
      elements,
      totalScore,
      balance: balanceIndex
    };
  }

  calculateWuxingCount(pillars, buquan) {
    const count = {
      'wood': 0,
      'fire': 0,
      'earth': 0,
      'metal': 0,
      'water': 0
    };

    const pillarList = [
      pillars.year, pillars.month, pillars.day, pillars.hour
    ];

    for (const pillar of pillarList) {
      const stemElement = this.getWuXingElement(pillar.heavenStem);
      const branchElement = this.getWuXingElement(pillar.earthBranch);
      if (stemElement) count[stemElement]++;
      if (branchElement) count[branchElement]++;
    }

    for (const pillar of pillarList) {
      const hides = pillar.hideHeavenStems || [];
      for (const hide of hides) {
        const hideElement = this.getWuXingElement(hide.name);
        if (hideElement) count[hideElement]++;
      }
    }

    if (buquan && buquan.derivedBranches) {
      for (const branch of buquan.derivedBranches) {
        const branchElement = this.getWuXingElement(branch);
        if (branchElement) count[branchElement]++;
      }
    }

    if (buquan && buquan.andai) {
      for (const andai of buquan.andai) {
        const stemElement = this.getWuXingElement(andai.derivedStem);
        const branchElement = this.getWuXingElement(andai.derivedBranch);
        if (stemElement) count[stemElement]++;
        if (branchElement) count[branchElement]++;
      }
    }

    const missing = [];
    for (const element of ['wood', 'fire', 'earth', 'metal', 'water']) {
      if (count[element] === 0) {
        missing.push(WUXING_META.names[element]);
      }
    }

    return {
      count,
      missing,
      isComplete: missing.length === 0
    };
  }
}

module.exports = WuxingEnergyCalculator;
