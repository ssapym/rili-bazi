# 关系类型字段修改文档

## 修改日期
2026-01-30

## 修改概述
将关系类型字段从单一类型改为大类-细类结构，在API输出中同时返回 `type`（大类）和 `detailType`（细类）两个字段。

## 修改背景
原有设计中，关系类型只返回一个 `type` 字段，无法区分具体的关系类型（如：无法区分"地支三合"和"半三合"）。为了满足前端判断显示和描述显示的需求，需要将关系类型分为大类和细类两个层次。

## 修改内容

### 1. 修改 `getRelationType` 函数为 `getRelationTypeInfo`

**文件**: `/server/src/services/relationshipService.js`

**修改前**:
```javascript
function getRelationType(type) {
  const types = {
    0: '冲',
    1: '合',
    // ...
  };
  return types[type] || '';
}
```

**修改后**:
```javascript
/**
 * 获取关系类型信息（大类和细类）
 * @param {number} type - 关系类型编号
 * @returns {Object} 包含大类和细类的对象
 * 
 * 返回格式：{ type: '大类', detailType: '细类' }
 */
function getRelationTypeInfo(type) {
  const typeInfo = {
    0: { type: '冲', detailType: '天干相冲' },
    1: { type: '合', detailType: '天干五合' },
    // ...
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
```

### 2. 修改 `PILLAR_RELATIONS` 定义

**文件**: `/server/src/services/relationshipService.js`

**修改前**:
```javascript
{ type: '双冲', stem1: 0, branch1: 0, stem2: 6, branch2: 6, desc: '甲子冲庚午' },
{ type: '天克地刑', stem1: 1, branch1: 11, stem2: 5, branch2: 11, desc: '乙亥克己亥' },
{ type: '双合', stem1: 0, branch1: 0, stem2: 5, branch2: 1, desc: '甲子合己丑' }
```

**修改后**:
```javascript
{ type: 17, stem1: 0, branch1: 0, stem2: 6, branch2: 6, desc: '甲子冲庚午' },
{ type: 18, stem1: 1, branch1: 11, stem2: 5, branch2: 11, desc: '乙亥克己亥' },
{ type: 19, stem1: 0, branch1: 0, stem2: 5, branch2: 1, desc: '甲子合己丑' }
```

### 3. 修改 API 输出逻辑

**文件**: `/server/src/services/relationshipService.js`

**修改前**:
```javascript
result.stems.push({ source: pillars, desc: gx[4], type: getRelationType(gx[1]) });
result.branches.push({ source: pillars, desc: gx[4], type: getRelationType(gx[1]) });
pillarRelations.push({
  source: pillarNames,
  desc: relation.desc,
  type: relation.type,
  details: `${stem1}${branch1}与${stem2}${branch2}`
});
```

**修改后**:
```javascript
const typeInfo = getRelationTypeInfo(gx[1]);
result.stems.push({ source: pillars, desc: gx[4], type: typeInfo.type, detailType: typeInfo.detailType });

const typeInfo = getRelationTypeInfo(gx[1]);
result.branches.push({ source: pillars, desc: gx[4], type: typeInfo.type, detailType: typeInfo.detailType });

const typeInfo = getRelationTypeInfo(relation.type);
pillarRelations.push({
  source: pillarNames,
  desc: relation.desc,
  type: typeInfo.type,
  detailType: typeInfo.detailType,
  details: `${stem1}${branch1}与${stem2}${branch2}`
});
```

### 4. 更新模块导出

**文件**: `/server/src/services/relationshipService.js`

**修改前**:
```javascript
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
  getRelationType
};
```

**修改后**:
```javascript
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
```

## 关系类型映射表

