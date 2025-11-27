try {
    //无情之克
    if (typeof HeavenStem !== 'undefined' && typeof HeavenStem.prototype.getOpposite === 'undefined') {
        HeavenStem.prototype.getOpposite = function () {

            return HeavenStem.fromIndex((this.index + 4) % 10);
        };

    }
} catch (e) { }

var now = new Date();
var today = new Date();
var weekStart = 1; // 0 表示周日为周首，可改为 1 表示周一
var D = document;

// --- True Solar Time Support ---
window.JW_DATA = null;
fetch('./jw.json').then(function (r) { return r.json(); }).then(function (d) {
    window.JW_DATA = d;
    // Trigger event to notify data loaded
    window.dispatchEvent(new Event('jw_data_loaded'));
}).catch(function (e) { console.warn('Failed to load jw.json', e); });

// --- High Precision Astronomy Module ---
var Astro = {
    sn: function (x) { return Math.sin(x * 1.74532925199433E-02); },
    cn: function (x) { return Math.cos(x * 1.74532925199433E-02); },
    fpart: function (x) {
        x = x - Math.floor(x);
        if (x < 0) x = x + 1;
        return x;
    },
    ipart: function (x) {
        if (x == 0) return 0;
        return (x / Math.abs(x)) * Math.floor(Math.abs(x));
    },
    // Returns RA and DEC of Sun
    sun: function (t) {
        var p2 = 2 * Math.PI;
        var COSEPS = 0.91748;
        var SINEPS = 0.39778;
        var m = p2 * this.fpart(0.993133 + 99.997361 * t); // Mean anomaly
        var dL = 6893 * Math.sin(m) + 72 * Math.sin(2 * m); // Eq centre
        var L = p2 * this.fpart(0.7859453 + m / p2 + (6191.2 * t + dL) / 1296000);
        // convert to RA and DEC
        var sl = Math.sin(L);
        var x = Math.cos(L);
        var y = COSEPS * sl;
        var Z = SINEPS * sl;
        var rho = Math.sqrt(1 - Z * Z);
        var dec = (360 / p2) * Math.atan(Z / rho);
        var ra = (48 / p2) * Math.atan(y / (x + rho));
        if (ra < 0) ra = ra + 24;
        return [ra, dec];
    },
    // Calculate Equation of Time in minutes
    getEOT: function (date) {
        // Julian Date
        var year = date.getUTCFullYear();
        var month = date.getUTCMonth() + 1;
        var day = date.getUTCDate();
        var hour = date.getUTCHours();
        var min = date.getUTCMinutes();
        var sec = date.getUTCSeconds();

        if (month <= 2) { year -= 1; month += 12; }
        var A = Math.floor(year / 100);
        var B = 2 - A + Math.floor(A / 4);
        var jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
        jd += (hour + min / 60 + sec / 3600) / 24;

        var instant = jd - 2400001;
        var t = (instant - 51544.5) / 36525;

        var sunPos = this.sun(t);
        var ra = sunPos[0]; // Right Ascension in hours

        // Mean Longitude of Sun (in degrees, converted to hours)
        var L0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
        L0 = L0 % 360;
        if (L0 < 0) L0 += 360;
        var meanSun = L0 / 15.0;

        // Equation of Time = Mean Solar Time - Apparent Solar Time
        // But usually defined as Apparent - Mean in some contexts. 
        // Standard formula: E = L0 - RA (with adjustments)
        // Let's use the RA based calculation directly:
        // EOT (minutes) = 4 * (L - RA) where L is mean longitude, RA is right ascension
        // However, we need to be careful with units and quadrants.

        // Let's use a simpler approximation derived from the high precision RA if possible, 
        // or standard EOT formula using the t calculated above.
        // Actually, since we have accurate RA, we can calculate GHA (Greenwich Hour Angle) difference.

        // Alternative high precision EOT from Meeus:
        // E = L0 - 0.0057183 - alpha + delta_psi * cos(epsilon)
        // For our purpose, E = (Mean Longitude - Right Ascension) is the core.
        // Both in hours.

        var eotHours = meanSun - ra;
        // Normalize to -12 to +12
        while (eotHours > 12) eotHours -= 24;
        while (eotHours < -12) eotHours += 24;

        return eotHours * 60; // in minutes
    }
};

function calculateTrueSolarTimeManual(date, lng) {
    // 1. Calculate Equation of Time (EOT)
    // We use the date to get EOT. Note: EOT changes slightly during the day, 
    // but calculating it for the given instant is most accurate.
    var eotMinutes = Astro.getEOT(date);

    // 2. Longitude Correction
    // Beijing Standard Time is UTC+8, based on 120°E
    // Local Mean Time = Standard Time + (Local Longitude - 120) * 4 minutes
    var stdLng = 120;
    var lngOffsetMinutes = (lng - stdLng) * 4;

    // 3. True Solar Time = Standard Time + Longitude Offset + EOT
    var totalOffsetMinutes = lngOffsetMinutes + eotMinutes;

    return new Date(date.getTime() + totalOffsetMinutes * 60 * 1000);
}

function getTrueSolarDate(date, lng) {
    try {
        if (typeof Solar !== 'undefined' && typeof Solar.fromYmdHms === 'function') {
            var s = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds());
            // Check if useLongitude exists (tyme/lunar-javascript feature)
            if (typeof s.useLongitude === 'function') {
                var tst = s.useLongitude(lng);
                return new Date(tst.getYear(), tst.getMonth() - 1, tst.getDay(), tst.getHour(), tst.getMinute(), tst.getSecond());
            }
        }
    } catch (e) { console.warn('Tyme library TST failed, using manual', e); }
    return calculateTrueSolarTimeManual(date, lng);
}
// -------------------------------

const STEM_ELEMENT_MAP = {
    '甲': 'wood',
    '乙': 'wood',
    '丙': 'fire',
    '丁': 'fire',
    '戊': 'earth',
    '己': 'earth',
    '庚': 'metal',
    '辛': 'metal',
    '壬': 'water',
    '癸': 'water'
};
const BRANCH_ELEMENT_MAP = {
    '子': 'water',
    '丑': 'earth',
    '寅': 'wood',
    '卯': 'wood',
    '辰': 'earth',
    '巳': 'fire',
    '午': 'fire',
    '未': 'earth',
    '申': 'metal',
    '酉': 'metal',
    '戌': 'earth',
    '亥': 'water'
};
const WUXING_META = {
    order: ['wood', 'fire', 'earth', 'metal', 'water'],
    names: {
        wood: '木',
        fire: '火',
        earth: '土',
        metal: '金',
        water: '水'
    },
    traits: {
        wood: '木主生发条达，宜规划伸展',
        fire: '火主礼仪彰显，宜热情推动',
        earth: '土主信实承载，宜统筹守成',
        metal: '金主义气裁决，宜果断执行',
        water: '水主智慧灵动，宜谋略适应'
    },
    classMap: {
        wood: 'text-wuxing-wood',
        fire: 'text-wuxing-fire',
        earth: 'text-wuxing-earth',
        metal: 'text-wuxing-metal',
        water: 'text-wuxing-water'
    }
};
const PILLAR_WEIGHTS = {
    year: 0.9,
    month: 1.35,
    day: 1.2,
    hour: 1.0
};
const HIDE_WEIGHTS = [0.65, 0.35, 0.2];
const RELATION_EFFECT = {
    combine: 0.18,
    clash: -0.22,
    harm: -0.12,
    punish: -0.1,
    break: -0.08
};

// Seasonal Adjustment Factors (旺相休囚死)
// V3.1: 加重失令惩罚 - 旺×1.5, 相×1.2, 休×0.7, 囚×0.4, 死×0.2
const SEASONAL_ADJUSTMENT = {
    // 春季（寅卯辰月）：木旺、火相、水休、金囚、土死
    '寅': { wood: 1.5, fire: 1.2, water: 0.7, metal: 0.4, earth: 0.2 },
    '卯': { wood: 1.5, fire: 1.2, water: 0.7, metal: 0.4, earth: 0.2 },
    // 辰月特殊：土旺
    '辰': { earth: 1.5, metal: 1.2, fire: 0.7, wood: 0.4, water: 0.2 },

    // 夏季（巳午未月）：火旺、土相、木休、水囚、金死
    '巳': { fire: 1.5, earth: 1.2, wood: 0.7, water: 0.4, metal: 0.2 },
    '午': { fire: 1.5, earth: 1.2, wood: 0.7, water: 0.4, metal: 0.2 },
    // 未月特殊：土旺
    '未': { earth: 1.5, metal: 1.2, fire: 0.7, wood: 0.4, water: 0.2 },

    // 秋季（申酉戌月）：金旺、水相、土休、火囚、木死
    '申': { metal: 1.5, water: 1.2, earth: 0.7, fire: 0.4, wood: 0.2 },
    '酉': { metal: 1.5, water: 1.2, earth: 0.7, fire: 0.4, wood: 0.2 },
    // 戌月特殊：土旺
    '戌': { earth: 1.5, metal: 1.2, fire: 0.7, wood: 0.4, water: 0.2 },

    // 冬季（亥子丑月）：水旺、木相、金休、土囚、火死
    '亥': { water: 1.5, wood: 1.2, metal: 0.7, earth: 0.4, fire: 0.2 },
    '子': { water: 1.5, wood: 1.2, metal: 0.7, earth: 0.4, fire: 0.2 },
    // 丑月特殊：土旺
    '丑': { earth: 1.5, metal: 1.2, fire: 0.7, wood: 0.4, water: 0.2 }
};

// Hidden Stem Ratios (V3.0 Standard)
const HIDDEN_STEM_RATIOS = {
    // 专气 (Zi, Mao, You): 100%
    '子': [1.0], '卯': [1.0], '酉': [1.0],
    // 专气带土 (Wu): Ding 70%, Ji 30%
    '午': [0.7, 0.3],
    // 四生 (Yin, Shen, Si, Hai): 60%, 30%, 10%
    '寅': [0.6, 0.3, 0.1],
    '申': [0.6, 0.3, 0.1],
    '巳': [0.6, 0.3, 0.1],
    '亥': [0.6, 0.3, 0.1],
    // 四库 (Chen, Xu, Chou, Wei): 60%, 25%, 15%
    '辰': [0.6, 0.25, 0.15],
    '戌': [0.6, 0.25, 0.15],
    '丑': [0.6, 0.25, 0.15],
    '未': [0.6, 0.25, 0.15]
};

// Heavenly Stem Combinations (天干合化)
const STEM_COMBINATIONS = {
    '甲己': 'earth',  // 甲己合化土
    '乙庚': 'metal',  // 乙庚合化金
    '丙辛': 'water',  // 丙辛合化水
    '丁壬': 'wood',   // 丁壬合化木
    '戊癸': 'fire'    // 戊癸合化火
};

// Triple Combinations (三合局)
const TRIPLE_COMBOS = {
    wood: ['亥', '卯', '未'],  // 亥卯未三合木局
    fire: ['寅', '午', '戌'],  // 寅午戌三合火局
    metal: ['巳', '酉', '丑'], // 巳酉丑三合金局
    water: ['申', '子', '辰']  // 申子辰三合水局
};

// Directional Combinations (三会局/方局) - Higher priority than triple combos
const DIRECTIONAL_COMBOS = {
    wood: ['寅', '卯', '辰'],  // 东方木局
    fire: ['巳', '午', '未'],  // 南方火局
    metal: ['申', '酉', '戌'], // 西方金局
    water: ['亥', '子', '丑']  // 北方水局
};

// Distance Decay Coefficients (距离衰减系数)
const DISTANCE_DECAY = {
    adjacent: 1.0,    // 相邻柱 (日-月、月-年等)
    oneApart: 0.7,    // 隔一柱 (日-年、时-月等)
    twoApart: 0.5     // 隔两柱 (时-年)
};

// Transformation Success Thresholds (合化成功率阈值)
const TRANSFORMATION_THRESHOLDS = {
    complete: 0.8,    // 完全合化
    partial: 0.4,     // 部分合化
    entangled: 0.0    // 羁绊状态
};

// Generation and Control Coefficients (生克系数)
const GENERATION_COEFFICIENT = 0.2;  // 生：增加20%
const CONTROL_COEFFICIENT = 0.15;    // 克：减少15%

// Twelve Life Stages (十二长生) - Adjustment Factors
// 长生、帝旺、临官 ×1.3；死、绝、胎 ×0.7；其他 ×1.0
const LIFE_STAGE_FACTORS = {
    '长生': 1.3, '沐浴': 1.0, '冠带': 1.1, '临官': 1.3,
    '帝旺': 1.3, '衰': 0.9, '病': 0.8, '死': 0.7,
    '墓': 0.8, '绝': 0.7, '胎': 0.7, '养': 1.0
};

// Twelve Life Stages for Each Heavenly Stem
const TWELVE_LIFE_STAGES = {
    '甲': { '亥': '长生', '子': '沐浴', '丑': '冠带', '寅': '临官', '卯': '帝旺', '辰': '衰', '巳': '病', '午': '死', '未': '墓', '申': '绝', '酉': '胎', '戌': '养' },
    '乙': { '午': '长生', '巳': '沐浴', '辰': '冠带', '卯': '临官', '寅': '帝旺', '丑': '衰', '子': '病', '亥': '死', '戌': '墓', '酉': '绝', '申': '胎', '未': '养' },
    '丙': { '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰', '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养' },
    '丁': { '酉': '长生', '申': '沐浴', '未': '冠带', '午': '临官', '巳': '帝旺', '辰': '衰', '卯': '病', '寅': '死', '丑': '墓', '子': '绝', '亥': '胎', '戌': '养' },
    '戊': { '寅': '长生', '卯': '沐浴', '辰': '冠带', '巳': '临官', '午': '帝旺', '未': '衰', '申': '病', '酉': '死', '戌': '墓', '亥': '绝', '子': '胎', '丑': '养' },
    '己': { '酉': '长生', '申': '沐浴', '未': '冠带', '午': '临官', '巳': '帝旺', '辰': '衰', '卯': '病', '寅': '死', '丑': '墓', '子': '绝', '亥': '胎', '戌': '养' },
    '庚': { '巳': '长生', '午': '沐浴', '未': '冠带', '申': '临官', '酉': '帝旺', '戌': '衰', '亥': '病', '子': '死', '丑': '墓', '寅': '绝', '卯': '胎', '辰': '养' },
    '辛': { '子': '长生', '亥': '沐浴', '戌': '冠带', '酉': '临官', '申': '帝旺', '未': '衰', '午': '病', '巳': '死', '辰': '墓', '卯': '绝', '寅': '胎', '丑': '养' },
    '壬': { '申': '长生', '酉': '沐浴', '戌': '冠带', '亥': '临官', '子': '帝旺', '丑': '衰', '寅': '病', '卯': '死', '辰': '墓', '巳': '绝', '午': '胎', '未': '养' },
    '癸': { '卯': '长生', '寅': '沐浴', '丑': '冠带', '子': '临官', '亥': '帝旺', '戌': '衰', '酉': '病', '申': '死', '未': '墓', '午': '绝', '巳': '胎', '辰': '养' }
};

// Void Calculation (空亡) - Based on Day Pillar
const VOID_BRANCHES = {
    '甲子': ['戌', '亥'], '甲戌': ['申', '酉'], '甲申': ['午', '未'],
    '甲午': ['辰', '巳'], '甲辰': ['寅', '卯'], '甲寅': ['子', '丑'],
    '乙丑': ['戌', '亥'], '乙亥': ['申', '酉'], '乙酉': ['午', '未'],
    '乙未': ['辰', '巳'], '乙巳': ['寅', '卯'], '乙卯': ['子', '丑'],
    '丙寅': ['戌', '亥'], '丙子': ['申', '酉'], '丙戌': ['午', '未'],
    '丙申': ['辰', '巳'], '丙午': ['寅', '卯'], '丙辰': ['子', '丑'],
    '丁卯': ['戌', '亥'], '丁丑': ['申', '酉'], '丁亥': ['午', '未'],
    '丁酉': ['辰', '巳'], '丁未': ['寅', '卯'], '丁巳': ['子', '丑'],
    '戊辰': ['戌', '亥'], '戊寅': ['申', '酉'], '戊子': ['午', '未'],
    '戊戌': ['辰', '巳'], '戊申': ['寅', '卯'], '戊午': ['子', '丑'],
    '己巳': ['戌', '亥'], '己卯': ['申', '酉'], '己丑': ['午', '未'],
    '己亥': ['辰', '巳'], '己酉': ['寅', '卯'], '己未': ['子', '丑'],
    '庚午': ['戌', '亥'], '庚辰': ['申', '酉'], '庚寅': ['午', '未'],
    '庚子': ['辰', '巳'], '庚戌': ['寅', '卯'], '庚申': ['子', '丑'],
    '辛未': ['戌', '亥'], '辛巳': ['申', '酉'], '辛卯': ['午', '未'],
    '辛丑': ['辰', '巳'], '辛亥': ['寅', '卯'], '辛酉': ['子', '丑'],
    '壬申': ['戌', '亥'], '壬午': ['申', '酉'], '壬辰': ['午', '未'],
    '壬寅': ['辰', '巳'], '壬子': ['寅', '卯'], '壬戌': ['子', '丑'],
    '癸酉': ['戌', '亥'], '癸未': ['申', '酉'], '癸巳': ['午', '未'],
    '癸卯': ['辰', '巳'], '癸丑': ['寅', '卯'], '癸亥': ['子', '丑']
};

const BRANCH_RELATIONS = {
    combine: [
        ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']
    ],
    clash: [
        ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
    ],
    harm: [
        ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']
    ],
    punish: [
        ['子', '卯'], ['寅', '巳'], ['巳', '申'], ['申', '寅'], ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'], ['丑', '戌'], ['戌', '未'], ['未', '丑']
    ],
    break: [
        ['子', '酉'], ['子', '辰'], ['辰', '丑'], ['辰', '午'], ['辰', '酉'], ['午', '酉'], ['未', '丑']
    ]
};
const WUXING_SUPPORT = {
    wood: 'water',
    fire: 'wood',
    earth: 'fire',
    metal: 'earth',
    water: 'metal'
};
const WUXING_CONTROL = {
    wood: 'metal',
    fire: 'water',
    earth: 'wood',
    metal: 'fire',
    water: 'earth'
};
const WUXING_CHILD = {
    wood: 'fire',
    fire: 'earth',
    earth: 'metal',
    metal: 'water',
    water: 'wood'
};
const WUXING_CONTROLLED = {
    wood: 'earth',
    fire: 'metal',
    earth: 'water',
    metal: 'wood',
    water: 'fire'
};
const BODY_STEM_WEIGHTS = {
    peer: 8,
    support: 7,
    child: -6,
    wealth: -7,
    officer: -9,
    neutral: 0
};
const BODY_BRANCH_WEIGHTS = {
    peer: 6,
    support: 5,
    child: -4,
    wealth: -5,
    officer: -7,
    neutral: 0
};
// Zi Ping Zhen Quan - Standard Patterns (子平真诠·八格)
const ZI_PING_PATTERNS = {
    '正官': { name: '正官格', desc: '品行端正，重视名誉，适合公职或管理。' },
    '七杀': { name: '七杀格', desc: '刚毅果断，富有魄力，适合军警、司法或创业。' },
    '正印': { name: '正印格', desc: '仁慈宽厚，重视精神，适合学术、教育或宗教。' },
    '偏印': { name: '偏印格', desc: '精明干练，领悟力强，适合偏门技艺或研究。' },
    '食神': { name: '食神格', desc: '温和儒雅，才华横溢，适合艺术、餐饮或服务。' },
    '伤官': { name: '伤官格', desc: '聪明傲气，不拘一格，适合演艺、创作或自由业。' },
    '正财': { name: '正财格', desc: '勤俭踏实，重视现实，适合经商、金融或财务。' },
    '偏财': { name: '偏财格', desc: '慷慨豪爽，善于交际，适合投资、贸易或公关。' },
    '建禄': { name: '建禄格', desc: '身旺财官，白手起家，适合自主创业或高管。' },
    '羊刃': { name: '羊刃格', desc: '性情刚烈，敢作敢为，适合武职、外科或高风险行业。' }
};

