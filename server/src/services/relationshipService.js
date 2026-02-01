const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 关系定义数组 GX 的格式说明
 * 
 * 每个关系定义的格式：[type, relationType, targetIndices, derivedIndex, description]
 * 
 * 参数说明：
 * - type: 0=天干关系, 1=地支关系
 * - relationType: 关系类型编号（见getRelationTypeInfo函数）
 * - targetIndices: 涉及的地支/天干索引数组
 * - derivedIndex: 推导出的元素索引或五行索引（见下方规则）
 * - description: 关系描述
 * 
 * derivedIndex 规则：
 * 1. 三个元素关系（三合、三会）：derivedIndex = 第三个地支的索引
 *    示例：[1, 7, [2, 6, 10], 3, '寅午戌三合火'] → 3（午的索引）
 * 2. 两个元素关系 + 有五行化合（五合、六合）：derivedIndex = 化出五行的索引
 *    五行索引对照：0=金, 1=水, 2=木, 3=火, 4=土
 *    示例：[0, 1, [0, 5], 4, '甲己合化土'] → 4（土的索引）
 * 3. 两个元素关系 + 无五行化合（冲、刑、害、破、绝、半三合、半三会、暗合、夹）：derivedIndex = -1
 *    示例：[1, 2, [0, 6], -1, '子午冲'] → -1（无推导）
 * 
 * 注意：半三合和半三会虽然涉及五行，但属于两个元素关系，derivedIndex使用五行索引而非-1
 */

