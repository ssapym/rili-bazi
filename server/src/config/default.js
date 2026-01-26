/**
 * 默认配置
 * 
 * 八字排盘系统的默认配置参数
 * 
 * 配置说明：
 * - 服务器配置：API端口、超时时间等
 * - 真太阳时配置：时区、经度等
 * - 计算配置：能量计算、权重等
 */

const DEFAULT_CONFIG = {
  server: {
    port: 8000,
    host: '0.0.0.0',
    timeout: 30000
  },
  
  trueSolarTime: {
    defaultLongitude: 120,
    defaultTimezone: 8,
    enableCache: true
  },
  
  calculation: {
    pillar: {
      yearWeight: 0.9,
      monthWeight: 1.35,
      dayWeight: 1.2,
      hourWeight: 1.0
    },
    hideStem: {
      mainQiRatio: 0.65,
      middleQiRatio: 0.35,
      residualQiRatio: 0.2
    },
    relationship: {
      combineEffect: 0.18,
      clashEffect: -0.22,
      harmEffect: -0.12,
      punishEffect: -0.1,
      breakEffect: -0.08
    },
    seasonal: {
     旺: 1.5,
     相: 1.2,
     休: 0.7,
     囚: 0.4,
     死: 0.2
    }
  },
  
  output: {
    includeLogs: false,
    maxDetailLevel: 2
  }
};

module.exports = DEFAULT_CONFIG;