// Qiong Tong Bao Jian - Climate Adjustments (穷通宝鉴·调候)
// Key: DayStem + MonthBranch
const QIONG_TONG_ADVICE = {
    // 甲木
    '甲寅': '调候用丙，辅以癸水。', '甲卯': '阳刃驾杀，专用庚金。', '甲辰': '木气渐退，先庚后壬。',
    '甲巳': '木性虚焦，专用癸水。', '甲午': '木性虚焦，癸水为上。', '甲未': '上半月用癸，下半月用庚丁。',
    '甲申': '先庚后丁，杀印相生。', '甲酉': '木衰金旺，专用丁火制杀。', '甲戌': '木性枯槁，先癸后丁。',
    '甲亥': '庚金劈甲，丁火引光。', '甲子': '木性虚寒，专用丙火。', '甲丑': '寒木向阳，专用丙火，辅以庚金。',
    // 乙木
    '乙寅': '初春余寒，专用丙火。', '乙卯': '专禄为强，用丙火泄秀。', '乙辰': '阳气渐盛，先癸后丙。',
    '乙巳': '木性枯焦，专用癸水。', '乙午': '木性枯焦，专用癸水。', '乙未': '润土培根，先癸后丙。',
    '乙申': '秋木凋零，专用丙火，辅以癸水。', '乙酉': '杀重身轻，专用癸水化杀。', '乙戌': '木性枯槁，专用癸水。',
    '乙亥': '寒木向阳，专用丙火。', '乙子': '寒木向阳，专用丙火。', '乙丑': '寒木向阳，专用丙火。',
    // 丙火
    '丙寅': '壬水为用，庚金为佐。', '丙卯': '专用壬水，辅以己土。', '丙辰': '土重晦光，专用甲木。',
    '丙巳': '炎威莫当，专用壬水。', '丙午': '炎威莫当，专用壬水，庚金佐之。', '丙未': '火土燥烈，专用壬水。',
    '丙申': '火气渐退，壬水为用。', '丙酉': '火气渐退，壬水为用。', '丙戌': '火土燥烈，甲木疏土。',
    '丙亥': '杀印相生，甲木为尊。', '丙子': '一阳复来，壬水为用。', '丙丑': '土重晦光，甲木疏土。',
    // 丁火
    '丁寅': '甲木庚金，劈甲引丁。', '丁卯': '湿木伤丁，先庚后甲。', '丁辰': '土重晦光，甲木疏土。',
    '丁巳': '火炎土燥，壬水为用。', '丁午': '火炎土燥，壬水为用，庚金佐之。', '丁未': '火土燥烈，甲木疏土。',
    '丁申': '火气渐退，甲木庚金。', '丁酉': '火气渐退，甲木庚金。', '丁戌': '火土燥烈，甲木疏土。',
    '丁亥': '杀印相生，甲木为尊。', '丁子': '杀印相生，甲木为尊。', '丁丑': '土重晦光，甲木疏土。',
    // 戊土
    '戊寅': '先丙后甲，癸水次之。', '戊卯': '先丙后甲，癸水次之。', '戊辰': '先甲后癸，丙火次之。',
    '戊巳': '火炎土燥，先甲后癸。', '戊午': '火炎土燥，先壬后甲。', '戊未': '火土燥烈，先癸后丙。',
    '戊申': '土虚金实，先丙后癸。', '戊酉': '土虚金实，先丙后癸。', '戊戌': '土厚水藏，先甲后壬。',
    '戊亥': '财滋弱杀，先甲后丙。', '戊子': '财滋弱杀，先丙后甲。', '戊丑': '寒土向阳，先丙后甲。',
    // 己土
    '己寅': '先丙后甲，癸水次之。', '己卯': '先丙后甲，癸水次之。', '己辰': '先丙后甲，癸水次之。',
    '己巳': '火炎土燥，先癸后丙。', '己午': '火炎土燥，先癸后丙。', '己未': '火土燥烈，先癸后丙。',
    '己申': '土虚金实，先丙后癸。', '己酉': '土虚金实，先丙后癸。', '己戌': '土厚水藏，先甲后丙。',
    '己亥': '财滋弱杀，先丙后甲。', '己子': '财滋弱杀，先丙后甲。', '己丑': '寒土向阳，先丙后甲。',
    // 庚金
    '庚寅': '先丙后甲，丁火次之。', '庚卯': '先丙后丁，甲木次之。', '庚辰': '先甲后丁，壬水次之。',
    '庚巳': '先壬后戊，丙火次之。', '庚午': '先壬后癸，庚金次之。', '庚未': '先丁后甲，壬水次之。',
    '庚申': '先丁后甲，丙火次之。', '庚酉': '先丁后甲，丙火次之。', '庚戌': '先甲后壬，丁火次之。',
    '庚亥': '金寒水冷，先丙后丁。', '庚子': '金寒水冷，先丙后丁。', '庚丑': '金寒水冷，先丙后丁。',
    // 辛金
    '辛寅': '先壬后甲，庚金次之。', '辛卯': '先壬后甲，庚金次之。', '辛辰': '先壬后甲，丙火次之。',
    '辛巳': '先壬后癸，庚金次之。', '辛午': '先壬后己，癸水次之。', '辛未': '先壬后庚，甲木次之。',
    '辛申': '先壬后甲，戊土次之。', '辛酉': '先壬后甲，丁火次之。', '辛戌': '先壬后甲，丙火次之。',
    '辛亥': '先丙后壬，戊土次之。', '辛子': '先丙后壬，戊土次之。', '辛丑': '先丙后壬，戊土次之。',
    // 壬水
    '壬寅': '先庚后丙，戊土次之。', '壬卯': '先戊后辛，庚金次之。', '壬辰': '先甲后庚，戊土次之。',
    '壬巳': '先壬后辛，庚金次之。', '壬午': '先癸后庚，辛金次之。', '壬未': '先辛后甲，壬水次之。',
    '壬申': '先戊后丁，庚金次之。', '壬酉': '先甲后庚，丙火次之。', '壬戌': '先甲后丙，戊土次之。',
    '壬亥': '先戊后丙，庚金次之。', '壬子': '先戊后丙，庚金次之。', '壬丑': '先丙后丁，甲木次之。',
    // 癸水
    '癸寅': '先辛后丙，庚金次之。', '癸卯': '先庚后辛，乙木次之。', '癸辰': '先丙后辛，甲木次之。',
    '癸巳': '先辛后庚，壬水次之。', '癸午': '先庚后辛，壬水次之。', '癸未': '先庚后辛，壬水次之。',
    '癸申': '先丁后甲，庚金次之。', '癸酉': '先辛后丙，庚金次之。', '癸戌': '先辛后甲，壬水次之。',
    '癸亥': '先丙后辛，戊土次之。', '癸子': '先丙后辛，戊土次之。', '癸丑': '先丙后丁，甲木次之。'
};
// 创建 Tyme 的当日 SolarDay 对象用于判断 "今"
try {
    var todaySolarDay = SolarDay.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate());
} catch (e) {
    var todaySolarDay = null;
}
// 全局：尝试提供农历<->公历的转换工具，暴露在 window 上供其它模块调用
try {
    window.convertLunarToSolar = function (ly, lm, ld) {
        try {
            var isLeap = false;
            if (typeof lm === 'number' && lm < 0) { isLeap = true; lm = Math.abs(lm); }
            // 1) 优先尝试 SolarDay.fromLunar(year, month, day, leapFlag)
            try {
                if (typeof SolarDay !== 'undefined' && typeof SolarDay.fromLunar === 'function') {
                    var sd = SolarDay.fromLunar(ly, lm, ld, isLeap ? 1 : 0);
                    if (sd && typeof sd.getYear === 'function') return { y: sd.getYear(), m: sd.getMonth(), d: sd.getDay() };
                }
            } catch (e) { }
            // 2) 尝试 LunarDay.fromYmd -> getSolarDay
            try {
                if (typeof LunarDay !== 'undefined' && typeof LunarDay.fromYmd === 'function') {
                    var ldObj = LunarDay.fromYmd(ly, lm, ld, isLeap ? 1 : 0);
                    if (ldObj) {
                        if (typeof ldObj.getSolarDay === 'function') {
                            var sd2 = ldObj.getSolarDay();
                            if (sd2 && typeof sd2.getYear === 'function') return { y: sd2.getYear(), m: sd2.getMonth(), d: sd2.getDay() };
                        }
                        try { var s = ldObj.toString(); var mat = s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (mat) return { y: parseInt(mat[1], 10), m: parseInt(mat[2], 10), d: parseInt(mat[3], 10) }; } catch (e) { }
                    }
                }
            } catch (e) { }
            // 3) 尝试 Lunar.fromYmd -> toSolar
            try {
                if (typeof Lunar !== 'undefined' && typeof Lunar.fromYmd === 'function') {
                    var lobj = Lunar.fromYmd(ly, lm, ld, isLeap ? 1 : 0);
                    if (lobj && typeof lobj.toSolar === 'function') {
                        var sd3 = lobj.toSolar();
                        if (sd3 && typeof sd3.getYear === 'function') return { y: sd3.getYear(), m: sd3.getMonth(), d: sd3.getDay() };
                    }
                }
            } catch (e) { }
            // 4) 尝试 SolarDay.fromLunarDay
            try {
                if (typeof SolarDay !== 'undefined' && typeof SolarDay.fromLunarDay === 'function') {
                    var sd4 = SolarDay.fromLunarDay(ly, lm, ld, isLeap ? 1 : 0);
                    if (sd4 && typeof sd4.getYear === 'function') return { y: sd4.getYear(), m: sd4.getMonth(), d: sd4.getDay() };
                }
            } catch (e) { }
            return null;
        } catch (e) { return null; }
    };

    window.convertSolarToLunar = function (sy, sm, sd) {
        try {
            if (typeof SolarDay !== 'undefined' && typeof SolarDay.fromYmd === 'function') {
                var sdObj = SolarDay.fromYmd(sy, sm, sd);
                if (sdObj && typeof sdObj.getLunarDay === 'function') {
                    var ld = sdObj.getLunarDay();
                    var ly = null, lm = null, ldv = null, isLeap = false;
                    try {
                        if (typeof ld.getDay === 'function') ldv = ld.getDay();
                    } catch (e) { }
                    try {
                        if (typeof ld.getLunarMonth === 'function') {
                            var lmObj = ld.getLunarMonth();
                            if (lmObj) {
                                if (typeof lmObj.getMonth === 'function') lm = lmObj.getMonth();
                                if ((lm === null || lm === undefined) && typeof lmObj.getMonthWithLeap === 'function') {
                                    var mm = lmObj.getMonthWithLeap(); if (typeof mm === 'number') { if (mm < 0) { isLeap = true; mm = Math.abs(mm); } lm = mm; }
                                }
                                if (typeof lmObj.isLeap === 'function') { try { isLeap = !!lmObj.isLeap(); } catch (e) { } }
                                if (typeof lmObj.getLeap === 'function') { try { isLeap = !!lmObj.getLeap(); } catch (e) { } }
                            }
                        }
                    } catch (e) { }
                    try { if (typeof ld.getLunarYear === 'function') { var lyObj = ld.getLunarYear(); if (lyObj && typeof lyObj.getYear === 'function') ly = lyObj.getYear(); } } catch (e) { }
                    // fallback: try parse toString
                    if ((ly === null || ly === undefined) || (lm === null || lm === undefined) || (ldv === null || ldv === undefined)) {
                        try { var s = ld.toString(); var mat = s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (mat) { ly = parseInt(mat[1], 10); lm = parseInt(mat[2], 10); ldv = parseInt(mat[3], 10); } } catch (e) { }
                    }
                    if (ly === null || lm === null || ldv === null) return null;
                    if (isLeap) lm = -Math.abs(lm);
                    return { y: ly, m: lm, d: ldv, leap: !!isLeap };
                }
            }
        } catch (e) { }
        // fallback parsing using known toString patterns
        try {
            // no reliable api — return null
            return null;
        } catch (e) { return null; }
    };
} catch (e) { }

// 月历
(function () {
    var weekHeads = [];
    var w = Week.fromIndex(weekStart);
    for (var i = 0; i < 7; i++) {
        weekHeads.push({
            isWeekend: w.getIndex() === 6 || w.getIndex() === 0,
            name: w.getName()
        });
        w = w.next(1);
    }

    var currentMonth = SolarMonth.fromYm(now.getFullYear(), now.getMonth() + 1);
    var month = currentMonth.next(0);

    function updateHolidayCountdown() {
        var now = new Date();
        var year = now.getFullYear();
        var today = SolarDay.fromYmd(year, now.getMonth() + 1, now.getDate());

        // Update calendar date display
        var calendarDateEl = document.getElementById('calendar-date-display');
        if (calendarDateEl) {
            var solarWeek = today.getSolarWeek(weekStart);
            calendarDateEl.innerHTML = today.toString() + ' 星期' + today.getWeek().getName() + ' 第' + (solarWeek.getIndexInYear() + 1) + '周';
        }

        var holiday = LegalHoliday.fromYmd(year, 1, 1);
        //如果今年过完了 就从明年开始
        if (holiday.getDay().isBefore(today)) {
            holiday = LegalHoliday.fromYmd(year + 1, 1, 1);
        }
        while (holiday) {
            if (!holiday.isWork() && holiday.getDay().isAfter(today)) {
                var countdownEl = document.getElementById('holiday-countdown');
                if (countdownEl) {
                    countdownEl.innerHTML = '距离' + holiday.getName() + '假期还有 ' + (holiday.getDay().subtract(today)) + ' 天！';
                }
                break;
            }
            holiday = holiday.next(1);
        }
    }

    window.solarApp = new Vue({
        el: '#demo-solar-month',
        data: {
            month: {
                name: '',
                weeks: []
            },
            weeks: weekHeads
        },
        mounted: function () {
            this.compute();
            updateHolidayCountdown();
        },
        methods: {
            compute: function () {
                var that = this;
                that.month.name = month.toString();

                var weeks = [];
                var monthWeeks = month.getWeeks(weekStart);
                for (var i = 0, j = monthWeeks.length; i < j; i++) {
                    var days = [];
                    var weekDays = monthWeeks[i].getDays();
                    for (var x = 0, y = weekDays.length; x < y; x++) {
                        var solarDay = weekDays[x];
                        var lunarDay = solarDay.getLunarDay();
                        var holiday = solarDay.getLegalHoliday();
                        var weekIndex = solarDay.getWeek().getIndex();
                        var weekend = weekIndex === 6 || weekIndex === 0;
                        if (holiday && holiday.isWork()) {
                            weekend = false;
                        }

                        var text = null;

                        var f = solarDay.getFestival();
                        if (f) {
                            text = f.getName();
                        }

                        f = lunarDay.getFestival();
                        if (f) {
                            text = f.getName();
                        }

                        if (1 === lunarDay.getDay()) {
                            var lunarMonth = lunarDay.getLunarMonth();
                            text = lunarMonth.getName();
                            if (1 === lunarMonth.getMonthWithLeap()) {
                                text = lunarMonth.getLunarYear().getSixtyCycle().getName() + '年' + text;
                            }
                        }

                        var jq = solarDay.getTerm();
                        if (jq && jq.getSolarDay().equals(solarDay)) {
                            text = jq.getName();
                            if (jq.isJie()) {
                                text += ' ' + lunarDay.getMonthSixtyCycle() + '月';
                            }
                        }

                        if (!text) {
                            text = lunarDay.getName() + ' ' + lunarDay.getSixtyCycle();
                        }

                        var phaseDay = solarDay.getPhaseDay();

                        days.push({
                            day: solarDay.getDay(),
                            holiday: holiday ? { isWork: holiday.isWork() } : null,
                            isCurrentMonth: solarDay.getSolarMonth().equals(month),
                            // 只有当日（真实今天）才显示“今”角标；选择某天不应改变该显示
                            isToday: (todaySolarDay && typeof solarDay.equals === 'function') ? solarDay.equals(todaySolarDay) : (solarDay.getDay() === today.getDate() && solarDay.getSolarMonth().equals(SolarMonth.fromYm(today.getFullYear(), today.getMonth() + 1))),
                            isWeekend: weekend,
                            text: text,
                            moon: phaseDay.getDayIndex() === 0,
                            moonIndex: phaseDay.getPhase().getIndex()
                            , solarObj: solarDay
                        });
                    }
                    weeks.push({
                        days: days
                    });
                    that.month.weeks = weeks;
                }
            },
            selectDay: function (d) {
                // d is the day object constructed above and contains solarObj
                try {
                    var sd = d.solarObj;
                    // set global now to selected date (use JS Date from solarObj if available)
                    if (sd && typeof sd.getYear === 'function') {
                        var y = sd.getYear();
                        var m = (typeof sd.getMonth === 'function') ? sd.getMonth() : sd.getSolarMonth && sd.getSolarMonth().getMonth && sd.getSolarMonth().getMonth();
                        var day = sd.getDay();
                        // normalize month number (if library month is 1-12)
                        if (m && m > 0 && m <= 12) {
                            window.now = new Date(y, m - 1, day);
                        } else {
                            window.now = new Date(y, (new Date()).getMonth(), day);
                        }
                    } else if (sd && sd.toString) {
                        // fallback: parse year-month-day from toString()
                        var s = sd.toString();
                        var mat = s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/);
                        if (mat) {
                            window.now = new Date(parseInt(mat[1], 10), parseInt(mat[2], 10) - 1, parseInt(mat[3], 10));
                        }
                    } else {
                        // fallback: use current month + d.day
                        window.now = new Date(currentMonth.getYear().getYear(), currentMonth.getMonth() - 1, d.day);
                    }

                    // centralized loading: use solarApp.loadFromYmd if available so all components update consistently
                    try {
                        var _yy = window.now.getFullYear();
                        var _mm = window.now.getMonth() + 1;
                        var _dd = window.now.getDate();
                        // 强制将顶部公历输入设置为所选日期并触发统一更新（确保点击日历能同步农历/三柱）
                        try {
                            var _syEl = D.getElementById('solar-year');
                            var _smEl = D.getElementById('solar-month');
                            var _sdEl = D.getElementById('solar-day');
                            if (_syEl) _syEl.value = _yy;
                            if (_smEl) _smEl.value = _mm;
                            if (_sdEl) _sdEl.value = _dd;
                            try { console.debug('selectDay forcing top solar inputs', _yy, _mm, _dd); } catch (e) { }

                            // 立即尝试直接填充顶部的农历与三柱（便于在 updateAllFromSolar 失败或库差异时仍能给用户可见结果）
                            try {
                                var _filledImmediate = false;
                                try {
                                    if (typeof SolarDay !== 'undefined' && typeof SolarDay.fromYmd === 'function') {
                                        var _sdobjImmediate = null;
                                        try { _sdobjImmediate = SolarDay.fromYmd(_yy, _mm, _dd); } catch (e) { _sdobjImmediate = null; }
                                        if (_sdobjImmediate && typeof _sdobjImmediate.getLunarDay === 'function') {
                                            try {
                                                var _ldImm = _sdobjImmediate.getLunarDay();
                                                var __ly = null, __lm = null, __ldv = null, __isLeap = false;
                                                try { if (typeof _ldImm.getDay === 'function') __ldv = _ldImm.getDay(); } catch (e) { }
                                                try { if (typeof _ldImm.getDate === 'function' && (__ldv === null || __ldv === undefined)) __ldv = _ldImm.getDate(); } catch (e) { }
                                                try {
                                                    if (typeof _ldImm.getLunarMonth === 'function') {
                                                        var __lmObj = _ldImm.getLunarMonth();
                                                        if (__lmObj) {
                                                            try { if (typeof __lmObj.getMonth === 'function') __lm = __lmObj.getMonth(); } catch (e) { }
                                                            try { if ((__lm === null || __lm === undefined) && typeof __lmObj.getMonthWithLeap === 'function') { var __mmv = __lmObj.getMonthWithLeap(); if (typeof __mmv === 'number') { if (__mmv < 0) { __isLeap = true; __mmv = Math.abs(__mmv); } __lm = __mmv; } } } catch (e) { }
                                                            try { if (typeof __lmObj.isLeap === 'function') __isLeap = !!__lmObj.isLeap(); } catch (e) { }
                                                        }
                                                    }
                                                } catch (e) { }
                                                try { if (typeof _ldImm.getLunarYear === 'function') { var __lyObj = _ldImm.getLunarYear(); if (__lyObj && typeof __lyObj.getYear === 'function') __ly = __lyObj.getYear(); } } catch (e) { }
                                                if ((__ly === null || __ly === undefined) || (__lm === null || __lm === undefined) || (__ldv === null || __ldv === undefined)) {
                                                    try { var __s = _ldImm.toString(); var __mat = __s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (__mat) { __ly = __ly === null || __ly === undefined ? parseInt(__mat[1], 10) : __ly; __lm = __lm === null || __lm === undefined ? parseInt(__mat[2], 10) : __lm; __ldv = __ldv === null || __ldv === undefined ? parseInt(__mat[3], 10) : __ldv; } } catch (e) { }
                                                }
                                                if ((__ly !== null && __ly !== undefined) && (__lm !== null && __lm !== undefined) && (__ldv !== null && __ldv !== undefined)) {
                                                    if (__isLeap) __lm = -Math.abs(__lm);
                                                    try { if (lunarYearEl) lunarYearEl.value = __ly; } catch (e) { }
                                                    try { if (lunarMonthEl) lunarMonthEl.value = __lm; } catch (e) { }
                                                    try { if (lunarDayEl) lunarDayEl.value = __ldv; } catch (e) { }
                                                    _filledImmediate = true;
                                                    try { console.debug('selectDay immediate fill from SolarDay.getLunarDay', __ly, __lm, __ldv); } catch (e) { }
                                                }
                                                try {
                                                    if (_ldImm && typeof _ldImm.getThreePillars === 'function') {
                                                        var _threeImm = _ldImm.getThreePillars();
                                                        try { if (pillarYearEl) pillarYearEl.value = (_threeImm.getYear() && _threeImm.getYear().toString()) || ''; } catch (e) { }
                                                        try { if (pillarMonthEl) pillarMonthEl.value = (_threeImm.getMonth() && _threeImm.getMonth().toString()) || ''; } catch (e) { }
                                                        try { if (pillarDayEl) pillarDayEl.value = (_threeImm.getDay() && _threeImm.getDay().toString()) || ''; } catch (e) { }
                                                        _filledImmediate = true;
                                                        try { console.debug('selectDay immediate three pillars from ldImm', _threeImm); } catch (e) { }
                                                    }
                                                } catch (e) { console.warn('selectDay immediate three pillars extraction failed', e); }
                                            } catch (e) { console.warn('selectDay immediate extract from sd failed', e); }
                                        }
                                    }
                                } catch (e) { console.warn('selectDay immediate SolarDay attempt failed', e); }
                                if (!_filledImmediate) {
                                    try { console.debug('selectDay immediate: library did not provide lunar/three immediately'); } catch (e) { }
                                }
                            } catch (e) { console.warn('selectDay immediate fill outer failed', e); }

                            if (typeof updateAllFromSolar === 'function') {
                                try { updateAllFromSolar(_yy, _mm, _dd); } catch (e) { console.warn('updateAllFromSolar failed from selectDay', e); }
                            }
                        } catch (e) { console.warn('selectDay force-set solar inputs failed', e); }
                        // update top inputs
                        try {
                            var yEl = D.getElementById('solar-year');
                            var mEl = D.getElementById('solar-month');
                            var dEl = D.getElementById('solar-day');
                            // respect calendar-type: if top selector is 农历, convert solar->lunar and set inputs to lunar values
                            try {
                                var calEl = D.getElementById('calendar-type');
                                var ct = calEl ? (calEl.value + '') : 'solar';
                                if (ct === 'lunar') {
                                    try {
                                        var _sdobj = SolarDay.fromYmd(_yy, _mm, _dd);
                                        if (_sdobj && typeof _sdobj.getLunarDay === 'function') {
                                            var _ld = _sdobj.getLunarDay();
                                            // 点击日历时立即填充顶部农历与三柱，确保用户可见初始化值
                                            try {
                                                var _ly = null, _lm = null, _ldv = null, _isLeap = false;
                                                try { if (typeof _ld.getDay === 'function') _ldv = _ld.getDay(); } catch (e) { }
                                                try { if (typeof _ld.getDate === 'function' && (_ldv === null || _ldv === undefined)) _ldv = _ld.getDate(); } catch (e) { }
                                                try {
                                                    if (typeof _ld.getLunarMonth === 'function') {
                                                        var _lmObj = _ld.getLunarMonth();
                                                        if (_lmObj) {
                                                            if (typeof _lmObj.getMonth === 'function') _lm = _lmObj.getMonth();
                                                            if ((_lm === null || _lm === undefined) && typeof _lmObj.getMonthWithLeap === 'function') {
                                                                var _mmv = _lmObj.getMonthWithLeap(); if (typeof _mmv === 'number') { if (_mmv < 0) { _isLeap = true; _mmv = Math.abs(_mmv); } _lm = _mmv; }
                                                            }
                                                            if (typeof _lmObj.isLeap === 'function') { try { if (_lmObj.isLeap()) _isLeap = true; } catch (e) { } }
                                                            if (typeof _lmObj.getLeap === 'function') { try { if (_lmObj.getLeap()) _isLeap = true; } catch (e) { } }
                                                        }
                                                    }
                                                } catch (e) { }
                                                try { if (typeof _ld.getLunarYear === 'function') { var _lyObj = _ld.getLunarYear(); if (_lyObj && typeof _lyObj.getYear === 'function') _ly = _lyObj.getYear(); } } catch (e) { }
                                                // fallback from toString
                                                if ((_ly === null || _ly === undefined) || (_lm === null || _lm === undefined) || (_ldv === null || _ldv === undefined)) {
                                                    try { var _s = _ld.toString(); var _mat = _s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (_mat) { _ly = _ly === null || _ly === undefined ? parseInt(_mat[1], 10) : _ly; _lm = _lm === null || _lm === undefined ? parseInt(_mat[2], 10) : _lm; _ldv = _ldv === null || _ldv === undefined ? parseInt(_mat[3], 10) : _ldv; } } catch (e) { }
                                                }
                                                if ((_ly !== null && _ly !== undefined) && (_lm !== null && _lm !== undefined) && (_ldv !== null && _ldv !== undefined)) {
                                                    if (_isLeap) _lm = -Math.abs(_lm);
                                                    try { var yElTop = D.getElementById('lunar-year'); if (yElTop) yElTop.value = _ly; } catch (e) { }
                                                    try { var mElTop = D.getElementById('lunar-month'); if (mElTop) mElTop.value = _lm; } catch (e) { }
                                                    try { var dElTop = D.getElementById('lunar-day'); if (dElTop) dElTop.value = _ldv; } catch (e) { }
                                                }
                                                try {
                                                    if (_ld && typeof _ld.getThreePillars === 'function') {
                                                        var _three = _ld.getThreePillars();
                                                        try { var pyEl = D.getElementById('pillar-year'); if (pyEl) pyEl.value = (_three.getYear() && _three.getYear().toString()) || ''; } catch (e) { }
                                                        try { var pmEl = D.getElementById('pillar-month'); if (pmEl) pmEl.value = (_three.getMonth() && _three.getMonth().toString()) || ''; } catch (e) { }
                                                        try { var pdEl = D.getElementById('pillar-day'); if (pdEl) pdEl.value = (_three.getDay() && _three.getDay().toString()) || ''; } catch (e) { }
                                                    }
                                                } catch (e) { console.warn('selectDay fill three pillars failed', e); }
                                            } catch (e) { console.warn('selectDay fill lunar failed', e); }
                                            try { if (typeof _ld.getDay === 'function') _ldv = _ld.getDay(); } catch (e) { }
                                            try {
                                                if (typeof _ld.getLunarMonth === 'function') {
                                                    var _lmObj = _ld.getLunarMonth();
                                                    if (_lmObj) {
                                                        if (typeof _lmObj.getMonth === 'function') _lm = _lmObj.getMonth();
                                                        if ((_lm === null || _lm === undefined) && typeof _lmObj.getMonthWithLeap === 'function') {
                                                            var _mmv = _lmObj.getMonthWithLeap(); if (typeof _mmv === 'number') { if (_mmv < 0) { _isLeap = true; _mmv = Math.abs(_mmv); } _lm = _mmv; }
                                                        }
                                                        if (typeof _lmObj.isLeap === 'function') { try { if (_lmObj.isLeap()) _isLeap = true; } catch (e) { } }
                                                        if (typeof _lmObj.getLeap === 'function') { try { if (_lmObj.getLeap()) _isLeap = true; } catch (e) { } }
                                                    }
                                                }
                                            } catch (e) { }
                                            try { if (typeof _ld.getLunarYear === 'function') { var _lyObj = _ld.getLunarYear(); if (_lyObj && typeof _lyObj.getYear === 'function') _ly = _lyObj.getYear(); } } catch (e) { }
                                            if ((_ly === null || _ly === undefined) || (_lm === null || _lm === undefined) || (_ldv === null || _ldv === undefined)) {
                                                try { var _s = _ld.toString(); var _mat = _s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (_mat) { _ly = _ly === null || _ly === undefined ? parseInt(_mat[1], 10) : _ly; _lm = _lm === null || _lm === undefined ? parseInt(_mat[2], 10) : _lm; _ldv = _ldv === null || _ldv === undefined ? parseInt(_mat[3], 10) : _ldv; } } catch (e) { }
                                            }
                                            if ((_ly !== null && _ly !== undefined) && (_lm !== null && _lm !== undefined) && (_ldv !== null && _ldv !== undefined)) {
                                                if (_isLeap) _lm = -Math.abs(_lm);
                                                if (yEl) yEl.value = _ly;
                                                if (mEl) mEl.value = _lm;
                                                if (dEl) dEl.value = _ldv;
                                            } else {
                                                if (yEl) yEl.value = _yy;
                                                if (mEl) mEl.value = _mm;
                                                if (dEl) dEl.value = _dd;
                                            }
                                        } else {
                                            if (yEl) yEl.value = _yy;
                                            if (mEl) mEl.value = _mm;
                                            if (dEl) dEl.value = _dd;
                                        }
                                    } catch (e) {
                                        if (yEl) yEl.value = _yy;
                                        if (mEl) mEl.value = _mm;
                                        if (dEl) dEl.value = _dd;
                                    }
                                    try { if (window.eightCharApp) window.eightCharApp.calendarType = ct; } catch (e) { }
                                } else {
                                    if (yEl) yEl.value = _yy;
                                    if (mEl) mEl.value = _mm;
                                    if (dEl) dEl.value = _dd;
                                }
                                try { if (window.eightCharApp) window.eightCharApp.calendarType = ct; } catch (e) { }
                            } catch (e) {
                                if (yEl) yEl.value = _yy;
                                if (mEl) mEl.value = _mm;
                                if (dEl) dEl.value = _dd;
                            }
                        } catch (e) { }

                        if (this.loadFromYmd && typeof this.loadFromYmd === 'function') {
                            this.loadFromYmd(_yy, _mm, _dd);
                            try { if (typeof updateAllFromSolar === 'function') updateAllFromSolar(_yy, _mm, _dd); } catch (e) { }
                        } else if (window.solarApp && typeof window.solarApp.loadFromYmd === 'function') {
                            window.solarApp.loadFromYmd(_yy, _mm, _dd);
                            try {
                                if (typeof updateAllFromSolar === 'function') {
                                    try {
                                        updateAllFromSolar(_yy, _mm, _dd);
                                    } catch (e) {
                                        console.warn('updateAllFromSolar threw in selectDay', e);
                                    }
                                }
                            } catch (e) { console.error('selectDay updateAllFromSolar wrapper error', e); }
                        } else {
                            currentMonth = SolarMonth.fromYm(_yy, _mm);
                            month = currentMonth.next(0);
                            this.compute();
                            try { if (window.huangliSetSolarDay) window.huangliSetSolarDay(SolarDay.fromYmd(_yy, _mm, _dd)); } catch (e) { }
                            try { if (window.eightCharApp && typeof window.eightCharApp.setFromYmd === 'function') window.eightCharApp.setFromYmd(_yy, _mm, _dd); } catch (e) { }
                            try { if (typeof updateAllFromSolar === 'function') updateAllFromSolar(_yy, _mm, _dd); } catch (e) { }
                        }
                    } catch (e) { console.error('selectDay loader error', e); }
                } catch (e) {
                    console.error('selectDay error', e);
                }
                updateHolidayCountdown();
            },
            prevMonth: function () {
                month = month.next(-1);
                this.compute();
                updateHolidayCountdown();
            },
            nextMonth: function () {
                month = month.next(1);
                this.compute();
                updateHolidayCountdown();
            }
            ,
            // load calendar by year/month/day: sets selection, updates calendar, and notifies other components
            loadFromYmd: function (y, m, d) {
                try {
                    if (!y || !m || !d) return;
                    // set global now and selectedDate
                    try { window.selectedDate = { y: y, m: m, d: d }; } catch (e) { }
                    window.now = new Date(y, m - 1, d);
                    // update month objects and recompute calendar
                    currentMonth = SolarMonth.fromYm(y, m);
                    month = currentMonth.next(0);
                    this.compute();
                    // update top query inputs if present (respect calendar-type)
                    try {
                        var yEl = D.getElementById('solar-year');
                        var mEl = D.getElementById('solar-month');
                        var dEl = D.getElementById('solar-day');
                        try {
                            var calEl = D.getElementById('calendar-type');
                            var ct = calEl ? (calEl.value + '') : 'solar';
                            if (ct === 'lunar') {
                                try {
                                    var _sdobj2 = SolarDay.fromYmd(y, m, d);
                                    if (_sdobj2 && typeof _sdobj2.getLunarDay === 'function') {
                                        var _ld2 = _sdobj2.getLunarDay();
                                        var _ly2 = null, _lm2 = null, _ldv2 = null, _isLeap2 = false;
                                        try { if (typeof _ld2.getDay === 'function') _ldv2 = _ld2.getDay(); } catch (e) { }
                                        try {
                                            if (typeof _ld2.getLunarMonth === 'function') {
                                                var _lmObj2 = _ld2.getLunarMonth();
                                                if (_lmObj2) {
                                                    if (typeof _lmObj2.getMonth === 'function') _lm2 = _lmObj2.getMonth();
                                                    if ((_lm2 === null || _lm2 === undefined) && typeof _lmObj2.getMonthWithLeap === 'function') {
                                                        var _mmv2 = _lmObj2.getMonthWithLeap(); if (typeof _mmv2 === 'number') { if (_mmv2 < 0) { _isLeap2 = true; _mmv2 = Math.abs(_mmv2); } _lm2 = _mmv2; }
                                                    }
                                                    if (typeof _lmObj2.isLeap === 'function') { try { if (_lmObj2.isLeap()) _isLeap2 = true; } catch (e) { } }
                                                    if (typeof _lmObj2.getLeap === 'function') { try { if (_lmObj2.getLeap()) _isLeap2 = true; } catch (e) { } }
                                                }
                                            }
                                        } catch (e) { }
                                        try { if (typeof _ld2.getLunarYear === 'function') { var _lyObj2 = _ld2.getLunarYear(); if (_lyObj2 && typeof _lyObj2.getYear === 'function') _ly2 = _lyObj2.getYear(); } } catch (e) { }
                                        if ((_ly2 === null || _ly2 === undefined) || (_lm2 === null || _lm2 === undefined) || (_ldv2 === null || _ldv2 === undefined)) {
                                            try { var _s2 = _ld2.toString(); var _mat2 = _s2.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (_mat2) { _ly2 = _ly2 === null || _ly2 === undefined ? parseInt(_mat2[1], 10) : _ly2; _lm2 = _lm2 === null || _lm2 === undefined ? parseInt(_mat2[2], 10) : _lm2; _ldv2 = _ldv2 === null || _ldv2 === undefined ? parseInt(_mat2[3], 10) : _ldv2; } } catch (e) { }
                                        }
                                        if ((_ly2 !== null && _ly2 !== undefined) && (_lm2 !== null && _lm2 !== undefined) && (_ldv2 !== null && _ldv2 !== undefined)) {
                                            if (_isLeap2) _lm2 = -Math.abs(_lm2);
                                            if (yEl) yEl.value = _ly2;
                                            if (mEl) mEl.value = _lm2;
                                            if (dEl) dEl.value = _ldv2;
                                        } else {
                                            if (yEl) yEl.value = y;
                                            if (mEl) mEl.value = m;
                                            if (dEl) dEl.value = d;
                                        }
                                    } else {
                                        if (yEl) yEl.value = y;
                                        if (mEl) mEl.value = m;
                                        if (dEl) dEl.value = d;
                                    }
                                } catch (e) {
                                    if (yEl) yEl.value = y;
                                    if (mEl) mEl.value = m;
                                    if (dEl) dEl.value = d;
                                }
                            } else {
                                if (yEl) yEl.value = y;
                                if (mEl) mEl.value = m;
                                if (dEl) dEl.value = d;
                            }
                            try { if (window.eightCharApp) window.eightCharApp.calendarType = ct; } catch (e) { }
                        } catch (e) {
                            if (yEl) yEl.value = y;
                            if (mEl) mEl.value = m;
                            if (dEl) dEl.value = d;
                        }
                    } catch (e) { }
                    // notify huangli and eight-char
                    try { if (window.huangliSetSolarDay) window.huangliSetSolarDay(SolarDay.fromYmd(y, m, d)); } catch (e) { }
                    try { if (window.eightCharApp && typeof window.eightCharApp.setFromYmd === 'function') window.eightCharApp.setFromYmd(y, m, d); } catch (e) { }
                } catch (e) { console.error('loadFromYmd error', e); }
            }
            ,
            // determine whether a day should be shown as selected
            isDaySelected: function (d) {
                try {
                    if (!d) return false;
                    // if compute() already marked it, honor that
                    if (d.isSelected) return true;
                    // prefer explicit window.selectedDate (set by inputs or other interactions)
                    if (!window.selectedDate) return false;

                    var sd = d.solarObj;
                    var y = null, m = null, day = null;
                    if (sd) {
                        if (typeof sd.getYear === 'function') y = sd.getYear();
                        if (typeof sd.getMonth === 'function') m = sd.getMonth();
                        if (typeof sd.getDay === 'function') day = sd.getDay();
                        // fallbacks when methods are on solarMonth
                        if ((y === null || m === null) && sd.getSolarMonth) {
                            try {
                                var sm = sd.getSolarMonth();
                                if (sm && typeof sm.getYear === 'function') {
                                    var yobj = sm.getYear();
                                    if (yobj && typeof yobj.getYear === 'function') y = yobj.getYear();
                                }
                                if (sm && typeof sm.getMonth === 'function') m = sm.getMonth();
                            } catch (e) { }
                        }
                    }
                    if (day === null) day = d.day;
                    if (y === null || m === null || day === null) return false;
                    return (window.selectedDate.y === y && window.selectedDate.m === m && window.selectedDate.d === day);
                } catch (e) { return false; }
            }
        }
    });
    D.getElementById('demo-solar-month').style.display = 'block';
    // global convenience wrappers
    try {
        window.loadCalendar = function (y, m, d) {
            try { if (window.solarApp && typeof window.solarApp.loadFromYmd === 'function') return window.solarApp.loadFromYmd(y, m, d); } catch (e) { }
            try { window.selectedDate = { y: y, m: m, d: d }; window.now = new Date(y, m - 1, d); currentMonth = SolarMonth.fromYm(y, m); month = currentMonth.next(0); if (window.solarApp) window.solarApp.compute(); } catch (e) { }
        };
        window.loadHuangli = function (y, m, d) {
            try { if (window.huangliApp && typeof window.huangliApp.loadFromYmd === 'function') return window.huangliApp.loadFromYmd(y, m, d); } catch (e) { }
            try { if (window.huangliSetSolarDay) return window.huangliSetSolarDay(SolarDay.fromYmd(y, m, d)); } catch (e) { }
        };
    } catch (e) { }
})();

