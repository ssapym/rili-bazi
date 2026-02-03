# 八字排盘系统 API 接口文档

## 概述

八字排盘系统提供专业的八字命理分析 API，支持公历输入、农历输入、真太阳时计算，返回完整的 JSON 数据结构。

## 服务器地址

- 本地服务器：`http://localhost:8000`
- API 基础路径：`/api`

## 响应结构

### 成功响应

```json
{
  "success": true,
  "data": {
    "baseInfo": {},
    "sizhu": {},
    "chonghe": {},
    "nengliang": {},
    "geju": {},
    "dayun": {}
  }
}
```

### 失败响应

```json
{
  "success": false,
  "error": {
    "message": "错误信息描述",
    "code": "ERROR_CODE"
  }
}
```

## 接口列表

### 1. 八字排盘（公历输入）

**请求方式**：`POST /api/bazi` 或 `GET /api/bazi`

**Content-Type**：`application/json`（POST）或 Query String（GET）

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| year | int | 是 | - | 公历年份 |
| month | int | 是 | - | 公历月份 |
| day | int | 是 | - | 公历日期 |
| hour | int | 否 | 0 | 小时（0-23） |
| minute | int | 否 | 0 | 分钟（0-59） |
| second | int | 否 | 0 | 秒（0-59） |
| gender | int | 否 | 1 | 性别（1=男，0=女） |
| useTrueSolar | bool | 否 | false | 是否使用真太阳时 |
| longitude | float | 条件 | - | 地点经度，useTrueSolar=true 时必填 |

#### 请求示例

**POST 请求**：

```json
{
  "year": 1997,
  "month": 4,
  "day": 11,
  "hour": 10,
  "minute": 0,
  "gender": 2
}
```

**GET 请求**：

```
http://localhost:8000/api/bazi?year=1997&month=4&day=11&hour=10&gender=2
```

#### 真太阳时请求

```json
{
  "year": 1997,
  "month": 4,
  "day": 11,
  "hour": 10,
  "gender": 2,
  "useTrueSolar": true,
  "longitude": 116.42
}
```

#### 返回字段

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 是否成功 |
| data | object | 返回数据 |
| data.baseInfo | object | 基本信息 |
| data.sizhu | object | 四柱信息 |
| data.chonghe | object | 干支关系 |
| data.buquan | object | 八字补全 |
| data.genji | object | 根基判断 |
| data.nengliang | object | 能量分析 |
| data.geju | object | 格局分析 |
| data.dayun | object | 大运信息 |
| data.trueSolarInfo | object | 真太阳时信息（仅 useTrueSolar=true 时返回） |

---

### 2. 八字排盘（农历输入）

**请求方式**：`POST /api/bazi/lunar`

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| lunarYear | int | 是 | - | 农历年份 |
| lunarMonth | int | 是 | - | 农历月份（负数表示闰月） |
| lunarDay | int | 是 | - | 农历日期 |
| hour | int | 否 | 0 | 小时（0-23） |
| minute | int | 否 | 0 | 分钟（0-59） |
| gender | int | 否 | 1 | 性别（1=男，0=女） |
| isLeap | bool | 否 | false | 是否闰月 |

#### 请求示例

```json
{
  "lunarYear": 1997,
  "lunarMonth": 3,
  "lunarDay": 5,
  "hour": 10,
  "gender": 2
}
```

---

### 3. 黄历查询

**请求方式**：`GET /api/huangli`

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| year | int | 是 | 公历年份 |
| month | int | 是 | 公历月份 |
| day | int | 是 | 公历日期 |

#### 请求示例

```
http://localhost:8000/api/huangli?year=2024&month=1&day=15
```

---

### 4. 健康检查

**请求方式**：`GET /api/health`

#### 返回示例

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
```

## 使用示例

### cURL

```bash
# 公历输入（POST）
curl -X POST http://localhost:8000/api/bazi \
  -H "Content-Type: application/json" \
  -d '{"year":1997,"month":4,"day":11,"hour":10,"gender":2}'

# 公历输入（GET）
curl "http://localhost:8000/api/bazi?year=1997&month=4&day=11&hour=10&gender=2"

# 真太阳时（北京经度）
curl -X POST http://localhost:8000/api/bazi \
  -H "Content-Type: application/json" \
  -d '{"year":1997,"month":4,"day":11,"hour":10,"useTrueSolar":true,"longitude":116.42,"gender":2}'

