/**
 * 八字排盘主服务 - 完整版
 * 
 * 使用 tyme4ts 库进行八字计算
 * 输出完整JSON结构，包含SPA所有功能
 */

const SolarDay = require('tyme4ts').SolarDay;
const SolarTime = require('tyme4ts').SolarTime;
const ChildLimit = require('tyme4ts').ChildLimit;
const Gender = require('tyme4ts').Gender;
const SixtyCycle = require('tyme4ts').SixtyCycle;
const LunarDay = require('tyme4ts').LunarDay;

const WuxingEnergyCalculator = require('./wuxingEnergy');
const { calculateShenSha } = require('./shenshaService');
const { calculateRelationships } = require('./relationshipService');
const { calculateBuQuan } = require('./buquanService');
const { QIONG_TONG_ADVICE, ZI_PING_PATTERNS, WUXING_SUPPORT, WUXING_CONTROL, WUXING_CHILD, WUXING_OFFICER, WUXING_CONTROLLED, STEM_ELEMENT_MAP } = require('./baziConstants');

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const TEN_STARS = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];

const ELEMENT_MAP = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水'
};

function fpart(x) {
  x = x - Math.floor(x);
  if (x < 0) x = x + 1;
  return x;
}

function ipart(x) {
  if (x == 0) return 0;
  return (x / Math.abs(x)) * Math.floor(Math.abs(x));
}