// wire up new three-row input area (lunar / 四柱 / solar)
(function () {
    try {
        var D = document;
        var lunarYearEl = D.getElementById('lunar-year');
        var lunarMonthEl = D.getElementById('lunar-month');
        var lunarDayEl = D.getElementById('lunar-day');

        var pillarYearEl = D.getElementById('pillar-year');
        var pillarMonthEl = D.getElementById('pillar-month');
        var pillarDayEl = D.getElementById('pillar-day');

        var solarYearEl = D.getElementById('solar-year');
        var solarMonthEl = D.getElementById('solar-month');
        var solarDayEl = D.getElementById('solar-day');
        var btnToday = D.getElementById('btn-today');
        // 八字区下面的公历输入（新添加）
        var eightSolarYearEl = D.getElementById('eight-solar-year');
        var eightSolarMonthEl = D.getElementById('eight-solar-month');
        var eightSolarDayEl = D.getElementById('eight-solar-day');
        var eightSolarApplyBtn = D.getElementById('eight-solar-apply');

        function parseSolarInputs() {
            try {
                var ys = (solarYearEl.value || '').toString().trim();
                var ms = (solarMonthEl.value || '').toString().trim();
                var ds = (solarDayEl.value || '').toString().trim();
                if (ys === '' || ms === '' || ds === '') return null;
                var y = parseInt(ys, 10), m = parseInt(ms, 10), d = parseInt(ds, 10);
                if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
                if (m < 1 || m > 12) return null;
                var dd = new Date(y, m, 0).getDate();
                if (d < 1 || d > dd) return null;
                return { y: y, m: m, d: d };
            } catch (e) { return null; }
        }

        function parseLunarInputs() {
            try {
                var ys = (lunarYearEl.value || '').toString().trim();
                var ms = (lunarMonthEl.value || '').toString().trim();
                var ds = (lunarDayEl.value || '').toString().trim();
                if (ys === '' || ms === '' || ds === '') return null;
                var y = parseInt(ys, 10), m = parseInt(ms, 10), d = parseInt(ds, 10);
                if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
                var absM = Math.abs(m);
                if (absM < 1 || absM > 12) return null;
                return { y: y, m: m, d: d };
            } catch (e) { return null; }
        }

        function parsePillarsInputs() {
            try {
                var py = (pillarYearEl.value || '').toString().trim();
                var pm = (pillarMonthEl.value || '').toString().trim();
                var pd = (pillarDayEl.value || '').toString().trim();
                if (py === '' || pm === '' || pd === '') return null;
                return { y: py, m: pm, d: pd };
            } catch (e) { return null; }
        }

        window.updateAllFromSolar = function (y, m, d) {
            try {
                try { console.debug('updateAllFromSolar (library-only)', y, m, d); } catch (e) { }
                try { window.selectedDate = { y: y, m: m, d: d }; } catch (e) { }
                window.now = new Date(y, m - 1, d);
                try { if (window.solarApp && typeof window.solarApp.loadFromYmd === 'function') window.solarApp.loadFromYmd(y, m, d); } catch (e) { }
                try { if (window.huangliSetSolarDay) window.huangliSetSolarDay(SolarDay.fromYmd(y, m, d)); } catch (e) { }
                try { if (window.eightCharApp && typeof window.eightCharApp.setFromYmd === 'function') window.eightCharApp.setFromYmd(y, m, d); } catch (e) { }

                try { if (solarYearEl) solarYearEl.value = y; if (solarMonthEl) solarMonthEl.value = m; if (solarDayEl) solarDayEl.value = d; } catch (e) { }

                // 使用日历库的 API：SolarDay.fromYmd -> getLunarDay -> getThreePillars
                try {
                    var sd = null;
                    try { if (typeof SolarDay !== 'undefined' && typeof SolarDay.fromYmd === 'function') sd = SolarDay.fromYmd(y, m, d); } catch (e) { sd = null; }

                    if (sd && typeof sd.getLunarDay === 'function') {
                        var ld = null;
                        try { ld = sd.getLunarDay(); } catch (e) { ld = null; }

                        // 提取农历年/月/日
                        var ly = null, lm = null, ldv = null, isLeap = false;
                        try {
                            if (ld) {
                                if (typeof ld.getLunarYear === 'function') {
                                    try { var lyObj = ld.getLunarYear(); if (lyObj && typeof lyObj.getYear === 'function') ly = lyObj.getYear(); } catch (e) { }
                                }
                                if (ly === null && typeof ld.getYear === 'function') try { ly = ld.getYear(); } catch (e) { }

                                if (typeof ld.getLunarMonth === 'function') {
                                    try { var lmObj = ld.getLunarMonth(); if (lmObj) { if (typeof lmObj.getMonth === 'function') lm = lmObj.getMonth(); if (typeof lmObj.isLeap === 'function' && lmObj.isLeap()) isLeap = true; } } catch (e) { }
                                }
                                if (lm === null && typeof ld.getMonth === 'function') try { lm = ld.getMonth(); } catch (e) { }

                                if (typeof ld.getDay === 'function') try { ldv = ld.getDay(); } catch (e) { }
                                if ((ldv === null || ldv === undefined) && typeof ld.getDate === 'function') try { ldv = ld.getDate(); } catch (e) { }
                            }
                        } catch (e) { console.warn('extract lunar numeric failed', e); }

                        if (ly !== null && lm !== null && ldv !== null) {
                            if (isLeap) lm = -Math.abs(lm);
                            try { if (lunarYearEl) lunarYearEl.value = ly; } catch (e) { }
                            try { if (lunarMonthEl) lunarMonthEl.value = lm; } catch (e) { }
                            try { if (lunarDayEl) lunarDayEl.value = ldv; } catch (e) { }
                            try { console.debug('updateAllFromSolar wrote lunar via library', ly, lm, ldv, 'leap:', !!isLeap); } catch (e) { }
                        } else {
                            try { if (lunarYearEl) lunarYearEl.value = ''; if (lunarMonthEl) lunarMonthEl.value = ''; if (lunarDayEl) lunarDayEl.value = ''; } catch (e) { }
                        }

                        // 三柱
                        try {
                            if (ld && typeof ld.getThreePillars === 'function') {
                                var three = ld.getThreePillars();
                                try { if (pillarYearEl) pillarYearEl.value = (three.getYear && three.getYear().toString()) || ''; } catch (e) { }
                                try { if (pillarMonthEl) pillarMonthEl.value = (three.getMonth && three.getMonth().toString()) || ''; } catch (e) { }
                                try { if (pillarDayEl) pillarDayEl.value = (three.getDay && three.getDay().toString()) || ''; } catch (e) { }
                                try { console.debug('updateAllFromSolar wrote three pillars via library', three); } catch (e) { }
                            } else {
                                try { if (pillarYearEl) pillarYearEl.value = ''; if (pillarMonthEl) pillarMonthEl.value = ''; if (pillarDayEl) pillarDayEl.value = ''; } catch (e) { }
                            }
                        } catch (e) { console.warn('three pillars extraction error', e); }
                    } else {
                        // 无法通过库获取：清空显示以提示不可用（但不使用自定义回退）
                        try { if (lunarYearEl) lunarYearEl.value = ''; if (lunarMonthEl) lunarMonthEl.value = ''; if (lunarDayEl) lunarDayEl.value = ''; } catch (e) { }
                        try { if (pillarYearEl) pillarYearEl.value = ''; if (pillarMonthEl) pillarMonthEl.value = ''; if (pillarDayEl) pillarDayEl.value = ''; } catch (e) { }
                        try { console.debug('updateAllFromSolar: library methods not available for this date'); } catch (e) { }
                    }
                } catch (e) { console.error('updateAllFromSolar library-only failed', e); }
            } catch (e) { console.error('updateAllFromSolar error', e); }

            // Trigger config application (re-calc TST if enabled)
            try { if (typeof window.applyBaziConfig === 'function') window.applyBaziConfig(); } catch (e) { }
        }

            // 配置栏同步逻辑
            ; (function initConfigSync() {
                try {
                    var cfgHour = document.getElementById('cfg-hour');
                    var cfgMinute = document.getElementById('cfg-minute');
                    var cfgSecond = document.getElementById('cfg-second');
                    var cfgProvider = document.getElementById('cfg-provider');
                    var cfgChildLimit = document.getElementById('cfg-child-limit');
                    var cfgGenderInputs = document.querySelectorAll('input[name="cfg-gender"]');
                    var btnApplyConfig = document.getElementById('btn-apply-config');

                    // True Solar Time Elements
                    var cfgTrueSolarEnable = document.getElementById('cfg-true-solar-enable');
                    var cfgLocationBox = document.getElementById('cfg-location-box');
                    var cfgProvince = document.getElementById('cfg-province');
                    var cfgCity = document.getElementById('cfg-city');
                    var cfgDistrict = document.getElementById('cfg-district');
                    var cfgTrueSolarDisplay = document.getElementById('cfg-true-solar-display');

                    // 初始化默认值
                    if (cfgHour) cfgHour.value = now.getHours();
                    if (cfgMinute) cfgMinute.value = now.getMinutes();
                    if (cfgSecond) cfgSecond.value = now.getSeconds();

                    // --- Location Data Handling ---
                    var selectedLng = null;

                    function populateSelect(el, data, defaultText) {
                        el.innerHTML = '<option value="">' + defaultText + '</option>';
                        if (!data) return;
                        data.forEach(function (item) {
                            var opt = document.createElement('option');
                            opt.value = item.area_id;
                            opt.textContent = item.name;
                            opt.dataset.lng = item.lng;
                            el.appendChild(opt);
                        });
                    }

                    function onProvinceChange() {
                        var pid = cfgProvince.value;
                        var pData = window.JW_DATA ? window.JW_DATA.find(function (p) { return p.area_id === pid; }) : null;
                        populateSelect(cfgCity, pData ? pData.children : [], '市/区');
                        populateSelect(cfgDistrict, [], '区/县');
                        updateTrueSolarDisplay();
                    }

                    function onCityChange() {
                        var pid = cfgProvince.value;
                        var cid = cfgCity.value;
                        var pData = window.JW_DATA ? window.JW_DATA.find(function (p) { return p.area_id === pid; }) : null;
                        var cData = pData ? pData.children.find(function (c) { return c.area_id === cid; }) : null;
                        populateSelect(cfgDistrict, cData ? cData.children : [], '区/县');
                        updateTrueSolarDisplay();
                    }

                    function onDistrictChange() {
                        var opt = cfgDistrict.options[cfgDistrict.selectedIndex];
                        if (opt && opt.value) {
                            selectedLng = parseFloat(opt.dataset.lng);
                        } else {
                            // Fallback to city or province lng if available
                            var cOpt = cfgCity.options[cfgCity.selectedIndex];
                            if (cOpt && cOpt.value) selectedLng = parseFloat(cOpt.dataset.lng);
                            else {
                                var pOpt = cfgProvince.options[cfgProvince.selectedIndex];
                                if (pOpt && pOpt.value) selectedLng = parseFloat(pOpt.dataset.lng);
                                else selectedLng = null;
                            }
                        }
                        updateTrueSolarDisplay();
                    }

                    function updateTrueSolarDisplay() {
                        if (!cfgTrueSolarEnable.checked) {
                            cfgTrueSolarDisplay.style.display = 'none';
                            return;
                        }

                        // 只要启用，就显示容器
                        cfgTrueSolarDisplay.style.display = 'flex';

                        if (!selectedLng) {
                            cfgTrueSolarDisplay.textContent = '请选择出生地以计算真太阳时';
                            cfgTrueSolarDisplay.style.color = '#94a3b8'; // 灰色提示
                            cfgTrueSolarDisplay.style.borderStyle = 'dashed';
                            return;
                        }

                        var h = parseInt(cfgHour.value) || 0;
                        var m = parseInt(cfgMinute.value) || 0;
                        var s = parseInt(cfgSecond.value) || 0;
                        // Construct a date object for today with input time
                        var baseDate = new Date(window.now.getFullYear(), window.now.getMonth(), window.now.getDate(), h, m, s);
                        var tst = getTrueSolarDate(baseDate, selectedLng);
                        var pad = function (n) { return n < 10 ? '0' + n : n; };

                        cfgTrueSolarDisplay.textContent = '真太阳时: ' + pad(tst.getHours()) + ':' + pad(tst.getMinutes()) + ':' + pad(tst.getSeconds());
                        cfgTrueSolarDisplay.style.color = '#4e5dff'; // 品牌色
                        cfgTrueSolarDisplay.style.borderStyle = 'solid';
                    }

                    // Init Data
                    function initLocationData() {
                        if (window.JW_DATA) {
                            populateSelect(cfgProvince, window.JW_DATA, '省/市');
                        }
                    }
                    if (window.JW_DATA) initLocationData();
                    window.addEventListener('jw_data_loaded', initLocationData);

                    // Event Listeners
                    if (cfgTrueSolarEnable) {
                        cfgTrueSolarEnable.addEventListener('change', function () {
                            cfgLocationBox.style.display = this.checked ? 'flex' : 'none';
                            if (!this.checked) {
                                cfgTrueSolarDisplay.style.display = 'none';
                            }
                            updateTrueSolarDisplay();
                        });
                    }
                    if (cfgProvince) cfgProvince.addEventListener('change', onProvinceChange);
                    if (cfgCity) cfgCity.addEventListener('change', onCityChange);
                    if (cfgDistrict) cfgDistrict.addEventListener('change', onDistrictChange);

                    // Update display when time inputs change
                    [cfgHour, cfgMinute, cfgSecond].forEach(function (el) {
                        if (el) el.addEventListener('input', updateTrueSolarDisplay);
                    });

                    // Initialize state on load (in case browser cached checkbox state)
                    if (cfgTrueSolarEnable && cfgTrueSolarEnable.checked) {
                        cfgLocationBox.style.display = 'flex';
                        updateTrueSolarDisplay();
                    }


                    // 应用配置到 eightCharApp
                    function applyConfig() {
                        if (!window.eightCharApp) return;

                        var hour = parseInt(cfgHour.value) || 0;
                        var minute = parseInt(cfgMinute.value) || 0;
                        var second = parseInt(cfgSecond.value) || 0;
                        var gender = document.querySelector('input[name="cfg-gender"]:checked').value;
                        var provider = cfgProvider.value;
                        var childLimit = cfgChildLimit.value;

                        // Force calendar type to solar to ensure display values are interpreted correctly
                        window.eightCharApp.calendarType = 'solar';

                        // Calculate True Solar Time if enabled
                        if (cfgTrueSolarEnable && cfgTrueSolarEnable.checked && selectedLng) {
                            // Use window.now for the date part, but input time for time part
                            var baseDate = new Date(window.now.getFullYear(), window.now.getMonth(), window.now.getDate(), hour, minute, second);
                            var tst = getTrueSolarDate(baseDate, selectedLng);

                            // Update app with TST (including date, as TST might cross midnight)
                            window.eightCharApp.solar.year = tst.getFullYear();
                            window.eightCharApp.solar.month = tst.getMonth() + 1;
                            window.eightCharApp.solar.day = tst.getDate();
                            window.eightCharApp.solar.hour = tst.getHours();
                            window.eightCharApp.solar.minute = tst.getMinutes();
                            window.eightCharApp.solar.second = tst.getSeconds();

                            // Also update display to reflect the TST date (and prevent overwrite by ensureSolarFromDisplay)
                            window.eightCharApp.display.year = tst.getFullYear();
                            window.eightCharApp.display.month = tst.getMonth() + 1;
                            window.eightCharApp.display.day = tst.getDate();

                            console.log('Applied True Solar Time:', tst.toLocaleString());
                        } else {
                            // Use Standard Time
                            // Reset to selected date and input time
                            window.eightCharApp.solar.year = window.now.getFullYear();
                            window.eightCharApp.solar.month = window.now.getMonth() + 1;
                            window.eightCharApp.solar.day = window.now.getDate();
                            window.eightCharApp.solar.hour = hour;
                            window.eightCharApp.solar.minute = minute;
                            window.eightCharApp.solar.second = second;

                            // Reset display to standard date
                            window.eightCharApp.display.year = window.now.getFullYear();
                            window.eightCharApp.display.month = window.now.getMonth() + 1;
                            window.eightCharApp.display.day = window.now.getDate();
                        }

                        window.eightCharApp.gender = gender;
                        window.eightCharApp.eightCharProvider = provider;
                        window.eightCharApp.childLimitProvider = childLimit;

                        if (typeof window.switchTab === 'function') {
                            // Only switch if this was triggered by a user click (not auto-update)
                            // We can check event type if needed, but for now let's assume if it's called, we might want to update view
                            // But if called from updateAllFromSolar, we might not want to switch tab?
                            // Actually, switchTab('bazi') just ensures the tab is active. If we are already there, it's fine.
                            // If we are in Calendar tab and change date, we probably don't want to jump to Bazi tab automatically?
                            // The original code had switchTab here.
                            // Let's keep it for now, or maybe make it conditional?
                            // For now, I'll leave it as is.
                            // window.switchTab('bazi'); 
                        }
                    }

                    // Expose globally so date changes can trigger re-calc
                    window.applyBaziConfig = applyConfig;

                    // 绑定应用按钮
                    if (btnApplyConfig) {
                        btnApplyConfig.addEventListener('click', function () {
                            applyConfig();
                            if (typeof window.switchTab === 'function') window.switchTab('bazi');
                        });
                    }

                    // 移除自动切换到八字选项卡的逻辑，让用户手动点击"应用设置"或选项卡
                    // setTimeout(function () {
                    //     applyConfig();
                    // }, 500);
                } catch (e) {
                    console.error('Config sync init failed', e);
                }
            })();

        // 标签页切换逻辑
        ; (function initTabs() {
            try {
                var tabItems = document.querySelectorAll('.tab-item');
                var tabPanes = document.querySelectorAll('.tab-pane');

                function switchTab(targetTab) {
                    // 移除所有active类
                    tabItems.forEach(function (item) {
                        item.classList.remove('active');
                    });
                    tabPanes.forEach(function (pane) {
                        pane.classList.remove('active');
                    });

                    // 添加active类到目标tab
                    var targetItem = document.querySelector('.tab-item[data-tab="' + targetTab + '"]');
                    var targetPane = document.getElementById('tab-' + targetTab);

                    if (targetItem && targetPane) {
                        targetItem.classList.add('active');
                        targetPane.classList.add('active');

                        // 滚动到顶部
                        window.scrollTo({ top: 0, behavior: 'smooth' });

                        // Fix chart rendering issue by triggering resize
                        if (targetTab === 'bazi') {
                            setTimeout(function () {
                                window.dispatchEvent(new Event('resize'));
                            }, 50);
                        }
                    }
                }

                window.switchTab = switchTab;

                // 绑定点击事件
                tabItems.forEach(function (item) {
                    item.addEventListener('click', function () {
                        var tabName = this.getAttribute('data-tab');
                        switchTab(tabName);
                    });
                });

                //  console.log('Tab switching initialized');
            } catch (e) {
                console.error('Tab init failed', e);
            }
        })();

        function findSolarByPillars(py, pm, pd) {
            try {
                // 优先使用 ThreePillars 提供的反查（若库有实现）
                try {
                    if (typeof ThreePillars !== 'undefined' && typeof ThreePillars.prototype.getSolarDays === 'function') {
                        try {
                            var yrs = (new Date()).getFullYear();
                            var startY = 1900;
                            var endY = yrs + 5;
                            var tp = new ThreePillars(py, pm, pd);
                            var sdList = tp.getSolarDays(startY, endY);
                            if (sdList && sdList.length) {
                                var first = sdList[sdList.length - 1];
                                try {
                                    if (typeof first.getYear === 'function') return { y: first.getYear(), m: first.getMonth(), d: first.getDay() };
                                    if (typeof first.getFullYear === 'function') return { y: first.getFullYear(), m: first.getMonth(), d: first.getDate() };
                                    if (first.y && first.m && first.d) return { y: first.y, m: first.m, d: first.d };
                                } catch (e) { }
                            }
                        } catch (e) { }
                    }
                } catch (e) { }
                var nowYear = (new Date()).getFullYear();
                var startYear = nowYear - 50;
                var endYear = nowYear + 50;
                for (var y = startYear; y <= endYear; y++) {
                    for (var m = 1; m <= 12; m++) {
                        var days = new Date(y, m, 0).getDate();
                        for (var d = 1; d <= days; d++) {
                            try {
                                var sd = SolarDay.fromYmd(y, m, d);
                                var ld = sd.getLunarDay();
                                var three = ld.getThreePillars();
                                var yy = (three.getYear() && three.getYear().toString()) || '';
                                var mm = (three.getMonth() && three.getMonth().toString()) || '';
                                var dd = (three.getDay() && three.getDay().toString()) || '';
                                if (yy === py && mm === pm && dd === pd) {
                                    return { y: y, m: m, d: d };
                                }
                            } catch (e) { }
                        }
                    }
                }
            } catch (e) { console.error('findSolarByPillars error', e); }
            return null;
        }

        var _timer = null;
        // 只有公历（顶部）与八字区下方的公历变化时，触发基于公历的联动
        function onAnyChange() {
            try { if (_timer) clearTimeout(_timer); } catch (e) { }
            _timer = setTimeout(function () {
                try {
                    var s = parseSolarInputs();
                    if (s) { updateAllFromSolar(s.y, s.m, s.d); return; }
                    // 八字区下方的公历输入不影响顶部公历，只用于八字组件自身处理（已有单独处理）
                } catch (e) { console.error('onAnyChange error', e); }
            }, 300);
        }

        // 只对公历顶部输入和八字下方的公历输入注册联动监听
        var inputs = [solarYearEl, solarMonthEl, solarDayEl, eightSolarYearEl, eightSolarMonthEl, eightSolarDayEl];
        for (var i = 0; i < inputs.length; i++) { try { if (inputs[i]) inputs[i].removeEventListener('input', onAnyChange); } catch (e) { } }
        for (var i = 0; i < inputs.length; i++) { try { if (inputs[i]) inputs[i].addEventListener('input', onAnyChange); } catch (e) { } }
        // 当八字区下方的公历输入改变时，复制到顶部公历并触发联动
        try {
            function onEightSolarChange() {
                try {
                    var y = parseInt((eightSolarYearEl && eightSolarYearEl.value) || '', 10);
                    var m = parseInt((eightSolarMonthEl && eightSolarMonthEl.value) || '', 10);
                    var d = parseInt((eightSolarDayEl && eightSolarDayEl.value) || '', 10);
                    try { console.debug('onEightSolarChange', y, m, d); } catch (e) { }
                    if (Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d)) {
                        // 不再影响顶部公历；直接让八字组件使用该公历进行计算并输出
                        try {
                            if (window.eightCharApp && typeof window.eightCharApp.setFromYmd === 'function') {
                                try { window.eightCharApp.setFromYmd(y, m, d); } catch (e) { console.warn('eightCharApp.setFromYmd failed', e); }
                            } else if (window.eightCharApp) {
                                try {
                                    window.eightCharApp.display.year = y;
                                    window.eightCharApp.display.month = m;
                                    window.eightCharApp.display.day = d;
                                    if (typeof window.eightCharApp.ensureSolarFromDisplay === 'function') {
                                        try { window.eightCharApp.ensureSolarFromDisplay(); } catch (e) { }
                                    }
                                    if (typeof window.eightCharApp.compute === 'function') {
                                        try { window.eightCharApp.compute(); } catch (e) { }
                                    }
                                } catch (e) { console.warn('manual eightChar update failed', e); }
                            }
                        } catch (e) { console.warn('onEightSolarChange apply failed', e); }
                    }
                } catch (e) { console.warn('onEightSolarChange error', e); }
            }
            if (eightSolarYearEl) eightSolarYearEl.addEventListener('input', onEightSolarChange);
            if (eightSolarMonthEl) eightSolarMonthEl.addEventListener('input', onEightSolarChange);
            if (eightSolarDayEl) eightSolarDayEl.addEventListener('input', onEightSolarChange);
        } catch (e) { }
        try { if (btnToday) btnToday.addEventListener('click', function () { var dt = new Date(); solarYearEl.value = dt.getFullYear(); solarMonthEl.value = dt.getMonth() + 1; solarDayEl.value = dt.getDate(); if (eightSolarYearEl) { eightSolarYearEl.value = dt.getFullYear(); eightSolarMonthEl.value = dt.getMonth() + 1; eightSolarDayEl.value = dt.getDate(); } onAnyChange(); }); } catch (e) { }

        // 三柱 -> 公历 按钮（第二行）
        try {
            var btnPillar2Solar = D.getElementById('btn-pillar2solar');
            if (btnPillar2Solar) {
                btnPillar2Solar.addEventListener('click', function () {
                    try {
                        var p = parsePillarsInputs();
                        if (!p) return;
                        var found = findSolarByPillars(p.y, p.m, p.d);
                        if (found) {
                            try { if (solarYearEl) solarYearEl.value = found.y; if (solarMonthEl) solarMonthEl.value = found.m; if (solarDayEl) solarDayEl.value = found.d; } catch (e) { }
                            updateAllFromSolar(found.y, found.m, found.d);
                        } else {
                            console.warn('未找到对应的公历日期（请检查三柱输入）');
                        }
                    } catch (e) { console.error('btnPillar2Solar click error', e); }
                });
            }
        } catch (e) { }

        // 农历 -> 公历 按钮（第一行）
        try {
            var btnLunar2Solar = D.getElementById('btn-lunar2solar');
            if (btnLunar2Solar) {
                btnLunar2Solar.addEventListener('click', function () {
                    try {
                        var l = parseLunarInputs();
                        if (!l) return;
                        var conv = null;
                        try {
                            if (typeof LunarDay !== 'undefined' && typeof LunarDay.fromYmd === 'function') {
                                var ldObj = LunarDay.fromYmd(l.y, l.m, l.d);
                                if (ldObj && typeof ldObj.getSolarDay === 'function') {
                                    var sdObj = ldObj.getSolarDay();
                                    if (sdObj && typeof sdObj.getYear === 'function') conv = { y: sdObj.getYear(), m: sdObj.getMonth(), d: sdObj.getDay() };
                                } else if (ldObj && typeof ldObj.toSolar === 'function') {
                                    var sd2 = ldObj.toSolar(); if (sd2 && typeof sd2.getYear === 'function') conv = { y: sd2.getYear(), m: sd2.getMonth(), d: sd2.getDay() };
                                }
                            }
                        } catch (e) { conv = null; }
                        if (!conv) { try { conv = (window.convertLunarToSolar ? window.convertLunarToSolar(l.y, l.m, l.d) : null); } catch (e) { conv = null; } }
                        if (conv) {
                            try { if (solarYearEl) solarYearEl.value = conv.y; if (solarMonthEl) solarMonthEl.value = conv.m; if (solarDayEl) solarDayEl.value = conv.d; } catch (e) { }
                            // 若可用，使用 LunarDay.fromYmd(...).getThreePillars() 填充三柱输入
                            try {
                                if (typeof LunarDay !== 'undefined' && typeof LunarDay.fromYmd === 'function') {
                                    try {
                                        var _ldForThree = LunarDay.fromYmd(l.y, l.m, l.d);
                                        if (_ldForThree && typeof _ldForThree.getThreePillars === 'function') {
                                            try {
                                                var _three = _ldForThree.getThreePillars();
                                                if (pillarYearEl) pillarYearEl.value = (_three.getYear() && _three.getYear().toString()) || '';
                                                if (pillarMonthEl) pillarMonthEl.value = (_three.getMonth() && _three.getMonth().toString()) || '';
                                                if (pillarDayEl) pillarDayEl.value = (_three.getDay() && _three.getDay().toString()) || '';
                                                console.debug('btnLunar2Solar filled three pillars from LunarDay', _three);
                                            } catch (e) { console.warn('fill three pillars from LunarDay failed', e); }
                                        }
                                    } catch (e) { }
                                }
                            } catch (e) { }
                            updateAllFromSolar(conv.y, conv.m, conv.d);
                        } else {
                            console.warn('未能把农历转为公历，请检查输入或库是否可用');
                        }
                    } catch (e) { console.error('btnLunar2Solar click error', e); }
                });
            }
        } catch (e) { }

        try {
            var dt = new Date();
            if (solarYearEl) solarYearEl.value = dt.getFullYear();
            if (solarMonthEl) solarMonthEl.value = dt.getMonth() + 1;
            if (solarDayEl) solarDayEl.value = dt.getDate();
            if (eightSolarYearEl) eightSolarYearEl.value = dt.getFullYear();
            if (eightSolarMonthEl) eightSolarMonthEl.value = dt.getMonth() + 1;
            if (eightSolarDayEl) eightSolarDayEl.value = dt.getDate();
            onAnyChange();
        } catch (e) { }

        try {
            if (eightSolarApplyBtn) eightSolarApplyBtn.addEventListener('click', function () {
                try {
                    var y = parseInt((eightSolarYearEl && eightSolarYearEl.value) || '', 10);
                    var m = parseInt((eightSolarMonthEl && eightSolarMonthEl.value) || '', 10);
                    var d = parseInt((eightSolarDayEl && eightSolarDayEl.value) || '', 10);
                    try { console.debug('eight-solar apply clicked', y, m, d); } catch (e) { }
                    if (Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d)) {
                        // 不再更新顶部公历：直接请求八字组件使用该公历
                        if (window.eightCharApp && typeof window.eightCharApp.setFromYmd === 'function') {
                            try { window.eightCharApp.setFromYmd(y, m, d); } catch (e) { console.warn('eightCharApp.setFromYmd failed', e); }
                        } else if (window.eightCharApp) {
                            try {
                                window.eightCharApp.display.year = y;
                                window.eightCharApp.display.month = m;
                                window.eightCharApp.display.day = d;
                                if (typeof window.eightCharApp.ensureSolarFromDisplay === 'function') window.eightCharApp.ensureSolarFromDisplay();
                                if (typeof window.eightCharApp.compute === 'function') window.eightCharApp.compute();
                            } catch (e) { console.warn('manual eightChar update failed', e); }
                        } else {
                            console.warn('eightCharApp not available to apply eight-solar date');
                        }
                    }
                } catch (e) { console.warn('eight-solar apply handler error', e); }
            });
        } catch (e) { }
    } catch (e) { console.warn('three-row input init failed', e); }
})();

