/**
 * 配置加载器
 * 
 * 加载并合并配置
 * 支持环境变量覆盖默认配置
 */

const DEFAULT_CONFIG = require('./default');

function loadConfig(env = process.env) {
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  
  if (env.BAZI_API_PORT) {
    config.server.port = parseInt(env.BAZI_API_PORT, 10);
  }
  
  if (env.BAZI_API_HOST) {
    config.server.host = env.BAZI_API_HOST;
  }
  
  if (env.BAZI_DEFAULT_LONGITUDE) {
    config.trueSolarTime.defaultLongitude = parseFloat(env.BAZI_DEFAULT_LONGITUDE);
  }
  
  return config;
}

const config = loadConfig();

module.exports = config;