const GX = [
  // ========== 天干关系 ==========
  // 天干相冲（4个）：阴阳属性相同，方位相对
  [0, 0, [0, 6], -1, '甲庚冲'],
  [0, 0, [1, 7], -1, '乙辛冲'],
  [0, 0, [2, 8], -1, '丙壬冲'],
  [0, 0, [3, 9], -1, '丁癸冲'],
  
  // 天干五合（5个）：阴阳相合，化生五行
  [0, 1, [0, 5], 4, '甲己合化土'],
  [0, 1, [1, 6], 0, '乙庚合化金'],
  [0, 1, [2, 7], 1, '丙辛合化水'],
  [0, 1, [3, 8], 2, '丁壬合化木'],
  [0, 1, [4, 9], 3, '戊癸合化火'],
  
  // 天干相克（6个）：五行相克关系
  // 木克土：甲克戊、乙克己
  [0, 15, [0, 4], -1, '甲戊克'],
  [0, 15, [1, 5], -1, '乙己克'],
  // 火克金：丙克庚、丁克辛
  [0, 15, [2, 6], -1, '丙庚克'],
  [0, 15, [3, 7], -1, '丁辛克'],
  // 土克水：戊克壬、己克癸
  [0, 15, [4, 8], -1, '戊壬克'],
  [0, 15, [5, 9], -1, '己癸克'],
  
  // ========== 地支关系 ==========
  // 地支六冲（6个）：子午冲、卯酉冲、辰戌冲、丑未冲、寅申冲、巳亥冲
  [1, 2, [0, 6], -1, '子午冲'],
  [1, 2, [1, 7], -1, '丑未冲'],
  [1, 2, [2, 8], -1, '寅申冲'],
  [1, 2, [3, 9], -1, '卯酉冲'],
  [1, 2, [4, 10], -1, '辰戌冲'],
  [1, 2, [5, 11], -1, '巳亥冲'],
  
  // 地支三刑（7个）：寅巳申三刑、丑戌未三刑、子卯相刑、辰辰自刑、午午自刑、酉酉自刑、亥亥自刑
  [1, 3, [2, 5, 8], -1, '寅巳申三刑'],
  [1, 3, [1, 10, 7], -1, '丑戌未三刑'],
  [1, 4, [2, 5], -1, '寅巳相刑'],
  [1, 4, [5, 8], -1, '巳申相刑'],
  [1, 4, [1, 10], -1, '丑戌相刑'],
  [1, 4, [10, 7], -1, '戌未相刑'],
  [1, 4, [0, 3], -1, '子卯相刑'],
  [1, 5, [9, 9], -1, '酉酉自刑'],
  [1, 5, [11, 11], -1, '亥亥自刑'],
  [1, 5, [6, 6], -1, '午午自刑'],
  [1, 5, [4, 4], -1, '辰辰自刑'],
  
  // 地支六合（6个）：子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合火
  [1, 6, [0, 1], 4, '子丑合化土'],
  [1, 6, [2, 11], 2, '寅亥合化木'],
  [1, 6, [3, 10], 3, '卯戌合化火'],
  [1, 6, [4, 9], 0, '辰酉合化金'],
  [1, 6, [5, 8], 1, '巳申合化水'],
  [1, 6, [6, 7], 3, '午未合化火'],
  
  // 地支三合（4个）：申子辰三合水、亥卯未三合木、寅午戌三合火、巳酉丑三合金
  [1, 7, [2, 6, 10], 3, '寅午戌三合火'],
  [1, 7, [8, 0, 4], 1, '申子辰三合水'],
  [1, 7, [5, 9, 1], 0, '巳酉丑三合金'],
  [1, 7, [11, 3, 7], 2, '亥卯未三合木'],
  
  // 半三合（8个）：申子半合水、子辰半合水、亥卯半合木、卯未半合木、寅午半合火、午戌半合火、巳酉半合金、酉丑半合金
  // 注意：申辰、亥未、寅戌、巳丑不作三合之论
  [1, 8, [8, 0], 1, '申子半合水'],
  [1, 8, [0, 4], 1, '子辰半合水'],
  [1, 8, [11, 3], 2, '亥卯半合木'],
  [1, 8, [3, 7], 2, '卯未半合木'],
  [1, 8, [2, 6], 3, '寅午半合火'],
  [1, 8, [6, 10], 3, '午戌半合火'],
  [1, 8, [5, 9], 0, '巳酉半合金'],
  [1, 8, [9, 1], 0, '酉丑半合金'],
  
  // 拱合（4个）：申辰拱合子、亥未拱合卯、寅戌拱合午、巳丑拱合酉
  [1, 9, [8, 4], 0, '申辰拱合子'],
  [1, 9, [11, 7], 3, '亥未拱合卯'],
  [1, 9, [2, 10], 6, '寅戌拱合午'],
  [1, 9, [5, 1], 9, '巳丑拱合酉'],
  
  // 地支三会（4个）：寅卯辰会木、巳午未会火、申酉戌会金、亥子丑会水
  [1, 10, [2, 3, 4], 2, '寅卯辰会木'],
  [1, 10, [5, 6, 7], 3, '巳午未会火'],
  [1, 10, [8, 9, 10], 0, '申酉戌会金'],
  [1, 10, [11, 0, 1], 1, '亥子丑会水'],
  
  // 半三会（4个）：亥子半会水、寅卯半会木、巳午半会火、申酉半会金
  // 注意：子丑论六合不论半三会、卯辰论六害不论半三会、午未论六合不论半三会、酉戌论六害不论半三会
  [1, 11, [11, 0], 1, '亥子半会水'],
  [1, 11, [2, 3], 2, '寅卯半会木'],
  [1, 11, [5, 6], 3, '巳午半会火'],
  [1, 11, [8, 9], 0, '申酉半会金'],
  
  // 暗合（7个）：卯申暗合、午亥暗合、丑寅暗合、寅未暗合、子戌暗合、子辰暗合、巳酉暗合
  [1, 12, [3, 8], -1, '卯申暗合'],
  [1, 12, [6, 11], -1, '午亥暗合'],
  [1, 12, [1, 2], -1, '丑寅暗合'],
  [1, 12, [2, 7], -1, '寅未暗合'],
  [1, 12, [0, 10], -1, '子戌暗合'],
  [1, 12, [0, 4], -1, '子辰暗合'],
  [1, 12, [5, 9], -1, '巳酉暗合'],
  
  // 地支六害（6个）：子未相害、丑午相害、寅巳相害、卯辰相害、申亥相害、酉戌相害
  [1, 13, [0, 7], -1, '子未害'],
  [1, 13, [1, 6], -1, '丑午害'],
  [1, 13, [2, 5], -1, '寅巳害'],
  [1, 13, [3, 4], -1, '卯辰害'],
  [1, 13, [8, 11], -1, '申亥害'],
  [1, 13, [9, 10], -1, '酉戌害'],
  
  // 地支六破（6个）：子酉破、卯午破、辰丑破、未戌破、寅亥破、申巳破
  [1, 16, [0, 9], -1, '子酉破'],
  [1, 16, [3, 6], -1, '卯午破'],
  [1, 16, [4, 1], -1, '辰丑破'],
  [1, 16, [7, 10], -1, '未戌破'],
  [1, 16, [2, 11], -1, '寅亥破'],
  [1, 16, [8, 5], -1, '申巳破'],
  
  // 地支四绝（4个）：寅酉绝、卯申绝、午亥绝、子巳绝
  [1, 20, [2, 9], -1, '寅酉绝'],
  [1, 20, [3, 8], -1, '卯申绝'],
  [1, 20, [6, 11], -1, '午亥绝'],
  [1, 20, [0, 5], -1, '子巳绝'],
  
  // 拱隔位/夹（12个）：子寅夹丑、丑卯夹寅、寅辰夹卯、卯巳夹辰、辰午夹巳、巳未夹午、午申夹未、未酉夹申、申戌夹酉、酉亥夹戌、戌子夹亥、亥丑夹子
  [1, 14, [0, 2], 1, '子寅夹丑'],
  [1, 14, [1, 3], 2, '丑卯夹寅'],
  [1, 14, [2, 4], 3, '寅辰夹卯'],
  [1, 14, [3, 5], 4, '卯巳夹辰'],
  [1, 14, [4, 6], 5, '辰午夹巳'],
  [1, 14, [5, 7], 6, '巳未夹午'],
  [1, 14, [6, 8], 7, '午申夹未'],
  [1, 14, [7, 9], 8, '未酉夹申'],
  [1, 14, [8, 10], 9, '申戌夹酉'],
  [1, 14, [9, 11], 10, '酉亥夹戌'],
  [1, 14, [10, 0], 11, '戌子夹亥'],
  [1, 14, [11, 1], 0, '亥丑夹子']
];