(function () {
    // 公历日
    var solarDay = SolarDay.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());

    window.huangliApp = new Vue({
        el: '#demo-huangli',
        data: {
            solar: '',
            week: '',
            lunar: '',
            gz: '',
            yi: [],
            ji: [],
            sound: '',
            chongSha: '',
            twelveStar: '',
            twentyEightStar: '',
            god: {
                ji: [],
                xiong: []
            },
            duty: '',
            fetus: '',
            pz: [],
            hours: [],
            caishen: '',
            xishen: '',
            fushen: '',
            guishen: '',
            selectedHour: null,
            selectedHourIndex: 0
        },
        mounted: function () {
            this.compute();
        },
        methods: {
            selectHour: function (index) {
                this.selectedHourIndex = index;
                this.selectedHour = this.hours[index];
            },
            compute: function () {
                // allow external setter to override solarDay (set by other components)
                if (this._externalSolarDay) {
                    try { solarDay = this._externalSolarDay; } catch (e) { console.warn('apply external solarDay failed', e); }
                    this._externalSolarDay = null;
                }
                var that = this;
                // 在公历日期后增加周数
                var solarWeek = solarDay.getSolarWeek(weekStart);
                that.solar = solarDay.toString() + ' 星期' + solarDay.getWeek().getName() + ' 第' + (solarWeek.getIndexInYear() + 1) + '周';
                that.week = solarDay.getWeek().toString();
                var lunarDay = solarDay.getLunarDay();
                var threePillars = lunarDay.getThreePillars();
                var sixtyCycle = threePillars.getDay();
                var heavenStem = sixtyCycle.getHeavenStem();
                var earthBranch = sixtyCycle.getEarthBranch();
                var lunarMonth = lunarDay.getLunarMonth();
                var lunarYear = lunarMonth.getLunarYear();

                that.caishen = heavenStem.getWealthDirection().getName();
                that.xishen = heavenStem.getJoyDirection().getName();
                that.fushen = heavenStem.getMascotDirection().getName();
                const yangGui = heavenStem.getYangDirection().getName();
                const yinGui = heavenStem.getYinDirection().getName();
                that.guishen = '阳' + yangGui + ' 阴' + yinGui;

                that.lunar = lunarMonth.getName() + lunarDay.getName();
                // 调整干支显示，并增加生肖和星座
                that.gz = [threePillars.getYear() + '年', threePillars.getMonth() + '月', sixtyCycle + '日'].join(' ') + ' 属' + threePillars.getYear().getEarthBranch().getZodiac() + ' ' + solarDay.getConstellation() + '座';

                // 宜忌
                var yi = [], ji = [];
                var recommends = lunarDay.getRecommends();
                for (var i = 0, j = recommends.length; i < j; i++) {
                    yi.push(recommends[i].toString());
                }
                var avoids = lunarDay.getAvoids();
                for (var i = 0, j = avoids.length; i < j; i++) {
                    ji.push(avoids[i].toString());
                }
                that.yi = yi;
                that.ji = ji;

                that.sound = sixtyCycle.getSound().toString();
                var dayAnimal = earthBranch.getZodiac().toString();
                var chongAnimal = earthBranch.getOpposite().getZodiac().toString();
                var chongSixtyCycle = heavenStem.getOpposite() + earthBranch.getOpposite().toString();
                var shaDirection = earthBranch.getOminous().toString();
                that.chongSha = dayAnimal + '日冲' + chongAnimal + '(' + chongSixtyCycle + ') 煞' + shaDirection;
                that.duty = lunarDay.getDuty().toString();

                var twelveStar = lunarDay.getTwelveStar();
                that.twelveStar = [twelveStar.toString(), '(' + twelveStar.getEcliptic().getLuck() + ')'].join('');

                var jiGods = [], xiongGods = [];
                var gods = lunarDay.getGods();
                for (var i = 0, j = gods.length; i < j; i++) {
                    var god = gods[i];
                    var godName = god.toString();
                    if ('吉' == god.getLuck().toString()) {
                        jiGods.push(godName);
                    } else {
                        xiongGods.push(godName);
                    }
                }
                that.god.ji = jiGods;
                that.god.xiong = xiongGods;

                that.fetus = lunarDay.getFetusDay().toString();

                var twentyEightStar = lunarDay.getTwentyEightStar();
                that.twentyEightStar = [twentyEightStar.toString(), twentyEightStar.getSevenStar().toString(), twentyEightStar.getAnimal().toString(), ' ', twentyEightStar.getLuck().toString()].join('');
                that.pz = [heavenStem.getPengZuHeavenStem().toString(), earthBranch.getPengZuEarthBranch().toString()];

                var hours = [];
                var lunarHours = lunarDay.getHours();
                for (var i = 0, j = lunarHours.length; i < j; i++) {
                    var h = lunarHours[i];
                    var hHeavenStem = h.getSixtyCycle().getHeavenStem();
                    var hEarthBranch = h.getSixtyCycle().getEarthBranch();

                    var hRecommends = [];
                    var recs = h.getRecommends();
                    for (var r = 0; r < recs.length; r++) {
                        hRecommends.push(recs[r].getName());
                    }

                    var hAvoids = [];
                    var avs = h.getAvoids();
                    for (var a = 0; a < avs.length; a++) {
                        hAvoids.push(avs[a].getName());
                    }

                    var startHourForRange = h.getHour();
                    var timeRangeForHour;

                    if (startHourForRange === 23 || startHourForRange === 0) {
                        // 子时 spans 23:00 - 01:59
                        timeRangeForHour = "23:00 - 01:59";
                    } else {
                        var endHourForRange = (startHourForRange + 2);
                        timeRangeForHour = `${String(startHourForRange).padStart(2, '0')}:00 - ${String(endHourForRange - 1).padStart(2, '0')}:59`;
                    }

                    hours.push({
                        sixtyCycle: { string: h.getSixtyCycle().toString() },
                        timeRange: timeRangeForHour,
                        clash: '冲' + hEarthBranch.getOpposite().getZodiac() + ' 煞' + hEarthBranch.getOminous().getName(),
                        luck: h.getTwelveStar().getEcliptic().getLuck().toString(),
                        joyDirection: hHeavenStem.getJoyDirection().getName(),
                        wealthDirection: hHeavenStem.getWealthDirection().getName(),
                        mascotDirection: hHeavenStem.getMascotDirection().getName(),
                        recommends: hRecommends,
                        avoids: hAvoids
                    });
                }
                that.hours = hours.slice(0, 12);
                if (that.hours.length > 0) {
                    that.selectedHourIndex = 0;
                    that.selectedHour = that.hours[0];
                }
            }
            ,
            // allow external callers to load huangli by y/m/d
            loadFromYmd: function (y, m, d) {
                try {
                    if (!y || !m || !d) return;
                    var sd = null;
                    try { sd = SolarDay.fromYmd(y, m, d); } catch (e) { sd = null; }
                    if (sd) {
                        this._externalSolarDay = sd;
                        this.compute();
                    }
                } catch (e) { console.error('huangli.loadFromYmd error', e); }
            }
        }
    });
    var huangliEl = D.getElementById('demo-huangli');
    if (huangliEl) {
        huangliEl.style.display = 'block';
    }

    // expose helper to set solarDay from other components
    window.huangliSetSolarDay = function (solarDayObj) {
        try {
            // replace closure variable solarDay used inside this IIFE
            // We rely on huangliApp.compute reading the updated solarDay variable; so update by re-defining and calling compute
            // The simplest is to set a property on the app and call compute which will read it via SolarDay.fromYmd when possible
            if (window.huangliApp) {
                window.huangliApp._externalSolarDay = solarDayObj;
                window.huangliApp.compute();
            }
        } catch (e) {
            console.error('huangliSetSolarDay error', e);
        }
    };
})();

