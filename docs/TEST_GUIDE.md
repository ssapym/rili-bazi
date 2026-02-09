# 测试运行指南

## 概述

八字排盘系统提供三种测试类型，用于验证 API 和 SPA 的计算结果一致性。

## 前置要求

### 1. 安装测试依赖

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/test
npm install
```

### 2. 启动 API 服务器（端口 8000）

使用服务管理脚本：

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./start.command
```

或手动启动：

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/server
node server.js
```

### 3. 启动 SPA 服务器（端口 8001）

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi
python3 -m http.server 8001
```

## 运行测试

### 使用统一入口（推荐）

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/test
node index.js [测试类型] [选项...]
```

**选项参数说明：**

| 选项 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--all` | `-a` | 测试全部（预设全部 + 失败用例 + 随机10个） | `-a` |
| `--preset` | `-p` | 预设生日组合 | `-p all`, `-p 3`, `-p 2-3`, `-p skip` |
| `--random` | `-r` | 随机生日组合数量 | `-r 10`, `-r skip` |
| `--single` | `-s` | 指定单个生日组合 | `-s 1990-5-15-10-男` |
| `--failed` | `-f` | 失败用例处理 | `-f test`, `-f clear`, `-f skip` |

**全部选项（-a）说明：**
- 测试全部：等同于 `-p all -f test -r 10`
- 包含：全部预设用例 + 失败用例 + 随机10个
- 用于全面测试验证

**预设选项（-p）说明：**
- `all` - 全部预设用例（默认）
- `数字` - 前N个，例如：`-p 3` 测试前3个
- `范围` - 指定范围，例如：`-p 2-3` 测试第2-3个
- `skip` - 跳过预设用例，只测试随机或单个

**随机选项（-r）说明：**
- `数字` - 随机生成N个，例如：`-r 10` 随机生成10个
- `skip` - 跳过随机用例（默认）

**单个选项（-s）说明：**
- 格式：`年-月-日-时:分-性别`
- 时:分支持小时或小时:分钟
- 性别支持：男/女、1/0、M/F
- 可多次使用，例如：`-s 1990-5-15-10-男 -s 2000-8-8-15:30-F`

**失败选项（-f）说明：**
- `test` - 测试之前记录的失败用例
- `clear` - 清空失败用例记录（标注为"已清空"状态）
- `reset` - 重置失败用例状态（标注为"失败"状态，可重新测试）
- `skip` - 跳过失败用例（默认）

**测试用例组合顺序：**
1. 预设用例（test_config.js中定义）
2. 失败用例（从failed_cases.json读取）
3. 随机用例（运行时生成）
4. 单个指定用例（命令行参数）

### 测试类型

| 命令 | 说明 | 调用文件 |
|------|------|-----------|
| `node index.js compare` | 完整对比测试 | test_full_comparison.js |
| `node index.js detail` | 详细对比测试 | test_comparison_detail.js |
| `node index.js api` | 纯API测试 | test_api_only.js |
| `node index.js buquan` | 八字补全冲突检测测试 | test_buquan_conflicts.js |
| `node index.js pillar` | 干支组合关系测试 | test_pillar_relations.js |
| `node index.js relations` | 天干相克和地支六破测试 | test_relationships.js |

### 查看帮助

```bash
node index.js help
```

### 示例用法

```bash
# 测试全部预设用例
node index.js compare

# 测试前3个预设用例
node index.js compare -p 3

# 测试第2-3个预设用例
node index.js compare -p 2-3

# 测试前3个预设 + 随机5个
node index.js compare -p 3 -r 5

# 只测试随机生成的10个
node index.js compare -p skip -r 10

# 测试单个指定生日
node index.js compare -p skip -s 1990-5-15-10-男

# 测试多个单个生日
node index.js compare -p skip -s 1990-5-15-10-男 -s 2000-8-8-15:30-F

# 测试之前记录的失败用例
node index.js compare -f test

# 清空失败用例记录
node index.js compare -f clear

# 重置失败用例状态（可重新测试）
node index.js compare -f reset

# 完整组合：预设3个 + 失败用例 + 随机5个 + 单个1个
node index.js compare -p 3 -f test -r 5 -s 1990-5-15-10-M

# 详细测试前5个生日组合
node index.js detail -p 5

# 详细测试第1至2个生日组合
node index.js detail -p 1-2

# API测试（不支持选项参数）
node index.js api
```