const PILLAR_RELATIONS = [
  // ========== 干支组合关系 ==========
  // 双冲（60组）：天干相冲且地支也相冲
  // 甲行双冲（6个）
  { type: 17, stem1: 0, branch1: 0, stem2: 6, branch2: 6, desc: '甲子冲庚午' },
  { type: 17, stem1: 0, branch1: 10, stem2: 6, branch2: 4, desc: '甲戌冲庚辰' },
  { type: 17, stem1: 0, branch1: 8, stem2: 6, branch2: 2, desc: '甲申冲庚寅' },
  { type: 17, stem1: 0, branch1: 6, stem2: 6, branch2: 0, desc: '甲午冲庚子' },
  { type: 17, stem1: 0, branch1: 4, stem2: 6, branch2: 10, desc: '甲辰冲庚戌' },
  { type: 17, stem1: 0, branch1: 2, stem2: 6, branch2: 8, desc: '甲寅冲庚申' },
  // 乙行双冲（6个）
  { type: 17, stem1: 1, branch1: 1, stem2: 7, branch2: 7, desc: '乙丑冲辛未' },
  { type: 17, stem1: 1, branch1: 11, stem2: 7, branch2: 5, desc: '乙亥冲辛巳' },
  { type: 17, stem1: 1, branch1: 9, stem2: 7, branch2: 3, desc: '乙酉冲辛卯' },
  { type: 17, stem1: 1, branch1: 7, stem2: 7, branch2: 1, desc: '乙未冲辛丑' },
  { type: 17, stem1: 1, branch1: 5, stem2: 7, branch2: 11, desc: '乙巳冲辛亥' },
  { type: 17, stem1: 1, branch1: 3, stem2: 7, branch2: 9, desc: '乙卯冲辛酉' },
  // 丙行双冲（6个）
  { type: 17, stem1: 2, branch1: 2, stem2: 9, branch2: 9, desc: '丙寅冲癸酉' },
  { type: 17, stem1: 2, branch1: 0, stem2: 9, branch2: 6, desc: '丙子冲壬午' },
  { type: 17, stem1: 2, branch1: 10, stem2: 9, branch2: 4, desc: '丙戌冲壬辰' },
  { type: 17, stem1: 2, branch1: 8, stem2: 9, branch2: 2, desc: '丙申冲壬寅' },
  { type: 17, stem1: 2, branch1: 6, stem2: 9, branch2: 0, desc: '丙午冲壬子' },
  { type: 17, stem1: 2, branch1: 4, stem2: 9, branch2: 10, desc: '丙辰冲壬戌' },
  // 丁行双冲（6个）
  { type: 17, stem1: 3, branch1: 3, stem2: 8, branch2: 8, desc: '丁卯冲壬申' },
  { type: 17, stem1: 3, branch1: 1, stem2: 9, branch2: 7, desc: '丁丑冲癸未' },
  { type: 17, stem1: 3, branch1: 11, stem2: 9, branch2: 5, desc: '丁亥冲癸巳' },
  { type: 17, stem1: 3, branch1: 9, stem2: 9, branch2: 3, desc: '丁酉冲癸卯' },
  { type: 17, stem1: 3, branch1: 7, stem2: 9, branch2: 1, desc: '丁未冲癸丑' },
  { type: 17, stem1: 3, branch1: 5, stem2: 9, branch2: 11, desc: '丁巳冲癸亥' },
  // 戊行双冲（6个）
  { type: 17, stem1: 4, branch1: 4, stem2: 0, branch2: 10, desc: '戊辰冲甲戌' },
  { type: 17, stem1: 4, branch1: 2, stem2: 0, branch2: 8, desc: '戊寅冲甲申' },
  { type: 17, stem1: 4, branch1: 6, stem2: 0, branch2: 6, desc: '戊午冲甲子' },
  { type: 17, stem1: 4, branch1: 10, stem2: 0, branch2: 4, desc: '戊戌冲甲辰' },
  { type: 17, stem1: 4, branch1: 8, stem2: 0, branch2: 2, desc: '戊申冲甲寅' },
  { type: 17, stem1: 4, branch1: 0, stem2: 0, branch2: 6, desc: '戊子冲甲午' },
  // 己行双冲（6个）
  { type: 17, stem1: 5, branch1: 5, stem2: 1, branch2: 11, desc: '己巳冲乙亥' },
  { type: 17, stem1: 5, branch1: 3, stem2: 1, branch2: 9, desc: '己卯冲乙酉' },
  { type: 17, stem1: 5, branch1: 1, stem2: 1, branch2: 7, desc: '己丑冲乙未' },
  { type: 17, stem1: 5, branch1: 11, stem2: 1, branch2: 5, desc: '己亥冲乙巳' },
  { type: 17, stem1: 5, branch1: 9, stem2: 1, branch2: 3, desc: '己酉冲乙卯' },
  { type: 17, stem1: 5, branch1: 7, stem2: 1, branch2: 1, desc: '己未冲乙丑' },
  // 庚行双冲（6个）
  { type: 17, stem1: 6, branch1: 6, stem2: 2, branch2: 0, desc: '庚午冲丙子' },
  { type: 17, stem1: 6, branch1: 4, stem2: 2, branch2: 10, desc: '庚辰冲丙戌' },
  { type: 17, stem1: 6, branch1: 2, stem2: 2, branch2: 8, desc: '庚寅冲丙申' },
  { type: 17, stem1: 6, branch1: 0, stem2: 2, branch2: 6, desc: '庚子冲丙午' },
  { type: 17, stem1: 6, branch1: 10, stem2: 2, branch2: 4, desc: '庚戌冲丙辰' },
  { type: 17, stem1: 6, branch1: 8, stem2: 2, branch2: 2, desc: '庚申冲丙寅' },
  // 辛行双冲（6个）
  { type: 17, stem1: 7, branch1: 7, stem2: 3, branch2: 1, desc: '辛未冲丁丑' },
  { type: 17, stem1: 7, branch1: 5, stem2: 3, branch2: 11, desc: '辛巳冲丁亥' },
  { type: 17, stem1: 7, branch1: 3, stem2: 3, branch2: 9, desc: '辛卯冲丁酉' },
  { type: 17, stem1: 7, branch1: 1, stem2: 3, branch2: 7, desc: '辛丑冲丁未' },
  { type: 17, stem1: 7, branch1: 11, stem2: 3, branch2: 5, desc: '辛亥冲丁巳' },
  { type: 17, stem1: 7, branch1: 9, stem2: 3, branch2: 3, desc: '辛酉冲丁卯' },
  // 壬行双冲（6个）
  { type: 17, stem1: 8, branch1: 8, stem2: 4, branch2: 2, desc: '壬申冲戊寅' },
  { type: 17, stem1: 8, branch1: 6, stem2: 4, branch2: 0, desc: '壬午冲戊子' },
  { type: 17, stem1: 8, branch1: 4, stem2: 4, branch2: 10, desc: '壬辰冲戊戌' },
  { type: 17, stem1: 8, branch1: 2, stem2: 4, branch2: 8, desc: '壬寅冲戊申' },
  { type: 17, stem1: 8, branch1: 0, stem2: 4, branch2: 6, desc: '壬子冲戊午' },
  { type: 17, stem1: 8, branch1: 10, stem2: 4, branch2: 4, desc: '壬戌冲戊辰' },
  // 癸行双冲（6个）
  { type: 17, stem1: 9, branch1: 9, stem2: 5, branch2: 3, desc: '癸酉冲己卯' },
  { type: 17, stem1: 9, branch1: 7, stem2: 5, branch2: 1, desc: '癸未冲己丑' },
  { type: 17, stem1: 9, branch1: 5, stem2: 5, branch2: 11, desc: '癸巳冲己亥' },
  { type: 17, stem1: 9, branch1: 3, stem2: 5, branch2: 9, desc: '癸卯冲己酉' },
  { type: 17, stem1: 9, branch1: 1, stem2: 5, branch2: 7, desc: '癸丑冲己未' },
  { type: 17, stem1: 9, branch1: 11, stem2: 5, branch2: 5, desc: '癸亥冲己巳' },
  
  // 天克地刑（自刑）=双冲（20组）：天干相克且地支自刑
  // 乙亥#己亥系列（5个）
  { type: 18, stem1: 1, branch1: 11, stem2: 5, branch2: 11, desc: '乙亥克己亥' },
  { type: 18, stem1: 1, branch1: 11, stem2: 7, branch2: 11, desc: '乙亥克辛亥' },
  { type: 18, stem1: 3, branch1: 11, stem2: 7, branch2: 11, desc: '丁亥克辛亥' },
  { type: 18, stem1: 3, branch1: 11, stem2: 9, branch2: 11, desc: '丁亥克癸亥' },
  { type: 18, stem1: 5, branch1: 11, stem2: 9, branch2: 11, desc: '己亥克癸亥' },
  // 戊辰#壬辰系列（5个）
  { type: 18, stem1: 4, branch1: 4, stem2: 8, branch2: 4, desc: '戊辰克壬辰' },
  { type: 18, stem1: 4, branch1: 4, stem2: 0, branch2: 4, desc: '戊辰克甲辰' },
  { type: 18, stem1: 6, branch1: 4, stem2: 0, branch2: 4, desc: '庚辰克甲辰' },
  { type: 18, stem1: 6, branch1: 4, stem2: 2, branch2: 4, desc: '庚辰克丙辰' },
  { type: 18, stem1: 8, branch1: 4, stem2: 2, branch2: 4, desc: '壬辰克丙辰' },
  // 庚午#丙午系列（5个）
  { type: 18, stem1: 6, branch1: 6, stem2: 2, branch2: 6, desc: '庚午克丙午' },
  { type: 18, stem1: 6, branch1: 6, stem2: 0, branch2: 6, desc: '庚午克甲午' },
  { type: 18, stem1: 8, branch1: 6, stem2: 2, branch2: 6, desc: '壬午克丙午' },
  { type: 18, stem1: 8, branch1: 6, stem2: 4, branch2: 6, desc: '壬午克戊午' },
  { type: 18, stem1: 0, branch1: 6, stem2: 4, branch2: 6, desc: '甲午克戊午' },
  // 癸酉#己酉系列（5个）
  { type: 18, stem1: 9, branch1: 9, stem2: 5, branch2: 9, desc: '癸酉克己酉' },
  { type: 18, stem1: 9, branch1: 9, stem2: 3, branch2: 9, desc: '癸酉克丁酉' },
  { type: 18, stem1: 1, branch1: 9, stem2: 5, branch2: 9, desc: '乙酉克己酉' },
  { type: 18, stem1: 1, branch1: 9, stem2: 7, branch2: 9, desc: '乙酉克辛酉' },
  { type: 18, stem1: 3, branch1: 9, stem2: 7, branch2: 9, desc: '丁酉克辛酉' },
  
  // 双合（30组）：天干相合且地支也相合
  // 甲己双合（6个）
  { type: 19, stem1: 0, branch1: 0, stem2: 5, branch2: 1, desc: '甲子合己丑' },
  { type: 19, stem1: 0, branch1: 2, stem2: 5, branch2: 11, desc: '甲寅合己亥' },
  { type: 19, stem1: 0, branch1: 4, stem2: 5, branch2: 9, desc: '甲辰合己酉' },
  { type: 19, stem1: 0, branch1: 6, stem2: 5, branch2: 7, desc: '甲午合己未' },
  { type: 19, stem1: 0, branch1: 8, stem2: 5, branch2: 5, desc: '甲申合己巳' },
  { type: 19, stem1: 0, branch1: 10, stem2: 5, branch2: 3, desc: '甲戌合己卯' },
  // 丙辛双合（6个）
  { type: 19, stem1: 2, branch1: 0, stem2: 7, branch2: 1, desc: '丙子合辛丑' },
  { type: 19, stem1: 2, branch1: 2, stem2: 7, branch2: 11, desc: '丙寅合辛亥' },
  { type: 19, stem1: 2, branch1: 4, stem2: 7, branch2: 9, desc: '丙辰合辛酉' },
  { type: 19, stem1: 2, branch1: 6, stem2: 7, branch2: 7, desc: '丙午合辛未' },
  { type: 19, stem1: 2, branch1: 8, stem2: 7, branch2: 5, desc: '丙申合辛巳' },
  { type: 19, stem1: 2, branch1: 10, stem2: 7, branch2: 3, desc: '丙戌合辛卯' },
  // 戊癸双合（6个）
  { type: 19, stem1: 4, branch1: 0, stem2: 9, branch2: 1, desc: '戊子合癸丑' },
  { type: 19, stem1: 4, branch1: 2, stem2: 9, branch2: 11, desc: '戊寅合癸亥' },
  { type: 19, stem1: 4, branch1: 4, stem2: 9, branch2: 9, desc: '戊辰合癸酉' },
  { type: 19, stem1: 4, branch1: 6, stem2: 9, branch2: 7, desc: '戊午合癸未' },
  { type: 19, stem1: 4, branch1: 8, stem2: 9, branch2: 5, desc: '戊申合癸巳' },
  { type: 19, stem1: 4, branch1: 10, stem2: 9, branch2: 3, desc: '戊戌合癸卯' },
  // 庚乙双合（6个）
  { type: 19, stem1: 6, branch1: 0, stem2: 1, branch2: 1, desc: '庚子合乙丑' },
  { type: 19, stem1: 6, branch1: 2, stem2: 1, branch2: 11, desc: '庚寅合乙亥' },
  { type: 19, stem1: 6, branch1: 4, stem2: 1, branch2: 9, desc: '庚辰合乙酉' },
  { type: 19, stem1: 6, branch1: 6, stem2: 1, branch2: 7, desc: '庚午合乙未' },
  { type: 19, stem1: 6, branch1: 8, stem2: 1, branch2: 5, desc: '庚申合乙巳' },
  { type: 19, stem1: 6, branch1: 10, stem2: 1, branch2: 3, desc: '庚戌合乙卯' },
  // 壬丁双合（6个）
  { type: 19, stem1: 8, branch1: 0, stem2: 3, branch2: 1, desc: '壬子合丁丑' },
  { type: 19, stem1: 8, branch1: 2, stem2: 3, branch2: 11, desc: '壬寅合丁亥' },
  { type: 19, stem1: 8, branch1: 4, stem2: 3, branch2: 9, desc: '壬辰合丁酉' },
  { type: 19, stem1: 8, branch1: 6, stem2: 3, branch2: 7, desc: '壬午合丁未' },
  { type: 19, stem1: 8, branch1: 8, stem2: 3, branch2: 5, desc: '壬申合丁巳' },
  { type: 19, stem1: 8, branch1: 10, stem2: 3, branch2: 3, desc: '壬戌合丁卯' }
];

