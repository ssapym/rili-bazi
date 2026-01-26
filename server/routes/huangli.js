/**
 * 黄历API路由
 */

const express = require('express');
const router = express.Router();
const HuangliService = require('../src/services/huangliService');

const huangliService = new HuangliService();

router.get('/huangli', (req, res) => {
  try {
    const { year, month, day } = req.query;

    if (!year || !month || !day) {
      return res.status(400).json({
        success: false,
        error: {
          message: '缺少必要的查询参数：year, month, day',
          code: 'MISSING_PARAMETERS'
        }
      });
    }

    const result = huangliService.getHuangli({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day)
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      }
    });
  }
});

router.get('/huangli/example', (req, res) => {
  const example = {
    description: '获取指定日期的黄历信息',
    params: {
      year: 2024,
      month: 1,
      day: 15
    },
    curl: `curl "http://localhost:8000/api/huangli?year=2024&month=1&day=15"`
  };

  res.json({
    success: true,
    data: example
  });
});

module.exports = router;