## 测试详情

### 1. 完整对比测试 (compare)

**命令：**
```bash
# 测试所有10个生日组合
node index.js compare

# 测试前N个生日组合
node index.js compare [数量]

# 测试指定范围的生日组合
node index.js compare [起始编号]-[结束编号]
```

**参数说明：**
- `数量`：测试前 N 个生日组合，如 `compare 3` 测试前 3 个
- `起始编号-结束编号`：测试指定范围的组合，如 `compare 2-3` 测试第 2 至 3 个，`compare 5-5` 只测试第 5 个
- 编号从 1 开始，对应 test_config.js 中的 TEST_CASES 数组顺序

**测试内容：**
- 四柱八字（年、月、日、时）
- 纳音
- 五行能量
- 大运
- 神煞
- 地支关系
- 格局分析

**测试用例：** 默认 10 个，年龄覆盖 15-60 岁

**报告输出：** `test/results/test_report_YYYY-MM-DD_HH-mm-ss.html`

**浏览器模式：** Chrome 非无头模式（会打开浏览器窗口）

### 2. 详细对比测试 (detail)

**命令：**
```bash
# 测试所有生日组合
node index.js detail

# 测试前N个生日组合
node index.js detail [数量]

# 测试指定范围的生日组合
node index.js detail [起始编号]-[结束编号]
```

**测试内容：**
- 详细展示每个测试案例的四柱数据
- 包括藏干、空亡、神煞等详细信息

### 3. 纯API测试 (api)

**命令：**
```bash
node index.js api
```

**测试内容：**
- 仅测试 API 端点
- 检查返回数据格式是否正确
- 不依赖 SPA 服务器
- 不支持测试数量参数

### 4. 八字补全冲突检测测试 (buquan)

**命令：**
```bash
# 测试所有预设用例
node index.js buquan

# 测试前3个预设用例
node index.js buquan -p 3

# 测试第2-3个预设用例
node index.js buquan -p 2-3

# 测试单个指定生日
node index.js buquan -s 1984-3-15-10-男

# 测试5个随机用例
node index.js buquan -r 5

# 测试之前记录的失败用例
node index.js buquan -f test

# 组合使用：前3个预设 + 随机5个 + 单个指定
node index.js buquan -p 3 -r 5 -s 1984-3-15-10-男
```

**测试内容：**
- 测试八字补全功能中的冲突检测
- 暗带：双冲（60组）+ 天克地刑（20组）
- 拱三合和拱隔位：地支六冲（6个）
- 检测补全结果与四柱中所有柱的冲突
- 显示冲突类型、描述和目标柱信息
- 支持预设、随机、单个、失败用例测试
- 只依赖 API 服务器，不需要 SPA 服务器

**测试结果输出：**
- 补全地支列表
- 拱三合、拱隔位、暗带数量
- 每个补全结果的详细信息
- 冲突检测结果（如有）

## 测试报告

### 报告位置

```
test/results/test_report_YYYY-MM-DD_HH-mm-ss.html
test/results/test_report_YYYY-MM-DD_HH-mm-ss.json
```

### 报告类型

**HTML报告：**
- 可视化展示测试结果
- 支持点击筛选（全部/通过/失败）
- 显示四柱信息、差异详情、比较项目状态
- 适合人工查看和分析

**JSON报告：**
- 结构化数据格式
- 适合程序和AI分析
- 包含完整的测试结果和比较数据
- 字段名使用英文，便于程序处理

### 报告内容