const PILLAR_NAMES = ['年', '月', '日', '时'];

function array_intersect(arr1, arr2) {
  const result = {};
  for (let key = 0; key < arr1.length; key++) {
    if (arr2.includes(arr1[key])) {
      result[key] = arr1[key];
    }
  }
  return result;
}

function array_diff(arr1, arr2) {
  if (Array.isArray(arr2)) {
    return arr1.filter(x => !arr2.includes(x));
  } else {
    return arr1.filter(x => !Object.values(arr2).includes(x));
  }
}

function empty(val) {
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return !val;
}

function count(arr) {
  return Array.isArray(arr) ? arr.length : Object.keys(arr).length;
}

function pc_array_power_set(arr) {
  const results = [[]];
  for (const item of arr) {
    for (const existing of [...results]) {
      results.push([...existing, item]);
    }
  }
  return results;
}

function array_keys(input) {
  if (Array.isArray(input)) {
    return input.map((_, idx) => idx);
  }
  return Object.keys(input);
}

/**
 * 获取关系类型信息（大类和细类）
 * @param {number} type - 关系类型编号
 * @returns {Object} 包含大类和细类的对象
 * 
 * 返回格式：{ type: '大类', detailType: '细类' }
 * 
 * 字段说明：
 * - type: 大类（抽象分类），用于前端判断显示
 * - detailType: 细类（具体类型），用于前端描述显示
 * 
 * 大类分类：
 * - 冲：天干相冲、地支六冲
 * - 合：天干五合、地支六合、地支三合、半三合、拱合、暗合
 * - 会：地支三会、半三会
 * - 刑：地支三刑（三刑）、地支相刑、地支自刑
 * - 害：地支六害
 * - 破：地支六破
 * - 绝：地支四绝
 * - 夹：夹
 * - 克：天干相克
 * - 双冲：双冲、天克地刑
 * - 双合：双合
 */