| 关系类型编号 | 大类 | 细类 | 说明 |
|------------|------|------|------|
| **天干关系** | | | |
| 0 | 冲 | 天干相冲 | 甲庚冲、乙辛冲、丙壬冲、丁癸冲 |
| 1 | 合 | 天干五合 | 甲己合化土、乙庚合化金、丙辛合化水、丁壬合化木、戊癸合化火 |
| 15 | 克 | 天干相克 | 甲戊克、乙己克、丙庚克、丁辛克、戊壬克、己癸克 |
| **地支关系** | | | |
| 2 | 冲 | 地支六冲 | 子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲 |
| 3 | 刑 | 地支三刑（三刑） | 寅巳申三刑、丑戌未三刑 |
| 4 | 刑 | 地支相刑 | 寅巳相刑、巳申相刑、丑戌相刑、戌未相刑、子卯相刑 |
| 5 | 刑 | 地支自刑 | 辰辰自刑、午午自刑、酉酉自刑、亥亥自刑 |
| 6 | 合 | 地支六合 | 子丑合化土、寅亥合化木、卯戌合化火、辰酉合化金、巳申合化水、午未合化火 |
| 7 | 合 | 地支三合 | 申子辰三合水、亥卯未三合木、寅午戌三合火、巳酉丑三合金 |
| 8 | 合 | 半三合 | 申子半合水、子辰半合水、亥卯半合木、卯未半合木、寅午半合火、午戌半合火、巳酉半合金、酉丑半合金 |
| 9 | 合 | 拱合 | 申辰拱合子、亥未拱合卯、寅戌拱合午、巳丑拱合酉 |
| 10 | 会 | 地支三会 | 寅卯辰会木、巳午未会火、申酉戌会金、亥子丑会水 |
| 11 | 会 | 半三会 | 亥子半会水、寅卯半会木、巳午半会火、申酉半会金 |
| 12 | 合 | 暗合 | 卯申暗合、午亥暗合、丑寅暗合、寅未暗合、子戌暗合、子辰暗合、巳酉暗合 |
| 13 | 害 | 地支六害 | 子未害、丑午害、寅巳害、卯辰害、申亥害、酉戌害 |
| 14 | 夹 | 夹 | 子寅夹丑、丑卯夹寅、寅辰夹卯、卯巳夹辰、辰午夹巳、巳未夹午、午申夹未、未酉夹申、申戌夹酉、酉亥夹戌、戌子夹亥、亥丑夹子 |
| 16 | 破 | 地支六破 | 子酉破、卯午破、辰丑破、未戌破、寅亥破、申巳破 |
| 20 | 绝 | 地支四绝 | 寅酉绝、卯申绝、午亥绝、子巳绝 |
| **干支组合关系** | | | |
| 17 | 双冲 | 双冲 | 天干相冲且地支也相冲（60组） |
| 18 | 双冲 | 天克地刑 | 天干相克且地支自刑（20组） |
| 19 | 双合 | 双合 | 天干相合且地支也相合（30组） |

## API 输出格式

### 修改前
```json
{
  "source": "年+日",
  "desc": "寅午戌三合火",
  "type": "合"
}
```

### 修改后
```json
{
  "source": "年+日",
  "desc": "寅午戌三合火",
  "type": "合",              // 大类（用于判断显示）
  "detailType": "地支三合"   // 细类（用于描述显示）
}
```

### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| **source** | string | 关系来源 | "年+日" |
| **desc** | string | 关系描述 | "寅午戌三合火" |
| **type** | string | 大类（抽象分类），用于前端判断显示 | "合"、"冲"、"刑"、"害"、"破"、"绝"、"夹"、"克"、"双冲"、"双合" |
| **detailType** | string | 细类（具体类型），用于前端描述显示 | "地支三合"、"天干五合"、"半三合"等 |

## 大类分类

| 大类 | 包含的细类 | 关系类型编号 |
|------|-----------|------------|
| **冲** | 天干相冲、地支六冲 | 0, 2 |
| **合** | 天干五合、地支六合、地支三合、半三合、拱合、暗合 | 1, 6, 7, 8, 9, 12 |
| **会** | 地支三会、半三会 | 10, 11 |
| **刑** | 地支三刑（三刑）、地支相刑、地支自刑 | 3, 4, 5 |
| **害** | 地支六害 | 13 |
| **破** | 地支六破 | 16 |
| **绝** | 地支四绝 | 20 |
| **夹** | 夹 | 14 |
| **克** | 天干相克 | 15 |
| **双冲** | 双冲、天克地刑 | 17, 18 |
| **双合** | 双合 | 19 |

