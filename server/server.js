/**
 * 八字排盘系统 - 服务器端API
 * 
 * 功能：
 * 1. 提供八字排盘API接口
 * 2. 支持公历/农历输入
 * 3. 返回完整的JSON数据结构
 * 4. 保留原有的前端页面
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// 导入路由
const baziRoutes = require('./routes/bazi');
const huangliRoutes = require('./routes/huangli');

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 指向原有前端项目
app.use(express.static(path.join(__dirname, '../')));

// API路由
app.use('/api', baziRoutes);
app.use('/api', huangliRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API文档
app.get('/api/docs', (req, res) => {
  res.json({
    name: '八字排盘系统 API',
    version: '1.0.0',
    endpoints: {
      'POST /api/bazi': {
        description: '获取八字排盘结果',
        parameters: {
          year: '公历年份',
          month: '公历月份',
          day: '公历日期',
          hour: '小时 (0-23)',
          minute: '分钟 (0-59)',
          second: '秒 (0-59)',
          gender: '性别 (1=男, 0=女)',
          childLimitProvider: '起运流派 (0=默认, 1=Lunar流派1, 2=Lunar流派2, 3=元亨利贞)'
        },
        example: {
          year: 1990,
          month: 1,
          day: 15,
          hour: 12,
          minute: 30,
          gender: 1,
          childLimitProvider: 0
        }
      },
      'POST /api/bazi/lunar': {
        description: '通过农历日期获取八字排盘',
        parameters: {
          lunarYear: '农历年份',
          lunarMonth: '农历月份 (负数表示闰月)',
          lunarDay: '农历日期',
          hour: '小时',
          minute: '分钟',
          gender: '性别',
          provider: '晚子时处理 (0=日柱算明天, 1=日柱算当天)'
        }
      },
      'POST /api/bazi/true-solar': {
        description: '通过真太阳时获取八字排盘',
        parameters: {
          year: '公历年份',
          month: '公历月份',
          day: '公历日期',
          hour: '小时',
          minute: '分钟',
          longitude: '经度',
          gender: '性别'
        }
      },
      'GET /api/huangli': {
        description: '获取黄历信息',
        parameters: {
          year: '公历年份',
          month: '公历月份',
          day: '公历日期'
        }
      }
    }
  });
});

// 首页 - 返回原有前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      code: 'NOT_FOUND'
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   八字排盘系统 API 服务器                                  ║
║                                                           ║
║   本地访问: http://localhost:${PORT}                         ║
║   API文档:   http://localhost:${PORT}/api/docs               ║
║   前端页面:  http://localhost:${PORT}/                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