function getRelationTypeInfo(type) {
  const typeInfo = {
    // 天干关系
    0: { type: '冲', detailType: '天干相冲' },
    1: { type: '合', detailType: '天干五合' },
    15: { type: '克', detailType: '天干相克' },
    
    // 地支关系 - 冲类
    2: { type: '冲', detailType: '地支六冲' },
    
    // 地支关系 - 刑类
    3: { type: '刑', detailType: '地支三刑（三刑）' },
    4: { type: '刑', detailType: '地支相刑' },
    5: { type: '刑', detailType: '地支自刑' },
    
    // 地支关系 - 合类
    6: { type: '合', detailType: '地支六合' },
    7: { type: '合', detailType: '地支三合' },
    8: { type: '合', detailType: '半三合' },
    9: { type: '合', detailType: '拱合' },
    12: { type: '合', detailType: '暗合' },
    
    // 地支关系 - 会类
    10: { type: '会', detailType: '地支三会' },
    11: { type: '会', detailType: '半三会' },
    
    // 地支关系 - 其他
    13: { type: '害', detailType: '地支六害' },
    14: { type: '夹', detailType: '夹' },
    16: { type: '破', detailType: '地支六破' },
    20: { type: '绝', detailType: '地支四绝' },
    
    // 干支组合关系
    17: { type: '双冲', detailType: '双冲' },
    18: { type: '双冲', detailType: '天克地刑' },
    19: { type: '双合', detailType: '双合' }
  };
  
  return typeInfo[type] || { type: '', detailType: '' };
}