- 汇总统计（总测试数、通过、失败、通过率）
- 每个测试用例的详细结果
- 测试用例类型（预设、随机、单个）
- 差异详情（如有）
- 比对项目状态（四柱、纳音、五行等）
- 四柱信息（年、月、日、时柱的天干地支和纳音）

### 终端输出

测试完成后，终端会显示：
- 测试结果汇总（总数、通过、失败、通过率）
- 测试报告文件名（HTML和JSON）
- 报告文件的完整路径

示例：
```
============================================================
测试结果汇总
============================================================
总测试数: 1
通过: 0 ✅
失败: 1 ❌
通过率: 0.0%

============================================================
生成测试报告...
HTML报告已保存: /Users/yangyang/Downloads/Files/rili-bazi/test/results/test_report_2026-02-05T05-51-16-628Z.html
JSON报告已保存: /Users/yangyang/Downloads/Files/rili-bazi/test/results/test_report_2026-02-05T05-51-16-628Z.json
============================================================

============================================================
✅ 测试完成
============================================================

📊 测试报告文件:
   HTML: test_report_2026-02-05T05-51-16-628Z.html
   JSON: test_report_2026-02-05T05-51-16-628Z.json

📁 完整路径:
   HTML: /Users/yangyang/Downloads/Files/rili-bazi/test/results/test_report_2026-02-05T05-51-16-628Z.html
   JSON: /Users/yangyang/Downloads/Files/rili-bazi/test/results/test_report_2026-02-05T05-51-16-628Z.json
============================================================
```

### 报告查看

直接在浏览器中打开 HTML 文件即可查看。

JSON报告可以使用任何JSON查看器或文本编辑器打开，也可以使用程序进行自动化分析。

## 失败用例管理

### 失败用例文件

失败用例自动保存到 `test/failed_cases.json`，该文件已加入 `.gitignore`，不会提交到版本控制。

### 失败用例内容

```json
[
  {
    "year": 2000,
    "month": 8,
    "day": 8,
    "hour": 15,
    "minute": 30,
    "gender": "女",
    "name": "单个测试-2000年8月8日15:30女(25岁)",
    "failedAt": "2026-01-22T03:43:40.351Z",
    "status": "已修复",
    "fixedAt": "2026-01-22T04:07:00.000Z",
    "clearedAt": "2026-01-22T04:12:07.901Z",
    "mismatches": [
      "格局分析: 格局名称: API=食神格 SPA=从弱格",
      "格局分析: 喜用神: API=火,土 SPA=金,顺势五行"
    ]
  }
]
```

**状态说明：**

| 状态 | 说明 | 是否会再次测试 | 如何重新测试 |
|------|------|---------------|-------------|
| 无状态 | 新记录的失败用例 | ✅ 会测试 | - |
| 已修复 | 已修复并验证通过 | ❌ 不会测试 | 使用 `-f reset` 重置状态 |
| 已清空 | 用户手动清空 | ❌ 不会测试 | 使用 `-f reset` 重置状态 |
| 失败 | 之前已修复后又失败 | ✅ 会测试 | - |

**时间戳说明：**

- `failedAt`: 首次失败的时间
- `fixedAt`: 修复的时间（可选）
- `clearedAt`: 清空的时间（可选）
- `resetAt`: 重置的时间（可选）

### 失败用例操作

**测试失败用例：**
```bash
node index.js compare -f test
```

**清空失败用例：**
```bash
node index.js compare -f clear
```

**重置失败用例（可重新测试）：**
```bash
node index.js compare -f reset
```

**组合使用：**
```bash
# 测试失败用例 + 随机5个
node index.js compare -f test -r 5

# 测试失败用例 + 预设3个
node index.js compare -f test -p 3

# 重置失败用例后立即测试
node index.js compare -f reset && node index.js compare -f test
```

### 失败用例保存规则

