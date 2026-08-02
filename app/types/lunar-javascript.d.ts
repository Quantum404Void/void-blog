// lunar-javascript 未提供类型声明，这里只声明本项目实际使用的 API 表面
declare module 'lunar-javascript' {
  interface JieQi {
    getName(): string
  }

  interface Lunar {
    getYear(): number
    getMonth(): number
    getDay(): number
    getYearInGanZhiExact(): string
    getMonthInGanZhiExact(): string
    getDayInGanZhiExact(): string
    getTimeInGanZhi(): string
    getYearNaYin(): string
    getMonthNaYin(): string
    getDayNaYin(): string
    getTimeNaYin(): string
    getPrevJieQi(wholeDay?: boolean): JieQi | null
  }

  interface Solar {
    getYear(): number
    getMonth(): number
    getDay(): number
    getLunar(): Lunar
  }

  const Solar: {
    fromYmd(year: number, month: number, day: number): Solar
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar
  }

  export { Solar }
  export type { Lunar, JieQi }
}
