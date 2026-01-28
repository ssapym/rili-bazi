/**
 * 测试配置
 * 
 * 测试用例配置：年龄覆盖1-60岁，尽量八字不重复
 * Chrome路径配置：根据不同系统配置Chrome浏览器路径
 */

const TEST_CASES = [
  { year: 1997, month: 4, day: 11, hour: 10, gender: '女', age: 28, name: '青年女性' },
  { year: 1985, month: 6, day: 15, hour: 14, gender: '男', age: 40, name: '中年男性' },
  { year: 2005, month: 3, day: 20, hour: 22, gender: '男', age: 20, name: '青年男性' },
  { year: 1965, month: 8, day: 5, hour: 8, gender: '女', age: 60, name: '老年女性' },
  { year: 1978, month: 11, day: 28, hour: 16, gender: '男', age: 47, name: '中年男性' },
  { year: 1990, month: 1, day: 15, hour: 6, gender: '女', age: 35, name: '青年女性' },
  { year: 2010, month: 5, day: 3, hour: 12, gender: '男', age: 15, name: '青少年男性' },
  { year: 1982, month: 9, day: 18, hour: 20, gender: '女', age: 43, name: '中年女性' },
  { year: 1972, month: 12, day: 25, hour: 4, gender: '男', age: 53, name: '中老年男性' },
  { year: 1995, month: 7, day: 8, hour: 18, gender: '女', age: 30, name: '青年女性' },
  { year: 1997, month: 4, day: 11, hour: 10, gender: '女', age: 28, name: '八字补全测试-拱三合', buquanTest: 'gongsanhe' },
  { year: 1990, month: 1, day: 15, hour: 6, gender: '女', age: 35, name: '八字补全测试-拱隔位', buquanTest: 'gonggewei' },
  { year: 1984, month: 2, day: 15, hour: 9, gender: '男', age: 41, name: '八字补全测试-暗带', buquanTest: 'andai' }
];

const BEIJING_DONGCHENG_LONGITUDE = 116.42;

const CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  linux: '/usr/bin/google-chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
};

const CHROME_PATH = CHROME_PATHS[process.platform] || CHROME_PATHS.darwin;

const API_BASE_URL = 'http://localhost:8000';

const SPA_BASE_URL = 'http://localhost:8001';

const TEST_CONFIG = {
  timeout: 30000,
  retryCount: 3,
  delayBetweenTests: 2000,
  browser: {
    headless: false,
    viewport: { width: 1400, height: 900 }
  }
};

module.exports = {
  TEST_CASES,
  BEIJING_DONGCHENG_LONGITUDE,
  CHROME_PATH,
  API_BASE_URL,
  SPA_BASE_URL,
  TEST_CONFIG
};
