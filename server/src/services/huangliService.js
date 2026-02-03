/**
 * 黄历服务
 */

const { SolarDay, LunarDay } = require('tyme4ts');
const { STEMS, BRANCHES } = require('./baziConstants');

class HuangliService {
  getHuangli(params) {
    const { year, month, day } = params;

    try {
      const solarDay = SolarDay.fromYmd(year, month, day);
      const lunarDay = solarDay.getLunarDay();

      const yearSc = lunarDay.getYearSixtyCycle();
      const monthSc = lunarDay.getMonthSixtyCycle();
      const daySc = lunarDay.getSixtyCycle();

      const yearStemIdx = yearSc.getHeavenStem().getIndex();
      const yearBranchIdx = yearSc.getEarthBranch().getIndex();
      const monthStemIdx = monthSc.getHeavenStem().getIndex();
      const monthBranchIdx = monthSc.getEarthBranch().getIndex();
      const dayStemIdx = daySc.getHeavenStem().getIndex();
      const dayBranchIdx = daySc.getEarthBranch().getIndex();

      const result = {
        solar: {
          date: solarDay.toString(),
          week: solarDay.getWeek().toString(),
          constellation: solarDay.getConstellation().getName()
        },
        lunar: {
          year: lunarDay.getYear(),
          month: lunarDay.getMonth(),
          day: lunarDay.getDay()
        },
        pillars: {
          year: STEMS[yearStemIdx] + BRANCHES[yearBranchIdx],
          month: STEMS[monthStemIdx] + BRANCHES[monthBranchIdx],
          day: STEMS[dayStemIdx] + BRANCHES[dayBranchIdx]
        },
        yi: [],
        ji: [],
        chongSha: ''
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: 'HUANGLI_ERROR'
        }
      };
    }
  }
}

module.exports = HuangliService;