# 农历输入
curl -X POST http://localhost:8000/api/bazi/lunar \
  -H "Content-Type: application/json" \
  -d '{"lunarYear":1997,"lunarMonth":3,"lunarDay":5,"hour":10,"gender":2}'

# 黄历查询
curl "http://localhost:8000/api/huangli?year=2024&month=1&day=15"
```

### JavaScript

```javascript
// 普通模式
async function getBazi() {
  const response = await fetch('http://localhost:8000/api/bazi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: 1997,
      month: 4,
      day: 11,
      hour: 10,
      gender: 2
    })
  });
  const result = await response.json();
  console.log(result);
}

// 真太阳时模式
async function getBaziWithTrueSolar() {
  const response = await fetch('http://localhost:8000/api/bazi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      year: 1997,
      month: 4,
      day: 11,
      hour: 10,
      gender: 2,
      useTrueSolar: true,
      longitude: 116.42
    })
  });
  const result = await response.json();
  if (result.success && result.data.trueSolarInfo) {
    console.log('真太阳时调整:', result.data.trueSolarInfo);
  }
}
```

### Python

```python
import requests

def get_bazi():
    url = "http://localhost:8000/api/bazi"
    data = {
        "year": 1997,
        "month": 4,
        "day": 11,
        "hour": 10,
        "gender": 2
    }
    response = requests.post(url, json=data)
    result = response.json()
    if result["success"]:
        print("八字:", result["data"]["baseInfo"]["bazi"])
        print("格局:", result["data"]["geju"]["geju"])
        print("喜用神:", result["data"]["geju"]["xiyong"])
    else:
        print("Error:", result["error"]["message"])

def get_bazi_with_true_solar():
    url = "http://localhost:8000/api/bazi"
    data = {
        "year": 1997,
        "month": 4,
        "day": 11,
        "hour": 10,
        "gender": 2,
        "useTrueSolar": True,
        "longitude": 116.42
    }
    response = requests.post(url, json=data)
    result = response.json()
    if result["success"]:
        print("八字:", result["data"]["baseInfo"]["bazi"])
        if result["data"].get("trueSolarInfo"):
            print("真太阳时调整:", result["data"]["trueSolarInfo"])
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| MISSING_PARAMETERS | 缺少必要参数 |
| CALCULATION_ERROR | 八字计算错误 |
| CONVERSION_ERROR | 公农历转换错误 |
| TRUE_SOLAR_ERROR | 真太阳时计算错误 |
| HUANGLI_ERROR | 黄历查询错误 |
| SERVER_ERROR | 服务器内部错误 |

## 真太阳时说明

真太阳时计算需要根据出生地点的经度对标准时间进行调整。由于地球公转轨道的原因，每天太阳到达正南方（当地正午）的时间会有变化，这称为时差方程。

**使用方式**：

1. 设置 `useTrueSolar: true`
2. 提供出生地点的 `longitude`（经度）
3. 返回结果包含 `trueSolarInfo` 字段

**trueSolarInfo 字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| inputHour | int | 原始输入时辰 |
| inputMinute | int | 原始输入分钟 |
| longitude | float | 地点经度 |
| equationOfTime | float | 时差方程值（分钟） |
| timezoneOffset | float | 时区偏移（小时） |
| adjustedHour | int | 调整后时辰 |
| adjustedMinute | int | 调整后分钟 |

## 根基判断说明

根基判断功能用于判断四柱天干和暗带天干是否有根，根据传统八字理论，每个天干在某些地支中有根。

**判断范围**：

1. **四柱天干**：年干、月干、日干、时干
2. **暗带天干**：buquan.andai 中推导出的天干

**判断地支**：

1. **四柱地支**：年支、月支、日支、时支
2. **补全地支**：
   - 拱三合推导的地支
   - 拱隔位（夹）推导的地支
   - 暗带推导的地支

**天干根基映射表**：

| 天干 | 有根的地支 |
|------|-----------|
| 甲 | 亥、寅、卯、未 |
| 乙 | 寅、卯、辰、未 |
| 丙 | 寅、巳、午、戌 |
| 丁 | 巳、午、未、戌 |
| 戊 | 寅、巳、午、辰、戌 |
| 己 | 未、午、巳、丑 |
| 庚 | 巳、申、酉、丑 |
| 辛 | 酉、申、戌、丑 |
| 壬 | 申、亥、子、辰 |
| 癸 | 亥、子、丑、辰 |