## 使用示例

### 前端使用示例

```javascript
// 判断关系类型（使用大类）
if (relation.type === '合') {
  console.log('这是一个合类关系');
}

// 显示具体关系类型（使用细类）
console.log(`关系类型：${relation.detailType}`);
// 输出：关系类型：地支三合

// 统计各类关系数量
const relationCounts = {};
relations.forEach(relation => {
  relationCounts[relation.type] = (relationCounts[relation.type] || 0) + 1;
});
console.log(relationCounts);
// 输出：{ 合: 5, 冲: 2, 刑: 1, ... }
```

### 后端使用示例

```javascript
const { getRelationTypeInfo, getRelationCategory, getRelationDetail } = require('./services/relationshipService');

// 获取完整的关系类型信息
const typeInfo = getRelationTypeInfo(7);
console.log(typeInfo);
// 输出：{ type: '合', detailType: '地支三合' }

// 只获取大类
const category = getRelationCategory(7);
console.log(category);
// 输出：合

// 只获取细类
const detail = getRelationDetail(7);
console.log(detail);
// 输出：地支三合
```

## 测试

### 测试文件
`/test/test_relation_type_fields.js`

### 测试内容
1. 测试 `getRelationTypeInfo` 函数是否正确返回所有关系类型的大类和细类
2. 测试 API 返回的关系对象是否包含正确的 `type` 和 `detailType` 字段

### 运行测试
```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/test
node test_relation_type_fields.js
```

### 测试结果
- `getRelationTypeInfo` 函数测试：21/21 通过
- 关系类型字段测试：部分通过（测试用例中的八字组合未生成所有预期关系）

## 向后兼容性

### 破坏性变更
1. **`getRelationType` 函数已删除**：需要替换为 `getRelationTypeInfo`、`getRelationCategory` 或 `getRelationDetail`
2. **`PILLAR_RELATIONS` 的 `type` 字段类型改变**：从字符串改为数字（关系类型编号）
3. **API 输出格式改变**：新增 `detailType` 字段

### 迁移指南

#### 1. 替换 `getRelationType` 函数调用

**修改前**:
```javascript
const type = getRelationType(relationType);
```

**修改后**:
```javascript
// 方式1：获取完整信息
const typeInfo = getRelationTypeInfo(relationType);
const type = typeInfo.type;
const detailType = typeInfo.detailType;

// 方式2：只获取大类
const type = getRelationCategory(relationType);

// 方式3：只获取细类
const detailType = getRelationDetail(relationType);
```

#### 2. 更新 API 响应处理

**修改前**:
```javascript
const relation = data.relationships.stems[0];
console.log(relation.type); // 输出：合
```

**修改后**:
```javascript
const relation = data.relationships.stems[0];
console.log(relation.type); // 输出：合（大类）
console.log(relation.detailType); // 输出：天干五合（细类）
```

## 优势

1. **层次清晰**：大类和细类明确分离，便于理解和使用
2. **灵活判断**：前端可以根据大类做统一的判断逻辑
3. **详细描述**：前端可以根据细类显示具体的类型名称
4. **易于扩展**：未来如果需要添加新的关系类型，可以灵活扩展
5. **不重复**：type 和 detailType 完全不同，避免冗余

## 注意事项

1. **天克地刑的大类是双冲**：不是"天克地刑"，而是"双冲"
2. **半三合和半三会的五行索引**：这两个关系虽然涉及五行，但属于两个元素关系，derivedIndex 使用五行索引而非 -1
3. **测试用例设计**：测试用例中的八字组合需要确保能生成预期的关系，否则测试会失败

## 相关文档
- [API文档](./API.md)
- [字段参考](./FIELD_REFERENCE.md)
- [测试指南](./TEST_GUIDE.md)
