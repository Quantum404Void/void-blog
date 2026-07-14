import { Solar } from 'lunar-javascript'

export function assertValidSolarDate(year: number, month: number, day: number): void {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new Error('无效日期：年月日必须为整数')
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`无效日期：${year}-${month}-${day}`)
  }
}

export function assertValidBranchHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 11) {
    throw new Error(`无效时辰：${hour}`)
  }
}

export function solarFromBranchHour(year: number, month: number, day: number, hour: number) {
  assertValidSolarDate(year, month, day)
  assertValidBranchHour(hour)
  return Solar.fromYmdHms(year, month, day, hour * 2, 0, 0)
}