**genji 字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| hasRoot | bool | 四柱天干和暗带天干是否有根 |
| rootCount | int | 有根的天干数量 |
| rootDetails | array | 每个天干的详细根基信息 |

**rootDetails 数组项说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| stem | string | 天干名称 |
| position | string | 天干位置（年干、月干、日干、时干、暗带） |
| hasRoot | bool | 该天干是否有根 |
| originalRoots | array | 原始地支中的根基 |
| derivedRoots | array | 补全地支中的根基 |
| allRoots | array | 所有根基汇总 |

**根基对象说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| branch | string | 地支名称 |
| position | string | 地支位置（年支、月支、日支、时支、拱三合、拱隔位（夹）、暗带） |
| type | string | 根基类型（original=原始地支、derived=补全地支） |
| source | string | 推导来源（仅补全地支有此字段） |
| derivedType | string | 推导类型（gongsanhe=拱三合、gonggewei=拱隔位、andai=暗带，仅补全地支有此字段） |

**返回示例**：

```json
{
  "genji": {
    "hasRoot": true,
    "rootCount": 5,
    "rootDetails": [
      {
        "stem": "甲",
        "position": "年干",
        "hasRoot": true,
        "originalRoots": [
          {
            "branch": "寅",
            "position": "年支",
            "type": "original"
          }
        ],
        "derivedRoots": [
          {
            "branch": "卯",
            "position": "拱三合",
            "source": "年+日",
            "derivedType": "gongsanhe",
            "type": "derived"
          }
        ],
        "allRoots": [
          {
            "branch": "寅",
            "position": "年支",
            "type": "original"
          },
          {
            "branch": "卯",
            "position": "拱三合",
            "source": "年+日",
            "derivedType": "gongsanhe",
            "type": "derived"
          }
        ]
      }
    ]
  }
}
```

## 十神分布及天透地藏说明

十神分布功能用于展示十神在八字四柱中的分布情况，天透地藏功能用于判断哪些十神同时出现在天干和地支中。

### 十神分布（distribution）

**判断范围**：

1. **四柱天干**：年干、月干、日干、时干
2. **四柱地支**：年支、月支、日支、时支（包含本气、中气、余气）
3. **补全地支**：
   - 拱三合推导的地支
   - 拱隔位（夹）推导的地支
   - 暗带推导的地支
4. **暗带天干**：buquan.andai 中推导出的天干

**distribution 字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| niangan | string | 年干对应的十神 |
| nianzhi | string | 年支地支藏干对应的十神（包含本气、中气、余气） |
| yuegan | string | 月干对应的十神 |
| yuezhi | string | 月支地支藏干对应的十神（包含本气、中气、余气） |
| rigan | string | 日干对应的十神 |
| rizhi | string | 日支地支藏干对应的十神（包含本气、中气、余气） |
| shigan | string | 时干对应的十神 |
| shizhi | string | 时支地支藏干对应的十神（包含本气、中气、余气） |
| andaiTiangan | string | 暗带天干对应的十神（如有） |
| gongsanhe | string | 拱三合推导地支的藏干十神（如有） |
| gonggewei | string | 拱隔位（夹）推导地支的藏干十神（如有） |
| andaiDizhi | string | 暗带推导地支的藏干十神（如有） |

**返回示例**：

```json
{
  "distribution": {
    "niangan": "比肩",
    "nianzhi": "正官（本气）、正印（中气）",
    "yuegan": "劫财",
    "yuezhi": "七杀（本气）、比肩（中气）、偏印（余气）",
    "rigan": "比肩",
    "rizhi": "偏印（本气）、正财（中气）、伤官（余气）",
    "shigan": "比肩",
    "shizhi": "偏印（本气）、正财（中气）、伤官（余气）",
    "gonggewei": "七杀（本气）、比肩（中气）、偏印（余气）"
  }
}
```

### 天透地藏（tianTouDiCang）

天透地藏是指某个十神同时出现在天干（天透）和地支（地藏）中。只有同时满足天透和地藏的十神才会出现在结果中。

**判断范围**：

1. **天透**：
   - 四柱天干：年干、月干、日干、时干
   - 暗带天干：buquan.andai 中推导出的天干

2. **地藏**：
   - 四柱地支：年支、月支、日支、时支（包含本气、中气、余气）
   - 补全地支：拱三合、拱隔位（夹）、暗带推导的地支