const Astro = {
  sn: function (x) { return Math.sin(x * 1.74532925199433E-02); },
  cn: function (x) { return Math.cos(x * 1.74532925199433E-02); },
  fpart: fpart,
  ipart: ipart,
  sun: function (t) {
    const p2 = 2 * Math.PI;
    const COSEPS = 0.91748;
    const SINEPS = 0.39778;
    const m = p2 * this.fpart(0.993133 + 99.997361 * t);
    const dL = 6893 * Math.sin(m) + 72 * Math.sin(2 * m);
    const L = p2 * this.fpart(0.7859453 + m / p2 + (6191.2 * t + dL) / 1296000);
    const sl = Math.sin(L);
    const x = Math.cos(L);
    const y = COSEPS * sl;
    const Z = SINEPS * sl;
    const rho = Math.sqrt(1 - Z * Z);
    const dec = (360 / p2) * Math.atan(Z / rho);
    let ra = (48 / p2) * Math.atan(y / (x + rho));
    if (ra < 0) ra = ra + 24;
    return [ra, dec];
  },
  getEOT: function (date) {
    let year = date.getUTCFullYear();
    let month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const min = date.getUTCMinutes();
    const sec = date.getUTCSeconds();

    if (month <= 2) { year -= 1; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    let jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    jd += (hour + min / 60 + sec / 3600) / 24;

    const instant = jd - 2400001;
    const t = (instant - 51544.5) / 36525;

    const sunPos = Astro.sun(t);
    const ra = sunPos[0];

    const L0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
    let L0_normalized = L0 % 360;
    if (L0_normalized < 0) L0_normalized += 360;
    const meanSun = L0_normalized / 15.0;

    let eotHours = meanSun - ra;
    while (eotHours > 12) eotHours -= 24;
    while (eotHours < -12) eotHours += 24;

    return eotHours * 60;
  }
};

function calculateTrueSolarTime(date, lng) {
  const eotMinutes = Astro.getEOT(date);
  const lngOffsetMinutes = (lng - 120) * 4;
  const totalOffsetMinutes = lngOffsetMinutes + eotMinutes;
  return new Date(date.getTime() + totalOffsetMinutes * 60 * 1000);
}

const STEM_COMBINATIONS = {
  '甲己': '土', '乙庚': '金', '丙辛': '水', '丁壬': '木', '戊癸': '火'
};

const TRIPLE_COMBOS = {
  wood: ['亥', '卯', '未'],
  fire: ['寅', '午', '戌'],
  metal: ['巳', '酉', '丑'],
  water: ['申', '子', '辰']
};

class BaziService {
  constructor() {
    this.energyCalculator = new WuxingEnergyCalculator();
  }

  calculateFromSolar(params) {
    const {
      year, month, day,
      hour = 0, minute = 0, second = 0,
      gender = 1,
      useTrueSolar = false,
      longitude = 120
    } = params;

    try {
      let solarTime;
      let trueSolarInfo = null;

      if (useTrueSolar && longitude) {
        const inputDate = new Date(year, month - 1, day, hour, minute, second || 0);
        const trueSolarDate = calculateTrueSolarTime(inputDate, longitude);
        const adjustedYear = trueSolarDate.getFullYear();
        const adjustedMonth = trueSolarDate.getMonth() + 1;
        const adjustedDay = trueSolarDate.getDate();
        const adjustedHour = trueSolarDate.getHours();
        const adjustedMinute = trueSolarDate.getMinutes();
        const adjustedSecond = trueSolarDate.getSeconds();

        solarTime = SolarTime.fromYmdHms(adjustedYear, adjustedMonth, adjustedDay, adjustedHour, adjustedMinute, adjustedSecond);
        trueSolarInfo = {
          inputHour: hour,
          inputMinute: minute,
          longitude: longitude,
          adjustedHour: adjustedHour,
          adjustedMinute: adjustedMinute,
          adjustedYear: adjustedYear,
          adjustedMonth: adjustedMonth,
          adjustedDay: adjustedDay
        };
      } else {
        solarTime = SolarTime.fromYmdHms(year, month, day, hour, minute, second);
      }

      const tymeGender = gender === 1 ? Gender.MAN : Gender.WOMAN;
      const childLimit = ChildLimit.fromSolarTime(solarTime, tymeGender);
      const eightChar = childLimit.getEightChar();

      const pillars = this.buildPillars(eightChar);
      const isMan = gender === 1;
      const dayStem = pillars.day.heavenStem;
      const dayBranch = pillars.day.earthBranch;

      const wuxingEnergy = this.energyCalculator.calculate(pillars);
      const tenStarEnergy = this.calculateTenStarEnergy(pillars);
      const analysis = this.analyzePattern(pillars, wuxingEnergy, isMan);
      const relationships = calculateRelationships(pillars);
      const shensha = calculateShenSha(pillars, isMan);
      const buquan = calculateBuQuan(pillars);
      const fortune = this.buildFortuneInfo(childLimit, pillars, isMan);

      const result = {
        baseInfo: this.buildJiBenXinXi(SolarDay.fromYmd(year, month, day), pillars, gender, hour, minute),
        sizhu: this.buildSiZhu(pillars, shensha),
        chonghe: relationships,
        buquan: buquan,
        nengliang: {
          wuxing: wuxingEnergy,
          shishen: tenStarEnergy
        },
        geju: analysis,
        dayun: fortune
      };

      if (trueSolarInfo) {
        result.trueSolarInfo = trueSolarInfo;
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'CALCULATION_ERROR'
        }
      };
    }
  }

  calculateFromLunar(params) {
    const {
      lunarYear, lunarMonth, lunarDay,
      hour = 0, minute = 0,
      gender = 1,
      isLeap = false
    } = params;

    try {
      const lunar = LunarDay.fromYmd(lunarYear, lunarMonth, lunarDay);
      const solarDay = lunar.getSolarDay();

      return this.calculateFromSolar({
        year: solarDay.getYear(),
        month: solarDay.getMonth(),
        day: solarDay.getDay(),
        hour,
        minute,
        gender
      });
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'CONVERSION_ERROR'
        }
      };
    }
  }

  calculateFromTrueSolar(params) {
    const {
      year, month, day,
      hour = 0, minute = 0,
      longitude = 120,
      gender = 1
    } = params;

    try {
      const inputDate = new Date(year, month - 1, day, hour, minute, 0);
      const trueSolarDate = calculateTrueSolarTime(inputDate, longitude);
      const adjustedYear = trueSolarDate.getFullYear();
      const adjustedMonth = trueSolarDate.getMonth() + 1;
      const adjustedDay = trueSolarDate.getDate();
      const adjustedHour = trueSolarDate.getHours();
      const adjustedMinute = trueSolarDate.getMinutes();
      const adjustedSecond = trueSolarDate.getSeconds();

      const solarTime = SolarTime.fromYmdHms(adjustedYear, adjustedMonth, adjustedDay, adjustedHour, adjustedMinute, adjustedSecond);
      const tymeGender = gender === 1 ? Gender.MAN : Gender.WOMAN;
      const childLimit = ChildLimit.fromSolarTime(solarTime, tymeGender);
      const eightChar = childLimit.getEightChar();

      const pillars = this.buildPillars(eightChar);
      const isMan = gender === 1;
      const dayStem = pillars.day.heavenStem;
      const dayBranch = pillars.day.earthBranch;

      const wuxingEnergy = this.energyCalculator.calculate(pillars);
      const tenStarEnergy = this.calculateTenStarEnergy(pillars);
      const analysis = this.analyzePattern(pillars, wuxingEnergy, isMan);
      const relationships = calculateRelationships(pillars);
      const shensha = calculateShenSha(pillars, isMan);
      const fortune = this.buildFortuneInfo(childLimit, pillars, isMan);

      const result = {
        baseInfo: this.buildJiBenXinXi(SolarDay.fromYmd(year, month, day), pillars, gender, hour, minute),
        sizhu: this.buildSiZhu(pillars, shensha),
        chonghe: relationships,
        nengliang: {
          wuxing: wuxingEnergy,
          shishen: tenStarEnergy
        },
        geju: analysis,
        dayun: fortune,
        trueSolarInfo: {
          inputHour: hour,
          inputMinute: minute,
          longitude: longitude,
          adjustedHour: adjustedHour,
          adjustedMinute: adjustedMinute
        }
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'CALCULATION_ERROR'
        }
      };
    }
  }

  buildJiBenXinXi(solarDay, pillars, gender, hour, minute) {
    const lunarDay = solarDay.getLunarDay();
    const lunarMonth = lunarDay.getLunarMonth();
    const lunarYear = lunarMonth.getLunarYear();

    const year = solarDay.getYear();
    const month = solarDay.getMonth();
    const day = solarDay.getDay();

    const solarDateStr = `${year}年${month}月${day}日 ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const lunarMonthName = lunarMonth.getName();
    const lunarDateStr = `${lunarYear.getSixtyCycle().getName()}${lunarMonthName}${lunarDay.getName()}${pillars.hour.heavenStem}${pillars.hour.earthBranch}时`;

    const dayStem = pillars.day.heavenStem;
    const dayBranch = pillars.day.earthBranch;

    const age = this.calculateAge(solarDay, pillars);

    return {
      solarBirthday: solarDateStr,
      lunarBirthday: lunarDateStr,
      gender: gender === 1 ? '男性' : gender === 2 ? '女性' : '未知',
      chineseZodiac: pillars.year.earthBranch + ' (' + this.getZodiac(pillars.year.earthBranch) + ')',
      zodiac: this.getConstellation(solarDay),
      age: age,
      bazi: `${pillars.year.heavenStem}${pillars.year.earthBranch} ${pillars.month.heavenStem}${pillars.month.earthBranch} ${dayStem}${dayBranch} ${pillars.hour.heavenStem}${pillars.hour.earthBranch}`,
      baziArr: {
        niangan: pillars.year.heavenStem,
        nianzhi: pillars.year.earthBranch,
        yuegan: pillars.month.heavenStem,
        yuezhi: pillars.month.earthBranch,
        rigan: dayStem,
        rizhi: dayBranch,
        shigan: pillars.hour.heavenStem,
        shizhi: pillars.hour.earthBranch
      }
    };
  }

  buildSiZhu(pillars, shensha) {
    return {
      nian: this.buildSinglePillar(pillars.year, shensha.year),
      yue: this.buildSinglePillar(pillars.month, shensha.month),
      ri: this.buildSinglePillar(pillars.day, shensha.day),
      shi: this.buildSinglePillar(pillars.hour, shensha.hour)
    };
  }

  buildSinglePillar(pillar, pillarShensha) {
    return {
      zhuxing: pillar.tenStar?.heavenStem || '',
      tiangan: pillar.heavenStem,
      dizhi: pillar.earthBranch,
      canggan: (pillar.hideHeavenStems || []).map(h => ({
        ming: h.name,
        jibie: h.level,
        shishen: h.tenStar,
        fuxing: h.fuxing
      })),
      xingyun: pillar.terrain,
      zizuo: pillar.terrainSelf,
      kongwang: pillar.extraEarthBranches,
      nayin: pillar.sound,
      shensha: pillarShensha
    };
  }

  calculateTenStarEnergy(pillars) {
    const dayIdx = STEMS.indexOf(pillars.day.heavenStem);
    const tenStarCounts = {};
    const tenStarEnergy = {};

    const allStems = [
      { key: '年', stem: pillars.year.heavenStem },
      { key: '月', stem: pillars.month.heavenStem },
      { key: '日', stem: pillars.day.heavenStem },
      { key: '时', stem: pillars.hour.heavenStem }
    ];

    allStems.forEach(({ key, stem }) => {
      const stemIdx = STEMS.indexOf(stem);
      let diff = (stemIdx - dayIdx + 10) % 10;
      const tenStar = TEN_STARS[diff];
      
      if (key === '日') {
        tenStarCounts['比肩'] = (tenStarCounts['比肩'] || 0) + 1;
      } else {
        tenStarCounts[tenStar] = (tenStarCounts[tenStar] || 0) + 1;
      }
    });

    pillars.day.hideHeavenStems?.forEach(h => {
      const hIdx = STEMS.indexOf(h.name);
      const diff = (hIdx - dayIdx + 10) % 10;
      const tenStar = TEN_STARS[diff];
      tenStarCounts[tenStar] = (tenStarCounts[tenStar] || 0) + 1;
    });

    pillars.month.hideHeavenStems?.forEach(h => {
      const hIdx = STEMS.indexOf(h.name);
      const diff = (hIdx - dayIdx + 10) % 10;
      const tenStar = TEN_STARS[diff];
      tenStarCounts[tenStar] = (tenStarCounts[tenStar] || 0) + 1;
    });

    pillars.year.hideHeavenStems?.forEach(h => {
      const hIdx = STEMS.indexOf(h.name);
      const diff = (hIdx - dayIdx + 10) % 10;
      const tenStar = TEN_STARS[diff];
      tenStarCounts[tenStar] = (tenStarCounts[tenStar] || 0) + 1;
    });

    pillars.hour.hideHeavenStems?.forEach(h => {
      const hIdx = STEMS.indexOf(h.name);
      const diff = (hIdx - dayIdx + 10) % 10;
      const tenStar = TEN_STARS[diff];
      tenStarCounts[tenStar] = (tenStarCounts[tenStar] || 0) + 1;
    });

    const totalCount = Object.values(tenStarCounts).reduce((a, b) => a + b, 0);

    const byCount = Object.entries(tenStarCounts).map(([name, count]) => ({
      ming: name,
      geshu: count,
      baifengbi: parseFloat(((count / totalCount) * 100).toFixed(1))
    })).sort((a, b) => b.geshu - a.geshu);

    const byEnergy = this.calculateTenStarEnergyByType(pillars);

    return {
      zonggeshu: totalCount,
      byCount: byCount,
      byEnergy: byEnergy
    };
  }

  calculateTenStarEnergyByType(pillars) {
    const dayIdx = STEMS.indexOf(pillars.day.heavenStem);
    const energyScores = {};

    const stemWeight = 10;
    const branchWeight = 20;
    const monthBranchWeight = 40;

    const stemEnergy = (stem, isDay) => {
      if (isDay) return { name: '比肩', score: stemWeight };
      const stemIdx = STEMS.indexOf(stem);
      const diff = (stemIdx - dayIdx + 10) % 10;
      return { name: TEN_STARS[diff], score: stemWeight };
    };

    const hideEnergy = (hides, pillarKey) => {
      return hides.map((h, idx) => {
        const hIdx = STEMS.indexOf(h.name);
        const diff = (hIdx - dayIdx + 10) % 10;
        const weight = pillarKey === 'month' ? monthBranchWeight : branchWeight;
        const ratio = [0.6, 0.25, 0.15][idx] || 0.2;
        return { name: TEN_STARS[diff], score: weight * ratio };
      });
    };

    energyScores['比肩'] = (energyScores['比肩'] || 0) + stemWeight;
    energyScores['劫财'] = (energyScores['劫财'] || 0) + stemWeight;

    [pillars.year, pillars.month, pillars.hour].forEach(p => {
      const result = stemEnergy(p.heavenStem, false);
      energyScores[result.name] = (energyScores[result.name] || 0) + result.score;
    });

    [pillars.year, pillars.month, pillars.day, pillars.hour].forEach((p, idx) => {
      const key = ['year', 'month', 'day', 'hour'][idx];
      hideEnergy(p.hideHeavenStems || [], key).forEach(e => {
        energyScores[e.name] = (energyScores[e.name] || 0) + e.score;
      });
    });

    const total = Object.values(energyScores).reduce((a, b) => a + b, 0);

    return Object.entries(energyScores).map(([name, score]) => ({
      ming: name,
      fenshu: parseFloat(score.toFixed(1)),
      baifengbi: parseFloat(((score / total) * 100).toFixed(1))
    })).sort((a, b) => b.fenshu - a.fenshu);
  }

  analyzePattern(pillars, wuxingEnergy, isMan) {
    const dayStem = pillars.day.heavenStem;
    const dayBranch = pillars.day.earthBranch;
    const monthStem = pillars.month.heavenStem;
    const monthBranch = pillars.month.earthBranch;

    const dayElement = ELEMENT_MAP[dayStem];

    const monthHideHeavenStems = (pillars.month.hideHeavenStems || []).map((h, index) => ({
      name: h.name,
      tenStar: h.tenStar,
      qiLevel: index  // 0=本气, 1=中气, 2=余气
    }));

    const pattern = this.determinePattern(dayStem, monthStem, monthBranch, monthHideHeavenStems, pillars);
    const tiaohou = QIONG_TONG_ADVICE[dayStem + monthBranch] || '';

    const dayEnergy = wuxingEnergy.elements?.find(e => e.name === dayElement);
    const dayElementLower = dayElement.toLowerCase();
    const elementToEnglish = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
    const dayElementEnglish = elementToEnglish[dayElement] || dayElementLower;
    const printElementEnglish = WUXING_SUPPORT[dayElementEnglish];
    const elementFromEnglish = { 'wood': '木', 'fire': '火', 'earth': '土', 'metal': '金', 'water': '水' };
    const printElementName = elementFromEnglish[printElementEnglish];
    const printEnergy = wuxingEnergy.elements?.find(e => e.name === printElementName);
    const totalScore = wuxingEnergy.totalScore || 1;

    const selfScore = dayEnergy?.score || 0;
    const printScore = printEnergy?.score || 0;
    const selfPercentage = ((selfScore + printScore) / totalScore) * 100;

    let dayStrengthCode = 'balanced';
    let dayStrength = '中和';
    if (selfPercentage < 10) {
      if (selfPercentage < 5) {
        dayStrengthCode = 'congWeak';
        dayStrength = '从弱';
      } else {
        dayStrengthCode = 'extremelyWeak';
        dayStrength = '极弱';
      }
    } else if (selfPercentage < 30) {
      dayStrengthCode = 'weak';
      dayStrength = '身弱';
    } else if (selfPercentage < 45) {
      dayStrengthCode = 'neutralWeak';
      dayStrength = '偏弱';
    } else if (selfPercentage <= 55) {
      dayStrengthCode = 'balanced';
      dayStrength = '中和';
    } else if (selfPercentage < 70) {
      dayStrengthCode = 'neutralStrong';
      dayStrength = '偏旺';
    } else if (selfPercentage < 85) {
      dayStrengthCode = 'strong';
      dayStrength = '身旺';
    } else {
      dayStrengthCode = 'dominant';
      dayStrength = '专旺';
    }

    const dayScore = selfPercentage;

    const { xiyong, jihui } = this.determinePreferences(wuxingEnergy, dayStem, dayStrengthCode, tiaohou);

    let patternNameForDisplay = pattern.name.replace(/\(未透\)|\(已透\)/g, '').trim();
    let exposed = pattern.name.includes('未透') ? '未透' : (pattern.name.includes('已透') ? '已透' : '');
    let hasYuqi = pattern.name.includes('余气');
    let patternWithParen;
    if (hasYuqi) {
      patternWithParen = pattern.name;
    } else if (exposed) {
      patternWithParen = `${patternNameForDisplay}(${exposed})`;
    } else {
      patternWithParen = patternNameForDisplay;
    }

    let advice = '';
    let gejuName = patternWithParen || '';
    let shuoming = pattern.name ? ZI_PING_PATTERNS[pattern.type]?.desc || '' : '';
    
    if (dayStrengthCode === 'congWeak') {
      gejuName = '从弱格';
      shuoming = '日主极弱，弃命从势。顺从局中旺神为吉，逆势生扶为凶。';
      
      if (xiyong[0] === '顺势五行') {
        advice = `此命局为从弱格，最喜${xiyong[1] || ''}、顺势五行顺势而为。`;
      } else {
        advice = `此命局为从弱格，最喜${xiyong.join('、')}顺势而为。`;
      }
      
      const elementToEnglish = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
      const elementFromEnglish = { 'wood': '木', 'fire': '火', 'earth': '土', 'metal': '金', 'water': '水' };
      const dayElementEnglish = elementToEnglish[dayElement] || dayElement.toLowerCase();
      const generatedBy = WUXING_SUPPORT[dayElementEnglish];
      const avoidElement = elementFromEnglish[generatedBy];
      
      if (avoidElement) {
        advice += `切忌${avoidElement}强行生扶，否则易起冲突。`;
      }
    } else if (pattern.name && pattern.name.includes('专旺')) {
      gejuName = patternWithParen;
      shuoming = ZI_PING_PATTERNS[pattern.type]?.desc || '';
      advice = `此命局为${patternWithParen}，最喜${xiyong.join('、')}顺其气势。切忌${jihui[0] || ''}逆势克制，以免触怒旺神。`;
    } else {
      if (pattern.name) {
        advice = `此命局以${patternWithParen}论，`;
      } else {
        advice = '此命局无明显格局，';
      }
      const xiyongFirst = xiyong[0] || '';
      const xiyongSecond = xiyong[1] || xiyongFirst;
      advice += `日主${dayStrength}。首取${xiyongFirst}为用，以平衡命局；次取${xiyongSecond}为辅。`;
    }

    if (tiaohou && dayStrengthCode !== 'congWeak') {
      advice += tiaohou;
    }

    return {
      rizhu: `${dayStem}，${dayElement}命人`,
      geju: gejuName,
      shuoming: shuoming,
      tiaohou: tiaohou,
      xiyong: xiyong,
      jihui: jihui,
      jianyi: advice,
      qiangruo: {
        chengdu: dayStrength,
        fenshu: dayScore
      },
      preferences: {
        likes: xiyong,
        dislikes: jihui
      }
    };
  }

  determinePattern(dayStem, monthStem, monthBranch, monthHideHeavenStems, pillars) {
    if (!monthHideHeavenStems || monthHideHeavenStems.length === 0) {
      return { name: '', type: '', exposed: false };
    }

    const revealedStems = [pillars.year.heavenStem, pillars.month.heavenStem, pillars.hour.heavenStem];

    const mainQi = monthHideHeavenStems[0];
    const isMainRevealed = revealedStems.includes(mainQi.name);

    if (isMainRevealed) {
      const tenStar = mainQi.tenStar;
      if (ZI_PING_PATTERNS[tenStar]) {
        return { name: ZI_PING_PATTERNS[tenStar].name, type: tenStar, exposed: true };
      }
    }

    for (let i = 1; i < monthHideHeavenStems.length; i++) {
      const subQi = monthHideHeavenStems[i];
      const isSubRevealed = revealedStems.includes(subQi.name);
      if (isSubRevealed) {
        const tenStar = subQi.tenStar;
        if (ZI_PING_PATTERNS[tenStar]) {
          return { name: ZI_PING_PATTERNS[tenStar].name + '(余气)', type: tenStar, exposed: true };
        }
      }
    }

    const mainTenStar = mainQi.tenStar;
    if (ZI_PING_PATTERNS[mainTenStar]) {
      return { name: ZI_PING_PATTERNS[mainTenStar].name + '(未透)', type: mainTenStar, exposed: false };
    }

    return { name: '', type: '', exposed: false };
  }

  determinePreferences(wuxingEnergy, dayStem, dayStrengthCode, tiaohou) {
    try {
    const dayElement = ELEMENT_MAP[dayStem];
    const elementToEnglish = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
    const dayElementEnglish = elementToEnglish[dayElement] || dayElement.toLowerCase();
    const printElementEnglish = WUXING_SUPPORT[dayElementEnglish];
    const elementFromEnglish = { 'wood': '木', 'fire': '火', 'earth': '土', 'metal': '金', 'water': '水' };
    const printElementName = elementFromEnglish[printElementEnglish];

    const supportNames = { 'wood': '木', 'fire': '火', 'earth': '土', 'metal': '金', 'water': '水' };
    const support = supportNames[WUXING_SUPPORT[dayElementEnglish]]?.split('') || [];
    const child = supportNames[WUXING_CHILD[dayElementEnglish]]?.split('') || [];
    const wealth = supportNames[WUXING_CONTROLLED[dayElementEnglish]]?.split('') || [];
    const officer = supportNames[WUXING_CONTROL[dayElementEnglish]]?.split('') || [];

    const dayEnergy = wuxingEnergy.elements?.find(e => e.name === dayElement);
    const printEnergy = wuxingEnergy.elements?.find(e => e.name === printElementName);
    const totalScore = wuxingEnergy.totalScore || 1;

    const selfScore = dayEnergy?.score || 0;
    const printScore = printEnergy?.score || 0;
    const selfPct = ((selfScore + printScore) / totalScore) * 100;
    const supportPct = wuxingEnergy.elements?.find(e => e.name === support[0])?.percentage || 0;
    const peerPct = dayEnergy?.percentage || 0;
    const printPct = printEnergy?.percentage || 0;

    let joy = '', use = '', avoid = '', foe = '';

    const getPct = (elmName) => wuxingEnergy.elements?.find(e => e.name === elmName)?.percentage || 0;

    if (dayStrengthCode === 'congWeak') {
      const sortedElements = wuxingEnergy.elements?.sort((a, b) => b.percentage - a.percentage) || [];
      const strongestElement = sortedElements[0];
      if (strongestElement) {
        joy = strongestElement.name;
        use = '顺势五行';
        avoid = support[0] || '';
        foe = dayElement;
      }
    } else if (dayStrengthCode === 'dominant') {
      joy = child[0] || '';
      use = dayElement;
      avoid = officer[0] || '';
      foe = support[0] || '';
    } else if (dayStrengthCode === 'weak' || dayStrengthCode === 'neutralWeak' || dayStrengthCode === 'extremelyWeak') {
      const officerPct = getPct(officer[0]);
      const childPct = getPct(child[0]);
      const wealthPct = getPct(wealth[0]);

      const maxDrain = Math.max(officerPct, childPct, wealthPct);

      if (maxDrain === officerPct) {
        joy = support[0] || '';
        use = dayElement;
        avoid = wealth[0] || '';
        foe = child[0] || '';
      } else if (maxDrain === childPct) {
        joy = support[0] || '';
        use = dayElement;
        avoid = child[0] || '';
        foe = wealth[0] || '';
      } else {
        joy = dayElement;
        use = support[0] || '';
        avoid = child[0] || '';
        foe = officer[0] || '';
      }
    } else if (dayStrengthCode === 'strong' || dayStrengthCode === 'neutralStrong') {
      if (peerPct > supportPct) {
        joy = officer[0] || '';
        use = child[0] || '';
        avoid = support[0] || '';
        foe = dayElement;
      } else {
        joy = wealth[0] || '';
        use = child[0] || '';
        avoid = support[0] || '';
        foe = officer[0] || '';
      }
    } else {
      if (selfPct >= 60) {
        joy = officer[0] || '';
        use = child[0] || '';
        avoid = support[0] || '';
        foe = support[1] || '';
      } else if (selfPct >= 40) {
        joy = officer[0] || '';
        use = officer[1] || '';
        avoid = support[0] || '';
        foe = support[1] || '';
      } else if (selfPct >= 25) {
        if (peerPct > supportPct) {
          joy = child[0] || '';
          use = child[0] || '';
          avoid = support[0] || '';
          foe = peerPct > 20 ? support[1] || '' : '';
        } else {
          joy = officer[0] || '';
          use = child[0] || '';
          avoid = support[0] || '';
          foe = officer[0] || '';
        }
      } else if (selfPct >= 15) {
        if (peerPct > supportPct) {
          joy = child[0] || '';
          use = child[0] || '';
          avoid = support[0] || '';
          foe = '';
        } else {
          joy = officer[0] || '';
          use = support[0] || '';
          avoid = support[1] || '';
          foe = '';
        }
      } else {
        if (selfPct < 10 && printPct > 50) {
          joy = officer[0] || '';
          use = officer[1] || '';
          avoid = support[0] || '';
          foe = child[0] || '';
        } else if (peerPct > supportPct) {
          joy = child[0] || '';
          use = child[0] || '';
          avoid = support[0] || '';
          foe = '';
        } else {
          joy = support[0] || '';
          use = support[1] || '';
          avoid = support[0] || '';
          foe = control[1] || '';
        }
      }
      if (dayStrengthCode === 'balanced') {
        const tiaohouStem = tiaohou?.match(/[专调]?用([甲乙丙丁戊己庚辛壬癸])/)?.[1];
        const tiaohouElement = tiaohouStem ? STEM_ELEMENT_MAP[tiaohouStem] : null;
        const tiaohouElementName = tiaohouElement ? supportNames[tiaohouElement] : '';
        
        joy = tiaohouElementName || child[0] || '随运而定';
        use = supportNames[WUXING_CONTROLLED[dayElementEnglish]] || '平衡为上';
        avoid = '过激';
        foe = '冲克';
      }
    }

    let xiyong = [joy, use].filter(x => x);
    let jihui = [avoid, foe].filter(x => x);

    if (tiaohou) {
      const tiaohouMatch = tiaohou.match(/[专调]?用([甲乙丙丁戊己庚辛壬癸])/);
      if (tiaohouMatch) {
        const tiaohouStem = tiaohouMatch[1];
        const tiaohouElement = STEM_ELEMENT_MAP[tiaohouStem];
        const tiaohouElementName = tiaohouElement ? supportNames[tiaohouElement] : '';

        if (tiaohouElementName && tiaohouElementName !== joy && tiaohouElementName !== use) {
          if (tiaohouElementName !== avoid && tiaohouElementName !== foe) {
            if (dayStrengthCode === 'congWeak' || dayStrengthCode === 'weak' || dayStrengthCode === 'neutralWeak' || dayStrengthCode === 'extremelyWeak') {
              if (!use || use === '顺势五行') {
                use = tiaohouElementName;
              } else if (!xiyong.includes(tiaohouElementName)) {
                xiyong.push(tiaohouElementName);
              }
            } else {
              xiyong = [tiaohouElementName, ...xiyong];
            }
          }
        }
      }
    }

    return { xiyong, jihui };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 构建大运信息
   * 
   * 参考SPA端bazi.js的buildFortuneInfo函数移植
   * 
   * 大运结构：
   * 1. 童限（0岁~起运年龄）
   * 2. 大运1（起运年龄~起运年龄+10年）
   * 3. 大运2~大运10
   * 
   * 童限从出生年开始计算，作为第一步大运
   * 
   * @param {Object} childLimit - 童限对象
   * @param {Object} pillars - 四柱信息
   * @param {boolean} isMan - 是否男性
   * @returns {Object} 大运信息对象
   */
  buildFortuneInfo(childLimit, pillars, isMan) {
    const eightChar = childLimit.getEightChar();

    /**
     * 胎元 (Fetal Origin)
     * 八字命理中的重要概念，表示生命起源的五行之气
     * 来源: eightChar.getFetalOrigin()
     */
    const fetalOrigin = eightChar.getFetalOrigin();
    
    /**
     * 胎息 (Fetal Breath)
     * 与胎元相关联的气息概念
     * 来源: eightChar.getFetalBreath()
     */
    const fetalBreath = eightChar.getFetalBreath();
    
    /**
     * 命宫 (Own Sign)
     * 八字中的重要宫位，表示命主的核心特质
     * 来源: eightChar.getOwnSign()
     */
    const ownSign = eightChar.getOwnSign();
    
    /**
     * 身宫 (Body Sign)
     * 与命宫对应的宫位，表示后天的修行和变化
     * 来源: eightChar.getBodySign()
     */
    const bodySign = eightChar.getBodySign();

    /**
     * 童限信息
     * 记录从出生到起运之间的时期
     * 来源: childLimit的各种getter方法
     */
    const childLimitInfo = {
      year: childLimit.getYearCount(),
      month: childLimit.getMonthCount(),
      day: childLimit.getDayCount(),
      hour: childLimit.getHourCount(),
      minute: childLimit.getMinuteCount()
    };
    const fs = require('fs');
    fs.appendFileSync('/tmp/bazi_debug.log', `[${new Date().toISOString()}] childLimitInfo: ${JSON.stringify(childLimitInfo)}\n`);
    fs.appendFileSync('/tmp/bazi_debug.log', `[${new Date().toISOString()}] getYearCount: ${childLimit.getYearCount()}\n`);
    fs.appendFileSync('/tmp/bazi_debug.log', `[${new Date().toISOString()}] getStartAge: ${childLimit.getStartAge()}\n`);
    fs.appendFileSync('/tmp/bazi_debug.log', `[${new Date().toISOString()}] getEndAge: ${childLimit.getEndAge()}\n`);
    fs.appendFileSync('/tmp/bazi_debug.log', `[${new Date().toISOString()}] getStartSixtyCycleYear: ${childLimit.getStartSixtyCycleYear().getYear()}\n`);
    fs.appendFileSync('/tmp/bazi_debug.log', `[${new Date().toISOString()}] getEndSixtyCycleYear: ${childLimit.getEndSixtyCycleYear().getYear()}\n`);

    /**
     * 起运时间计算
     * 计算何时开始起大运，通常根据出生后若干年/月/日/时/分
     */
    const endTime = childLimit.getEndTime();
    const startYear = childLimit.getStartSixtyCycleYear().getYear();
    const startAge = childLimit.getStartAge();

    /**
     * 格式化起运日期字符串
     * 用于显示"X年X个月X天X时X分后起运"
     */
    let startDateStr = '';
    try {
      const endSolar = endTime.toString();
      if (endSolar.includes('年')) {
        const parts = endSolar.split('年');
        if (parts[1]) {
          const monthDay = parts[1].split('月');
          if (monthDay[1]) {
            const dayTime = monthDay[1].split('日');
            if (dayTime[1]) {
              startDateStr = `${parts[0]}年${monthDay[0]}月${dayTime[0]}日 ${dayTime[1]}`;
            }
          }
        }
      }
    } catch (e) {
      startDateStr = `${startYear}年${childLimitInfo.year}岁起运`;
    }

    const dayStemIdx = STEMS.indexOf(pillars.day.heavenStem);
    const birthYear = childLimit.getStartSixtyCycleYear().getYear();

    /**
     * 构建大运数组
     * 
     * 大运计算规则：
     * 1. 童限：从出生年到起运年
     * 2. 起大运：每步大运管10年
     * 
     * 参考SPA端bazi.js的buildDecadeFortune函数逻辑
     */
    const fortunes = [];
    const childFortune = childLimit.getDecadeFortune();
    const childSc = childFortune.getSixtyCycle();
    const childStartYear = childLimit.getStartSixtyCycleYear().getYear();
    const childEndYear = childLimit.getEndSixtyCycleYear().getYear();
    const childStartAge = childLimit.getStartAge();
    const childEndAge = childLimit.getEndAge();

    /**
       * 十神计算
       * 每个大运的十神根据大运天干与日主的关系确定
       * 参考SPA端bazi.js - "tenStar: me.getTenStar(decadeFortune.getSixtyCycle().getHeavenStem()).getName()"
       */
      const childStemIdx = STEMS.indexOf(childSc.getHeavenStem().getName());
      const childShishen = this.calculateTenStarByIndex(dayStemIdx, childStemIdx);

      fortunes.push({
        id: 0,
        ganzhi: '童限',
        startYear: childStartYear,
        endYear: childEndYear,
        startAge: childStartAge,
        endAge: childEndAge,
        shishen: childShishen
      });

    /**
     * 添加10步大运
     * 
     * 大运从起运时间开始计算
     * 每步大运对应一个十神
     */
    let decadeFortune = childLimit.getStartDecadeFortune();
    for (let i = 0; i < 10; i++) {
      const dfSc = decadeFortune.getSixtyCycle();
      const dfStartAge = decadeFortune.getStartAge();
      const dfEndAge = decadeFortune.getEndAge();
      const dfStartYear = birthYear + dfStartAge - startAge;
      const dfEndYear = birthYear + dfEndAge - startAge;

      /**
       * 十神计算
       * 根据大运天干与日主的天干索引计算十神
       * 十神关系表（日干索引为基准）：
       * 0=甲, 1=乙, 2=丙, 3=丁, 4=戊, 5=己, 6=庚, 7=辛, 8=壬, 9=癸
       */
      const dfStemIdx = STEMS.indexOf(dfSc.getHeavenStem().getName());
      const dfShishen = this.calculateTenStarByIndex(dayStemIdx, dfStemIdx);

      fortunes.push({
        id: i + 1,
        ganzhi: dfSc.getName(),
        startYear: dfStartYear,
        endYear: dfEndYear,
        startAge: dfStartAge,
        endAge: dfEndAge,
        shishen: dfShishen
      });
      decadeFortune = decadeFortune.next(1);
    }

    return {
      /**
       * 胎元信息
       * 格式: {name: "干支", sound: "纳音"}
       */
      taiyuan: {
        name: fetalOrigin.getName(),
        sound: fetalOrigin.getSound().getName()
      },
      
      /**
       * 胎息信息
       * 格式: {name: "干支", sound: "纳音"}
       */
      taixi: {
        name: fetalBreath.getName(),
        sound: fetalBreath.getSound().getName()
      },
      
      /**
       * 命宫信息
       * 格式: {name: "干支", sound: "纳音"}
       */
      minggong: {
        name: ownSign.getName(),
        sound: ownSign.getSound().getName()
      },
      
      /**
       * 身宫信息
       * 格式: {name: "干支", sound: "纳音"}
       */
      shengong: {
        name: bodySign.getName(),
        sound: bodySign.getSound().getName()
      },
      
      /**
       * 起运信息
       * 格式: "X年X个月X天X时X分 (日期后起运)"
       */
      qiyun: `${childLimitInfo.year}年${childLimitInfo.month}个月${childLimitInfo.day}天${childLimitInfo.hour}时${childLimitInfo.minute}分 (${startDateStr}后起运)`,
      
      /**
       * 大运总数
       * 包含童限在内
       */
      dayunCount: fortunes.length,
      
      /**
       * 大运详情数组
       */
      dayun: fortunes
    };
  }

  buildPillars(eightChar) {
    const yearSc = eightChar.getYear();
    const monthSc = eightChar.getMonth();
    const daySc = eightChar.getDay();
    const hourSc = eightChar.getHour();
    const dayHeavenStem = daySc.getHeavenStem();

    return {
      year: this.buildSinglePillarData('年柱', yearSc, dayHeavenStem),
      month: this.buildSinglePillarData('月柱', monthSc, dayHeavenStem),
      day: this.buildSinglePillarData('日柱', daySc, dayHeavenStem),
      hour: this.buildSinglePillarData('时柱', hourSc, dayHeavenStem)
    };
  }

  buildSinglePillarData(name, sc, dayHeavenStem) {
    const stem = sc.getHeavenStem().getName();
    const branch = sc.getEarthBranch().getName();
    const branchObj = sc.getEarthBranch();
    const branchElement = this.getBranchElement(branch);

    const hideHeavenStems = [
      { stem: branchObj.getHideHeavenStemMain(), level: '本气' },
      { stem: branchObj.getHideHeavenStemMiddle(), level: '中气' },
      { stem: branchObj.getHideHeavenStemResidual(), level: '余气' }
    ].filter(h => h.stem).map(h => {
      const stemName = h.stem.getName();
      const stemElement = ELEMENT_MAP[stemName];
      const tenStar = dayHeavenStem.getTenStar(h.stem).getName();
      const fuxing = this.calculateBranchTenStar(branchElement, stemElement);
      
      return {
        name: stemName,
        level: h.level,
        tenStar: tenStar,
        fuxing: fuxing
      };
    });

    const scName = stem + branch;
    const sixtyCycle = SixtyCycle.fromName(scName);
    const extraEarthBranches = sixtyCycle.getExtraEarthBranches()?.map(b => b.getName()) || [];

    let tenStar = dayHeavenStem.getTenStar(sc.getHeavenStem()).getName();
    if (name === '日柱') {
      tenStar = '比肩';
    }

    return {
      name,
      heavenStem: stem,
      earthBranch: branch,
      tenStar: { heavenStem: tenStar },
      hideHeavenStems,
      extraEarthBranches,
      terrain: dayHeavenStem.getTerrain(branchObj).getName(),
      terrainSelf: sc.getHeavenStem().getTerrain(branchObj).getName(),
      sound: sc.getSound().toString()
    };
  }

  getBranchElement(branch) {
    const elementMap = {
      '子': '水', '丑': '土', '寅': '木', '卯': '木',
      '辰': '土', '巳': '火', '午': '火', '未': '土',
      '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    return elementMap[branch] || '';
  }

  calculateBranchTenStar(branchElement, stemElement) {
    const elements = ['木', '火', '土', '金', '水'];
    const branchIdx = elements.indexOf(branchElement);
    const stemIdx = elements.indexOf(stemElement);
    
    if (branchIdx === -1 || stemIdx === -1) return '';
    
    const diff = (stemIdx - branchIdx + 5) % 5;
    const tenStars = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];
    return tenStars[diff];
  }

  calculateAge(solarDay, pillars) {
    const birthYear = solarDay.getYear();
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear + 1;
  }

  getZodiac(branch) {
    const zodiacMap = {
      '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
      '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
      '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };
    return zodiacMap[branch] || '';
  }

  calculateTenStarByIndex(dayStemIdx, otherStemIdx) {
    const TEN_STAR_LOOKUP = [
      ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'],
      ['劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印'],
      ['偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官'],
      ['正印', '偏印', '劫财', '比肩', '伤官', '食神', '正财', '偏财', '正官', '七杀'],
      ['七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官', '偏财', '正财'],
      ['正官', '七杀', '正印', '偏印', '劫财', '比肩', '伤官', '食神', '正财', '偏财'],
      ['偏财', '正财', '七杀', '正官', '偏印', '正印', '比肩', '劫财', '食神', '伤官'],
      ['正财', '偏财', '正官', '七杀', '正印', '偏印', '劫财', '比肩', '伤官', '食神'],
      ['食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印', '比肩', '劫财'],
      ['伤官', '食神', '正财', '偏财', '正官', '七杀', '正印', '偏印', '劫财', '比肩']
    ];
    return TEN_STAR_LOOKUP[dayStemIdx][otherStemIdx];
  }

  getConstellation(solarDay) {
    const month = solarDay.getMonth();
    const day = solarDay.getDay();
    
    const constellations = [
      { start: [1, 20], name: '水瓶座' },
      { start: [2, 19], name: '双鱼座' },
      { start: [3, 21], name: '白羊座' },
      { start: [4, 20], name: '金牛座' },
      { start: [5, 21], name: '双子座' },
      { start: [6, 21], name: '巨蟹座' },
      { start: [7, 23], name: '狮子座' },
      { start: [8, 23], name: '处女座' },
      { start: [9, 23], name: '天秤座' },
      { start: [10, 23], name: '天蝎座' },
      { start: [11, 22], name: '射手座' },
      { start: [12, 22], name: '摩羯座' }
    ];

    for (const c of constellations.reverse()) {
      if (month > c.start[0] || (month === c.start[0] && day >= c.start[1])) {
        return c.name;
      }
    }
    return constellations[11].name;
  }
}

module.exports = BaziService;