// 八字排盘
(function () {
    window.eightCharApp = new Vue({
        el: '#demo-eight-char',
        data: {
            childLimitProvider: '0',
            eightCharProvider: '0',
            gender: '1',
            solar: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds()
            },
            solarStr: '',
            lunarStr: '',
            // 八字区的历法选择与显示字段（display 用于绑定到输入控件，calendarType 控制是公历还是农历）
            calendarType: 'solar',
            display: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate()
            },
            prevTerm: {
                name: '',
                time: ''
            },
            nextTerm: {
                name: '',
                time: ''
            },
            fetalOrigin: {
                name: '',
                sound: ''
            },
            fetalBreath: {
                name: '',
                sound: ''
            },
            ownSign: {
                name: '',
                sound: ''
            },
            bodySign: {
                name: '',
                sound: ''
            },
            year: {
                tenStar: {
                    heavenStem: ''
                },
                heavenStem: '',
                earthBranch: '',
                terrain: '',
                terrainSelf: '',
                hideHeavenStems: [],
                extraEarthBranches: [],
                shensha: []
            },
            month: {
                tenStar: {
                    heavenStem: ''
                },
                heavenStem: '',
                earthBranch: '',
                terrain: '',
                terrainSelf: '',
                hideHeavenStems: [],
                extraEarthBranches: [],
                shensha: []
            },
            day: {
                tenStar: {
                    heavenStem: ''
                },
                heavenStem: '',
                earthBranch: '',
                terrain: '',
                terrainSelf: '',
                hideHeavenStems: [],
                extraEarthBranches: [],
                shensha: []
            },
            hour: {
                tenStar: {
                    heavenStem: ''
                },
                heavenStem: '',
                earthBranch: '',
                terrain: '',
                terrainSelf: '',
                hideHeavenStems: [],
                extraEarthBranches: [],
                shensha: []
            },
            relationships: { stems: [], branches: [] },
            childLimitInfo: {
                year: 0,
                month: 0,
                day: 0,
                hour: 0,
                minute: 0,
                endSolarTime: ''
            },
            decadeFortunes: [],
            selected: {
                decadeFortune: 0,
                fortune: 0
            },
            wuxingEnergy: null
        },
        watch: {
            solar: {
                handler(newVal) {
                    this.compute();
                },
                deep: true
            },
            display: {
                handler(newVal) { this.compute(); },
                deep: true
            },
            calendarType(newVal) { this.compute(); },
            gender(newVal) {
                this.compute();
            },
            eightCharProvider(newVal) {
                this.compute();
            },
            childLimitProvider(newVal) {
                this.compute();
            }
        },
        mounted: function () {
            this.compute();
            try {
                const copyButton = document.getElementById('btn-copy-bazi');
                if (copyButton) {
                    copyButton.addEventListener('click', this.copySummary.bind(this));
                }
            } catch (e) {
                console.error("Failed to attach copy button listener:", e);
            }
        },
        computed: {
            fortunes: function () {
                var size = this.decadeFortunes.length;
                if (size < 1) {
                    return [];
                }
                if (this.selected.decadeFortune >= size) {
                    return this.decadeFortunes[0];
                }
                return this.decadeFortunes[this.selected.decadeFortune].fortunes;
            },
            months: function () {
                var fortunes = this.fortunes;
                var size = fortunes.length;
                if (size < 1) {
                    return [];
                }
                if (this.selected.fortune >= size) {
                    return fortunes[0];
                }
                return fortunes[this.selected.fortune].year.months;
            }
        },
        methods: {
            getWuXingClass: function (symbol) {
                var element = this.getWuXingElement(symbol);
                return element ? WUXING_META.classMap[element] : '';
            },
            getWuXingElement: function (symbol) {
                if (!symbol) {
                    return '';
                }
                return STEM_ELEMENT_MAP[symbol] || BRANCH_ELEMENT_MAP[symbol] || '';
            },
            getWuXingIcon: function (symbol) {
                var element = this.getWuXingElement(symbol);
                if (!element) {
                    return '';
                }
                return './icons/' + element + '.png';
            },
            formatDerivationStep: function (log) {
                if (!log) {
                    return '';
                }
                var value = typeof log.value === 'number' ? log.value : 0;
                if (log.type === 'mult') {
                    return '×' + value.toFixed(2);
                }
                if (log.type === 'set') {
                    return '=' + value.toFixed(2);
                }
                var sign = value >= 0 ? '+' : '';
                return sign + value.toFixed(1);
            },
            updateWuXingEnergy: function () {
                var pillars = [
                    { key: 'year', data: this.year },
                    { key: 'month', data: this.month },
                    { key: 'day', data: this.day },
                    { key: 'hour', data: this.hour }
                ];
                var scores = {};
                var scoreLogs = {};
                var contributions = {}; // V3.3: 追踪每个藏干的贡献
                WUXING_META.order.forEach(function (key) {
                    scores[key] = 0;
                    scoreLogs[key] = [];
                });


                var recordLog = function (element, value, reason, type) {
                    if (!element || !scoreLogs[element]) return;
                    scoreLogs[element].push({
                        value: value,
                        reason: reason,
                        type: type || 'add' // 'add', 'mult', 'set'
                    });
                };

                // V3.3: 全局保底 - 确保能量不为负
                var ensureNonNegative = function (stepName) {
                    WUXING_META.order.forEach(function (element) {
                        if (scores[element] < 0) {
                            console.warn('⚠️ [' + stepName + '] ' + element + '能量为负(' + scores[element].toFixed(2) + ')，已归零');
                            scores[element] = 0;
                        }
                    });
                };


                // ========================================
                // V3.0 FIVE ELEMENT ENERGY CALCULATION
                // ========================================

                // === STEP 1: Static Initialization ===
                // Base Units: Stem = 10 BU, Branch = 20 BU (Month Branch = 40 BU)
                // Branch energy distributed to hidden stems by HIDDEN_STEM_RATIOS

                for (var i = 0; i < pillars.length; i++) {
                    var pillar = pillars[i];
                    var isMonthPillar = (pillar.key === 'month');
                    var pillarName = (pillar.key === 'year' ? '年' : pillar.key === 'month' ? '月' : pillar.key === 'day' ? '日' : '时');

                    // 1. Heavenly Stems: 10 BU each
                    var stemElement = this.getWuXingElement(pillar.data.heavenStem);
                    if (stemElement) {
                        scores[stemElement] += 10;
                        recordLog(stemElement, 10, pillarName + '干' + pillar.data.heavenStem, 'add');
                    }

                    // 2. Earthly Branches: Distribute by HIDDEN_STEM_RATIOS
                    var branch = pillar.data.earthBranch;
                    var branchTotalBU = isMonthPillar ? 40 : 20; // Month branch gets 2× weight // 藏干能量 (分配地支总能量)
                    var hides = pillar.data.hideHeavenStems || [];
                    var ratios = HIDDEN_STEM_RATIOS[branch] || [1.0];
                    for (var h = 0; h < hides.length && h < ratios.length; h++) {
                        var hide = hides[h];
                        var hideElement = this.getWuXingElement(hide.name);
                        if (hideElement) {
                            var hideScore = branchTotalBU * ratios[h];
                            scores[hideElement] += hideScore;
                            var qiType = (h === 0) ? '本气' : (h === 1) ? '中气' : '余气';
                            var label = pillarName + '支(' + branch + ')' + qiType + hide.name;
                            if (isMonthPillar && h === 0) label += '【月令】';
                            recordLog(hideElement, hideScore, label, 'add');

                            // V3.3: 追踪每个藏干的贡献（用于后续精确调整）
                            if (!contributions[hideElement]) contributions[hideElement] = [];
                            contributions[hideElement].push({
                                pillarIndex: i,
                                branch: branch,
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

                var monthBranch = pillars[1].data.earthBranch;
                var branches = pillars.map(function (item) { return item.data.earthBranch; });
                var stems = pillars.map(function (p) { return p.data.heavenStem; });

                // Track which branches/stems have been combined (to exclude from clash)
                var combinedBranches = [];
                var combinedStems = [];

                // === STEP 2: Void (空亡) - Process First ===
                // Void affects all hidden stems, but combo participation can offset it later
                var daySixty = this.day.heavenStem + this.day.earthBranch;
                var voidBranches = VOID_BRANCHES[daySixty] || [];
                var voidReduction = {}; // Track void reductions for later offset

                for (var i = 0; i < pillars.length; i++) {
                    var branch = pillars[i].data.earthBranch;
                    if (voidBranches.indexOf(branch) >= 0) {
                        // Reduce main qi - 使用系数法避免负数
                        var branchElement = this.getWuXingElement(branch);
                        if (branchElement) {
                            var oldScore = scores[branchElement];
                            scores[branchElement] *= 0.5;
                            voidReduction[branch] = oldScore - scores[branchElement];
                            recordLog(branchElement, 0.5, '空亡(' + branch + ')削减', 'mult');
                        }

                        // Also reduce hidden stems
                        var hides = pillars[i].data.hideHeavenStems || [];
                        for (var h = 1; h < hides.length; h++) {
                            var hideElement = this.getWuXingElement(hides[h].name);
                            if (hideElement) {
                                scores[hideElement] *= 0.5;
                                recordLog(hideElement, 0.5, '空亡(' + branch + ')藏干削减', 'mult');
                            }
                        }
                    }
                }
                ensureNonNegative('Step 2: Void');


                // === STEP 3: Seasonal Weighting (提纲加权) ===
                // Apply Wang/Xiang/Xiu/Qiu/Si multipliers based on month command
                var seasonalFactors = SEASONAL_ADJUSTMENT[monthBranch];
                if (seasonalFactors) {
                    WUXING_META.order.forEach(function (element) {
                        var factor = seasonalFactors[element] || 1.0;
                        if (factor !== 1.0) {
                            scores[element] *= factor;
                            var seasonName = (factor === 1.5) ? '旺' : (factor === 1.2) ? '相' : (factor === 0.9) ? '休' : (factor === 0.7) ? '囚' : '死';
                            recordLog(element, factor, '月令' + seasonName, 'mult');
                        }
                    });
                }

                // === STEP 4A: Directional Combinations (三会局/方局) - HIGHEST PRIORITY ===
                for (var i = 0; i < stems.length - 1; i++) {
                    if (combinedStems.indexOf(i) >= 0) continue;

                    for (var j = i + 1; j < stems.length; j++) {
                        if (combinedStems.indexOf(j) >= 0) continue;

                        var combo = stems[i] + stems[j];
                        var reverseCombo = stems[j] + stems[i];
                        var transformedElement = STEM_COMBINATIONS[combo] || STEM_COMBINATIONS[reverseCombo];

                        if (transformedElement) {
                            // Calculate transformation success rate
                            var transformedPower = scores[transformedElement] || 0;
                            var stem1Element = this.getWuXingElement(stems[i]);
                            var stem2Element = this.getWuXingElement(stems[j]);
                            var originalPower = (scores[stem1Element] || 0) + (scores[stem2Element] || 0);

                            var successRate = transformedPower / (originalPower + transformedPower + 0.01);

                            if (successRate >= TRANSFORMATION_THRESHOLDS.complete) {
                                // COMPLETE TRANSFORMATION: 完全合化
                                if (stem1Element) {
                                    var transfer1 = Math.min(10, scores[stem1Element]); // 不超过现有值
                                    scores[stem1Element] -= transfer1;
                                    recordLog(stem1Element, -transfer1, '合化(' + combo + ')转出', 'add');
                                }
                                if (stem2Element) {
                                    var transfer2 = Math.min(10, scores[stem2Element]);
                                    scores[stem2Element] -= transfer2;
                                    recordLog(stem2Element, -transfer2, '合化(' + combo + ')转出', 'add');
                                }
                                scores[transformedElement] += 20;
                                recordLog(transformedElement, 20, '合化(' + combo + ')成功', 'add');
                                combinedStems.push(i, j);
                            } else if (successRate >= TRANSFORMATION_THRESHOLDS.partial) {
                                // PARTIAL TRANSFORMATION: 部分合化
                                var transferRatio = (successRate - TRANSFORMATION_THRESHOLDS.partial) /
                                    (TRANSFORMATION_THRESHOLDS.complete - TRANSFORMATION_THRESHOLDS.partial);
                                var transferAmount = 10 * transferRatio;
                                if (stem1Element) {
                                    var transfer1 = Math.min(transferAmount * 0.5, scores[stem1Element]);
                                    scores[stem1Element] -= transfer1;
                                    recordLog(stem1Element, -transfer1, '合化(' + combo + ')部分转出', 'add');
                                }
                                if (stem2Element) {
                                    var transfer2 = Math.min(transferAmount * 0.5, scores[stem2Element]);
                                    scores[stem2Element] -= transfer2;
                                    recordLog(stem2Element, -transfer2, '合化(' + combo + ')部分转出', 'add');
                                }
                                scores[transformedElement] += transferAmount;
                                recordLog(transformedElement, transferAmount, '合化(' + combo + ')部分转入', 'add');
                                combinedStems.push(i, j);
                            } else {
                                // ENTANGLEMENT: 羁绊状态
                                if (stem1Element) {
                                    scores[stem1Element] *= 0.85;
                                    recordLog(stem1Element, 0.85, '合化(' + combo + ')羁绊', 'mult');
                                }
                                if (stem2Element) {
                                    scores[stem2Element] *= 0.85;
                                    recordLog(stem2Element, 0.85, '合化(' + combo + ')羁绊', 'mult');
                                }
                            }
                        }
                    }
                }



                for (var element in DIRECTIONAL_COMBOS) {
                    var requiredBranches = DIRECTIONAL_COMBOS[element];
                    var matchedIndices = [];

                    for (var i = 0; i < branches.length; i++) {
                        if (requiredBranches.indexOf(branches[i]) >= 0 &&
                            combinedBranches.indexOf(i) < 0) {
                            matchedIndices.push(i);
                        }
                    }

                    if (matchedIndices.length === 3) {
                        // Complete directional combo - strongest transformation
                        var totalTransferred = 0;
                        var comboName = '三会' + WUXING_META.names[element] + '局';

                        matchedIndices.forEach(function (idx) {
                            var branch = branches[idx];
                            var branchElement = this.getWuXingElement(branch);
                            if (branchElement) {
                                var branchContribution = Math.min(40, scores[branchElement]); // 不超过现有值
                                scores[branchElement] -= branchContribution;
                                recordLog(branchElement, -branchContribution, comboName + '转出', 'add');
                                totalTransferred += branchContribution;
                            }
                            combinedBranches.push(idx);

                            // Offset void if this branch was void
                            if (voidReduction[branch]) {
                                // Restore 50% of void reduction due to combo participation
                                var restore = voidReduction[branch] * 0.5;
                                scores[branchElement] += restore;
                                recordLog(branchElement, restore, '合局解空亡', 'add');
                            }
                        }, this);

                        scores[element] += totalTransferred;
                        recordLog(element, totalTransferred, comboName + '转入', 'add');
                    }
                }

                // === STEP 4B: Triple Combinations (三合局) ===
                for (var element in TRIPLE_COMBOS) {
                    var requiredBranches = TRIPLE_COMBOS[element];
                    var matchedIndices = [];

                    for (var i = 0; i < branches.length; i++) {
                        if (requiredBranches.indexOf(branches[i]) >= 0 &&
                            combinedBranches.indexOf(i) < 0) {
                            matchedIndices.push(i);
                        }
                    }

                    var comboName = '三合' + WUXING_META.names[element] + '局';
                    if (matchedIndices.length === 3) {
                        // Complete Triple Combo
                        var totalTransferred = 0;
                        matchedIndices.forEach(function (idx) {
                            var branch = branches[idx];
                            var branchElement = this.getWuXingElement(branch);
                            if (branchElement) {
                                var branchContribution = Math.min(40, scores[branchElement]); // 不超过现有值
                                scores[branchElement] -= branchContribution;
                                recordLog(branchElement, -branchContribution, comboName + '转出', 'add');
                                totalTransferred += branchContribution;
                            }
                            combinedBranches.push(idx);

                            // Offset void
                            if (voidReduction[branch]) {
                                var restore = voidReduction[branch] * 0.5;
                                scores[branchElement] += restore;
                                recordLog(branchElement, restore, '合局解空亡', 'add');
                            }
                        }, this);

                        scores[element] += totalTransferred;
                        recordLog(element, totalTransferred, comboName + '转入', 'add');

                    } else if (matchedIndices.length === 2) {
                        // Half Combo (Semi-Triple)
                        // Check if the center branch (Emperor) is present
                        // Wood: Mao, Fire: Wu, Metal: You, Water: Zi
                        var centerBranch = requiredBranches[1];
                        var hasCenter = false;
                        matchedIndices.forEach(function (idx) {
                            if (branches[idx] === centerBranch) hasCenter = true;
                        });

                        if (hasCenter) {
                            // Valid Half Combo
                            scores[element] += 20;
                            recordLog(element, 20, '半合' + WUXING_META.names[element] + '局', 'add');
                            matchedIndices.forEach(function (idx) {
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
                for (var i = 0; i < stems.length - 1; i++) {
                    if (combinedStems.indexOf(i) >= 0) continue;

                    for (var j = i + 1; j < stems.length; j++) {
                        if (combinedStems.indexOf(j) >= 0) continue;

                        var combo = stems[i] + stems[j];
                        var reverseCombo = stems[j] + stems[i];
                        var transformedElement = STEM_COMBINATIONS[combo] || STEM_COMBINATIONS[reverseCombo];

                        if (transformedElement) {
                            // Simplified V3.0: If month supports (de ling), transform fully
                            var seasonalFactors = SEASONAL_ADJUSTMENT[monthBranch] || {};
                            var transformedSupport = seasonalFactors[transformedElement] || 1.0;

                            var stem1Element = this.getWuXingElement(stems[i]);
                            var stem2Element = this.getWuXingElement(stems[j]);

                            if (transformedSupport >= 1.5) {
                                // Month supports transformation: Complete merge
                                if (stem1Element) {
                                    var transfer1 = Math.min(10, scores[stem1Element]); // 不超过现有值
                                    scores[stem1Element] -= transfer1;
                                    recordLog(stem1Element, -transfer1, '合化(' + combo + ')转出', 'add');
                                }
                                if (stem2Element) {
                                    var transfer2 = Math.min(10, scores[stem2Element]);
                                    scores[stem2Element] -= transfer2;
                                    recordLog(stem2Element, -transfer2, '合化(' + combo + ')转出', 'add');
                                }
                                scores[transformedElement] += 20 * 1.5; // ×1.5 for successful combo
                                recordLog(transformedElement, 30, '合化(' + combo + ')成功', 'add');
                                combinedStems.push(i, j);
                            } else {
                                // Month doesn't support: Entanglement (合而不化)
                                if (stem1Element) {
                                    scores[stem1Element] *= 0.8;
                                    recordLog(stem1Element, 0.8, '合而不化(' + combo + ')羁绊', 'mult');
                                }
                                if (stem2Element) {
                                    scores[stem2Element] *= 0.8;
                                    recordLog(stem2Element, 0.8, '合而不化(' + combo + ')羁绊', 'mult');
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

                for (var i = 0; i < stems.length; i++) {
                    // Skip if stem was transformed (involved in combination)
                    if (combinedStems.indexOf(i) >= 0) continue;

                    var stem = stems[i];
                    var stemElement = this.getWuXingElement(stem);
                    if (!stemElement) continue;

                    var strongestRoot = 'none'; // none, weak, medium, strong
                    var rootBranches = [];

                    // Scan all branches for roots
                    for (var b = 0; b < branches.length; b++) {
                        var branch = branches[b];
                        // Void branches cannot provide roots
                        if (voidReduction[branch]) continue;

                        var hides = pillars[b].data.hideHeavenStems || [];
                        for (var h = 0; h < hides.length; h++) {
                            var hideElement = this.getWuXingElement(hides[h].name);

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
                    var coefficient = 1.0;
                    var desc = '';
                    if (strongestRoot === 'strong') {
                        coefficient = 1.2;
                        desc = '强根(' + rootBranches.join('、') + ')';
                    } else if (strongestRoot === 'medium') {
                        coefficient = 1.0;
                        desc = '中根(' + rootBranches.join('、') + ')';
                    } else if (strongestRoot === 'weak') {
                        coefficient = 0.8;
                        desc = '弱根(' + rootBranches.join('、') + ')';
                    } else {
                        coefficient = 0.1;  // V3.1: 0.4 → 0.1 (假神)
                        desc = '无根虚浮';
                    }

                    if (coefficient !== 1.0) {
                        scores[stemElement] *= coefficient;
                        recordLog(stemElement, coefficient, '天干' + stem + desc, 'mult');
                    }
                }

                // === STEP 5: Clash & Penalties (六冲) ===
                var clashPairs = BRANCH_RELATIONS.clash;
                for (var c = 0; c < clashPairs.length; c++) {
                    var pair = clashPairs[c];
                    var idx1 = branches.indexOf(pair[0]);
                    var idx2 = branches.indexOf(pair[1]);

                    // Only process if both exist and neither is combined
                    if (idx1 >= 0 && idx2 >= 0 &&
                        combinedBranches.indexOf(idx1) < 0 &&
                        combinedBranches.indexOf(idx2) < 0) {

                        var elem1 = this.getWuXingElement(pair[0]);
                        var elem2 = this.getWuXingElement(pair[1]);

                        // V3.0 Special Rule: Earth-Earth Clash (土土相冲)
                        var isEarthEarthClash = (elem1 === 'earth' && elem2 === 'earth');
                        var earthClashPairs = [['辰', '戌'], ['丑', '未']];
                        var isEarthPair = earthClashPairs.some(function (ep) {
                            return (ep[0] === pair[0] && ep[1] === pair[1]) || (ep[0] === pair[1] && ep[1] === pair[0]);
                        });

                        if (isEarthEarthClash && isEarthPair) {
                            // V3.3: 纯系数法 - 通过contributions追踪精确调整

                            [idx1, idx2].forEach(function (pillarIdx) {
                                var branch = branches[pillarIdx];

                                // 遍历所有元素的贡献记录
                                WUXING_META.order.forEach(function (element) {
                                    if (!contributions[element]) return;

                                    // 找到来自这个地支的藏干
                                    contributions[element].forEach(function (contrib) {
                                        if (contrib.pillarIndex !== pillarIdx || contrib.branch !== branch) return;

                                        // 计算旧贡献
                                        var oldContrib = contrib.baseContribution * contrib.coefficient;

                                        // 确定新系数
                                        var newCoeff = contrib.coefficient;
                                        var reason = '';

                                        if (contrib.qiLevel === 0 && element === 'earth') {
                                            // 本气土：×1.4（冲旺）
                                            newCoeff = contrib.coefficient * 1.4;
                                            reason = '土冲(' + pair[0] + pair[1] + ')' + branch + '本气旺×1.4';
                                        } else if (contrib.qiLevel > 0) {
                                            // 杂气：×0.1（灭，保留10%残气）
                                            newCoeff = contrib.coefficient * 0.1;
                                            var qiName = (contrib.qiLevel === 1) ? '中气' : '余气';
                                            reason = '土冲(' + pair[0] + pair[1] + ')' + branch + qiName + '灭×0.1';
                                        } else {
                                            return; // 不是土冲影响的藏干
                                        }

                                        // 计算新贡献
                                        var newContrib = contrib.baseContribution * newCoeff;

                                        // 更新总分：先减旧的，再加新的
                                        scores[element] = scores[element] - oldContrib + newContrib;

                                        // 更新系数
                                        contrib.coefficient = newCoeff;

                                        // 记录日志（记录系数倍数）
                                        var multiplier = (contrib.qiLevel === 0 && element === 'earth') ? 1.4 : 0.1;
                                        recordLog(element, multiplier, reason, 'mult');
                                    });
                                });
                            }, this);
                        } else {
                            // 普通相冲：金木、水火
                            var score1 = scores[elem1];
                            var score2 = scores[elem2];

                            if (Math.abs(score1 - score2) < 10) {
                                // Evenly matched: both ×0.75
                                scores[elem1] *= 0.75;
                                scores[elem2] *= 0.75;
                                recordLog(elem1, 0.75, '相冲(' + pair[0] + pair[1] + ')', 'mult');
                                recordLog(elem2, 0.75, '相冲(' + pair[0] + pair[1] + ')', 'mult');
                            } else if (score1 > score2) {
                                // Winner ×0.9, Loser ×0.6
                                scores[elem1] *= 0.9;
                                scores[elem2] *= 0.6;
                                recordLog(elem1, 0.9, '相冲(' + pair[0] + pair[1] + ')胜', 'mult');
                                recordLog(elem2, 0.6, '相冲(' + pair[0] + pair[1] + ')败', 'mult');
                            } else {
                                scores[elem1] *= 0.6;
                                scores[elem2] *= 0.9;
                                recordLog(elem1, 0.6, '相冲(' + pair[0] + pair[1] + ')败', 'mult');
                                recordLog(elem2, 0.9, '相冲(' + pair[0] + pair[1] + ')胜', 'mult');
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
                var totalScore = 0;
                WUXING_META.order.forEach(function (key) {
                    totalScore += scores[key];
                });
                if (!totalScore) {
                    // Provide default placeholder values to avoid Vue template showing raw bindings
                    this.wuxingEnergy = {
                        elements: [],
                        totalScore: 0,
                        summary: '',
                        suggestion: '',
                        climate: '',
                        balanceIndex: 0,
                        bodyStrength: null,
                        bodyStrengthText: '',
                        preferences: {},
                        logs: []
                    };
                    return;
                }
                var avg = totalScore / WUXING_META.order.length;
                var elements = WUXING_META.order.map(function (key) {
                    var score = scores[key];
                    var percentage = score / totalScore * 100;
                    var level = this.getWuXingLevel(score, avg);
                    var derivations = scoreLogs[key] ? scoreLogs[key].slice(0, 6) : [];
                    return {
                        id: key,
                        name: WUXING_META.names[key],
                        score: score,
                        percentage: percentage,
                        level: level,
                        analysis: this.describeWuXing(key, level, percentage, pillars, scoreLogs[key]),
                        derivation: derivations
                    };
                }, this).sort(function (a, b) { return b.score - a.score; });
                var variance = elements.reduce(function (sum, item) {
                    return sum + Math.pow(item.score - avg, 2);
                }, 0) / elements.length;
                var balanceIndex = Math.max(0, Math.min(100, 100 - (Math.sqrt(variance) / (avg || 1)) * 50));
                var sorted = elements.slice().sort(function (a, b) { return b.score - a.score; });

                // 调用高级分析方法 - 将 pillars 数组转换为对象
                var pillarsObj = {
                    year: this.year,
                    month: this.month,
                    day: this.day,
                    hour: this.hour
                };
                var advanced = this.advancedAnalyze(this.day.heavenStem, pillarsObj, sorted, scores, this.relationships);

                var distributionSummary = sorted.length
                    ? sorted[0].name + '最为突出，' + sorted[sorted.length - 1].name + '相对不足，整体' + (balanceIndex >= 75 ? '趋于平衡' : '存在明显倾斜')
                    : '';


                //  console.log('=== updateWuXingEnergy - Advanced Data ===');
                //  console.log('advanced object:', advanced);
                //  console.log('summary:', advanced.summary);
                //   console.log('suggestion:', advanced.suggestion);
                //  console.log('climate:', advanced.climate);
                //   console.log('preferences:', advanced.preferences);

                this.wuxingEnergy = {
                    elements: elements,
                    totalScore: totalScore,
                    summary: advanced.summary || distributionSummary,
                    suggestion: advanced.suggestion || '请结合五行能量分析判断',
                    climate: advanced.climate || '',
                    balanceIndex: balanceIndex,
                    bodyStrength: advanced.bodyStrength,
                    bodyStrengthText: advanced.bodyStrengthText,
                    preferences: advanced.preferences || { likes: [], dislikes: [] },
                    logs: advanced.logs || []
                };

                // console.log('=== Final wuxingEnergy ===');
                //  console.log('wuxingEnergy:', this.wuxingEnergy);

                // 渲染图表 (使用 nextTick 确保 DOM 已更新)
                this.$nextTick(function () {
                    this.renderCharts(elements);
                });
            },
            renderCharts: function (elements) {
                if (!window.echarts) return;

                // 准备数据
                var names = elements.map(function (e) { return e.name; });
                var scores = elements.map(function (e) { return e.score; });

                // 动态计算最大值，确保图表饱满
                var maxScore = Math.max.apply(null, scores);
                // 让最大值占约75% (3/4圈)，从而使图形更饱满
                var indicatorMax = maxScore > 0 ? maxScore / 0.95 : 20;

                // 1. 雷达图 (五行分布形状)
                var radarChart = echarts.init(document.getElementById('wuxing-radar-chart'));
                var radarOption = {
                    title: { text: '五行分布形态', left: 'center', top: '10px', textStyle: { fontSize: 16, color: '#333' } },
                    tooltip: {},
                    radar: {
                        radius: '70%', // 增大半径
                        indicator: [
                            { name: '木', max: indicatorMax, color: '#4caf50' },
                            { name: '火', max: indicatorMax, color: '#f44336' },
                            { name: '土', max: indicatorMax, color: '#795548' },
                            { name: '金', max: indicatorMax, color: '#ffbf00' },
                            { name: '水', max: indicatorMax, color: '#2196f3' }
                        ],
                        shape: 'circle',
                        splitNumber: 4,
                        axisName: { fontWeight: 'bold', fontSize: 14 }, // 加大字体
                        splitArea: {
                            areaStyle: {
                                color: ['rgba(255,255,255,0.9)', 'rgba(245,247,255,0.9)']
                            }
                        }
                    },
                    series: [{
                        name: '五行能量',
                        type: 'radar',
                        data: [{
                            value: [
                                elements.find(e => e.id === 'wood').score,
                                elements.find(e => e.id === 'fire').score,
                                elements.find(e => e.id === 'earth').score,
                                elements.find(e => e.id === 'metal').score,
                                elements.find(e => e.id === 'water').score
                            ],
                            name: '能量分布',
                            areaStyle: {
                                color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
                                    { color: 'rgba(255, 145, 124, 0.1)', offset: 0 },
                                    { color: 'rgba(255, 145, 124, 0.9)', offset: 1 }
                                ])
                            },
                            lineStyle: { color: '#6a78ff' },
                            itemStyle: { color: '#6a78ff' }
                        }]
                    }]
                };
                radarChart.setOption(radarOption);

                // 2. 饼图 (能量占比)
                var pieChart = echarts.init(document.getElementById('wuxing-pie-chart'));
                var pieOption = {
                    title: { text: '五行能量占比', left: 'center', top: '10px', textStyle: { fontSize: 16, color: '#333' } },
                    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
                    legend: { bottom: '10px', left: 'center' },
                    color: ['#4caf50', '#f44336', '#795548', '#ffd700', '#2196f3'], // Wood, Fire, Earth, Metal, Water
                    series: [{
                        name: '五行占比',
                        type: 'pie',
                        radius: ['40%', '70%'],
                        avoidLabelOverlap: false,
                        itemStyle: {
                            borderRadius: 10,
                            borderColor: '#fff',
                            borderWidth: 2
                        },
                        label: { show: false, position: 'center' },
                        emphasis: {
                            label: { show: true, fontSize: 20, fontWeight: 'bold' }
                        },
                        labelLine: { show: false },
                        data: [
                            { value: elements.find(e => e.id === 'wood').score, name: '木' },
                            { value: elements.find(e => e.id === 'fire').score, name: '火' },
                            { value: elements.find(e => e.id === 'earth').score, name: '土' },
                            { value: elements.find(e => e.id === 'metal').score, name: '金' },
                            { value: elements.find(e => e.id === 'water').score, name: '水' }
                        ]
                    }]
                };
                pieChart.setOption(pieOption);

                // 响应式调整
                window.addEventListener('resize', function () {
                    radarChart.resize();
                    pieChart.resize();
                });
            },
            // 神煞计算逻辑
            calculateShenSha: function (pillar, dayStem, dayBranch, monthBranch, yearBranch, isMan, pillarIndex) {
                // 准备 queryShenSha 需要的参数
                var ganzhi = pillar.heavenStem + pillar.earthBranch;
                var baziArr = [
                    this.year.heavenStem, this.year.earthBranch,
                    this.month.heavenStem, this.month.earthBranch,
                    this.day.heavenStem, this.day.earthBranch,
                    this.hour.heavenStem, this.hour.earthBranch
                ];
                // var isMan = this.gender == '1'; // 参数传入
                var nianNaYin = this.year.sound;

                // 调用 shensha.js 中的 queryShenSha 方法
                if (typeof window.queryShenSha === 'function') {
                    return window.queryShenSha(ganzhi, baziArr, isMan, pillarIndex, nianNaYin);
                } else {
                    console.warn('shensha.js not loaded or queryShenSha not found');
                    return [];
                }
            },


            // 计算刑冲合害关系
            calculateRelationships: function () {
                var stemMap = { '甲': 0, '乙': 1, '丙': 2, '丁': 3, '戊': 4, '己': 5, '庚': 6, '辛': 7, '壬': 8, '癸': 9 };
                var branchMap = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 };
                var pillarNames = ['年', '月', '日', '时']; // 简化名称

                var tg = [
                    stemMap[this.year.heavenStem],
                    stemMap[this.month.heavenStem],
                    stemMap[this.day.heavenStem],
                    stemMap[this.hour.heavenStem]
                ];
                var dz = [
                    branchMap[this.year.earthBranch],
                    branchMap[this.month.earthBranch],
                    branchMap[this.day.earthBranch],
                    branchMap[this.hour.earthBranch]
                ];

                if (typeof window.GetGX === 'function') {
                    var gxList = window.GetGX(tg, dz);
                    var result = {
                        stems: [],
                        branches: []
                    };

                    // 处理天干关系
                    if (gxList[0]) {
                        gxList[0].forEach(function (item) {
                            var fds = item[0];
                            var gx = item[1];
                            var desc = gx[4];
                            var pillars = Object.keys(fds).map(function (idx) { return pillarNames[idx]; }).join('+');
                            result.stems.push({ source: pillars, desc: desc });
                        });
                    }

                    // 处理地支关系
                    if (gxList[1]) {
                        gxList[1].forEach(function (item) {
                            var fds = item[0];
                            var gx = item[1];
                            var desc = gx[4];
                            var pillars = Object.keys(fds).map(function (idx) { return pillarNames[idx]; }).join('+');
                            result.branches.push({ source: pillars, desc: desc });
                        });
                    }

                    return result;
                } else {
                    console.warn('paipan.gx.js not loaded');
                    return { stems: [], branches: [] };
                }
            },

            // 新增核心方法：高级分析
            advancedAnalyze: function (dayMaster, pillars, sortedElements, scores, relationships) {
                var logs = [];
                var result = {
                    joy: '', use: '', avoid: '', foe: '', idle: '',
                    joyDesc: '', useDesc: '', avoidDesc: '', foeDesc: '',
                    firstChoice: '', secondChoice: '',
                    tabooDesc: '',
                    keyImagery: '',
                    strategy: ''
                };
                var summary = '';
                var suggestion = '';
                var climateText = '';
                var bodyStrengthText = '';
                var bodyStrength = null;
                var refinedStrength = '';

                var log = function (layer, msg) {
                    logs.push({ layer: layer, msg: msg });
                };

                // 基础信息准备
                var dmElement = this.getWuXingElement(dayMaster);
                var monthBranch = this.month.earthBranch;
                var monthElement = this.getWuXingElement(monthBranch);
                var genderText = this.gender == '1' ? '男' : '女';

                log('基础分析', '性别：' + genderText + '，日元：' + dayMaster + ' (' + WUXING_META.names[dmElement] + ')，生于' + monthBranch + '月 (' + WUXING_META.names[monthElement] + ')');

                // 1. 关键象义 (Key Imagery)
                var keyImages = [];
                if (relationships && (relationships.stems.length > 0 || relationships.branches.length > 0)) {
                    var relTexts = [];
                    relationships.stems.forEach(function (r) {
                        relTexts.push(r.source + ':' + r.desc);
                        if (r.desc.indexOf('合') >= 0) keyImages.push(r.source + '天干' + r.desc);
                        if (r.desc.indexOf('冲') >= 0) keyImages.push(r.source + '天干' + r.desc);
                    });
                    relationships.branches.forEach(function (r) {
                        relTexts.push(r.source + ':' + r.desc);
                        if (r.desc.indexOf('合') >= 0) keyImages.push(r.source + '地支' + r.desc);
                        if (r.desc.indexOf('冲') >= 0) keyImages.push(r.source + '地支' + r.desc);
                        if (r.desc.indexOf('刑') >= 0) keyImages.push(r.source + '地支' + r.desc);
                    });
                    log('刑冲合害', '命局存在以下关系：' + relTexts.join('；') + '。需注意其对五行能量流通的影响。');
                }
                result.keyImagery = keyImages.length > 0 ? keyImages.join('；') : '局中无明显刑冲合害关键象义';

                // 2. 计算身强 (Body Strength)
                bodyStrength = this.evaluateBodyStrength(dmElement, pillars);
                bodyStrengthText = this.buildBodyStrengthText(dmElement, bodyStrength);
                log('旺衰判断', bodyStrengthText + ' (得分：' + bodyStrength.score.toFixed(0) + ')');

                // 3. 细化旺衰原因 (Refined Strength)
                var totalScore = 0;
                for (var k in scores) totalScore += scores[k];

                var peerScore = scores[dmElement] || 0; // 比劫
                var supportScore = scores[WUXING_SUPPORT[dmElement]] || 0; // 印
                var childScore = scores[WUXING_CHILD[dmElement]] || 0; // 食伤
                var controlScore = scores[WUXING_CONTROL[dmElement]] || 0; // 官杀
                // --- Simplified Analysis: Only Strength and Tables ---

                // 1. Body Strength (Retained)
                // bodyStrength is already calculated above.

                // 2. Detailed Tables (Retained)
                var fiveElementTable = this.generateFiveElementTable(scores, dmElement);
                var relationshipTable = this.generateRelationshipTable(relationships, dmElement);

                // 3. Basic Summary (Simplified)
                summary = '此命局日主' + bodyStrength.level + ' (得分:' + bodyStrength.score.toFixed(1) + ')。';

                return {
                    summary: summary,
                    suggestion: '', // Removed
                    climate: '',    // Removed
                    bodyStrength: bodyStrength,
                    bodyStrengthText: bodyStrengthText,
                    refinedStrength: bodyStrength.level,
                    preferences: {}, // Removed
                    logs: logs,
                    tables: {
                        fiveElements: fiveElementTable,
                        relationships: relationshipTable
                    },
                    discussion: '' // Removed
                };
            },
            applyBranchRelations: function (scores, branches) {
                if (!branches || branches.length < 2) {
                    return;
                }
                for (var i = 0; i < branches.length; i++) {
                    var a = branches[i];
                    if (!a) {
                        continue;
                    }
                    for (var j = i + 1; j < branches.length; j++) {
                        var b = branches[j];
                        if (!b) {
                            continue;
                        }
                        this.adjustForRelation(scores, a, b);
                    }
                }
            },

            applyOtherBranchRelations: function (scores, branches, combinedBranches) {
                // Apply harm, punish, break relationships to uncombined branches only
                var types = ['harm', 'punish', 'break'];

                for (var t = 0; t < types.length; t++) {
                    var type = types[t];
                    var pairs = BRANCH_RELATIONS[type];
                    if (!pairs) continue;

                    for (var p = 0; p < pairs.length; p++) {
                        var pair = pairs[p];
                        var idx1 = branches.indexOf(pair[0]);
                        var idx2 = branches.indexOf(pair[1]);

                        // Only process if both exist and neither is combined
                        if (idx1 >= 0 && idx2 >= 0 &&
                            combinedBranches.indexOf(idx1) < 0 &&
                            combinedBranches.indexOf(idx2) < 0) {

                            var elem1 = this.getWuXingElement(pair[0]);
                            var elem2 = this.getWuXingElement(pair[1]);

                            if (elem1 && elem2) {
                                var effect = RELATION_EFFECT[type] || 0;
                                scores[elem1] += scores[elem1] * effect;
                                scores[elem2] += scores[elem2] * effect;
                            }
                        }
                    }
                }
            },
            adjustForRelation: function (scores, branchA, branchB) {
                var elementA = this.getWuXingElement(branchA);
                var elementB = this.getWuXingElement(branchB);
                if (!elementA || !elementB) {
                    return;
                }
                this.evaluateRelationEffect(scores, branchA, branchB, elementA, elementB);
            },
            evaluateRelationEffect: function (scores, branchA, branchB, elementA, elementB) {
                var self = this;
                var applyDelta = function (delta) {
                    self.applyRelationDelta(scores, elementA, delta);
                    self.applyRelationDelta(scores, elementB, delta);
                };
                if (this.relationMatched(BRANCH_RELATIONS.combine, branchA, branchB)) {
                    applyDelta(RELATION_EFFECT.combine);
                }
                if (this.relationMatched(BRANCH_RELATIONS.clash, branchA, branchB)) {
                    applyDelta(RELATION_EFFECT.clash);
                }
                if (this.relationMatched(BRANCH_RELATIONS.harm, branchA, branchB)) {
                    applyDelta(RELATION_EFFECT.harm);
                }
                if (this.relationMatched(BRANCH_RELATIONS.punish, branchA, branchB)) {
                    applyDelta(RELATION_EFFECT.punish);
                }
                if (this.relationMatched(BRANCH_RELATIONS.break, branchA, branchB)) {
                    applyDelta(RELATION_EFFECT.break);
                }
            },
            applyRelationDelta: function (scores, key, delta) {
                if (typeof scores[key] !== 'number') {
                    return;
                }
                scores[key] = Math.max(0, scores[key] + delta);
            },
            relationMatched: function (pairs, a, b) {
                if (!pairs || !pairs.length) {
                    return false;
                }
                for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i];
                    if ((pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)) {
                        return true;
                    }
                }
                return false;
            },
            getWuXingLevel: function (score, avg) {
                if (!avg) {
                    return '平衡';
                }
                var ratio = score / avg;
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
            },
            describeWuXing: function (key, level, percentage, pillars, logs) {
                // Generate score derivation process description
                var elementName = WUXING_META.names[key];

                // If we have detailed logs from instrumentation, use them
                if (logs && logs.length > 0) {
                    var derivation = logs.map(function (log) {
                        var valStr = '';
                        if (log.type === 'mult') {
                            valStr = '×' + log.value.toFixed(2);
                        } else {
                            var sign = log.value >= 0 ? '+' : '';
                            valStr = sign + log.value.toFixed(1);
                        }
                        return log.reason + '(' + valStr + ')';
                    });

                    return elementName + ' ' + percentage.toFixed(1) + '%：' + derivation.join('，');
                }

                // Fallback for legacy calls (should not happen with new updateWuXingEnergy)
                return elementName + ' ' + percentage.toFixed(1) + '%：无详细来源记录';
            },
            buildWuXingSuggestion: function (sorted) {
                if (!sorted || !sorted.length) {
                    return '五行资料不足，暂无法评估喜用神。';
                }
                var strongest = sorted[0];
                var weakest = sorted[sorted.length - 1];
                var control = WUXING_CONTROL[strongest.id];
                var support = WUXING_SUPPORT[weakest.id];
                var parts = [];
                if (strongest && control) {
                    parts.push(strongest.name + strongest.level + '，宜取' + WUXING_META.names[control] + '泄制以稳势');
                }
                if (weakest && support) {
                    parts.push(weakest.name + weakest.level + '，宜得' + WUXING_META.names[support] + '生扶作为喜用优先考量');
                }
                return parts.join('；');
            },
            evaluateBodyStrength: function (dayElement, pillars) {
                if (!dayElement) return null;

                // UNIFIED STRENGTH CALCULATION (Using wuxingEnergy)
                // This ensures all advanced refinements (Season, Combos, Void, etc.) are reflected in strength.

                if (!this.wuxingEnergy || !this.wuxingEnergy.elements) {
                    // console.warn('wuxingEnergy not ready, using fallback');
                    return { score: 50, level: '平和', code: 'balanced' };
                }

                // 1. Get precise scores from wuxingEnergy
                var getScore = (elm) => {
                    var item = this.wuxingEnergy.elements.find(e => e.id === elm);
                    return item ? item.score : 0;
                };

                var selfScore = getScore(dayElement);
                var printElement = WUXING_SUPPORT[dayElement];
                var printScore = getScore(printElement);

                var totalScore = this.wuxingEnergy.totalScore || 1; // Avoid divide by zero
                var totalSelfStrength = selfScore + printScore;
                var selfPercentage = (totalSelfStrength / totalScore) * 100;

                // 2. Determine Strength Level
                var level = '';
                var code = '';
                var guidance = '';

                // Pattern Detection Logic
                if (selfPercentage < 10) {
                    // Extremely Weak - Likely "Follow" (Cong)
                    // Check if it's "True Follow" or "Fake Follow"
                    // If score is very close to 0 (<5%), it's True Follow.
                    if (selfPercentage < 5) {
                        level = '从弱'; // True Follow
                        code = 'congWeak';
                        guidance = '顺势而为，弃命从势';
                    } else {
                        level = '极弱'; // Fake Follow / Extremely Weak
                        code = 'extremelyWeak';
                        guidance = '宜生扶，忌克泄';
                    }
                } else if (selfPercentage < 30) {
                    level = '身弱';
                    code = 'weak';
                    guidance = '喜印比生扶，忌官杀克制';
                } else if (selfPercentage < 45) {
                    level = '偏弱'; // Neutral Weak
                    code = 'neutralWeak';
                    guidance = '宜帮扶，忌克泄';
                } else if (selfPercentage <= 55) {
                    level = '中和'; // Balanced
                    code = 'balanced';
                    guidance = '阴阳平衡，随运而动';
                } else if (selfPercentage < 70) {
                    level = '偏旺'; // Neutral Strong
                    code = 'neutralStrong';
                    guidance = '宜克泄耗，忌印比';
                } else if (selfPercentage < 85) {
                    level = '身旺';
                    code = 'strong';
                    guidance = '喜官杀克制，食伤泄秀';
                } else {
                    // Extremely Strong - Likely "Dominant" (Zhuan Wang)
                    level = '专旺';
                    code = 'dominant';
                    guidance = '顺势而为，不可逆势';
                }

                return {
                    score: selfPercentage, // Use percentage as the normalized score (0-100)
                    level: level,
                    code: code,
                    guidance: guidance,
                    details: {
                        selfScore: selfScore,
                        printScore: printScore,
                        totalScore: totalScore,
                        percentage: selfPercentage
                    }
                };
            },
            getRelationType: function (dayElement, otherElement) {
                if (!dayElement || !otherElement) {
                    return 'neutral';
                }
                if (dayElement === otherElement) {
                    return 'peer'; // 比劫
                }
                if (WUXING_SUPPORT[dayElement] === otherElement) {
                    return 'support'; // 印绶
                }
                if (WUXING_CHILD[dayElement] === otherElement) {
                    return 'child'; // 食伤
                }
                if (WUXING_CONTROLLED[dayElement] === otherElement) {
                    return 'wealth'; // 财星
                }
                if (WUXING_CONTROL[dayElement] === otherElement) {
                    return 'officer'; // 官杀
                }
                return 'neutral';
            },
            getSeasonalImpact: function (dayElement, monthElement) {
                if (!dayElement || !monthElement) {
                    return 0;
                }
                if (dayElement === monthElement) {
                    return 20;
                }
                if (WUXING_SUPPORT[dayElement] === monthElement) {
                    return 14;
                }
                if (WUXING_CHILD[dayElement] === monthElement) {
                    return -12;
                }
                if (WUXING_CONTROLLED[dayElement] === monthElement) {
                    return -10;
                }
                if (WUXING_CONTROL[dayElement] === monthElement) {
                    return -15;
                }
                return 0;
            },
            collectStrengthContribution: function (dayElement, symbol, isStem, weight) {
                if (!symbol) {
                    return 0;
                }
                var element = this.getWuXingElement(symbol);
                if (!element) {
                    return 0;
                }
                var relation = this.getRelationType(dayElement, element);
                var table = isStem ? BODY_STEM_WEIGHTS : BODY_BRANCH_WEIGHTS;
                var base = table[relation] || 0;
                return base * (weight || 1);
            },
            computeClimateNeed: function () {
                var branch = this.month.earthBranch;
                if (!branch) {
                    return null;
                }
                var meta = CLIMATE_NEEDS[branch];
                if (!meta) {
                    return null;
                }
                var primaryName = WUXING_META.names[meta.primary] || meta.primary;
                var secondaryName = WUXING_META.names[meta.secondary] || meta.secondary;
                var text = meta.template
                    .replace('{branch}', branch)
                    .replace('{primary}', primaryName)
                    .replace('{secondary}', secondaryName);
                return {
                    branch: branch,
                    type: meta.type,
                    primary: meta.primary,
                    secondary: meta.secondary,
                    description: text
                };
            },
            buildClassicalAdvice: function (dayElement, bodyStrength, sortedElements, climate, distributionSummary) {
                if (!dayElement || !bodyStrength) {
                    return null;
                }
                var names = WUXING_META.names;
                var peerName = names[dayElement] || '';
                var supportElem = WUXING_SUPPORT[dayElement];
                var supportName = supportElem ? names[supportElem] : '';
                var childElem = WUXING_CHILD[dayElement];
                var childName = childElem ? names[childElem] : '';
                var wealthElem = WUXING_CONTROLLED[dayElement];
                var wealthName = wealthElem ? names[wealthElem] : '';
                var officerElem = WUXING_CONTROL[dayElement];
                var officerName = officerElem ? names[officerElem] : '';
                var summary = '日主属' + peerName + '，' + bodyStrength.level + '（' + bodyStrength.score.toFixed(0) + '分），依据子平格局法先辨身旺衰再谈喜用。';
                var strategy = '';
                if (bodyStrength.code === 'strong' || bodyStrength.code === 'sturdy') {
                    strategy = '以' + childName + '食伤泄秀、' + wealthName + '财星去滞，再辅以' + officerName + '官杀制衡，使 ' + peerName + '气势有出有制。';
                } else if (bodyStrength.code === 'balanced') {
                    strategy = '身平可随大势，先顾' + (climate ? WUXING_META.names[climate.primary] : childName) + '调候，再因循格局取用，忌偏补。';
                } else if (bodyStrength.code === 'weak') {
                    strategy = '遵循“扶抑并举”，首取' + peerName + '比劫与' + supportName + '印绶扶身，待身气上扬后再借' + childName + '食伤泄秀，避免官杀过早制身。';
                } else {
                    strategy = '局呈从弱，宜全力迎' + supportName + '印绶与' + peerName + '比劫成势，忌强行补' + officerName + '官杀，以免破格。';
                }
                var climateText = climate ? climate.description : '月令平和，调候可随运势灵活调配。';
                var appended = distributionSummary ? '（五行分布：' + distributionSummary + '）' : '';
                return {
                    summary: summary + appended,
                    strategy: strategy,
                    climate: climateText
                };
            },
            generateFiveElementTable: function (scores, dmElement) {
                var total = 0;
                for (var k in scores) total += scores[k];
                if (total === 0) return [];

                var list = [];
                var maxScore = -1, minScore = 9999;

                WUXING_META.order.forEach(function (elm) {
                    var s = scores[elm];
                    if (s > maxScore) maxScore = s;
                    if (s < minScore) minScore = s;
                });

                var self = this;
                WUXING_META.order.forEach(function (elm) {
                    var s = scores[elm];
                    var pct = (s / total * 100).toFixed(1) + '%';
                    var relation = self.getRelationType(dmElement, elm);
                    var tenGod = '';
                    switch (relation) {
                        case 'peer': tenGod = '比劫'; break;
                        case 'support': tenGod = '印星'; break;
                        case 'child': tenGod = '食伤'; break;
                        case 'wealth': tenGod = '财星'; break;
                        case 'officer': tenGod = '官杀'; break;
                    }

                    var status = '';
                    if (s === maxScore) status = '最旺';
                    else if (s === minScore) status = '最弱';
                    else if (s > total * 0.2) status = '次旺';
                    else if (s < total * 0.1) status = '极弱';
                    else status = '平和';

                    var summary = '';
                    if (status === '最旺' || status === '次旺') {
                        if (relation === 'officer') summary = '官杀重，日主压力大，主事业心、约束力、责任感。';
                        else if (relation === 'wealth') summary = '财星旺，生官杀，主财富追求、情感付出。';
                        else if (relation === 'child') summary = '食伤旺，泄身太过，主才华发挥但易耗神。';
                        else if (relation === 'support') summary = '印星旺，生身太过，主依赖心强，或思想复杂。';
                        else if (relation === 'peer') summary = '比劫旺，帮身有力，主意志坚定，但易固执。';
                    } else if (status === '最弱' || status === '极弱') {
                        if (relation === 'officer') summary = '官杀弱，约束力不足，或事业变动多。';
                        else if (relation === 'wealth') summary = '财星弱，求财不易，或财来财去。';
                        else if (relation === 'child') summary = '食伤弱，才华不易显露，或生财无源。';
                        else if (relation === 'support') summary = '印星弱，缺乏贵人扶持，或学习需更努力。';
                        else if (relation === 'peer') summary = '比劫弱，日主孤立无援，亟需帮扶。';
                    } else {
                        summary = '力量适中，发挥稳定。';
                    }

                    list.push({
                        element: WUXING_META.names[elm],
                        score: s.toFixed(1),
                        percentage: pct,
                        tenGod: tenGod,
                        status: status,
                        summary: summary
                    });
                });
                return list;
            },
            generateRelationshipTable: function (relationships, dmElement) {
                var list = [];
                if (!relationships) return list;

                // Helper to map impact
                var getImpact = function (type, source, target, desc) {
                    var impact = '';
                    var change = '';

                    if (desc.indexOf('合化') >= 0) {
                        // e.g. "Wu Gui Combine Fire"
                        var targetElm = desc.split('化')[1]; // Fire
                        change = '增加' + targetElm + '的力量';
                        if (type.indexOf('天干') >= 0) {
                            impact = '合化成功，' + targetElm + '气势增强。若为喜用则吉，为忌神则凶。';
                        } else {
                            impact = '地支合局，' + targetElm + '局成。';
                        }
                    } else if (desc.indexOf('冲') >= 0) {
                        change = '冲动不稳';
                        impact = '主变动、冲突。' + source + '与' + target + '相冲，根基不稳。';
                    } else if (desc.indexOf('刑') >= 0) {
                        change = '刑伤';
                        impact = '主折磨、是非。需防身体或精神压力。';
                    } else if (desc.indexOf('害') >= 0) {
                        change = '相互妨害';
                        impact = '主暗伤、不和。';
                    } else {
                        change = '拱合/会局';
                        impact = '气势暗聚，待时而发。';
                    }
                    return { change: change, impact: impact };
                };

                // Process Stems
                if (relationships.stems) {
                    relationships.stems.forEach(function (r) {
                        var info = getImpact('天干', r.source, r.target, r.desc);
                        list.push({
                            relation: r.source + '+' + r.target,
                            type: r.desc,
                            change: info.change,
                            impact: info.impact
                        });
                    });
                }
                // Process Branches
                if (relationships.branches) {
                    relationships.branches.forEach(function (r) {
                        var info = getImpact('地支', r.source, r.target, r.desc);
                        list.push({
                            relation: r.source + '+' + r.target,
                            type: r.desc,
                            change: info.change,
                            impact: info.impact
                        });
                    });
                }
                return list;
            },
            // Zi Ping Zhen Quan - Determine Pattern (子平真诠·定格)
            determineZiPingPattern: function (dayStem, monthBranch, monthHiddenStems, pillars) {
                if (!monthHiddenStems || monthHiddenStems.length === 0) return { name: '杂气格', desc: '月令无透干，取杂气为格。' };

                // 1. Check if Main Qi (Ben Qi) reveals
                const mainQi = monthHiddenStems[0]; // First one is usually Ben Qi in this system
                const isMainRevealed = [pillars.year.heavenStem, pillars.month.heavenStem, pillars.hour.heavenStem].includes(mainQi.name);

                if (isMainRevealed) {
                    const tenStar = mainQi.tenStar; // e.g. "正官"
                    if (ZI_PING_PATTERNS[tenStar]) {
                        return ZI_PING_PATTERNS[tenStar];
                    }
                }

                // 2. Check Secondary Qi
                for (let i = 1; i < monthHiddenStems.length; i++) {
                    const subQi = monthHiddenStems[i];
                    const isSubRevealed = [pillars.year.heavenStem, pillars.month.heavenStem, pillars.hour.heavenStem].includes(subQi.name);
                    if (isSubRevealed) {
                        const tenStar = subQi.tenStar;
                        if (ZI_PING_PATTERNS[tenStar]) {
                            return { name: ZI_PING_PATTERNS[tenStar].name + '(余气)', desc: ZI_PING_PATTERNS[tenStar].desc };
                        }
                    }
                }

                // 3. Fallback to Main Qi Ten Star if nothing reveals
                const mainTenStar = mainQi.tenStar;
                if (ZI_PING_PATTERNS[mainTenStar]) {
                    return { name: ZI_PING_PATTERNS[mainTenStar].name + '(未透)', desc: ZI_PING_PATTERNS[mainTenStar].desc };
                }

                return { name: '普通格局', desc: '五行生克制化之常理。' };
            },

            // Qiong Tong Bao Jian - Get Climate Advice (穷通宝鉴·调候)
            getQiongTongClimate: function (dayStem, monthBranch) {
                const key = dayStem + monthBranch;
                return QIONG_TONG_ADVICE[key] || '需结合全局寒暖湿燥综合判断。';
            },

            advancedAnalyze: function (dayStem, pillars, sortedElements, scores, relationships) {
                if (!pillars || !pillars.month) return {};
                const dayElement = this.getWuXingElement(dayStem);
                const monthBranch = pillars.month.earthBranch;

                // 1. Body Strength (Existing Logic)
                const bodyStrength = this.evaluateBodyStrength(dayElement, pillars);

                // 2. Zi Ping Pattern (Standard)
                const monthHiddenStems = pillars.month.hideHeavenStems;
                let pattern = this.determineZiPingPattern(dayStem, monthBranch, monthHiddenStems, pillars);

                // 2.1 Override with Special Patterns from Body Strength
                if (bodyStrength.code === 'congWeak') {
                    pattern = { name: '从弱格', desc: '日主极弱，弃命从势。顺从局中旺神为吉，逆势生扶为凶。' };
                } else if (bodyStrength.code === 'dominant') {
                    pattern = { name: '专旺格', desc: '日主极旺，气势专一。顺其气势为吉，逆势克制为凶。' };
                }

                // 3. Qiong Tong Climate (New)
                const climateAdvice = this.getQiongTongClimate(dayStem, monthBranch);

                // 4. Preferences (Updated with new logic)
                const preferences = this.buildPreferenceMap(dayElement, bodyStrength, sortedElements, climateAdvice);

                // 5. Generate Logs
                const logs = [];
                logs.push(`日主[${dayStem}]生于[${monthBranch}]月，调候建议：${climateAdvice}`);
                logs.push(`格局判定：${pattern.name} - ${pattern.desc}`);
                logs.push(`身强判定：${bodyStrength.level} (得分${bodyStrength.score.toFixed(1)})`);

                // 6. Generate Richer Suggestion
                let suggestion = '';
                if (pattern.name.includes('从')) {
                    suggestion = `此命局为${pattern.name}，最喜${preferences.joy}、${preferences.use}顺势而为。切忌${preferences.avoid}强行生扶，否则易起冲突。`;
                } else if (pattern.name.includes('专旺')) {
                    suggestion = `此命局为${pattern.name}，最喜${preferences.joy}、${preferences.use}顺其气势。切忌${preferences.avoid}逆势克制，以免触怒旺神。`;
                } else {
                    // Normal Pattern
                    suggestion = `此命局以${pattern.name}论，日主${bodyStrength.level}。首取${preferences.joy}为用，以平衡命局；次取${preferences.use}为辅。${climateAdvice.split('。')[0]}。`;
                }

                const result = {
                    summary: `本命局为【${pattern.name}】。${pattern.desc}`,
                    suggestion: suggestion,
                    climate: climateAdvice,
                    bodyStrength: bodyStrength,
                    bodyStrengthText: bodyStrength.level,
                    preferences: {
                        likes: [preferences.joy, preferences.use].filter(x => x && x !== '—'),
                        dislikes: [preferences.avoid, preferences.foe].filter(x => x && x !== '—')
                    },
                    logs: logs || []
                };

                // console.log('=== Advanced Analysis Result ===');
                // console.log('Pattern:', pattern.name);
                // console.log('Climate:', climateAdvice);
                // console.log('Preferences:', preferences);
                // console.log('Suggestion:', suggestion);
                // console.log('Result:', result);

                return result;
            },

            buildBodyStrengthText: function (dayElement, bodyStrength) {
                if (!dayElement || !bodyStrength) {
                    return '';
                }
                var name = WUXING_META.names[dayElement] || dayElement;
                return '日元属' + name + '，' + bodyStrength.level + '，' + bodyStrength.guidance;
            },
            buildPreferenceMap: function (dayElement, bodyStrength, sortedElements, climate) {
                if (!dayElement || !bodyStrength) {
                    return { joy: '', use: '', avoid: '', foe: '', diagnosis: '资料不足' };
                }
                var names = WUXING_META.names;
                var peer = names[dayElement] || '';
                var support = names[WUXING_SUPPORT[dayElement]] || '';
                var child = names[WUXING_CHILD[dayElement]] || '';
                var wealth = names[WUXING_CONTROLLED[dayElement]] || '';
                var officer = names[WUXING_CONTROL[dayElement]] || '';

                // Extract Climate Useful God
                var climatePrimary = '';
                if (climate && typeof climate === 'string') {
                    var match = climate.match(/[专调]?用([甲乙丙丁戊己庚辛壬癸])/);
                    if (match) {
                        var stem = match[1];
                        var elm = STEM_ELEMENT_MAP[stem];
                        if (elm) climatePrimary = names[elm];
                    }
                }

                var result = { joy: '', use: '', avoid: '', foe: '', diagnosis: '' };
                var diagnosis = [];

                // Helper to get percentage
                var getPct = (elmName) => {
                    var item = sortedElements.find(i => i.name === elmName);
                    return item ? parseFloat(item.percentage) : 0;
                };

                switch (bodyStrength.code) {
                    case 'strong':
                    case 'neutralStrong':
                        // Strong: Check WHY it is strong
                        var peerPct = getPct(peer);
                        var supportPct = getPct(support);

                        if (peerPct > supportPct) {
                            diagnosis.push('比劫过旺');
                            // Too much Peer -> Use Officer (Control) or Child (Drain)
                            // Wealth is risky if Peer is strong (Rob Wealth), unless Child bridges
                            result.joy = officer;
                            result.use = child;
                            result.avoid = support;
                            result.foe = peer;
                        } else {
                            diagnosis.push('印绶过旺');
                            // Too much Resource -> Use Wealth (Control Resource)
                            // Child is bad if Resource is strong (Owl steals Food)
                            result.joy = wealth;
                            result.use = child; // Can use Child if Wealth protects it, but Wealth is priority
                            result.avoid = support;
                            result.foe = officer; // Officer births Resource (bad)
                        }
                        break;

                    case 'dominant':
                        diagnosis.push('专旺成势');
                        result.joy = child;
                        result.use = peer;
                        result.avoid = officer;
                        result.foe = wealth;
                        break;

                    case 'weak':
                    case 'neutralWeak':
                    case 'extremelyWeak':
                        // Weak: Check WHY it is weak
                        var officerPct = getPct(officer);
                        var childPct = getPct(child);
                        var wealthPct = getPct(wealth);

                        var maxDrain = Math.max(officerPct, childPct, wealthPct);

                        if (maxDrain === officerPct) {
                            diagnosis.push('官杀攻身');
                            // Weak due to Officer -> Use Resource (Bridge: Officer -> Resource -> Day)
                            result.joy = support; // First priority
                            result.use = peer;    // Help resist
                            result.avoid = wealth; // Wealth births Officer (Bad)
                            result.foe = child;   // Child fights Officer (Clash - can be good but risky for weak DM)
                        } else if (maxDrain === childPct) {
                            diagnosis.push('食伤泄气');
                            // Weak due to Output -> Use Resource (Control Output + Birth Day)
                            result.joy = support;
                            result.use = peer;
                            result.avoid = child;
                            result.foe = wealth; // Wealth drains Output further? No, Output births Wealth. Wealth drains Day.
                        } else {
                            diagnosis.push('财多身弱');
                            // Weak due to Wealth -> Use Peer (Control Wealth + Help Day)
                            result.joy = peer;
                            result.use = support;
                            result.avoid = child; // Child births Wealth (Bad)
                            result.foe = officer; // Wealth births Officer (Bad)
                        }
                        break;

                    case 'congWeak':
                        diagnosis.push('弃命从弱');
                        // Follow the strongest force
                        var maxP = sortedElements[0];
                        result.joy = maxP.name;
                        result.use = '顺势五行';
                        result.avoid = support;
                        result.foe = peer;
                        break;

                    default: // Balanced
                        diagnosis.push('五行中和');
                        result.joy = climatePrimary || child || '随运而定';
                        result.use = wealth || '平衡为上';
                        result.avoid = '过激';
                        result.foe = '冲克';
                }

                // Climate Adjustment
                if (climatePrimary && climatePrimary !== result.joy && climatePrimary !== result.use) {
                    if (climatePrimary !== result.avoid && climatePrimary !== result.foe) {
                        if (bodyStrength.code === 'weak' || bodyStrength.code === 'neutralWeak') {
                            // For weak, survival first, climate second
                            diagnosis.push('兼顾调候');
                            result.use += '、' + climatePrimary + '(调候)';
                        } else {
                            diagnosis.push('调候为急');
                            result.joy = climatePrimary;
                        }
                    }
                }

                result.diagnosis = diagnosis.join('，');
                return result;
            },
            ensureSolarFromDisplay: function () {
                try {
                    if (this.calendarType === 'lunar') {
                        // convert display (lunar) -> solar for internal computation
                        if (typeof window.convertLunarToSolar === 'function') {
                            var ly = parseInt(this.display.year, 10);
                            var lm = parseInt(this.display.month, 10);
                            var ld = parseInt(this.display.day, 10);
                            if (!Number.isInteger(ly) || !Number.isInteger(lm) || !Number.isInteger(ld)) return;
                            var conv = window.convertLunarToSolar(ly, lm, ld);
                            if (conv) {
                                this.solar.year = conv.y;
                                this.solar.month = conv.m;
                                this.solar.day = conv.d;
                                return;
                            }
                        }
                        // fallback: attempt naive copy
                        this.solar.year = parseInt(this.display.year, 10) || this.solar.year;
                        this.solar.month = parseInt(this.display.month, 10) || this.solar.month;
                        this.solar.day = parseInt(this.display.day, 10) || this.solar.day;
                    } else {
                        // calendarType === 'solar'
                        this.solar.year = parseInt(this.display.year, 10) || this.solar.year;
                        this.solar.month = parseInt(this.display.month, 10) || this.solar.month;
                        this.solar.day = parseInt(this.display.day, 10) || this.solar.day;
                    }
                } catch (e) { console.error('ensureSolarFromDisplay error', e); }
            },
            onSelectDecadeFortune: function (i) {
                this.selected.decadeFortune = i;
                this.selected.fortune = 0;
            },
            onSelectFortune: function (i) {
                this.selected.fortune = i;
            },
            buildFortune: function (me, fortune) {
                // 流年
                var y = fortune.getSixtyCycleYear();
                // 流月
                var months = [];
                var l = y.getMonths();
                for (var i = 0, j = l.length; i < j; i++) {
                    var m = l[i];
                    months.push({
                        sixtyCycle: m.getSixtyCycle().getName(),
                        tenStar: me.getTenStar(m.getSixtyCycle().getHeavenStem()).getName(),
                    });
                }
                var year = {
                    year: y.getYear(),
                    sixtyCycle: y.getSixtyCycle().getName(),
                    tenStar: me.getTenStar(y.getSixtyCycle().getHeavenStem()).getName(),
                    months: months
                };

                return {
                    year: year,
                    age: fortune.getAge(),
                    sixtyCycle: fortune.getSixtyCycle().getName(),
                    tenStar: me.getTenStar(fortune.getSixtyCycle().getHeavenStem()).getName()
                };
            },
            buildDecadeFortune: function (me, decadeFortune) {
                // 小运
                var fortunes = [];
                var fortune = decadeFortune.getStartFortune();
                // 过滤掉童限中小于1岁的
                if (fortune.getAge() > 0) {
                    fortunes.push(this.buildFortune(me, fortune));
                }
                for (var i = 0; i < 9; i++) {
                    fortune = fortune.next(1);
                    // 过滤掉童限中小于1岁的
                    if (fortune.getAge() > 0) {
                        fortunes.push(this.buildFortune(me, fortune));
                    }
                }

                return {
                    startYear: decadeFortune.getStartSixtyCycleYear().getYear(),
                    endYear: decadeFortune.getEndSixtyCycleYear().getYear(),
                    startAge: decadeFortune.getStartAge(),
                    endAge: decadeFortune.getEndAge(),
                    sixtyCycle: decadeFortune.getSixtyCycle().getName(),
                    tenStar: me.getTenStar(decadeFortune.getSixtyCycle().getHeavenStem()).getName(),
                    fortunes: fortunes
                };
            },
            buildHideHeavenStems: function (me, sixtyCycle) {
                var l = [];
                var hs = sixtyCycle.getEarthBranch().getHideHeavenStems();
                for (var i = 0, j = hs.length; i < j; i++) {
                    var h = hs[i].getHeavenStem();
                    l.push({
                        name: h.getName(),
                        tenStar: me.getTenStar(h).getName()
                    });
                }
                return l;
            },
            buildExtraEarthBranches: function (sixtyCycle) {
                var l = [];
                var hs = sixtyCycle.getExtraEarthBranches();
                for (var i = 0, j = hs.length; i < j; i++) {
                    l.push(hs[i].getName());
                }
                return l;
            },
            updateBaziSummary: function () {
                try {
                    const genderText = this.gender === '1' ? '男' : '女';
                    const solarDate = `${this.solar.year}-${String(this.solar.month).padStart(2, '0')}-${String(this.solar.day).padStart(2, '0')} ${String(this.solar.hour).padStart(2, '0')}:${String(this.solar.minute).padStart(2, '0')}`;

                    // Get current date for reference
                    const now = new Date();
                    const currentDate = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
                    const currentAge = now.getFullYear() - this.solar.year;

                    // --- Construct Rich AI Prompt ---
                    let prompt = `**角色设定**：你是一位精通《子平真诠》、《穷通宝鉴》和《滴天髓》的资深命理大师。

**任务**：请深入分析以下八字命盘。不要仅仅罗列数据，请提供综合性的专业解读。

### 1. 命盘信息
- **性别**：${genderText}
- **出生时间（公历）**：${solarDate}
- **出生时间（农历）**：${this.lunarStr || '未知'}
- **当前日期**：${currentDate}
- **当前虚岁**：${currentAge + 1}岁

| 柱 | 天干 | 地支 | 主星 | 藏干 | 纳音 |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **年柱** | ${this.year.heavenStem} | ${this.year.earthBranch} | ${this.year.tenStar.heavenStem} | ${this.year.hideHeavenStems.map(h => h.name).join('')} | ${this.year.sound} |
| **月柱** | ${this.month.heavenStem} | ${this.month.earthBranch} | ${this.month.tenStar.heavenStem} | ${this.month.hideHeavenStems.map(h => h.name).join('')} | ${this.month.sound} |
| **日柱** | ${this.day.heavenStem} | ${this.day.earthBranch} | (日主) | ${this.day.hideHeavenStems.map(h => h.name).join('')} | ${this.day.sound} |
| **时柱** | ${this.hour.heavenStem} | ${this.hour.earthBranch} | ${this.hour.tenStar.heavenStem} | ${this.hour.hideHeavenStems.map(h => h.name).join('')} | ${this.hour.sound} |

### 2. 五行能量量化
*基于得令、得地、得势的加权计算：*
`;
                    // Add Energy Scores
                    if (this.wuxingEnergy && Array.isArray(this.wuxingEnergy.elements)) {
                        this.wuxingEnergy.elements.forEach(e => {
                            prompt += `- **${e.name}**: ${e.percentage.toFixed(1)}% (得分: ${e.score.toFixed(1)}) - ${e.level}\n`;
                        });
                        prompt += `- **平衡指数**: ${this.wuxingEnergy.balanceIndex.toFixed(1)}%\n`;
                    }

                    // Add Relationships
                    if (this.relationships) {
                        prompt += `\n### 3. 刑冲合害\n`;
                        let hasRel = false;
                        if (this.relationships.stems && this.relationships.stems.length) {
                            prompt += `- **天干**: ${this.relationships.stems.map(r => r.source + ' ' + r.desc).join(', ')}\n`;
                            hasRel = true;
                        }
                        if (this.relationships.branches && this.relationships.branches.length) {
                            prompt += `- **地支**: ${this.relationships.branches.map(r => r.source + ' ' + r.desc).join(', ')}\n`;
                            hasRel = true;
                        }
                        if (!hasRel) prompt += `- 无明显刑冲合害。\n`;
                    }

                    // Add Decade Fortunes
                    if (this.decadeFortunes && this.decadeFortunes.length > 0) {
                        prompt += `\n### 4. 大运列表\n`;
                        prompt += `| 大运 | 起始年龄 | 开始年份 | 结束年份 | 十神 |\n`;
                        prompt += `| :---: | :---: | :---: | :---: | :---: |\n`;

                        this.decadeFortunes.forEach((df, index) => {
                            if (index < 8) { // 只显示前8步大运
                                prompt += `| ${df.sixtyCycle} | ${df.startAge}岁 | ${df.startYear}年 | ${df.endYear}年 | ${df.tenStar} |\n`;
                            }
                        });

                        // Mark current fortune
                        const currentFortune = this.decadeFortunes.find(df =>
                            currentAge + 1 >= df.startAge && currentAge + 1 <= df.endAge
                        );
                        if (currentFortune) {
                            prompt += `\n**当前大运**: ${currentFortune.sixtyCycle}（${currentFortune.startAge}-${currentFortune.endAge}岁，${currentFortune.tenStar}）\n`;
                        }
                    }

                    // Add Preliminary Analysis (Algorithm Output)
                    if (this.wuxingEnergy && this.wuxingEnergy.summary) {
                        prompt += `\n### 5. 算法预判\n`;
                        prompt += `- **格局**: ${this.wuxingEnergy.summary}\n`;
                        prompt += `- **旺衰**: ${this.wuxingEnergy.bodyStrengthText} (得分: ${this.wuxingEnergy.bodyStrength.score.toFixed(1)})\n`;
                        prompt += `- **调候**: ${this.wuxingEnergy.climate}\n`;

                        // Add the new Diagnosis
                        let diag = this.wuxingEnergy.preferences ? this.wuxingEnergy.preferences.diagnosis : '';
                        if (diag) prompt += `- **病药诊断**: ${diag}\n`;

                        let likes = this.wuxingEnergy.preferences ? this.wuxingEnergy.preferences.likes.join(', ') : '';
                        let dislikes = this.wuxingEnergy.preferences ? this.wuxingEnergy.preferences.dislikes.join(', ') : '';
                        prompt += `- **建议喜用**: ${likes}\n`;
                        prompt += `- **建议忌神**: ${dislikes}\n`;
                    }

                    prompt += `\n### 6. AI综合分析请求\n`;
                    prompt += `请基于以上命盘数据，运用你的专业知识进行深度综合分析，给出以下方面的详细解读：\n\n`;

                    prompt += `#### 6.1 格局与用神精准判定\n`;
                    prompt += `1. **格局验证**：你是否认同算法判定的"${this.wuxingEnergy ? this.wuxingEnergy.summary : ''}"和"${this.wuxingEnergy ? this.wuxingEnergy.bodyStrengthText : ''}"？请详细说明理由。\n`;
                    prompt += `2. **真用神定夺**：基于命局的平衡、调候、通关需求，请明确指出此命的**真正用神**是什么？是扶抑用神、调候用神还是通关用神？为什么？\n`;
                    prompt += `3. **喜忌五行**：请根据你判定的用神，明确列出此命的喜用五行和忌讳五行（可能与算法建议不同）。\n\n`;

                    prompt += `#### 6.2 大运流年分析\n`;
                    prompt += `1. **当前大运评估**：分析当前所行大运的吉凶，对命主有何影响？\n`;
                    prompt += `2. **未来大运趋势**：哪几步大运最为吉利？哪几步需要特别注意？\n`;
                    prompt += `3. **关键年份提示**：未来5-10年内，哪些年份特别重要（包括流年天干地支的作用）？\n\n`;

                    prompt += `#### 6.3 事业发展指导\n`;
                    prompt += `1. **适合行业**：结合命局五行喜忌和十神配置，推荐最适合的3-5个行业方向。\n`;
                    prompt += `2. **职业特质**：此命适合从事管理、技术、艺术、服务还是其他类型的工作？\n`;
                    prompt += `3. **事业高峰期**：何时是事业发展的黄金期？应该如何把握？\n`;
                    prompt += `4. **当前事业建议**：基于当前年龄和大运，现阶段事业上应该注意什么？\n\n`;

                    prompt += `#### 6.4 财运分析\n`;
                    prompt += `1. **财运等级**：此命财运属于哪个层次（大富、小康、平稳、需努力）？\n`;
                    prompt += `2. **求财方式**：适合正财（工资、稳定收入）还是偏财（投资、项目）？\n`;
                    prompt += `3. **财运旺期**：哪些年份或大运阶段财运最旺？\n`;
                    prompt += `4. **理财建议**：基于命局特点，给出具体的理财和投资建议。\n\n`;

                    prompt += `#### 6.5 婚姻感情\n`;
                    prompt += `1. **配偶特征**：从命局看配偶的性格、外貌、能力特点。\n`;
                    prompt += `2. **婚姻状态**：婚姻是否顺利？有无波折？何时适合结婚？\n`;
                    prompt += `3. **夫妻关系**：婚后夫妻相处模式，如何经营婚姻？\n`;
                    prompt += `4. **感情建议**：给出维护感情和婚姻的实用建议。\n\n`;

                    prompt += `#### 6.6 子女缘分\n`;
                    prompt += `1. **子女运势**：子女缘分深浅，子女数量倾向。\n`;
                    prompt += `2. **子女特质**：未来子女的性格和发展潜力。\n`;
                    prompt += `3. **教育建议**：在子女教育方面应该注意什么？\n\n`;

                    prompt += `#### 6.7 健康与养生\n`;
                    prompt += `1. **体质分析**：基于五行强弱，分析身体哪些系统较弱。\n`;
                    prompt += `2. **易患疾病**：需要预防哪些类型的疾病？\n`;
                    prompt += `3. **养生建议**：饮食起居、运动方式等具体养生建议。\n`;
                    prompt += `4. **注意时段**：哪些大运或流年需要特别注意健康？\n\n`;

                    prompt += `#### 6.8 人生规划与趋吉避凶\n`;
                    prompt += `1. **方位建议**：有利的发展方位（东南西北）。\n`;
                    prompt += `2. **颜色运用**：日常可以多用哪些颜色来助运？\n`;
                    prompt += `3. **数字选择**：幸运数字和不利数字。\n`;
                    prompt += `4. **贵人方向**：命中贵人属相或类型，如何争取贵人相助？\n`;
                    prompt += `5. **综合建议**：基于整体命局，给出3-5条最重要的人生规划建议。\n`;

                    // Update the textarea
                    const summaryEl = document.getElementById('bazi-summary');
                    if (summaryEl) {
                        summaryEl.value = prompt;
                    }

                } catch (e) {
                    console.error('updateBaziSummary error', e);
                }
            },
            updatePageTitle: function () {
                try {
                    if (!this.solar || !this.solar.year || !this.solar.month || !this.solar.day) {
                        document.title = '万年历';
                        return;
                    }
                    const titleDate = `${this.solar.year}年${String(this.solar.month).padStart(2, '0')}月${String(this.solar.day).padStart(2, '0')}日`;
                    const titleTime = `${String(this.solar.hour || 0).padStart(2, '0')}:${String(this.solar.minute || 0).padStart(2, '0')}`;
                    document.title = `万年历-${titleDate} ${titleTime}`;
                } catch (e) {
                    console.error('updatePageTitle error', e);
                }
            },
            copySummary: function () {
                const summaryTextarea = document.getElementById('bazi-summary');
                if (!summaryTextarea || !summaryTextarea.value) {
                    alert('没有可复制的内容。');
                    return;
                }
                navigator.clipboard.writeText(summaryTextarea.value).then(() => {
                    const copyButton = document.getElementById('btn-copy-bazi');
                    if (copyButton) {
                        const originalText = copyButton.innerText;
                        copyButton.innerText = '已复制!';
                        copyButton.disabled = true;
                        setTimeout(() => {
                            copyButton.innerText = originalText;
                            copyButton.disabled = false;
                        }, 2000);
                    }
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                    alert('复制失败，请手动复制。');
                });
            },
            compute: function () {
                // ensure solar fields reflect display based on calendarType before any calculation
                this.ensureSolarFromDisplay();
                var that = this;
                // 八字计算接口
                LunarHour.provider = '0' == that.eightCharProvider ? new DefaultEightCharProvider() : new LunarSect2EightCharProvider();
                switch (that.childLimitProvider) {
                    case '0':
                        ChildLimit.provider = new DefaultChildLimitProvider();
                        break;
                    case '1':
                        ChildLimit.provider = new LunarSect1ChildLimitProvider();
                        break;
                    case '2':
                        ChildLimit.provider = new LunarSect2ChildLimitProvider();
                        break;
                    case '3':
                        ChildLimit.provider = new China95ChildLimitProvider();
                        break;
                }

                // 公历时刻
                var solarTime = SolarTime.fromYmdHms(that.solar.year, that.solar.month, that.solar.day, that.solar.hour, that.solar.minute, that.solar.second);
                that.solarStr = solarTime.toString();
                // 农历时辰
                that.lunarStr = solarTime.getLunarHour().toString();

                // 节气
                var term = solarTime.getTerm();
                if (term.isQi()) {
                    term = term.next(-1);
                }
                that.prevTerm = {
                    name: term.getName(),
                    time: term.getJulianDay().getSolarTime().toString().split('年')[1]
                };

                term = term.next(2);
                that.nextTerm = {
                    name: term.getName(),
                    time: term.getJulianDay().getSolarTime().toString().split('年')[1]
                };

                // 童限
                var childLimit = ChildLimit.fromSolarTime(solarTime, that.gender == '1' ? Gender.MAN : Gender.WOMAN);
                // 八字
                var eightChar = childLimit.getEightChar();

                // 胎元
                var fetalOrigin = eightChar.getFetalOrigin();
                that.fetalOrigin = {
                    name: fetalOrigin.getName(),
                    sound: fetalOrigin.getSound().getName()
                };

                // 胎息
                var fetalBreath = eightChar.getFetalBreath();
                that.fetalBreath = {
                    name: fetalBreath.getName(),
                    sound: fetalBreath.getSound().getName()
                };

                // 命宫
                var ownSign = eightChar.getOwnSign();
                that.ownSign = {
                    name: ownSign.getName(),
                    sound: ownSign.getSound().getName()
                };

                // 身宫
                var bodySign = eightChar.getBodySign();
                that.bodySign = {
                    name: bodySign.getName(),
                    sound: bodySign.getSound().getName()
                };

                // 年柱
                var year = eightChar.getYear();
                // 月柱
                var month = eightChar.getMonth();
                // 日柱
                var day = eightChar.getDay();
                // 时柱
                var hour = eightChar.getHour();

                // 日干
                var me = day.getHeavenStem();

                // 天干十神
                that.year.tenStar.heavenStem = me.getTenStar(year.getHeavenStem()).getName();
                that.month.tenStar.heavenStem = me.getTenStar(month.getHeavenStem()).getName();
                that.day.tenStar.heavenStem = childLimit.getGender() == Gender.MAN ? '元男' : '元女';
                that.hour.tenStar.heavenStem = me.getTenStar(hour.getHeavenStem()).getName();

                // 天干
                that.year.heavenStem = year.getHeavenStem().getName();
                that.month.heavenStem = month.getHeavenStem().getName();
                that.day.heavenStem = me.getName();
                that.hour.heavenStem = hour.getHeavenStem().getName();

                // 地支
                that.year.earthBranch = year.getEarthBranch().getName();
                that.month.earthBranch = month.getEarthBranch().getName();
                that.day.earthBranch = day.getEarthBranch().getName();
                that.hour.earthBranch = hour.getEarthBranch().getName();

                // 藏干
                that.year.hideHeavenStems = that.buildHideHeavenStems(me, year);
                that.month.hideHeavenStems = that.buildHideHeavenStems(me, month);
                that.day.hideHeavenStems = that.buildHideHeavenStems(me, day);
                that.hour.hideHeavenStems = that.buildHideHeavenStems(me, hour);

                // 空亡
                that.year.extraEarthBranches = that.buildExtraEarthBranches(year);
                that.month.extraEarthBranches = that.buildExtraEarthBranches(month);
                that.day.extraEarthBranches = that.buildExtraEarthBranches(day);
                that.hour.extraEarthBranches = that.buildExtraEarthBranches(hour);

                // 星运
                that.year.terrain = me.getTerrain(year.getEarthBranch()).getName();
                that.month.terrain = me.getTerrain(month.getEarthBranch()).getName();
                that.day.terrain = me.getTerrain(day.getEarthBranch()).getName();
                that.hour.terrain = me.getTerrain(hour.getEarthBranch()).getName();

                // 自坐
                that.year.terrainSelf = year.getHeavenStem().getTerrain(year.getEarthBranch()).getName();
                that.month.terrainSelf = month.getHeavenStem().getTerrain(month.getEarthBranch()).getName();
                that.day.terrainSelf = me.getTerrain(day.getEarthBranch()).getName();
                that.hour.terrainSelf = hour.getHeavenStem().getTerrain(hour.getEarthBranch()).getName();

                // 纳音
                that.year.sound = year.getSound().toString();
                that.month.sound = month.getSound().toString();
                that.day.sound = day.getSound().toString();
                that.hour.sound = hour.getSound().toString();

                // 童限信息
                that.childLimitInfo = {
                    year: childLimit.getYearCount(),
                    month: childLimit.getMonthCount(),
                    day: childLimit.getDayCount(),
                    hour: childLimit.getHourCount(),
                    minute: childLimit.getMinuteCount(),
                    endSolarTime: childLimit.getEndTime().toString()
                };

                // 大运
                var decadeFortunes = [];
                // 童限(由于大运10年，童限从生年开始计)
                var decadeFortune = that.buildDecadeFortune(me, childLimit.getDecadeFortune());
                decadeFortune.sixtyCycle = '童限';
                decadeFortune.startYear = childLimit.getStartSixtyCycleYear().getYear();
                decadeFortune.endYear = childLimit.getEndSixtyCycleYear().getYear();
                decadeFortune.startAge = childLimit.getStartAge();
                decadeFortune.endAge = childLimit.getEndAge();
                decadeFortunes.push(decadeFortune);

                // 起运
                decadeFortune = childLimit.getStartDecadeFortune();
                decadeFortunes.push(that.buildDecadeFortune(me, decadeFortune));
                for (var i = 0; i < 9; i++) {
                    decadeFortune = decadeFortune.next(1);
                    decadeFortunes.push(that.buildDecadeFortune(me, decadeFortune));
                }
                that.decadeFortunes = decadeFortunes;

                // 计算神煞
                var isMan = that.gender == '1';
                that.year.shensha = that.calculateShenSha({ heavenStem: that.year.heavenStem, earthBranch: that.year.earthBranch }, that.day.heavenStem, that.day.earthBranch, that.month.earthBranch, that.year.earthBranch, isMan, 1);
                that.month.shensha = that.calculateShenSha({ heavenStem: that.month.heavenStem, earthBranch: that.month.earthBranch }, that.day.heavenStem, that.day.earthBranch, that.month.earthBranch, that.year.earthBranch, isMan, 2);
                that.day.shensha = that.calculateShenSha({ heavenStem: that.day.heavenStem, earthBranch: that.day.earthBranch }, that.day.heavenStem, that.day.earthBranch, that.month.earthBranch, that.year.earthBranch, isMan, 3);
                that.hour.shensha = that.calculateShenSha({ heavenStem: that.hour.heavenStem, earthBranch: that.hour.earthBranch }, that.day.heavenStem, that.day.earthBranch, that.month.earthBranch, that.year.earthBranch, isMan, 4);

                // 计算刑冲合害
                that.relationships = that.calculateRelationships();

                that.updateWuXingEnergy();
                that.updateBaziSummary();
                that.updatePageTitle();
            }
            ,
            // allow external callers to quickly set date and recompute
            setFromYmd: function (y, m, d) {
                try {
                    // when external callers set by solar y/m/d, update display according to calendarType
                    try {
                        if (this.calendarType === 'lunar') {
                            try {
                                var _sd = SolarDay.fromYmd(y, m, d);
                                if (_sd && typeof _sd.getLunarDay === 'function') {
                                    var _ld = _sd.getLunarDay();
                                    var _ly = null, _lm = null, _ldv = null, _isLeap = false;
                                    try { if (typeof _ld.getDay === 'function') _ldv = _ld.getDay(); } catch (e) { }
                                    try {
                                        if (typeof _ld.getLunarMonth === 'function') {
                                            var _lmObj = _ld.getLunarMonth();
                                            if (_lmObj) {
                                                if (typeof _lmObj.getMonth === 'function') _lm = _lmObj.getMonth();
                                                if ((_lm === null || _lm === undefined) && typeof _lmObj.getMonthWithLeap === 'function') {
                                                    var _mm = _lmObj.getMonthWithLeap(); if (typeof _mm === 'number') { if (_mm < 0) { _isLeap = true; _mm = Math.abs(_mm); } _lm = _mm; }
                                                }
                                                if (typeof _lmObj.isLeap === 'function') { try { if (_lmObj.isLeap()) _isLeap = true; } catch (e) { } }
                                                if (typeof _lmObj.getLeap === 'function') { try { if (_lmObj.getLeap()) _isLeap = true; } catch (e) { } }
                                            }
                                        }
                                    } catch (e) { }
                                    try { if (typeof _ld.getLunarYear === 'function') { var _lyObj = _ld.getLunarYear(); if (_lyObj && typeof _lyObj.getYear === 'function') _ly = _lyObj.getYear(); } } catch (e) { }
                                    if ((_ly === null || _ly === undefined) || (_lm === null || _lm === undefined) || (_ldv === null || _ldv === undefined)) {
                                        try { var _s = _ld.toString(); var _mat = _s.match(/(\d{4})[^\d]+(\d{1,2})[^\d]+(\d{1,2})/); if (_mat) { _ly = _ly === null || _ly === undefined ? parseInt(_mat[1], 10) : _ly; _lm = _lm === null || _lm === undefined ? parseInt(_mat[2], 10) : _lm; _ldv = _ldv === null || _ldv === undefined ? parseInt(_mat[3], 10) : _ldv; } } catch (e) { }
                                    }
                                    if ((_ly !== null && _ly !== undefined) && (_lm !== null && _lm !== undefined) && (_ldv !== null && _ldv !== undefined)) {
                                        if (_isLeap) _lm = -Math.abs(_lm);
                                        this.display.year = _ly;
                                        this.display.month = _lm;
                                        this.display.day = _ldv;
                                    } else {
                                        this.display.year = y;
                                        this.display.month = m;
                                        this.display.day = d;
                                    }
                                } else {
                                    this.display.year = y;
                                    this.display.month = m;
                                    this.display.day = d;
                                }
                            } catch (e) {
                                this.display.year = y;
                                this.display.month = m;
                                this.display.day = d;
                            }
                        } else {
                            this.display.year = y;
                            this.display.month = m;
                            this.display.day = d;
                        }
                    } catch (e) { this.display.year = y; this.display.month = m; this.display.day = d; }
                    // ensure internal solar fields set from display before compute
                    this.ensureSolarFromDisplay();
                    this.compute();
                } catch (e) {
                    console.error('setFromYmd error', e);
                }
            }
        }
    });
    var eightCharEl = D.getElementById('demo-eight-char');
    if (eightCharEl) {
        eightCharEl.style.display = 'block';
    }
})();