- 只保存随机生成和单个指定的失败用例
- 预设用例的失败用例不会保存（已在test_config.js中定义）
- 自动去重，避免重复保存相同的失败用例
- 每次测试运行后，新的失败用例会追加到文件中

## 随机测试用例

### 随机生成规则

- **年龄分布**：以当前年份为基准，生成1-60岁范围的生日
  - 70%概率：20-45岁（主要年龄段）
  - 15%概率：1-19岁（青少年）
  - 15%概率：46-60岁（中老年）
- **其他参数**：月、日、时辰、性别完全随机
- **四柱八字唯一性**：确保生成的测试用例四柱八字不重复
  - 不与预设用例重复
  - 不与其他随机用例重复
  - 不与单个指定用例重复

### 随机测试示例

```bash
# 随机生成10个测试用例
node index.js compare -p skip -r 10

# 预设3个 + 随机10个
node index.js compare -p 3 -r 10

# 随机5个 + 单个指定2个
node index.js compare -p skip -r 5 -s 1990-5-15-10-男 -s 2000-8-8-15:30-F
```

## 服务管理

### 启动服务

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./start.command
```

### 停止服务

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./stop.command
```

### 重启服务

```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./restart.command
```

## 快速测试流程

### 一键测试脚本

创建 `test/run_tests.command`：

```bash
#!/bin/bash

echo "========================================"
echo "  八字排盘系统 - 快速测试"
echo "========================================"
echo ""

echo "[1/3] 启动 API 服务器..."
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./start.command &
sleep 3

echo ""
echo "[2/3] 启动 SPA 服务器..."
cd /Users/yangyang/Downloads/Files/rili-bazi
python3 -m http.server 8001 &
sleep 2

echo ""
echo "[3/3] 运行完整对比测试..."
cd /Users/yangyang/Downloads/Files/rili-bazi/test
node index.js compare

echo ""
echo "========================================"
echo "  测试完成！"
echo "========================================"
```

### 手动测试流程

```bash
# 终端 1: 启动 API
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./start.command

# 终端 2: 启动 SPA
cd /Users/yangyang/Downloads/Files/rili-bazi
python3 -m http.server 8001

# 终端 3: 运行测试
cd /Users/yangyang/Downloads/Files/rili-bazi/test
node index.js compare
```

## 常见问题

### 1. 端口被占用

**错误信息：** `EADDRINUSE: address already in use :::8000`

**解决方法：**
```bash
cd /Users/yangyang/Downloads/Files/rili-bazi/server
./stop.command
```

### 2. Chrome 浏览器未找到

**错误信息：** `Failed to launch the browser process`

**解决方法：** 检查 `test/test_config.js` 中的 `CHROME_PATH` 配置

### 3. SPA 服务器未启动

**错误信息：** `net::ERR_CONNECTION_REFUSED`

**解决方法：** 确保 SPA 服务器在端口 8001 运行

## 配置文件

### test/test_config.js

测试用例和配置文件，包括：

- `TEST_CASES`: 测试用例数组
- `BEIJING_DONGCHENG_LONGITUDE`: 北京东经坐标
- `CHROME_PATH`: Chrome 浏览器路径
- `API_BASE_URL`: API 服务器地址
- `SPA_BASE_URL`: SPA 服务器地址
- `TEST_CONFIG`: 测试超时和重试配置

## 注意事项

1. **端口冲突**：确保 8000 和 8001 端口未被占用
2. **浏览器窗口**：完整对比测试会打开 Chrome 窗口，请勿关闭
3. **测试报告**：每次运行会生成新的带时间戳的报告
4. **服务状态**：测试前确保 API 和 SPA 服务器都已启动
5. **网络延迟**：每个测试用例之间有 2 秒延迟，避免请求过快
6. **快速测试**：使用测试参数可快速验证单个用例或特定范围测试
   - 数字格式：`node index.js compare 3` 测试前 3 个
   - 范围格式：`node index.js compare 2-3` 测试第 2 至 3 个
   - 单个用例：`node index.js compare 5-5` 只测试第 5 个