**tianTouDiCang 字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 十神名称 |
| tianTouPosition | string | 天透位置汇总（多个位置用"、"分隔） |
| tianTouDetails | array | 天透详情数组 |
| diCangPosition | string | 地藏位置汇总（多个位置用"、"分隔） |
| diCangDetails | array | 地藏详情数组 |

**tianTouDetails 数组项说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| position | string | 天干位置（年干、月干、日干、时干、暗带天干） |
| type | string | 天干类型（四柱天干、暗带天干） |

**diCangDetails 数组项说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| position | string | 地支位置（年支、月支、日支、时支、拱三合、拱隔位（夹）、暗带地支） |
| level | string | 藏干级别（本气、中气、余气） |
| type | string | 地支类型（四柱地支、补全地支） |

**返回示例**：

```json
{
  "tianTouDiCang": [
    {
      "name": "比肩",
      "tianTouPosition": "年干、日干、时干",
      "tianTouDetails": [
        {
          "position": "年干",
          "type": "四柱天干"
        },
        {
          "position": "日干",
          "type": "四柱天干"
        },
        {
          "position": "时干",
          "type": "四柱天干"
        }
      ],
      "diCangPosition": "月支（中气）、拱隔位（夹）(中气)、拱隔位（夹）(中气)",
      "diCangDetails": [
        {
          "position": "月支",
          "level": "中气",
          "type": "四柱地支"
        },
        {
          "position": "拱隔位（夹）",
          "level": "中气",
          "type": "补全地支"
        },
        {
          "position": "拱隔位（夹）",
          "level": "中气",
          "type": "补全地支"
        }
      ]
    }
  ]
}
```

### nengliang.shishen 字段说明

**字段名变更说明**：

- `zonggeshu` → `totalCount`：十神总数
- `ming` → `name`：十神名称
- `geshu` → `count`：十神数量
- `baifengbi` → `percentage`：十神百分比

**完整字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| totalCount | int | 十神总数 |
| byCount | array | 按数量排序的十神列表 |
| byEnergy | array | 按能量排序的十神列表 |
| distribution | object | 十神分布对象 |
| tianTouDiCang | array | 天透地藏数组 |

**byCount 数组项说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 十神名称 |
| count | int | 十神数量 |
| percentage | float | 十神百分比（保留1位小数） |

**byEnergy 数组项说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| ming | string | 十神名称 |
| fenshu | int | 十神分数 |
| baifengbi | float | 十神百分比（保留1位小数） |

**完整返回示例**：

```json
{
  "shishen": {
    "totalCount": 15,
    "byCount": [
      {
        "name": "比肩",
        "count": 4,
        "percentage": 26.7
      },
      {
        "name": "偏印",
        "count": 3,
        "percentage": 20.0
      }
    ],
    "byEnergy": [
      {
        "ming": "比肩",
        "fenshu": 40,
        "baifengbi": 27.2
      },
      {
        "ming": "偏印",
        "fenshu": 30,
        "baifengbi": 20.4
      }
    ],
    "distribution": {
      "niangan": "比肩",
      "nianzhi": "正官（本气）、正印（中气）",
      "yuegan": "劫财",
      "yuezhi": "七杀（本气）、比肩（中气）、偏印（余气）",
      "rigan": "比肩",
      "rizhi": "偏印（本气）、正财（中气）、伤官（余气）",
      "shigan": "比肩",
      "shizhi": "偏印（本气）、正财（中气）、伤官（余气）",
      "gonggewei": "七杀（本气）、比肩（中气）、偏印（余气）"
    },
    "tianTouDiCang": [
      {
        "name": "比肩",
        "tianTouPosition": "年干、日干、时干",
        "tianTouDetails": [
          {
            "position": "年干",
            "type": "四柱天干"
          },
          {
            "position": "日干",
            "type": "四柱天干"
          },
          {
            "position": "时干",
            "type": "四柱天干"
          }
        ],
        "diCangPosition": "月支（中气）、拱隔位（夹）(中气)、拱隔位（夹）(中气)",
        "diCangDetails": [
          {
            "position": "月支",
            "level": "中气",
            "type": "四柱地支"
          },
          {
            "position": "拱隔位（夹）",
            "level": "中气",
            "type": "补全地支"
          },
          {
            "position": "拱隔位（夹）",
            "level": "中气",
            "type": "补全地支"
          }
        ]
      }
    ]
  }
}
```