/**
 * 获取关系大类（用于判断显示）
 * @param {number} type - 关系类型编号
 * @returns {string} 大类名称
 */
function getRelationCategory(type) {
  return getRelationTypeInfo(type).type;
}

/**
 * 获取关系细类（用于描述显示）
 * @param {number} type - 关系类型编号
 * @returns {string} 细类名称
 */
function getRelationDetail(type) {
  return getRelationTypeInfo(type).detailType;
}

function calculateRelationships(pillars) {
  const tg = [
    STEMS.indexOf(pillars.year.heavenStem),
    STEMS.indexOf(pillars.month.heavenStem),
    STEMS.indexOf(pillars.day.heavenStem),
    STEMS.indexOf(pillars.hour.heavenStem)
  ];
  const dz = [
    BRANCHES.indexOf(pillars.year.earthBranch),
    BRANCHES.indexOf(pillars.month.earthBranch),
    BRANCHES.indexOf(pillars.day.earthBranch),
    BRANCHES.indexOf(pillars.hour.earthBranch)
  ];

  const list = [[], []];
  const excludes = {
    4: 3,
    8: 7,
    9: 7,
    11: 10
  };

  for (const gx of GX) {
    const type = gx[0];
    const relationType = gx[1];
    const targetIndices = gx[2];
    const desc = gx[4];

    const to = type === 0 ? tg : dz;
    const fd = array_intersect(to, targetIndices);

    if (empty(array_diff(targetIndices, fd))) {
      const c1 = count(fd);
      const c2 = targetIndices.length;
      const fds = [];

      if (c1 === c2) {
        fds.push(fd);
      }
      if (c1 > c2) {
        const keys = array_keys(fd);
        const set = pc_array_power_set(keys);
        for (const subset of set) {
          if (subset.length !== c2) continue;
          const newFd = {};
          for (const key of subset) {
            newFd[key] = to[key];
          }
          if (empty(array_diff(targetIndices, newFd))) {
            fds.push(newFd);
          }
        }
      }

      b1: for (const item of fds) {
        for (const [expect, exclude] of Object.entries(excludes)) {
          if (parseInt(expect) === relationType) {
            for (const [fd2, gx2] of list[type]) {
              if (gx2[1] === exclude) {
                const intersect = array_intersect(targetIndices, gx2[2]);
                if (!empty(intersect)) {
                  continue b1;
                }
              }
            }
            break;
          }
        }
        list[type].push([item, gx]);
      }
    }
  }

  const result = { stems: [], branches: [], pillars: [] };

  for (const [fds, gx] of list[0]) {
    const pillars = Object.keys(fds).map(idx => PILLAR_NAMES[idx]).join('+');
    const typeInfo = getRelationTypeInfo(gx[1]);
    result.stems.push({ source: pillars, desc: gx[4], type: typeInfo.type, detailType: typeInfo.detailType });
  }

  for (const [fds, gx] of list[1]) {
    const pillars = Object.keys(fds).map(idx => PILLAR_NAMES[idx]).join('+');
    const typeInfo = getRelationTypeInfo(gx[1]);
    result.branches.push({ source: pillars, desc: gx[4], type: typeInfo.type, detailType: typeInfo.detailType });
  }

  const pillarRelations = [];
  for (const relation of PILLAR_RELATIONS) {
    const pillarIdx1 = tg.indexOf(relation.stem1);
    const pillarIdx2 = tg.indexOf(relation.stem2);

    if (pillarIdx1 !== -1 && pillarIdx2 !== -1 &&
        dz[pillarIdx1] === relation.branch1 &&
        dz[pillarIdx2] === relation.branch2) {
      const pillarNames = [PILLAR_NAMES[pillarIdx1], PILLAR_NAMES[pillarIdx2]].join('+');
      const stem1 = STEMS[relation.stem1];
      const branch1 = BRANCHES[relation.branch1];
      const stem2 = STEMS[relation.stem2];
      const branch2 = BRANCHES[relation.branch2];
      const typeInfo = getRelationTypeInfo(relation.type);
      
      pillarRelations.push({
        source: pillarNames,
        desc: relation.desc,
        type: typeInfo.type,
        detailType: typeInfo.detailType,
        details: `${stem1}${branch1}与${stem2}${branch2}`
      });
    }
  }

  result.pillars = pillarRelations;

  return result;
}

module.exports = {
  calculateRelationships,
  STEMS,
  BRANCHES,
  GX,
  PILLAR_RELATIONS,
  PILLAR_NAMES,
  array_intersect,
  array_diff,
  empty,
  count,
  pc_array_power_set,
  array_keys,
  getRelationTypeInfo,
  getRelationCategory,
  getRelationDetail
};