7. **测试顺序**：测试参数中的编号从 1 开始，对应 TEST_CASES 数组中的顺序

## 更新日志

### 2026-02-05

**新增功能：**

1. **测试报告增强**
   - 新增JSON报告格式，适合程序和AI分析
   - HTML报告新增四柱信息显示
   - HTML报告新增差异汇总，支持并排对比API和SPA的差异
   - HTML报告新增点击筛选功能（全部/通过/失败）
   - 比较项目名称本地化为中文
   - 测试完成后在终端显示报告文件名和完整路径

2. **命令行参数增强**
   - 新增 `--all` / `-a` 参数，一键测试全部（预设全部 + 失败用例 + 随机10个）
   - 新增 `--help` 参数，显示完整的帮助信息
   - 不指定参数时默认显示帮助信息

3. **测试代码重构**
   - 将test_full_comparison.js重构为模块化结构
   - 新增report_generators目录，包含HTML和JSON报告生成器
   - 新增comparators.js，包含所有比较逻辑
   - 新增report_utils.js，包含报告相关的工具函数
   - 提高代码可维护性和复用性

4. **SPA数据提取修复**
   - 修复SPA页面数据提取逻辑，使用window.eightCharApp替代window.baziData
   - 添加Vue应用加载等待，确保数据完整获取
   - 修复HTTP模块缺失问题

### 2026-01-30

**新增功能：**

1. **八字补全冲突检测测试**
   - 新增 `buquan` 测试类型：`node index.js buquan`
   - 测试八字补全功能中的冲突检测逻辑
   - 暗带：检测双冲（60组）和天克地刑（20组）
   - 拱三合和拱隔位：检测地支六冲（6个）
   - 支持预设、随机、单个、失败用例测试
   - 显示详细的冲突信息：类型、描述、目标柱
   - 只依赖 API 服务器，不需要 SPA 服务器
   - 支持所有标准测试选项：`-p`、`-r`、`-s`、`-f`

2. **干支组合关系测试**
   - 新增 `pillar` 测试类型：`node index.js pillar`
   - 测试干支组合关系：双冲（60组）、天克地刑（20组）、双合（30组）
   - 测试 pillars 字段是否正确包含干支组合关系
   - 只依赖 API 服务器，不需要 SPA 服务器
   - 支持所有标准测试选项：`-p`、`-r`、`-s`、`-f`

3. **天干相克和地支六破测试**
   - 新增 `relations` 测试类型：`node index.js relations`
   - 测试天干相克关系（6个）：甲克戊、乙克己、丙克庚、丁克辛、戊克壬、己克癸
   - 测试地支六破关系（6个）：子酉破、卯午破、辰丑破、未戌破、寅亥破、申巳破
   - 测试关系类型是否正确识别
   - 只依赖 API 服务器，不需要 SPA 服务器
   - 支持所有标准测试选项：`-p`、`-r`、`-s`、`-f`

**测试脚本：**

- 新增 `test/test_buquan_conflicts.js` 测试脚本
  - 支持从命令行参数接收测试用例
  - 保留默认测试用例，可直接运行
  - 导出 `runBuQuanTests` 和 `testBuQuanCase` 函数

- 修改 `test/test_pillar_relations.js`：
  - 添加 `runPillarRelationsTests` 主函数
  - 支持命令行参数和统一测试入口
  - 导出测试函数供其他模块调用

- 修改 `test/test_relationships.js`：
  - 添加 `runRelationshipsTests` 主函数
  - 支持命令行参数和统一测试入口
  - 导出测试函数供其他模块调用

**使用示例：**

