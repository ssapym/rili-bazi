# 八字排盘系统 API

专业的八字命理分析 API，支持公历/农历输入，返回完整的 JSON 数据结构。

## 快速开始

### 启动服务器

```bash
cd /path/to/rili-bazi/server
npm install
npm start
```

服务器将在 `http://localhost:8000` 启动。

### 调用示例

```bash
# 公历输入
curl -X POST http://localhost:8000/api/bazi \
  -H "Content-Type: application/json" \
  -d '{"year":1997,"month":4,"day":11,"hour":10,"gender":2}'

# 真太阳时模式
curl -X POST http://localhost:8000/api/bazi \
  -H "Content-Type: application/json" \
  -d '{"year":1997,"month":4,"day":11,"hour":10,"useTrueSolar":true,"longitude":116.42,"gender":2}'
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "baseInfo": {
      "solarBirthday": "1997年4月11日 10:00",
      "lunarBirthday": "丁丑三月初五丁巳时",
      "gender": "女性",
      "age": 28
    },
    "sizhu": {
      "nian": {"tiangan": "丁", "dizhi": "丑"},
      "yue": {"tiangan": "甲", "dizhi": "辰"},
      "ri": {"tiangan": "癸", "dizhi": "未"},
      "shi": {"tiangan": "丁", "dizhi": "巳"}
    },
    "geju": {
      "rizhu": "癸，水命人",
      "geju": "普通格局",
      "xiyong": ["金", "木"]
    },
    "dayun": {...},
    "nengliang": {...}
  }
}
```

## 文档结构

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 本快速开始指南 |
| [API.md](API.md) | API 接口文档，请求参数、返回结构、使用示例 |
| [FIELD_REFERENCE.md](FIELD_REFERENCE.md) | 字段参考手册，所有返回字段的详细说明 |

## 核心功能

- **八字排盘**：公历/农历输入，返回完整四柱信息
- **真太阳时**：根据经度自动调整出生时间
- **五行分析**：五行能量、十神能量计算
- **格局分析**：身强判断、喜用神、格局判定
- **大运流年**：起运时间、大运十神、岁运分析
- **神煞纳音**：神煞计算、纳音五行
- **干支关系**：六合、六冲、合会等关系分析

## 前端页面

访问 `http://localhost:8000/` 可使用原有的前端界面。
