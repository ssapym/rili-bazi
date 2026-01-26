/**
 * 八字排盘API路由
 */

const express = require('express');
const router = express.Router();
const BaziService = require('../src/services/baziService');

const baziService = new BaziService();

router.get('/bazi', (req, res) => {
  try {
    const {
      year, month, day,
      hour, minute, second,
      gender,
      useTrueSolar,
      longitude
    } = req.query;

    if (!year || !month || !day) {
      return res.status(400).json({
        success: false,
        error: {
          message: '缺少必要的参数：year, month, day',
          code: 'MISSING_PARAMETERS'
        }
      });
    }

    const useTrueSolarBool = useTrueSolar !== 'false' && useTrueSolar !== '0';
    const defaultLongitude = 116.42;
    const longitudeValue = useTrueSolarBool ? (parseFloat(longitude) || defaultLongitude) : undefined;

    const result = baziService.calculateFromSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour) || 0,
      minute: parseInt(minute) || 0,
      second: parseInt(second) || 0,
      gender: parseInt(gender) || 1,
      useTrueSolar: useTrueSolarBool,
      longitude: longitudeValue
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

router.post('/bazi', (req, res) => {
  try {
    const {
      year, month, day,
      hour, minute, second,
      gender,
      useTrueSolar,
      longitude
    } = req.body;

    if (!year || !month || !day) {
      return res.status(400).json({
        success: false,
        error: {
          message: '缺少必要的参数：year, month, day',
          code: 'MISSING_PARAMETERS'
        }
      });
    }

    const useTrueSolarBool = useTrueSolar !== false && useTrueSolar !== 'false' && useTrueSolar !== 0 && useTrueSolar !== '0';
    const defaultLongitude = 116.42;
    const longitudeValue = useTrueSolarBool ? (parseFloat(longitude) || defaultLongitude) : undefined;

    const result = baziService.calculateFromSolar({
      year: parseInt(year),
      month: parseInt(month),
      day: parseInt(day),
      hour: parseInt(hour) || 0,
      minute: parseInt(minute) || 0,
      second: parseInt(second) || 0,
      gender: parseInt(gender) || 1,
      useTrueSolar: useTrueSolarBool,
      longitude: longitudeValue
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Bazi POST calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        code: 'SERVER_ERROR'
      }
    });
  }
});

router.get('/bazi/lunar', (req, res) => {
  try {
    const { lunarYear, lunarMonth, lunarDay, hour, minute, gender, isLeap, provider } = req.query;

    if (!lunarYear || !lunarMonth || !lunarDay) {
      return res.status(400).json({
        success: false,
        error: {
          message: '缺少必要的农历参数：lunarYear, lunarMonth, lunarDay',
          code: 'MISSING_PARAMETERS'
        }
      });
    }

    const result = baziService.calculateFromLunar({
      lunarYear: parseInt(lunarYear),
      lunarMonth: parseInt(lunarMonth),
      lunarDay: parseInt(lunarDay),
      hour: parseInt(hour) || 0,
      minute: parseInt(minute) || 0,
      gender: parseInt(gender) || 1,
      isLeap: isLeap === 'true',
      provider: parseInt(provider) || 0
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

router.post('/bazi/lunar', (req, res) => {
  try {
    const { lunarYear, lunarMonth, lunarDay, hour, minute, gender, isLeap, provider } = req.body;

    if (!lunarYear || !lunarMonth || !lunarDay) {
      return res.status(400).json({
        success: false,
        error: {
          message: '缺少必要的农历参数：lunarYear, lunarMonth, lunarDay',
          code: 'MISSING_PARAMETERS'
        }
      });
    }

    const result = baziService.calculateFromLunar({
      lunarYear: parseInt(lunarYear),
      lunarMonth: parseInt(lunarMonth),
      lunarDay: parseInt(lunarDay),
      hour: parseInt(hour) || 0,
      minute: parseInt(minute) || 0,
      gender: parseInt(gender) || 1,
      isLeap: isLeap === true || isLeap === 'true',
      provider: parseInt(provider) || 0
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

router.get('/bazi/example', (req, res) => {
  const example = {
    solar: {
      description: '公历输入（普通模式）',
      params: {
        year: 1990,
        month: 1,
        day: 15,
        hour: 12,
        minute: 30,
        gender: 1
      },
      curl: `curl -X POST http://localhost:8000/api/bazi \\
  -H "Content-Type: application/json" \\
  -d '{"year":1990,"month":1,"day":15,"hour":12,"minute":30,"gender":1}'`
    },
    trueSolar: {
      description: '公历输入（真太阳时模式）',
      params: {
        year: 1990,
        month: 1,
        day: 15,
        hour: 12,
        minute: 30,
        useTrueSolar: true,
        longitude: 116.404,
        gender: 1
      },
      curl: `curl -X POST http://localhost:8000/api/bazi \\
  -H "Content-Type: application/json" \\
  -d '{"year":1990,"month":1,"day":15,"hour":12,"useTrueSolar":true,"longitude":116.404,"gender":1}'`
    },
    lunar: {
      description: '农历输入',
      params: {
        lunarYear: 1989,
        lunarMonth: 12,
        lunarDay: 20,
        hour: 8,
        minute: 0,
        gender: 1
      },
      curl: `curl -X POST http://localhost:8000/api/bazi/lunar \\
  -H "Content-Type: application/json" \\
  -d '{"lunarYear":1989,"lunarMonth":12,"lunarDay":20,"hour":8,"gender":1}'`
    }
  };

  res.json({
    success: true,
    data: example
  });
});

module.exports = router;