```bash
# 八字补全冲突检测测试
node index.js buquan

# 干支组合关系测试
node index.js pillar

# 天干相克和地支六破测试
node index.js relations

# 测试前3个预设用例
node index.js buquan -p 3
node index.js pillar -p 3
node index.js relations -p 3

# 测试单个指定生日
node index.js buquan -s 1984-3-15-10-男
node index.js pillar -s 1990-5-15-10-男
node index.js relations -s 1990-5-15-10-男

# 测试5个随机用例
node index.js buquan -r 5
node index.js pillar -r 5
node index.js relations -r 5

# 组合使用
node index.js buquan -p 3 -r 5 -s 1984-3-15-10-男
node index.js pillar -p 3 -r 5 -s 1990-5-15-10-男
node index.js relations -p 3 -r 5 -s 1990-5-15-10-男
```

**统一测试入口：**

- 所有测试类型现已整合到 `test/index.js` 统一入口
- 支持命令行参数和灵活的测试配置
- 统一的测试报告和错误处理

### 2026-01-22

**新增功能：**

1. **失败用例管理**
   - 自动保存随机生成和单个指定的失败用例到 `test/failed_cases.json`
   - 支持测试之前记录的失败用例：`-f test`
   - 支持清空失败用例记录：`-f clear`（标注为"已清空"状态，不删除文件）
   - 支持重置失败用例状态：`-f reset`（标注为"失败"状态，可重新测试）
   - 失败用例文件已加入 `.gitignore`，不会提交到版本控制
   - 失败用例支持状态管理：无状态、已修复、已清空、失败

2. **随机测试用例生成**
   - 支持运行时随机生成指定数量的测试用例：`-r 10`
   - 年龄分布：1-60岁，以20-45岁为主（70%概率）
   - 确保四柱八字唯一性，不与预设用例、其他随机用例、单个指定用例重复

3. **单个指定测试用例**
   - 支持通过命令行参数指定单个生日组合：`-s 1990-5-15-10-男`
   - 支持多种性别格式：男/女、1/0、M/F
   - 支持带分钟的时间格式：`-s 2000-8-8-15:30-F`
   - 可多次使用，同时测试多个单个指定用例

4. **测试用例组合**
   - 支持灵活组合预设、失败、随机和单个测试用例
   - 测试顺序：预设 → 失败 → 随机 → 单个
   - 所有选项参数均为可选，默认测试全部预设用例

5. **测试报告增强**
   - 报告中显示测试用例类型（预设、随机、单个）
   - 更清晰地区分不同来源的测试用例

4. **服务状态检查增强**
   - 八字补全冲突检测测试（buquan）只需要 API 服务器
   - 自动检查服务状态并给出明确的错误提示
   - 支持灵活的测试用例组合和参数配置

5. **八字补全冲突检测测试**
   - 新增 `buquan` 测试类型：`node index.js buquan`
   - 测试八字补全功能中的冲突检测逻辑
   - 暗带：检测双冲（60组）和天克地刑（20组）
   - 拱三合和拱隔位：检测地支六冲（6个）
   - 支持预设、随机、单个、失败用例测试
   - 显示详细的冲突信息：类型、描述、目标柱
   - 只依赖 API 服务器，不需要 SPA 服务器

**命令行参数变更：**

- 旧格式：`node index.js compare [数量]` 或 `node index.js compare [起始编号]-[结束编号]`
- 新格式：`node index.js compare [选项...]`
  - `-p` / `--preset`：预设用例选项（all、数字、范围、skip）
  - `-r` / `--random`：随机用例数量（数字、skip）
  - `-s` / `--single`：单个指定用例（可多次使用）
  - `-f` / `--failed`：失败用例处理（test、clear、skip）

**向后兼容：**

- 旧格式命令仍然可用，但建议使用新格式
- `node index.js compare 3` 等同于 `node index.js compare -p 3`
- `node index.js compare 2-3` 等同于 `node index.js compare -p 2-3`

**代码改进：**

- 为所有主要函数添加了完整的JSDoc注释
- 优化了失败用例保存逻辑，确保随机和单个指定用例都能正确记录
- 改进了四柱八字生成算法，修复了负数取模的问题
- 增强了参数解析的健壮性和错误处理
